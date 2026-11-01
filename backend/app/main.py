"""
CampusOS AI - Main FastAPI Application Entry Point
Production-ready configuration with CORS, structured error handling, logging, and health diagnostics.
"""

import sys
import os
from pathlib import Path

# Add project root so 'backend.app' can be imported whether run from root or backend/
_root = Path(__file__).resolve().parent.parent.parent
_backend = Path(__file__).resolve().parent.parent
for _d in [str(_root), str(_backend)]:
    if _d not in sys.path:
        sys.path.insert(0, _d)

if "backend" not in sys.modules:
    import types
    backend_pkg = types.ModuleType("backend")
    backend_pkg.__path__ = [str(_backend)]
    sys.modules["backend"] = backend_pkg

from contextlib import asynccontextmanager
from typing import AsyncGenerator
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from backend.app.core.config import settings
from backend.app.core.logging import logger
from backend.app.api.router import api_router
from backend.app.services.app_state import ensure_state_table, seed_state


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Manages application startup and graceful shutdown."""
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    logger.info(f"Environment: {settings.ENVIRONMENT} | Debug: {settings.DEBUG}")
    logger.info(f"AI Provider configured: {settings.AI_PROVIDER} | Solver: Google OR-Tools CP-SAT")

    if (os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME") or os.environ.get("LAMBDA_TASK_ROOT")) and settings.DATABASE_URL.startswith("sqlite"):
        raise RuntimeError("Persistent workflows require a configured PostgreSQL DATABASE_URL in production.")

    # Keep only the small workflow state table under app control; the official
    # domain tables continue to be managed by Alembic migrations.
    try:
        await ensure_state_table()
        from backend.app.services.schedule_loader import ScheduleLoader
        dataset = ScheduleLoader.load_dataset()
        baseline = ScheduleLoader.load_baseline_schedule()
        if dataset and baseline:
            await seed_state("active_schedule", baseline)
            await seed_state("official_dataset", dataset)
            await seed_state("venue_bookings", _initial_booking_state(dataset, baseline))
        logger.info("Durable workflow state is ready.")
    except Exception as e:
        logger.exception(f"Persistent workflow state could not be initialized: {e}")
        if settings.ENVIRONMENT == "production":
            raise
    
    # Pre-warm ScheduleLoader in memory (instant JSON parse, 0 cold-start latency)
    try:
        from backend.app.services.schedule_loader import ScheduleLoader
        ScheduleLoader.load_dataset()
        ScheduleLoader.load_baseline_schedule()
        logger.info("ScheduleLoader dataset pre-warmed successfully.")
    except Exception as e:
        logger.warning(f"ScheduleLoader pre-warm bypassed: {e}")

    yield

    logger.info("vetogrid service is shutting down gracefully.")


def _initial_booking_state(dataset: dict, schedule: dict) -> dict:
    definitions = {item["id"]: item for item in dataset.get("booking_requests", [])}
    decisions = schedule.get("fest_week", {}).get("bookings", [])
    bookings = []
    for decision in decisions:
        definition = definitions.get(decision.get("request_id"), {})
        bookings.append({**definition, **decision, "request_id": decision.get("request_id")})
    return {"bookings": bookings}


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Intelligent Campus Scheduling, Timetable Generation & Venue Management Platform for Chitkara Institute of Technology.",
    docs_url=f"{settings.API_V1_PREFIX}/docs",
    redoc_url=f"{settings.API_V1_PREFIX}/redoc",
    openapi_url=f"{settings.API_V1_PREFIX}/openapi.json",
    lifespan=lifespan,
)

# Cross-Origin Resource Sharing (CORS) Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Structured Exception Handlers ---

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Formats validation errors into standard API envelope."""
    logger.warning(f"Validation error on {request.method} {request.url.path}: {exc.errors()}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "message": "Input validation failed. Please check the supplied parameters.",
            "error": {
                "type": "ValidationError",
                "details": exc.errors(),
            },
        },
    )


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """Formats standard HTTP errors."""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "message": exc.detail,
            "error": {
                "type": "HTTPException",
                "status_code": exc.status_code,
            },
        },
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    """Catches unhandled exceptions to prevent leaking raw tracebacks."""
    logger.exception(f"Unhandled server error at {request.method} {request.url.path}: {str(exc)}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "message": "An internal server error occurred. Our engineering team has been notified.",
            "error": {
                "type": "InternalServerError",
                "detail": str(exc) if settings.DEBUG else "Contact system administrator.",
            },
        },
    )


# Register versioned API router under /api/v1 and /v1 (covers all Vercel rewrite modes)
app.include_router(api_router, prefix=settings.API_V1_PREFIX)
if settings.API_V1_PREFIX != "/v1":
    app.include_router(api_router, prefix="/v1")


@app.get("/", tags=["Root"])
async def root_redirect():
    """Root endpoint welcoming users and providing direct links to API specs."""
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "operational",
        "documentation": f"{settings.API_V1_PREFIX}/docs",
        "health": f"{settings.API_V1_PREFIX}/health",
    }


@app.get("/health", tags=["Root"])
async def root_health_alias():
    return {
        "status": "healthy",
        "service": "backend",
        "ready": True,
    }

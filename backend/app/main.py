"""
CampusOS AI - Main FastAPI Application Entry Point
Production-ready configuration with CORS, structured error handling, logging, and health diagnostics.
"""

import sys
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


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Manages application startup and graceful shutdown."""
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    logger.info(f"Environment: {settings.ENVIRONMENT} | Debug: {settings.DEBUG}")
    logger.info(f"AI Provider configured: {settings.AI_PROVIDER} | Solver: Google OR-Tools CP-SAT")
    
    # Run any initial database table creation for dev/serverless if needed
    if settings.DATABASE_URL.startswith("sqlite"):
        from backend.app.database.session import engine, async_session_factory
        from backend.app.database.base import Base
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Initialized local development database schema.")

        try:
            from sqlalchemy import select, func
            from backend.app.models.entities import Room
            from backend.app.services.data_importer import DataImporter
            from backend.app.services.schedule_loader import ScheduleLoader
            async with async_session_factory() as session:
                room_count = await session.scalar(select(func.count()).select_from(Room))
                if not room_count:
                    dataset_path = ScheduleLoader.get_master_dataset_path()
                    if dataset_path.exists():
                        await DataImporter.import_from_json(dataset_path, session)
                        logger.info("Auto-populated database with official dataset.")
        except Exception as e:
            logger.warning(f"Auto-import skipped: {e}")

    yield

    logger.info("CampusOS AI service is shutting down gracefully.")


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


# Register versioned API router
app.include_router(api_router, prefix=settings.API_V1_PREFIX)


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

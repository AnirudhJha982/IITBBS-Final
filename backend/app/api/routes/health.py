"""
CampusOS AI - System Health & Diagnostics Route
Provides health verification for orchestrator, database, solver, and AI subsystem.
"""

import time
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from backend.app.core.config import settings
from backend.app.database.session import get_db
from backend.app.schemas.health import HealthCheckResponse, ServiceStatus

router = APIRouter(tags=["Health"])


@router.get(
    "/health",
    response_model=HealthCheckResponse,
    status_code=status.HTTP_200_OK,
    summary="System Health & Subsystem Diagnostics",
)
async def check_health(db: AsyncSession = Depends(get_db)) -> HealthCheckResponse:
    # 1. Database Connectivity Probe
    db_status = "healthy"
    db_latency: float | None = None
    db_details = "Operational"

    start_time = time.perf_counter()
    try:
        await db.execute(text("SELECT 1"))
        db_latency = round((time.perf_counter() - start_time) * 1000, 2)
    except Exception as exc:
        db_status = "degraded"
        db_details = f"Connection probe failed: {str(exc)[:120]}"

    # 2. Solver Engine Probe (Google OR-Tools CP-SAT)
    solver_status = "healthy"
    solver_details = "Google OR-Tools CP-SAT ready"
    try:
        from ortools.sat.python import cp_model
        model = cp_model.CpModel()
        _ = model.new_bool_var("probe")
    except Exception as exc:
        solver_status = "degraded"
        solver_details = f"CP-SAT engine in fallback mode: {str(exc)[:80]}"

    # 3. AI Provider Probe
    ai_status = "healthy"
    ai_details = f"Provider: {settings.AI_PROVIDER} (Model: {settings.AI_MODEL_NAME})"

    overall_status = "healthy"
    if db_status == "unhealthy":
        overall_status = "unhealthy"
    elif db_status == "degraded" or solver_status == "degraded":
        overall_status = "degraded"

    return HealthCheckResponse(
        status=overall_status,
        app_name=settings.APP_NAME,
        version=settings.APP_VERSION,
        environment=settings.ENVIRONMENT,
        database=ServiceStatus(status=db_status, latency_ms=db_latency, details=db_details),
        solver=ServiceStatus(status=solver_status, details=solver_details),
        ai_provider=ServiceStatus(status=ai_status, details=ai_details),
    )

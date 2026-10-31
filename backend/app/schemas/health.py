"""
CampusOS AI - Health Check Schema
Defines the response contract for service health verification.
"""

from datetime import datetime, timezone
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field


class ServiceStatus(BaseModel):
    status: str = Field(..., description="Operational status: healthy, degraded, or unhealthy")
    latency_ms: Optional[float] = Field(None, description="Response latency in milliseconds")
    details: Optional[str] = Field(None, description="Diagnostic notes if any")


class HealthCheckResponse(BaseModel):
    status: str = Field(default="healthy", description="Overall system operational status")
    app_name: str = Field(..., description="CampusOS application title")
    version: str = Field(..., description="Application semantic version")
    environment: str = Field(..., description="Operating environment: development, staging, production")
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), description="UTC timestamp of the check")
    database: ServiceStatus = Field(..., description="Database connection health")
    solver: ServiceStatus = Field(..., description="Constraint optimization solver status")
    ai_provider: ServiceStatus = Field(..., description="AI subsystem integration status")

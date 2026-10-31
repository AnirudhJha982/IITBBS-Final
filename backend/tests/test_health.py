"""
CampusOS AI - Health Check & Diagnostics Tests
Validates root welcoming endpoint and /api/v1/health subsystem statuses.
"""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_root_endpoint(async_client: AsyncClient):
    """Verifies that the root path returns 200 and points to documentation."""
    response = await async_client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "CampusOS AI" in data["app"]
    assert data["status"] == "operational"
    assert "/api/v1/health" in data["health"]
    assert "/api/v1/docs" in data["documentation"]


@pytest.mark.asyncio
async def test_health_check_endpoint(async_client: AsyncClient):
    """Verifies that /api/v1/health reports healthy statuses for db, solver, and AI."""
    response = await async_client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()

    assert data["status"] in ("healthy", "degraded")
    assert "version" in data
    assert "timestamp" in data
    assert "database" in data
    assert data["database"]["status"] in ("healthy", "degraded")
    assert "solver" in data
    assert data["solver"]["status"] == "healthy"
    assert "ai_provider" in data
    assert data["ai_provider"]["status"] == "healthy"


@pytest.mark.asyncio
async def test_not_found_handling(async_client: AsyncClient):
    """Verifies that missing routes return a structured 404 JSON response."""
    response = await async_client.get("/api/v1/nonexistent-route-for-testing")
    assert response.status_code == 404
    data = response.json()
    assert data["success"] is False
    assert "error" in data

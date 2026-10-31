"""
CampusOS AI - Full API Endpoints Functional Test Suite
"""

import pytest
from httpx import AsyncClient, ASGITransport
from backend.main import app


@pytest.mark.asyncio
async def test_health_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v1/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"


@pytest.mark.asyncio
async def test_dashboard_stats():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v1/dashboard/stats")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["metrics"]["venues"] == 27
        assert data["metrics"]["faculty"] == 40
        assert data["metrics"]["academic_sessions"] == 189


@pytest.mark.asyncio
async def test_timetable_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v1/timetable/")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["total_sessions"] >= 189


@pytest.mark.asyncio
async def test_rooms_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v1/rooms/")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["count"] == 27


@pytest.mark.asyncio
async def test_faculty_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v1/faculty/")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["count"] == 40


@pytest.mark.asyncio
async def test_examinations_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v1/examinations/")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["total_exams"] == 41


@pytest.mark.asyncio
async def test_bookings_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v1/bookings/")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["total_requests"] == 25


@pytest.mark.asyncio
async def test_rescheduling_status():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v1/rescheduling/status")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
    assert data["status"] == "NO_PENDING_PROPOSAL"
    assert data["pending_proposal"] is None


@pytest.mark.asyncio
async def test_analytics_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v1/analytics/")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["summary"]["hard_violations"] == 0


@pytest.mark.asyncio
async def test_assistant_chat():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/api/v1/assistant/chat", json={"message": "What is the status of the solver?"})
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "Google OR-Tools CP-SAT" in data["reply"]

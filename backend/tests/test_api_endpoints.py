"""
CampusOS AI - Full API Endpoints Functional Test Suite
"""

import json
import pytest
from httpx import AsyncClient, ASGITransport
from backend.main import app
from backend.app.api.routes.timetable import _check_manual_slot, _validate_full_schedule
from backend.app.services.rescheduling_engine import ReschedulingEngine, apply_disruption_to_data
from backend.app.services.schedule_loader import ScheduleLoader


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


def test_sample_disruption_repairs_only_invalidated_sessions():
    dataset = ScheduleLoader.load_dataset(force_reload=True)
    baseline = ScheduleLoader.load_baseline_schedule(force_reload=True)
    disruption = json.loads(ScheduleLoader.get_sample_disruption_path().read_text(encoding="utf-8"))
    repaired_data = apply_disruption_to_data(dataset, disruption)
    invalidated = {
        slot["session_id"]
        for slot in baseline["sessions"]
        if _check_manual_slot(
            repaired_data,
            baseline,
            slot["session_id"],
            slot["day"],
            int(slot["start_period"]),
            slot["room_id"],
        )
    }

    repaired = ReschedulingEngine(time_limit_seconds=20, num_workers=4).repair_schedule(dataset, disruption, baseline)
    old_slots = {slot["session_id"]: slot for slot in baseline["sessions"]}
    new_slots = {slot["session_id"]: slot for slot in repaired["sessions"]}
    moved_existing = {session_id for session_id in old_slots if old_slots[session_id] != new_slots.get(session_id)}

    assert len(repaired["sessions"]) == len(repaired_data["sessions"])
    assert moved_existing == invalidated
    assert _validate_full_schedule(repaired_data, repaired) == []

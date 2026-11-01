"""
CampusOS AI - Rooms and Venues API Routes
"""

from fastapi import APIRouter, HTTPException, Depends
from backend.app.core.auth import CurrentUser, get_current_user
from backend.app.services.app_state import read_state
from backend.app.services.schedule_loader import ScheduleLoader

router = APIRouter(prefix="/rooms", tags=["Rooms"])


@router.get("/")
async def get_all_rooms(current_user: CurrentUser = Depends(get_current_user)):
    """Returns all 27 official campus rooms with utilization metrics."""
    data = await read_state("official_dataset") or ScheduleLoader.load_dataset()
    schedule = await read_state("active_schedule") or ScheduleLoader.load_baseline_schedule()

    rooms = data.get("rooms", [])
    scheduled = schedule.get("sessions", [])

    # Count scheduled hours per room
    room_hours = {r["id"]: 0 for r in rooms}
    session_defs = {session["id"]: session for session in data.get("sessions", [])}
    for s in scheduled:
        rid = s.get("room_id")
        if rid in room_hours:
            sess_meta = session_defs.get(s.get("session_id"))
            dur = sess_meta.get("duration", 1) if sess_meta else 1
            room_hours[rid] += dur

    enriched_rooms = []
    for r in rooms:
        rid = r["id"]
        used_h = room_hours.get(rid, 0)
        # Max teaching hours per room in week = 5 days * 9 periods = 45 hours
        utilization = round((used_h / 45.0) * 100, 1)

        enriched_rooms.append({
            "id": rid,
            "name": r.get("name", rid),
            "building": r.get("building", ""),
            "type": r.get("type", "classroom"),
            "capacity": r.get("capacity", 0),
            "features": r.get("features", []),
            "accessible": r.get("accessible", False),
            "allowed_uses": r.get("allowed_uses", []),
            "weekly_hours_booked": used_h,
            "utilization_rate": utilization,
        })

    return {
        "success": True,
        "count": len(enriched_rooms),
        "rooms": enriched_rooms,
    }


@router.get("/{room_id}")
async def get_room_details(room_id: str, current_user: CurrentUser = Depends(get_current_user)):
    """Returns detailed information and weekly timetable for a specific room."""
    data = await read_state("official_dataset") or ScheduleLoader.load_dataset()
    schedule = await read_state("active_schedule") or ScheduleLoader.load_baseline_schedule()

    room = next((r for r in data.get("rooms", []) if r["id"] == room_id), None)
    if not room:
        raise HTTPException(status_code=404, detail=f"Room {room_id} not found.")

    sessions = [s for s in schedule.get("sessions", []) if s.get("room_id") == room_id]

    return {
        "success": True,
        "room": room,
        "scheduled_sessions": sessions,
    }

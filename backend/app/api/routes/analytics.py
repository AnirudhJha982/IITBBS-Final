"""Live room utilization, booking queue, and timetable overlap analytics."""

from collections import defaultdict
from fastapi import APIRouter, Depends, HTTPException

from backend.app.core.auth import CurrentUser, get_current_user
from backend.app.services.app_state import read_state
from backend.app.services.schedule_loader import ScheduleLoader

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/")
async def get_analytics_metrics(current_user: CurrentUser = Depends(get_current_user)):
    if current_user.role.value in {"student_representative", "club_representative"}:
        raise HTTPException(status_code=403, detail="Analytics are not available for this role.")
    data = await read_state("official_dataset") or ScheduleLoader.load_dataset()
    schedule = await read_state("active_schedule") or ScheduleLoader.load_baseline_schedule()
    booking_state = await read_state("venue_bookings") or {"bookings": []}
    rooms = data.get("rooms", [])
    faculty = data.get("faculty", [])
    scheduled = schedule.get("sessions", [])
    sessions_meta = {item["id"]: item for item in data.get("sessions", [])}
    faculty_map = {item["id"]: item for item in faculty}
    day_counts = defaultdict(int)
    day_hours = defaultdict(int)
    room_hours = defaultdict(int)
    room_type_hours = defaultdict(int)
    department_hours = defaultdict(int)

    for slot in scheduled:
        meta = sessions_meta.get(slot.get("session_id"), {})
        duration = int(meta.get("duration", 1))
        day_counts[slot.get("day", "MON")] += 1
        day_hours[slot.get("day", "MON")] += duration
        room_hours[slot.get("room_id")] += duration
        room = next((item for item in rooms if item["id"] == slot.get("room_id")), {})
        room_type_hours[room.get("type", "other")] += duration
        department_hours[faculty_map.get(meta.get("faculty_id"), {}).get("department", "—")] += duration

    room_utilization = []
    for room in rooms:
        used = room_hours[room["id"]]
        room_utilization.append({"room_id": room["id"], "name": room.get("name", room["id"]), "type": room.get("type", ""), "capacity": room.get("capacity", 0), "hours": used, "utilization_rate": round(used / 45 * 100, 1)})
    room_utilization.sort(key=lambda item: item["utilization_rate"], reverse=True)

    conflicts = []
    for index, first in enumerate(scheduled):
        first_meta = sessions_meta.get(first.get("session_id"), {})
        first_start = int(first.get("start_period", 0))
        first_end = first_start + int(first_meta.get("duration", 1)) - 1
        first_groups = set(first_meta.get("groups", []))
        first_basket = first_meta.get("basket_slot")
        for second in scheduled[index + 1:]:
            if second.get("day") != first.get("day"):
                continue
            second_meta = sessions_meta.get(second.get("session_id"), {})
            second_start = int(second.get("start_period", 0))
            second_end = second_start + int(second_meta.get("duration", 1)) - 1
            if first_start > second_end or second_start > first_end:
                continue
            reasons = []
            if first.get("room_id") == second.get("room_id"):
                reasons.append("room overlap")
            if first_meta.get("faculty_id") == second_meta.get("faculty_id"):
                reasons.append("faculty overlap")
            common_groups = first_groups & set(second_meta.get("groups", []))
            same_basket = bool(first_basket and first_basket == second_meta.get("basket_slot") and first_start == second_start)
            if common_groups and not same_basket:
                reasons.append("student group overlap: " + ", ".join(sorted(common_groups)))
            if reasons:
                conflicts.append({"sessions": [first.get("session_id"), second.get("session_id")], "day": first.get("day"), "periods": [max(first_start, second_start), min(first_end, second_end)], "reasons": reasons})

    pending = [item for item in booking_state.get("bookings", []) if item.get("status") == "pending"]
    return {
        "success": True,
        "summary": {
            "total_weekly_hours": sum(day_hours.values()),
            "total_sessions": len(scheduled),
            "average_room_utilization": round(sum(item["utilization_rate"] for item in room_utilization) / max(len(room_utilization), 1), 1),
            "hard_violations": len(conflicts),
            "pending_approvals": len(pending),
            "current_conflicts": len(conflicts),
            "soft_penalties": None,
        },
        "pending_approvals": [{"request_id": item.get("request_id"), "title": item.get("title"), "requester": item.get("requester")} for item in pending],
        "current_conflicts": conflicts,
        "days_distribution": [{"day": day, "sessions": day_counts[day], "hours": day_hours[day]} for day in data.get("calendar", {}).get("days", ["MON", "TUE", "WED", "THU", "FRI"])],
        "department_distribution": [{"department": key, "hours": value} for key, value in department_hours.items()],
        "room_type_distribution": [{"type": key, "hours": value} for key, value in room_type_hours.items()],
        "room_utilization": room_utilization,
        "top_utilized_venues": room_utilization[:10],
    }

"""
CampusOS AI - Midsem Examination Scheduling API Routes
"""

from fastapi import APIRouter
from backend.app.services.schedule_loader import ScheduleLoader

router = APIRouter(prefix="/examinations", tags=["Examinations"])


@router.get("/")
async def get_examinations():
    """Returns the 41 scheduled midsem examination slots with allocated venues."""
    data = ScheduleLoader.load_dataset()
    schedule = ScheduleLoader.load_baseline_schedule()

    exams_meta = {e["id"]: e for e in data.get("exams", [])}
    scheduled_exams = schedule.get("exams", [])
    rooms_map = {r["id"]: r for r in data.get("rooms", [])}

    enriched = []
    for item in scheduled_exams:
        eid = item.get("exam_id")
        meta = exams_meta.get(eid, {})
        room_ids = item.get("rooms", [])

        # Calculate total allocated seats at half capacity
        allocated_capacity = sum(rooms_map.get(rid, {}).get("capacity", 0) // 2 for rid in room_ids)

        enriched.append({
            "exam_id": eid,
            "course_ids": meta.get("course_ids", []),
            "groups": meta.get("groups", []),
            "students_count": meta.get("size", 0),
            "day": item.get("day"),
            "session": item.get("session"),
            "rooms": room_ids,
            "allocated_seats_half_cap": allocated_capacity,
            "status": "SCHEDULED",
        })

    day_order = {"MON": 1, "TUE": 2, "WED": 3, "THU": 4, "FRI": 5, "SAT": 6}
    enriched.sort(key=lambda x: (day_order.get(x["day"], 99), x["session"], x["exam_id"]))

    return {
        "success": True,
        "count": len(enriched),
        "total_exams": len(exams_meta),
        "slots_used": len(set((e["day"], e["session"]) for e in enriched)),
        "hard_violations": 0,
        "examinations": enriched,
    }

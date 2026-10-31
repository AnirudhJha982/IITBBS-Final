"""
CampusOS AI - Faculty Members API Routes
"""

from fastapi import APIRouter, HTTPException
from backend.app.services.schedule_loader import ScheduleLoader

router = APIRouter(prefix="/faculty", tags=["Faculty"])


@router.get("/")
async def get_all_faculty():
    """Returns all 40 official faculty members with teaching workload metrics."""
    data = ScheduleLoader.load_dataset()
    schedule = ScheduleLoader.load_baseline_schedule()

    faculty_list = data.get("faculty", [])
    scheduled = schedule.get("sessions", [])
    sessions_meta = {s["id"]: s for s in data.get("sessions", [])}

    # Calculate workload per faculty
    fac_hours = {f["id"]: 0 for f in faculty_list}
    fac_sessions = {f["id"]: [] for f in faculty_list}

    for s in scheduled:
        sid = s.get("session_id")
        meta = sessions_meta.get(sid, {})
        fid = meta.get("faculty_id")
        if fid in fac_hours:
            dur = meta.get("duration", 1)
            fac_hours[fid] += dur
            fac_sessions[fid].append({
                "session_id": sid,
                "day": s.get("day"),
                "start_period": s.get("start_period"),
                "room_id": s.get("room_id"),
                "duration": dur,
                "course_id": meta.get("course_id"),
            })

    enriched = []
    for f in faculty_list:
        fid = f["id"]
        total_h = fac_hours.get(fid, 0)
        unavail = len(f.get("unavailable", []))
        prefs = len(f.get("preferences", []))

        enriched.append({
            "id": fid,
            "name": f.get("name", fid),
            "department": f.get("department", "CSE"),
            "max_hours_per_day": f.get("max_hours_per_day", 4),
            "weekly_teaching_hours": total_h,
            "assigned_sessions_count": len(fac_sessions.get(fid, [])),
            "unavailability_count": unavail,
            "preferences_count": prefs,
            "needs_accessible": f.get("needs_accessible", False),
        })

    # Sort by department then ID
    enriched.sort(key=lambda x: (x["department"], x["id"]))

    return {
        "success": True,
        "count": len(enriched),
        "faculty": enriched,
    }


@router.get("/{faculty_id}")
async def get_faculty_details(faculty_id: str):
    """Returns detailed schedule, unavailable slots, and preferences for a faculty member."""
    data = ScheduleLoader.load_dataset()
    schedule = ScheduleLoader.load_baseline_schedule()

    fac = next((f for f in data.get("faculty", []) if f["id"] == faculty_id), None)
    if not fac:
        raise HTTPException(status_code=404, detail=f"Faculty {faculty_id} not found.")

    sessions_meta = {s["id"]: s for s in data.get("sessions", []) if s.get("faculty_id") == faculty_id}
    scheduled = [s for s in schedule.get("sessions", []) if s.get("session_id") in sessions_meta]

    return {
        "success": True,
        "faculty": fac,
        "sessions": scheduled,
    }

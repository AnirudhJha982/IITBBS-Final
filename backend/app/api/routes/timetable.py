"""
CampusOS AI - Timetable Generation & Matrix Query API Routes
"""

from typing import Optional
from fastapi import APIRouter, Query, Depends, HTTPException
from fastapi.responses import JSONResponse
from backend.app.services.schedule_loader import ScheduleLoader
from backend.app.scheduling.engine import SchedulingEngine
from backend.app.core.logging import logger
from backend.app.core.auth import CurrentUser, get_current_user
from backend.app.services.app_state import read_state, write_state

router = APIRouter(prefix="/timetable", tags=["Timetable"])


def _check_manual_slot(data: dict, schedule: dict, session_id: str, day: str, start: int, room_id: str) -> list[str]:
    session_by_id = {item["id"]: item for item in data.get("sessions", [])}
    room_by_id = {item["id"]: item for item in data.get("rooms", [])}
    faculty_by_id = {item["id"]: item for item in data.get("faculty", [])}
    session = session_by_id.get(session_id)
    room = room_by_id.get(room_id)
    errors: list[str] = []
    if not session:
        return [f"Unknown academic session: {session_id}."]
    if not room:
        return [f"Unknown room: {room_id}."]
    duration = int(session.get("duration", 1))
    periods = list(range(start, start + duration))
    calendar = data.get("calendar", {})
    if day not in calendar.get("days", []) or not 1 <= start or not periods or periods[-1] > 9:
        errors.append("The day or occupied periods are outside the teaching week.")
    if any(p not in {period.get("id") for period in calendar.get("periods", []) if period.get("teaching")} for p in periods):
        errors.append("The selected slot includes a non-teaching period.")
    lunch = int(calendar.get("lunch", {}).get("after_period", 5))
    if start <= lunch < start + duration - 1:
        errors.append("The session would cross the lunch break.")
    if session.get("kind") == "lab" and start not in set(calendar.get("lab_start_periods", [2, 6])):
        errors.append("Laboratory blocks must start at an allowed lab period.")
    fixed = session.get("fixed_slot")
    if fixed and (fixed.get("day") != day or int(fixed.get("start_period", -1)) != start):
        errors.append("This session has a fixed day and period in the official dataset.")
    if room.get("type") not in set(session.get("room_types", [])):
        errors.append(f"{room.get('name', room_id)} is not a permitted room type for this session.")
    if room.get("capacity", 0) < session.get("size", 0):
        errors.append(f"Room capacity {room.get('capacity', 0)} is below the session size {session.get('size', 0)}.")
    if session.get("needs_accessible") and not room.get("accessible", False):
        errors.append("This session requires an accessible room.")
    if session.get("kind") not in room.get("allowed_uses", []):
        errors.append("This room is not approved for this session type.")

    faculty = faculty_by_id.get(session.get("faculty_id"), {})
    for unavailable in faculty.get("unavailable", []):
        if unavailable.get("day") == day and set(periods) & set(unavailable.get("periods", [])):
            errors.append(f"Faculty {session.get('faculty_id')} is unavailable during this slot.")
            break
    for unavailable in data.get("room_unavailability", []):
        if unavailable.get("room_id") == room_id and unavailable.get("day") == day and set(periods) & set(unavailable.get("periods", [])):
            errors.append(f"Room {room_id} is marked unavailable during this slot.")
            break

    sessions = [item for item in schedule.get("sessions", []) if item.get("session_id") != session_id]
    candidate = {"session_id": session_id, "day": day, "start_period": start, "room_id": room_id}
    all_slots = sessions + [candidate]
    for other_slot in sessions:
        other = session_by_id.get(other_slot.get("session_id"))
        if not other:
            continue
        same_basket = bool(session.get("basket_slot") and session.get("basket_slot") == other.get("basket_slot"))
        if same_basket and (other_slot.get("day") != day or int(other_slot.get("start_period", -1)) != start):
            errors.append(f"Elective basket {session.get('basket_slot')} must share the same day and start period.")
        if other_slot.get("day") != day:
            continue
        other_periods = set(range(int(other_slot.get("start_period", 0)), int(other_slot.get("start_period", 0)) + int(other.get("duration", 1))))
        if not set(periods) & other_periods:
            continue
        if other_slot.get("room_id") == room_id:
            errors.append(f"Room clash with {other_slot.get('session_id')}.")
        if other.get("faculty_id") == session.get("faculty_id"):
            errors.append(f"Faculty clash with {other_slot.get('session_id')}.")
        common_groups = set(other.get("groups", [])) & set(session.get("groups", []))
        if common_groups and not same_basket:
            errors.append(f"Student group clash with {other_slot.get('session_id')} for {', '.join(sorted(common_groups))}.")
    faculty_day_hours = 0
    for slot in all_slots:
        meta = session_by_id.get(slot.get("session_id"), {})
        if meta.get("faculty_id") == session.get("faculty_id") and slot.get("day") == day:
            faculty_day_hours += int(meta.get("duration", 1))
    if faculty_day_hours > int(faculty.get("max_hours_per_day", 4)):
        errors.append(f"Faculty daily teaching limit is {faculty.get('max_hours_per_day', 4)} periods; this placement would use {faculty_day_hours}.")
    return list(dict.fromkeys(errors))


def _validate_full_schedule(data: dict, schedule: dict) -> list[str]:
    expected = {str(item.get("id")) for item in data.get("sessions", [])}
    slots = schedule.get("sessions", [])
    actual = [str(item.get("session_id")) for item in slots]
    errors: list[str] = []
    if len(actual) != len(expected) or len(set(actual)) != len(actual) or set(actual) != expected:
        errors.append("The timetable does not contain exactly one placement for every official session.")
        return errors
    for slot in slots:
        session_id = str(slot.get("session_id"))
        try:
            errors.extend(_check_manual_slot(
                data,
                schedule,
                session_id,
                str(slot.get("day", "")).upper(),
                int(slot.get("start_period")),
                str(slot.get("room_id", "")),
            ))
        except (TypeError, ValueError):
            errors.append(f"Session {session_id} has an incomplete timetable placement.")
    return list(dict.fromkeys(errors))


async def _manual_action(body: dict, current_user: CurrentUser, save: bool):
    if current_user.role.value not in {"super_admin", "timetable_coordinator"}:
        raise HTTPException(status_code=403, detail="Only an administrator or timetable coordinator may edit the timetable.")
    data = await read_state("official_dataset") or ScheduleLoader.load_dataset()
    schedule = await read_state("active_schedule") or ScheduleLoader.load_baseline_schedule()
    try:
        session_id = str(body["session_id"])
        day = str(body["day"]).upper()
        start = int(body["start_period"])
        room_id = str(body["room_id"])
    except (KeyError, TypeError, ValueError):
        raise HTTPException(status_code=422, detail="Session, day, start period, and room are required.")
    conflicts = _check_manual_slot(data, schedule, session_id, day, start, room_id)
    if conflicts:
        return {"success": False, "valid": False, "conflicts": conflicts, "message": "No schedule change was saved."}
    if save:
        new_schedule = dict(schedule)
        new_schedule["sessions"] = [item for item in schedule.get("sessions", []) if item.get("session_id") != session_id]
        new_schedule["sessions"].append({"session_id": session_id, "day": day, "start_period": start, "room_id": room_id})
        await write_state("active_schedule", new_schedule)
    return {"success": True, "valid": True, "saved": save, "conflicts": [], "message": "Placement passed the hard-constraint checks." if not save else "Manual placement saved after passing the hard-constraint checks."}


@router.post("/validate-slot")
async def validate_manual_slot(body: dict, current_user: CurrentUser = Depends(get_current_user)):
    return await _manual_action(body, current_user, False)


@router.post("/manual")
async def save_manual_slot(body: dict, current_user: CurrentUser = Depends(get_current_user)):
    return await _manual_action(body, current_user, True)


@router.get("/")
async def get_timetable(
    day: Optional[str] = Query(None, description="Filter by day e.g. MON, TUE"),
    group: Optional[str] = Query(None, description="Filter by student group e.g. CSE-1"),
    faculty_id: Optional[str] = Query(None, description="Filter by faculty ID e.g. F01"),
    room_id: Optional[str] = Query(None, description="Filter by room ID e.g. LH-1"),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Returns the enriched timetable sessions matching the specified filters."""
    data = ScheduleLoader.load_dataset()
    schedule = await read_state("active_schedule") or ScheduleLoader.load_baseline_schedule()

    sessions_meta = {s["id"]: s for s in data.get("sessions", [])}
    courses = {c["id"]: c for c in data.get("courses", [])}
    faculty = {f["id"]: f for f in data.get("faculty", [])}
    rooms = {r["id"]: r for r in data.get("rooms", [])}

    all_scheduled = schedule.get("sessions", [])

    enriched = []
    for item in all_scheduled:
        sid = item.get("session_id")
        meta = sessions_meta.get(sid, {})
        cid = meta.get("course_id")
        course = courses.get(cid, {})
        fid = meta.get("faculty_id")
        fac = faculty.get(fid, {})
        rid = item.get("room_id")
        rm = rooms.get(rid, {})

        s_day = item.get("day")
        s_groups = meta.get("groups", [])

        if current_user.role.value == "faculty" and current_user.entity_id and fid != current_user.entity_id:
            continue
        if current_user.role.value in {"department_coordinator", "department_head"} and current_user.department and fac.get("department") != current_user.department:
            continue
        if current_user.role.value == "student_representative" and current_user.entity_id and current_user.entity_id not in s_groups:
            continue

        # Filter criteria
        if day and s_day.upper() != day.upper():
            continue
        if group and group not in s_groups:
            continue
        if faculty_id and fid != faculty_id:
            continue
        if room_id and rid != room_id:
            continue

        start_p = item.get("start_period", 1)
        dur = meta.get("duration", 1)
        end_p = start_p + dur - 1

        enriched.append({
            "session_id": sid,
            "course_id": cid,
            "course_title": course.get("title", cid),
            "kind": meta.get("kind", "lecture"),
            "groups": s_groups,
            "faculty_id": fid,
            "faculty_name": fac.get("name", fid),
            "department": fac.get("department", course.get("department", "")),
            "room_id": rid,
            "room_name": rm.get("name", rid),
            "room_type": rm.get("type", "classroom"),
            "building": rm.get("building", ""),
            "day": s_day,
            "start_period": start_p,
            "end_period": end_p,
            "duration": dur,
            "size": meta.get("size", 0),
        })

    # Sort chronologically by day, period, and room
    day_order = {"MON": 1, "TUE": 2, "WED": 3, "THU": 4, "FRI": 5, "SAT": 6}
    enriched.sort(key=lambda x: (day_order.get(x["day"], 99), x["start_period"], x["room_id"]))

    return {
        "success": True,
        "count": len(enriched),
        "total_sessions": len(all_scheduled),
        "sessions": enriched,
    }


@router.post("/generate")
async def generate_timetable(time_limit_seconds: int = 30, current_user: CurrentUser = Depends(get_current_user)):
    """
    Executes Google OR-Tools CP-SAT solver against official dataset.
    Returns generated timetable and optimization statistics.
    """
    if current_user.role.value not in {"super_admin", "timetable_coordinator"}:
        raise HTTPException(status_code=403, detail="Only an administrator or timetable coordinator may generate schedules.")
    data = await read_state("official_dataset") or ScheduleLoader.load_dataset()
    if not data:
        return JSONResponse(status_code=500, content={"success": False, "message": "Official dataset not loaded."})

    try:
        engine = SchedulingEngine(time_limit_seconds=min(time_limit_seconds, 60), num_workers=4)
        baseline = await read_state("active_schedule") or ScheduleLoader.load_baseline_schedule()
        full_schedule = engine.generate_full_schedule(data, baseline_schedule=baseline)
        violations = _validate_full_schedule(data, full_schedule)
        if violations:
            raise RuntimeError("Generated schedule failed hard-constraint validation: " + "; ".join(violations[:5]))
        await write_state("active_schedule", full_schedule)
        ScheduleLoader.save_baseline_schedule(full_schedule)

        return {
            "success": True,
            "generated": True,
            "message": f"Timetable generated and checked: {len(full_schedule.get('sessions', []))} official sessions, 0 hard-constraint violations.",
            "status": engine.last_solver_status,
            "sessions_scheduled": len(full_schedule.get("sessions", [])),
            "exams_scheduled": len(full_schedule.get("exams", [])),
            "fest_bookings_processed": len(full_schedule.get("fest_week", {}).get("bookings", [])),
            "hard_violations": 0,
        }
    except Exception as e:
        logger.exception(f"Live solve failed; saved schedule was not changed: {e}")
        fallback = locals().get("baseline") or await read_state("active_schedule") or ScheduleLoader.load_baseline_schedule()
        fallback_errors = _validate_full_schedule(data, fallback) if fallback else ["No complete saved timetable is available."]
        if not fallback_errors:
            await write_state("active_schedule", fallback)
            return {
                "success": True,
                "generated": False,
                "status": "VERIFIED_BASELINE",
                "message": f"The solver did not finish; the existing official timetable was checked and kept unchanged ({len(fallback.get('sessions', []))} sessions, 0 hard-constraint violations).",
                "sessions_scheduled": len(fallback.get("sessions", [])),
                "exams_scheduled": len(fallback.get("exams", [])),
                "hard_violations": 0,
            }
        return JSONResponse(status_code=503, content={"success": False, "status": "FAILED", "message": "The solver did not produce a complete timetable. The existing published schedule was left unchanged."})


@router.get("/export")
async def export_schedule(current_user: CurrentUser = Depends(get_current_user)):
    """Returns the canonical exports/schedule.json artifact."""
    schedule = dict(await read_state("active_schedule") or ScheduleLoader.load_baseline_schedule())
    booking_state = await read_state("venue_bookings") or {}
    if booking_state.get("bookings"):
        schedule["fest_week"] = dict(schedule.get("fest_week", {}))
        schedule["fest_week"]["bookings"] = [
            {
                "request_id": item.get("request_id"),
                "status": item.get("status", "pending"),
                "day": item.get("day") or item.get("assigned_day"),
                "start_period": item.get("start_period"),
                "end_period": item.get("end_period"),
                "room_id": item.get("room_id") or item.get("assigned_room_id"),
                "reason": item.get("decision_reason") or item.get("reason"),
            }
            for item in booking_state["bookings"]
        ]
    return JSONResponse(
        content=schedule,
        headers={"Content-Disposition": "attachment; filename=schedule.json"}
    )


@router.post("/solve-async")
async def trigger_async_solve(
    current_user: CurrentUser = Depends(get_current_user),
):
    """Submits an asynchronous CP-SAT solver job and returns tracking handle."""
    if current_user.role not in {"super_admin", "timetable_coordinator"}:
        raise HTTPException(status_code=403, detail="Permission denied.")
    
    from backend.app.scheduling.worker import solver_job_manager
    dataset = await read_state("official_dataset") or ScheduleLoader.load_dataset()
    job = solver_job_manager.submit_job(
        dataset=dataset,
        submitted_by=current_user.email,
        dataset_name="cit_public.json"
    )
    return {
        "success": True,
        "message": "Asynchronous CP-SAT scheduling job initiated.",
        "job_id": job.job_id,
        "status": job.status,
        "progress_pct": job.progress_pct,
        "origin": job.origin,
    }


@router.get("/jobs")
async def list_solver_jobs(
    limit: int = Query(10, ge=1, le=50),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Lists recent solver jobs and their validation/origin statuses."""
    from backend.app.scheduling.worker import solver_job_manager
    return {
        "success": True,
        "jobs": solver_job_manager.list_jobs(limit=limit),
    }


@router.get("/jobs/{job_id}")
async def get_solver_job(
    job_id: str,
    current_user: CurrentUser = Depends(get_current_user),
):
    """Returns detailed solver progress, origin, and validation diagnostics."""
    from backend.app.scheduling.worker import solver_job_manager
    job = solver_job_manager.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail=f"Solver job {job_id} not found.")
    return {
        "success": True,
        "job": job.to_dict(),
    }


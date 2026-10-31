"""Campus schedule answers and faculty schedule-change proposals."""

import re
import hashlib
import json
from collections import Counter
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from backend.app.api.routes.timetable import _check_manual_slot
from backend.app.core.auth import CurrentUser, get_current_user
from backend.app.scheduling.engine import SchedulingEngine
from backend.app.services.app_state import read_state, write_state
from backend.app.services.rescheduling_engine import ReschedulingEngine, apply_disruption_to_data
from backend.app.services.schedule_loader import ScheduleLoader

router = APIRouter(prefix="/assistant", tags=["AI Assistant"])

DAY_NAMES = {"monday": "MON", "mon": "MON", "somvar": "MON", "tuesday": "TUE", "tue": "TUE", "mangalvar": "TUE", "wednesday": "WED", "wed": "WED", "budhvar": "WED", "thursday": "THU", "thu": "THU", "guruwar": "THU", "friday": "FRI", "fri": "FRI", "shukravar": "FRI"}


class ChatMessageRequest(BaseModel):
    message: str


def _placement_map(before: dict, after: dict) -> list[dict]:
    old = {item["session_id"]: item for item in before.get("sessions", [])}
    new = {item["session_id"]: item for item in after.get("sessions", [])}
    return [{"session_id": sid, "before": old.get(sid), "after": new.get(sid), "change_type": "added" if sid not in old else "removed" if sid not in new else "moved"} for sid in sorted(set(old) | set(new)) if old.get(sid) != new.get(sid)]


def _fingerprint(value: dict) -> str:
    return hashlib.sha256(json.dumps(value, sort_keys=True, separators=(",", ":")).encode()).hexdigest()


def _extract_day(query: str) -> Optional[str]:
    return next((day for word, day in DAY_NAMES.items() if re.search(rf"\b{word}\b", query)), None)


def _extract_period(query: str) -> Optional[int]:
    match = re.search(r"\bp\s*(\d{1,2})\b", query)
    if match:
        return int(match.group(1))
    match = re.search(r"\b(\d{1,2})(?::\d{2})?\s*(am|pm|baje)\b", query)
    if not match:
        return None
    hour = int(match.group(1))
    suffix = match.group(2)
    if suffix == "pm" and hour < 12 or suffix == "baje" and hour < 8:
        hour += 12
    return max(1, min(13, hour - 7))


async def _create_faculty_proposal(query: str, user: CurrentUser, data: dict, baseline: dict) -> dict:
    if user.role.value != "faculty" or not user.entity_id:
        raise HTTPException(status_code=403, detail="Schedule changes through the assistant are available to signed-in faculty accounts.")
    faculty_id = user.entity_id
    original_dataset_fingerprint = _fingerprint(data)
    faculty_sessions = [item for item in data.get("sessions", []) if item.get("faculty_id") == faculty_id]
    if not faculty_sessions:
        return {"success": True, "reply": f"I couldn't find current sessions for {faculty_id}. No schedule proposal was created."}

    target_id = next((item["id"] for item in faculty_sessions if re.search(rf"\b{re.escape(item['id'].lower())}\b", query)), None)
    course_match = re.search(r"\b([a-z]{2,4}\d{3})\b", query, re.I)
    if not target_id and course_match:
        matches = [item for item in faculty_sessions if item.get("course_id", "").lower() == course_match.group(1).lower()]
        if len(matches) == 1:
            target_id = matches[0]["id"]
        elif len(matches) > 1:
            return {"success": True, "reply": "I found more than one class for that course. Please include one session ID: " + ", ".join(item["id"] for item in matches) + ". No proposal was created."}

    requested_day = _extract_day(query)
    requested_period = _extract_period(query)
    leave_request = any(word in query for word in ("leave", "unavailable", "off", "can't attend", "cannot attend", "chhutti", "nahi aa", "not available"))
    changes = []
    if leave_request and requested_day:
        changes.append({"type": "faculty_unavailable", "faculty_id": faculty_id, "days": [requested_day], "periods": [1, 2, 3, 4, 5, 6, 7, 8, 9], "reason": "Faculty request via schedule assistant"})
    elif target_id and requested_day and requested_period:
        session = next(item for item in data["sessions"] if item["id"] == target_id)
        if session.get("fixed_slot") and (session["fixed_slot"].get("day") != requested_day or int(session["fixed_slot"].get("start_period", -1)) != requested_period):
            return {"success": True, "reply": f"{target_id} is fixed to {session['fixed_slot']['day']} P{session['fixed_slot']['start_period']} by the official dataset. I can't override that hard constraint. No proposal was created."}
        changes.append({"type": "session_fixed_slot", "session_id": target_id, "day": requested_day, "start_period": requested_period, "reason": "Faculty request via schedule assistant"})
    else:
        return {"success": True, "reply": "I can prepare a solver-checked proposal. For a class move, include a session ID, a day, and a period (for example, 'move CS201-L1 to THU P4'). For leave, say which weekday you are unavailable (for example, 'I am on leave Monday'). No change has been made."}

    disruption = {"id": f"faculty-{faculty_id}-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}", "description": f"Faculty schedule request from {user.name}: {query}", "changes": changes}
    try:
        if changes:
            candidate = ReschedulingEngine(time_limit_seconds=12, num_workers=4).repair_schedule(data, disruption, baseline)
            proposal_data = apply_disruption_to_data(data, disruption)
        else:
            candidate = SchedulingEngine(time_limit_seconds=12, num_workers=4).generate_full_schedule(data, baseline_schedule=baseline)
            proposal_data = data
        expected = len(data.get("sessions", [])) + sum(change.get("type") == "add_session" for change in changes) - sum(change.get("type") == "remove_session" for change in changes)
        if len(candidate.get("sessions", [])) != expected:
            raise RuntimeError("Solver returned an incomplete timetable.")
        for slot in candidate.get("sessions", []):
            violations = _check_manual_slot(proposal_data, candidate, slot["session_id"], slot["day"], int(slot["start_period"]), slot["room_id"])
            if violations:
                raise RuntimeError("The candidate failed hard-constraint validation: " + "; ".join(violations[:5]))
        changes_list = _placement_map(baseline, candidate)
        await write_state("pending_reschedule", {
            "id": disruption["id"], "created_at": datetime.now(timezone.utc).isoformat(), "proposed_by": user.email,
            "proposal_source": "faculty_assistant", "disruption": disruption, "schedule": candidate, "changes": changes_list,
            "baseline_fingerprint": _fingerprint(baseline), "dataset_fingerprint": original_dataset_fingerprint,
        })
        return {"success": True, "reply": f"I prepared and validated a timetable proposal. {sum(item['change_type'] == 'moved' for item in changes_list)} existing sessions change. The published timetable is unchanged until a Super Admin approves it.", "proposal_id": disruption["id"], "changes": changes_list, "hard_violations": 0}
    except Exception as error:
        return {"success": True, "reply": f"I couldn't find a valid timetable under that request, so nothing was changed. Solver detail: {error}"}


@router.post("/chat")
async def chat_with_assistant(req: ChatMessageRequest, current_user: CurrentUser = Depends(get_current_user)):
    query = req.message.strip().lower()
    if len(query) < 2:
        raise HTTPException(status_code=422, detail="Enter a schedule question or change request.")
    data = await read_state("official_dataset") or ScheduleLoader.load_dataset()
    schedule = await read_state("active_schedule") or ScheduleLoader.load_baseline_schedule()

    booking_id = re.search(r"\b(?:BR|USR|MAN)-[A-Z0-9]+\b", req.message.upper())
    if booking_id:
        booking_state = await read_state("venue_bookings") or {"bookings": []}
        booking = next((item for item in booking_state.get("bookings", []) if item.get("request_id") == booking_id.group(0) or item.get("id") == booking_id.group(0)), None)
        if not booking:
            return {"success": True, "reply": f"I couldn't find booking {booking_id.group(0)} in the saved register."}
        can_view_all = current_user.role.value in {"super_admin", "academic_dean", "venue_manager", "timetable_coordinator", "department_coordinator", "department_head"}
        own = {current_user.name.lower(), (current_user.entity_id or "").lower(), current_user.email.lower()}
        if not can_view_all and str(booking.get("requester", "")).lower() not in own:
            raise HTTPException(status_code=403, detail="You may only ask about your own venue requests.")
        reason = booking.get("decision_reason") or booking.get("reason") or "No decision reason has been recorded yet."
        placement = f" Proposed slot: {booking.get('day')} P{booking.get('start_period')} in {booking.get('room_id')}." if booking.get("day") else ""
        return {"success": True, "reply": f"Booking {booking_id.group(0)} is {booking.get('status', 'pending')}. Recorded decision reason: {reason}.{placement}"}

    if any(word in query for word in ("move", "shift", "reschedul", "leave", "unavailable", "chhutti", "can't attend", "cannot attend", "change my", "change class")):
        return await _create_faculty_proposal(query, current_user, data, schedule)

    rooms = data.get("rooms", [])
    faculty = data.get("faculty", [])
    sessions = schedule.get("sessions", [])
    sessions_meta = {item["id"]: item for item in data.get("sessions", [])}
    courses = {item["id"]: item for item in data.get("courses", [])}

    if query.startswith("why") or "why was" in query or "reason for" in query:
        mentioned = next((sid for sid in sessions_meta if sid.lower() in query), None)
        if mentioned:
            slot = next((item for item in sessions if item.get("session_id") == mentioned), None)
            meta = sessions_meta[mentioned]
            room = next((item for item in rooms if slot and item["id"] == slot.get("room_id")), {})
            if not slot:
                return {"success": True, "reply": f"{mentioned} has no active placement in the current schedule."}
            start = int(slot["start_period"])
            earlier_periods = [int(period["id"]) for period in data.get("calendar", {}).get("periods", []) if period.get("teaching") and int(period["id"]) < start]
            compatible_rooms = [candidate for candidate in rooms if candidate.get("type") in set(meta.get("room_types", [])) and int(candidate.get("capacity", 0)) >= int(meta.get("size", 0)) and (not meta.get("needs_accessible") or candidate.get("accessible")) and meta.get("kind") in candidate.get("allowed_uses", [])]
            earlier_choices = []
            blocked_reasons = Counter()
            for period in earlier_periods:
                found = False
                for candidate_room in compatible_rooms:
                    blockers = _check_manual_slot(data, schedule, mentioned, slot["day"], period, candidate_room["id"])
                    if not blockers:
                        earlier_choices.append(f"P{period} in {candidate_room.get('name', candidate_room['id'])}")
                        found = True
                        break
                    blocked_reasons.update(blockers)
                if not found and not compatible_rooms:
                    blocked_reasons.update(["No room meets the session's official type, capacity, and accessibility requirements."])
            if earlier_choices:
                timing_reason = f"Earlier hard-constraint-safe choices also exist ({', '.join(earlier_choices[:3])}), so the saved timetable does not record a unique reason for preferring this period."
            elif earlier_periods:
                reason_examples = "; ".join(reason for reason, _ in blocked_reasons.most_common(3))
                timing_reason = f"The earlier teaching periods were blocked by the active hard constraints. Examples: {reason_examples or 'the session availability and timetable constraints'}."
            else:
                timing_reason = "This is the first teaching period in the campus day; no earlier teaching slot exists."
            return {"success": True, "reply": f"{mentioned} is scheduled {slot['day']} P{start} in {room.get('name', slot['room_id'])} ({slot['room_id']}). The room is allowed and seats {room.get('capacity', 'unknown')} for {meta.get('size', 'unknown')} students. {timing_reason} The active timetable has no room, faculty, or student-group overlap at the selected slot."}
        return {"success": True, "reply": "To explain a placement, include its session ID (for example, 'Why is CS201-L1 at P2?')."}

    for room in rooms:
        if room["id"].lower() in query or room.get("name", "").lower() in query:
            room_sessions = [item for item in sessions if item.get("room_id") == room["id"]]
            return {"success": True, "reply": f"{room['name']} ({room['id']}) is in {room.get('building', 'the campus')}, holds {room.get('capacity', 0)}, and supports {', '.join(room.get('allowed_uses', []))}. It has {len(room_sessions)} scheduled sessions.", "entity": room}

    for person in faculty:
        if person["id"].lower() in query or person.get("name", "").lower() in query:
            person_sessions = [item for item in sessions if sessions_meta.get(item.get("session_id"), {}).get("faculty_id") == person["id"]]
            return {"success": True, "reply": f"{person['name']} ({person['id']}) from {person.get('department', '—')} has {len(person_sessions)} scheduled sessions. Daily teaching limit: {person.get('max_hours_per_day', 4)} periods.", "entity": person}

    for course_id, course in courses.items():
        if course_id.lower() in query or course.get("title", "").lower() in query:
            course_sessions = [item for item in sessions if sessions_meta.get(item.get("session_id"), {}).get("course_id") == course_id]
            return {"success": True, "reply": f"{course.get('title', course_id)} ({course_id}) has {len(course_sessions)} scheduled sessions in the current timetable.", "entity": course}

    if any(word in query for word in ("status", "solver", "algorithm", "summary", "violations", "stats")):
        return {"success": True, "reply": f"Current schedule has {len(sessions)} placements, {len(schedule.get('exams', []))} exam slots, and {len(schedule.get('fest_week', {}).get('bookings', []))} saved fixture booking decisions. Faculty change proposals use Google OR-Tools CP-SAT, are hard-constraint checked, and require Super Admin approval before they become active."}
    return {"success": True, "reply": "Ask about a room, faculty member, course, or a timetable change. For example: 'Move CS201-L1 to THU P4' or 'I am on leave Monday'."}

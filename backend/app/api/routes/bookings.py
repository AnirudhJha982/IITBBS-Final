"""Persistent Spectra and ad-hoc venue booking workflow."""

import re
import uuid
from datetime import datetime, timezone
from zoneinfo import ZoneInfo
from typing import Any, Dict, List

from fastapi import APIRouter, Depends, HTTPException
from backend.app.core.auth import CurrentUser, get_current_user
from backend.app.services.app_state import read_state, seed_state, write_state
from backend.app.services.schedule_loader import ScheduleLoader

router = APIRouter(prefix="/bookings", tags=["Venue Bookings"])
DECIDERS = {"super_admin", "academic_dean", "venue_manager"}
DAY_NAMES = {
    "monday": "MON", "mon": "MON", "somvar": "MON", "tuesday": "TUE", "tue": "TUE", "mangalvar": "TUE",
    "wednesday": "WED", "wed": "WED", "budhvar": "WED", "thursday": "THU", "thu": "THU", "guruwar": "THU",
    "friday": "FRI", "fri": "FRI", "shukravar": "FRI", "saturday": "SAT", "sat": "SAT", "shanivar": "SAT",
}
ROLE_CATEGORY = {
    "super_admin": "institute_event", "academic_dean": "institute_event", "venue_manager": "institute_event",
    "faculty": "guest_lecture", "department_coordinator": "department_event", "department_head": "department_event",
    "club_representative": "club_event", "student_representative": "club_event",
}
ROLE_POLICY = {
    "super_admin": "admin", "academic_dean": "admin", "venue_manager": "admin",
    "faculty": "faculty", "department_coordinator": "department_coordinator", "department_head": "department_coordinator",
    "club_representative": "club", "student_representative": "club",
}


def _source_data() -> tuple[dict, dict]:
    return ScheduleLoader.load_dataset(), ScheduleLoader.load_baseline_schedule()


def _make_seed(dataset: dict, schedule: dict) -> dict:
    definitions = {item["id"]: item for item in dataset.get("booking_requests", [])}
    bookings = []
    for decision in schedule.get("fest_week", {}).get("bookings", []):
        definition = definitions.get(decision.get("request_id"), {})
        bookings.append({**definition, **decision, "request_id": decision.get("request_id")})
    return {"bookings": bookings}


async def _load_records() -> List[Dict[str, Any]]:
    state = await read_state("venue_bookings")
    if state is None:
        dataset, schedule = _source_data()
        state = _make_seed(dataset, schedule)
        await seed_state("venue_bookings", state)
    return list(state.get("bookings", []))


def _decision_permission(user: CurrentUser) -> None:
    if user.role.value not in DECIDERS:
        raise HTTPException(status_code=403, detail="Only the venue manager, academic dean, or administrator may decide bookings.")


def _identity(user: CurrentUser) -> set[str]:
    return {str(v).strip().lower() for v in (user.email, user.name, user.entity_id) if v}


def _enrich(booking: dict, dataset: dict) -> dict:
    rooms = {r["id"]: r for r in dataset.get("rooms", [])}
    room_id = booking.get("room_id") or booking.get("assigned_room_id")
    room = rooms.get(room_id, {})
    return {
        **booking,
        "room_id": room_id,
        "room_name": room.get("name", room_id),
        "room_type": room.get("type", ""),
        "reason": booking.get("decision_reason") or booking.get("reason") or "",
    }


@router.get("/")
async def get_venue_bookings(current_user: CurrentUser = Depends(get_current_user)):
    """Return the persisted booking register with role-scoped requester views."""
    dataset, _ = _source_data()
    records = await _load_records()
    if current_user.role.value not in DECIDERS and current_user.role.value not in {"timetable_coordinator", "department_coordinator", "department_head"}:
        own = _identity(current_user)
        records = [item for item in records if str(item.get("requester", "")).strip().lower() in own]
    enriched = [_enrich(item, dataset) for item in records]
    return {
        "success": True,
        "count": len(enriched),
        "total_requests": len(enriched),
        "approved_count": sum(item.get("status") == "approved" for item in enriched),
        "alternative_offered_count": sum(item.get("status") == "alternative_offered" for item in enriched),
        "rejected_count": sum(item.get("status") == "rejected" for item in enriched),
        "bookings": enriched,
    }


@router.post("/parse")
async def parse_booking_prompt(body: Dict[str, Any], current_user: CurrentUser = Depends(get_current_user)):
    """Extract a reviewable booking draft from English or common Hinglish phrasing."""
    prompt = str(body.get("prompt", "")).strip()
    if len(prompt) < 8:
        raise HTTPException(status_code=422, detail="Please describe the event, day, and approximate attendance.")
    lower = prompt.lower()
    attendees_match = re.search(r"\b(\d{1,4})\s*(?:people|persons|students|attendees|pax|log|logo|bacche|participants)\b", lower)
    if not attendees_match:
        attendees_match = re.search(r"\b(?:for|around|with)\s+(\d{1,4})\b", lower)
    duration_match = re.search(r"\b(\d{1,2})\s*(?:hours?|hrs?|ghante|ghanta)\b", lower)
    day = next((value for word, value in DAY_NAMES.items() if re.search(rf"\b{re.escape(word)}\b", lower)), None)
    period_match = re.search(r"\bp\s*(\d{1,2})\b", lower)
    time_match = re.search(r"\b(\d{1,2})(?::\d{2})?\s*(am|pm|baje)\b", lower)
    start_period = int(period_match.group(1)) if period_match else None
    if start_period is None and time_match:
        hour = int(time_match.group(1))
        if (time_match.group(2) == "pm" and hour < 12) or (time_match.group(2) == "baje" and hour < 8):
            hour += 12
        # Campus period 1 begins at 08:00; this mapping is shown to the requester for review.
        start_period = max(1, min(13, hour - 7))
    if not day and "kal" in lower:
        next_weekday = (datetime.now(ZoneInfo("Asia/Kolkata")).weekday() + 1) % 7
        day = {0: "MON", 1: "TUE", 2: "WED", 3: "THU", 4: "FRI", 5: "SAT"}.get(next_weekday)
    duration = int(duration_match.group(1)) if duration_match else 1
    attendance = int(attendees_match.group(1)) if attendees_match else None
    room_types = [kind for term, kind in (("auditorium", "auditorium"), ("seminar", "seminar_hall"), ("lab", "lab_cs"), ("classroom", "classroom"), ("lecture hall", "lecture_hall")) if term in lower]
    needs = [need for term, need in (("projector", "projector"), ("stage", "stage"), ("sound", "pa_system"), ("mic", "pa_system"), ("computer", "computers")) if term in lower]
    title = re.sub(r"\b(?:on|at|for|with|around|near|bhai|chahiye|please|book|need|reserve)\b.*$", "", prompt, flags=re.I).strip(" ,.-")
    title = title[:120] or "Campus event"
    proposal = {
        "title": title,
        "attendance": attendance,
        "duration_periods": max(1, min(duration, 13)),
        "windows": ([{"day": day, "from_period": start_period or 1, "to_period": min(13, (start_period or 1) + max(1, duration) - 1)}] if day else []),
        "room_types": room_types,
        "needs": needs,
        "requested_room": None,
        "raw_text": prompt,
    }
    missing = [key for key, value in (("attendance", attendance), ("day", day), ("venue type", room_types)) if value is None or value == []]
    return {"success": True, "proposal": proposal, "missing_fields": missing, "language": "Hinglish" if any(word in lower for word in ("bhai", "chahiye", "baje", "log", "kal", "aaj")) else "English", "requires_user_review": True}


@router.post("/")
async def submit_booking(body: Dict[str, Any], current_user: CurrentUser = Depends(get_current_user)):
    """Create a pending request only after the user has reviewed structured details."""
    if current_user.role.value not in ROLE_CATEGORY:
        raise HTTPException(status_code=403, detail="Your account cannot request venue bookings.")
    try:
        title = str(body["title"]).strip()
        attendance = int(body["attendance"])
        duration = int(body["duration_periods"])
        windows = body.get("windows", [])
        room_types = body.get("room_types", [])
        needs = body.get("needs", [])
    except (KeyError, TypeError, ValueError):
        raise HTTPException(status_code=422, detail="Title, attendance, duration, windows, and venue type are required.")
    if not title or not 1 <= attendance <= 5000 or not 1 <= duration <= 13 or not isinstance(windows, list) or not windows or not isinstance(room_types, list) or not room_types:
        raise HTTPException(status_code=422, detail="Check the title, attendance (1–5000), duration (1–13), requested days, and venue type.")
    for window in windows:
        if window.get("day") not in {"MON", "TUE", "WED", "THU", "FRI", "SAT"} or not 1 <= int(window.get("from_period", 0)) <= int(window.get("to_period", 0)) <= 13:
            raise HTTPException(status_code=422, detail="A requested time window has an invalid day or period.")
    category = ROLE_CATEGORY[current_user.role.value]
    record = {
        "id": f"USR-{uuid.uuid4().hex[:10].upper()}", "request_id": None,
        "submitted_at": datetime.now(timezone.utc).isoformat(),
        "requester": current_user.entity_id or current_user.name, "role": ROLE_POLICY[current_user.role.value],
        "requested_category": category, "title": title, "attendance": attendance,
        "duration_periods": duration, "windows": windows, "room_types": room_types,
        "needs": needs if isinstance(needs, list) else [], "requested_room": body.get("requested_room"),
        "mandatory_for_groups": body.get("mandatory_for_groups", []), "raw_text": body.get("raw_text"),
        "status": "pending", "day": None, "start_period": None, "end_period": None,
        "room_id": None, "decision_reason": None, "submitted_by": current_user.email,
    }
    record["request_id"] = record["id"]
    state = await read_state("venue_bookings") or {"bookings": []}
    records = list(state.get("bookings", []))
    records.append(record)
    await write_state("venue_bookings", {"bookings": records})
    dataset, _ = _source_data()
    return {"success": True, "message": "Request submitted and saved for review.", "booking": _enrich(record, dataset)}


@router.post("/manual")
async def manually_schedule_event(body: Dict[str, Any], current_user: CurrentUser = Depends(get_current_user)):
    """Create an approved event only after the same room, time, and clash checks used for decisions."""
    if current_user.role.value not in {"super_admin", "venue_manager"}:
        raise HTTPException(status_code=403, detail="Only an administrator or venue manager may manually schedule an event.")
    try:
        title = str(body["title"]).strip()
        attendance = int(body["attendance"])
        duration = int(body["duration_periods"])
        day = str(body["day"]).upper()
        start = int(body["start_period"])
        room_id = str(body["room_id"])
        reason = str(body["reason"]).strip()
    except (KeyError, TypeError, ValueError):
        raise HTTPException(status_code=422, detail="Title, attendance, duration, day, period, room, and decision reason are required.")
    if not title or len(reason) < 8 or not 1 <= attendance <= 5000 or not 1 <= duration <= 13 or day not in {"MON", "TUE", "WED", "THU", "FRI", "SAT"}:
        raise HTTPException(status_code=422, detail="Check the title, reason, attendance, duration, and festival day.")
    dataset, _ = _source_data()
    rooms = {item["id"]: item for item in dataset.get("rooms", [])}
    room = rooms.get(room_id)
    if not room:
        raise HTTPException(status_code=422, detail="Choose a room from the official dataset.")
    end = start + duration - 1
    record = {
        "id": f"MAN-{uuid.uuid4().hex[:10].upper()}", "request_id": None,
        "submitted_at": datetime.now(timezone.utc).isoformat(),
        "requester": current_user.name, "role": ROLE_POLICY[current_user.role.value],
        "requested_category": ROLE_CATEGORY[current_user.role.value], "title": title,
        "attendance": attendance, "duration_periods": duration,
        "windows": [{"day": day, "from_period": start, "to_period": end}],
        "room_types": [room.get("type")], "needs": body.get("needs", []),
        "requested_room": room_id, "mandatory_for_groups": body.get("mandatory_for_groups", []),
        "raw_text": None, "status": "pending", "day": day, "start_period": start,
        "end_period": end, "room_id": room_id,
    }
    record["request_id"] = record["id"]
    state = await read_state("venue_bookings") or {"bookings": []}
    records = list(state.get("bookings", []))
    active_schedule = await read_state("active_schedule") or ScheduleLoader.load_baseline_schedule()
    conflicts = _slot_conflicts(record, day, start, room_id, records, dataset, active_schedule)
    if conflicts:
        raise HTTPException(status_code=409, detail={"message": "Manual event was not saved because it conflicts with an existing constraint.", "conflicts": conflicts})
    record.update(status="approved", decision_reason=reason, decided_by=current_user.email, decided_at=datetime.now(timezone.utc).isoformat())
    records.append(record)
    await write_state("venue_bookings", {"bookings": records})
    return {"success": True, "message": "Event manually scheduled after passing room and time conflict checks.", "booking": _enrich(record, dataset)}


def _priority_rank(booking: dict, dataset: dict) -> int:
    order = dataset.get("priority_order", [])
    requested = booking.get("requested_category", booking.get("role", "club_event"))
    cap = dataset.get("role_category_cap", {}).get(booking.get("role", "club"), "club_event")
    requested_rank = order.index(requested) if requested in order else len(order) - 1
    cap_rank = order.index(cap) if cap in order else len(order) - 1
    return max(requested_rank, cap_rank)


def _slot_conflicts(booking: dict, day: str, start: int, room_id: str, records: list, dataset: dict, schedule: dict) -> list[str]:
    rooms = {room["id"]: room for room in dataset.get("rooms", [])}
    room = rooms.get(room_id)
    if not room:
        return [f"Room {room_id} is not in the official venue list."]
    end = start + int(booking.get("duration_periods", 1)) - 1
    if not 1 <= start <= end <= 13:
        return ["The requested duration falls outside the available festival periods."]
    if int(booking.get("attendance", 0)) > int(room.get("capacity", 0)):
        return [f"{room.get('name', room_id)} seats {room.get('capacity', 0)}; this request needs {booking.get('attendance')}."]
    needed_types = booking.get("room_types", [])
    if needed_types and room.get("type") not in needed_types:
        return [f"{room.get('name', room_id)} does not match the requested venue type."]
    if "event" not in room.get("allowed_uses", []):
        return [f"{room.get('name', room_id)} is not approved for events."]
    room_features = set(room.get("features", []))
    missing = [need for need in booking.get("needs", []) if need not in room_features and not (need == "computers" and "computer" in room.get("type", ""))]
    if missing:
        return [f"{room.get('name', room_id)} is missing: {', '.join(missing)}."]
    windows = booking.get("windows", [])
    if windows and not any(w.get("day") == day and start >= int(w.get("from_period", 1)) and end <= int(w.get("to_period", 13)) for w in windows):
        return ["The proposed time is outside this request's submitted availability windows."]
    conflicts = []
    session_defs = {item["id"]: item for item in dataset.get("sessions", [])}
    group_set = set(booking.get("mandatory_for_groups", []))
    for slot in schedule.get("sessions", []):
        meta = session_defs.get(slot.get("session_id"), {})
        if slot.get("day") != day:
            continue
        class_start = int(slot.get("start_period", 0))
        class_end = class_start + int(meta.get("duration", 1)) - 1
        if start > class_end or class_start > end:
            continue
        if slot.get("room_id") == room_id:
            conflicts.append(f"Room {room_id} is occupied by class {slot.get('session_id')} during the proposed event.")
        overlap_groups = group_set & set(meta.get("groups", []))
        if overlap_groups:
            conflicts.append(f"Mandatory group(s) {', '.join(sorted(overlap_groups))} have class {slot.get('session_id')} during the proposed event.")
    for unavailable in dataset.get("room_unavailability", []):
        if unavailable.get("room_id") == room_id and unavailable.get("day") == day and set(range(start, end + 1)) & set(unavailable.get("periods", [])):
            conflicts.append(f"Room {room_id} is marked unavailable during the proposed event.")
    for other in records:
        if other.get("request_id") == booking.get("request_id") or other.get("status") != "approved":
            continue
        other_day = other.get("day")
        other_start = other.get("start_period")
        other_end = other.get("end_period") or (int(other_start or 0) + int(other.get("duration_periods", 1)) - 1)
        if other_day == day and (other.get("room_id") or other.get("assigned_room_id")) == room_id and other_start is not None and start <= int(other_end) and int(other_start) <= end:
            conflicts.append(f"{room.get('name', room_id)} is already approved for {other.get('title', other.get('request_id'))} during an overlapping period.")
        if other_day == day and set(booking.get("mandatory_for_groups", [])) & set(other.get("mandatory_for_groups", [])) and other_start is not None and start <= int(other_end) and int(other_start) <= end:
            conflicts.append("An overlapping mandatory student group booking is already approved.")
    rank = _priority_rank(booking, dataset)
    for other in records:
        if other.get("status") != "pending" or _priority_rank(other, dataset) >= rank:
            continue
        for window in other.get("windows", []):
            overlaps = window.get("day") == day and start <= int(window.get("to_period", 0)) and int(window.get("from_period", 99)) <= end
            compatible = not other.get("room_types") or room.get("type") in other.get("room_types", [])
            fits = int(other.get("attendance", 0)) <= int(room.get("capacity", 0))
            if overlaps and compatible and fits:
                conflicts.append(f"Higher-priority request {other.get('request_id')} must be decided first for this overlapping slot.")
    return conflicts


async def _decide(body: Dict[str, Any], action: str, user: CurrentUser):
    _decision_permission(user)
    request_id = str(body.get("request_id", ""))
    reason = str(body.get("reason", "")).strip()
    if len(reason) < 8:
        raise HTTPException(status_code=422, detail="Enter a clear reason of at least eight characters for this decision.")
    state = await read_state("venue_bookings") or {"bookings": []}
    records = list(state.get("bookings", []))
    index = next((i for i, item in enumerate(records) if item.get("request_id") == request_id or item.get("id") == request_id), None)
    if index is None:
        raise HTTPException(status_code=404, detail="Booking request was not found.")
    booking = dict(records[index])
    if booking.get("requester", "").strip().lower() in _identity(user):
        raise HTTPException(status_code=403, detail="You cannot decide your own booking request.")
    dataset, _ = _source_data()
    now = datetime.now(timezone.utc).isoformat()
    if action == "reject":
        booking.update(status="rejected", decision_reason=reason, decided_by=user.email, decided_at=now)
    else:
        day = str(body.get("day") or booking.get("day") or booking.get("assigned_day") or "")
        try:
            start = int(body.get("start_period") or booking.get("start_period") or 0)
        except (TypeError, ValueError):
            start = 0
        room_id = str(body.get("room_id") or booking.get("room_id") or booking.get("assigned_room_id") or "")
        if not day or not start or not room_id:
            raise HTTPException(status_code=422, detail="Choose an available day, start period, and room before approving or offering an alternative.")
        active_schedule = await read_state("active_schedule") or ScheduleLoader.load_baseline_schedule()
        conflicts = _slot_conflicts(booking, day, start, room_id, records, dataset, active_schedule)
        if conflicts:
            raise HTTPException(status_code=409, detail={"message": "This decision conflicts with booking rules.", "conflicts": conflicts})
        end = start + int(booking.get("duration_periods", 1)) - 1
        status_value = "alternative_offered" if action == "alternative" else "approved"
        booking.update(status=status_value, day=day, start_period=start, end_period=end, room_id=room_id, assigned_day=day, assigned_room_id=room_id, decision_reason=reason, decided_by=user.email, decided_at=now)
    records[index] = booking
    await write_state("venue_bookings", {"bookings": records})
    return {"success": True, "message": f"Request {request_id} marked {booking['status']}.", "request_id": request_id, "new_status": booking["status"], "booking": _enrich(booking, dataset)}


@router.post("/approve")
async def approve_booking(body: Dict[str, Any], current_user: CurrentUser = Depends(get_current_user)):
    return await _decide(body, "approve", current_user)


@router.post("/reject")
async def reject_booking(body: Dict[str, Any], current_user: CurrentUser = Depends(get_current_user)):
    return await _decide(body, "reject", current_user)


@router.post("/alternative")
async def offer_alternative(body: Dict[str, Any], current_user: CurrentUser = Depends(get_current_user)):
    return await _decide(body, "alternative", current_user)

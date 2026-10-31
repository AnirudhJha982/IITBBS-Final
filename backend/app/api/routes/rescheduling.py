"""Disruption proposals are validated and persisted before an administrator can apply them."""

import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse

from backend.app.core.auth import CurrentUser, get_current_user
from backend.app.scheduling.engine import SchedulingEngine
from backend.app.services.app_state import read_state, write_state
from backend.app.services.rescheduling_engine import ReschedulingEngine
from backend.app.services.schedule_loader import ScheduleLoader
from backend.app.api.routes.timetable import _check_manual_slot
from backend.app.services.rescheduling_engine import apply_disruption_to_data

router = APIRouter(prefix="/rescheduling", tags=["Rescheduling"])


def _load_sample_disruption() -> dict:
    path = ScheduleLoader.get_sample_disruption_path()
    with open(path, "r", encoding="utf-8") as source:
        return json.load(source)


def _fingerprint(value: dict) -> str:
    return hashlib.sha256(json.dumps(value, sort_keys=True, separators=(",", ":")).encode()).hexdigest()


def _compare(before: dict, after: dict) -> list[dict]:
    old = {item["session_id"]: item for item in before.get("sessions", [])}
    new = {item["session_id"]: item for item in after.get("sessions", [])}
    changes = []
    for sid in sorted(set(old) | set(new)):
        if old.get(sid) != new.get(sid):
            changes.append({"session_id": sid, "before": old.get(sid), "after": new.get(sid), "change_type": "added" if sid not in old else "removed" if sid not in new else "moved"})
    return changes


async def _current_data_and_schedule():
    dataset = await read_state("official_dataset") or ScheduleLoader.load_dataset()
    schedule = await read_state("active_schedule") or ScheduleLoader.load_baseline_schedule()
    return dataset, schedule


@router.get("/status")
async def get_rescheduling_status(current_user: CurrentUser = Depends(get_current_user)):
    if current_user.role.value not in {"super_admin", "timetable_coordinator", "academic_dean"}:
        raise HTTPException(status_code=403, detail="You may not view rescheduling proposals.")
    dataset, current = await _current_data_and_schedule()
    pending = await read_state("pending_reschedule") or {}
    baseline_by_id = {item["session_id"]: item for item in current.get("sessions", [])}
    candidate = pending.get("schedule") or {}
    changes = pending.get("changes", [])
    return {
        "success": True,
        "status": "PENDING_ADMIN_APPROVAL" if candidate else "NO_PENDING_PROPOSAL",
        "disruption": pending.get("disruption") or _load_sample_disruption(),
        "pending_proposal": {"id": pending.get("id"), "created_at": pending.get("created_at"), "proposed_by": pending.get("proposed_by"), "changes": changes} if candidate else None,
        "metrics": {
            "total_baseline_sessions": len(baseline_by_id),
            "total_repaired_sessions": len(candidate.get("sessions", [])) if candidate else len(baseline_by_id),
            "sessions_time_shifted": sum(1 for change in changes if change["change_type"] == "moved" and change.get("before", {}).get("day") != change.get("after", {}).get("day") or change["change_type"] == "moved" and change.get("before", {}).get("start_period") != change.get("after", {}).get("start_period")),
            "sessions_room_reassigned": sum(1 for change in changes if change["change_type"] == "moved" and change.get("before", {}).get("room_id") != change.get("after", {}).get("room_id")),
            "total_displaced": sum(1 for change in changes if change["change_type"] == "moved"),
            "added_sessions": sum(change["change_type"] == "added" for change in changes),
            "hard_violations": 0 if candidate else None,
            "soft_penalty": None,
            "booking_score": None,
        },
    }


async def propose_schedule_repair(body: Optional[Dict[str, Any]] = None, current_user: CurrentUser = Depends(get_current_user)):
    if current_user.role.value not in {"super_admin", "timetable_coordinator"}:
        raise HTTPException(status_code=403, detail="Only an administrator or timetable coordinator may prepare a repair proposal.")
    dataset, baseline = await _current_data_and_schedule()
    disruption = body if body and body.get("changes") else _load_sample_disruption()
    try:
        engine = ReschedulingEngine(time_limit_seconds=40, num_workers=4)
        proposed = engine.repair_schedule(dataset, disruption, baseline)
        if len(proposed.get("sessions", [])) != len(dataset.get("sessions", [])) + sum(change.get("type") == "add_session" for change in disruption.get("changes", [])) - sum(change.get("type") == "remove_session" for change in disruption.get("changes", [])):
            raise RuntimeError("Solver returned an incomplete schedule.")
        repaired_data = dataset
        from backend.app.services.rescheduling_engine import apply_disruption_to_data
        repaired_data = apply_disruption_to_data(dataset, disruption)
        for slot in proposed.get("sessions", []):
            violations = _check_manual_slot(repaired_data, proposed, slot["session_id"], slot["day"], int(slot["start_period"]), slot["room_id"])
            if violations:
                raise RuntimeError("Candidate failed validation: " + "; ".join(violations[:8]))
        changes = _compare(baseline, proposed)
        pending = {
            "id": f"repair-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "proposed_by": current_user.email,
            "disruption": disruption,
            "schedule": proposed,
            "changes": changes,
            "baseline_fingerprint": _fingerprint(baseline),
            "dataset_fingerprint": _fingerprint(dataset),
        }
        await write_state("pending_reschedule", pending)
        return {
            "success": True,
            "status": "PENDING_ADMIN_APPROVAL",
            "message": f"Validated repair proposal ready. {sum(change['change_type'] == 'moved' for change in changes)} existing sessions move; the current schedule remains active until an Admin approves.",
            "moved_sessions_count": sum(change["change_type"] == "moved" for change in changes),
            "hard_violations": 0,
            "changes": changes,
        }
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=409, detail={"message": "No valid repair proposal was produced; the active schedule was not changed.", "conflicts": [str(exc)]})


@router.post("/propose")
async def create_rescheduling_proposal(body: Optional[Dict[str, Any]] = None, current_user: CurrentUser = Depends(get_current_user)):
    return await propose_schedule_repair(body, current_user)


@router.post("/apply-disruption")
async def legacy_apply_disruption(body: Optional[Dict[str, Any]] = None, current_user: CurrentUser = Depends(get_current_user)):
    """Legacy button now creates a proposal; it never applies it immediately."""
    return await propose_schedule_repair(body, current_user)


@router.post("/approve")
async def approve_rescheduling(current_user: CurrentUser = Depends(get_current_user)):
    if current_user.role.value != "super_admin":
        raise HTTPException(status_code=403, detail="Only a Super Admin may approve a timetable change proposal.")
    pending = await read_state("pending_reschedule") or {}
    if not pending.get("schedule"):
        raise HTTPException(status_code=404, detail="There is no pending timetable proposal to approve.")
    dataset, current = await _current_data_and_schedule()
    if _fingerprint(current) != pending.get("baseline_fingerprint"):
        raise HTTPException(status_code=409, detail="The active schedule changed after this proposal was made. Create a fresh proposal before approval.")
    if _fingerprint(dataset) != pending.get("dataset_fingerprint"):
        raise HTTPException(status_code=409, detail="The official dataset changed after this proposal was made. Create a fresh proposal before approval.")
    try:
        validation_data = apply_disruption_to_data(dataset, pending.get("disruption", {})) if pending.get("disruption", {}).get("changes") else dataset
        for slot in pending["schedule"].get("sessions", []):
            violations = _check_manual_slot(validation_data, pending["schedule"], slot["session_id"], slot["day"], int(slot["start_period"]), slot["room_id"])
            if violations:
                raise ValueError("; ".join(violations[:8]))
    except Exception as exc:
        raise HTTPException(status_code=409, detail=f"The proposal no longer passes hard-constraint checks: {exc}")
    await write_state("active_schedule", pending["schedule"])
    await write_state("pending_reschedule", {})
    await write_state("last_reschedule_approval", {"proposal_id": pending["id"], "approved_by": current_user.email, "approved_at": datetime.now(timezone.utc).isoformat(), "changes": pending["changes"]})
    return {"success": True, "message": "Validated timetable proposal approved and applied.", "applied_changes": len(pending.get("changes", [])), "schedule": pending["schedule"]}


@router.get("/export")
async def export_repaired_schedule(current_user: CurrentUser = Depends(get_current_user)):
    if current_user.role.value not in {"super_admin", "timetable_coordinator", "academic_dean"}:
        raise HTTPException(status_code=403, detail="You may not export rescheduling proposals.")
    pending = await read_state("pending_reschedule") or {}
    schedule = pending.get("schedule") or (await _current_data_and_schedule())[1]
    return JSONResponse(content=schedule, headers={"Content-Disposition": "attachment; filename=schedule_after.json"})

"""Admin-only starter-pack dataset import and export."""

import json
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import JSONResponse

from backend.app.core.auth import CurrentUser, get_current_user
from backend.app.services.app_state import read_state, write_state
from backend.app.services.data_validator import DataValidator
from backend.app.services.schedule_loader import ScheduleLoader

router = APIRouter(prefix="/dataset", tags=["Dataset"])


def _admin(user: CurrentUser) -> None:
    if user.role.value != "super_admin":
        raise HTTPException(status_code=403, detail="Only a Super Admin may change the official dataset.")


@router.get("/")
async def get_dataset_summary(current_user: CurrentUser = Depends(get_current_user)):
    _admin(current_user)
    dataset = await read_state("official_dataset") or ScheduleLoader.load_dataset()
    return {
        "success": True,
        "dataset_id": dataset.get("dataset_id"),
        "counts": {key: len(dataset.get(key, [])) for key in ("rooms", "faculty", "student_groups", "courses", "sessions", "exams", "booking_requests")},
        "last_uploaded_at": (await read_state("dataset_upload_meta") or {}).get("uploaded_at"),
    }


@router.get("/export")
async def export_dataset(current_user: CurrentUser = Depends(get_current_user)):
    _admin(current_user)
    dataset = await read_state("official_dataset") or ScheduleLoader.load_dataset()
    return JSONResponse(content=dataset, headers={"Content-Disposition": "attachment; filename=cit_public.json"})


@router.post("/upload")
async def upload_dataset(file: UploadFile = File(...), current_user: CurrentUser = Depends(get_current_user)):
    _admin(current_user)
    if not file.filename or not file.filename.lower().endswith(".json"):
        raise HTTPException(status_code=415, detail="Upload the starter-pack dataset as a .json file.")
    raw = await file.read(12 * 1024 * 1024 + 1)
    if len(raw) > 12 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Dataset file exceeds the 12 MB limit.")
    try:
        payload: Any = json.loads(raw.decode("utf-8-sig"))
    except (UnicodeDecodeError, json.JSONDecodeError):
        raise HTTPException(status_code=422, detail="The uploaded file is not valid UTF-8 JSON.")
    if not isinstance(payload, dict):
        raise HTTPException(status_code=422, detail="The dataset root must be a JSON object.")
    report = DataValidator.validate_master_payload(payload)
    required = ("calendar", "exams", "booking_requests", "priority_order", "role_category_cap")
    missing = [key for key in required if key not in payload]
    if not report.is_valid or missing:
        raise HTTPException(status_code=422, detail={"message": "Dataset was not saved because it does not match the CampusOS starter-pack format.", "errors": report.errors + [f"Missing required dataset key: {key}" for key in missing]})
    await write_state("official_dataset", payload)
    await write_state("dataset_upload_meta", {"filename": file.filename, "uploaded_by": current_user.email, "uploaded_at": datetime.now(timezone.utc).isoformat(), "counts": report.entity_counts})
    return {"success": True, "message": "Dataset validated and saved. The active timetable remains unchanged until a new schedule is generated.", "dataset_id": report.dataset_id, "counts": report.entity_counts, "warnings": report.warnings}

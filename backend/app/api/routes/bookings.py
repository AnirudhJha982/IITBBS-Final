"""
CampusOS AI - Venue Bookings & Spectra Fest Week API Routes
"""

from fastapi import APIRouter
from backend.app.services.schedule_loader import ScheduleLoader

router = APIRouter(prefix="/bookings", tags=["Venue Bookings"])


@router.get("/")
async def get_venue_bookings():
    """Returns the 25 official Spectra event booking requests and solver allocation decisions."""
    data = ScheduleLoader.load_dataset()
    schedule = ScheduleLoader.load_baseline_schedule()

    requests_meta = {b["id"]: b for b in data.get("booking_requests", [])}
    fest_week = schedule.get("fest_week", {})
    decisions = fest_week.get("bookings", [])
    rooms_map = {r["id"]: r for r in data.get("rooms", [])}

    enriched = []
    for d in decisions:
        bid = d.get("request_id")
        meta = requests_meta.get(bid, {})
        rid = d.get("room_id")
        rm = rooms_map.get(rid, {})

        enriched.append({
            "request_id": bid,
            "title": meta.get("title", bid),
            "requester": meta.get("requester", ""),
            "role": meta.get("role", ""),
            "category": meta.get("requested_category", ""),
            "attendance": meta.get("attendance", 0),
            "status": d.get("status", "pending"),
            "day": d.get("day"),
            "start_period": d.get("start_period"),
            "end_period": d.get("end_period"),
            "room_id": rid,
            "room_name": rm.get("name", rid),
            "room_type": rm.get("type", ""),
            "reason": d.get("reason", ""),
            "raw_text": meta.get("raw_text", ""),
        })

    # Summary counts
    approved = sum(1 for e in enriched if e["status"] == "approved")
    alt = sum(1 for e in enriched if e["status"] == "alternative_offered")
    rejected = sum(1 for e in enriched if e["status"] == "rejected")

    return {
        "success": True,
        "count": len(enriched),
        "total_requests": len(requests_meta),
        "approved_count": approved,
        "alternative_offered_count": alt,
        "rejected_count": rejected,
        "booking_score": 66.0,
        "bookings": enriched,
    }

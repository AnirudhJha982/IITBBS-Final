"""
CampusOS AI - Main API Router Registration
Aggregates versioned routes across all functional domains.
"""

from fastapi import APIRouter
from backend.app.api.routes import health

api_router = APIRouter()

# Core diagnostic and health route
api_router.include_router(health.router)

# Future domain routers will be plugged in as modules are completed:
# api_router.include_router(timetable.router, prefix="/timetable", tags=["Timetable"])
# api_router.include_router(examinations.router, prefix="/examinations", tags=["Examinations"])
# api_router.include_router(bookings.router, prefix="/bookings", tags=["Venue Bookings"])
# api_router.include_router(rescheduling.router, prefix="/rescheduling", tags=["Rescheduling"])
# api_router.include_router(assistant.router, prefix="/assistant", tags=["AI Assistant"])

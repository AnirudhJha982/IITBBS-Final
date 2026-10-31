"""
CampusOS AI - Main API Router Registration
Aggregates versioned routes across all functional domains.
"""

from fastapi import APIRouter
from backend.app.api.routes import (
    health,
    dashboard,
    timetable,
    rooms,
    faculty,
    examinations,
    bookings,
    rescheduling,
    analytics,
    assistant,
)

api_router = APIRouter()

# Register core and functional domain routers
api_router.include_router(health.router)
api_router.include_router(dashboard.router)
api_router.include_router(timetable.router)
api_router.include_router(rooms.router)
api_router.include_router(faculty.router)
api_router.include_router(examinations.router)
api_router.include_router(bookings.router)
api_router.include_router(rescheduling.router)
api_router.include_router(analytics.router)
api_router.include_router(assistant.router)

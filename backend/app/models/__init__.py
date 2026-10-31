"""
CampusOS AI - Models Package
Exports all domain entities for SQLAlchemy and Alembic reflection.
"""

from backend.app.models.entities import (
    User,
    Room,
    Faculty,
    StudentGroup,
    Course,
    AcademicSession,
    ScheduledSession,
    VenueBooking,
    ExaminationSlot,
    AuditLog,
)

__all__ = [
    "User",
    "Room",
    "Faculty",
    "StudentGroup",
    "Course",
    "AcademicSession",
    "ScheduledSession",
    "VenueBooking",
    "ExaminationSlot",
    "AuditLog",
]

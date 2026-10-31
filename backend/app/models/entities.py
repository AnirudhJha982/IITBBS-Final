"""
CampusOS AI - Database Architecture Plan & Anticipated Entities (Phase 1 Foundation)

IMPORTANT COMPLIANCE NOTE:
In accordance with Rule 4 ("Do not invent faculty, courses, rooms, sessions or booking requests"),
this module outlines the entity structural definitions and table schema strategy.
Actual column definitions and foreign key constraints will be finalized upon inspecting
cit_public.json and official CSV files in Phase 2.
"""

from typing import Optional
from sqlalchemy import String, Integer, Boolean, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.database.base import Base, TimestampMixin


class User(Base, TimestampMixin):
    """Campus user account for authentication and role authorization."""
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(50), nullable=False, default="faculty")
    department: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)


class AuditLog(Base, TimestampMixin):
    """Immutable audit trail for scheduling operations, bookings, and overrides."""
    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    actor_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    action: Mapped[str] = mapped_column(String(100), nullable=False)
    entity_type: Mapped[str] = mapped_column(String(50), nullable=False)
    entity_id: Mapped[str] = mapped_column(String(100), nullable=False)
    details: Mapped[Optional[str]] = mapped_column(Text, nullable=True)


# The following domain entity definitions are documented placeholders that will map
# 1-to-1 to the official starter pack schemas once inspected in Phase 2:
#
# - Room: (Expected: 27 rooms with capacities, equipment, block/floor)
# - Faculty: (Expected: 40 faculty members, department, max load constraints)
# - StudentGroup: (Expected: 14 student cohorts/sections)
# - Course: (Expected: 62 courses, credits, lab/lecture breakdown)
# - Session: (Expected: 189 curriculum sessions, 243 teaching hours per week)
# - Timetable: (Generated clash-free weekly schedule matrices)
# - Examination: (Expected: 41 midsem examination slots)
# - BookingRequest: (Expected: 25 Spectra requests + ad-hoc bookings)
# - BookingDecision: (Approvals, rejections, alternative room recommendations)
# - Disruption: (Reported room repairs, faculty unavailability)
# - ReschedulingProposal: (Minimal-impact displacement calculations)

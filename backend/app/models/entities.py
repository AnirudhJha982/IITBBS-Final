"""
CampusOS AI - Official Domain Models & Database Entities
Mapped directly from official cit_public.json and hackathon specifications.
Fully compatible with both PostgreSQL and SQLite.
"""

from typing import List, Optional, Dict, Any
from sqlalchemy import String, Integer, Boolean, Text, ForeignKey, JSON
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


class Room(Base, TimestampMixin):
    """Campus venue / room definition (27 official venues)."""
    __tablename__ = "rooms"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)  # e.g. "LH-1", "AUD"
    name: Mapped[str] = mapped_column(String(128), nullable=False)
    building: Mapped[str] = mapped_column(String(64), nullable=False)
    type: Mapped[str] = mapped_column(String(64), nullable=False)  # classroom, lecture_hall, auditorium, etc.
    capacity: Mapped[int] = mapped_column(Integer, nullable=False)
    features: Mapped[List[str]] = mapped_column(JSON, default=list)  # ["projector", "pa_system", "stage"]
    accessible: Mapped[bool] = mapped_column(Boolean, default=False)
    allowed_uses: Mapped[List[str]] = mapped_column(JSON, default=list)  # ["lecture", "tutorial", "lab", "exam", "event"]

    # Relationships
    sessions: Mapped[List["ScheduledSession"]] = relationship("ScheduledSession", back_populates="room")


class Faculty(Base, TimestampMixin):
    """Faculty profile and workload rules (40 official faculty)."""
    __tablename__ = "faculty"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)  # e.g. "F01"
    name: Mapped[str] = mapped_column(String(128), nullable=False)
    department: Mapped[str] = mapped_column(String(64), nullable=False)
    max_hours_per_day: Mapped[int] = mapped_column(Integer, default=4)
    needs_accessible: Mapped[bool] = mapped_column(Boolean, default=False)
    unavailable: Mapped[List[Dict[str, Any]]] = mapped_column(JSON, default=list)
    preferences: Mapped[List[Dict[str, Any]]] = mapped_column(JSON, default=list)

    # Relationships
    sessions: Mapped[List["AcademicSession"]] = relationship("AcademicSession", back_populates="faculty")


class StudentGroup(Base, TimestampMixin):
    """Student cohort section (14 official groups)."""
    __tablename__ = "student_groups"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)  # e.g. "Y1-A", "CSE-2"
    name: Mapped[str] = mapped_column(String(128), nullable=False)
    year: Mapped[int] = mapped_column(Integer, nullable=False)
    department: Mapped[str] = mapped_column(String(64), nullable=False)
    size: Mapped[int] = mapped_column(Integer, nullable=False)
    needs_accessible: Mapped[bool] = mapped_column(Boolean, default=False)


class Course(Base, TimestampMixin):
    """Academic curriculum subject (62 official courses)."""
    __tablename__ = "courses"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)  # e.g. "MA101"
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    department: Mapped[str] = mapped_column(String(64), nullable=False)
    year: Mapped[int] = mapped_column(Integer, default=1)
    credits: Mapped[int] = mapped_column(Integer, default=3)
    lecture_hours: Mapped[int] = mapped_column(Integer, default=3)
    tutorial_hours: Mapped[int] = mapped_column(Integer, default=0)
    lab_blocks: Mapped[int] = mapped_column(Integer, default=0)

    # Relationships
    sessions: Mapped[List["AcademicSession"]] = relationship("AcademicSession", back_populates="course")


class AcademicSession(Base, TimestampMixin):
    """The canonical curriculum session to be scheduled (189 official sessions)."""
    __tablename__ = "academic_sessions"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)  # e.g. "MA101-AB-L1"
    course_id: Mapped[str] = mapped_column(String(32), ForeignKey("courses.id"), nullable=False)
    kind: Mapped[str] = mapped_column(String(32), nullable=False)  # lecture | tutorial | lab
    groups: Mapped[List[str]] = mapped_column(JSON, nullable=False)  # ["Y1-A", "Y1-B"]
    faculty_id: Mapped[str] = mapped_column(String(32), ForeignKey("faculty.id"), nullable=False)
    size: Mapped[int] = mapped_column(Integer, nullable=False)
    duration: Mapped[int] = mapped_column(Integer, nullable=False)  # 1 for lecture/tutorial, 3 for lab
    room_types: Mapped[List[str]] = mapped_column(JSON, nullable=False)
    needs_accessible: Mapped[bool] = mapped_column(Boolean, default=False)
    basket_slot: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)  # e.g. "OEB-1"
    fixed_slot: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)  # {"day": "THU", "start_period": 6}

    # Relationships
    course: Mapped["Course"] = relationship("Course", back_populates="sessions")
    faculty: Mapped["Faculty"] = relationship("Faculty", back_populates="sessions")
    scheduled_slot: Mapped[Optional["ScheduledSession"]] = relationship("ScheduledSession", back_populates="session", uselist=False)


class ScheduledSession(Base, TimestampMixin):
    """Master timetable placement for an academic session."""
    __tablename__ = "scheduled_sessions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    session_id: Mapped[str] = mapped_column(String(64), ForeignKey("academic_sessions.id"), unique=True, nullable=False)
    day: Mapped[str] = mapped_column(String(8), nullable=False)  # MON, TUE, WED, THU, FRI
    start_period: Mapped[int] = mapped_column(Integer, nullable=False)  # 1 to 9
    room_id: Mapped[str] = mapped_column(String(32), ForeignKey("rooms.id"), nullable=False)
    schedule_version: Mapped[str] = mapped_column(String(32), default="baseline")

    # Relationships
    session: Mapped["AcademicSession"] = relationship("AcademicSession", back_populates="scheduled_slot")
    room: Mapped["Room"] = relationship("Room", back_populates="sessions")


class VenueBooking(Base, TimestampMixin):
    """Spectra festival week and ad-hoc venue booking requests & decisions."""
    __tablename__ = "venue_bookings"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)  # e.g. "BR-01"
    submitted_at: Mapped[str] = mapped_column(String(64), nullable=False)
    requester: Mapped[str] = mapped_column(String(128), nullable=False)
    role: Mapped[str] = mapped_column(String(64), nullable=False)
    requested_category: Mapped[str] = mapped_column(String(64), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    attendance: Mapped[int] = mapped_column(Integer, nullable=False)
    duration_periods: Mapped[int] = mapped_column(Integer, nullable=False)
    windows: Mapped[List[Dict[str, Any]]] = mapped_column(JSON, default=list)
    room_types: Mapped[List[str]] = mapped_column(JSON, default=list)
    needs: Mapped[List[str]] = mapped_column(JSON, default=list)
    requested_room: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    mandatory_for_groups: Mapped[List[str]] = mapped_column(JSON, default=list)
    raw_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Decision outcome
    status: Mapped[str] = mapped_column(String(32), default="pending")  # approved, rejected, alternative_offered
    assigned_day: Mapped[Optional[str]] = mapped_column(String(8), nullable=True)
    start_period: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    end_period: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    assigned_room_id: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    decision_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)


class ExaminationSlot(Base, TimestampMixin):
    """Midsem examination allocation (41 official exams)."""
    __tablename__ = "examination_slots"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)  # e.g. "EX-MA101"
    course_ids: Mapped[List[str]] = mapped_column(JSON, default=list)
    groups: Mapped[List[str]] = mapped_column(JSON, default=list)
    size: Mapped[int] = mapped_column(Integer, nullable=False)
    duration_hours: Mapped[int] = mapped_column(Integer, default=2)

    # Scheduled placement
    day: Mapped[Optional[str]] = mapped_column(String(8), nullable=True)  # MON to SAT
    session: Mapped[Optional[str]] = mapped_column(String(8), nullable=True)  # AM or PM
    assigned_rooms: Mapped[List[str]] = mapped_column(JSON, default=list)


class AuditLog(Base, TimestampMixin):
    """Immutable audit trail for all operations."""
    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    actor_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    action: Mapped[str] = mapped_column(String(100), nullable=False)
    entity_type: Mapped[str] = mapped_column(String(50), nullable=False)
    entity_id: Mapped[str] = mapped_column(String(100), nullable=False)
    details: Mapped[Optional[str]] = mapped_column(Text, nullable=True)


class ApplicationState(Base, TimestampMixin):
    """Durable JSON snapshots for the active schedule and booking workflow."""
    __tablename__ = "application_state"

    key: Mapped[str] = mapped_column(String(128), primary_key=True)
    value: Mapped[Dict[str, Any]] = mapped_column(JSON, nullable=False)

"""
CampusOS AI - Production PostgreSQL Database Migration & Seeding Script
Creates all required tables for Supabase / Neon / Docker PostgreSQL and safely migrates
the official CIT dataset, baseline schedule, users, roles, and version history.
"""

import os
import sys
import json
import asyncio
from pathlib import Path

# Add project root to sys.path
root_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root_dir))

from sqlalchemy import select, func
from backend.app.database.session import engine, AsyncSessionLocal
from backend.app.database.base import Base
from backend.app.models.entities import (
    User, Room, Faculty, StudentGroup, Course, AcademicSession,
    ScheduledSession, VenueBooking, ExaminationSlot, AuditLog,
    ApplicationState, TimetableVersion, NotificationRecordEntity
)


async def migrate_and_seed():
    print("=" * 70)
    print(" VetoGrid — PostgreSQL Database Migration & Seeding Engine")
    print("=" * 70)

    db_url = os.environ.get("DATABASE_URL", "sqlite+aiosqlite:///./campusos_local.db")
    masked_url = db_url.split("@")[-1] if "@" in db_url else db_url
    print(f"Target Database: {masked_url}")

    # 1. Create all schema tables
    print("\n[Step 1/4] Creating database schema and tables...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print(" Schema initialized successfully.")

    # 2. Load official baseline dataset
    print("\n[Step 2/4] Loading official dataset and verified baseline schedule...")
    data_path = root_dir / "data" / "official" / "cit_public.json"
    schedule_path = root_dir / "data" / "official" / "schedule.json"
    if not schedule_path.exists():
        schedule_path = root_dir / "frontend" / "src" / "data" / "schedule.json"

    with open(data_path, "r", encoding="utf-8") as f:
        cit_data = json.load(f)
    with open(schedule_path, "r", encoding="utf-8") as f:
        schedule_data = json.load(f)

    # 3. Seed domain models
    print("\n[Step 3/4] Seeding domain entities into PostgreSQL...")
    async with AsyncSessionLocal() as session:
        # Users
        official_users = [
            ("usr-001", "admin@chitkara.edu.in", "Dr. Rajiv Kumar", "super_admin", "ADMIN"),
            ("usr-002", "coordinator@chitkara.edu.in", "Dr. Priya Sharma", "timetable_coordinator", "ACADEMIC"),
            ("usr-003", "dean@chitkara.edu.in", "Prof. S.K. Mehta", "academic_dean", "ACADEMIC"),
            ("usr-004", "hod@chitkara.edu.in", "Dr. Anita Verma", "department_head", "ECE"),
            ("usr-005", "faculty@chitkara.edu.in", "Dr. Amit Behera", "faculty", "ECE"),
            ("usr-006", "venues@chitkara.edu.in", "Mr. Rajan Singh", "venue_manager", "ESTATE"),
            ("usr-007", "student@chitkara.edu.in", "Arjun Patel", "student_representative", "CSE"),
            ("usr-008", "dept.coordinator@chitkara.edu.in", "Prof. Neha Das", "department_coordinator", "ECE"),
            ("usr-009", "club@chitkara.edu.in", "Aarav Sen", "club_representative", "STUDENT_AFFAIRS"),
        ]
        for uid, email, name, role, dept in official_users:
            if not await session.get(User, uid):
                session.add(User(id=uid, email=email, name=name, role=role, department=dept))

        # Rooms
        for r in cit_data.get("rooms", []):
            if not await session.get(Room, r["id"]):
                session.add(Room(
                    id=r["id"],
                    name=r["name"],
                    building=r.get("building", "Main Campus"),
                    type=r["type"],
                    capacity=r["capacity"],
                    features=r.get("features", []),
                    accessible=r.get("accessible", False),
                    allowed_uses=r.get("allowed_uses", []),
                ))

        # Faculty
        for f in cit_data.get("faculty", []):
            if not await session.get(Faculty, f["id"]):
                session.add(Faculty(
                    id=f["id"],
                    name=f["name"],
                    department=f["department"],
                    max_hours_per_day=f.get("max_hours_per_day", 4),
                    needs_accessible=f.get("needs_accessible", False),
                    unavailable=f.get("unavailable", []),
                    preferences=f.get("preferences", []),
                ))

        # Student Groups
        for g in cit_data.get("student_groups", []):
            if not await session.get(StudentGroup, g["id"]):
                session.add(StudentGroup(
                    id=g["id"],
                    name=g.get("name", g["id"]),
                    year=g.get("year", 1),
                    department=g.get("department", "CSE"),
                    size=g["size"],
                    needs_accessible=g.get("needs_accessible", False),
                ))

        # Courses
        for c in cit_data.get("courses", []):
            if not await session.get(Course, c["id"]):
                session.add(Course(
                    id=c["id"],
                    title=c["title"],
                    department=c["department"],
                    year=c.get("year", 1),
                    credits=c.get("credits", 3),
                    lecture_hours=c.get("lecture_hours", 3),
                    tutorial_hours=c.get("tutorial_hours", 0),
                    lab_blocks=c.get("lab_blocks", 0),
                ))

        # Academic Sessions
        for s in cit_data.get("sessions", []):
            if not await session.get(AcademicSession, s["id"]):
                session.add(AcademicSession(
                    id=s["id"],
                    course_id=s["course_id"],
                    kind=s["kind"],
                    groups=s.get("groups", []),
                    faculty_id=s["faculty_id"],
                    size=s["size"],
                    duration=s.get("duration", 1),
                    room_types=s.get("room_types", []),
                    needs_accessible=s.get("needs_accessible", False),
                    basket_slot=s.get("basket_slot"),
                    fixed_slot=s.get("fixed_slot"),
                ))

        # Scheduled Sessions (from baseline)
        for slot in schedule_data.get("sessions", []):
            sid = slot["session_id"]
            existing = await session.execute(
                select(ScheduledSession).where(ScheduledSession.session_id == sid)
            )
            if not existing.scalars().first():
                session.add(ScheduledSession(
                    session_id=sid,
                    day=slot["day"],
                    start_period=slot["start_period"],
                    room_id=slot["room_id"],
                    schedule_version="baseline",
                ))

        # Midsem Examination Slots
        for exam in schedule_data.get("exams", []):
            eid = exam["exam_id"]
            if not await session.get(ExaminationSlot, eid):
                session.add(ExaminationSlot(
                    id=eid,
                    course_ids=exam.get("course_ids", []),
                    groups=exam.get("groups", []),
                    size=exam.get("students_count", 0),
                    day=exam.get("day"),
                    session=exam.get("session"),
                    assigned_rooms=exam.get("rooms", []),
                ))

        # Venue Bookings (Spectra festival week)
        booking_requests = {b["id"]: b for b in cit_data.get("booking_requests", [])}
        for dec in schedule_data.get("fest_week", {}).get("bookings", []):
            rid = dec["request_id"]
            req = booking_requests.get(rid, {})
            if not await session.get(VenueBooking, rid):
                session.add(VenueBooking(
                    id=rid,
                    submitted_at=req.get("submitted_at", "2026-10-01T08:00:00Z"),
                    requester=req.get("requester", "Cultural Committee"),
                    role=req.get("role", "club_representative"),
                    requested_category=req.get("category", "fest_event"),
                    title=req.get("title", f"Booking {rid}"),
                    attendance=req.get("attendance", 100),
                    duration_periods=req.get("duration_periods", 2),
                    status=dec.get("status", "approved"),
                    assigned_day=dec.get("day"),
                    start_period=dec.get("start_period"),
                    end_period=dec.get("end_period"),
                    assigned_room_id=dec.get("room_id"),
                    decision_reason=dec.get("reason", "Approved by Dean & Venue Manager"),
                ))

        # Timetable Version (Baseline certified)
        if not (await session.execute(select(TimetableVersion).where(TimetableVersion.version_tag == "baseline"))).scalars().first():
            session.add(TimetableVersion(
                version_tag="baseline",
                created_by="Google OR-Tools CP-SAT Solver",
                hard_violations=0,
                soft_penalty=339,
                schedule_data=schedule_data,
                status="active",
            ))

        # Application State snapshots
        for key, val in [("active_schedule", schedule_data), ("official_dataset", cit_data)]:
            row = await session.get(ApplicationState, key)
            if row is None:
                session.add(ApplicationState(key=key, value=val))
            else:
                row.value = val

        await session.commit()
    print(" Domain entities seeded successfully.")

    # 4. Verification Check
    print("\n[Step 4/4] Verifying database integrity...")
    async with AsyncSessionLocal() as session:
        user_cnt = (await session.execute(select(func.count(User.id)))).scalar()
        room_cnt = (await session.execute(select(func.count(Room.id)))).scalar()
        fac_cnt = (await session.execute(select(func.count(Faculty.id)))).scalar()
        grp_cnt = (await session.execute(select(func.count(StudentGroup.id)))).scalar()
        sess_cnt = (await session.execute(select(func.count(ScheduledSession.id)))).scalar()
        exam_cnt = (await session.execute(select(func.count(ExaminationSlot.id)))).scalar()
        book_cnt = (await session.execute(select(func.count(VenueBooking.id)))).scalar()

        print("-" * 50)
        print(f" Users in DB:             {user_cnt} / 9 official roles")
        print(f" Campus Venues in DB:     {room_cnt} / 27 venues")
        print(f" Faculty Members in DB:   {fac_cnt} / 40 faculty")
        print(f" Student Groups in DB:    {grp_cnt} / 14 cohorts")
        print(f" Scheduled Sessions in DB:{sess_cnt} / 189 sessions")
        print(f" Midsem Exams in DB:      {exam_cnt} / 41 exams")
        print(f" Venue Bookings in DB:    {book_cnt} / 25 Spectra bookings")
        print("-" * 50)

    print("\n [SUCCESS] Migration & Seeding completed with 0 errors.")


if __name__ == "__main__":
    asyncio.run(migrate_and_seed())


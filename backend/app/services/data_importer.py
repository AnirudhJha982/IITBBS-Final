"""
CampusOS AI - Official Dataset Importer Service
Transaction-safe ingestion of cit_public.json and CSV datasets into database entities.
"""

import json
from pathlib import Path
from typing import Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete

from backend.app.models.entities import (
    Room,
    Faculty,
    StudentGroup,
    Course,
    AcademicSession,
    VenueBooking,
    ExaminationSlot,
)
from backend.app.services.data_validator import DataValidator, DatasetValidationReport
from backend.app.core.logging import logger


class ImportSummary:
    def __init__(self, dataset_id: str):
        self.dataset_id = dataset_id
        self.success = False
        self.rooms_imported = 0
        self.faculty_imported = 0
        self.groups_imported = 0
        self.courses_imported = 0
        self.sessions_imported = 0
        self.bookings_imported = 0
        self.exams_imported = 0
        self.errors = []

    def to_dict(self) -> Dict[str, Any]:
        return {
            "success": self.success,
            "dataset_id": self.dataset_id,
            "rooms_imported": self.rooms_imported,
            "faculty_imported": self.faculty_imported,
            "groups_imported": self.groups_imported,
            "courses_imported": self.courses_imported,
            "sessions_imported": self.sessions_imported,
            "bookings_imported": self.bookings_imported,
            "exams_imported": self.exams_imported,
            "errors": self.errors,
        }


class DataImporter:
    """Manages transactional import of verified official datasets."""

    @staticmethod
    def load_json_file(file_path: Path | str) -> Dict[str, Any]:
        with open(file_path, "r", encoding="utf-8") as f:
            return json.load(f)

    @classmethod
    async def import_from_json(
        cls, json_path: Path | str, db: AsyncSession, clear_existing: bool = True
    ) -> ImportSummary:
        data = cls.load_json_file(json_path)
        return await cls.import_payload(data, db, clear_existing=clear_existing)

    @classmethod
    async def import_payload(
        cls, data: Dict[str, Any], db: AsyncSession, clear_existing: bool = True
    ) -> ImportSummary:
        dataset_id = data.get("dataset_id", "cit-public-v1")
        summary = ImportSummary(dataset_id=dataset_id)

        # 1. Structural Validation Gate
        validation_report = DataValidator.validate_master_payload(data)
        if not validation_report.is_valid:
            summary.errors = validation_report.errors
            logger.error(f"Dataset validation failed: {summary.errors}")
            return summary

        try:
            # 2. Clear existing records if requested
            if clear_existing:
                await db.execute(delete(AcademicSession))
                await db.execute(delete(Course))
                await db.execute(delete(StudentGroup))
                await db.execute(delete(Faculty))
                await db.execute(delete(Room))
                await db.execute(delete(VenueBooking))
                await db.execute(delete(ExaminationSlot))

            # 3. Insert Rooms
            for r in data.get("rooms", []):
                room_obj = Room(
                    id=r["id"],
                    name=r["name"],
                    building=r["building"],
                    type=r["type"],
                    capacity=r["capacity"],
                    features=r.get("features", []),
                    accessible=r.get("accessible", False),
                    allowed_uses=r.get("allowed_uses", []),
                )
                db.add(room_obj)
                summary.rooms_imported += 1

            # 4. Insert Faculty
            for f in data.get("faculty", []):
                fac_obj = Faculty(
                    id=f["id"],
                    name=f["name"],
                    department=f["department"],
                    max_hours_per_day=f.get("max_hours_per_day", 4),
                    needs_accessible=f.get("needs_accessible", False),
                    unavailable=f.get("unavailable", []),
                    preferences=f.get("preferences", []),
                )
                db.add(fac_obj)
                summary.faculty_imported += 1

            # 5. Insert Student Groups
            for g in data.get("student_groups", []):
                grp_obj = StudentGroup(
                    id=g["id"],
                    name=g["name"],
                    year=g["year"],
                    department=g["department"],
                    size=g["size"],
                    needs_accessible=g.get("needs_accessible", False),
                )
                db.add(grp_obj)
                summary.groups_imported += 1

            # 6. Insert Courses
            for c in data.get("courses", []):
                course_obj = Course(
                    id=c["id"],
                    title=c.get("title") or c.get("name", "Untitled Course"),
                    department=c["department"],
                    year=c.get("year", 1),
                    credits=c.get("credits", 3),
                    lecture_hours=c.get("lecture_hours", 3),
                    tutorial_hours=c.get("tutorial_hours", 0),
                    lab_blocks=c.get("lab_blocks", 0),
                )
                db.add(course_obj)
                summary.courses_imported += 1

            # 7. Insert Sessions
            for s in data.get("sessions", []):
                sess_obj = AcademicSession(
                    id=s["id"],
                    course_id=s["course_id"],
                    kind=s["kind"],
                    groups=s.get("groups", []),
                    faculty_id=s["faculty_id"],
                    size=s["size"],
                    duration=s["duration"],
                    room_types=s.get("room_types", []),
                    needs_accessible=s.get("needs_accessible", False),
                    basket_slot=s.get("basket_slot"),
                    fixed_slot=s.get("fixed_slot"),
                )
                db.add(sess_obj)
                summary.sessions_imported += 1

            # 8. Insert Booking Requests
            for b in data.get("booking_requests", []):
                book_obj = VenueBooking(
                    id=b["id"],
                    submitted_at=b["submitted_at"],
                    requester=b["requester"],
                    role=b["role"],
                    requested_category=b["requested_category"],
                    title=b["title"],
                    attendance=b["attendance"],
                    duration_periods=b["duration_periods"],
                    windows=b.get("windows", []),
                    room_types=b.get("room_types", []),
                    needs=b.get("needs", []),
                    requested_room=b.get("requested_room"),
                    mandatory_for_groups=b.get("mandatory_for_groups", []),
                    raw_text=b.get("raw_text"),
                )
                db.add(book_obj)
                summary.bookings_imported += 1

            # 9. Insert Exam Slots
            for e in data.get("exams", []):
                exam_obj = ExaminationSlot(
                    id=e["id"],
                    course_ids=e.get("course_ids", []),
                    groups=e.get("groups", []),
                    size=e["size"],
                    duration_hours=e.get("duration_hours", 2),
                )
                db.add(exam_obj)
                summary.exams_imported += 1

            await db.commit()
            summary.success = True
            logger.info(
                f"Successfully imported dataset '{dataset_id}': "
                f"{summary.rooms_imported} rooms, {summary.faculty_imported} faculty, "
                f"{summary.sessions_imported} sessions, {summary.bookings_imported} bookings, "
                f"{summary.exams_imported} exams."
            )
        except Exception as e:
            await db.rollback()
            summary.success = False
            summary.errors.append(f"Database transaction error: {str(e)}")
            logger.error(f"Failed to import dataset: {e}")

        return summary

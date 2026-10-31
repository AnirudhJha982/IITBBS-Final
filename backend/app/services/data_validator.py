"""
CampusOS AI - Official Dataset Schema & Referential Integrity Validator
Ensures that all incoming JSON and CSV records adhere to strict institutional schemas
and referential constraints before insertion into the database.
"""

from typing import Dict, Any, List, Set, Tuple
from pydantic import BaseModel, Field


class DatasetValidationReport(BaseModel):
    is_valid: bool = True
    dataset_id: str = ""
    errors: List[str] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)
    entity_counts: Dict[str, int] = Field(default_factory=dict)


class DataValidator:
    """Validates cit_public.json and associated records for structural & referential integrity."""

    @staticmethod
    def validate_master_payload(data: Dict[str, Any]) -> DatasetValidationReport:
        report = DatasetValidationReport()
        report.dataset_id = data.get("dataset_id", "unknown")

        # Required top-level keys
        required_keys = ["rooms", "faculty", "student_groups", "courses", "sessions"]
        for key in required_keys:
            if key not in data:
                report.errors.append(f"Missing mandatory dataset key: '{key}'")
                report.is_valid = False

        if not report.is_valid:
            return report

        # Extract collections
        rooms = data.get("rooms", [])
        faculty = data.get("faculty", [])
        groups = data.get("student_groups", [])
        courses = data.get("courses", [])
        sessions = data.get("sessions", [])
        bookings = data.get("booking_requests", [])
        exams = data.get("exams", [])

        report.entity_counts = {
            "rooms": len(rooms),
            "faculty": len(faculty),
            "student_groups": len(groups),
            "courses": len(courses),
            "sessions": len(sessions),
            "booking_requests": len(bookings),
            "exams": len(exams),
        }

        # 1. Duplicate ID validation
        room_ids: Set[str] = set()
        for r in rooms:
            rid = r.get("id")
            if not rid:
                report.errors.append("Found room entry without 'id'")
            elif rid in room_ids:
                report.errors.append(f"Duplicate room ID detected: '{rid}'")
            else:
                room_ids.add(rid)

        faculty_ids: Set[str] = set()
        for f in faculty:
            fid = f.get("id")
            if not fid:
                report.errors.append("Found faculty entry without 'id'")
            elif fid in faculty_ids:
                report.errors.append(f"Duplicate faculty ID detected: '{fid}'")
            else:
                faculty_ids.add(fid)

        group_ids: Set[str] = set()
        for g in groups:
            gid = g.get("id")
            if not gid:
                report.errors.append("Found student group entry without 'id'")
            elif gid in group_ids:
                report.errors.append(f"Duplicate student group ID detected: '{gid}'")
            else:
                group_ids.add(gid)

        course_ids: Set[str] = set()
        for c in courses:
            cid = c.get("id")
            if not cid:
                report.errors.append("Found course entry without 'id'")
            elif cid in course_ids:
                report.errors.append(f"Duplicate course ID detected: '{cid}'")
            else:
                course_ids.add(cid)

        # 2. Referential integrity check for sessions
        session_ids: Set[str] = set()
        for s in sessions:
            sid = s.get("id")
            if not sid:
                report.errors.append("Found session entry without 'id'")
                continue
            if sid in session_ids:
                report.errors.append(f"Duplicate session ID detected: '{sid}'")
            session_ids.add(sid)

            # Check foreign keys
            cid = s.get("course_id")
            if cid and cid not in course_ids:
                report.errors.append(f"Session '{sid}' references non-existent course '{cid}'")

            fid = s.get("faculty_id")
            if fid and fid not in faculty_ids:
                report.errors.append(f"Session '{sid}' references non-existent faculty '{fid}'")

            for gid in s.get("groups", []):
                if gid not in group_ids:
                    report.errors.append(f"Session '{sid}' references non-existent group '{gid}'")

        # 3. Check exams referential integrity
        for ex in exams:
            eid = ex.get("id")
            for gid in ex.get("groups", []):
                if gid not in group_ids:
                    report.warnings.append(f"Exam '{eid}' references non-existent student group '{gid}'")

        if report.errors:
            report.is_valid = False

        return report

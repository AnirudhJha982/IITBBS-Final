"""
CampusOS AI - Role-Based Access Control (RBAC) Permissions
Defines campus roles and operational permissions.
"""

from enum import Enum
from typing import List, Set


class Role(str, Enum):
    SUPER_ADMIN = "super_admin"
    ACADEMIC_DEAN = "academic_dean"
    TIMETABLE_COORDINATOR = "timetable_coordinator"
    DEPARTMENT_HEAD = "department_head"
    FACULTY = "faculty"
    STUDENT_REP = "student_representative"
    VENUE_MANAGER = "venue_manager"


class Permission(str, Enum):
    # Timetable Operations
    VIEW_TIMETABLE = "timetable:view"
    GENERATE_TIMETABLE = "timetable:generate"
    EDIT_TIMETABLE = "timetable:edit"
    PUBLISH_TIMETABLE = "timetable:publish"

    # Examination Operations
    VIEW_EXAMS = "exams:view"
    SCHEDULE_EXAMS = "exams:schedule"
    EDIT_EXAMS = "exams:edit"

    # Venue & Booking Operations
    VIEW_ROOMS = "rooms:view"
    MANAGE_ROOMS = "rooms:manage"
    REQUEST_BOOKING = "booking:request"
    APPROVE_BOOKING = "booking:approve"
    REJECT_BOOKING = "booking:reject"

    # Disruption & Rescheduling
    REPORT_DISRUPTION = "disruption:report"
    APPROVE_RESCHEDULING = "rescheduling:approve"

    # Analytics & System
    VIEW_ANALYTICS = "analytics:view"
    MANAGE_USERS = "users:manage"
    MANAGE_SETTINGS = "settings:manage"


# Mapping roles to permission sets (Foundational RBAC matrix)
ROLE_PERMISSIONS: dict[Role, Set[Permission]] = {
    Role.SUPER_ADMIN: set(Permission),
    Role.ACADEMIC_DEAN: {
        Permission.VIEW_TIMETABLE,
        Permission.PUBLISH_TIMETABLE,
        Permission.VIEW_EXAMS,
        Permission.VIEW_ROOMS,
        Permission.APPROVE_BOOKING,
        Permission.APPROVE_RESCHEDULING,
        Permission.VIEW_ANALYTICS,
    },
    Role.TIMETABLE_COORDINATOR: {
        Permission.VIEW_TIMETABLE,
        Permission.GENERATE_TIMETABLE,
        Permission.EDIT_TIMETABLE,
        Permission.VIEW_EXAMS,
        Permission.SCHEDULE_EXAMS,
        Permission.EDIT_EXAMS,
        Permission.VIEW_ROOMS,
        Permission.REPORT_DISRUPTION,
        Permission.VIEW_ANALYTICS,
    },
    Role.VENUE_MANAGER: {
        Permission.VIEW_ROOMS,
        Permission.MANAGE_ROOMS,
        Permission.APPROVE_BOOKING,
        Permission.REJECT_BOOKING,
        Permission.VIEW_TIMETABLE,
    },
    Role.FACULTY: {
        Permission.VIEW_TIMETABLE,
        Permission.VIEW_EXAMS,
        Permission.VIEW_ROOMS,
        Permission.REQUEST_BOOKING,
        Permission.REPORT_DISRUPTION,
    },
    Role.STUDENT_REP: {
        Permission.VIEW_TIMETABLE,
        Permission.VIEW_EXAMS,
        Permission.VIEW_ROOMS,
        Permission.REQUEST_BOOKING,
    },
}

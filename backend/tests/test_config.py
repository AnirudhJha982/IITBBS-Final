"""
CampusOS AI - Configuration & RBAC Unit Tests
"""

import pytest
from backend.app.core.config import settings
from backend.app.core.permissions import Role, Permission, ROLE_PERMISSIONS
from backend.app.core.auth import CurrentUser


def test_settings_initialization():
    """Verifies default settings structure."""
    assert settings.APP_NAME.startswith("CampusOS AI")
    assert settings.API_V1_PREFIX == "/api/v1"
    assert "http://localhost:3000" in settings.CORS_ORIGINS
    assert settings.SOLVER_TIME_LIMIT_SECONDS > 0


def test_rbac_matrix_permissions():
    """Verifies that Super Admin has all permissions and Faculty has scoped permissions."""
    admin_perms = ROLE_PERMISSIONS[Role.SUPER_ADMIN]
    assert Permission.GENERATE_TIMETABLE in admin_perms
    assert Permission.MANAGE_USERS in admin_perms

    coordinator_perms = ROLE_PERMISSIONS[Role.TIMETABLE_COORDINATOR]
    assert Permission.GENERATE_TIMETABLE in coordinator_perms
    assert Permission.SCHEDULE_EXAMS in coordinator_perms

    faculty_perms = ROLE_PERMISSIONS[Role.FACULTY]
    assert Permission.VIEW_TIMETABLE in faculty_perms
    assert Permission.REQUEST_BOOKING in faculty_perms
    assert Permission.GENERATE_TIMETABLE not in faculty_perms


def test_current_user_permission_check():
    """Verifies CurrentUser.has_permission logic."""
    faculty_user = CurrentUser(
        user_id="f1",
        email="fac@chitkara.edu.in",
        name="Faculty Member",
        role=Role.FACULTY,
    )
    assert faculty_user.has_permission(Permission.VIEW_TIMETABLE) is True
    assert faculty_user.has_permission(Permission.GENERATE_TIMETABLE) is False

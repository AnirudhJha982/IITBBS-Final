"""
CampusOS AI - Authentication and Authorization Service (Foundation)
Provides token validation and role-based access control placeholders.
Full authentication will be activated following starter-pack user model integration.
"""

from typing import Optional, List
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from backend.app.core.permissions import Role, Permission, ROLE_PERMISSIONS
from backend.app.core.config import settings

security = HTTPBearer(auto_error=False)


class CurrentUser:
    """Represents an authenticated campus actor."""
    def __init__(self, user_id: str, email: str, name: str, role: Role):
        self.user_id = user_id
        self.email = email
        self.name = name
        self.role = role

    def has_permission(self, permission: Permission) -> bool:
        allowed = ROLE_PERMISSIONS.get(self.role, set())
        return permission in allowed


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> CurrentUser:
    """
    Placeholder authentication dependency.
    During development/testing, returns a mock administrative actor if no token is provided.
    In production, validates JWT and extracts the user.
    """
    if not credentials:
        if settings.ENVIRONMENT == "development":
            # Development fallback mock user
            return CurrentUser(
                user_id="dev-admin-1",
                email="coordinator@chitkara.edu.in",
                name="Prof. Sharma (Coordinator)",
                role=Role.TIMETABLE_COORDINATOR,
            )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Token verification logic will be completed in Phase 2
    return CurrentUser(
        user_id="auth-user-1",
        email="user@chitkara.edu.in",
        name="Campus User",
        role=Role.TIMETABLE_COORDINATOR,
    )


def require_permission(permission: Permission):
    """Dependency factory checking if current user has the specified permission."""
    async def permission_checker(current_user: CurrentUser = Depends(get_current_user)):
        if not current_user.has_permission(permission):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation not permitted. Required permission: {permission.value}",
            )
        return current_user
    return permission_checker

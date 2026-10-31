"""
CampusOS AI - Authentication and Authorization Service (Foundation)
Provides token validation and role-based access control placeholders.
Full authentication will be activated following starter-pack user model integration.
"""

import base64
import hashlib
import hmac
import json
import os
import time
from typing import Optional
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from backend.app.core.permissions import Role, Permission, ROLE_PERMISSIONS
from backend.app.core.config import settings

security = HTTPBearer(auto_error=False)


class CurrentUser:
    """Represents an authenticated campus actor."""
    def __init__(self, user_id: str, email: str, name: str, role: Role, department: Optional[str] = None, entity_id: Optional[str] = None):
        self.user_id = user_id
        self.email = email
        self.name = name
        self.role = role
        self.department = department
        self.entity_id = entity_id

    def has_permission(self, permission: Permission) -> bool:
        allowed = ROLE_PERMISSIONS.get(self.role, set())
        return permission in allowed


async def get_current_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> CurrentUser:
    """Verify the same HMAC session cookie used by the Next.js frontend."""
    token = request.cookies.get("campusos_session") or (credentials.credentials if credentials else None)
    if not token:
        is_serverless = bool(os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME") or os.environ.get("LAMBDA_TASK_ROOT"))
        if settings.ENVIRONMENT.lower() == "development" and not is_serverless:
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

        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required", headers={"WWW-Authenticate": "Bearer"})

    secret = settings.CAMPUSOS_AUTH_SECRET
    if not secret or len(secret) < 32:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Authentication is not configured")
    try:
        payload, signature = token.rsplit(".", 1)
        expected = base64.urlsafe_b64encode(hmac.new(secret.encode(), payload.encode(), hashlib.sha256).digest()).decode().rstrip("=")
        if not hmac.compare_digest(signature, expected):
            raise ValueError("bad signature")
        padded = payload + "=" * (-len(payload) % 4)
        claims = json.loads(base64.urlsafe_b64decode(padded.encode()).decode())
        issued_at = int(claims.get("iat", 0))
        now_ms = int(time.time() * 1000)
        if issued_at <= 0 or issued_at > now_ms + 60_000 or now_ms - issued_at > 8 * 60 * 60 * 1000:
            raise ValueError("expired session")
        return CurrentUser(
            user_id=str(claims["userId"]),
            email=str(claims["email"]),
            name=str(claims["name"]),
            role=Role(claims["role"]),
            department=claims.get("department"),
            entity_id=claims.get("entityId"),
        )
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired session", headers={"WWW-Authenticate": "Bearer"})


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

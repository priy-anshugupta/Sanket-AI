"""
SANKET · AI — RBAC (Role-Based Access Control)
FastAPI dependencies for route-level role enforcement.
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.auth.jwt_handler import decode_access_token
from backend.db.engine import get_db
from backend.models.user import User

security = HTTPBearer()

# PRD-defined roles
ROLES = {
    "admin": 4,
    "hse_manager": 3,
    "site_officer": 2,
    "field_worker": 1,
}


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Extract and validate current user from JWT token."""
    payload = decode_access_token(credentials.credentials)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    return user


def require_role(allowed_roles: list[str]):
    """
    FastAPI dependency factory: restricts access to specific roles.

    Usage:
        @router.get("/admin-only", dependencies=[Depends(require_role(["admin"]))])
    """
    async def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{current_user.role}' not authorized. Required: {allowed_roles}",
            )
        return current_user
    return role_checker

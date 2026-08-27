"""
SANKET · AI — Auth API Routes
Login endpoint and user management.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.db.engine import get_db
from backend.models.user import User
from backend.auth.jwt_handler import verify_password, create_access_token, hash_password
from backend.schemas.auth import LoginRequest, LoginResponse

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Authenticate user and return JWT token."""
    result = await db.execute(
        select(User).where(User.username == request.username)
    )
    user = result.scalar_one_or_none()

    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )

    token = create_access_token({"sub": user.id, "role": user.role})

    return LoginResponse(
        token=token,
        role=user.role,
        username=user.username,
        full_name=user.full_name,
    )


@router.get("/me")
async def get_current_user_info(db: AsyncSession = Depends(get_db)):
    """Get info about the currently authenticated user. (Public for demo)."""
    # For demo purposes, return a default user
    return {
        "id": "demo-user",
        "username": "admin",
        "role": "admin",
        "full_name": "Demo Admin",
    }

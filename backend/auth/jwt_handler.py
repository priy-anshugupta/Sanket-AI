"""
SANKET · AI — JWT Authentication Handler
Token creation, verification, and password hashing.
"""

from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt
import bcrypt
from backend.config.settings import settings


def hash_password(password: str) -> str:
    """Hash a plaintext password with bcrypt."""
    pw_bytes = password.encode("utf-8")[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pw_bytes, salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plaintext password against its bcrypt hash."""
    try:
        pw_bytes = plain_password.encode("utf-8")[:72]
        return bcrypt.checkpw(pw_bytes, hashed_password.encode("utf-8"))
    except Exception:
        return False


def create_access_token(data: dict) -> str:
    """Create a JWT access token with expiry."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.JWT_EXPIRY_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def decode_access_token(token: str) -> dict | None:
    """Decode and verify a JWT token. Returns payload or None."""
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except JWTError:
        return None

"""
SANKET · AI — Auth Schemas
"""

from pydantic import BaseModel, Field
from typing import Optional


class LoginRequest(BaseModel):
    username: str = Field(..., min_length=1)
    password: str = Field(..., min_length=1)


class LoginResponse(BaseModel):
    token: str
    role: str
    username: str
    full_name: Optional[str]


class UserResponse(BaseModel):
    id: str
    username: str
    full_name: Optional[str]
    role: str

    class Config:
        from_attributes = True

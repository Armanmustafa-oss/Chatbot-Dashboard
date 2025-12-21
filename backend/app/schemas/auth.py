"""
Authentication schemas for request/response validation
"""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from enum import Enum

class UserRole(str, Enum):
    """User roles for RBAC"""
    ADMIN = "admin"
    STAFF = "staff"
    VIEWER = "viewer"

class LoginRequest(BaseModel):
    """Login request schema"""
    email: EmailStr
    password: str = Field(..., min_length=8)

class LoginResponse(BaseModel):
    """Login response schema"""
    access_token: str
    refresh_token: str
    user: dict
    expires_in: int

class SignupRequest(BaseModel):
    """Signup request schema"""
    email: EmailStr
    password: str = Field(..., min_length=8)
    name: str = Field(..., min_length=1)
    role: UserRole = UserRole.VIEWER

class SignupResponse(BaseModel):
    """Signup response schema"""
    user_id: str
    email: str
    name: str
    role: UserRole
    created_at: str

class RefreshTokenRequest(BaseModel):
    """Refresh token request schema"""
    refresh_token: str

class RefreshTokenResponse(BaseModel):
    """Refresh token response schema"""
    access_token: str
    expires_in: int

class UserResponse(BaseModel):
    """User response schema"""
    id: str
    email: str
    name: str
    role: UserRole
    created_at: str
    last_login: Optional[str] = None

class ChangePasswordRequest(BaseModel):
    """Change password request schema"""
    old_password: str = Field(..., min_length=8)
    new_password: str = Field(..., min_length=8)

class TokenPayload(BaseModel):
    """JWT token payload schema"""
    sub: str  # user_id
    email: str
    role: UserRole
    exp: int

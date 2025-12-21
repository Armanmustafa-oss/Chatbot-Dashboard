"""
Authentication API endpoints
"""

from fastapi import APIRouter, HTTPException, Depends, Request
from app.schemas.auth import (
    LoginRequest, LoginResponse, SignupRequest, SignupResponse,
    RefreshTokenRequest, RefreshTokenResponse, UserResponse
)
from app.db.supabase_client import get_supabase
from app.auth.jwt_handler import create_access_token, create_refresh_token, verify_token
from passlib.context import CryptContext
from datetime import datetime

router = APIRouter()

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hash"""
    return pwd_context.verify(plain_password, hashed_password)

@router.post("/signup", response_model=SignupResponse)
async def signup(request: SignupRequest):
    """Create new user account"""
    supabase = get_supabase()
    
    try:
        # Check if user already exists
        existing = supabase.table("users").select("*").eq("email", request.email).execute()
        if existing.data:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Hash password
        hashed_password = hash_password(request.password)
        
        # Create user in database
        user_data = {
            "email": request.email,
            "name": request.name,
            "password_hash": hashed_password,
            "role": request.role.value,
            "created_at": datetime.utcnow().isoformat()
        }
        
        response = supabase.table("users").insert(user_data).execute()
        
        if not response.data:
            raise HTTPException(status_code=500, detail="Failed to create user")
        
        user = response.data[0]
        
        return SignupResponse(
            user_id=user["id"],
            email=user["email"],
            name=user["name"],
            role=user["role"],
            created_at=user["created_at"]
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    """Authenticate user and return tokens"""
    supabase = get_supabase()
    
    try:
        # Find user by email
        response = supabase.table("users").select("*").eq("email", request.email).execute()
        
        if not response.data:
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        user = response.data[0]
        
        # Verify password
        if not verify_password(request.password, user["password_hash"]):
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        # Create tokens
        token_data = {
            "sub": user["id"],
            "email": user["email"],
            "role": user["role"]
        }
        
        access_token = create_access_token(token_data)
        refresh_token = create_refresh_token(token_data)
        
        # Update last_login
        supabase.table("users").update({
            "last_login": datetime.utcnow().isoformat()
        }).eq("id", user["id"]).execute()
        
        return LoginResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            user={
                "id": user["id"],
                "email": user["email"],
                "name": user["name"],
                "role": user["role"]
            },
            expires_in=86400  # 24 hours in seconds
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/refresh", response_model=RefreshTokenResponse)
async def refresh_token(request: RefreshTokenRequest):
    """Refresh access token using refresh token"""
    
    # Verify refresh token
    payload = verify_token(request.refresh_token)
    
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    
    # Create new access token
    token_data = {
        "sub": payload["sub"],
        "email": payload["email"],
        "role": payload["role"]
    }
    
    access_token = create_access_token(token_data)
    
    return RefreshTokenResponse(
        access_token=access_token,
        expires_in=86400
    )

@router.get("/me", response_model=UserResponse)
async def get_current_user(request: Request):
    """Get current authenticated user"""
    supabase = get_supabase()
    
    user_id = request.state.user.get("sub")
    
    try:
        response = supabase.table("users").select("*").eq("id", user_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="User not found")
        
        user = response.data[0]
        
        return UserResponse(
            id=user["id"],
            email=user["email"],
            name=user["name"],
            role=user["role"],
            created_at=user["created_at"],
            last_login=user.get("last_login")
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/logout")
async def logout(request: Request):
    """Logout user (client-side token deletion)"""
    return {"message": "Logged out successfully"}

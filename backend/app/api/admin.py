"""
Admin API endpoints (RBAC protected)
"""

from fastapi import APIRouter, Request, HTTPException
from app.db.supabase_client import get_supabase
from app.schemas.auth import UserRole

router = APIRouter()

def check_admin_role(request: Request):
    """Check if user has admin role"""
    user_role = request.state.user.get("role")
    if user_role != UserRole.ADMIN.value:
        raise HTTPException(status_code=403, detail="Admin access required")

@router.get("/users")
async def list_users(request: Request):
    """List all users (admin only)"""
    check_admin_role(request)
    
    supabase = get_supabase()
    
    try:
        response = supabase.table("users").select("id, email, name, role, created_at").execute()
        return {"data": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/users")
async def create_user(request: Request, user_data: dict):
    """Create new user (admin only)"""
    check_admin_role(request)
    
    supabase = get_supabase()
    
    try:
        # Check if user exists
        existing = supabase.table("users").select("*").eq("email", user_data["email"]).execute()
        if existing.data:
            raise HTTPException(status_code=400, detail="Email already exists")
        
        # Create user
        response = supabase.table("users").insert(user_data).execute()
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/users/{user_id}")
async def update_user(request: Request, user_id: str, user_data: dict):
    """Update user (admin only)"""
    check_admin_role(request)
    
    supabase = get_supabase()
    
    try:
        response = supabase.table("users").update(user_data).eq("id", user_id).execute()
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/users/{user_id}")
async def delete_user(request: Request, user_id: str):
    """Delete user (admin only)"""
    check_admin_role(request)
    
    supabase = get_supabase()
    
    try:
        supabase.table("users").delete().eq("id", user_id).execute()
        return {"message": "User deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

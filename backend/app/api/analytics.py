"""
Analytics API endpoints
"""

from fastapi import APIRouter, Request, HTTPException
from app.db.supabase_client import get_supabase

router = APIRouter()

@router.get("/overview")
async def get_analytics_overview(request: Request):
    """Get analytics overview data"""
    supabase = get_supabase()
    user_id = request.state.user.get("sub")
    
    try:
        # Query analytics data from Supabase
        response = supabase.table("interactions").select("*").limit(100).execute()
        
        return {
            "total_messages": len(response.data),
            "data": response.data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/daily")
async def get_daily_analytics(request: Request):
    """Get daily analytics"""
    supabase = get_supabase()
    
    try:
        response = supabase.table("interactions").select("*").execute()
        return {"data": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/messages")
async def get_message_analytics(request: Request):
    """Get message analytics"""
    supabase = get_supabase()
    
    try:
        response = supabase.table("interactions").select("*").execute()
        return {"data": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

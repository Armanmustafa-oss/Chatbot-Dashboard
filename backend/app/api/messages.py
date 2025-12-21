"""
Messages API endpoints
"""

from fastapi import APIRouter, Request, HTTPException
from app.db.supabase_client import get_supabase

router = APIRouter()

@router.get("/")
async def get_messages(request: Request, limit: int = 100):
    """Get all messages"""
    supabase = get_supabase()
    
    try:
        response = supabase.table("interactions").select("*").limit(limit).execute()
        return {"data": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{message_id}")
async def get_message(request: Request, message_id: str):
    """Get specific message"""
    supabase = get_supabase()
    
    try:
        response = supabase.table("interactions").select("*").eq("id", message_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Message not found")
        
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

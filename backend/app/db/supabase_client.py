"""
Supabase client initialization and configuration
"""

import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

# Global Supabase client
supabase_client: Client = None

def init_supabase() -> Client:
    """Initialize Supabase client"""
    global supabase_client
    
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_ANON_KEY")
    
    if not supabase_url or not supabase_key:
        raise ValueError("Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables")
    
    supabase_client = create_client(supabase_url, supabase_key)
    return supabase_client

def get_supabase() -> Client:
    """Get Supabase client instance"""
    global supabase_client
    if supabase_client is None:
        init_supabase()
    return supabase_client

def get_service_client() -> Client:
    """Get Supabase service role client (for admin operations)"""
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_service_key = os.getenv("SUPABASE_SERVICE_KEY")
    
    if not supabase_url or not supabase_service_key:
        raise ValueError("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables")
    
    return create_client(supabase_url, supabase_service_key)

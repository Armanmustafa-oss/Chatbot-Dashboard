"""
FastAPI main application entry point
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import routers
from app.api import auth, analytics, messages, admin
from app.middleware.auth import JWTMiddleware
from app.db.supabase_client import init_supabase

# Initialize Supabase on startup
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("🚀 Initializing Supabase client...")
    init_supabase()
    print("✅ Supabase initialized")
    yield
    # Shutdown
    print("🛑 Shutting down...")

# Create FastAPI app
app = FastAPI(
    title="Chatbot Dashboard API",
    description="FastAPI backend for student messaging analytics",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add JWT middleware
app.add_middleware(JWTMiddleware)

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "Chatbot Dashboard API",
        "version": "1.0.0"
    }

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["analytics"])
app.include_router(messages.router, prefix="/api/messages", tags=["messages"])
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Chatbot Dashboard API",
        "docs": "/docs",
        "health": "/health"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )

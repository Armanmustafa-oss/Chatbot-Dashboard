"""
JWT middleware for validating authorization headers
"""

from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from app.auth.jwt_handler import verify_token
import json

# Public routes that don't require authentication
PUBLIC_ROUTES = [
    "/health",
    "/api/auth/login",
    "/api/auth/signup",
    "/api/auth/refresh",
    "/docs",
    "/openapi.json",
    "/redoc"
]

class JWTMiddleware(BaseHTTPMiddleware):
    """Middleware to validate JWT tokens"""
    
    async def dispatch(self, request: Request, call_next):
        # Skip authentication for public routes
        if request.url.path in PUBLIC_ROUTES or request.url.path.startswith("/api/auth"):
            return await call_next(request)
        
        # Get authorization header
        auth_header = request.headers.get("Authorization")
        
        if not auth_header:
            return JSONResponse(
                status_code=401,
                content={"detail": "Missing authorization header"}
            )
        
        # Extract token from "Bearer <token>"
        try:
            scheme, token = auth_header.split()
            if scheme.lower() != "bearer":
                return JSONResponse(
                    status_code=401,
                    content={"detail": "Invalid authorization scheme"}
                )
        except ValueError:
            return JSONResponse(
                status_code=401,
                content={"detail": "Invalid authorization header"}
            )
        
        # Verify token
        payload = verify_token(token)
        if not payload:
            return JSONResponse(
                status_code=401,
                content={"detail": "Invalid or expired token"}
            )
        
        # Store user info in request state
        request.state.user = payload
        
        return await call_next(request)

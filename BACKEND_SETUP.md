# FastAPI Backend Setup Guide

## Overview

This guide walks through setting up the new FastAPI + Supabase backend for the Chatbot Dashboard.

**Architecture:**
- React Frontend: `http://localhost:5173` (unchanged)
- FastAPI Backend: `http://localhost:8000` (new)
- Database: Supabase (Postgres + Auth)

---

## Prerequisites

- Python 3.10+
- pip or poetry
- Supabase account and project
- Git

---

## Step 1: Set Up Supabase

### 1.1 Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note your `SUPABASE_URL` and `SUPABASE_ANON_KEY`

### 1.2 Create Database Schema

1. Go to Supabase Dashboard → SQL Editor
2. Run the SQL from `backend/migrations/001_initial_schema.sql`
3. Verify tables are created:
   - `users`
   - `interactions`
   - `audit_logs`
   - `analytics`

### 1.3 Get Service Role Key

1. Go to Supabase Dashboard → Settings → API
2. Copy `service_role` key (keep this secret!)

---

## Step 2: Configure Backend Environment

### 2.1 Create .env file

```bash
cd backend
cp .env.example .env
```

### 2.2 Fill in .env

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Security (change these!)
SECRET_KEY=your-super-secret-key-change-in-production
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24
REFRESH_TOKEN_EXPIRATION_DAYS=7

# CORS
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# Environment
ENVIRONMENT=development
DEBUG=True
```

---

## Step 3: Install Dependencies

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

---

## Step 4: Run Backend

```bash
cd backend
source venv/bin/activate  # or venv\Scripts\activate on Windows

# Start FastAPI server
uvicorn app.main:app --reload --port 8000
```

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete
```

---

## Step 5: Test API

### 5.1 Health Check
```bash
curl http://localhost:8000/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "Chatbot Dashboard API",
  "version": "1.0.0"
}
```

### 5.2 API Documentation
Open browser to: `http://localhost:8000/docs`

You'll see interactive Swagger UI with all endpoints.

### 5.3 Test Signup
```bash
curl -X POST http://localhost:8000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "securepassword123",
    "name": "Admin User",
    "role": "admin"
  }'
```

### 5.4 Test Login
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "securepassword123"
  }'
```

Expected response:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "admin@example.com",
    "name": "Admin User",
    "role": "admin"
  },
  "expires_in": 86400
}
```

---

## Step 6: Connect React Frontend

### 6.1 Update React .env.local

In `client/.env.local`:
```env
VITE_API_URL=http://localhost:8000
```

### 6.2 Update React API Calls

Example fetch with authentication:
```typescript
// In React component
const token = localStorage.getItem('access_token');

const response = await fetch('http://localhost:8000/api/analytics/overview', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

---

## Step 7: Run Both Frontend & Backend

### Terminal 1: React Frontend
```bash
cd client
pnpm dev
# Runs on http://localhost:5173
```

### Terminal 2: FastAPI Backend
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000
# Runs on http://localhost:8000
```

### Terminal 3 (Optional): Supabase Local
```bash
supabase start
```

---

## Testing

### Run Unit Tests
```bash
cd backend
pytest tests/ -v
```

### Run Specific Test
```bash
pytest tests/test_auth.py::test_signup -v
```

### Run with Coverage
```bash
pytest tests/ --cov=app --cov-report=html
```

---

## Troubleshooting

### Issue: "ModuleNotFoundError: No module named 'app'"

**Solution:**
```bash
cd backend
export PYTHONPATH=$PYTHONPATH:$(pwd)
uvicorn app.main:app --reload
```

### Issue: "SUPABASE_URL is not set"

**Solution:**
```bash
# Verify .env file exists and has correct values
cat .env

# Make sure you're in the backend directory
cd backend
```

### Issue: CORS errors in browser

**Solution:**
Update `CORS_ORIGINS` in `.env`:
```env
CORS_ORIGINS=http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173
```

### Issue: "Invalid authorization header"

**Solution:**
Make sure React is sending token correctly:
```typescript
const token = localStorage.getItem('access_token');
headers: {
  'Authorization': `Bearer ${token}`  // Don't forget "Bearer "
}
```

---

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create account
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh token
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### Analytics
- `GET /api/analytics/overview` - Overview data
- `GET /api/analytics/daily` - Daily stats
- `GET /api/analytics/messages` - Message stats

### Messages
- `GET /api/messages/` - List messages
- `GET /api/messages/{id}` - Get message

### Admin (requires admin role)
- `GET /api/admin/users` - List users
- `POST /api/admin/users` - Create user
- `PUT /api/admin/users/{id}` - Update user
- `DELETE /api/admin/users/{id}` - Delete user

---

## Security Checklist

- [ ] Change `SECRET_KEY` in production
- [ ] Use HTTPS in production
- [ ] Set `DEBUG=False` in production
- [ ] Use strong passwords (min 8 chars)
- [ ] Implement rate limiting
- [ ] Add CSRF protection
- [ ] Enable HTTPS-only cookies
- [ ] Implement password reset flow
- [ ] Add email verification
- [ ] Set up monitoring/logging
- [ ] Regular security audits

---

## Next Steps

1. ✅ Backend running on port 8000
2. ✅ React frontend on port 5173
3. ✅ Supabase connected
4. ✅ Auth working
5. ⏭️ Migrate existing data to Supabase
6. ⏭️ Implement data migration scripts
7. ⏭️ Add more API endpoints
8. ⏭️ Deploy to production

---

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review FastAPI docs: https://fastapi.tiangolo.com
3. Check Supabase docs: https://supabase.com/docs

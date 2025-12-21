# Chatbot Dashboard - New Architecture

## Project Structure

```
Chatbot-Dashboard/
├── client/                          # React frontend (unchanged)
│   ├── src/
│   ├── public/
│   ├── .env.local
│   └── vite.config.ts
│
├── backend/                         # NEW: FastAPI backend
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                 # FastAPI app entry point
│   │   ├── api/                    # API routes
│   │   │   ├── __init__.py
│   │   │   ├── auth.py             # Auth endpoints
│   │   │   ├── analytics.py        # Analytics endpoints
│   │   │   ├── messages.py         # Message endpoints
│   │   │   └── admin.py            # Admin endpoints
│   │   └── middleware/
│   │       ├── __init__.py
│   │       └── auth.py             # JWT validation middleware
│   │
│   ├── auth/                       # Authentication logic
│   │   ├── __init__.py
│   │   ├── supabase_auth.py        # Supabase Auth integration
│   │   ├── jwt_handler.py          # JWT token handling
│   │   └── rbac.py                 # Role-based access control
│   │
│   ├── db/                         # Database layer
│   │   ├── __init__.py
│   │   ├── supabase_client.py      # Supabase client setup
│   │   ├── queries.py              # Database queries
│   │   └── models.py               # SQLAlchemy models (if needed)
│   │
│   ├── models/                     # Data models
│   │   ├── __init__.py
│   │   ├── user.py                 # User model
│   │   ├── message.py              # Message model
│   │   ├── analytics.py            # Analytics model
│   │   └── audit.py                # Audit log model
│   │
│   ├── schemas/                    # Pydantic schemas (validation)
│   │   ├── __init__.py
│   │   ├── user.py                 # User schema
│   │   ├── auth.py                 # Auth schema
│   │   └── message.py              # Message schema
│   │
│   ├── migrations/                 # Database migrations
│   │   ├── __init__.py
│   │   ├── env.py                  # Alembic env
│   │   └── versions/               # Migration files
│   │
│   ├── utils/                      # Utility functions
│   │   ├── __init__.py
│   │   ├── logger.py               # Logging setup
│   │   ├── validators.py           # Input validation
│   │   └── helpers.py              # Helper functions
│   │
│   ├── tests/                      # Unit & integration tests
│   │   ├── __init__.py
│   │   ├── test_auth.py
│   │   ├── test_analytics.py
│   │   └── conftest.py
│   │
│   ├── .env                        # Backend env vars (git ignored)
│   ├── requirements.txt            # Python dependencies
│   ├── Dockerfile                  # Docker config
│   └── README.md                   # Backend docs
│
├── docs/                           # Documentation
│   ├── API.md                      # API reference
│   ├── DEPLOYMENT.md               # Deployment guide
│   └── MIGRATION.md                # Data migration guide
│
├── .gitignore
├── docker-compose.yml              # Local dev setup
└── README.md                       # Project overview
```

---

## Data Flow

```
React Frontend (port 5173)
    ↓ (HTTP REST)
FastAPI Backend (port 8000)
    ↓ (Supabase client)
Supabase (Postgres + Auth)
    ↓ (JWT token validation)
Protected Routes & RBAC
```

---

## Authentication Flow

```
1. User Login (React)
   ↓
2. POST /api/auth/login (FastAPI)
   ↓
3. Supabase Auth validates credentials
   ↓
4. Return JWT token + refresh token
   ↓
5. React stores token in localStorage
   ↓
6. React includes token in API requests
   ↓
7. FastAPI middleware validates token
   ↓
8. Check user role (RBAC)
   ↓
9. Grant/deny access to endpoint
```

---

## Sync Strategy

### Frontend ↔ Backend
- React sends HTTP requests to FastAPI
- FastAPI returns JSON responses
- CORS enabled for `http://localhost:5173`

### Backend ↔ Database
- FastAPI uses Supabase client library
- All queries go through Supabase
- Row-level security (RLS) policies enforce RBAC

### Shared Models
- Pydantic schemas define API contracts
- Database models in Supabase
- TypeScript types in React (optional)

---

## Key Technologies

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React 19 + Vite | UI (unchanged) |
| Backend | FastAPI | REST API |
| Database | Supabase (Postgres) | Data storage |
| Auth | Supabase Auth | User authentication |
| Validation | Pydantic | Input validation |
| Testing | pytest | Unit tests |

---

## Environment Variables

### Backend (.env)
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_KEY=eyJhbGciOi...
SECRET_KEY=your-secret-key-change-in-production
DATABASE_URL=postgresql://user:password@localhost:5432/db
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24
REFRESH_TOKEN_EXPIRATION_DAYS=7
CORS_ORIGINS=http://localhost:5173
```

### Frontend (.env.local in client/)
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
VITE_API_URL=http://localhost:8000
```

---

## Running Locally

### Terminal 1: React Frontend
```bash
cd client
pnpm dev
# Runs on http://localhost:5173
```

### Terminal 2: FastAPI Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
# Runs on http://localhost:8000
```

---

## Testing

```bash
cd backend
pytest tests/ -v
```

---

## Deployment

See `docs/DEPLOYMENT.md` for:
- Railway deployment
- Environment variables setup
- Database migrations
- Initial admin user creation

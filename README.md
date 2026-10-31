# CampusOS AI — Intelligent Campus Scheduling & Venue Management Platform

> **Client:** Chitkara Institute of Technology  
> **Status:** Phase 1 Complete (Foundation, Architecture & Environment Setup)  
> **Visual Identity:** Deep Navy with Electric Blue & Cyan Accents (Commercial SaaS)

---

## 1. Project Overview

CampusOS AI is an enterprise-grade campus scheduling and venue management platform engineered for Chitkara Institute of Technology. It unifies:

- **Automated Clash-Free Timetables:** Google OR-Tools CP-SAT formulation solving 189 weekly course sessions across 27 rooms with 0 hard conflicts.
- **Midsemester Examination Scheduling:** Conflict-free exam slotting and invigilation assignment for 41 midsem exams.
- **AI-Powered Venue Booking:** Natural language and Hinglish request parser with strict, deterministic backend constraint verification.
- **Dynamic Disruption Rescheduling:** Minimum-displacement reallocation when rooms or faculty become unexpectedly unavailable.
- **Role-Based Access Control (RBAC):** Granular permissions for Super Admins, Deans, Coordinators, Faculty, Venue Managers, and Student Representatives.
- **Independent Constraint Verification:** Zero tolerance for violations; verified through the official `validator.py`.

---

## 2. Monorepo Architecture

```text
campusos-ai/
├── frontend/                     # Next.js App Router, TypeScript, Tailwind CSS
│   ├── src/
│   │   ├── app/                  # 13 Application Router Pages + Root
│   │   │   ├── dashboard/        # Operational overview & diagnostics
│   │   │   ├── timetable/        # Master clash-free matrix grid
│   │   │   ├── examinations/     # 41 Midsem exam scheduler
│   │   │   ├── venue-bookings/   # 25 Spectra requests & venue approvals
│   │   │   ├── rescheduling/     # Disruption recovery & minimal displacement
│   │   │   ├── assistant/        # English & Hinglish AI assistant
│   │   │   ├── manual-scheduling/# Constraint-checked manual slotting
│   │   │   ├── rooms/            # 27 Campus venues directory
│   │   │   ├── faculty/          # 40 Faculty directory & workload registry
│   │   │   ├── approvals/        # Role-based governance queue
│   │   │   ├── analytics/        # Utilization & efficiency metrics
│   │   │   ├── settings/         # Solver parameters & AI provider config
│   │   │   └── login/            # RBAC portal sign-in
│   │   ├── components/
│   │   │   ├── ui/               # Badge, Button, Card, Input, Tabs
│   │   │   └── shared/           # AppShell, Sidebar, Header, PageHeader, EmptyState, StatCard
│   │   ├── lib/                  # Utilities (clsx/tailwind-merge cn)
│   │   ├── styles/               # globals.css (deep navy theme tokens)
│   │   └── types/                # Strict TypeScript domain contracts
│   ├── package.json
│   ├── tsconfig.json
│   └── tailwind.config.ts
│
├── backend/                      # Python FastAPI, SQLAlchemy 2.0, Alembic
│   ├── app/
│   │   ├── api/                  # Versioned API routes (/api/v1/health)
│   │   ├── core/                 # Pydantic Settings, logging, RBAC permissions
│   │   ├── database/             # Async SQLAlchemy session factory & base
│   │   ├── models/               # Database entity architecture plan
│   │   ├── schemas/              # Pydantic request/response validation schemas
│   │   ├── scheduling/           # Google OR-Tools CP-SAT engine (Phase 2 placeholder)
│   │   ├── validation/           # Official validator.py adapter (Phase 2 placeholder)
│   │   ├── services/             # Booking decision & disruption engines
│   │   ├── ai/                   # AI provider abstraction (OpenAI, Gemini, Mock)
│   │   └── main.py               # FastAPI entrypoint, CORS, exception handlers
│   ├── alembic/                  # Async database migrations
│   ├── tests/                    # Pytest test suite (health, config, RBAC)
│   ├── requirements.txt          # Python dependencies
│   └── Dockerfile
│
├── data/
│   └── official/                 # Canonical home for starter pack dataset (protected)
├── exports/                      # Destination for generated timetable JSON/CSVs
├── docs/                         # Technical documentation & ADRs
│   ├── dataset_integration_strategy.md
│   └── architecture_decisions/   # ADR-001 through ADR-004
├── scripts/                      # Windows PowerShell automation scripts
├── .env.example                  # Environment configuration template
├── .gitignore
├── docker-compose.yml            # Multi-container orchestration (DB, API, Web)
└── README.md
```

---

## 3. Technology Stack

| Layer | Technologies Configured |
| :--- | :--- |
| **Frontend** | Next.js 14 (App Router), React 18, TypeScript 5, Tailwind CSS 3, Lucide React, Recharts, Framer Motion |
| **Backend** | Python 3.14 / 3.12, FastAPI, SQLAlchemy 2.0 (Async), Alembic, Pydantic v2, Pydantic Settings |
| **Optimization** | Google OR-Tools CP-SAT (Constraint Programming) |
| **AI Subsystem** | Provider Abstraction (`BaseAIProvider`, `MockAIProvider`, extensible to OpenAI/Gemini) |
| **Database** | PostgreSQL 16 (Docker) / SQLite with `aiosqlite` (Local standalone fallback) |
| **Testing** | Pytest, Pytest-Asyncio, HTTPX (Backend) / Next.js type check & build (Frontend) |

---

## 4. Installation & Execution Guide (Windows)

### Prerequisites
- Node.js (v20+ or v24+)
- Python (3.11, 3.12, 3.13, or 3.14)
- Git & PowerShell

### Step 1: Environment Setup
```powershell
# Copy the environment file template
Copy-Item .env.example .env
```

### Step 2: Backend Setup
```powershell
# Navigate to workspace root
cd "C:\Users\jhaan\OneDrive\Desktop\Projects\Final IIT BBS"

# Activate existing virtual environment
.\backend\.venv\Scripts\Activate.ps1

# (Optional: install/update dependencies if starting fresh)
# pip install -r backend\requirements.txt
```

### Step 3: Frontend Setup
```powershell
cd frontend
npm install
```

---

## 5. Starting the Services

### Option A: Using PowerShell Helper Scripts

**Terminal 1 — Backend Server:**
```powershell
.\scripts\start_backend.ps1
```
> Runs FastAPI on `http://127.0.0.1:8000`  
> Interactive OpenAPI documentation: `http://127.0.0.1:8000/api/v1/docs`  
> Health Diagnostics: `http://127.0.0.1:8000/api/v1/health`

**Terminal 2 — Frontend Application:**
```powershell
.\scripts\start_frontend.ps1
```
> Runs Next.js on `http://localhost:3000`

### Option B: Docker Compose
```powershell
docker compose up --build
```

---

## 6. Running Tests

### Backend Test Suite (Pytest)
```powershell
.\backend\.venv\Scripts\pytest backend\tests
```
> Verified: **6 passed tests** (Health probe, root redirect, 404 handler, configuration defaults, RBAC matrix).

### Frontend Typecheck & Build
```powershell
cd frontend
npm run build
```
> Verified: **17 static routes compiled with 0 TypeScript and 0 lint errors**.

---

## 7. Official Starter Pack Expectations (Phase 2)

Before implementing Phase 2 optimization logic, the official starter pack must be supplied in `data/official/`:

1. `cit_public.json`: Unified master dataset with:
   - **27 Rooms** (seating capacities, equipment, lecture halls, labs)
   - **40 Faculty Members** (department, teaching load caps)
   - **14 Student Groups** (cohort sections)
   - **62 Courses** (credit breakdown)
   - **189 Weekly Sessions** (243 teaching contact hours)
2. `validator.py`: Official independent constraint verification script.
3. `sample_disruption.json`: Emergency faculty absence or room closure scenario.
4. `sample_schedule.json`: Baseline schedule schema.
5. **25 Spectra Booking Requests**: High-priority cultural & technical festival venue reservations.
6. **41 Midsemester Examinations**: Exam slots and invigilation assignments.

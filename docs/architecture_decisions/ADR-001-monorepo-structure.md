# ADR-001: Monorepo Architecture and Separation of Concerns

## Status
Accepted

## Context
CampusOS AI requires cohesive development between a high-performance mathematical scheduling backend (Python / OR-Tools / FastAPI) and a modern, commercial-grade SaaS frontend (Next.js / TypeScript / Tailwind CSS).

## Decision
We adopt a clean monorepo architecture:
- `frontend/`: Next.js App Router, TypeScript, Tailwind CSS, Lucide icons, Recharts, Framer Motion.
- `backend/`: FastAPI, SQLAlchemy 2.0, Alembic, Google OR-Tools CP-SAT, Pytest.
- `data/official/`: Official hackathon dataset and validator files (protected from tampering).
- `exports/`: Generated timetables, exam rosters, and reports.
- `docs/`: Technical documentation and Architecture Decision Records (ADRs).
- `scripts/`: Devops, database migrations, and operational tooling.

## Consequences
- Single version control history for frontend and backend coordination.
- Independent runtime deployment via Docker Compose or standalone processes.
- Clear separation between optimization, validation, AI, and presentation layers.

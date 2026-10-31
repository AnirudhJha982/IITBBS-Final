# CampusOS AI — Official Dataset Integration Strategy

## 1. Executive Summary
This document establishes the ingestion, normalization, and validation strategy for the official Chitkara Institute of Technology dataset. In compliance with core hackathon integrity rules, **no mock or fabricated data** is permitted in operational scheduling workflows.

---

## 2. Expected Dataset Specification

The official starter pack will supply the canonical ground-truth data in `data/official/`:

| Entity / Dimension | Expected Volume | Description & Constraints |
| :--- | :--- | :--- |
| **Rooms** | 27 | Classrooms, lecture halls, computer labs, workshop spaces. Specific seating capacities & specialized facilities. |
| **Faculty Members** | 40 | Departmental professors, associate professors, lecturers. Teaching load caps and subject proficiencies. |
| **Student Groups** | 14 | Cohorts / sections (e.g., CSE-A, CSE-B, ECE, ME). Clash-free timetables required per group. |
| **Courses** | 62 | Departmental and interdisciplinary subjects. Credit distribution, lab vs. theory breakdown. |
| **Weekly Sessions** | 189 | Total individual class allocations to schedule. |
| **Weekly Teaching Hours** | 243 | Cumulative classroom contact hours across the 5-day / 6-day academic cycle. |
| **Spectra Booking Requests** | 25 | High-priority ad-hoc venue booking requests for cultural, technical, and sports society events. |
| **Midsem Examinations** | 41 | Seating plans, invigilator assignments, and conflict-free room allocations. |

---

## 3. Starter Pack Components & Locations

The starter pack files will reside in `data/official/`:
- `cit_public.json`: Unified master dataset containing rooms, faculty, groups, courses, and session structures.
- `*.csv`: CSV relational versions of rooms, faculty, and course schedules.
- `validator.py`: The official independent test script. **Must not be modified or replaced.**
- `sample_disruption.json`: Unplanned faculty absence or venue closure scenarios.
- `sample_schedule.json`: Reference or baseline timetable format.
- `README.md` & export documentation: Format specification for official JSON / CSV output submission.

---

## 4. Ingestion Pipeline & Normalization Flow

```
[Official Files: data/official/]
        │
        ├── cit_public.json
        └── CSVs
        │
        ▼
[Ingestion Service: backend/app/services/ingestion.py]
        │  (Validates structural integrity, type coercions, foreign keys)
        ▼
[SQLAlchemy Models / Pydantic Schemas]
        │
        ├── In-Memory Optimization Graph (CP-SAT Solver)
        └── PostgreSQL / SQLite Persistent Storage
        │
        ▼
[Official validator.py (data/official/validator.py)]
        │  (Independent verification check - 0 hard violations required)
        ▼
[Production JSON / CSV Exports: exports/]
```

---

## 5. Constraint Enforcement Boundary

1. **Deterministic Backend Authority**:
   - The AI Assistant and Hinglish parsing module **never** writes directly to schedule tables or overrides constraints.
   - Every AI proposal is converted into a standard typed request and routed through the backend validation pipeline.

2. **Official Validator Independence**:
   - The scheduling engine will run internal CP-SAT optimization checks, followed by an independent post-solve execution of `data/official/validator.py`.
   - Any schedule with even a single hard violation will be rejected automatically.

3. **Disruption & Rescheduling**:
   - When a disruption payload (like `sample_disruption.json`) is processed, only affected sessions are rescheduled, targeting minimal total displacement (L1 distance minimization).

---

## 6. Phase 2 Readiness Checklist
- [ ] Ingest `cit_public.json` into typed Pydantic models.
- [ ] Implement `OfficialValidatorAdapter` to execute `data/official/validator.py` via subprocess or direct import.
- [ ] Implement CP-SAT formulation covering all 189 sessions and 243 hours.
- [ ] Implement Spectra booking conflict checks for the 25 official requests.
- [ ] Validate midsem examination slotting for 41 exams.

# Phase 2 — Official Dataset Integration & Starter Pack Checklist

This checklist tracks the exact prerequisites and ground-truth artifacts required from the official hackathon starter pack before the scheduling and validation engines are activated.

---

## 1. Required Starter Pack Files (`data/official/`)

| File Name | Format | Status | Expected Contents & Verification Target |
| :--- | :---: | :---: | :--- |
| `cit_public.json` | JSON | ❌ Not Located | Master institutional schema containing: <br>• **27 Rooms** (capacities, types, blocks, AV equipment)<br>• **40 Faculty Members** (department, maximum load constraints)<br>• **14 Student Groups** (cohort sizes, semester levels)<br>• **62 Courses** (credit breakdown, theory vs. lab)<br>• **189 Weekly Sessions** (contact hours totaling 243 hours) |
| `validator.py` | Python | ❌ Not Located | **Canonical independent constraint verification script.** <br>Must be provided by hackathon organizers. |
| `sample_disruption.json` | JSON | ❌ Not Located | Emergency room repair or faculty sick-leave scenario. |
| `sample_schedule.json` | JSON | ❌ Not Located | Reference schema defining exact session export keys and slot naming. |
| `spectra_bookings.*` | JSON/CSV | ❌ Not Located | **25 Spectra booking requests** with event timestamps and room preferences. |
| `midsem_exams.*` | JSON/CSV | ❌ Not Located | **41 Midsemester examinations** with conflict-free hall allocations. |
| `export_format.md` / `README.md` | Markdown | ❌ Not Located | Official guidelines for final JSON/CSV submission formatting. |

---

## 2. Ingestion & Activation Steps Once Supplied

1. **Place Starter Pack in `data/official/`**:
   - Copy all provided files into `Final IIT BBS/data/official/`.
2. **Inspect & Validate Schemas**:
   - Inspect JSON keys and CSV headers to ensure 100% adherence to official field names.
3. **Pydantic Model Realization**:
   - Replace placeholder schemas in `backend/app/schemas/` with strict Pydantic v2 models matching the official fields.
4. **Adapter Hookup (`backend/app/validation/validator.py`)**:
   - Point `OfficialValidatorAdapter` to `data/official/validator.py` to run independent validation runs.
5. **CP-SAT Constraint Formulation**:
   - Implement the mathematical optimization model in `backend/app/scheduling/engine.py` to schedule all 189 sessions and 243 contact hours across 27 rooms with 0 hard violations.
6. **Spectra Conflict Evaluation**:
   - Hook up `backend/app/services/booking_engine.py` to evaluate the 25 Spectra requests against the generated master timetable.

---

## 3. Local Filesystem Search Audit Log (Executed 2026-10-31)

A systematic search across the user environment was conducted with the following results:

- `Final IIT BBS/data/official/`: Contains only `.gitkeep`.
- `Final IIT BBS/` (Workspace Root): No starter pack datasets found.
- `C:\Users\jhaan\OneDrive\Desktop\`: No matching datasets or hackathon archives.
- `C:\Users\jhaan\OneDrive\Documents\`: No matching datasets.
- `C:\Users\jhaan\Documents\`: No matching datasets.
- `C:\Users\jhaan\Downloads\`: No starter pack ZIPs or dataset files.
- `C:\Users\jhaan\Projects\`: No Chitkara dataset files.
- `C:\Users\jhaan\OneDrive\Desktop\Projects\IITBBS\`: Contains only the separate `life-rpg` project.

**Conclusion:** The official starter pack has not been placed on this machine. Scheduling optimization remains paused to preserve hackathon integrity until the real files are provided.


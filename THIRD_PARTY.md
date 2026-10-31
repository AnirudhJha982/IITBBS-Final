# Third-party software and libraries

Direct dependencies and their purpose are listed below. The repository lockfiles and Python dependency manifests record the resolved versions. Transitive dependencies are governed by those manifests.

## Frontend

| Package | Purpose | License |
|---|---|---|
| Next.js | Web application framework and API routes | MIT |
| React, React DOM | UI rendering | MIT |
| TypeScript | Type checking and build tooling | Apache-2.0 |
| Tailwind CSS | Utility CSS framework | MIT |
| Recharts | Dashboard charts | MIT |
| Framer Motion | UI animation | MIT |
| Lucide React | Icons | ISC |
| class-variance-authority | Component variant styling | Apache-2.0 |
| clsx, tailwind-merge | Class-name construction and merging | MIT |
| PostCSS, Autoprefixer | CSS transformation | MIT |
| Node.js / `@types/node`, React type packages | Runtime and TypeScript declarations | Node.js: MIT; type packages: MIT |

## Backend

| Package | Purpose | License |
|---|---|---|
| FastAPI, Uvicorn | HTTP API framework and ASGI server | MIT |
| Pydantic, pydantic-settings | Request/configuration validation | MIT |
| SQLAlchemy, greenlet | Database mapping and async support | MIT |
| aiosqlite | Local SQLite async driver | MIT |
| python-multipart | Multipart request parsing | Apache-2.0 |
| python-dotenv | `.env` configuration loading | BSD-3-Clause |
| HTTPX | HTTP client/testing support | BSD-3-Clause |
| Google OR-Tools CP-SAT | Constraint programming and schedule optimization | Apache-2.0 |

OR-Tools is an optional local solver dependency and is not currently enabled in the Python serverless requirements file. The checked-in official dataset, validator, and sample disruption are organizer-provided inputs, not third-party software dependencies.

## Attribution and restrictions

No third-party project template is intentionally used. Review the licenses bundled with the installed package versions before redistribution. Do not alter or replace the organizer-provided validator or dataset.

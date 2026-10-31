# AI use disclosure

This file records AI use in both the product and project development, as required by the challenge.

## AI used by the product

| Model or API | Use in the product |
|---|---|
| None in the current deployed build | The deployed assistant uses deterministic keyword matching and canned responses. The backend provider is configured as `mock`; no OpenAI, Gemini, Anthropic, Azure, or other LLM API is called by the product. |

The codebase contains a provider abstraction and mock provider. Their presence does not mean a hosted model is connected. The required manual booking request form is not yet implemented; when added, it must work without any AI service and route requests through deterministic checks.

## AI tools used to build the project

| Tool | Contribution |
|---|---|
| Antigravity IDE with Gemini 3.8 Flash High | Used during development of the Next.js project, role dashboards/RBAC, deployment configuration, and related code. The screenshot and available conversation context establish use; the full earlier prompt history was not exported into this repository. |
| OpenAI Codex / ChatGPT coding assistant | Used to inspect the repository against the supplied problem statement, review current deployment behavior, and prepare the documentation and role-account changes in this working session. |

AI-assisted code changes must be reviewed and verified by the project team. The official dataset and organizer-provided validator are preserved.

## Prompt records

Current-session task summaries are kept in [`docs/ai_prompt_log.md`](docs/ai_prompt_log.md). Earlier Antigravity prompts remain in the external Antigravity conversation and were not available as a complete export while preparing this declaration. The commit history is the source of truth for code changes; this file does not claim to reproduce prompts that were not archived.

## What AI is not allowed to decide

An LLM or parser may help read a request, ask questions, fill a draft form, or explain a result. It must not decide whether a timetable, room booking, disruption repair, or exam allocation is valid; override a hard constraint; change priority; approve its own request; or write schedule/booking data without deterministic validation and authorization. Those decisions belong to the CP-SAT solver, deterministic application checks, and the official validator.

## Product status

The currently deployed assistant is a deterministic prototype, not an LLM. The backend's provider selection is currently hard-wired to the mock provider. No product LLM API key is required or shipped.

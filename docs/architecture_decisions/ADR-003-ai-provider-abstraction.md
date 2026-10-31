# ADR-003: AI Provider Abstraction with Strict Backend Guardrails

## Status
Accepted

## Context
CampusOS AI supports natural language venue bookings and an AI campus assistant accepting English and Hinglish prompts. Different deployment environments may use different LLM providers (OpenAI, Gemini, Azure, Anthropic, or offline mock).

## Decision
1. **Provider Abstraction**: Define `BaseAIProvider` with structured JSON output contracts. Swapping providers requires only an environment variable change (`AI_PROVIDER`).
2. **Deterministic Guardrails**: The LLM output is strictly treated as an *unverified intent*. All parameters extracted by AI (room, time, duration, student count) are passed to the deterministic backend validation engine before any database record or reservation is confirmed.

## Consequences
- High resilience against LLM hallucinations.
- Seamless execution in offline or firewalled environments using the `MockAIProvider`.
- Clear compliance with hackathon dataset integrity standards.

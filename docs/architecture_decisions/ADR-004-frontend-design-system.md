# ADR-004: Frontend Design System & Commercial SaaS Architecture

## Status
Accepted

## Context
CampusOS AI must present an enterprise-grade, polished visual identity reminiscent of modern productivity platforms like Linear, Vercel, and Notion. It must avoid generic templates, excessive glassmorphism, or cartoonish aesthetics.

## Decision
1. **Design System & Palette**:
   - Primary Background: Deep Slate / Dark Navy (`#080D1A`, `#0B132B`).
   - Card / Panel Surfaces: Navy Slate (`#0F172A`, `#1E293B`) with subtle borders (`#334155` / `rgba(255,255,255,0.08)`).
   - Brand & Focus Accents: Electric Blue (`#2563EB`, `#3B82F6`) and Cyan (`#06B6D4`, `#38BDF8`).
   - Typography: Clean sans-serif hierarchy (Inter/Geist font scale) with high-contrast text.
2. **Page Architecture & Shell**:
   - Universal application shell (`AppShell`) featuring collapsible sidebar navigation, live campus indicators, user profile badge, and global command header.
   - Clean empty states with explicit prompts explaining real dataset readiness. Zero fake records.

## Consequences
- Fast visual recognition and minimal cognitive friction for academic administrators.
- 100% responsive across desktop, tablet, and mobile views.
- Modular component library that scales cleanly into Phase 2.

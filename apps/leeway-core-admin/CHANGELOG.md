# Changelog

All notable engineering changes to **LeeWay Core** are documented in this file.

## [1.0.0] — 2026-11-27

### Added
- Full-stack Express + React + TypeScript Creator Administrative Control Center running on port `3000` (`server.ts`, `src/App.tsx`).
- Canonical Golden `LEEWAY-FORMULA-v1.0` kernel (`server/canonical/leeway-formula/v1/*`) with startup SHA-256 integrity verification (`11/11` files against `kernel-integrity.json`) and 14 typed domain adapters (`server/formulaAdapters.ts`).
- Persistent collapsible `FormulaMonitor` tracking the 9-stage Formula lifecycle (`REGISTERED → RETAINED`) and per-workspace `FormulaIntelligencePanel`.
- Configurable `WorkspaceEngine` supporting drag-and-drop reordering, accessible move buttons, `1×/2×/3×` resize, collapse/expand, maximize, pin, hide/restore, saved operational views, and governed change proposals.
- All 10 Primary Operational Sections: Executive Operations, Organization & Workforce (`A–E`, `W00–W17`, Employee 360), Creator Diagnostics (`DIAG, BOARD, AGENTS, BUS, VERITAS, PROBES, SHELL, SETUP`), Business Intelligence, Product & User Management (9 sub-workspaces including Proactive 10-step Support and Commercials claim-verification gate), Infrastructure Control, Mission Command (12-stage cycle), Governance & Authority, Research & Development, and Executive Decisions.
- Creator Authority scrypt first-run claim & HMAC-SHA256 Bearer authentication (`server/auth.ts`) and atomic `.tmp -> rename` store (`server/store.ts`).
- Automated verification suite (`tests/core-verification.test.ts`) and canonical documentation (`README.md`, `ARCHITECTURE.md`, `SECURITY.md`, `TESTING.md`, `INTEGRATION.md`).

### Removed
- Removed unauthorized `@google/genai` and `motion` packages, `GEMINI_API_KEY` references, and default development-platform boilerplate.

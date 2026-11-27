# LeeWay Core Architecture

> **Powered by Leeway Innovations — A Leeway Industries Product**

## 1. Twelve-Tier Authority Hierarchy

LeeWay Core operates as the administrative console within **Tier 1 (Creator & Human Authority)** and strictly honors downstream ownership boundaries:

1. Creator & Human Authority (`Leonard J. Lee`)
2. LeeWay Standards (`4citeB4U/LeeWay-Standards`, Laws + `R01`–`R25` + Sovereign Colony Constitution)
3. Root of Trust (Zitadel OIDC boundary; local scrypt + HMAC-SHA256 Creator session gate)
4. LeeWay Runtime (`LEEWAY_RUNTIME_URL` integration boundary)
5. Agent Lee (Executive observation synthesizer over observed state)
6. LeeWay Harness (10-section UI + `WorkspaceEngine`)
7. LeeWay Formula (`LEEWAY-FORMULA-v1.0` exact-rational kernel under `server/canonical/`)
8. Authorized Models & Tools (`UNBOUND` remote model orchestration; local allowlisted diagnostic probes)
9. Authorized Execution (`server.ts` Creator-authenticated state transitions)
10. Independent Veritas (`NOT_VERIFIED_EXTERNALLY` until `LEEWAY_VERITAS_URL` is bound)
11. Receipt Authority (SHA-256 hashed operational & Formula receipts)
12. Learning Ledger (Admission boundary separate from unverified R&D experiments)

## 2. Backend Module Boundaries (`server.ts` & `server/`)

- **`server.ts`**: Express HTTP host on port `3000`. Initializes Canonical Formula SHA-256 verification at startup, mounts `/api/*` endpoints, and serves Vite middleware in dev (`NODE_ENV !== 'production'`) or `dist/` in production.
- **`server/formulaAdapters.ts`**: Verifies all 11 files in `server/canonical/kernel-integrity.json`, imports `formula-service.mjs` verbatim, exposes `FORMULA_DOMAIN_ADAPTERS` (14 typed domain contracts), and deterministically maps domain telemetry into 16×6 quantized matrices via `buildDomainFormulaInput()`.
- **`server/diagnostics.ts`**: Collects live Node host metrics (`os`, `process`, `fs.statfsSync`), discovers `4citeB4U` repositories via GitHub REST API with cached fallback, and enforces a 4-probe read-only allowlist.
- **`server/auth.ts`**: Implements `claimFirstRunPasscode`, `verifyPasscode`, `issueCreatorToken`, `verifyCreatorToken`, and `requireCreatorAuthority` Express middleware.
- **`server/store.ts`**: Atomic `.tmp -> fs.renameSync` JSON store (`data/core-state.json`) seeded from canonical CRM-ERP starter records, `W00–W17` workforce projections, 12-stage missions, and SHA-256 receipts.

## 3. Frontend Architecture (`src/`)

- **Shell (`src/App.tsx`)**: Single persistent internal navigation sidebar, Workspace banner, Creator Authority modal trigger, Knowledge Base drawer, and persistent collapsible `FormulaMonitor`.
- **Workspace Engine (`src/components/workspace/WorkspaceEngine.tsx`)**: Reusable layout controller for dragging/reordering panels, keyboard/button moves, `1×/2×/3×` column spans, collapsing, maximizing, pinning, hiding/restoring, and persisting custom named views.
- **Graphical Visualizations (`src/components/charts/VisualCharts.tsx`)**: Zero-animation deterministic SVG/HTML visualizations (`AreaTrendChart`, `BarComparisonChart`, `DonutChart`, `HeatMapGrid`, `NodeTopologyDiagram`, `RadialGauge`, `Sparkline`) with `tabular-nums` alignment and drill-down selection.
- **Ten Operational Sections (`src/components/sections/*.tsx`)**: Modular section views connected to shared `CoreState`, `HostDiagnosticsSnapshot`, `DiscoveredRepository[]`, `FormulaHealthResponse`, and `authorizedPost` mutation handlers.

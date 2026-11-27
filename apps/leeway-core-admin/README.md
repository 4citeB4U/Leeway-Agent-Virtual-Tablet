# LeeWay Core — Creator Enterprise Administrative Control Center

> **Powered by Leeway Innovations — A Leeway Industries Product**

---

## 1. Project Overview

**LeeWay Core** is the Creator's enterprise administrative control center designed to operate inside the **Creator Master Agent Tablet** for the LeeWay ecosystem. Built strictly around canonical LeeWay Standards, LeeWay Core provides unified executive, workforce, diagnostic, commercial, customer, infrastructure, mission, governance, R&D, and authorization oversight without duplicating the Master Tablet OS header, creating a separate CRM database, or introducing unauthorized external AI dependencies.

---

## 2. Brand & Ownership Attribution

- **Creator & Sovereign Authority**: Leonard J. Lee
- **Developer Organization**: Leeway Innovations
- **Product Family**: A Leeway Industries Product
- **Official Brand Statement**: `Powered by Leeway Innovations — A Leeway Industries Product`
- **Canonical Visual Assets**: Preserved verbatim from canonical Tablet assets under `/public/assets/leeway/`.

---

## 3. Canonical Standards Compliance Statement

This implementation was grounded directly in the cloned canonical repositories under `https://github.com/4citeB4U/*`:

| Repository | Verified Revision (`HEAD`) | Canonical Documents Reviewed |
|---|---|---|
| `4citeB4U/LeeWay-Standards` | `e6f6b66c5c0a132fb607f643abe420c2af341174` | `LEEWAY-CANONICAL-ENGINEERING-LAWS.md`, `PERMANENT-ENGINEERING-RULES.md` (`R01`–`R25`), `LEEWAY-SOVEREIGN-COLONY-CONSTITUTION.v1.json`, `AGENTS.md`, `.leeway/registry.json` |
| `4citeB4U/LeeWay-Agent-Skills` | `66a08688c6ccb3a932d6860198b02954adecbc64` | `MEMORY.md`, `AGENTS.md` |
| `4citeB4U/LeeWay-formula-live` | `d261796f2698258922952d868b6f226030d64391` | `runtime/kernel-integrity.json`, `runtime/server.mjs`, `runtime/canonical/leeway-formula/v1/*`, `runtime/canonical/standards/formulas/LEEWAY-FORMULA-v1.0.md` |
| `4citeB4U/Leeway-Agent-Virtual-Tablet` | `8947bc30e9666df46743dd780cccbe8882133fc3` | `apps/agent-tablet/server.ts`, `OriginalDiagnosticsMatrix.tsx`, `DiagnosticsBoard.tsx`, `CoreServiceDock.tsx`, `AgentVTWorkforceCommandCenter.tsx`, `creatorBusinessReadModel.ts`, `src/diagnostics/*` |
| `4citeB4U/Leeway-Agentic-CRM-ERP` | `b940c46c07dbc956fd7c884b1d764263aff2bcdf` | `docs/erp-crm-integration.md`, `data/leeway-crm-campaign-starter-data.json` |
| `4citeB4U/LeeWay-Digital-Brain-Diagnostincs-pkg` | `aed6a78c72272dc600dccb8da4e2fb3542b88c99` | `README.md` |

### Mandatory Inaccessibility Disclosure

- **`4citeB4U/LeeWay-Engineering`**: Returned **HTTP 404 (Inaccessible)** from GitHub during canonical discovery. Any contract solely housed in `4citeB4U/LeeWay-Engineering` (including any standalone copy of the External Support Assistant Operating Contract) has **not** been read and is explicitly marked unverified rather than invented.

Every server and frontend TypeScript source file carries the required `LEEWAY HEADER — DO NOT REMOVE` 5WH metadata block.

---

## 4. System Purpose & Operational Scope

LeeWay Core consolidates **10 Primary Operational Sections** behind one persistent internal sidebar:

1. **01. Executive Operations** — Enterprise population, subscriptions, revenue/retention trends, infrastructure gauges, relationship topology, pending decisions, Agent Lee observations, and drill-down triggers.
2. **02. Organization & Workforce** — Complete digital workforce control spanning Categories **A–E** (`W00`–`W17` canonical projections plus ecosystem contracts), interactive org topology, workload heat maps, Employee 360 inspection drawer, and governed reassignment proposals.
3. **03. Creator Diagnostics** — Preserves the 8 canonical tabs (`DIAG`, `BOARD`, `AGENTS`, `BUS`, `VERITAS`, `PROBES`, `SHELL`, `SETUP`), live Node OS host telemetry, GitHub `4citeB4U` repository discovery, and strictly allowlisted read-only probes.
4. **04. Business Intelligence** — Executive financial, retention cohort, billing/collections, pipeline funnel, and expense analytics providing CRM/ERP oversight without duplicating the operational CRM.
5. **05. Product & User Management** — Nine integrated sub-workspaces: `Customers & Members`, `Customer Profiles (360)`, `Permissions & Entitlements`, `Digital Employment`, `Service Usage`, `Proactive Customer Support` (10-step workflow), `Product Catalog`, `Commercials` (preview & claim gate), and `Updates & Distribution`.
6. **06. Infrastructure Control** — Compute utilization, physical vs software-defined vs diagnostic-only topology nodes, explicit GPU `UNVERIFIED` indicators, storage allocation, and infrastructure cost distribution.
7. **07. Mission Command** — 12-stage canonical engineering lifecycle (`INVESTIGATE → DIAGNOSE → PLAN → IMPLEMENT → TEST → VALIDATE → REPAIR → RETEST → VERIFY → EVIDENCE → CHECKPOINT → CONTINUE`) with evidence-backed completion and governed transition proposals.
8. **08. Governance & Authority** — 12-tier Root of Trust, Zitadel OIDC boundary status, permission matrices, Formula SHA-256 integrity status, Independent Veritas boundary, and local SHA-256 Receipt Ledger.
9. **09. Research & Development** — Strict baseline isolation comparing Golden `LEEWAY-FORMULA-v1.0` against `experimental-v2`, explicitly preserving unfavorable regression records.
10. **10. Executive Decisions** — Twelve decision categories separating **Creator Approval**, **Execution**, and **Independent Veritas Verification**.

---

## 5. Architectural Summary

LeeWay Core strictly respects the **12-Tier LeeWay Architectural Hierarchy**:

`Creator Authority → LeeWay Standards → Root of Trust → LeeWay Runtime → Agent Lee → LeeWay Harness → LeeWay Formula → Authorized Models & Tools → Authorized Execution → Independent Veritas → Receipt Authority → Learning Ledger`

- **Client**: React 19 + TypeScript + Tailwind CSS v4 SPA bundled by Vite (`src/`), rendered inside a dark graphite (`#0B0E14`), metallic gold (`#D4AF37`), and electric-blue (`#38BDF8`) enterprise workspace without decorative motion animations.
- **Server**: Express 4 TypeScript runtime (`server.ts`) hosting Vite dev middleware (or static `dist/` in production) on port `3000`, backed by atomic `.tmp → rename` JSON persistence (`data/core-state.json`), scrypt + HMAC-SHA256 Creator Authority verification (`server/auth.ts`), real Node OS telemetry (`server/diagnostics.ts`), and the integrity-verified Golden Formula v1.0 service (`server/formulaAdapters.ts`).

---

## 6. Complete Directory & File Structure

```text
.
├── .env.example
├── .gitignore
├── ARCHITECTURE.md
├── CHANGELOG.md
├── INTEGRATION.md
├── README.md
├── SECURITY.md
├── TESTING.md
├── index.html
├── metadata.json
├── package.json
├── tsconfig.json
├── vite.config.ts
├── server.ts
├── public/
│   └── assets/
│       └── leeway/
│           ├── leeway-approved-coin.png
│           ├── leeway-true-logo.png
│           └── diagnostics/
├── server/
│   ├── auth.ts
│   ├── diagnostics.ts
│   ├── formulaAdapters.ts
│   ├── store.ts
│   └── canonical/
│       ├── kernel-integrity.json
│       ├── leeway-formula/v1/
│       │   ├── base64-codec.mjs
│       │   ├── canonical-input.mjs
│       │   ├── formula-receipts.mjs
│       │   ├── formula-service.mjs
│       │   ├── leeway-formula-v1.mjs
│       │   ├── rational.mjs
│       │   └── adapters/
│       │       ├── raw-base64-v1.mjs
│       │       └── runtime-state-v1.mjs
│       └── standards/formulas/
│           ├── LEEWAY-FORMULA-v1.0.json
│           └── LEEWAY-FORMULA-v1.0.md
├── src/
│   ├── App.tsx
│   ├── index.css
│   ├── main.tsx
│   ├── data/
│   │   └── knowledgeBase.ts
│   ├── types/
│   │   └── leeway.ts
│   └── components/
│       ├── auth/CreatorAuthorityModal.tsx
│       ├── charts/VisualCharts.tsx
│       ├── formula/
│       │   ├── FormulaIntelligencePanel.tsx
│       │   └── FormulaMonitor.tsx
│       ├── knowledge/KnowledgeBaseModal.tsx
│       ├── sections/
│       │   ├── BusinessIntelligenceSection.tsx
│       │   ├── CreatorDiagnosticsSection.tsx
│       │   ├── ExecutiveDecisionsSection.tsx
│       │   ├── ExecutiveOperationsSection.tsx
│       │   ├── GovernanceAuthoritySection.tsx
│       │   ├── InfrastructureControlSection.tsx
│       │   ├── MissionCommandSection.tsx
│       │   ├── OrganizationWorkforceSection.tsx
│       │   ├── ProductUserManagementSection.tsx
│       │   └── ResearchDevelopmentSection.tsx
│       └── workspace/WorkspaceEngine.tsx
└── tests/
    └── core-verification.test.ts
```

---

## 7. LeeWay Formula Integration Explanation

- **Canonical Engine**: Copied byte-identically from `4citeB4U/LeeWay-formula-live/runtime/canonical/leeway-formula/v1/` using exact `BigInt` rational arithmetic (`rational.mjs`), RFC4648 Base64 encoding (`base64-codec.mjs`), and canonical 16×6 input validation (`canonical-input.mjs`).
- **Startup Integrity Gate**: `initializeCanonicalFormula()` hashes all **11** files listed in `server/canonical/kernel-integrity.json` using SHA-256 and runs the Golden Vector self-test expecting Decimal `[4, 50, 63, 59, 48, 69]` and Base64 `['E', 'y', '/', '7', 'w', 'BF']`. Any mismatch fails closed with `LEEWAY_FORMULA_V1_BLOCKED`.
- **14 Typed Domain Adapters** (`server/formulaAdapters.ts`): `enterprise-operations`, `customer-management`, `workforce-evaluation`, `employment-suitability`, `service-usage`, `resource-allocation`, `diagnostic-evaluation`, `commercial-analysis`, `mission-evaluation`, `infrastructure-optimization`, `computational-resources`, `storage-transformations`, `research-evaluation`, and `executive-alternatives`.
- **9-Stage Formula Effectiveness Monitor**: Tracks and clearly distinguishes `REGISTERED`, `BOUND`, `CONTACTED`, `EVALUATED`, `CONSUMED`, `EXECUTED`, `MEASURED`, `VERIFIED`, and `RETAINED`. Evaluating a matrix never claims execution or independent verification.

---

## 8. External Integration & Coexistence Boundaries

External LeeWay infrastructure that is not running locally stays explicitly marked `UNBOUND` rather than mocked:

| Boundary | Local Implementation | External Target | Status When Env Unset |
|---|---|---|---|
| Identity / Auth | Scrypt passcode + HMAC-SHA256 Bearer (`server/auth.ts`) | Zitadel OIDC (`LEEWAY_ZITADEL_ISSUER`) | `UNBOUND` (`CLAIMED_LOCAL` / `ENV_PASSCODE`) |
| Execution Runtime | Governed local proposal & store receipts | LeeWay Runtime Fabric (`LEEWAY_RUNTIME_URL`) | `UNBOUND` (`EXTERNAL_RUNTIME_UNBOUND`) |
| CRM & ERP | Synced canonical starter fixture (`cust-*`, `cmp-*`) | Leeway Agentic CRM-ERP (`LEEWAY_CRM_API_URL`) | `UNBOUND` |
| Continuity / Storage | Atomic `data/core-state.json` + local Formula receipts | Continuum (`LEEWAY_CONTINUUM_URL`) | `UNBOUND` |
| Device & Extension Bridge | Read-only counts (`privateContentAccess: false`) | Device Bridge (`LEEWAY_DEVICE_BRIDGE_URL`) | `UNBOUND` / `UNVERIFIED` |
| Independent Verification | `veritasState: 'NOT_VERIFIED_EXTERNALLY'` | Veritas Service (`LEEWAY_VERITAS_URL`) | `NOT_PROVIDED` |
| Receipt Custody | SHA-256 local receipts (`RCP-*`) + Formula JSON receipts | Receipt Authority (`LEEWAY_RECEIPT_AUTHORITY_URL`) | `LOCAL_HASHED_RECEIPTS` |

---

## 9. Setup & Installation Instructions

```bash
npm install
cp .env.example .env
```

---

## 10. Environment Configuration Reference

All optional and operational configuration variables are documented in `.env.example` (never commit `.env` or actual secrets):

- `PORT` — HTTP server port (defaults to `3000`).
- `NODE_ENV` — `development` or `production`.
- `LEEWAY_CREATOR_PASSCODE` — Optional environment Creator passcode; when unset, first-run UI claim stores a scrypt salted hash in `data/creator-auth.json`.
- `LEEWAY_SESSION_SECRET` — Optional HMAC signing secret (`>= 16` chars); defaults to an ephemeral process CSPRNG key.
- `LEEWAY_FORMULA_SOURCE` — Override path to canonical Formula v1 directory (defaults to `./server/canonical/leeway-formula/v1`).
- `LEEWAY_RUNTIME_URL`, `LEEWAY_DIAGNOSTICS_ORIGIN`, `LEEWAY_DIAGNOSTICS_BODY_ID`, `LEEWAY_ZITADEL_ISSUER`, `LEEWAY_CRM_API_URL`, `LEEWAY_CONTINUUM_URL`, `LEEWAY_DEVICE_BRIDGE_URL`, `LEEWAY_VERITAS_URL`, `LEEWAY_RECEIPT_AUTHORITY_URL` — Optional downstream LeeWay service bindings.

---

## 11. Development & Production Execution Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Starts Express (`server.ts`) with Vite dev middleware on port `3000`. |
| `npm run build` | Compiles production frontend bundle into `dist/` and copies `src/assets` if present. |
| `npm start` | Starts production Express server (`tsx server.ts`). |
| `npm run lint` | Runs `tsc --noEmit` across frontend and server TypeScript sources. |
| `npm test` | Executes the automated Node test suite (`tests/core-verification.test.ts`). |
| `npm run clean` | Removes `dist/` and `server.js`. |

---

## 12. Workspace Engine & UI Usage Guide

Every section powered by `WorkspaceEngine` (`src/components/workspace/WorkspaceEngine.tsx`) supports:

- Drag-and-drop panel reordering plus accessible keyboard/button move controls (`Up` / `Down`).
- Panel width spanning (`1×`, `2×`, `3×`), collapse/expand, maximize modal view, pin to top, and hide/restore hidden panels.
- Saving named operational workspace views (`POST /api/workspace/views`) and restoring default layouts without requiring executive approval gates.
- Governed relationship actions (dragging a worker into a department or advancing a mission stage) emit a **Governed Proposal** (`POST /api/proposals`) requiring Creator Authority Bearer authorization rather than silently mutating records.

---

## 13. Creator Authority & Security Model

- **First-Run Passcode Claim & Unlock**: When `LEEWAY_CREATOR_PASSCODE` is not set in env, the Creator sets an 8+ character passcode via `POST /api/auth/claim`. Only one local claim is permitted; credentials use per-user 16-byte random salts with `crypto.scryptSync`.
- **In-Memory Bearer Tokens**: `issueCreatorToken()` signs an 8-hour HMAC-SHA256 Bearer token held strictly in React component memory (`creatorToken` state in `src/App.tsx`), never persisted to `localStorage`.
- **Privacy Boundary**: Customer 360 records enforce `privateContentAccess: false` and `extensionDeviceCommands: false`; administrative visibility covers subscription/entitlement metadata, never private customer files, messages, or camera feeds.
- **Allowlisted Probes**: Diagnostic probes accept only four fixed probe IDs (`node-runtime`, `host-load`, `tsc-check`, `env-bindings`) and reject arbitrary shell input.

---

## 14. API Route Reference

| Method & Path | Auth Required | Responsibility |
|---|---|---|
| `GET /api/health` | Public | Server liveness & Formula SHA-256 status (`LEEWAY_FORMULA_V1_PASS` / `BLOCKED`). |
| `GET /api/auth/status` | Public | Current auth mode (`UNCLAIMED_FIRST_RUN`, `CLAIMED_LOCAL`, `ENV_PASSCODE`), Zitadel status, and active Bearer validity. |
| `POST /api/auth/claim` | Public (first-run only) | Claims initial local Creator passcode (`>= 8` chars) and issues Bearer token. |
| `POST /api/auth/unlock` | Public (passcode) | Verifies Creator passcode and issues 8-hour HMAC-SHA256 Bearer token. |
| `GET /api/core/state` | Public read | Returns persisted Core state and external integration binding map. |
| `GET /api/formula/health` | Public | Returns Formula v1.0 Golden Vector status, hashes, and all 14 domain adapter contracts. |
| `POST /api/formula/evaluate` | Public read-only calc | Evaluates canonical Formula v1.0 for a domain adapter, writes JSON receipt, appends local receipt. |
| `GET /api/diagnostics/snapshot` | Public | Returns live Node OS CPU/RAM/Disk/Process metrics with explicit `UNAVAILABLE`/`UNVERIFIED` bounds. |
| `GET /api/diagnostics/repositories` | Public | Discovers `4citeB4U` repos via GitHub REST API (or canonical fallback index) and flags `LeeWay-Engineering` 404. |
| `POST /api/diagnostics/probe` | Public (allowlisted) | Runs `node-runtime`, `host-load`, `tsc-check`, or `env-bindings`. |
| `POST /api/workspace/views` | Workspace pref | Persists custom panel layouts without heavyweight authorization. |
| `POST /api/decisions/:id/resolve` | **Creator Bearer** | Approves, rejects, defers, or requests changes on an executive decision without conflating approval with external verification. |
| `POST /api/proposals` | **Creator Bearer** | Creates or authorizes governed workforce reassignment or mission stage advance proposals. |
| `POST /api/workforce/:id/action` | **Creator Bearer** | Approves external employment, suspends, resumes, or revokes a digital worker. |
| `POST /api/commercials/:id/action` | **Creator Bearer** | Approves, schedules, pauses, withdraws, rejects, or requests revisions; blocks unverified claims. |
| `POST /api/customers/:id/admin` | **Creator Bearer** | Admits, suspends, activates, updates headcount cap, or toggles product permissions. |
| `POST /api/support/:id/dispatch` | **Creator Bearer** | Assigns a support worker and advances proactive 10-step workflow while preserving customer data. |

---

## 15. Creator Diagnostics Preservation & Honesty Rules

- Preserves the **8 canonical tabs**: `DIAG`, `BOARD`, `AGENTS`, `BUS`, `VERITAS`, `PROBES`, `SHELL`, `SETUP`.
- Uses `NODE_HOST_OS` (`os.loadavg()`, `os.totalmem()/freemem()`, `fs.statfsSync()`, `process.memoryUsage()`) for real metrics.
- Explicitly sets `temperature` (`UNAVAILABLE`), `gpuUtilization` (`UNAVAILABLE`), `gpuMemory` (`UNVERIFIED`), `matched3dModel` (`UNAVAILABLE`), and `independentVeritas` (`NOT_PROVIDED`) so missing hardware or external runtime planes are never misreported as healthy.

---

## 16. Organization, Workforce A–E & Product/Customer Governance

- **Workforce A–E**: Internal (`A_LEEWAY_INTERNAL`), LeeWay Contracted (`B_LEEWAY_CONTRACTED`), Customer Internal Agents (`C_CUSTOMER_INTERNAL_AGENT` — privacy-scoped), Customer External Candidates (`D_CUSTOMER_EXTERNAL_CANDIDATE`), and Externally Deployed Contracted (`E_EXTERNALLY_DEPLOYED_CONTRACTED`).
- **Proactive Support 10-Step Workflow**: `OBSERVE → DETECT → EVALUATE → DIAGNOSE → RECOMMEND → AUTHORIZE → DISPATCH → EXECUTE → VERIFY → RETAIN_EVIDENCE`, preserving customer data without forced full-system resets.
- **Commercials Claim Gate**: Campaigns tagged `REQUIRES_EVIDENCE_REVIEW` return HTTP `400 UNVERIFIED_PRODUCT_CLAIMS_CANNOT_BE_PUBLISHED` on `APPROVE_IMMEDIATE` or `SCHEDULE`.

---

## 17. Mission Command & 12-Stage Engineering Cycle

Missions progress strictly along `INVESTIGATE → DIAGNOSE → PLAN → IMPLEMENT → TEST → VALIDATE → REPAIR → RETEST → VERIFY → EVIDENCE → CHECKPOINT → CONTINUE`. Progress percentage derives solely from populated `stageEvidence` records, and Creator corrections append `correctionNotes` without wiping mission history.

---

## 18. Research & Development & Golden Formula Isolation

`ResearchDevelopmentSection` isolates `experimental-v2` experiments from the frozen `LEEWAY-FORMULA-v1.0` baseline and reports unfavorable experimental outcomes transparently (including `rd-g44-fold` showing `+8.4% UNFAVORABLE latency overhead on small JSON <4KB`).

---

## 19. Executive Decisions Authority Separation

Every decision card and API mutation explicitly separates:
1. **`decisionStatus`**: `PENDING | APPROVED | REJECTED | DEFERRED | CHANGES_REQUESTED`
2. **`executionStatus`**: `NOT_EXECUTED | EXECUTED_LOCAL_STORE | EXTERNAL_RUNTIME_UNBOUND`
3. **`veritasStatus`**: `NOT_VERIFIED | UNBOUND_EXTERNAL_VERITAS`

---

## 20. Embedded Knowledge Base

`src/data/knowledgeBase.ts` + `KnowledgeBaseModal.tsx` provide an in-app versioned reference (`2026.11.27-canon-v1`) indexing every canonical repository revision, Formula math invariants, permanent rules `R01–R25`, and inaccessible document disclosures.

---

## 21. Testing & Automated Verification

Run `npm test` to execute `tests/core-verification.test.ts` covering:
- 11/11 Formula v1.0 SHA-256 verification and Golden Vector `[4, 50, 63, 59, 48, 69]` / `['E','y','/','7','w','BF']`
- All 14 domain adapter evaluations + out-of-range fail-closed validation
- Host diagnostics honesty (`UNAVAILABLE` / `UNVERIFIED` / `NOT_PROVIDED`) & probe allowlist enforcement
- Creator passcode claim, scrypt verification, duplicate claim block, and tampered Bearer rejection
- Atomic store persistence, `privateContentAccess: false`, Workforce A–E presence, and 5WH/forbidden-string audit.

---

## 22. Dependency Audit & Zero Platform Coupling

- Verified removed from `package.json`: `@google/genai`, `motion`.
- Verified absent across all source, config, manifest, and documentation files: `GEMINI_API_KEY`, `GOOGLE_API_KEY`, `@google/genai`, `@google/generative-ai`, Gemini endpoints, and development-platform attribution.

---

## 23. Known Limitations & Unverified Boundaries

1. `4citeB4U/LeeWay-Engineering` returned HTTP `404` and could not be read; contracts located exclusively there remain unverified.
2. External Runtime Fabric, Zitadel OIDC, remote CRM-ERP API, Continuum, Device Bridge, Independent Veritas, and external Receipt Authority default to `UNBOUND` until environment endpoints are provided and integrated.
3. GPU VRAM/utilization and thermal hardware sensors require a privileged local Device Bridge / hardware collector (`UNAVAILABLE`/`UNVERIFIED` under standard Node process telemetry).

---

## 24. Changelog & Companion Documentation Index

- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — Authority hierarchy, runtime components, and Formula data flow.
- [`SECURITY.md`](./SECURITY.md) — Authentication model, privacy walls, and input validation controls.
- [`TESTING.md`](./TESTING.md) — Automated test suites, runtime checks, and verification scope.
- [`INTEGRATION.md`](./INTEGRATION.md) — Canonical source inventory and downstream service boundary specifications.
- [`CHANGELOG.md`](./CHANGELOG.md) — Version history (`v1.0.0`).

---

## 25. License & Contributor Notes

- **License**: `Apache-2.0`
- **Copyright & Authority**: Leonard J. Lee / Leeway Innovations — A Leeway Industries Product.

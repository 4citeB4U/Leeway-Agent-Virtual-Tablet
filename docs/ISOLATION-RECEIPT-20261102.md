# Agent Virtual Tablet isolation receipt — 2026-11-02

## Result

`ISOLATED_SOURCE_PUSHED_CI_VERIFIED`

The target GitHub repository was empty and is now populated as a standalone tablet repository. No source outside the isolated staging directory was reset, merged, deleted, or rebound.

## Source provenance

- UI baseline: local M2 working tree `work/digital-workforce-m2-agent-vt-20261029`, base HEAD `0bc3b162ea755d9ece7b98742e0c2bca71ae9c31`, with the current uncommitted 2026-11-02 tablet navigation, home, and Agent Pad changes preserved.
- Workforce/auth component source: local M3–6 working tree `work/digital-workforce-m3-6-agent-vt-20261029`, source HEAD `490ac5bf0bc66d06654f9632fa70e38ef65433c2`, including the fail-closed Workforce projection and authenticated read-only UI behavior.
- Runtime adapter: `integration/runtime-fabric/workforce-runtime-mcp.mjs` and its contract tests copied from the Digital Workforce source boundary.
- Build dependency: the small `apps/crm` surface is included because the tablet's build syncs it into `public/crm`.

## Isolation decisions

- Kept the latest M2 command-center/navigation/pad source as the tablet shell.
- Promoted the M3–6 deeper Workforce projection component.
- Applied the M3–6 OIDC Authorization Code + PKCE session bridge to the M2 backend while retaining M2's Agent Roster and standalone-preview routes.
- Kept Runtime Fabric and Device Bridge as external authorities behind explicit adapters; no duplicate queue, dispatch, Formula, Veritas, receipt, or learning authority was copied into this repository.
- Excluded `node_modules`, `dist`, generated `public/crm`, local environment files, host state, logs, and private credentials.

## Verification state

Fresh isolated verification completed:

- `npm run lint`: PASS.
- Runtime Fabric and engineering-cycle contract tests: 14/14 PASS.
- Production build: PASS; CRM runtime sync, Vite bundle, standalone preview, and bundled Express server all completed.
- Local smoke checks: `/api/health` 200, `/api/auth/status` 200 with `OWNER_SESSION_REQUIRED`, unauthenticated Workforce read 401 with the read-only bearer challenge, Agent Roster 200 observation-only, and `/standalone.html` 302 to the preview route.
- GitHub commit: `acbbae33be864f1628a0f0c201a69b9d3c64251b` on `main`.
- GitHub Actions CI: run `41527850766`, conclusion `success`.
- GitHub Pages build/deploy workflow: run `41527850790`, conclusion `success`.
- GitHub Pages environment deployment: run `41527849646`, conclusion `success`.
- Published browser UI: `https://4citeb4u.github.io/Leeway-Agent-Virtual-Tablet/`.

The Pages source is now GitHub Actions. The workflow builds `apps/agent-tablet/dist` with the repository base path and publishes that artifact, so the public site renders the tablet application rather than the repository README.

The local and remote `main` heads matched after push.

The live Runtime Fabric/OIDC gate remains separate: without the approved issuer/client and authenticated provider snapshot, Workforce status must remain blocked or unverified. Device Bridge native execution is not claimed by repository presence.

## Receipt boundary

This document records the extraction and its evidence boundary. It is not a Veritas acceptance, runtime execution receipt, Formula decision, or Learning Ledger admission. Live Pocket ID/OIDC, authenticated Workforce telemetry, Workboard availability, and Device Bridge native execution remain separate runtime gates.

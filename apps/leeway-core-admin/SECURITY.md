# LeeWay Core Security Model

> **Powered by Leeway Innovations — A Leeway Industries Product**

## 1. Creator Authority Gate (`server/auth.ts`)

- All consequential mutations (`POST /api/decisions/:id/resolve`, `POST /api/proposals`, `POST /api/workforce/:id/action`, `POST /api/commercials/:id/action`, `POST /api/customers/:id/admin`, `POST /api/support/:id/dispatch`) are guarded by `requireCreatorAuthority`.
- Unauthenticated requests receive HTTP `401 CREATOR_AUTHORITY_REQUIRED`.
- **Credential Storage**: First-run setup hashes the Creator passcode with a random 16-byte salt and `crypto.scryptSync(..., 64)` stored atomically in `data/creator-auth.json`. Comparisons use `crypto.timingSafeEqual`.
- **Token Transport**: Session tokens are HMAC-SHA256 signed JSON payloads (`8h` TTL) returned upon claim/unlock and kept strictly in React component state (`memory only`, never `localStorage`).

## 2. Customer Privacy & Device Isolation

- Every customer record enforces `privateContentAccess: false` and `extensionDeviceCommands: false`.
- LeeWay Core displays subscription tiers, product entitlements, resource quotas, and support metadata only—never customer private documents, communications, or sensor streams.
- Customer-created private internal agents (`C_CUSTOMER_INTERNAL_AGENT`) remain isolated from external employment contracts (`E_EXTERNALLY_DEPLOYED_CONTRACTED`).

## 3. Command & Probe Hardening

- `runAllowlistedDiagnosticProbe()` strictly switches on four read-only probe identifiers (`node-runtime`, `host-load`, `tsc-check`, `env-bindings`) and uses `execFile` (`tsc --noEmit`) without shell interpolation. Any other `probeId` returns `BLOCKED`.
- Commercial publication actions (`APPROVE_IMMEDIATE`, `SCHEDULE`) reject any campaign with `claimVerificationStatus === 'REQUIRES_EVIDENCE_REVIEW'` (`HTTP 400`).

## 4. Formula Integrity Verification

- `initializeCanonicalFormula()` validates SHA-256 digests of all 11 canonical Formula files against `server/canonical/kernel-integrity.json` before execution. Any modification fails closed (`503 LEEWAY_FORMULA_V1_BLOCKED`).
- No API keys, platform SDKs, or secrets are stored in client bundles or `.env.example`.

# LeeWay Core Testing & Verification

> **Powered by Leeway Innovations — A Leeway Industries Product**

## 1. Automated Verification Suite (`tests/core-verification.test.ts`)

Run via:

```bash
npm test
```

Executed with Node native `node:test` through `tsx --test`:

1. **Canonical Formula Kernel & Adapters**:
   - Validates 11/11 SHA-256 digests in `server/canonical/kernel-integrity.json`.
   - Verifies Golden Vector outputs: Decimal `[4, 50, 63, 59, 48, 69]` and Base64 `['E', 'y', '/', '7', 'w', 'BF']`.
   - Runs `buildDomainFormulaInput` + `service.evaluate` across all 14 operational domain adapters and checks receipt file persistence.
   - Negative bounds test confirms out-of-range inputs (`999`) fail closed.
2. **Diagnostics Telemetry Honesty & Allowlist**:
   - Confirms real Node OS metrics report `OBSERVED`, while unbound sensors (`temperature`, `gpuUtilization`, `gpuMemory`, `independentVeritas`) report `UNAVAILABLE`, `UNVERIFIED`, or `NOT_PROVIDED`.
   - Verifies allowlisted `node-runtime` succeeds and unauthorized shell probe strings return `BLOCKED`.
3. **Creator Authority Gate**:
   - Tests first-run claim validation (`>= 8` chars), duplicate claim prevention, valid/invalid scrypt verification, and HMAC-SHA256 tampered token rejection.
4. **Atomic Persistence & Privacy Boundaries**:
   - Verifies `data/core-state.json` atomic writes leave no `.tmp` artifact, all customers enforce `privateContentAccess: false`, all 5 Workforce categories A–E exist, and `appendReceipt` computes valid SHA-256 checksums marked `NOT_VERIFIED_EXTERNALLY`.
5. **Standards & Zero Platform Dependency Audit**:
   - Scans all `server.ts`, `server/*.ts`, and `src/**/*.{ts,tsx}` files for `LEEWAY HEADER — DO NOT REMOVE` and zero occurrences of `@google/genai`, `GEMINI_API_KEY`, `GOOGLE_API_KEY`, `Google AI Studio`, or hardcoded Windows user paths.

## 2. Static & Build Checks

- `npm run lint` (`tsc --noEmit`) — Typechecks both React SPA (`src/`) and Express runtime (`server.ts`, `server/`).
- `npm run build` (`vite build`) — Produces verified production bundle under `dist/`.

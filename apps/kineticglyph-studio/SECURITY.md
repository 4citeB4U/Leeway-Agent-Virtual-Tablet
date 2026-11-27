<!--
LEEWAY HEADER — DO NOT REMOVE

REGION: LEEWAY.DOCS.SECURITY
TAG: LEEWAY.DOCS.SECURITY.BOUNDARIES

5WH:
WHAT = Security and privacy architecture documentation for KineticGlyph Studio.
WHY = Define client-side data boundaries, fail-closed Formula integration, and prohibited dependency controls.
WHO = Leeway Innovations — KineticGlyph Studio
WHERE = SECURITY.md
WHEN = 2026-11-27
HOW = Markdown security reference verified against codebase.

LICENSE = Apache-2.0
-->

# Security Policy & Boundaries

## 1. Local-Only Asset Processing

- Uploaded images are read via browser `FileReader` and processed entirely inside local `HTMLCanvasElement` memory.
- No uploaded images, sprites, or exported button files are transmitted to external servers.

## 2. Prohibited Dependency Controls

- Zero external AI SDKs (`@google/genai`, `@google/generative-ai`) or cloud API keys (`GEMINI_API_KEY`, `GOOGLE_API_KEY`) are permitted or present in `package.json`, `package-lock.json`, `.env.example`, or `src/`.

## 3. Fail-Closed External Adapters

- `src/leeway/formulaAdapter.ts` enforces the `LEEWAY_FORMULA_FABRIC_CLIENT` fail-closed contract: if `VITE_LEEWAY_FORMULA_FABRIC_URL` is unset, unreachable, or returns a non-2xx response, the state resolves strictly to `BLOCKED_NO_VERIFIED_FORMULA_CAPABILITY`.

## 4. Exported Artifact Hygiene

- Exported HTML buttons escape/sanitize via controlled attribute interpolation and run in an isolated `iframe sandbox="allow-scripts"` inside `ExportView.tsx`.
- No secrets, private keys, or personal paths are stored in source control.

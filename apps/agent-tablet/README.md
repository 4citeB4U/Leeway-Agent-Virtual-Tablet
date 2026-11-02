# Agent Tablet application

This directory contains the replaceable React/Vite interface and Express backend for the LeeWay Agent Virtual Tablet. The repository-level contract is in [../../README.md](../../README.md); architecture and connection boundaries are in [../../docs/ARCHITECTURE.md](../../docs/ARCHITECTURE.md) and [../../docs/CONNECTIONS.md](../../docs/CONNECTIONS.md).

## Run the app

From the repository root:

```bash
npm run install:tablet
copy apps/agent-tablet/.env.example apps/agent-tablet/.env
npm run dev
```

The service listens on `http://127.0.0.1:3200` by default. The app's working directory must remain this directory when its own scripts run because the server resolves `public/` and `dist/` relative to the tablet package.

## Product surfaces

- Home command center and Agent Lee identity
- Workforce read-only command center for PRIME and W00–W17
- Agent Pad / Blackboard and existing notepad flows
- LeeWay Office editor and Preview
- Continuum / evidence notebook surface
- Diagnostics, terminal, development, and CRM entitlement surfaces

## Backend boundary

The server exposes bounded host and adapter routes. It does not own dispatch, Formula, Veritas, receipts, learning, or Device Bridge authority. Runtime reads require caller-scoped authorization and pass through `../../integration/runtime-fabric/workforce-runtime-mcp.mjs`.

`/standalone.html` is a preview entry point and does not contain a second tablet implementation. The build copies the tracked `apps/crm` source into `public/crm`; that output is ignored and regenerated.

## Environment

Copy `.env.example` to `.env`. Keep real issuer, client, audience, bearer, and control-token values out of Git. The example file documents the optional OIDC, Runtime Fabric, Continuum, model, Workboard, and host-observation bindings.

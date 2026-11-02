# Connection and setup contract

## HTTP routes

| Route | Purpose | State boundary |
| --- | --- | --- |
| `GET /api/health` | Tablet process health | Process health only |
| `GET /api/auth/status` | OIDC/session configuration status | Does not prove runtime access |
| `GET /api/auth/start` | Owner-controlled Authorization Code + PKCE start | Requires configured issuer/client |
| `GET /api/auth/callback` | PKCE callback and short-lived HttpOnly session cookie | No token is returned to the UI |
| `GET /api/workforce/runtime-fabric` | Caller-scoped read-only Workforce snapshot | 401/503 until authenticated and contract-valid |
| `GET /api/agent-roster` | Local process/config and Voice carrier observation | Observation only; no task proof |
| `GET /api/runtime/probe` | Loopback Workboard health probe | Reachability is not UI verification |
| `GET/POST /api/continuum/notepad` | Existing Continuum-backed notepad read/write | Requires existing control binding for mutation |
| `GET /api/diagnostics/snapshot` | Local diagnostic observations | No production admission |

## Environment bindings

Set these only through an approved host/service mechanism. Never commit real values.

- `PORT` — local tablet port, default `3200`.
- `LEEWAY_MCP_AUTH_ISSUER` — existing Pocket ID/OIDC issuer.
- `LEEWAY_AGENT_VT_OIDC_CLIENT_ID` — existing public OIDC client.
- `LEEWAY_AGENT_VT_OIDC_REDIRECT_URI` — loopback callback, default `http://127.0.0.1:3200/api/auth/callback`.
- `LEEWAY_AGENT_VT_OIDC_SCOPE` — default `openid profile read:runtime`.
- `LEEWAY_MCP_AUDIENCE` — exact Runtime/MCP audience when required.
- `LEEWAY_AGENT_VT_COOKIE_SECURE` — set `true` when the callback is served over HTTPS.
- `LEEWAY_WORKFORCE_LOCAL_RUNTIME_URL` — exact loopback `/v1/workforce/snapshot` resource.
- `LEEWAY_WORKFORCE_MCP_RESOURCE_URL` — exact HTTPS `/mcp` resource.
- `LEEWAY_CONTINUUM_API` — existing Continuum API, default `http://127.0.0.1:4001`.
- `LEEWAY_WORKPLANE_CONTROL_TOKEN` — host-controlled Continuum mutation binding; blank means not configured.
- `LEEWAY_TABLET_MODEL_ENDPOINT` — optional loopback model adapter; blank preserves deterministic behavior.

The runtime adapter forwards the authenticated caller token. It does not accept a shared workforce bearer from an unauthenticated browser.

## Current connection state

Source and adapter contracts are present. A live Pocket ID issuer, OIDC client, authenticated Workforce snapshot, Workboard service, and Device Bridge native executor remain host/runtime gates. Configuration files do not promote those gates to connected or verified.

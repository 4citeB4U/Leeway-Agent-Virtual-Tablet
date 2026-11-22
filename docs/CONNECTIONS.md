# Connection and setup contract

## HTTP routes

| Route | Purpose | State boundary |
| --- | --- | --- |
| `GET /api/health` | Tablet process health | Process health only |
| `GET /api/auth/status` | OIDC/session configuration status | Does not prove runtime access |
| `GET /api/auth/start` | Owner-controlled Authorization Code + PKCE start | Requires configured issuer/client |
| `GET /api/auth/start?mode=execute` | Explicit device-control OIDC authorization request | Requests `device.bridge.execute`; issuer and Runtime must actually grant it |
| `GET /api/auth/callback` | PKCE callback and short-lived HttpOnly session cookie | No token is returned to the UI |
| `GET /api/workforce/runtime-fabric` | Caller-scoped read-only Workforce snapshot | 401/503 until authenticated and contract-valid |
| `POST /api/device-bridge/execute` | User-clicked window list, observe, input and submit through existing Runtime Fabric MCP | Requires a same-origin click, current owner bearer, registered execute tool and upstream C3 approval; no unconditional device control |
| `GET /api/agent-roster` | Local process/config and Voice carrier observation | Observation only; no task proof |
| `GET /api/runtime/probe` | Loopback Workboard health probe | Reachability is not UI verification |
| `GET/POST /api/continuum/notepad` | Existing Continuum-backed notepad read/write | Requires existing control binding for mutation |
| `GET /api/diagnostics/snapshot` | Local diagnostic observations | No production admission |

## Environment bindings

Set these only through an approved host/service mechanism. Never commit real values.

- `PORT` — local tablet port, default `3200`.
- `LEEWAY_MCP_AUTH_ISSUER` — canonical ZITADEL OIDC issuer (no Pocket ID fallback).
- `LEEWAY_AGENT_VT_OIDC_CLIENT_ID` — existing public OIDC client.
- `LEEWAY_AGENT_VT_OIDC_REDIRECT_URI` — loopback callback, default `http://127.0.0.1:3200/api/auth/callback`.
- `LEEWAY_AGENT_VT_OIDC_SCOPE` — default `openid profile read:runtime`. `device.bridge.execute` is requested only through the explicit execute sign-in flow.
- `LEEWAY_MCP_AUDIENCE` — exact Runtime/MCP audience when required.
- `LEEWAY_AGENT_VT_COOKIE_SECURE` — set `true` when the callback is served over HTTPS.
- `LEEWAY_WORKFORCE_LOCAL_RUNTIME_URL` — exact loopback `/v1/workforce/snapshot` resource.
- `LEEWAY_WORKFORCE_MCP_RESOURCE_URL` — exact HTTPS `/mcp` Runtime resource for both Workforce observation and existing bridge execution. Execution accepts the **caller token**, never a shared elevated service token.
- `LEEWAY_AGENT_VT_TRUSTED_ORIGIN` — mandatory exact origin for user-clicked execution POSTs, e.g. the current Tablet HTTPS origin or the approved local loopback origin. Missing or mismatched origin means deny.
- `LEEWAY_CONTINUUM_API` — existing Continuum API, default `http://127.0.0.1:4001`.
- `LEEWAY_WORKPLANE_CONTROL_TOKEN` — host-controlled Continuum mutation binding; blank means not configured.
- `LEEWAY_TABLET_MODEL_ENDPOINT` — optional loopback model adapter; blank preserves deterministic behavior.

The runtime adapter forwards the authenticated caller token. It does not accept a shared elevated bearer from an unauthenticated browser. Read discovery remains supported; it is no longer the Tablet's *only* interaction mode. Source tests do not prove installed physical device control.

## Current connection state

Source and adapter contracts are present. A live ZITADEL issuer, OIDC execute grant, authenticated Runtime MCP, native Device Bridge admission, and physical input/post-state remain host/runtime gates. Configuration files do not promote those gates to connected or verified.

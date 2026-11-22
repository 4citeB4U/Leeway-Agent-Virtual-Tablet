# Agent Virtual Tablet architecture

## Linchpin

The tablet is the replaceable interface boundary. It presents one command surface and routes to existing authorities. It must not clone the Runtime Fabric, Device Bridge, Workboard, Formula, Veritas, receipt, or learning ledger.

## Runtime flow

1. The browser loads the React tablet from `apps/agent-tablet`.
2. The Express backend serves the built UI and owns bounded local routes.
3. Workforce observation requires either an existing caller-scoped `Authorization: Bearer …` header or the owner-controlled ZITADEL/OIDC browser session. Tokens are never returned to the browser UI or written to logs by the adapter.
4. The Tablet also accepts explicit user-initiated window-control requests via `POST /api/device-bridge/execute`, using a separate caller-scoped `device.bridge.execute` grant. The request is forwarded to the **existing** Runtime MCP `bridge_device_window_control` tool, which remains the authority for native execution and its device admission. The Tablet cannot invent a scope, register a native driver, bypass C3 or certify Veritas. The new source is a candidate, not production-connected.
5. `integration/runtime-fabric/workforce-runtime-mcp.mjs` accepts only the exact contracts for the loopback workforce snapshot or HTTPS Streamable HTTP MCP resource. It returns provider evidence only and hard-fails authority claims.
6. Continuum notepad writes, when enabled, go to the existing Runtime Fabric Continuum API. The tablet does not create a private notepad authority.
7. Workboard is embedded only after a loopback health probe. A reachable endpoint is not treated as verified Workboard content.

## Authority boundaries

| Surface | Tablet role | Explicit non-claim |
| --- | --- | --- |
| Agent home / navigation | Presentation and routing | No execution or deployment authority |
| Workforce command center | Read-only projection | No worker animation, dispatch, Formula, Veritas, receipt, or learning admission |
| Agent Pad / Blackboard | Existing notepad and event presentation | No second storage or communication authority |
| LeeWay Office / Preview | Existing editor and preview surfaces | Preview is not deployment or a receipt |
| CRM | Bundled entitled application surface | Presence is not employee execution |
| Runtime Fabric adapters | Authenticated read plus execute-scoped capability forwarding | The Tablet does not issue tokens, grant execute scope, or perform native device commands |
| Device Bridge | External canonical native executor | This repository does not duplicate or impersonate Device Bridge; real commands require the separate execute grant |

## Interchange rule

The tablet can be replaced when the replacement preserves the following contracts:

- same bounded Workforce observation shape and explicit execute-scoped Tablet interaction;
- same explicit blocked/unverified states;
- same caller-scoped authentication boundary;
- same Continuum and Workboard adapter boundaries;
- same negative tests for forged authority and unsafe endpoints;
- same build/lint/integration acceptance gate.

The rest of LeeWay should depend on these logical capabilities, not on a specific tablet component, host path, browser, OS, or model provider.

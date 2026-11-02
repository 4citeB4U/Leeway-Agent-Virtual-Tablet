# Agent Virtual Tablet architecture

## Linchpin

The tablet is the replaceable interface boundary. It presents one command surface and routes to existing authorities. It must not clone the Runtime Fabric, Device Bridge, Workboard, Formula, Veritas, receipt, or learning ledger.

## Runtime flow

1. The browser loads the React tablet from `apps/agent-tablet`.
2. The Express backend serves the built UI and owns bounded local routes.
3. Workforce reads require either an existing caller-scoped `Authorization: Bearer …` header or the owner-controlled Pocket ID/OIDC browser session. Tokens are never returned to the browser UI or written to logs by the adapter.
4. `integration/runtime-fabric/workforce-runtime-mcp.mjs` accepts only the exact contracts for the loopback workforce snapshot or HTTPS Streamable HTTP MCP resource. It returns provider evidence only and hard-fails authority claims.
5. Continuum notepad writes, when enabled, go to the existing Runtime Fabric Continuum API. The tablet does not create a private notepad authority.
6. Workboard is embedded only after a loopback health probe. A reachable endpoint is not treated as verified Workboard content.

## Authority boundaries

| Surface | Tablet role | Explicit non-claim |
| --- | --- | --- |
| Agent home / navigation | Presentation and routing | No execution or deployment authority |
| Workforce command center | Read-only projection | No worker animation, dispatch, Formula, Veritas, receipt, or learning admission |
| Agent Pad / Blackboard | Existing notepad and event presentation | No second storage or communication authority |
| LeeWay Office / Preview | Existing editor and preview surfaces | Preview is not deployment or a receipt |
| CRM | Bundled entitled application surface | Presence is not employee execution |
| Runtime Fabric adapter | Authenticated read-only transport | Does not issue tokens, dispatch work, sign Veritas, or write ledgers |
| Device Bridge | External canonical authority | This repository does not duplicate or impersonate the Device Bridge |

## Interchange rule

The tablet can be replaced when the replacement preserves the following contracts:

- same read-only Workforce projection shape;
- same explicit blocked/unverified states;
- same caller-scoped authentication boundary;
- same Continuum and Workboard adapter boundaries;
- same negative tests for forged authority and unsafe endpoints;
- same build/lint/integration acceptance gate.

The rest of LeeWay should depend on these logical capabilities, not on a specific tablet component, host path, browser, OS, or model provider.

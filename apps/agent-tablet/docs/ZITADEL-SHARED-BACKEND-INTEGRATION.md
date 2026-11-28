# Shared ZITADEL and Backend Integration — Four Applications

LEEWAY HEADER — DO NOT REMOVE  
REGION: LEEWAY.TABLET.INTEGRATION  
TAG: DOC.ZITADEL_SHARED_BACKEND_INTEGRATION.V1  
WHAT: Exact, source-backed integration seams for Direct Connect Portal, Global Family Connect, Motion-Glyph-LAB and Watch-Win-Sale.  
WHY: Reuse the canonical LeeWay identity and backend instead of creating a second issuer, runtime, bridge or authority.  
WHO: Creator / LeeWay Industries; outside contributor implementation.  
WHERE: `apps/agent-tablet/docs/ZITADEL-SHARED-BACKEND-INTEGRATION.md`  
WHEN: 2026-11-28  
HOW: Inspect executable source and live qualification evidence; record only confirmed state and owner-gated steps.  
AUTHORITY: DOCUMENTATION_ONLY. This document creates no client, credential, receipt, deployment or production approval.  
LICENSE: Existing repository terms.

## Confirmed canonical identity

- Issuer: `https://leeway-mcp-d3xoxh.us1.zitadel.cloud`
- Discovery: `https://leeway-mcp-d3xoxh.us1.zitadel.cloud/.well-known/openid-configuration`
- Organization: `Leeway-Ecosystem`
- Project: `Leeway MCP`, ID `397622361785898800`
- MCP resource/API client: `397623943239906543`
- Gemini Bridge PKCE client pattern: `397734321332499695` — Authorization Code + PKCE S256, auth method None, no client secret.
- Pocket ID is formally retired under `SUP-IDENTITY-001-POCKET-ID-TO-ZITADEL`; no second issuer is permitted.

Observed token audience set: `397623943239906543`, `397633655821907183`, `397629401371514672`, `397734321332499695`, `397622361785898800`.

## Confirmed live backend resources

- Runtime Fabric MCP: `https://leeway-runtime-fabric-production.up.railway.app/mcp`
- Device Bridge MCP: `https://site--leeway-device-bridge--x5rlg8jby48d.code.run/mcp`
- OAuth protected-resource metadata: `https://<runtime-host>/.well-known/oauth-protected-resource/mcp`
- Runtime verifier source: `E:\LeeWay-Work\runtime-unified-backend-20261125\src\server\zitadel-mcp-auth.mjs`

The verifier accepts the configured audience plus additional observed audiences from the same issuer. Adding four public clients does not require changing this middleware or creating a new audience/resource server.

## Confirmed scopes and roles

Least-privilege starting set:

- `runtime.read` — read-only Runtime access for application status where needed.
- `device.discovery.read` — only for applications that genuinely call `bridge_devices` or `bridge_capabilities`.
- Do not grant `device.bridge.execute` by default.
- Creator/Tables祖先 privileges remain separate from ordinary application roles. LeeWay Core and the Master Tablet are not ordinary application users.

## Four client registrations required from the ZITADEL owner

| Application | Redirect URI | Auth method | PKCE | Secret |
|---|---|---|---|---|
| Direct Connect Portal | `https://larrylee2912-ux.github.io/Direct-Connect-Portal/auth/callback` | None | S256 | none |
| Global Family Connect | `https://agentlee2116-ctrl.github.io/Leeway-Global-P2P/auth/callback` | None | S256 | none |
| Motion-Glyph-LAB | `https://larrylee2912-ux.github.io/Motion-Glyph-LAB/auth/callback` | None | S256 | none |
| Watch-Win-Sale | `https://larrylee2912-ux.github.io/Watch-Win-Sale/auth/callback` | None | S256 | none |

Client IDs are intentionally not recorded here because they do not yet exist. No placeholder ID may be used as if it were admitted.

## Application seams

- Direct Connect Portal: reuse its existing `/auth/oauth/callback` and Express backend for token exchange where an authorized backend is deployed. Never embed provider secrets in GitHub Pages.
- Global Family Connect: currently uses Web Crypto signed invites and local IndexedDB. Add the shared PKCE shim only after a client ID exists; preserve its private circle model.
- Motion-Glyph-LAB: static React/Vite. A PKCE shim may display sign-in state, but no inference or admin authority is granted.
- Watch-Win-Sale: static HTML/JS. PKCE may bind user identity for authorized offers; it must not simulate rewards or transactions.

## Backend capability status

- Device Bridge live `tools/list` currently returns seven read-only tools; registry reports `NO_REGISTERED_ADAPTERS`.
- No qualified live telephony or email execution capability exists.
- Direct Connect `tel:` is an OS handoff with explicit user gesture; native Telecom/CallKit is not proven.
- Gmail/Microsoft/Proton credentials are blank in `.env.example`; no live email delivery is proven.
- Continuum canonical provider contract exists but is not mounted into these browser apps. Local state remains local and must be labelled so.

## Blocking owner actions

1. ZITADEL Cloud admin session/sudo/passkey proof to create the four PKCE clients and grant least-privilege roles.
2. Confirm exact callback paths; Direct Connect may use an authorized backend callback rather than a Pages static callback.
3. Provider secret-store access for masked `LEEWAY_MCP_*` values in Northflank/Railway.
4. Northflank/Railway deployment authorization for any env, build, CORS or upstream change.
5. Runtime `/mcp` browser cross-origin acceptance must be proven, or an approved same-origin path proxy used. Metadata CORS is not proof of `/mcp` CORS.
6. Signed device enrollment remains `MANAGED_BRIDGE_SIGNED_ENROLLMENT_NOT_QUALIFIED`; no live phone/email execution can be claimed.
7. Independent Veritas, Receipt Authority admission and Learning Ledger remain outstanding for any four-client rollout.

## Acceptance tests still required

- Real ZITADEL authorization code + PKCE flow for each client.
- Correct token audience and rejection of wrong audience/issuer.
- Authorized and unauthorized API calls.
- User isolation; Creator/LeeWay Core privileges not reachable by ordinary clients.
- No credentials exposed in Pages bundles.
- Actual backend operation and persistence evidence where each app requires it.
- Source revisions, CI output and live browser evidence recorded per application.

Until these are complete, the correct state is `CONFIGURED_PLAN_NOT_EXECUTED` for the shared integration. Source presence, CI success and this document do not confer production authority.

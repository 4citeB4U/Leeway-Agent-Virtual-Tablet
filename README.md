<!--
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.AGENT.TABLET.REPOSITORY.README
TAG: LEEWAY.TABLET.READ.AND.EXECUTE.ENTRYPOINT.V1
5WH:
WHAT = Describe the Tablet as the sole user-facing LeeWay control ground with read and authorized execute modes.
WHY = Eliminate the obsolete read-only-only architecture claim without bypassing permission or evidence.
WHO = Creator and LeeWay Tablet contributors.
WHERE = README.md.
WHEN = 2026-11-16.
HOW = Distinguish existing Runtime Fabric execution adapters from presentation and source evidence.
LICENSE = Existing repository terms.
-->
# LeeWay Agent Virtual Tablet

Live browser UI: https://4citeb4u.github.io/Leeway-Agent-Virtual-Tablet/

This repository isolates the LeeWay Agent Virtual Tablet so its interface and replaceable host adapter can evolve without rewriting the surrounding LeeWay system.

The tablet is an interface and bounded backend. It is not a second Runtime Fabric, Device Bridge, Formula, Veritas, receipt, or learning authority. It observes those systems and requests owner-authorized execution through the existing Runtime Fabric and Device Bridge. It keeps unavailable or unverified state visible; it never grants its own device permissions.

## Included boundary

- `apps/agent-tablet/` — React/Vite tablet UI, Express backend, notebook/editor surfaces, command center, Agent Pad/Blackboard, Workforce read-only projection, and host probes.
- `apps/crm/` — the small CRM surface that the tablet packages into its build as an entitled operations surface.
- `integration/runtime-fabric/` — fail-closed Runtime Fabric MCP clients for observation and execute-scoped Device Bridge window control, plus negative/contract tests. Full native execution depends on Runtime and host admission.
- `docs/` — architecture, connection contracts, portability boundaries, and the isolation receipt for this extraction.
- `.github/workflows/` — repository-local lint, integration, and build gates.

## Quick start

Requirements: Node.js 18+ and npm.

```bash
npm run install:tablet
copy apps/agent-tablet/.env.example apps/agent-tablet/.env
npm test
npm run dev
```

Open `http://127.0.0.1:3200`.

The default configuration is intentionally conservative. Read-only observation remains an available permission, but **it is not the Tablet's only mode**. Device controls explicitly request a separate execute scope:

- Workforce telemetry remains blocked until an owner-controlled bearer or OIDC session is present.
- Native window operations are blocked unless the user explicitly requests execute-mode login, the trusted origin and authenticated Runtime MCP resource are configured, and original Device Bridge/C3 admission succeeds.
- A control click can type or submit a message only after its observed window/target identity has been provided. Physical verification and canonical receipts remain separate gates.
- The model endpoint is optional and must be loopback-authorized.
- Search and data-fabric providers remain visibly unbound unless a separate approved adapter is implemented.
- Workboard content is read through the selected local service only after a health probe; no assignments or messages are seeded by the tablet.
- `/api/github/push` remains a bounded application route from the inherited tablet source; it is not used by repository CI or this extraction process.

## Architecture at a glance

```text
Creator / browser
      |
      v
Agent Tablet UI  <---->  Express tablet backend
      |                         |
      |                         +--> local host observations / diagnostics
      |                         +--> Workboard health-probed iframe
      |                         +--> authenticated Device Bridge input / submit
      |                         +--> Continuum notepad adapter
      |                         +--> optional loopback model adapter
      v
Runtime Fabric read + execute-scoped adapters
      |
      +--> caller-scoped bearer --> loopback snapshot or HTTPS MCP /mcp
      +--> execute mode requires device.bridge.execute and user click
      |
      +--> Device Bridge / Runtime Fabric remain external authorities
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) and [docs/CONNECTIONS.md](docs/CONNECTIONS.md) for the full boundary. See [docs/ISOLATION-RECEIPT-20261102.md](docs/ISOLATION-RECEIPT-20261102.md) for source provenance and the current verification state.

## Portability

The contract is path-, operating-system-, device-, and model-agnostic. The current adapter implementation is Node.js/Express and the current tested platform is this Windows workstation plus GitHub Actions' Linux runner. That does not claim universal native-device execution.

## License

Apache-2.0. See [apps/agent-tablet/LICENSE](apps/agent-tablet/LICENSE).

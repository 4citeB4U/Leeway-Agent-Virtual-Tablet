# LeeWay Agent Virtual Tablet

This repository isolates the LeeWay Agent Virtual Tablet so its interface and replaceable host adapter can evolve without rewriting the surrounding LeeWay system.

The tablet is an interface and bounded backend. It is not a second Runtime Fabric, Device Bridge, Formula, Veritas, receipt, or learning authority. It reads those systems through explicit adapters and keeps unavailable or unverified state visible.

## Included boundary

- `apps/agent-tablet/` — React/Vite tablet UI, Express backend, notebook/editor surfaces, command center, Agent Pad/Blackboard, Workforce read-only projection, and host probes.
- `apps/crm/` — the small CRM surface that the tablet packages into its build as an entitled operations surface.
- `integration/runtime-fabric/` — fail-closed, read-only Runtime Fabric MCP and loopback snapshot adapter plus negative/contract tests.
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

The default configuration is intentionally conservative:

- Workforce telemetry remains blocked until an owner-controlled bearer or OIDC session is present.
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
      |                         +--> local host observations (read-only)
      |                         +--> Workboard health-probed iframe
      |                         +--> Continuum notepad adapter
      |                         +--> optional loopback model adapter
      v
Runtime Fabric read-only adapter
      |
      +--> caller-scoped bearer --> loopback snapshot or HTTPS MCP /mcp
      |
      +--> Device Bridge / Runtime Fabric remain external authorities
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) and [docs/CONNECTIONS.md](docs/CONNECTIONS.md) for the full boundary. See [docs/ISOLATION-RECEIPT-20261102.md](docs/ISOLATION-RECEIPT-20261102.md) for source provenance and the current verification state.

## Portability

The contract is path-, operating-system-, device-, and model-agnostic. The current adapter implementation is Node.js/Express and the current tested platform is this Windows workstation plus GitHub Actions' Linux runner. That does not claim universal native-device execution.

## License

Apache-2.0. See [apps/agent-tablet/LICENSE](apps/agent-tablet/LICENSE).

<!--
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.AGENT.TABLET.DIAGNOSTICS.DOCUMENTATION
TAG: LEEWAY.TABLET.DIAGNOSTICS.PACKAGE.CONTRACT.V1
5WH:
WHAT = Document the existing Tablet Diagnostics package and its observation boundaries.
WHY = Keep future diagnostic surfaces reproducible without inventing hardware state or authority.
WHO = LeeWay Tablet maintainers under Creator authorization.
WHERE = apps/agent-tablet/DIAGNOSTICS.md.
WHEN = 2026-11-26.
HOW = Describe the canonical package, current adapter coverage, evidence rules, and validation commands.
LICENSE: Repository terms; no new license asserted.
-->

# LeeWay Diagnostics package contract

## Canonical package and build

Diagnostics is a surface of the existing Agent Tablet package, not a second application, device authority, database, or event bus.

- UI: `src/components/DiagnosticsBoard.tsx`
- Response contract and normalization: `src/diagnostics/contract.ts`
- Host adapters and `GET /api/diagnostics/snapshot`: `server.ts`
- Contract tests: `test/diagnostics/contract.test.ts`
- Static assets and app integration are included by the existing Vite build.

From the repository root, `npm test` runs Tablet type-checking, Runtime integration tests, Diagnostics contract tests, and the production build. `npm run build` produces the normal Tablet package, including the Diagnostics surface and the standalone server. A new diagnostic surface must use the existing package and add its tests to `npm run test:diagnostics`; do not create an alternate telemetry authority or mark a feature available because its UI compiled.

## Observation and evidence rules

1. The host adapter reports only values returned by the operating system. Missing or invalid values stay `UNAVAILABLE`; they are never coerced to zero.
2. The endpoint omits serial numbers, network addresses, MAC addresses, PnP identifiers, user names, and local paths. It is loopback-only and returns `Cache-Control: no-store`.
3. `HOST_PROCESS_ONLY` is not a registered Device Bridge identity. Runtime agents, skills, GPU inference, physical component placement, and cross-device status require their owning authenticated providers.
4. An OS-reported device identity or sensor value does not prove component health, physical location, bus topology, or manufacturer documentation.
5. Session charts are volatile page memory. They are not Continuum history, a receipt, a Veritas decision, or durable evidence.
6. Opening Diagnostics is read-only. Stress tests, shell commands, repairs, driver changes, and other device effects remain behind existing owner-authorized Runtime and Device Bridge flows.
7. Unsupported platform capabilities remain explicit. Do not copy one device's inventory to another platform or claim qualification from a build or a single host.
8. The Board includes an interactive schematic hierarchy (exterior, assembly, motherboard, component, and manufacturer-reported identity). Rotation, zoom, and exploded view change only its presentation; they do not represent measured physical geometry, wiring, or device control.

## Current adapter coverage

| Capability | Current source behavior |
| --- | --- |
| Windows host identity, CPU, memory, storage, graphics adapters, motherboard, firmware, battery, network, USB, audio, and ACPI thermal zones | Read-only Windows CIM/OS probes where the provider exposes them; missing providers and collection failures remain visible |
| Linux/macOS process host, CPU model/load, and memory | Node OS observations; storage, sensors, device enrollment, and detailed inventory remain unavailable |
| Android/iOS physical-device inventory and sensors | No native Device Bridge adapter is connected; unavailable |
| Matched motherboard 3D model and verified component coordinates | Unavailable. The Board provides an interactive schematic hierarchy with unknown placement; it does not render guessed physical geometry |
| GPU utilization, package-specific CPU/GPU temperature, live bus traffic, durable Continuum history, Runtime agent activity, independent Veritas, and Receipt Authority | Not provided by the current endpoint |

These are source capability classifications, not deployment, cross-platform, production, or independent-verification claims.

## Original Matrix surface and bidirectional state contract

- Surface resolver: `src/diagnostics/surface.ts` consumes the existing Runtime `resolveAppSurface` decision first. A local adapter config is accepted only when the host explicitly marks `LOCAL_ADAPTER_AUTHORIZED` through `GET /api/diagnostics/surface`; no universal `127.0.0.1:8890` address or `pc-primary` identity is embedded in the frontend.
- Same-origin proxy: `GET /diagnostics/matrix/:asset` resolves the original surface on the server from `LEEWAY_DIAGNOSTICS_ORIGIN`, with an admitted asset allowlist. Remote clients never receive the Creator workstation loopback address as their own surface.
- State contract: `src/diagnostics/sync.ts` carries `leeway.diagnostics.state.v1` over the existing BroadcastChannel/postMessage path. It includes device, section, component, visualization, inspector, topology path and observation version/freshness. Messages require explicit trusted origins and source-window validation, never `*`; self-echoes, older sequences and stale observations are rejected.
- The iframe sandbox boundary is unchanged. No credential, bearer or authentication material is placed in presentation messages.

## Recovered original visualization assets

Eight original assets were recovered byte-for-byte from `digital-brain-golden-widget-proof` / the `omniboard---universal-hardware-diagnostic-engine.zip` package and pinned in `src/diagnostics/assets.ts`:

`lenovo-83nx-laptop-front.png`, `lenovo-83nx-laptop-rear.png`, `lenovo-83nx-motherboard-map.png`, `lenovo-83nx-thermal-board.png`, `lenovo-83nx-side-bars.png`, `lenovo-83nx-topology-stage.png`, `omniboard-laptop-exploded-reference.jpg`, `lenovo-83nx-manufacturer-reference.pdf`.

The exploded reference SHA-256 `9a9815ceeae9125509ecf9adf099a231672d1740ee54310baa341be361cd6086` matches the original embedded asset in `matrix.html`. Every recovered illustration is qualified `CATEGORY_ILLUSTRATION_NOT_MODEL_EVIDENCE`; the manufacturer reference is `REFERENCE_DOCUMENT_NOT_DEVICE_SPECIFIC`. None is promoted to verified physical geometry, exact board revision imagery or an independently verified thermal measurement.

## Validation commands

From the repository root:

- `npm run lint` — TypeScript type check.
- `npm run test:integration` — 42 integration tests (four new Diagnostics surface contract tests).
- `npm run test:diagnostics` — 16 tests (contract, surface, sync and recovered assets).
- `npm run build` — production Tablet package.
- `npm test` — all of the above; measured exit code `0` on 2026-11-26.

## Remaining limitations

- Observation values come from the existing host adapter and OpenCode's authorized backend contract. This package does not create a telemetry backend; GPU temperature/utilization/VRAM/power, camera inventory, native hardware and wireless observations remain unavailable in the local host snapshot until admitted by their owning providers.
- The original Matrix is loaded through the same-origin proxy without modifying its frontend. Component-level state is transmitted through the versioned contract; deep control of internal iframe widgets requires the original frontend to emit the same contract and is not claimed here.
- All eight navigation sections are preserved in the original Matrix. Section behavior is owned by that original implementation; a visible button alone is not counted as functional proof.
- The running candidate served the new `/api/diagnostics/surface` and original Matrix proxy at port 3218 during validation. A server restart may be required for the recovered-asset route depending on the active process's load time; no application restart was performed by this contributor.

## Original frontend state bridge (functional amendment)

The original `machine-consciousness/digital-brain/diagnostics/matrix-bridge.js` was extended in place, preserving `LeeWayDiagnosticsHost` and `LeeWayBrainView`. It now:

- reads `bodyId` and an explicit `leewayTrustedOrigins` list from its own/script/page URL,
- emits `leeway.diagnostics.state.v1` to the parent and BroadcastChannel on local interactions,
- consumes only messages whose origin is explicitly trusted and whose source is the parent window,
- rejects self-echoes, older sequences and older observation snapshots,
- exposes `LeeWayDiagnosticsBridge.snapshot()` for inspection.

`index.html` was extended with the bridge script so the independent original application can consume the same contract. No visualization replacement was created.

## Fallback observation repair

`matrix-exact-dashboard.js` no longer starts with a predetermined profile (`cpuLoad: 17`, `gpuTemp: 53`, `usbCount: 11`, etc.). All 17 metrics now start `null` / `UNAVAILABLE`, are reset on each refresh so a disconnected provider cannot leave stale values, and are labelled `RETAINED` only when returned by the owner's Continuum Brain adapter. Bus lane percentages and thermal overlays no longer invent activity; unmeasured lanes are zero-width and explicitly `UNAVAILABLE`. Predetermined CPU/GPU/memory/storage model strings were replaced with observed descriptor values or `UNAVAILABLE`.

## Browser-level qualification

`test/browser/diagnostics-functional.browser.mjs` drives the running candidate with Playwright. A successful run measured 8 checks (bridge contract, parent→Matrix state, Matrix→parent state, UNAVAILABLE rendering, all eight original sections, provider disconnect, provider recovery, no uncaught page errors). It is available as `npm run test:browser:diagnostics` and requires a running local candidate plus a Chromium install.

During the final re-run, a concurrent contributor changed the active 3218 application so the Diagnostics view no longer opened from `?view=diagnostics`; the browser test therefore could not be re-confirmed against that later process. The 42 integration and 16 Diagnostics tests plus the production build still passed after this contributor's source changes. This is recorded as evidence **against** claiming current-running-candidate acceptance after the concurrent change.

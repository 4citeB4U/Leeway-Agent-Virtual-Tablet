<!--
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.AGENT.TABLET.CORE.INTEGRATION
TAG: LEEWAY.TABLET.CORE.ECOSYSTEM.INTEGRATION.V1
5WH:
WHAT = Specify the single Tablet entrypoint to the existing LeeWay core and native widgets.
WHY = Separate user control from execution while onboarding voice, vision, GPU, skills and the machine-consciousness runtime.
WHO = Creator/Human Authority and LeeWay Tablet integration workers.
WHERE = docs/CORE-TABLET-DEVICE-BRIDGE-INTEGRATION-20261116.md.
WHEN = 2026-11-16.
HOW = Bind each surface to canonical authorities, original identity, authenticated capability and independent post-state verification.
LICENSE = Existing repository terms; no new rights asserted.
-->
# LeeWay core embodiment — Device Bridge executes, Tablet controls

**Status:** SOURCE CANDIDATE, NOT DEPLOYED. Existing parent mission W01 and canonical authorities retained. This is an application integration contract, not another registry, Runtime, verifier, agent identity, or execution queue.

## User experience contract

- All user-visible operations originate within Agent Virtual Tablet: Agent Lee conversation, Workforce, Continuum, Brain/Diagnostics, devices, model selection, GPU resources, audio, video, Skills, federation and receipts.
- The Tablet is the only human-facing control ground. Browser/desktop widgets are detachable views of the same authenticated Tablet session; they must not become independent control planes. The initial `CoreServiceDock` opens an **in-tab** floating control. A truly desktop-wide widget requires the existing Device Bridge native overlay and is **NOT IMPLEMENTED** by this source.
- Existing providers execute: `Tablet UI → authenticated Tablet backend → existing Runtime Fabric policy/workplane → canonical Device Bridge or capability provider → Formula / Veritas PRE / real operation / Veritas POST → Receipt Authority → Learning` as applicable.
- Every live command needs current owner, agent, device, capability, consent, time-bound observation and idempotent correlation. Distinct online/offline models never inherit execution authority merely from sign-in or discovery.
- Backends must return `NOT_CONNECTED`, `UNAUTHORIZED`, `UNVERIFIED` or `EXECUTED` distinctly; a frontend may not convert source/code presence into live success.

## Existing source owners to integrate (not rebuild)

| Core service | Canonical source | Tablet integration | Onboarding gate |
|---|---|---|---|
| Agent Lee / Machine Consciousness | Runtime Fabric Machine Consciousness | One existing authenticated conversation and personal identity via Tablet; model provider is replaceable | Voice/response not implied by text |
| Runtime/C3/Formula/Veritas/Receipts/Learning | Runtime Fabric; Formula Live; LEEWAY-VERITAS; Receipt-Authority; Learning Ledger | Authenticated existing APIs; independent post-state and custody | C3 single real operation |
| Device Bridge / Native computer controls | LEEWAY-DEVICE-BRIDGE | Execute-scoped calls; approved screen observation, keyboard/mouse, files/processes and multi-device consent | Actual physical post-state |
| Agent Skills | LeeWay-Agent-Skills | Existing `skills.list`, `skills.read` provider, then authorized skill invocation via owning Runtime/Bridge | Dynamic source-SHA skill and permissions check |
| GPU / LDWMD / VRAM / Model Hub | LeeWay-Edge-GPU; Runtime LDWMD; LeeWay-VRAM-Database; LeeWay-Model-Hub | Model/resource panel and request-bound activation/inference | Real physical tensor + token output, buffer recovery and evidence |
| Continuum and Seafile | LeeWay-Continuum; approved Seafile data fabric | Owner-scoped memory/readback and Seafile browse/transfer adapter | Authenticated durable data readback/restart |
| Digital Brain and Diagnostics | Leeway-Digital-Brain-Diagnostincs-pkg | Device-local only and owned by each physical device | Consent-granted local read and diagnostic evidence |
| Voice / microphone / listening | LeeWay-Voice-Fabric; Device Bridge voice capabilities | User grants audio; microphone ingress → STT → conversation; Voice Fabric output/interrupt | Real mic and speaker input/output |
| Vision / cameras | Leeway-Agent-Lee-Vision; Device Bridge camera adapters | Per-device camera/screen consent, fresh frame/session, supported agent's vision input | Real frame and qualified second-agent observation |
| RTC and Federate | LeeWay-Edge-RTC; Leeway-Federate-Web | Existing permitted media and federation adapters; no second Layer-2 or user identity | Actual peer/session readback |
| Tablet/widgets | Leeway-Agent-Virtual-Tablet | Launcher and in-tab popout first; native OS widget only from device-owned UI host | User click and resulting real UI post-state |

## Bounded implementation path

**G0 SOURCE:** Reconcile mainline and active PRs; pin the exact existing provider APIs and source SHAs. Protect the already-working Runtime and 8008 listener.

**G1 LIFECYCLE:** Remove legacy Desktop Commander independent startup using the reviewed Boot Fabric PR; run read-only inventory and safe task-retirement script. Leave Docker optional, Seafile retained, and Runtime Supervisor preserved.

**G2 TABLET CONTROL — SOURCE CANDIDATE IMPLEMENTED:** `tablet-device-execution.mjs`, `POST /api/device-bridge/execute`, explicit OIDC execute mode, and `DeviceBridgeControl` now forward only the exact observed window-control actions to the existing Runtime MCP `bridge_device_window_control`. Separate list/observe/input/submit user clicks prevent automatic command execution. Browser Origin, X-LeeWay-User-Intent and caller bearer are required. Live Runtime deployment and physical device execution remain NOT EXECUTED. The independent Runtime source PR #177 already requires `device.bridge.execute` and must be admitted rather than bypassed.

**G3 SENSORY:** Bind approved `voice.status`, `voice.speak`, microphone and camera ingress, interruption and visible session controls using existing Device Bridge and media adapters; test one real audio echo and one fresh camera frame. Claim neither until execution and device readback.

**G4 COMPUTE AND MEMORY:** Bind Model Hub service to physical GPU/LDWMD/VRAM providers. Include CPU fallback where approved, offline capability, model selection, encrypted Continuum readback, device Brain isolation and Seafile. Test actual model output, failover and restart.

**G5 FIVE-WORKER EXCHANGE:** Each authenticated outside agent must have a distinct effective execution grant; send the exact `hello` message to real Gemini/Copilot composer and verify real response without another agent impersonating the sender.

**G6 EMBODIMENT:** Once services are active and independently qualified, introduce native detachable LeeWay and product widgets through the Tablet. Studios and additional application products come later.

## Negative tests and acceptance

- UI must not claim a service is active on the strength of a repository, a port, registry discovery or CI alone.
- Browser page JS cannot grant Bridge execution; only authenticated Runtime admission can. Never auto-enable microphone or camera.
- A model or another worker cannot turn on devices or invoke Skills without a scoped authenticated capability.
- Device Brain/Diagnostics are local device property; owner continuity stores only permitted history.
- No runtime may start a duplicate Desktop Commander, Formula, allocator, verifier or receipt writer.
- Must pass reboot, clean logon, provider restart, lost network and interrupted actions without duplicate process ownership.
- Before declaring complete: physical command execution, identity verification, real audio, real visual frame, two-way agent exchange, independent Veritas and original Receipt/Learning readback.

This document is **not** an evidence receipt. All live operations and production admission remain `NOT_EXECUTED` until verified through the original authorities.

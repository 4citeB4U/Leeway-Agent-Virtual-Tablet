<!--
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.TABLET.USER_APP.INSTALLATION.CONTRACT
TAG: LEEWAY.TABLET.USER_APP.OWNER_SCOPED_INSTALLATION.V1
5WH:
WHAT = Define first-app installation acceptance and the existing authority boundaries for user-created apps.
WHY = Avoid mistaking source manifests, GitHub links, browser cache or iframes for owner-installed, authorized LeeWay applications.
WHO = Creator and canonical Runtime/Tablet/Continuum/Agent Skills owners.
WHERE = docs/architecture/USER-INSTALLABLE-TABLET-APPS-V1.md.
WHEN = 2026-11-23.
HOW = Source-valid candidate -> Runtime admission -> original Continuum persistence -> shell launch -> Agent Lee grant -> receipt/rollback.
LICENSE = Existing repository terms.
-->

# LeeWay user-installable Tablet apps — v1 integration contract

**Active mission:** LeeWay Engineering #6 / Tablet issue #7. **Status:** manifest/source candidate tested; real owner-installed apps not yet admitted. Craft Anything SKILL.md is merged into canonical Agent Skills, but no live Craft CLI or MCP app-build operation has been verified.

## Ownership and install pipeline

The original Tablet owns app presentation, launch/close and widget visibility. The original Runtime Fabric owns authenticated app-install admission, issuer/owner identity, grants, operator consent, execution and resource quotas. Continuum stores owner-scoped app installation/revision records and user data with CAS/readback. LeeWay Agent Skills/Craft Anything/REA perform authorized source analysis and building *only when their actual tool adapters have been qualified*. The existing Bridge owns any permissioned device-local work. Independent Veritas and Receipt Authority remain independent.

1. User selects **Create app** or **Import authorized GitHub project**, with explicit rights and project scope. No arbitrary repository URL is automatically executed.
2. REA/Craft Anything inspects an approved commit, proposes adaptation and builds in an isolated approved workspace/provider. External source licensing, attribution and consent survive any adaptation.
3. Builder produces the versioned `leeway.tablet-app.v1` web manifest. Browser/Tablet pure validation alone returns `VALIDATED_SOURCE_CANDIDATE_ONLY`, `installed:false`, `executionAuthorized:false`, `toolGrants:NOT_GRANTED`. SHA-256 values in a manifest are untrusted **claims** until the original release verifier recomputes them from actual bytes and validates an owner-approved signer/provenance.
4. Runtime checks the real authenticated tenant, publisher identity and entitlements; approved origin/content isolation, exact package integrity, permission review, policy and release signature. It then performs a scoped install transaction through the original Continuum owner domain with idempotency, expected revision, durable readback and rollback.
5. Only admitted installed-app records are added to the Tablet dynamic app catalog/home icon/taskbar/widget menus, separated from the immutable built-in apps. Tenant IDs, UI localStorage and any iframe parameters are never authorization authorities.
6. Each user-app web surface is sandboxed under a separate origin or an opaque-origin sandbox, with scoped postMessage protocol and CSP. No ambient camera/microphone/clipboard/native execution or privilege inheritance. Agent Lee workflow descriptors are only requests; active grants and C3 admission require Runtime.
7. Uninstall removes that tenant's launch/entitlement record; preserve their owned project/document state and provide reversible rollback. Share/sell requires separate publisher/license validation, review, distribution, entitlements, payment-provider approval and revocation.
8. Containers are P2 hosted compute providers under the *same original Runtime* and cannot be assumed available on arbitrary Android/Apple devices. A phone can operate a qualified independently hosted container while the creator PC is offline.

## Non-negotiable security/portability

No `C:\\...`, `E:\\...`, `localhost`, hardcoded workstation hostname or Creator-only signing key is a universal prerequisite. Host-local paths are allowed only inside native adapters. No new issuer/control plane, hidden privilege grants or synthetic receipt. Never use browser localStorage as cross-device application custody. Privileged app-host capabilities must be denied when no qualified provider exists.

## Acceptance (not yet executed)

- Valid owner app installs with signed content/provenance and exact source/launch readback across Android/Apple/Windows/Linux authorized client shells.
- App appears without editing the Tablet's compiled built-in catalog; launches in full view and approved floating-widget surface, survives sign-out/reconnect and maps to the same owner-scoped Continuum state.
- A user may revoke/uninstall/rollback it without deleting owned data; a second tenant cannot enumerate or execute it without explicit share rights.
- Wrong owner, forged signature/hash, unknown app ID, malicious origin, unsupported platform, unauthorized native action, revoked publisher, missing builder/provider and replayed install all fail closed.
- Source-only manifest tests and PR CI are not actual installation, independent Veritas, production or device acceptance.

**Follow-up implementation owner:** original Runtime Fabric + Continuum app-install provider, then Tablet authorized API and UI. P2 OCI/container provider stays in Runtime issue #199. Logistics mobile in issue #3.

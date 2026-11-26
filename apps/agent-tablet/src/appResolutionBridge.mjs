/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.TABLET.APP.RESOLUTION.BRIDGE
TAG: LEEWAY.TABLET.RUNTIME.DECISION.CONSUMER.V1
WHO: Creator-authorized outside Tablet contributor
WHAT: Consume authenticated Runtime application-resolution decisions for Tablet and Widget surfaces.
WHEN: 2026-11-25
WHERE: apps/agent-tablet/src/appResolutionBridge.mjs
WHY: Remove fixed loopback fallbacks and prevent unauthorized resolver bypass without inventing decisions.
HOW: Inject the existing Runtime decision provider; validate session, tenant, capabilityRef and state; fail closed.
AUTHORITY: SOURCE_CANDIDATE. No Runtime decision is generated here; no entitlement or provider is created.
LICENSE: Existing repository terms.
*/
const STATES = new Set(['HOSTED_APPROVED', 'LOCAL_ADAPTER_AUTHORIZED', 'UNAVAILABLE', 'DENIED']);
const deny = reason => Object.freeze({ state: 'DENIED', url: null, reason });
const unavailable = reason => Object.freeze({ state: 'UNAVAILABLE', url: null, reason });

/**
 * @param {{decide?: (request: object) => Promise<object>|object}} injected
 * `decide` must be supplied by the existing authenticated Runtime authority.
 */
export function createRuntimeSurfaceDecisionSource({ decide } = {}) {
  if (typeof decide !== 'function') {
    return async function decisionSource() {
      return unavailable('RUNTIME_DECISION_SOURCE_UNBOUND');
    };
  }
  return async function decisionSource(app, surface, context) {
    if (!context || typeof context.tenantId !== 'string' || !context.tenantId ||
        context.sessionAuthorization !== 'AUTHORIZED') {
      return deny('SESSION_NOT_AUTHORIZED');
    }
    let decision;
    try {
      decision = await decide({
        capabilityRef: app.capabilityRef,
        appId: app.id,
        surface,
        tenantId: context.tenantId,
        accountId: context.accountId
      });
    } catch {
      return unavailable('RUNTIME_DECISION_PROVIDER_FAILURE');
    }
    if (!decision || typeof decision !== 'object' || !STATES.has(decision.state)) {
      return unavailable('RUNTIME_DECISION_INVALID');
    }
    if (decision.capabilityRef && decision.capabilityRef !== app.capabilityRef) {
      return unavailable('CAPABILITY_REF_MISMATCH');
    }
    if (decision.tenantId && decision.tenantId !== context.tenantId) {
      return unavailable('TENANT_MISMATCH');
    }
    // Entitlement, service availability, adapter connectivity, session
    // authorization and persistence are evaluated by the pure surface resolver.
    return Object.freeze({ ...decision });
  };
}

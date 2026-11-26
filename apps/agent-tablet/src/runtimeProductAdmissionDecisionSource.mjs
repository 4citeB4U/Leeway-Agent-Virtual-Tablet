/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.TABLET.RUNTIME.PRODUCT.ADMISSION.BINDING
TAG: LEEWAY.TABLET.RUNTIME.DECISION.BINDING.V1
WHO: Creator-authorized outside Tablet contributor
WHAT: Bind the application decision bridge to the original Runtime product-admission and feature-policy authorities.
WHEN: 2026-11-25
WHERE: apps/agent-tablet/src/runtimeProductAdmissionDecisionSource.mjs
WHY: Preserve entitlement, availability, authorization, session and persistence as distinct states without a second authority.
HOW: Inject existing createCustomerProductAdmission / createCustomerFeaturePolicy instances and an approved surface supplier; default deny.
AUTHORITY: SOURCE_CANDIDATE. No Runtime grant, URL, entitlement or revocation is generated here.
LICENSE: Existing repository terms.
*/
const deny = reason => Object.freeze({ state: 'DENIED', url: null, reason });
const unavailable = reason => Object.freeze({ state: 'UNAVAILABLE', url: null, reason });
const ref = value => typeof value === 'string' && /^[A-Za-z0-9._:@/-]{3,160}$/.test(value);
const launchOrigins = new Set([
  'desktop', 'context-menu', 'taskbar', 'floating-widget',
  'restored-widget', 'widget-control', 'open-request-file'
]);
const nativeRequestId = value => typeof value === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

/**
 * The injected authorities are the canonical Runtime instances from
 * 4citeB4U/Leeway-Runtime-Fabric commit bb635f4 (PR #200):
 * createCustomerProductAdmission({...}).authorize(request) and
 * createCustomerFeaturePolicy({...}).resolve(scope).
 * `supplySurface` must come from the approved host; no URL is invented.
 */
export function createRuntimeProductAdmissionDecisionSource({
  admission, featurePolicy, capabilityActionMap = Object.freeze({}), supplySurface, now = () => Date.now()
} = {}) {
  if (typeof admission?.authorize !== 'function' || typeof featurePolicy?.resolve !== 'function') {
    return async function decisionSource() {
      return unavailable('ORIGINAL_RUNTIME_DECISION_AUTHORITY_UNBOUND');
    };
  }
  return async function decisionSource(app, surface, context) {
    if (!['tablet', 'widget'].includes(surface)) return deny('SURFACE_NOT_ALLOWLISTED');
    if (!ref(context?.sessionRef) || !ref(context?.tenantRef) ||
        !ref(context?.projectRef) || !ref(context?.deviceRef)) {
      return deny('OWNER_TENANT_DEVICE_SESSION_REQUIRED');
    }
    const nativeRequest = context.nativeRequest;
    if (nativeRequest && (
      nativeRequest.appId !== app.id ||
      nativeRequest.capabilityRef !== app.capabilityRef ||
      nativeRequest.surface !== surface ||
      !nativeRequestId(nativeRequest.requestId) ||
      !Number.isSafeInteger(nativeRequest.requestedAt) ||
      context.sessionAuthorization !== 'AUTHORIZED' ||
      !launchOrigins.has(nativeRequest.launchOrigin) ||
      nativeRequest.appSessionId !== `leeway.app.${app.id}`
    )) {
      return deny('NATIVE_REQUEST_BINDING_INVALID');
    }
    const action = capabilityActionMap[app.capabilityRef];
    if (!ref(action)) return deny('UNKNOWN_CAPABILITY_DENIED');

    const policy = await featurePolicy.resolve({
      sessionRef: context.sessionRef,
      tenantRef: context.tenantRef,
      projectRef: context.projectRef
    });
    if (policy?.status !== 'VERIFIED' || policy.tenantRef !== context.tenantRef ||
        policy.projectRef !== context.projectRef ||
        !Number.isSafeInteger(policy.expiresAt) || policy.expiresAt <= now()) {
      return deny('FEATURE_POLICY_EXPIRED_OR_DENIED');
    }

    const result = await admission.authorize({
      sessionRef: context.sessionRef,
      tenantRef: context.tenantRef,
      projectRef: context.projectRef,
      deviceRef: context.deviceRef,
      action,
      workRef: context.workRef
    });
    if (result?.allowed !== true || result.tenantRef !== context.tenantRef ||
        result.projectRef !== context.projectRef || result.authorizedAction !== action ||
        result.executionPerformed !== false) {
      return deny(result?.reason || 'RUNTIME_ADMISSION_DENIED');
    }
    if (typeof supplySurface !== 'function') {
      return unavailable('SURFACE_SUPPLIER_UNBOUND');
    }
    let surfaceDecision;
    try {
      surfaceDecision = await supplySurface({
        appId: app.id, capabilityRef: app.capabilityRef, surface,
        sessionRef: context.sessionRef, tenantRef: context.tenantRef,
        projectRef: context.projectRef, deviceRef: context.deviceRef,
        ...(nativeRequest ? {
          requestId: nativeRequest.requestId,
          launchOrigin: nativeRequest.launchOrigin,
          appSessionId: nativeRequest.appSessionId,
          requestedAt: nativeRequest.requestedAt
        } : {})
      });
    } catch {
      return unavailable('SURFACE_SUPPLIER_FAILURE');
    }
    if (surfaceDecision?.entitlement === 'REVOKED' ||
        surfaceDecision?.entitlement === 'DEGRADED') {
      return deny('ENTITLEMENT_NOT_USER_ACCESSIBLE');
    }
    if (!surfaceDecision || typeof surfaceDecision !== 'object' ||
        typeof surfaceDecision.url !== 'string' || !surfaceDecision.url ||
        !['HOSTED_APPROVED', 'LOCAL_ADAPTER_AUTHORIZED'].includes(surfaceDecision.state) ||
        surfaceDecision.entitlement !== 'ACTIVE') {
      return unavailable('SURFACE_NOT_SUPPLIED');
    }
    if (nativeRequest && surfaceDecision.requestId !== nativeRequest.requestId) {
      return unavailable('NATIVE_DECISION_NONCE_MISMATCH');
    }
    // Availability, connectivity and persistence are reported by the approved
    // supplier, never asserted by this adapter.
    const issuedAt = now();
    const expiresAt = Math.min(policy.expiresAt, issuedAt + 15_000);
    if (expiresAt <= issuedAt) return deny('FEATURE_POLICY_EXPIRED_OR_DENIED');
    return Object.freeze({
      state: surfaceDecision.state,
      url: surfaceDecision.url,
      appId: app.id,
      capabilityRef: app.capabilityRef,
      authorizedAction: action,
      entitlement: surfaceDecision.entitlement,
      serviceAvailability: surfaceDecision.serviceAvailability ?? 'UNKNOWN',
      adapterConnectivity: surfaceDecision.adapterConnectivity ?? 'UNKNOWN',
      sessionAuthorization: 'AUTHORIZED',
      informationPersistence: surfaceDecision.informationPersistence ?? 'UNBOUND',
      authority: 'ORIGINAL_RUNTIME_PRODUCT_ADMISSION',
      sessionRef: context.sessionRef,
      tenantRef: context.tenantRef,
      projectRef: context.projectRef,
      deviceRef: context.deviceRef,
      policyRevision: policy.revision,
      issuedAt,
      expiresAt,
      ...(nativeRequest ? {
        requestId: nativeRequest.requestId,
        launchOrigin: nativeRequest.launchOrigin,
        appSessionId: nativeRequest.appSessionId,
        surface
      } : {}),
      ...(surfaceDecision.adapterRef ? { adapterRef: surfaceDecision.adapterRef } : {}),
      ...(surfaceDecision.adapterDeviceRef ? { adapterDeviceRef: surfaceDecision.adapterDeviceRef } : {})
    });
  };
}

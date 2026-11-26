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
        projectRef: context.projectRef, deviceRef: context.deviceRef
      });
    } catch {
      return unavailable('SURFACE_SUPPLIER_FAILURE');
    }
    if (!surfaceDecision || typeof surfaceDecision !== 'object' ||
        typeof surfaceDecision.url !== 'string' || !surfaceDecision.url ||
        !['HOSTED_APPROVED', 'LOCAL_ADAPTER_AUTHORIZED'].includes(surfaceDecision.state)) {
      return unavailable('SURFACE_NOT_SUPPLIED');
    }
    // Availability, connectivity and persistence are reported by the approved
    // supplier, never asserted by this adapter.
    return Object.freeze({
      state: surfaceDecision.state,
      url: surfaceDecision.url,
      capabilityRef: app.capabilityRef,
      entitlement: 'ACTIVE',
      serviceAvailability: surfaceDecision.serviceAvailability ?? 'UNKNOWN',
      adapterConnectivity: surfaceDecision.adapterConnectivity ?? 'UNKNOWN',
      sessionAuthorization: 'AUTHORIZED',
      informationPersistence: surfaceDecision.informationPersistence ?? 'UNBOUND',
      authority: 'ORIGINAL_RUNTIME_PRODUCT_ADMISSION',
      policyRevision: policy.revision,
      expiresAt: policy.expiresAt
    });
  };
}

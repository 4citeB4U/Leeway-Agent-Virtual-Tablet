/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.TABLET.RUNTIME.DECISION.TRANSPORT
TAG: LEEWAY.TABLET.RUNTIME.DECISION.TRANSPORT.V1
WHO: Creator-authorized outside Tablet contributor
WHAT: Authenticated transport seam to the original Runtime feature-policy and product-admission services.
WHEN: 2026-11-25
WHERE: apps/agent-tablet/src/runtimeDecisionTransport.mjs
WHY: Bind O08 to the canonical Runtime review head 932cf4a (PR #200) without a second authority.
HOW: Delegate to injected host transports, validate exact Zitadel/tenant/device correlation and freshness, fail closed.
AUTHORITY: SOURCE_CANDIDATE. No token issuer, entitlement store or authorization decision is created here.
LICENSE: Existing repository terms.
*/
const ref = value => typeof value === 'string' && /^[A-Za-z0-9._:@/-]{3,160}$/.test(value);
const deny = reason => Object.freeze({ status: 'DENIED', reason });

/**
 * `featurePolicy` and `admission` are the original Runtime services reached
 * through the authenticated host transport. Compatible with canonical Runtime
 * review head 932cf4a, where creator-web-authority-api imports the renamed
 * `zitadel-mcp-auth.mjs` module and customer-feature-policy /
 * customer-product-admission remain byte-identical to C01 commit bb635f4.
 */
export function createRuntimeDecisionTransport({
  featurePolicy, admission, now = () => Date.now()
} = {}) {
  if (typeof featurePolicy?.resolve !== 'function' || typeof admission?.authorize !== 'function') {
    return Object.freeze({
      status: 'UNBOUND',
      resolve: async () => deny('ORIGINAL_RUNTIME_SERVICE_TRANSPORT_UNBOUND'),
      authorize: async () => deny('ORIGINAL_RUNTIME_SERVICE_TRANSPORT_UNBOUND')
    });
  }
  return Object.freeze({
    status: 'BOUND',
    async resolve(scope = {}) {
      if (![scope.sessionRef, scope.tenantRef, scope.projectRef].every(ref)) {
        return deny('FEATURE_SCOPE_INVALID');
      }
      let snapshot;
      try {
        snapshot = await featurePolicy.resolve({
          sessionRef: scope.sessionRef,
          tenantRef: scope.tenantRef,
          projectRef: scope.projectRef
        });
      } catch {
        return deny('FEATURE_POLICY_TRANSPORT_FAILURE');
      }
      if (snapshot?.status !== 'VERIFIED' || snapshot.tenantRef !== scope.tenantRef ||
          snapshot.projectRef !== scope.projectRef ||
          !Number.isSafeInteger(snapshot.revision) || snapshot.revision < 0 ||
          !Number.isSafeInteger(snapshot.expiresAt) || snapshot.expiresAt <= now()) {
        return deny('FEATURE_POLICY_EXPIRED_OR_DENIED');
      }
      return Object.freeze({
        status: 'VERIFIED',
        tenantRef: scope.tenantRef,
        projectRef: scope.projectRef,
        revision: snapshot.revision,
        expiresAt: snapshot.expiresAt
      });
    },
    async authorize(request = {}) {
      const allowedFields = ['sessionRef', 'tenantRef', 'projectRef', 'deviceRef', 'action', 'workRef'];
      if (Object.keys(request).some(key => !allowedFields.includes(key))) {
        return deny('CLIENT_PRIVILEGE_ASSERTION_DENIED');
      }
      if (![request.sessionRef, request.tenantRef, request.projectRef, request.action].every(ref)) {
        return deny('REQUEST_SCOPE_INVALID');
      }
      if (request.deviceRef !== undefined && !ref(request.deviceRef)) {
        return deny('REQUEST_SCOPE_INVALID');
      }
      let result;
      try {
        result = await admission.authorize(request);
      } catch {
        return deny('PRODUCT_ADMISSION_TRANSPORT_FAILURE');
      }
      if (result?.allowed !== true) return deny(result?.reason || 'RUNTIME_ADMISSION_DENIED');
      if (result.tenantRef !== request.tenantRef ||
          result.projectRef !== request.projectRef ||
          result.authorizedAction !== request.action ||
          result.executionPerformed !== false ||
          (result.sessionRef !== undefined && result.sessionRef !== request.sessionRef) ||
          (request.deviceRef !== undefined && result.deviceRef !== undefined &&
           result.deviceRef !== request.deviceRef)) {
        return deny('RUNTIME_ADMISSION_DENIED');
      }
      return Object.freeze({
        allowed: true,
        reason: result.reason,
        authorizedAction: result.authorizedAction,
        tenantRef: request.tenantRef,
        projectRef: request.projectRef,
        executionPerformed: false
      });
    }
  });
}

/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.TABLET.NATIVE.RUNTIME.AUTHORIZATION
TAG: LEEWAY.TABLET.NATIVE.APP.SURFACE.DECISION.V1
5WH:
WHAT = Validate fresh Runtime decisions before native Tablet application surfaces are exposed.
WHY = Prevent URL mappings, cached grants, widgets, or renderer IPC from bypassing current authorization.
WHO = Creator/Human Authority and the original Runtime application-admission authority.
WHERE = native/agent-vt/native-app-authorization.cjs.
WHEN = 2026-11-25.
HOW = Reuse an injected main-process Runtime decision source; bind every result to session, tenant, device, capability, surface and request nonce.
LICENSE = Existing repository terms; no new rights declared.
*/
'use strict';

const { randomUUID } = require('node:crypto');
const { URL } = require('node:url');

const NATIVE_APP_AUTHORITY = Object.freeze({
  continuum: Object.freeze({ capabilityRef: 'leeway.continuum', action: 'continuum.read' }),
  diagnostics: Object.freeze({ capabilityRef: 'leeway.diagnostics', action: 'diagnostics.read' }),
  digitalBrain: Object.freeze({ capabilityRef: 'leeway.digital-brain', action: 'digital-brain.local.read' })
});
const CORE_APP = Object.freeze({
  appId: 'leeWayCore',
  appSessionId: 'leeway.app.leeWayCore'
});
const APP_SURFACES = new Set(['tablet', 'widget']);
const APP_LAUNCH_ORIGINS = new Set([
  'desktop', 'context-menu', 'taskbar', 'floating-widget',
  'restored-widget', 'widget-control', 'open-request-file'
]);
const CORE_LAUNCH_ORIGINS = new Set(['core-dock']);
const DECISION_STATES = new Set(['HOSTED_APPROVED', 'LOCAL_ADAPTER_AUTHORIZED']);
const REF = /^[A-Za-z0-9._:@/-]{3,160}$/;
const MAX_DECISION_AGE_MS = 10_000;
const MAX_DECISION_TTL_MS = 15_000;

const deny = reason => Object.freeze({ state: 'DENIED', url: null, reason });
const unavailable = reason => Object.freeze({ state: 'UNAVAILABLE', url: null, reason });
const isRef = value => typeof value === 'string' && REF.test(value);
const isLoopback = host => ['127.0.0.1', 'localhost', '::1'].includes(host.toLowerCase());

function correlatedDecision(decision, request, now, allowedStates = DECISION_STATES) {
  if (!decision || typeof decision !== 'object' || Array.isArray(decision)) {
    return 'RUNTIME_DECISION_INVALID';
  }
  for (const key of ['appId', 'capabilityRef', 'authorizedAction', 'surface',
    'launchOrigin', 'appSessionId', 'requestId', 'sessionRef', 'tenantRef',
    'projectRef', 'deviceRef']) {
    const expected = key === 'authorizedAction' ? request.action : request[key];
    if (decision[key] !== expected) return `${key.toUpperCase()}_MISMATCH`;
  }
  if (!['sessionRef', 'tenantRef', 'projectRef', 'deviceRef'].every(key => isRef(decision[key]))) {
    return 'RUNTIME_IDENTITY_SCOPE_MISSING';
  }
  if (decision.sessionAuthorization !== 'AUTHORIZED') return 'SESSION_NOT_AUTHORIZED';
  if (!Number.isSafeInteger(decision.policyRevision) || decision.policyRevision < 0) {
    return 'RUNTIME_POLICY_REVISION_INVALID';
  }
  if (!Number.isSafeInteger(decision.issuedAt) ||
      decision.issuedAt < request.requestedAt ||
      decision.issuedAt > now + 1_000 ||
      now - decision.issuedAt > MAX_DECISION_AGE_MS ||
      !Number.isSafeInteger(decision.expiresAt) ||
      decision.expiresAt <= now ||
      decision.expiresAt > decision.issuedAt + MAX_DECISION_TTL_MS) {
    return 'RUNTIME_DECISION_STALE_OR_EXPIRED';
  }
  if (decision.entitlement === 'REVOKED' || decision.entitlement === 'DEGRADED') {
    return 'ENTITLEMENT_NOT_USER_ACCESSIBLE';
  }
  if (!allowedStates.has(decision.state)) return 'RUNTIME_DECISION_NOT_APPROVED';
  if (decision.informationPersistence !== 'PERSISTED') return 'APPLICATION_SESSION_NOT_PERSISTED';
  return null;
}

function approvedSurfaceUrl(decision, request, candidateUrl) {
  let parsed;
  try {
    parsed = new URL(decision.url);
  } catch {
    return { error: 'RUNTIME_SURFACE_URL_INVALID' };
  }
  if (parsed.username || parsed.password || parsed.searchParams.has('leewaySession') &&
      parsed.searchParams.get('leewaySession') !== request.appSessionId) {
    return { error: 'RUNTIME_SURFACE_URL_BINDING_INVALID' };
  }

  if (decision.state === 'HOSTED_APPROVED') {
    if (parsed.protocol !== 'https:' || isLoopback(parsed.hostname)) {
      return { error: 'HOSTED_SURFACE_HTTPS_REQUIRED' };
    }
    if (candidateUrl) {
      let candidate;
      try { candidate = new URL(candidateUrl); } catch { return { error: 'APP_CATALOG_URL_INVALID' }; }
      if (candidate.protocol === 'https:' && candidate.origin !== parsed.origin) {
        return { error: 'RUNTIME_HOST_ORIGIN_MISMATCH' };
      }
    }
  } else {
    if (!['http:', 'file:'].includes(parsed.protocol) ||
        decision.adapterConnectivity !== 'CONNECTED' ||
        !isRef(decision.adapterRef) ||
        decision.adapterDeviceRef !== decision.deviceRef) {
      return { error: 'LOCAL_ADAPTER_AUTHORIZATION_INVALID' };
    }
    if (parsed.protocol === 'http:') {
      if (!isLoopback(parsed.hostname)) return { error: 'LOCAL_ADAPTER_LOOPBACK_REQUIRED' };
      if (candidateUrl) {
        let candidate;
        try { candidate = new URL(candidateUrl); } catch { return { error: 'APP_CATALOG_URL_INVALID' }; }
        if (isLoopback(candidate.hostname) && candidate.origin !== parsed.origin) {
          return { error: 'LOCAL_ADAPTER_ORIGIN_MISMATCH' };
        }
      }
    }
  }

  if (parsed.searchParams.has('leewaySurface') &&
      parsed.searchParams.get('leewaySurface') !== request.surface) {
    return { error: 'RUNTIME_SURFACE_MISMATCH' };
  }
  parsed.searchParams.set('leewaySurface', request.surface);
  parsed.searchParams.set('leewaySession', request.appSessionId);
  return { url: parsed.toString() };
}

function validateAppDecision(decision, request, candidateUrl, now) {
  const bindingError = correlatedDecision(decision, request, now);
  if (bindingError) return deny(bindingError);
  if (decision.authority !== 'ORIGINAL_RUNTIME_PRODUCT_ADMISSION') {
    return unavailable('ORIGINAL_RUNTIME_PRODUCT_ADMISSION_UNVERIFIED');
  }
  if (decision.entitlement === 'CREATOR_EXCLUSIVE') {
    return deny('CREATOR_EXCLUSIVE_CAPABILITY_NOT_AUTHORIZED_FOR_CUSTOMER_SURFACE');
  }
  if (decision.entitlement !== 'ACTIVE') return deny('ENTITLEMENT_NOT_ACTIVE');
  const surface = approvedSurfaceUrl(decision, request, candidateUrl);
  if (surface.error) return unavailable(surface.error);
  return Object.freeze({ ...decision, url: surface.url, reason: null });
}

function validateCoreDecision(decision, request, now, coreAuthority) {
  const bindingError = correlatedDecision(decision, request, now, new Set(['AUTHORIZED']));
  if (bindingError) return deny(bindingError);
  if (decision.authority !== 'ORIGINAL_RUNTIME_CREATOR_AUTHORITY') {
    return unavailable('ORIGINAL_RUNTIME_CREATOR_AUTHORITY_UNVERIFIED');
  }
  if (decision.state !== 'AUTHORIZED' || decision.entitlement !== 'CREATOR_EXCLUSIVE') {
    return deny('CREATOR_CORE_CAPABILITY_NOT_AUTHORIZED');
  }
  const principal = decision.principal;
  const grant = decision.currentGrant;
  if (!principal || !isRef(principal.subject) || principal.subject !== decision.subjectRef ||
      principal.subject !== request.subjectRef ||
      principal.issuer !== request.expectedIssuer ||
      !Array.isArray(principal.audiences) || !principal.audiences.includes(request.expectedAudience) ||
      !Array.isArray(principal.scopes) || !principal.scopes.includes(coreAuthority.scope) ||
      !Number.isSafeInteger(principal.expiresAt) || principal.expiresAt <= Math.floor(now / 1000) ||
      principal.sessionRef !== decision.sessionRef ||
      !grant || grant.active !== true || grant.revoked !== false ||
      grant.scope !== coreAuthority.scope || grant.subject !== principal.subject ||
      grant.sessionRef !== principal.sessionRef) {
    return deny('CURRENT_CREATOR_CORE_GRANT_REQUIRED');
  }
  return Object.freeze({
    state: 'AUTHORIZED',
    reason: null,
    authority: decision.authority,
    capabilityRef: coreAuthority.capabilityRef,
    authorizedAction: coreAuthority.action,
    sessionRef: decision.sessionRef,
    tenantRef: decision.tenantRef,
    projectRef: decision.projectRef,
    deviceRef: decision.deviceRef,
    expiresAt: decision.expiresAt
  });
}

function createNativeAppAuthorizer({
  appDecisionSource,
  authenticatedContextSource,
  coreDecisionSource,
  coreAuthority,
  creatorIssuer,
  creatorAudience,
  now = () => Date.now(),
  createRequestId = randomUUID
} = {}) {
  async function resolve(source, fields, validator) {
    if (typeof source !== 'function') return unavailable('RUNTIME_DECISION_SOURCE_UNBOUND');
    if (typeof authenticatedContextSource !== 'function') {
      return unavailable('AUTHENTICATED_RUNTIME_CONTEXT_SOURCE_UNBOUND');
    }
    let context;
    try {
      context = await authenticatedContextSource();
    } catch {
      return unavailable('AUTHENTICATED_RUNTIME_CONTEXT_SOURCE_FAILURE');
    }
    if (!context || !['sessionRef', 'tenantRef', 'projectRef', 'deviceRef'].every(key => isRef(context[key])) ||
        context.sessionAuthorization !== 'AUTHORIZED') {
      return deny('AUTHENTICATED_RUNTIME_CONTEXT_INVALID');
    }
    const requestedAt = now();
    const request = Object.freeze({
      ...fields,
      sessionRef: context.sessionRef,
      tenantRef: context.tenantRef,
      projectRef: context.projectRef,
      deviceRef: context.deviceRef,
      ...(context.subjectRef ? { subjectRef: context.subjectRef } : {}),
      requestId: createRequestId(),
      requestedAt
    });
    let decision;
    try {
      decision = await source(request, context);
    } catch (error) {
      return unavailable(error?.code === 'ORIGINAL_RUNTIME_SERVICE_TRANSPORT_UNBOUND'
        ? error.code : 'RUNTIME_DECISION_PROVIDER_FAILURE');
    }
    return validator(decision, request, now());
  }

  return Object.freeze({
    authorizeAppSurface({ appId, surface, launchOrigin, candidateUrl } = {}) {
      const app = NATIVE_APP_AUTHORITY[appId];
      if (!app) return Promise.resolve(deny('APPLICATION_CAPABILITY_NOT_REGISTERED'));
      if (!APP_SURFACES.has(surface) || !APP_LAUNCH_ORIGINS.has(launchOrigin)) {
        return Promise.resolve(deny('APPLICATION_SURFACE_ORIGIN_NOT_ALLOWLISTED'));
      }
      const appSessionId = `leeway.app.${appId}`;
      return resolve(appDecisionSource, {
        appId,
        capabilityRef: app.capabilityRef,
        action: app.action,
        surface,
        launchOrigin,
        appSessionId
      }, (decision, request, at) => validateAppDecision(decision, request, candidateUrl, at));
    },
    authorizeCreatorCore({ launchOrigin = 'core-dock' } = {}) {
      if (!CORE_LAUNCH_ORIGINS.has(launchOrigin)) {
        return Promise.resolve(deny('CREATOR_CORE_LAUNCH_ORIGIN_NOT_ALLOWLISTED'));
      }
      if (!coreAuthority || !isRef(coreAuthority.capabilityRef) ||
          !isRef(coreAuthority.action) || !isRef(coreAuthority.scope)) {
        return Promise.resolve(unavailable('CREATOR_CORE_CAPABILITY_REGISTRY_UNBOUND'));
      }
      if (typeof creatorIssuer !== 'string' || !/^https:\/\//.test(creatorIssuer) ||
          !isRef(creatorAudience)) {
        return Promise.resolve(unavailable('CREATOR_ZITADEL_AUTHORITY_CONFIGURATION_UNBOUND'));
      }
      return resolve(coreDecisionSource, {
        appId: CORE_APP.appId,
        capabilityRef: coreAuthority.capabilityRef,
        action: coreAuthority.action,
        surface: 'core',
        launchOrigin,
        appSessionId: CORE_APP.appSessionId,
        expectedIssuer: creatorIssuer,
        expectedAudience: creatorAudience
      }, (decision, request, at) => validateCoreDecision(decision, request, at, coreAuthority));
    }
  });
}

function createRuntimeSurfaceAdapter(decisionSource) {
  if (typeof decisionSource !== 'function') return null;
  return (request, context) => decisionSource(
    { id: request.appId, capabilityRef: request.capabilityRef },
    request.surface,
    { ...context, nativeRequest: request }
  );
}

function isTrustedIpcFrame(event, expectedWebContents, expectedUrl) {
  if (!event || event.sender !== expectedWebContents ||
      event.senderFrame !== expectedWebContents?.mainFrame ||
      typeof event.senderFrame?.url !== 'string') return false;
  try {
    const senderUrl = new URL(event.senderFrame.url);
    const trustedUrl = new URL(expectedUrl);
    if (trustedUrl.protocol === 'file:') {
      senderUrl.search = '';
      senderUrl.hash = '';
      trustedUrl.search = '';
      trustedUrl.hash = '';
      return senderUrl.protocol === 'file:' && senderUrl.href === trustedUrl.href;
    }
    return senderUrl.origin === trustedUrl.origin;
  } catch {
    return false;
  }
}

module.exports = {
  CORE_APP,
  NATIVE_APP_AUTHORITY,
  createNativeAppAuthorizer,
  createRuntimeSurfaceAdapter,
  isTrustedIpcFrame
};

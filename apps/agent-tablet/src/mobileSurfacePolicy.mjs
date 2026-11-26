/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.TABLET.MOBILE.SURFACE_POLICY
TAG: LEEWAY.TABLET.MOBILE.LOGISTICS_PORTABLE_LAUNCH.V1
5WH:
WHAT = Resolve responsive first-launch presentation for existing published Tablet applications.
WHY = Prevent a dense desktop Logistics preset and Windows label from overriding Android/Apple mobile UI.
WHO = Creator-authorized outside Tablet contributor, not Agent Lee or Veritas.
WHERE = apps/agent-tablet/src/mobileSurfacePolicy.mjs.
WHEN = 2026-11-23.
HOW = Pure viewport/profile selection and URL hash adjustment; no service, OS drive, auth or device writes.
LICENSE = Existing repository terms.
*/
const MAX_COMPACT_WIDTH = 900;
const MAX_SHORT_LANDSCAPE_WIDTH = 1100;
const MAX_SHORT_LANDSCAPE_HEIGHT = 620;

export function isCompactTabletViewport(width, height) {
  return Number.isFinite(width) && Number.isFinite(height) &&
    width > 0 && height > 0 &&
    (width <= MAX_COMPACT_WIDTH ||
      (width <= MAX_SHORT_LANDSCAPE_WIDTH && height <= MAX_SHORT_LANDSCAPE_HEIGHT));
}

// UI-only browser hint; NEVER use this as an enrolled device identity or a permission grant.
export function browserPlatformFamily(userAgent = '') {
  if (/Android/i.test(userAgent)) return 'ANDROID';
  if (/iPhone|iPad|iPod|Macintosh|Mac OS X/i.test(userAgent)) return 'APPLE';
  if (/Windows/i.test(userAgent)) return 'WINDOWS';
  if (/Linux/i.test(userAgent)) return 'LINUX';
  return 'UNVERIFIED DEVICE';
}

export function tabletSurfaceUrl(rawUrl, appId, surface, compact = false) {
  const url = new URL(rawUrl);
  url.searchParams.set('leewaySurface', surface);
  url.searchParams.set('leewaySession', `leeway.app.${appId}`);
  // The existing Logistics URL intentionally pins a desktop-heavy tactical
  // camera/state preset. Adjust presentation ONLY when rendered in a compact
  // Tablet viewport; retain map layers, camera coordinates and detection state.
  if (appId === 'logistics' && compact) {
    const state = new URLSearchParams(url.hash.slice(1));
    if (state.has('lat') && state.has('lon')) {
      state.set('hud', 'minimal');
      state.set('hv', '0');
      // Remove pre-opened desktop inspector panes. Users can open panels
      // deliberately inside Logistics. The desktop deep link is unchanged.
      state.delete('ui');
      url.hash = state.toString();
    }
  }
  return url.toString();
}

// A surface decision is supplied by the existing authorized host/runtime. This
// module only consumes that decision; it never queries a backend, grants an
// entitlement, or creates an application identity.
const RESOLVER_STATES = new Set(['HOSTED_APPROVED', 'LOCAL_ADAPTER_AUTHORIZED', 'UNAVAILABLE', 'DENIED']);
function surfaceResult(state, url, reason, decision) {
  return Object.freeze({
    state,
    url,
    reason: reason || null,
    entitlement: decision?.entitlement ?? 'UNKNOWN',
    serviceAvailability: decision?.serviceAvailability ?? 'UNKNOWN',
    adapterConnectivity: decision?.adapterConnectivity ?? 'UNKNOWN',
    sessionAuthorization: decision?.sessionAuthorization ?? 'UNKNOWN',
    informationPersistence: decision?.informationPersistence ?? 'UNKNOWN'
  });
}
export function resolvePublishedAppSurface(app, surface, compact, decision) {
  if (!decision || typeof decision !== 'object') return surfaceResult('UNAVAILABLE', null, 'RESOLVER_DECISION_REQUIRED');
  if (decision.entitlement === 'REVOKED' || decision.entitlement === 'DEGRADED' ||
      decision.entitlement === 'CREATOR_EXCLUSIVE' || decision.state === 'DENIED') {
    return surfaceResult('DENIED', null, 'ENTITLEMENT_OR_AUTHORIZATION_DENIED', decision);
  }
  if (!RESOLVER_STATES.has(decision.state)) return surfaceResult('UNAVAILABLE', null, 'RESOLVER_STATE_INVALID', decision);
  if (decision.state === 'UNAVAILABLE') return surfaceResult('UNAVAILABLE', null, 'PROVIDER_UNAVAILABLE', decision);
  if (decision.entitlement !== 'ACTIVE') return surfaceResult('UNAVAILABLE', null, 'RUNTIME_ENTITLEMENT_UNVERIFIED', decision);
  if (decision.capabilityRef !== app.capabilityRef) {
    return surfaceResult('UNAVAILABLE', null, 'CAPABILITY_REF_MISMATCH', decision);
  }
  if (decision.sessionAuthorization !== 'AUTHORIZED') {
    return surfaceResult('DENIED', null, 'SESSION_NOT_AUTHORIZED', decision);
  }
  if (decision.informationPersistence !== 'PERSISTED') {
    return surfaceResult('UNAVAILABLE', null, 'INFORMATION_PERSISTENCE_UNBOUND', decision);
  }
  let parsed;
  try { parsed = new URL(decision.url); } catch { return surfaceResult('UNAVAILABLE', null, 'RESOLUTION_URL_INVALID', decision); }
  if (parsed.username || parsed.password) return surfaceResult('UNAVAILABLE', null, 'RESOLUTION_URL_CREDENTIALS_FORBIDDEN', decision);
  const host = parsed.hostname.toLowerCase();
  const loopback = host === '127.0.0.1' || host === 'localhost' || host === '::1';
  if (decision.state === 'HOSTED_APPROVED') {
    if (parsed.protocol !== 'https:' || loopback) return surfaceResult('UNAVAILABLE', null, 'APPROVED_HOSTED_HTTPS_REQUIRED', decision);
  } else if (decision.state === 'LOCAL_ADAPTER_AUTHORIZED') {
    if (parsed.protocol !== 'http:' || !loopback) return surfaceResult('UNAVAILABLE', null, 'AUTHORIZED_LOCAL_ADAPTER_REQUIRED', decision);
    if (decision.adapterConnectivity !== 'CONNECTED') return surfaceResult('UNAVAILABLE', null, 'ADAPTER_DISCONNECTED', decision);
  }
  return surfaceResult(decision.state, tabletSurfaceUrl(decision.url, app.id, surface, compact), null, decision);
}


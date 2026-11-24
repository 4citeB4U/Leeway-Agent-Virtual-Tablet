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

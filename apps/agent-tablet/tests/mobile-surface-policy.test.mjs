/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.TABLET.MOBILE.SURFACE_POLICY.TEST
TAG: LEEWAY.TABLET.MOBILE.LOGISTICS_PORTABLE_LAUNCH.TEST.V1
5WH:
WHAT = Execute pure viewport, OS hint and Logistics launch-contract regression tests.
WHY = Prevent phone layout regressions and treating Windows as mandatory system identity.
WHO = Creator-authorized Tablet test contributors.
WHERE = apps/agent-tablet/tests/mobile-surface-policy.test.mjs.
WHEN = 2026-11-23.
HOW = Node test fixtures without network, device enrollment, auth or local machine paths.
LICENSE = Existing repository terms.
*/
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isCompactTabletViewport, browserPlatformFamily, tabletSurfaceUrl
} from '../src/mobileSurfacePolicy.mjs';

const desktop = 'https://4citeb4u.github.io/leeway_logistics/#v=2&lat=35.1557&lon=-82.5000&hud=tactical&hv=1&dm=DENSE&dd=75&ui=c.c.1_l.c.1&map=osm';
const appId = 'logistics';

test('Fold and Apple narrow and landscape layouts request compact Logistics profile', () => {
  assert.equal(isCompactTabletViewport(390, 844), true);
  assert.equal(isCompactTabletViewport(840, 1024), true);
  assert.equal(isCompactTabletViewport(844, 390), true);
  assert.equal(isCompactTabletViewport(1024, 550), true);
  assert.equal(isCompactTabletViewport(1280, 800), false);
  assert.equal(isCompactTabletViewport(Number.NaN, 800), false);
  assert.equal(isCompactTabletViewport(0, 400), false);
});

test('noncompact original map deep link is preserved without changing the session contract', () => {
  const result = new URL(tabletSurfaceUrl(desktop, appId, 'tablet', false));
  assert.equal(result.hash.slice(1), desktop.split('#')[1]);
  assert.equal(result.searchParams.get('leewaySession'), 'leeway.app.logistics');
  assert.equal(result.searchParams.get('leewaySurface'), 'tablet');
});

test('compact Logistics hides dense HUD and default inspector but retains map and operator layers', () => {
  const result = new URL(tabletSurfaceUrl(desktop, appId, 'tablet', true));
  const state = new URLSearchParams(result.hash.slice(1));
  assert.equal(state.get('hud'), 'minimal');
  assert.equal(state.get('hv'), '0');
  assert.equal(state.has('ui'), false);
  for (const field of ['lat', 'lon', 'v', 'dm', 'dd', 'map'])
    assert.equal(state.get(field), new URLSearchParams(desktop.split('#')[1]).get(field));
  assert.equal(result.searchParams.get('leewaySession'), 'leeway.app.logistics');
});

test('non-Logistics applications and native widget deep links never inherit map rewrites', () => {
  const shared = 'https://4citeb4u.github.io/example/#hud=tactical&hv=1';
  const result = new URL(tabletSurfaceUrl(shared, 'other', 'widget', true));
  assert.equal(result.hash, '#hud=tactical&hv=1');
  assert.equal(result.searchParams.get('leewaySurface'), 'widget');
});

test('mobile browser hints use OS families but confer no device registration', () => {
  assert.equal(browserPlatformFamily('Mozilla/5.0 (Linux; Android 14; Fold) AppleWebKit'), 'ANDROID');
  assert.equal(browserPlatformFamily('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)'), 'APPLE');
  assert.equal(browserPlatformFamily('Mozilla/5.0 (Macintosh; Intel Mac OS X 13_0)'), 'APPLE');
  assert.equal(browserPlatformFamily('Mozilla/5.0 (Windows NT 10.0; Win64; x64)'), 'WINDOWS');
  assert.equal(browserPlatformFamily('Mozilla/5.0 (X11; Linux x86_64)'), 'LINUX');
  assert.equal(browserPlatformFamily(''), 'UNVERIFIED DEVICE');
});

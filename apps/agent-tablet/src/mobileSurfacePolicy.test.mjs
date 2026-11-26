import test from 'node:test';
import assert from 'node:assert/strict';
import { resolvePublishedAppSurface } from './mobileSurfacePolicy.mjs';

const app = { id: 'officeSuite', capabilityRef: 'leeway.office' };
const base = {
  entitlement: 'ACTIVE',
  serviceAvailability: 'AVAILABLE',
  adapterConnectivity: 'CONNECTED',
  sessionAuthorization: 'AUTHORIZED',
  informationPersistence: 'PERSISTED',
};

test('surface resolution fails closed without a resolver decision', () => {
  const r = resolvePublishedAppSurface(app, 'tablet', false);
  assert.equal(r.state, 'UNAVAILABLE');
  assert.equal(r.url, null);
  assert.equal(r.reason, 'RESOLVER_DECISION_REQUIRED');
});

test('approved hosted application resolves with the shared leewaySession contract', () => {
  const r = resolvePublishedAppSurface(app, 'tablet', false, {
    ...base, state: 'HOSTED_APPROVED', url: 'https://4citeb4u.github.io/LeeWay-Office-Suites/', capabilityRef: app.capabilityRef,
  });
  assert.equal(r.state, 'HOSTED_APPROVED');
  assert.match(r.url, /leewaySurface=tablet/);
  assert.match(r.url, /leewaySession=leeway\.app\.officeSuite/);
});

test('authorized local adapter resolves only when connected', () => {
  const r = resolvePublishedAppSurface(app, 'widget', false, {
    ...base, state: 'LOCAL_ADAPTER_AUTHORIZED', url: 'http://127.0.0.1:3221/', capabilityRef: app.capabilityRef,
  });
  assert.equal(r.state, 'LOCAL_ADAPTER_AUTHORIZED');
  const offline = resolvePublishedAppSurface(app, 'widget', false, {
    ...base, state: 'LOCAL_ADAPTER_AUTHORIZED', url: 'http://127.0.0.1:3221/', adapterConnectivity: 'DISCONNECTED', capabilityRef: app.capabilityRef,
  });
  assert.equal(offline.state, 'UNAVAILABLE');
  assert.equal(offline.reason, 'ADAPTER_DISCONNECTED');
});

test('hosted resolution rejects loopback and credential-bearing URLs', () => {
  const loopback = resolvePublishedAppSurface(app, 'tablet', false, {
    ...base, state: 'HOSTED_APPROVED', url: 'http://127.0.0.1:3221/',
  });
  assert.equal(loopback.reason, 'APPROVED_HOSTED_HTTPS_REQUIRED');
  const credentials = resolvePublishedAppSurface(app, 'tablet', false, {
    ...base, state: 'HOSTED_APPROVED', url: 'https://user:pass@4citeb4u.github.io/app/',
  });
  assert.equal(credentials.reason, 'RESOLUTION_URL_CREDENTIALS_FORBIDDEN');
});

test('revoked, degraded, denied or unauthorized session never resolves a surface', () => {
  for (const decision of [
    { ...base, state: 'HOSTED_APPROVED', url: 'https://4citeb4u.github.io/app/', entitlement: 'REVOKED' },
    { ...base, state: 'HOSTED_APPROVED', url: 'https://4citeb4u.github.io/app/', entitlement: 'DEGRADED' },
    { ...base, state: 'DENIED', url: 'https://4citeb4u.github.io/app/' },
    { ...base, state: 'HOSTED_APPROVED', url: 'https://4citeb4u.github.io/app/', sessionAuthorization: 'UNAUTHORIZED' },
  ]) {
    const r = resolvePublishedAppSurface(app, 'tablet', false, decision);
    assert.equal(r.url, null);
    assert.equal(r.state, 'DENIED');
  }
});

test('capability mismatch and unbound persistence are unavailable, not entitlement changes', () => {
  const mismatch = resolvePublishedAppSurface(app, 'tablet', false, {
    ...base, state: 'HOSTED_APPROVED', url: 'https://4citeb4u.github.io/app/', capabilityRef: 'leeway.other',
  });
  assert.equal(mismatch.reason, 'CAPABILITY_REF_MISMATCH');
  const unbound = resolvePublishedAppSurface(app, 'tablet', false, {
    ...base, state: 'HOSTED_APPROVED', url: 'https://4citeb4u.github.io/app/', informationPersistence: 'UNBOUND',
  });
  assert.equal(unbound.reason, 'INFORMATION_PERSISTENCE_UNBOUND');
  assert.equal(mismatch.entitlement, 'ACTIVE');
  assert.equal(unbound.entitlement, 'ACTIVE');
});

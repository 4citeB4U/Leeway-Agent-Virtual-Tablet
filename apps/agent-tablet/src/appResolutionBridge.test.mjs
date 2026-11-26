import test from 'node:test';
import assert from 'node:assert/strict';
import { createRuntimeSurfaceDecisionSource } from './appResolutionBridge.mjs';

const app = { id: 'officeSuite', capabilityRef: 'leeway.office' };
const ctx = { tenantId: 'tenant-1', accountId: 'account-1', sessionAuthorization: 'AUTHORIZED' };

test('missing Runtime decision source fails closed with no fallback', async () => {
  const source = createRuntimeSurfaceDecisionSource();
  const d = await source(app, 'tablet', ctx);
  assert.equal(d.state, 'UNAVAILABLE');
  assert.equal(d.url, null);
  assert.equal(d.reason, 'RUNTIME_DECISION_SOURCE_UNBOUND');
});

test('unauthenticated session is denied before Runtime invocation', async () => {
  let calls = 0;
  const source = createRuntimeSurfaceDecisionSource({ decide: async () => { calls++; return {}; } });
  const d = await source(app, 'tablet', { ...ctx, sessionAuthorization: 'UNAUTHORIZED' });
  assert.equal(d.state, 'DENIED');
  assert.equal(d.reason, 'SESSION_NOT_AUTHORIZED');
  assert.equal(calls, 0);
});

test('valid Runtime decision is passed through unchanged for Tablet and Widget', async () => {
  const seen = [];
  const decision = {
    state: 'HOSTED_APPROVED', url: 'https://4citeb4u.github.io/LeeWay-Office-Suites/',
    capabilityRef: app.capabilityRef, entitlement: 'ACTIVE', serviceAvailability: 'AVAILABLE',
    adapterConnectivity: 'DISCONNECTED', sessionAuthorization: 'AUTHORIZED',
    informationPersistence: 'PERSISTED', tenantId: 'tenant-1'
  };
  const source = createRuntimeSurfaceDecisionSource({ decide: async req => { seen.push(req); return decision; } });
  for (const surface of ['tablet', 'widget']) {
    const d = await source(app, surface, ctx);
    assert.equal(d.state, 'HOSTED_APPROVED');
    assert.equal(d.url, decision.url);
  }
  assert.deepEqual(seen.map(x => x.surface), ['tablet', 'widget']);
  assert.equal(seen[0].capabilityRef, 'leeway.office');
});

test('capability mismatch, tenant mismatch, invalid state and provider failure fail closed', async () => {
  const cases = [
    [{ decide: async () => ({ state: 'HOSTED_APPROVED', capabilityRef: 'leeway.other' }) }, 'CAPABILITY_REF_MISMATCH'],
    [{ decide: async () => ({ state: 'HOSTED_APPROVED', tenantId: 'tenant-2' }) }, 'TENANT_MISMATCH'],
    [{ decide: async () => ({ state: 'FORCED_SUCCESS' }) }, 'RUNTIME_DECISION_INVALID'],
    [{ decide: async () => { throw new Error('provider down'); } }, 'RUNTIME_DECISION_PROVIDER_FAILURE']
  ];
  for (const [injected, reason] of cases) {
    const d = await createRuntimeSurfaceDecisionSource(injected)(app, 'tablet', ctx);
    assert.equal(d.url, null);
    assert.equal(d.reason, reason);
  }
});

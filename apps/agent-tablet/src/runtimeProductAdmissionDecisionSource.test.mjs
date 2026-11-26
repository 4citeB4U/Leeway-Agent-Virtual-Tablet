import test from 'node:test';
import assert from 'node:assert/strict';
import { createRuntimeProductAdmissionDecisionSource } from './runtimeProductAdmissionDecisionSource.mjs';

const app = { id: 'continuum', capabilityRef: 'leeway.continuum' };
const ctx = {
  sessionRef: 'session-1', tenantRef: 'tenant-1', projectRef: 'project-1',
  deviceRef: 'device-1', workRef: 'work-1'
};
const policy = {
  resolve: async () => ({
    status: 'VERIFIED', tenantRef: 'tenant-1', projectRef: 'project-1',
    revision: 7, expiresAt: Date.now() + 120000
  })
};
const admission = {
  authorize: async req => ({
    allowed: true, reason: 'AUTHORITATIVE_PRECHECK_ACCEPTED',
    tenantRef: req.tenantRef, projectRef: req.projectRef,
    authorizedAction: req.action, executionPerformed: false
  })
};
const surface = {
  state: 'HOSTED_APPROVED',
  url: 'https://4citeb4u.github.io/LeeWay-Continuum/',
  serviceAvailability: 'AVAILABLE', adapterConnectivity: 'DISCONNECTED',
  informationPersistence: 'PERSISTED'
};
const make = overrides => createRuntimeProductAdmissionDecisionSource({
  admission, featurePolicy: policy, capabilityActionMap: { 'leeway.continuum': 'continuum.read' },
  supplySurface: async () => surface, ...overrides
});

test('missing original Runtime authorities fail closed', async () => {
  const d = await createRuntimeProductAdmissionDecisionSource()(app, 'tablet', ctx);
  assert.equal(d.state, 'UNAVAILABLE');
  assert.equal(d.reason, 'ORIGINAL_RUNTIME_DECISION_AUTHORITY_UNBOUND');
});

test('correlated owner, tenant, device and session are required', async () => {
  for (const bad of [
    { ...ctx, deviceRef: undefined }, { ...ctx, tenantRef: 'other' }, { ...ctx, sessionRef: undefined }
  ]) {
    const d = await make()(app, 'tablet', bad);
    assert.equal(d.state, 'DENIED');
  }
  assert.equal((await make()(app, 'desktop', ctx)).reason, 'SURFACE_NOT_ALLOWLISTED');
});

test('unknown capability is denied before any Runtime authorization', async () => {
  const d = await make()({ id: 'officeSuite', capabilityRef: 'leeway.office' }, 'tablet', ctx);
  assert.equal(d.state, 'DENIED');
  assert.equal(d.reason, 'UNKNOWN_CAPABILITY_DENIED');
});

test('expired policy and denied admission never produce a surface', async () => {
  const expired = await make({
    featurePolicy: { resolve: async () => ({ ...await policy.resolve(), expiresAt: Date.now() - 1 }) }
  })(app, 'tablet', ctx);
  assert.equal(expired.state, 'DENIED');
  assert.equal(expired.reason, 'FEATURE_POLICY_EXPIRED_OR_DENIED');
  const denied = await make({
    admission: { authorize: async () => ({ allowed: false, reason: 'CREATOR_GRANT_REVOKED_OR_DENIED' }) }
  })(app, 'tablet', ctx);
  assert.equal(denied.state, 'DENIED');
  assert.equal(denied.reason, 'CREATOR_GRANT_REVOKED_OR_DENIED');
});

test('authorized decision preserves separate availability, connectivity and persistence', async () => {
  const d = await make()(app, 'tablet', ctx);
  assert.equal(d.state, 'HOSTED_APPROVED');
  assert.equal(d.url, surface.url);
  assert.equal(d.entitlement, 'ACTIVE');
  assert.equal(d.serviceAvailability, 'AVAILABLE');
  assert.equal(d.adapterConnectivity, 'DISCONNECTED');
  assert.equal(d.informationPersistence, 'PERSISTED');
  assert.equal(d.authority, 'ORIGINAL_RUNTIME_PRODUCT_ADMISSION');
});

test('missing surface supplier is explicit unavailable, not a fallback URL', async () => {
  const d = await make({ supplySurface: undefined })(app, 'tablet', ctx);
  assert.equal(d.state, 'UNAVAILABLE');
  assert.equal(d.reason, 'SURFACE_SUPPLIER_UNBOUND');
});

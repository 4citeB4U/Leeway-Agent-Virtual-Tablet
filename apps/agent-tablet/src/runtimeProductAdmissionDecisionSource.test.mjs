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
  entitlement: 'ACTIVE',
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
  assert.equal(d.reason, 'ORIGINAL_RUNTIME_SERVICE_TRANSPORT_UNBOUND');
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

test('native decision echoes a fresh request binding and exact Runtime identity', async () => {
  const request = {
    appId: app.id,
    capabilityRef: app.capabilityRef,
    surface: 'widget',
    launchOrigin: 'taskbar',
    appSessionId: 'leeway.app.continuum',
    requestId: '6d481e27-47c0-4b2f-9f62-63ed364fe473',
    requestedAt: Date.now()
  };
  const d = await make({
    supplySurface: async supplied => ({ ...surface, requestId: supplied.requestId })
  })(app, 'widget', { ...ctx, sessionAuthorization: 'AUTHORIZED', nativeRequest: request });
  assert.equal(d.state, 'HOSTED_APPROVED');
  assert.equal(d.appId, app.id);
  assert.equal(d.capabilityRef, app.capabilityRef);
  assert.equal(d.authorizedAction, 'continuum.read');
  assert.equal(d.surface, 'widget');
  assert.equal(d.launchOrigin, 'taskbar');
  assert.equal(d.appSessionId, 'leeway.app.continuum');
  assert.equal(d.requestId, request.requestId);
  assert.equal(d.sessionRef, ctx.sessionRef);
  assert.equal(d.tenantRef, ctx.tenantRef);
  assert.equal(d.deviceRef, ctx.deviceRef);
  assert.equal(d.expiresAt <= d.issuedAt + 15_000, true);
});

test('native decisions do not invent active entitlement or accept a stale supplier response', async () => {
  const request = {
    appId: app.id,
    capabilityRef: app.capabilityRef,
    surface: 'tablet',
    launchOrigin: 'desktop',
    appSessionId: 'leeway.app.continuum',
    requestId: '6d481e27-47c0-4b2f-9f62-63ed364fe473',
    requestedAt: Date.now()
  };
  const unknown = await make({
    supplySurface: async () => ({ ...surface, entitlement: undefined, requestId: request.requestId })
  })(app, 'tablet', { ...ctx, sessionAuthorization: 'AUTHORIZED', nativeRequest: request });
  assert.equal(unknown.state, 'UNAVAILABLE');
  const stale = await make({
    supplySurface: async () => ({ ...surface, requestId: 'stale-request' })
  })(app, 'tablet', { ...ctx, sessionAuthorization: 'AUTHORIZED', nativeRequest: request });
  assert.equal(stale.state, 'UNAVAILABLE');
  assert.equal(stale.reason, 'NATIVE_DECISION_NONCE_MISMATCH');
});

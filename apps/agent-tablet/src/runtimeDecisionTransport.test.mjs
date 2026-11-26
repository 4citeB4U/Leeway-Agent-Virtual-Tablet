import test from 'node:test';
import assert from 'node:assert/strict';
import { createRuntimeDecisionTransport } from './runtimeDecisionTransport.mjs';
import { createRuntimeProductAdmissionDecisionSource } from './runtimeProductAdmissionDecisionSource.mjs';

const scope = { sessionRef: 'session-1', tenantRef: 'tenant-1', projectRef: 'project-1' };
const request = { ...scope, deviceRef: 'device-1', action: 'continuum.read', workRef: 'work-1' };
const featurePolicy = {
  resolve: async () => ({ status: 'VERIFIED', tenantRef: 'tenant-1', projectRef: 'project-1', revision: 3, expiresAt: Date.now() + 60000 })
};
const admission = {
  authorize: async () => ({ allowed: true, reason: 'AUTHORITATIVE_PRECHECK_ACCEPTED', tenantRef: 'tenant-1', projectRef: 'project-1', authorizedAction: 'continuum.read', executionPerformed: false })
};

test('unbound transports fail closed', async () => {
  const t = createRuntimeDecisionTransport();
  assert.equal(t.status, 'UNBOUND');
  assert.equal((await t.resolve(scope)).reason, 'ORIGINAL_RUNTIME_SERVICE_TRANSPORT_UNBOUND');
  assert.equal((await t.authorize(request)).reason, 'ORIGINAL_RUNTIME_SERVICE_TRANSPORT_UNBOUND');
});

test('valid policy and admission pass through with freshness', async () => {
  const t = createRuntimeDecisionTransport({ featurePolicy, admission });
  assert.equal(t.status, 'BOUND');
  assert.equal((await t.resolve(scope)).status, 'VERIFIED');
  assert.equal((await t.authorize(request)).allowed, true);
});

test('expired policy, tenant mismatch and revoked grant are denied', async () => {
  const expired = createRuntimeDecisionTransport({
    featurePolicy: { resolve: async () => ({ ...await featurePolicy.resolve(), expiresAt: Date.now() - 1 }) }, admission
  });
  assert.equal((await expired.resolve(scope)).reason, 'FEATURE_POLICY_EXPIRED_OR_DENIED');
  const mismatch = createRuntimeDecisionTransport({
    featurePolicy: { resolve: async () => ({ ...await featurePolicy.resolve(), tenantRef: 'other' }) }, admission
  });
  assert.equal((await mismatch.resolve(scope)).reason, 'FEATURE_POLICY_EXPIRED_OR_DENIED');
  const revoked = createRuntimeDecisionTransport({
    featurePolicy, admission: { authorize: async () => ({ allowed: false, reason: 'CREATOR_GRANT_REVOKED_OR_DENIED' }) }
  });
  assert.equal((await revoked.authorize(request)).reason, 'CREATOR_GRANT_REVOKED_OR_DENIED');
});

test('device, session and capability mismatches and provider failure are denied', async () => {
  const wrongDevice = createRuntimeDecisionTransport({
    featurePolicy,
    admission: { authorize: async r => ({ ...await admission.authorize(r), deviceRef: 'device-2' }) }
  });
  assert.equal((await wrongDevice.authorize(request)).reason, 'RUNTIME_ADMISSION_DENIED');
  const wrongSession = createRuntimeDecisionTransport({
    featurePolicy,
    admission: { authorize: async r => ({ ...await admission.authorize(r), sessionRef: 'session-2' }) }
  });
  assert.equal((await wrongSession.authorize(request)).reason, 'RUNTIME_ADMISSION_DENIED');
  const wrongCapability = createRuntimeDecisionTransport({
    featurePolicy,
    admission: { authorize: async r => ({ ...await admission.authorize(r), authorizedAction: 'diagnostics.read' }) }
  });
  assert.equal((await wrongCapability.authorize(request)).reason, 'RUNTIME_ADMISSION_DENIED');
  const failure = createRuntimeDecisionTransport({
    featurePolicy, admission: { authorize: async () => { throw new Error('down'); } }
  });
  assert.equal((await failure.authorize(request)).reason, 'PRODUCT_ADMISSION_TRANSPORT_FAILURE');
});

test('transport binds to O08 decision source and fails closed end to end', async () => {
  const t = createRuntimeDecisionTransport({ featurePolicy, admission });
  const source = createRuntimeProductAdmissionDecisionSource({
    admission: t, featurePolicy: t,
    capabilityActionMap: { 'leeway.continuum': 'continuum.read' },
    supplySurface: async () => ({
      state: 'HOSTED_APPROVED', url: 'https://4citeb4u.github.io/LeeWay-Continuum/',
      entitlement: 'ACTIVE',
      serviceAvailability: 'AVAILABLE', adapterConnectivity: 'DISCONNECTED', informationPersistence: 'PERSISTED'
    })
  });
  const decision = await source({ id: 'continuum', capabilityRef: 'leeway.continuum' }, 'tablet', request);
  assert.equal(decision.state, 'HOSTED_APPROVED');
  const denied = createRuntimeDecisionTransport({
    admission: { authorize: async () => ({ allowed: false, reason: 'REVOKED' }) }, featurePolicy
  });
  const source2 = createRuntimeProductAdmissionDecisionSource({
    admission: denied, featurePolicy: denied,
    capabilityActionMap: { 'leeway.continuum': 'continuum.read' }
  });
  assert.equal((await source2({ id: 'continuum', capabilityRef: 'leeway.continuum' }, 'tablet', request)).state, 'DENIED');
});

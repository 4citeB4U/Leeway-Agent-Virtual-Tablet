/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.TABLET.NATIVE.RUNTIME.DECISION.SOURCE.TESTS
TAG: LEEWAY.TABLET.NATIVE.RUNTIME.DECISION.TRANSPORT.V1.TESTS
5WH:
WHAT = Verify the native source composes O09 with the existing Runtime application decision boundary.
WHY = Keep missing bindings, service revocation and stale identity from exposing user-facing app surfaces.
WHO = Tablet source owners under Creator authorization.
WHERE = native/agent-vt/native-runtime-decision-source.test.cjs.
WHEN = 2026-11-25.
HOW = Exercise the production source composition with bounded provider fixtures and explicit failure cases.
LICENSE = Existing repository terms; no new rights declared.
*/
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { createAuthenticatedRuntimeSurfaceDecisionSource } = require('./native-runtime-decision-source.cjs');

const app = { id: 'continuum', capabilityRef: 'leeway.continuum' };
const context = {
  sessionRef: 'session-001',
  tenantRef: 'tenant-001',
  projectRef: 'project-001',
  deviceRef: 'device-001',
  workRef: 'work-001'
};

function bindings({ authorize } = {}) {
  return {
    featurePolicy: {
      resolve: async () => ({
        status: 'VERIFIED',
        tenantRef: context.tenantRef,
        projectRef: context.projectRef,
        revision: 3,
        expiresAt: Date.now() + 60_000
      })
    },
    admission: {
      authorize: authorize || (async request => ({
        allowed: true,
        reason: 'AUTHORITATIVE_PRECHECK_ACCEPTED',
        tenantRef: request.tenantRef,
        projectRef: request.projectRef,
        authorizedAction: request.action,
        executionPerformed: false
      }))
    },
    capabilityActionMap: { 'leeway.continuum': 'continuum.read' },
    supplySurface: async () => ({
      state: 'HOSTED_APPROVED',
      url: 'https://4citeb4u.github.io/LeeWay-Continuum/',
      entitlement: 'ACTIVE',
      serviceAvailability: 'AVAILABLE',
      adapterConnectivity: 'DISCONNECTED',
      informationPersistence: 'PERSISTED'
    })
  };
}

test('native decision source fails closed without authenticated Runtime bindings', async () => {
  const source = createAuthenticatedRuntimeSurfaceDecisionSource({ getBindings: () => undefined });
  await assert.rejects(
    source(app, 'widget', context),
    error => error.code === 'ORIGINAL_RUNTIME_SERVICE_TRANSPORT_UNBOUND'
  );
});

test('native decision source composes O09 with the approved surface supplier', async () => {
  let bindingReads = 0;
  let admissionRequest;
  const currentBindings = bindings();
  currentBindings.admission.authorize = async request => {
    admissionRequest = request;
    return {
      allowed: true,
      reason: 'AUTHORITATIVE_PRECHECK_ACCEPTED',
      tenantRef: request.tenantRef,
      projectRef: request.projectRef,
      authorizedAction: request.action,
      executionPerformed: false
    };
  };
  const source = createAuthenticatedRuntimeSurfaceDecisionSource({
    getBindings: () => {
      bindingReads += 1;
      return currentBindings;
    }
  });
  const decision = await source(app, 'widget', context);
  assert.equal(bindingReads, 1);
  assert.equal(decision.state, 'HOSTED_APPROVED');
  assert.equal(decision.authorizedAction, 'continuum.read');
  assert.equal(decision.sessionRef, context.sessionRef);
  assert.equal(decision.deviceRef, context.deviceRef);
  assert.equal(admissionRequest.sessionRef, context.sessionRef);
  assert.equal(admissionRequest.deviceRef, context.deviceRef);
});

test('native decision source rereads the provider and denies a newly revoked grant', async () => {
  let revoked = false;
  const currentBindings = bindings({
    authorize: async request => revoked
      ? { allowed: false, reason: 'CREATOR_GRANT_REVOKED_OR_DENIED' }
      : {
          allowed: true,
          reason: 'AUTHORITATIVE_PRECHECK_ACCEPTED',
          tenantRef: request.tenantRef,
          projectRef: request.projectRef,
          authorizedAction: request.action,
          executionPerformed: false
        }
  });
  const source = createAuthenticatedRuntimeSurfaceDecisionSource({
    getBindings: () => currentBindings
  });
  assert.equal((await source(app, 'widget', context)).state, 'HOSTED_APPROVED');
  revoked = true;
  const denied = await source(app, 'widget', context);
  assert.equal(denied.state, 'DENIED');
  assert.equal(denied.reason, 'CREATOR_GRANT_REVOKED_OR_DENIED');
});

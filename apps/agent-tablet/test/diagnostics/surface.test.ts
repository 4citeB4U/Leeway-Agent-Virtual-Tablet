/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.AGENT.TABLET.DIAGNOSTICS.TEST
TAG: LEEWAY.TABLET.DIAGNOSTICS.SURFACE.TEST.V1
5WH:
WHAT = Verify portable Diagnostics surface resolution and rejection of hardcoded local identity.
WHY = Prevent a remote client from treating this workstation loopback address as its own Runtime surface.
WHO = Tablet diagnostics maintainers; this test grants no host or device authority.
WHERE = apps/agent-tablet/test/diagnostics/surface.test.ts.
WHEN = 2026-11-26.
HOW = Exercise the production resolver with local-adapter and Runtime decision inputs.
LICENSE = Repository terms.
*/

import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveDiagnosticsSurface, type DiagnosticsSurfaceConfig } from '../../src/diagnostics/surface';

const localConfig: DiagnosticsSurfaceConfig = {
  state: 'LOCAL_ADAPTER_AUTHORIZED',
  origin: 'http://127.0.0.1:8890',
  bodyId: 'pc-primary',
  matrixPath: '/diagnostics/matrix/matrix.html',
  observationVersion: 'obs-20261126-001'
};

const app = { id: 'diagnostics', capabilityRef: 'leeway.diagnostics' };

test('local adapter resolves a same-origin proxy path with the authorized body id', () => {
  const resolved = resolveDiagnosticsSurface({ config: localConfig, queryBodyId: 'phone-fold6' });
  assert.equal(resolved.state, 'AUTHORIZED');
  assert.equal(resolved.source, 'LOCAL_ADAPTER_CONFIG');
  assert.equal(resolved.bodyId, 'phone-fold6');
  assert.equal(resolved.iframeSrc, 'http://127.0.0.1:8890/diagnostics/matrix/matrix.html?bodyId=phone-fold6');
  assert.equal(resolved.observationVersion, 'obs-20261126-001');
});

test('unauthorized or malformed local config fails closed', () => {
  assert.equal(resolveDiagnosticsSurface({ config: { ...localConfig, state: 'UNAVAILABLE' } }).state, 'UNAVAILABLE');
  assert.equal(resolveDiagnosticsSurface({ config: { ...localConfig, origin: 'http://192.168.1.20:8890' } }).reason, 'LOCAL_ADAPTER_BINDING_INVALID');
  assert.equal(resolveDiagnosticsSurface({ config: { ...localConfig, matrixPath: '/../../etc/passwd' } }).reason, 'LOCAL_ADAPTER_BINDING_INVALID');
  assert.equal(resolveDiagnosticsSurface({ config: localConfig, queryBodyId: 'bad id!' }).reason, 'AUTHORIZED_BODY_ID_REQUIRED');
  assert.equal(resolveDiagnosticsSurface({}).reason, 'DIAGNOSTICS_SURFACE_CONFIG_UNAUTHORIZED');
});

test('runtime hosted decision takes precedence over local config', () => {
  const decision = {
    state: 'HOSTED_APPROVED',
    entitlement: 'ACTIVE',
    capabilityRef: 'leeway.diagnostics',
    sessionAuthorization: 'AUTHORIZED',
    informationPersistence: 'PERSISTED',
    serviceAvailability: 'AVAILABLE',
    adapterConnectivity: 'CONNECTED',
    url: 'https://diagnostics.example.test/tablet'
  } as never;
  const resolved = resolveDiagnosticsSurface({ config: localConfig, decision, app });
  assert.equal(resolved.state, 'AUTHORIZED');
  assert.equal(resolved.source, 'RUNTIME_DECISION');
  assert.equal(new URL(resolved.iframeSrc as string).origin, 'https://diagnostics.example.test');
});

test('denied runtime decision is never downgraded to local adapter', () => {
  const decision = {
    state: 'DENIED', entitlement: 'ACTIVE', capabilityRef: 'leeway.diagnostics',
    sessionAuthorization: 'AUTHORIZED', informationPersistence: 'PERSISTED',
    serviceAvailability: 'AVAILABLE', adapterConnectivity: 'CONNECTED',
    url: 'https://diagnostics.example.test/tablet'
  } as never;
  const resolved = resolveDiagnosticsSurface({ config: localConfig, decision, app });
  assert.equal(resolved.state, 'DENIED');
  assert.equal(resolved.iframeSrc, null);
});

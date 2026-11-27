/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.AGENT.TABLET.DIAGNOSTICS.TEST
TAG: LEEWAY.TABLET.DIAGNOSTICS.SYNC.TEST.V1
5WH:
WHAT = Verify the versioned Tablet/widget Diagnostics state contract.
WHY = Prevent cross-origin injection, self-echo loops and stale telemetry overwrites.
WHO = Tablet diagnostics maintainers; this test grants no host or device authority.
WHERE = apps/agent-tablet/test/diagnostics/sync.test.ts.
WHEN = 2026-11-26.
HOW = Exercise message parsing, source-window validation and monotonic freshness decisions.
LICENSE = Repository terms.
*/

import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createDiagnosticsStateMessage,
  DIAGNOSTICS_SECTIONS,
  DIAGNOSTICS_STATE_TYPE,
  isAuthorizedBodyId,
  isTrustedPostMessage,
  parseDiagnosticsStateMessage,
  shouldApplyState
} from '../../src/diagnostics/sync';

const input = {
  bodyId: 'pc-primary',
  section: 'BOARD' as const,
  componentId: 'motherboard-1',
  visualization: 'PCB' as const,
  inspectorOpen: true,
  topologyPath: ['device', 'assembly'],
  observationVersion: 'obs-1',
  observationAt: 1000
};

test('all eight original sections are represented in the contract', () => {
  assert.deepEqual([...DIAGNOSTICS_SECTIONS], ['DIAG', 'BOARD', 'AGENTS', 'BUS', 'VERITAS', 'PROBES', 'SHELL', 'SETUP']);
});

test('message roundtrip preserves component, visualization and observation state', () => {
  const message = createDiagnosticsStateMessage(input, 'surface-a', 3);
  const parsed = parseDiagnosticsStateMessage(JSON.parse(JSON.stringify(message)));
  assert.ok(parsed);
  assert.equal(parsed.type, DIAGNOSTICS_STATE_TYPE);
  assert.equal(parsed.sourceId, 'surface-a');
  assert.equal(parsed.sequence, 3);
  assert.equal(parsed.section, 'BOARD');
  assert.equal(parsed.componentId, 'motherboard-1');
  assert.equal(parsed.visualization, 'PCB');
  assert.equal(parsed.inspectorOpen, true);
  assert.equal(parsed.observationVersion, 'obs-1');
  assert.equal(parsed.observationAt, 1000);
  assert.deepEqual(parsed.topologyPath, ['device', 'assembly']);
});

test('malformed and unauthorized messages are rejected', () => {
  const valid = createDiagnosticsStateMessage(input, 'surface-a', 1);
  assert.equal(parseDiagnosticsStateMessage({ ...valid, type: 'other' }), null);
  assert.equal(parseDiagnosticsStateMessage({ ...valid, schemaVersion: 2 }), null);
  assert.equal(parseDiagnosticsStateMessage({ ...valid, bodyId: '../admin' }), null);
  assert.equal(parseDiagnosticsStateMessage({ ...valid, section: 'FAKE' }), null);
  assert.equal(parseDiagnosticsStateMessage({ ...valid, visualization: 'UNKNOWN' }), null);
  assert.equal(parseDiagnosticsStateMessage({ ...valid, topologyPath: ['../secret'] }), null);
  assert.equal(isAuthorizedBodyId('bad id!'), false);
});

test('postMessage requires explicit trusted origin and source window', () => {
  const trustedWindow = { id: 'iframe' };
  const event = { origin: 'http://127.0.0.1:3218', source: trustedWindow };
  assert.equal(isTrustedPostMessage(event, { allowedOrigins: ['http://127.0.0.1:3218'], expectedSource: trustedWindow }), true);
  assert.equal(isTrustedPostMessage(event, { allowedOrigins: ['*'], expectedSource: trustedWindow }), false);
  assert.equal(isTrustedPostMessage(event, { allowedOrigins: ['https://other.test'], expectedSource: trustedWindow }), false);
  assert.equal(isTrustedPostMessage(event, { allowedOrigins: ['http://127.0.0.1:3218'], expectedSource: {} }), false);
});

test('self echo, older sequence and stale observation snapshots are ignored', () => {
  const first = createDiagnosticsStateMessage(input, 'surface-a', 4);
  const selfEcho = createDiagnosticsStateMessage(input, 'surface-a', 5);
  const validNext = createDiagnosticsStateMessage({ ...input, section: 'SETUP' }, 'surface-b', 5);
  const stale = createDiagnosticsStateMessage({ ...input, observationAt: 500 }, 'surface-b', 6);
  const olderSequence = createDiagnosticsStateMessage(input, 'surface-b', 4);

  assert.equal(shouldApplyState(first, selfEcho), false);
  assert.equal(shouldApplyState(first, olderSequence), false);
  assert.equal(shouldApplyState(first, stale), false);
  assert.equal(shouldApplyState(first, validNext), true);
});

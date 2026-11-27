/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.AGENT.TABLET.DIAGNOSTICS.TEST
TAG: LEEWAY.TABLET.HOST.DIAGNOSTICS.CONTRACT.TEST.V1
5WH:
WHAT = Verify the host diagnostics contract preserves observation and unavailable states.
WHY = Prevent fake readings, unsupported-device claims, and private unique identifiers from entering the Tablet UI.
WHO = Tablet diagnostics maintainers; this test grants no host or device authority.
WHERE = apps/agent-tablet/test/diagnostics/contract.test.ts.
WHEN = 2026-11-26.
HOW = Exercise the production normalizer with observed, missing, invalid, and privacy-sensitive host data.
LICENSE = Repository terms.
*/

import assert from 'node:assert/strict';
import test from 'node:test';
import {
  isDiagnosticsSnapshot,
  isLoopbackDiagnosticsAddress,
  normalizeDiagnosticsSnapshot,
  type DiagnosticsPlatform
} from '../../src/diagnostics/contract';

const windowsPlatform: DiagnosticsPlatform = {
  name: 'Windows_NT',
  release: '10.0',
  architecture: 'x64',
  source: 'WINDOWS_DEVICE_CIM',
  observedAt: '2026-11-26T06:00:00.000Z',
  processRssBytes: 1024,
  processHeapUsedBytes: 512,
  uptimeSeconds: 30,
  cpuMeaning: 'UTILIZATION'
};

test('normalizes actual Windows hardware identities and leaves unsupported physical geometry explicit', () => {
  const snapshot = normalizeDiagnosticsSnapshot({
    telemetry: { cpu: 23, ram: 61.5, disk: 48 },
    host: { manufacturer: 'Example Vendor', model: 'Example Workstation', serialNumber: 'must-not-escape' },
    processors: [{ name: 'Example CPU', manufacturer: 'Example Vendor', physicalCores: 8, logicalProcessors: 16, maxClockMHz: 4200 }],
    memoryModules: [{ name: 'Memory module', manufacturer: 'Example Vendor', capacityBytes: 17179869184, speedMHz: 5600, serialNumber: 'must-not-escape' }],
    graphicsAdapters: [{ name: 'Example GPU', adapterMemoryBytes: 8589934592 }],
    thermalSensors: [{ label: 'ACPI thermal zone 1', celsius: 47.2 }]
  }, windowsPlatform);

  assert.equal(snapshot.state, 'OBSERVED');
  assert.equal(snapshot.metrics.cpu.value, 23);
  assert.equal(snapshot.metrics.memory.value, 61.5);
  assert.equal(snapshot.metrics.temperature.value, null);
  assert.equal(snapshot.components.length, 3);
  assert.equal(snapshot.sensors[0]?.value, 47.2);
  assert.equal(snapshot.capabilities.matched3dModel, 'UNAVAILABLE');
  assert.equal(snapshot.capabilities.physicalComponentPlacement, 'UNVERIFIED');
  assert.equal(snapshot.device.enrollment, 'UNVERIFIED');
  assert.equal(isDiagnosticsSnapshot(snapshot), true);
  assert.equal(JSON.stringify(snapshot).includes('must-not-escape'), false);
});

test('missing and invalid values remain unavailable rather than becoming zero or healthy', () => {
  const snapshot = normalizeDiagnosticsSnapshot({
    telemetry: { cpu: null, ram: 120, disk: -1 },
    providerErrors: ['CPU_UTILIZATION_QUERY_FAILED']
  }, windowsPlatform);

  assert.equal(snapshot.state, 'UNAVAILABLE');
  assert.equal(snapshot.metrics.cpu.value, null);
  assert.equal(snapshot.metrics.memory.value, null);
  assert.equal(snapshot.metrics.disk.value, null);
  assert.equal(snapshot.metrics.temperature.value, null);
  assert.equal(snapshot.sensors.length, 0);
  assert.equal(snapshot.errors[0], 'CPU_UTILIZATION_QUERY_FAILED');
});

test('normalized OS load can exceed 100 percent without being relabeled as utilization', () => {
  const snapshot = normalizeDiagnosticsSnapshot({
    telemetry: { cpu: 127.5, ram: 40, disk: null },
    processors: [{ name: 'Reported CPU', logicalProcessors: 4 }]
  }, { ...windowsPlatform, source: 'NODE_HOST_OS', cpuMeaning: 'NORMALIZED_LOAD' });

  assert.equal(snapshot.telemetry.cpuMeaning, 'NORMALIZED_LOAD');
  assert.equal(snapshot.metrics.cpu.value, 127.5);
  assert.equal(snapshot.metrics.cpu.state, 'OBSERVED');
  assert.equal(snapshot.metrics.disk.state, 'UNAVAILABLE');
  assert.equal(snapshot.state, 'PARTIAL');
});

test('rejects malformed or legacy workflow snapshots', () => {
  assert.equal(isDiagnosticsSnapshot({ state: 'OBSERVED_HOST_TELEMETRY', flowNodes: [] }), false);
  assert.equal(isDiagnosticsSnapshot({ schemaVersion: 1, state: 'OBSERVED' }), false);
});

test('allows host diagnostics only on IPv4 or IPv6 loopback addresses', () => {
  assert.equal(isLoopbackDiagnosticsAddress('127.0.0.1'), true);
  assert.equal(isLoopbackDiagnosticsAddress('::ffff:127.0.0.1'), true);
  assert.equal(isLoopbackDiagnosticsAddress('::1'), true);
  assert.equal(isLoopbackDiagnosticsAddress('192.168.1.20'), false);
  assert.equal(isLoopbackDiagnosticsAddress(undefined), false);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  WORKFORCE_WORKER_IDS,
  fetchWorkforceSnapshot,
  projectWorkforceSnapshot,
} from './AgentVTWorkforceCommandCenter';

test('projects the complete W00-W17 roster as unverified when runtime health has no worker registry', () => {
  const result = projectWorkforceSnapshot({
    state: 'AUTHENTICATED_READ_ONLY_OBSERVED',
    runtimeDiscovery: 'OBSERVED',
    transport: 'MCP_STREAMABLE_HTTP',
  });
  assert.deepEqual(result.workers.map((worker) => worker.id), WORKFORCE_WORKER_IDS);
  assert.equal(result.workers.length, 18);
  assert.equal(result.workers.every((worker) => worker.state === 'UNVERIFIED'), true);
  assert.equal(result.workers.some((worker) => worker.running), false);
});

test('requires independent observation fields before a worker can be marked running', () => {
  const result = projectWorkforceSnapshot({
    workers: [
      { id: 'W03', state: 'RUNNING', evidenceState: 'OBSERVED' },
      { id: 'W08', state: 'RUNNING', evidenceState: 'OBSERVED', observedAt: new Date(Date.now() - 1_000).toISOString(), source: 'runtime-fixture', executorObserved: true, workId: 'work-08' },
    ],
  });
  assert.equal(result.workers.find((worker) => worker.id === 'W03')?.state, 'UNVERIFIED');
  assert.equal(result.workers.find((worker) => worker.id === 'W08')?.state, 'RUNNING');
  assert.equal(result.workers.find((worker) => worker.id === 'W08')?.running, true);
});

test('does not present stale running telemetry as live execution', () => {
  const result = projectWorkforceSnapshot({
    workers: [{ id: 'W08', state: 'RUNNING', evidenceState: 'OBSERVED', observedAt: new Date(Date.now() - 60_000).toISOString(), source: 'runtime-fixture', executorObserved: true }],
  });

  assert.equal(result.workers.find((worker) => worker.id === 'W08')?.state, 'UNVERIFIED');
  assert.equal(result.workers.find((worker) => worker.id === 'W08')?.reason, 'WORKER_HEARTBEAT_STALE');
});

test('projects separate executor identities and collaboration history from local Runtime evidence', () => {
  const observedAt = new Date().toISOString();
  const result = projectWorkforceSnapshot({
    state: 'AUTHENTICATED_LOCAL_RUNTIME_OBSERVED',
    runtimeDiscovery: 'OBSERVED',
    transport: 'CODEX_LOCAL_THREAD_ADAPTER_LOOPBACK',
    workers: [
      {
        id: 'W00', state: 'COMPLETED', evidenceState: 'OBSERVED', observedAt,
        source: 'codex-app-server', executorObserved: true, workId: 'C3-M2-W00-002',
        executionIdentity: 'LEEWAY-CODEX-EXEC-w00', threadId: 'thread-w00', sessionId: 'session-w00',
        turnId: 'turn-w00-2', stage: 'TEST', resumed: true, verified: false
      },
      {
        id: 'W08', state: 'COMPLETED', evidenceState: 'OBSERVED', observedAt,
        source: 'codex-app-server', executorObserved: true, workId: 'C3-M2-W08-002',
        executionIdentity: 'LEEWAY-CODEX-EXEC-w08', threadId: 'thread-w08', sessionId: 'session-w08',
        turnId: 'turn-w08-2', stage: 'TEST', resumed: true, verified: false
      }
    ],
    collaborationEvents: [{ type: 'PEER_HELP_RESPONSE', correlationId: 'M2-CORRELATION-001', deliveryStatus: 'CONSUMED' }],
    primeEvents: []
  });
  const w00 = result.workers.find((worker) => worker.id === 'W00');
  const w08 = result.workers.find((worker) => worker.id === 'W08');
  assert.equal(w00?.executionIdentity, 'LEEWAY-CODEX-EXEC-w00');
  assert.equal(w00?.threadId, 'thread-w00');
  assert.equal(w00?.resumed, true);
  assert.equal(w08?.executionIdentity, 'LEEWAY-CODEX-EXEC-w08');
  assert.notEqual(w00?.executionIdentity, w08?.executionIdentity);
  assert.equal(result.collaborationEvents.length, 1);
  assert.equal(result.primeEvents.length, 0);
});

test('maps missing caller authorization and provider failure to blocked readback', async () => {
  const result = await fetchWorkforceSnapshot(async () => new Response(
    JSON.stringify({ state: 'BLOCKED', reason: 'POCKET_ID_BEARER_REQUIRED' }),
    { status: 401, headers: { 'content-type': 'application/json' } },
  ));
  assert.equal(result.state, 'BLOCKED');
  assert.equal(result.reason, 'POCKET_ID_BEARER_REQUIRED');
  assert.equal(result.workers.every((worker) => worker.state === 'UNVERIFIED'), true);
});

/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.DIGITAL_WORKFORCE.TESTS
TAG: WORKFORCE.READONLY_MCP_CONTRACT_TEST_V1
5WH: WHAT=Verify Workforce Runtime Fabric MCP discovery and denial behavior;
WHY=Preserve upstream authority with no invented production admission; WHO=LeeWay Digital Workforce;
WHERE=integration/runtime-fabric/workforce-runtime-mcp.test.mjs; WHEN=2026-10-27;
HOW=Node test runner and in-memory Streamable HTTP fixture; AUTHORITY=TEST_ONLY; LICENSE=MIT.
*/
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  probeLocalWorkforceRuntime,
  probeWorkforceRuntimeMcp,
  resolveLocalWorkforceRuntimeConfig,
  resolveWorkforceMcpConfig,
  scopedBearerFromAuthorization
} from './workforce-runtime-mcp.mjs';
const URL = 'https://bridge.example/mcp';
const env = {
  LEEWAY_WORKFORCE_MCP_RESOURCE_URL: URL,
  LEEWAY_WORKFORCE_MCP_ACCESS_TOKEN: 'fixture-access-token-not-production'
};
const report = {
  runtimeFabric: { status: 'AVAILABLE', authentication: 'POCKET_ID_ACCESS_TOKEN_VERIFIED' },
  providerComposition: {
    deviceBridge: 'NOT_PROBED', continuum: 'NOT_PROBED', formula: 'NOT_PROBED',
    independentVeritas: 'NOT_PROBED', receiptAdmission: 'NOT_PROBED'
  }, authenticatedDeviceCommand: 'NOT_PROBED', mutation: 'NOT_ATTEMPTED'
};
const localUrl = 'http://127.0.0.1:43199/v1/workforce/snapshot';
const localReport = {
  schemaVersion: 'leeway.runtime.codex-workforce-snapshot.v1',
  state: 'AUTHENTICATED_LOCAL_RUNTIME_OBSERVED',
  runtimeDiscovery: 'OBSERVED',
  transport: 'CODEX_LOCAL_THREAD_ADAPTER_LOOPBACK',
  authentication: 'EXISTING_ADAPTER_BEARER_VERIFIED',
  workers: [{
    workerId: 'W08', workId: 'C3-M2-W08-001', state: 'COMPLETED', evidenceState: 'OBSERVED',
    observedAt: new Date().toISOString(), heartbeatAt: new Date().toISOString(), source: 'codex-app-server',
    executorObserved: true, executionIdentity: 'LEEWAY-CODEX-EXEC-fixture', threadId: 'thread-w08',
    sessionId: 'session-w08', turnId: 'turn-w08', engineeringStage: 'TEST', nextAction: 'Return evidence.',
    resumed: false, verified: false, canonicalAcceptance: false
  }],
  events: [{ type: 'WORKER_EXECUTION_COMPLETED_UNVERIFIED', workerId: 'W08', workId: 'C3-M2-W08-001' }],
  collaborationEvents: [{
    type: 'PEER_HELP_REQUEST', senderWorkerId: 'W00', recipientWorkerId: 'W08',
    correlationId: 'correlation-1', deliveryStatus: 'CONSUMED'
  }],
  primeEvents: [], approvalsEvents: [],
  productionExecutionAuthorized: false, formulaExecuted: false, veritasAccepted: false,
  receiptAdmitted: false, learningAdmitted: false,
  authorityBoundary: { canonicalWorkerIdentityVerified: false, primeIdentityVerified: false }
};
const json = (obj, init = {}) => new Response(JSON.stringify(obj), {
  status: init.status || 200, headers: { 'Content-Type': 'application/json', ...init.headers }
});
function fixture({
  catalog = [{name:'runtime_health', annotations:{readOnlyHint:true}}],
  health = report, failure = null, eventStream = false
} = {}) {
  const seen = [];
  async function fetchImpl(url, options) {
    assert.equal(url, URL);
    assert.equal(options.redirect, 'error');
    assert.equal(options.headers.Authorization, 'Bearer ' + env.LEEWAY_WORKFORCE_MCP_ACCESS_TOKEN);
    assert.equal(options.headers['MCP-Protocol-Version'], '2025-06-18');
    const call = JSON.parse(options.body);
    seen.push(call.method);
    if (failure) return json({error:'denied'}, {status:failure});
    if (call.method === 'notifications/initialized') return new Response('', {status:202});
    const results = {
      initialize: { protocolVersion:'2025-06-18', capabilities:{tools:{}}, serverInfo:{name:'canonical-runtime', version:'1'} },
      'tools/list': { tools: catalog },
      'tools/call': { content: [{type:'text',text:JSON.stringify(health)}] }
    };
    const payload = {jsonrpc:'2.0', id:call.id, result:results[call.method]};
    if (eventStream && call.method === 'tools/call') {
      return new Response('event: message\ndata: ' + JSON.stringify(payload) + '\n\n',
        {headers:{'content-type':'text/event-stream'}});
    }
    return json(payload);
  }
  return { fetchImpl, seen };
}
test('fails closed without canonical HTTPS resource and bearer', async () => {
  for (const bad of [
    {}, {LEEWAY_WORKFORCE_MCP_RESOURCE_URL: 'http://bridge.example/mcp'},
    {LEEWAY_WORKFORCE_MCP_RESOURCE_URL: 'https://localhost/mcp'},
    {LEEWAY_WORKFORCE_MCP_RESOURCE_URL: 'https://169.254.169.254/mcp'},
    {LEEWAY_WORKFORCE_MCP_RESOURCE_URL: 'https://bridge.example/api/mcp'},
    {LEEWAY_WORKFORCE_MCP_RESOURCE_URL: 'https://bridge.example/mcp?token=a'}
  ]) assert.equal(resolveWorkforceMcpConfig(bad).ok, false);
  const result = await probeWorkforceRuntimeMcp({env:{}});
  assert.equal(result.state, 'BLOCKED');
  assert.equal(result.productionExecutionAuthorized, false);
});
test('real MCP initialize, tools/list and fixed runtime_health call remain read-only', async () => {
  const {fetchImpl,seen} = fixture();
  const result = await probeWorkforceRuntimeMcp({env,fetchImpl});
  assert.deepEqual(seen, ['initialize','notifications/initialized','tools/list','tools/call']);
  assert.equal(result.state, 'AUTHENTICATED_READ_ONLY_OBSERVED');
  assert.equal(result.providerComposition.formula, 'NOT_PROBED');
  assert.equal(result.veritasAccepted, false);
  assert.equal(result.learningAdmitted, false);
  assert.equal(result.productionExecutionAuthorized, false);
  assert.equal(JSON.stringify(result).includes(env.LEEWAY_WORKFORCE_MCP_ACCESS_TOKEN), false);
});
test('current OIDC-verified Runtime label is accepted without claiming worker activation', async () => {
  const currentRuntime = {
    ...report,
    runtimeFabric: {status:'AVAILABLE', authentication:'OIDC_ACCESS_TOKEN_VERIFIED'}
  };
  const {fetchImpl,seen} = fixture({health:currentRuntime});
  const result = await probeWorkforceRuntimeMcp({env,fetchImpl});
  assert.deepEqual(seen, ['initialize','notifications/initialized','tools/list','tools/call']);
  assert.equal(result.state, 'AUTHENTICATED_READ_ONLY_OBSERVED');
  assert.equal(result.providerComposition.deviceBridge, 'NOT_PROBED');
  assert.equal(result.productionExecutionAuthorized, false);
  assert.equal(result.formulaExecuted, false);
  assert.equal(result.veritasAccepted, false);
  assert.equal(result.receiptAdmitted, false);
  assert.equal(result.learningAdmitted, false);
  assert.equal(Object.hasOwn(result, 'workers'), false);
});

test('unverified or caller-asserted OIDC strings remain blocked', async () => {
  for (const authentication of ['OIDC_BEARER_PRESENT','OIDC_ACCESS_TOKEN_UNVERIFIED','OIDC_ACCESS_TOKEN_VERIFIED_BY_CLIENT',null]) {
    const health={...report,runtimeFabric:{status:'AVAILABLE',authentication}};
    const result=await probeWorkforceRuntimeMcp({env,fetchImpl:fixture({health}).fetchImpl});
    assert.equal(result.state, 'BLOCKED');
    assert.equal(result.reason,'MCP_HEALTH_CONTRACT_MISMATCH');
    assert.equal(result.productionExecutionAuthorized,false);
  }
});

test('SSE Streamable HTTP response also decodes', async () => {
  const r = await probeWorkforceRuntimeMcp({env,fetchImpl:fixture({eventStream:true}).fetchImpl});
  assert.equal(r.state, 'AUTHENTICATED_READ_ONLY_OBSERVED');
});
test('missing read-only tool declaration cannot be used as execution grant', async () => {
  const {fetchImpl,seen} = fixture({catalog:[{name:'runtime_health'}]});
  const r = await probeWorkforceRuntimeMcp({env,fetchImpl});
  assert.equal(r.reason, 'READONLY_RUNTIME_HEALTH_NOT_ADVERTISED');
  assert.equal(seen.includes('tools/call'),false);
});
test('forged success, missing probe truth and HTTP refusal stay blocked', async () => {
  for (const params of [
    {health:{...report, mutation:'EXECUTED'}},
    {health:{...report, runtimeFabric:{status:'AVAILABLE',authentication:'NONE'}}},
    {failure:401}
  ]) {
    const r = await probeWorkforceRuntimeMcp({env,fetchImpl:fixture(params).fetchImpl});
    assert.equal(r.state, 'BLOCKED');
    assert.equal(r.productionExecutionAuthorized,false);
  }
});
test('unavailable transport is sanitized; no token escapes', async () => {
  const r=await probeWorkforceRuntimeMcp({env,fetchImpl:async()=>{
    throw new Error('secret '+env.LEEWAY_WORKFORCE_MCP_ACCESS_TOKEN);
  }});
  assert.equal(r.reason,'MCP_UNAVAILABLE_OR_REJECTED');
  assert.equal(JSON.stringify(r).includes(env.LEEWAY_WORKFORCE_MCP_ACCESS_TOKEN),false);
});

test('caller authorization header is required; never use a shared service bearer', () => {
  assert.equal(scopedBearerFromAuthorization(undefined), null);
  assert.equal(scopedBearerFromAuthorization('Basic abc'), null);
  assert.equal(scopedBearerFromAuthorization('Bearer abc\r\nHost: evil.example'), null);
  assert.equal(scopedBearerFromAuthorization('Bearer '), null);
  assert.equal(scopedBearerFromAuthorization('Bearer a.b_c-123'), 'a.b_c-123');
});

test('local Runtime resource is restricted to an exact loopback snapshot route', () => {
  assert.equal(resolveLocalWorkforceRuntimeConfig({ LEEWAY_WORKFORCE_LOCAL_RUNTIME_URL: localUrl }).ok, true);
  for (const value of [
    'https://127.0.0.1:43199/v1/workforce/snapshot',
    'http://localhost:43199/v1/workforce/snapshot',
    'http://127.0.0.1/v1/workforce/snapshot',
    'http://127.0.0.1:43199/v1/assignments',
    'http://127.0.0.1:43199/v1/workforce/snapshot?token=secret',
    'http://example.com:43199/v1/workforce/snapshot'
  ]) assert.equal(resolveLocalWorkforceRuntimeConfig({ LEEWAY_WORKFORCE_LOCAL_RUNTIME_URL: value }).ok, false);
});

test('caller bearer reads and bounds existing local Runtime worker evidence', async () => {
  const token = 'caller-bound-existing-adapter-token';
  let request;
  const result = await probeLocalWorkforceRuntime({
    env: { LEEWAY_WORKFORCE_LOCAL_RUNTIME_URL: localUrl },
    authorizationToken: token,
    fetchImpl: async (url, options) => {
      request = { url, options };
      return json(localReport);
    }
  });
  assert.equal(request.url, localUrl);
  assert.equal(request.options.method, 'GET');
  assert.equal(request.options.headers.Authorization, `Bearer ${token}`);
  assert.equal(result.state, 'AUTHENTICATED_LOCAL_RUNTIME_OBSERVED');
  assert.equal(result.workers[0].id, 'W08');
  assert.equal(result.workers[0].executionIdentity, 'LEEWAY-CODEX-EXEC-fixture');
  assert.equal(result.collaborationEvents[0].type, 'PEER_HELP_REQUEST');
  assert.equal(result.veritasAccepted, false);
  assert.equal(JSON.stringify(result).includes(token), false);
});

test('forged local authority or worker evidence fails closed', async () => {
  for (const health of [
    { ...localReport, veritasAccepted: true },
    { ...localReport, authorityBoundary: { canonicalWorkerIdentityVerified: true, primeIdentityVerified: false } },
    { ...localReport, primeEvents: [{ type: 'PRIME_DECISION' }] },
    { ...localReport, workers: [{ ...localReport.workers[0], executorObserved: false }] },
    { ...localReport, workers: [{ ...localReport.workers[0], workerId: 'W18' }] }
  ]) {
    const result = await probeLocalWorkforceRuntime({
      env: { LEEWAY_WORKFORCE_LOCAL_RUNTIME_URL: localUrl },
      authorizationToken: 'caller-bound-existing-adapter-token',
      fetchImpl: async () => json(health)
    });
    assert.equal(result.state, 'BLOCKED');
  }
});

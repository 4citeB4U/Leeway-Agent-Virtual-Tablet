/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.TABLET.NATIVE.RUNTIME.AUTHORIZATION.TESTS
TAG: LEEWAY.TABLET.NATIVE.APP.SURFACE.DECISION.V1.TESTS
5WH:
WHAT = Qualify native launch authorization against current Runtime decisions and denial cases.
WHY = Prove identity, freshness, entitlement and IPC checks fail closed before user-facing access.
WHO = Tablet source owners under Creator authorization.
WHERE = native/agent-vt/native-app-authorization.test.cjs.
WHEN = 2026-11-25.
HOW = Exercise the production decision validator with bounded injected Runtime fixtures.
LICENSE = Existing repository terms; no new rights declared.
*/
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  createNativeAppAuthorizer,
  isTrustedIpcFrame
} = require('./native-app-authorization.cjs');

const now = 1_800_000_000_000;
const testCoreAuthority = Object.freeze({
  capabilityRef: 'runtime.core.diagnostics',
  action: 'runtime.core.read',
  scope: 'runtime.core.read'
});
const scope = {
  sessionRef: 'session-001',
  tenantRef: 'tenant-001',
  projectRef: 'project-001',
  deviceRef: 'device-001',
  subjectRef: 'creator-subject-001',
  sessionAuthorization: 'AUTHORIZED',
  policyRevision: 4,
  issuedAt: now,
  expiresAt: now + 10_000,
  entitlement: 'ACTIVE',
  informationPersistence: 'PERSISTED',
  authority: 'ORIGINAL_RUNTIME_PRODUCT_ADMISSION'
};

function appDecision(request, overrides = {}) {
  return {
    ...scope,
    ...request,
    authorizedAction: request.action,
    state: 'HOSTED_APPROVED',
    url: 'https://4citeb4u.github.io/LeeWay-Continuum/',
    ...overrides
  };
}

function makeAuthorizer({
  appDecisionSource = async request => appDecision(request),
  authenticatedContextSource = async () => scope,
  coreDecisionSource,
  coreAuthority = testCoreAuthority,
  clock = () => now,
  requestId = () => 'request-0001'
} = {}) {
  return createNativeAppAuthorizer({
    appDecisionSource,
    authenticatedContextSource,
    coreDecisionSource,
    coreAuthority,
    creatorIssuer: 'https://identity.example.test/',
    creatorAudience: 'leeway-runtime',
    now: clock,
    createRequestId: requestId
  });
}

test('unbound Runtime authority cannot open a native app surface', async () => {
  const auth = createNativeAppAuthorizer({ now: () => now, createRequestId: () => 'request-0001' });
  const decision = await auth.authorizeAppSurface({
    appId: 'continuum', surface: 'widget', launchOrigin: 'taskbar'
  });
  assert.equal(decision.state, 'UNAVAILABLE');
  assert.equal(decision.url, null);
});

test('unregistered application identities fail closed', async () => {
  const auth = makeAuthorizer();
  const decision = await auth.authorizeAppSurface({
    appId: 'modelHub', surface: 'widget', launchOrigin: 'desktop'
  });
  assert.equal(decision.state, 'DENIED');
  assert.equal(decision.reason, 'APPLICATION_CAPABILITY_NOT_REGISTERED');
});

test('fresh Runtime approval preserves app identity and leewaySession', async () => {
  const requests = [];
  const auth = makeAuthorizer({
    appDecisionSource: async request => {
      requests.push(request);
      return appDecision(request);
    }
  });
  const decision = await auth.authorizeAppSurface({
    appId: 'continuum',
    surface: 'widget',
    launchOrigin: 'taskbar',
    candidateUrl: 'https://4citeb4u.github.io/LeeWay-Continuum/'
  });
  assert.equal(decision.state, 'HOSTED_APPROVED');
  assert.equal(new URL(decision.url).searchParams.get('leewaySession'), 'leeway.app.continuum');
  assert.equal(new URL(decision.url).searchParams.get('leewaySurface'), 'widget');
  assert.equal(requests.length, 1);
  assert.equal(requests[0].action, 'continuum.read');
  assert.equal(requests[0].appId, 'continuum');
  assert.equal(requests[0].requestId, 'request-0001');
});

test('every supported native launch origin requires and accepts a fresh Runtime decision', async () => {
  for (const launchOrigin of [
    'desktop', 'context-menu', 'taskbar', 'floating-widget',
    'restored-widget', 'widget-control', 'open-request-file'
  ]) {
    const auth = makeAuthorizer();
    const decision = await auth.authorizeAppSurface({
      appId: 'continuum', surface: 'widget', launchOrigin
    });
    assert.equal(decision.state, 'HOSTED_APPROVED', launchOrigin);
  }
  const auth = makeAuthorizer();
  assert.equal((await auth.authorizeAppSurface({
    appId: 'continuum', surface: 'widget', launchOrigin: 'untrusted-menu'
  })).state, 'DENIED');
});

test('restored Widget sessions obtain a new decision and close on current revocation', async () => {
  let calls = 0;
  let revoked = false;
  const auth = makeAuthorizer({
    appDecisionSource: async request => {
      calls += 1;
      return appDecision(request, revoked ? { entitlement: 'REVOKED' } : {});
    }
  });
  assert.equal((await auth.authorizeAppSurface({
    appId: 'continuum', surface: 'widget', launchOrigin: 'restored-widget'
  })).state, 'HOSTED_APPROVED');
  revoked = true;
  const restored = await auth.authorizeAppSurface({
    appId: 'continuum', surface: 'widget', launchOrigin: 'restored-widget'
  });
  assert.equal(calls, 2);
  assert.equal(restored.state, 'DENIED');
  assert.equal(restored.reason, 'ENTITLEMENT_NOT_USER_ACCESSIBLE');
});

test('revoked, degraded, creator-exclusive and unbound entitlements deny user-facing apps', async () => {
  for (const entitlement of ['REVOKED', 'DEGRADED', 'CREATOR_EXCLUSIVE', 'UNKNOWN']) {
    const auth = makeAuthorizer({
      appDecisionSource: async request => appDecision(request, { entitlement })
    });
    const result = await auth.authorizeAppSurface({
      appId: 'diagnostics', surface: 'tablet', launchOrigin: 'context-menu'
    });
    assert.equal(result.state, 'DENIED', entitlement);
    assert.equal(result.url, null, entitlement);
  }
});

test('fresh decision binding rejects stale replay and mismatched identity or surface', async () => {
  const variants = [
    { requestId: 'old-request' },
    { tenantRef: 'tenant-other' },
    { projectRef: 'project-other' },
    { deviceRef: 'device-other' },
    { sessionRef: 'session-other' },
    { capabilityRef: 'leeway.other' },
    { authorizedAction: 'diagnostics.read' },
    { surface: 'tablet' },
    { launchOrigin: 'desktop' },
    { sessionAuthorization: 'UNAUTHORIZED' },
    { issuedAt: now - 11_000 },
    { expiresAt: now - 1 }
  ];
  for (const variant of variants) {
    const auth = makeAuthorizer({
      appDecisionSource: async request => appDecision(request, variant)
    });
    const result = await auth.authorizeAppSurface({
      appId: 'continuum', surface: 'widget', launchOrigin: 'taskbar'
    });
    assert.equal(result.state, 'DENIED', JSON.stringify(variant));
    assert.equal(result.url, null, JSON.stringify(variant));
  }
});

test('loopback catalog URLs never authorize directly; connected local adapters need Runtime binding', async () => {
  const withoutDecision = makeAuthorizer({
    appDecisionSource: async request => appDecision(request, {
      state: 'HOSTED_APPROVED',
      url: 'http://127.0.0.1:3217/?view=continuum'
    })
  });
  const hosted = await withoutDecision.authorizeAppSurface({
    appId: 'continuum', surface: 'widget', launchOrigin: 'floating-widget',
    candidateUrl: 'http://127.0.0.1:3217/?view=continuum'
  });
  assert.equal(hosted.state, 'UNAVAILABLE');
  assert.equal(hosted.reason, 'HOSTED_SURFACE_HTTPS_REQUIRED');

  const disconnected = makeAuthorizer({
    appDecisionSource: async request => appDecision(request, {
      state: 'LOCAL_ADAPTER_AUTHORIZED',
      url: 'http://127.0.0.1:3217/?view=continuum',
      adapterConnectivity: 'DISCONNECTED',
      adapterRef: 'adapter-001',
      adapterDeviceRef: 'device-001'
    })
  });
  assert.equal((await disconnected.authorizeAppSurface({
    appId: 'continuum', surface: 'widget', launchOrigin: 'floating-widget',
    candidateUrl: 'http://127.0.0.1:3217/?view=continuum'
  })).state, 'UNAVAILABLE');

  const connected = makeAuthorizer({
    appDecisionSource: async request => appDecision(request, {
      state: 'LOCAL_ADAPTER_AUTHORIZED',
      url: 'http://127.0.0.1:3217/?view=continuum',
      adapterConnectivity: 'CONNECTED',
      adapterRef: 'adapter-001',
      adapterDeviceRef: 'device-001'
    })
  });
  assert.equal((await connected.authorizeAppSurface({
    appId: 'continuum', surface: 'widget', launchOrigin: 'floating-widget',
    candidateUrl: 'http://127.0.0.1:3217/?view=continuum'
  })).state, 'LOCAL_ADAPTER_AUTHORIZED');
});

test('only separately scoped, current Creator Core grants authorize Core', async () => {
  const auth = makeAuthorizer({
    coreDecisionSource: async request => ({
      ...scope,
      ...request,
      authorizedAction: request.action,
      state: 'AUTHORIZED',
      entitlement: 'CREATOR_EXCLUSIVE',
      authority: 'ORIGINAL_RUNTIME_CREATOR_AUTHORITY',
      subjectRef: 'creator-subject-001',
      expectedIssuer: 'https://identity.example.test/',
      expectedAudience: 'leeway-runtime',
      principal: {
        issuer: 'https://identity.example.test/',
        audiences: ['leeway-runtime'],
        subject: 'creator-subject-001',
        scopes: [testCoreAuthority.scope],
        expiresAt: Math.floor(now / 1000) + 60,
        sessionRef: 'session-001'
      },
      currentGrant: {
        active: true,
        revoked: false,
        scope: testCoreAuthority.scope,
        subject: 'creator-subject-001',
        sessionRef: 'session-001'
      }
    })
  });
  assert.equal((await auth.authorizeCreatorCore()).state, 'AUTHORIZED');
});

test('Core access remains unavailable until the original Runtime capability registry is bound', async () => {
  const auth = createNativeAppAuthorizer({
    authenticatedContextSource: async () => scope,
    coreDecisionSource: async () => {
      throw new Error('Core decision source must not run without the capability registry');
    },
    creatorIssuer: 'https://identity.example.test/',
    creatorAudience: 'leeway-runtime',
    now: () => now,
    createRequestId: () => 'request-0001'
  });
  const decision = await auth.authorizeCreatorCore();
  assert.equal(decision.state, 'UNAVAILABLE');
  assert.equal(decision.reason, 'CREATOR_CORE_CAPABILITY_REGISTRY_UNBOUND');
});

test('business overview scope, missing grants and revoked Core grants do not authorize Core', async () => {
  const current = {
    ...scope,
    appId: 'leeWayCore',
    appSessionId: 'leeway.app.leeWayCore',
    capabilityRef: testCoreAuthority.capabilityRef,
    action: testCoreAuthority.action,
    authorizedAction: testCoreAuthority.action,
    surface: 'core',
    launchOrigin: 'core-dock',
    requestId: 'request-0001',
    state: 'AUTHORIZED',
    entitlement: 'CREATOR_EXCLUSIVE',
    authority: 'ORIGINAL_RUNTIME_CREATOR_AUTHORITY',
    subjectRef: 'creator-subject-001',
    expectedIssuer: 'https://identity.example.test/',
    expectedAudience: 'leeway-runtime',
    principal: {
      issuer: 'https://identity.example.test/',
      audiences: ['leeway-runtime'],
      subject: 'creator-subject-001',
      scopes: ['creator.business.read'],
      expiresAt: Math.floor(now / 1000) + 60,
      sessionRef: 'session-001'
    },
    currentGrant: {
      active: true,
      revoked: false,
      scope: 'creator.business.read',
      subject: 'creator-subject-001',
      sessionRef: 'session-001'
    }
  };
  const auth = makeAuthorizer({
    authenticatedContextSource: async () => scope,
    coreDecisionSource: async request => ({ ...current, ...request })
  });
  const result = await auth.authorizeCreatorCore();
  assert.equal(result.state, 'DENIED');
  assert.equal(result.reason, 'CURRENT_CREATOR_CORE_GRANT_REQUIRED');

  const revokedAuth = makeAuthorizer({
    coreDecisionSource: async request => ({
      ...current,
      ...request,
      principal: {
        ...current.principal,
        scopes: [testCoreAuthority.scope]
      },
      currentGrant: {
        active: true,
        revoked: true,
        scope: testCoreAuthority.scope,
        subject: 'creator-subject-001',
        sessionRef: 'session-001'
      }
    })
  });
  const revoked = await revokedAuth.authorizeCreatorCore();
  assert.equal(revoked.state, 'DENIED');
  assert.equal(revoked.reason, 'CURRENT_CREATOR_CORE_GRANT_REQUIRED');
});

test('IPC authorization requires the trusted main frame and expected origin', () => {
  const mainFrame = { url: 'http://127.0.0.1:3217/' };
  const webContents = { mainFrame };
  assert.equal(isTrustedIpcFrame({
    sender: webContents, senderFrame: mainFrame
  }, webContents, 'http://127.0.0.1:3217/'), true);
  assert.equal(isTrustedIpcFrame({
    sender: webContents, senderFrame: { url: mainFrame.url }
  }, webContents, 'http://127.0.0.1:3217/'), false);
  assert.equal(isTrustedIpcFrame({
    sender: webContents, senderFrame: { url: 'https://attacker.example/' }
  }, webContents, 'http://127.0.0.1:3217/'), false);

  const fileFrame = { url: 'file:///C:/LeeWay/approved-app.html?leewaySession=leeway.app.continuum' };
  const fileWebContents = { mainFrame: fileFrame };
  assert.equal(isTrustedIpcFrame({
    sender: fileWebContents, senderFrame: fileFrame
  }, fileWebContents, 'file:///C:/LeeWay/approved-app.html'), true);
  assert.equal(isTrustedIpcFrame({
    sender: fileWebContents, senderFrame: { url: 'file:///C:/LeeWay/other-app.html' }
  }, fileWebContents, 'file:///C:/LeeWay/approved-app.html'), false);
});

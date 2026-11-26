/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.TABLET.INTEGRATION.TEST
TAG: LEEWAY.TABLET.NATIVE.LAUNCH_BINDINGS.TEST.V1
WHAT = Verify portable native launcher defaults and deployment overrides.
WHY = Prevent machine-specific paths from silently becoming packaged authority.
WHO = LeeWay Tablet reviewers under Creator and Standards.
WHERE = integration/runtime-fabric/native-launch-bindings.test.mjs.
HOW = Pure binding resolution tests with no host launch or filesystem mutation.
*/
import assert from 'node:assert/strict';
import path from 'node:path';
import { createRequire } from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
const { resolveNativeLaunchBindings } = require('../../native/agent-vt/native-launch-bindings.cjs');

test('uses package-relative Tablet source and leaves external products unbound by default', () => {
  const nativeDirectory = path.join(path.sep, 'deployment', 'native', 'agent-vt');
  const bindings = resolveNativeLaunchBindings({ nativeDirectory, env: {} });

  assert.equal(bindings.tabletRoot, path.resolve(nativeDirectory, '../../apps/agent-tablet'));
  assert.equal(bindings.tabletPort, 3217);
  assert.equal(bindings.officeRoot, null);
  assert.equal(bindings.officeUrl, null);
  assert.equal(bindings.modelHub3dSource, null);
});

test('uses deployment-provided external roots and validates configured ports', () => {
  const nativeDirectory = path.join(path.sep, 'deployment', 'native', 'agent-vt');
  const env = {
    LEEWAY_AGENT_TABLET_ROOT: path.join(path.sep, 'release', 'tablet'),
    LEEWAY_AGENT_TABLET_PORT: '4123',
    LEEWAY_OFFICE_ROOT: path.join(path.sep, 'release', 'office'),
    LEEWAY_OFFICE_PORT: '4124',
    LEEWAY_MODEL_HUB_3D_SOURCE: path.join(path.sep, 'release', 'model-hub.html')
  };
  const bindings = resolveNativeLaunchBindings({ nativeDirectory, env });

  assert.equal(bindings.tabletRoot, path.resolve(env.LEEWAY_AGENT_TABLET_ROOT));
  assert.equal(bindings.tabletPort, 4123);
  assert.equal(bindings.officeRoot, path.resolve(env.LEEWAY_OFFICE_ROOT));
  assert.equal(bindings.officePort, 4124);
  assert.equal(bindings.officeUrl, 'http://127.0.0.1:4124/');
  assert.equal(bindings.modelHub3dSource, path.resolve(env.LEEWAY_MODEL_HUB_3D_SOURCE));
  assert.throws(() => resolveNativeLaunchBindings({
    nativeDirectory,
    env: { ...env, LEEWAY_AGENT_TABLET_PORT: '70000' }
  }), /INVALID_AGENT_TABLET_PORT/);
});

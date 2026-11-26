/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.TABLET.NATIVE.LAUNCH_BINDINGS
TAG: LEEWAY.TABLET.NATIVE.LAUNCH_BINDINGS.V1
WHAT = Resolve native application roots without machine-specific source defaults.
WHY = Keep packaged Tablet launches portable across deployment locations.
WHO = LeeWay Agent Virtual Tablet.
WHERE = native/agent-vt/native-launch-bindings.cjs.
HOW = Deployment overrides for external products and a package-relative Tablet root.
*/
const path = require('node:path');

function resolveNativeLaunchBindings({ nativeDirectory, env = process.env } = {}) {
  if (typeof nativeDirectory !== 'string' || !nativeDirectory) {
    throw new TypeError('NATIVE_DIRECTORY_REQUIRED');
  }

  const configuredPath = key => env[key] ? path.resolve(env[key]) : null;
  const tabletPort = Number(env.LEEWAY_AGENT_TABLET_PORT || 3217);
  const officePort = Number(env.LEEWAY_OFFICE_PORT || 3221);
  if (!Number.isInteger(tabletPort) || tabletPort < 1 || tabletPort > 65535) {
    throw new Error('INVALID_AGENT_TABLET_PORT');
  }
  if (!Number.isInteger(officePort) || officePort < 1 || officePort > 65535) {
    throw new Error('INVALID_OFFICE_PORT');
  }

  const officeRoot = configuredPath('LEEWAY_OFFICE_ROOT');
  return Object.freeze({
    tabletRoot: configuredPath('LEEWAY_AGENT_TABLET_ROOT') ||
      path.resolve(nativeDirectory, '../../apps/agent-tablet'),
    tabletPort,
    officeRoot,
    officePort,
    officeUrl: officeRoot ? `http://127.0.0.1:${officePort}/` : null,
    modelHub3dSource: configuredPath('LEEWAY_MODEL_HUB_3D_SOURCE')
  });
}

module.exports = { resolveNativeLaunchBindings };

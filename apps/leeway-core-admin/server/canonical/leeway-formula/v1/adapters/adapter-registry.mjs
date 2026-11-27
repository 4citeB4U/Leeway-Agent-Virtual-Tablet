import { rawBase64V1 } from './raw-base64-v1.mjs';
import { runtimeStateV1 } from './runtime-state-v1.mjs';

const ADAPTERS = [rawBase64V1, runtimeStateV1];

export function listAdapters() {
  return ADAPTERS.map(a => ({
    adapterId: a.adapterId,
    formulaId: a.formulaId,
    version: a.version,
    window: a.window,
    width: a.width,
    description: a.description
  }));
}

export function getAdapter(adapterId) {
  const adapter = ADAPTERS.find(a => a.adapterId === adapterId);
  if (!adapter) throw new Error(`ADAPTER_NOT_FOUND:${adapterId}`);
  return adapter;
}

export function toMatrix(adapterId, input) {
  return getAdapter(adapterId).toMatrix(input);
}

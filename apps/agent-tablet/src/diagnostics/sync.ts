/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.AGENT.TABLET.DIAGNOSTICS.SYNC
TAG: LEEWAY.TABLET.WIDGET.DIAGNOSTICS.STATE.CONTRACT.V1
5WH:
WHAT = Define a validated bidirectional Diagnostics state contract for Tablet and floating widget.
WHY = Synchronize device, section, component, visualization, inspector and observation state without loops or stale overwrites.
WHO = Creator-authorized Tablet surface maintainer; Runtime Fabric remains state authority.
WHERE = apps/agent-tablet/src/diagnostics/sync.ts.
WHEN = 2026-11-26.
HOW = Versioned messages, explicit trusted origins, source-window validation, monotonic sequence and freshness checks.
LICENSE = Repository terms; no new license asserted.
*/

export const DIAGNOSTICS_STATE_TYPE = 'leeway.diagnostics.state.v1';
export const DIAGNOSTICS_STATE_CHANNEL = 'leeway-diagnostics-state-v1';
export const DIAGNOSTICS_SECTIONS = ['DIAG', 'BOARD', 'AGENTS', 'BUS', 'VERITAS', 'PROBES', 'SHELL', 'SETUP'] as const;
export const DIAGNOSTICS_VISUALIZATIONS = ['2D', '3D', 'PCB', 'THERMAL', 'TOPOLOGY', 'XRAY', 'CAD', 'LIVE_SENSOR', 'BUS_ANALYSIS'] as const;

export type DiagnosticsSection = typeof DIAGNOSTICS_SECTIONS[number];
export type DiagnosticsVisualization = typeof DIAGNOSTICS_VISUALIZATIONS[number];

export interface DiagnosticsStateMessage {
  type: typeof DIAGNOSTICS_STATE_TYPE;
  schemaVersion: 1;
  sourceId: string;
  sequence: number;
  emittedAt: number;
  bodyId: string;
  section: DiagnosticsSection;
  componentId: string | null;
  visualization: DiagnosticsVisualization;
  inspectorOpen: boolean;
  topologyPath: string[];
  observationVersion: string | null;
  observationAt: number | null;
}

export type DiagnosticsStateInput = Omit<DiagnosticsStateMessage, 'type' | 'schemaVersion' | 'sourceId' | 'sequence' | 'emittedAt'>;

const BODY = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;
const ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const OBSERVATION = /^[A-Za-z0-9._:-]{0,160}$/;

export function createDiagnosticsStateMessage(
  state: DiagnosticsStateInput,
  sourceId: string,
  sequence: number
): DiagnosticsStateMessage {
  if (!ID.test(sourceId)) throw new Error('DIAGNOSTICS_SYNC_SOURCE_ID_INVALID');
  if (!Number.isSafeInteger(sequence) || sequence < 0) throw new Error('DIAGNOSTICS_SYNC_SEQUENCE_INVALID');
  return Object.freeze({
    type: DIAGNOSTICS_STATE_TYPE,
    schemaVersion: 1,
    sourceId,
    sequence,
    emittedAt: Date.now(),
    bodyId: state.bodyId,
    section: state.section,
    componentId: state.componentId,
    visualization: state.visualization,
    inspectorOpen: state.inspectorOpen,
    topologyPath: [...state.topologyPath],
    observationVersion: state.observationVersion,
    observationAt: state.observationAt
  });
}

export function parseDiagnosticsStateMessage(value: unknown): DiagnosticsStateMessage | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const item = value as Record<string, unknown>;
  if (item.type !== DIAGNOSTICS_STATE_TYPE || item.schemaVersion !== 1) return null;
  if (typeof item.sourceId !== 'string' || !ID.test(item.sourceId)) return null;
  if (!Number.isSafeInteger(item.sequence) || (item.sequence as number) < 0) return null;
  if (!Number.isFinite(item.emittedAt)) return null;
  if (typeof item.bodyId !== 'string' || !BODY.test(item.bodyId)) return null;
  if (typeof item.section !== 'string' || !(DIAGNOSTICS_SECTIONS as readonly string[]).includes(item.section)) return null;
  if (item.componentId !== null && (typeof item.componentId !== 'string' || !ID.test(item.componentId))) return null;
  if (typeof item.visualization !== 'string' ||
      !(DIAGNOSTICS_VISUALIZATIONS as readonly string[]).includes(item.visualization)) return null;
  if (typeof item.inspectorOpen !== 'boolean') return null;
  if (!Array.isArray(item.topologyPath) || item.topologyPath.length > 16 ||
      !item.topologyPath.every(part => typeof part === 'string' && ID.test(part))) return null;
  if (item.observationVersion !== null &&
      (typeof item.observationVersion !== 'string' || !OBSERVATION.test(item.observationVersion))) return null;
  if (item.observationAt !== null && (!Number.isFinite(item.observationAt) || (item.observationAt as number) < 0)) return null;
  return Object.freeze({
    type: DIAGNOSTICS_STATE_TYPE,
    schemaVersion: 1,
    sourceId: item.sourceId,
    sequence: item.sequence as number,
    emittedAt: item.emittedAt as number,
    bodyId: item.bodyId,
    section: item.section as DiagnosticsSection,
    componentId: item.componentId as string | null,
    visualization: item.visualization as DiagnosticsVisualization,
    inspectorOpen: item.inspectorOpen,
    topologyPath: [...(item.topologyPath as string[])],
    observationVersion: item.observationVersion as string | null,
    observationAt: item.observationAt as number | null
  });
}

/** Never accept a postMessage without an explicit trusted origin and source window. */
export function isTrustedPostMessage(
  event: { origin?: string; source?: unknown },
  { allowedOrigins, expectedSource }: { allowedOrigins: readonly string[]; expectedSource?: unknown }
): boolean {
  if (typeof event.origin !== 'string') return false;
  let trusted = false;
  for (const candidate of allowedOrigins) {
    try {
      if (new URL(candidate).origin === new URL(event.origin).origin) { trusted = true; break; }
    } catch { /* invalid configured origin is ignored */ }
  }
  if (!trusted) return false;
  if (expectedSource !== undefined && event.source !== expectedSource) return false;
  return true;
}

/** Reject self-echoes, older sequence numbers and older observation snapshots. */
export function shouldApplyState(
  current: DiagnosticsStateMessage | null,
  incoming: DiagnosticsStateMessage
): boolean {
  if (!current) return true;
  if (current.sourceId === incoming.sourceId) return false;
  if (incoming.sequence <= current.sequence) return false;
  if (current.observationAt !== null && incoming.observationAt !== null &&
      incoming.observationAt < current.observationAt) return false;
  return true;
}

export function isAuthorizedBodyId(bodyId: unknown): boolean {
  return typeof bodyId === 'string' && BODY.test(bodyId);
}

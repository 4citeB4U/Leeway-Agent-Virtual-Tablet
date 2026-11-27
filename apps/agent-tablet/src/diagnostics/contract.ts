/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.AGENT.TABLET.DIAGNOSTICS
TAG: LEEWAY.TABLET.HOST.DIAGNOSTICS.CONTRACT.V1
5WH:
WHAT = Define source-grounded host diagnostics returned to the existing Tablet page.
WHY = Keep observed measurements distinct from unavailable, unverified, or unsupported capabilities.
WHO = Tablet read-only host observer; Runtime Fabric and Device Bridge retain authorization and execution authority.
WHERE = apps/agent-tablet/src/diagnostics/contract.ts.
WHEN = 2026-11-26.
HOW = Normalize platform adapter observations, omit private hardware identifiers, and preserve explicit evidence status.
LICENSE = Repository terms.
*/

export type ObservationState = 'OBSERVED' | 'UNAVAILABLE';

export type DiagnosticsCategory =
  | 'processor'
  | 'memory'
  | 'graphics'
  | 'storage'
  | 'motherboard'
  | 'firmware'
  | 'battery'
  | 'network'
  | 'usb'
  | 'audio';

export interface DiagnosticsMetric {
  value: number | null;
  unit: '%' | 'bytes' | 'seconds' | '°C';
  state: ObservationState;
  source: string;
  reason: string | null;
}

export interface DiagnosticsComponent {
  id: string;
  category: DiagnosticsCategory;
  name: string;
  manufacturer: string | null;
  model: string | null;
  state: ObservationState;
  source: string;
  observedAt: string;
  details: Array<{ label: string; value: string | number }>;
}

export interface DiagnosticsSensor {
  id: string;
  label: string;
  value: number;
  unit: '°C';
  state: 'OBSERVED';
  source: string;
  observedAt: string;
}

export interface DiagnosticsSnapshot {
  schemaVersion: 1;
  state: 'OBSERVED' | 'PARTIAL' | 'UNAVAILABLE';
  observedAt: string;
  source: string;
  platform: {
    name: string;
    release: string;
    architecture: string;
  };
  device: {
    manufacturer: string | null;
    model: string | null;
    binding: 'HOST_PROCESS_ONLY';
    enrollment: 'UNVERIFIED';
  };
  metrics: {
    cpu: DiagnosticsMetric;
    memory: DiagnosticsMetric;
    disk: DiagnosticsMetric;
    temperature: DiagnosticsMetric;
    processRss: DiagnosticsMetric;
    processHeap: DiagnosticsMetric;
    uptime: DiagnosticsMetric;
  };
  telemetry: {
    cpu: number | null;
    cpuMeaning: 'UTILIZATION' | 'NORMALIZED_LOAD';
    ram: number | null;
    disk: number | null;
    temp: number | null;
    source: string;
  };
  components: DiagnosticsComponent[];
  sensors: DiagnosticsSensor[];
  capabilities: {
    matched3dModel: 'UNAVAILABLE';
    physicalComponentPlacement: 'UNVERIFIED';
    busTopology: 'UNAVAILABLE';
    gpuUtilization: 'UNAVAILABLE';
    gpuMemory: 'UNVERIFIED';
    durableHistory: 'UNBOUND';
    runtimeAgentEvidence: 'UNBOUND';
    independentVeritas: 'NOT_PROVIDED';
    receiptAuthority: 'NOT_PROVIDED';
    deviceBridgeEnrollment: 'UNVERIFIED';
  };
  errors: string[];
}

export interface DiagnosticsPlatform {
  name: string;
  release: string;
  architecture: string;
  source: string;
  observedAt: string;
  processRssBytes: number | null;
  processHeapUsedBytes: number | null;
  uptimeSeconds: number | null;
  cpuMeaning: 'UTILIZATION' | 'NORMALIZED_LOAD';
}

type RawRecord = Record<string, unknown>;

const record = (value: unknown): RawRecord =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as RawRecord
    : {};

const rows = (value: unknown): RawRecord[] => {
  if (Array.isArray(value)) return value.map(record).filter(row => Object.keys(row).length > 0);
  const single = record(value);
  return Object.keys(single).length > 0 ? [single] : [];
};

const text = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const cleaned = value.trim();
  return cleaned.length > 0 ? cleaned : null;
};

const numberValue = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') return null;
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const percentage = (value: unknown): number | null => {
  const parsed = numberValue(value);
  return parsed !== null && parsed >= 0 && parsed <= 100 ? parsed : null;
};

const makeMetric = (
  value: number | null,
  unit: DiagnosticsMetric['unit'],
  source: string,
  unavailableReason: string
): DiagnosticsMetric => ({
  value,
  unit,
  state: value === null ? 'UNAVAILABLE' : 'OBSERVED',
  source,
  reason: value === null ? unavailableReason : null
});

const detail = (label: string, value: string | number | null): { label: string; value: string | number } | null =>
  value === null ? null : { label, value };

function component(
  category: DiagnosticsCategory,
  row: RawRecord,
  source: string,
  observedAt: string,
  index: number,
  options: {
    name: string;
    manufacturer?: string;
    model?: string;
    details?: (row: RawRecord) => Array<{ label: string; value: string | number | null } | null>;
  }
): DiagnosticsComponent | null {
  const name = text(row[options.name]);
  const manufacturer = options.manufacturer ? text(row[options.manufacturer]) : null;
  const model = options.model ? text(row[options.model]) : null;
  if (!name && !manufacturer && !model) return null;
  return {
    id: `${category}-${index + 1}`,
    category,
    name: name || model || manufacturer || 'Observed component',
    manufacturer,
    model,
    state: 'OBSERVED',
    source,
    observedAt,
    details: (options.details?.(row) || []).filter((item): item is { label: string; value: string | number } => item !== null)
  };
}

function collectComponents(raw: RawRecord, source: string, observedAt: string): DiagnosticsComponent[] {
  const components: DiagnosticsComponent[] = [];
  const addRows = (
    field: string,
    category: DiagnosticsCategory,
    options: Parameters<typeof component>[5]
  ) => {
    rows(raw[field]).forEach((item, index) => {
      const observed = component(category, item, source, observedAt, index, options);
      if (observed) components.push(observed);
    });
  };

  addRows('processors', 'processor', {
    name: 'name',
    manufacturer: 'manufacturer',
    details: row => [
      detail('Physical cores reported', numberValue(row.physicalCores)),
      detail('Logical processors reported', numberValue(row.logicalProcessors)),
      detail('Maximum clock MHz', numberValue(row.maxClockMHz))
    ]
  });
  addRows('memoryModules', 'memory', {
    name: 'name',
    manufacturer: 'manufacturer',
    model: 'model',
    details: row => [
      detail('Capacity bytes', numberValue(row.capacityBytes)),
      detail('Reported speed MHz', numberValue(row.speedMHz))
    ]
  });
  addRows('graphicsAdapters', 'graphics', {
    name: 'name',
    manufacturer: 'manufacturer',
    model: 'model',
    details: row => [
      detail('OS-reported adapter memory bytes', numberValue(row.adapterMemoryBytes)),
      detail('Driver version reported', text(row.driverVersion))
    ]
  });
  addRows('physicalDisks', 'storage', {
    name: 'name',
    manufacturer: 'manufacturer',
    model: 'model',
    details: row => [
      detail('Capacity bytes', numberValue(row.capacityBytes)),
      detail('Interface reported', text(row.interface)),
      detail('OS-reported status', text(row.status))
    ]
  });

  const board = component('motherboard', record(raw.motherboard), source, observedAt, 0, {
    name: 'product',
    manufacturer: 'manufacturer',
    model: 'product'
  });
  if (board) components.push(board);

  const firmware = component('firmware', record(raw.firmware), source, observedAt, 0, {
    name: 'name',
    manufacturer: 'manufacturer',
    model: 'version'
  });
  if (firmware) components.push(firmware);

  addRows('batteries', 'battery', {
    name: 'name',
    manufacturer: 'manufacturer',
    model: 'model',
    details: row => [
      detail('Charge percent reported', percentage(row.chargePercent)),
      detail('Status reported', text(row.status)),
      detail('Chemistry reported', text(row.chemistry))
    ]
  });
  addRows('networkAdapters', 'network', {
    name: 'name',
    manufacturer: 'manufacturer',
    details: row => [detail('Physical adapter reported', text(row.physical))]
  });
  addRows('usbControllers', 'usb', { name: 'name', manufacturer: 'manufacturer' });
  addRows('audioDevices', 'audio', { name: 'name', manufacturer: 'manufacturer' });
  return components;
}

export function normalizeDiagnosticsSnapshot(rawValue: unknown, platform: DiagnosticsPlatform): DiagnosticsSnapshot {
  const raw = record(rawValue);
  const reportedTelemetry = record(raw.telemetry);
  const cpuValue = numberValue(reportedTelemetry.cpu);
  const cpu = platform.cpuMeaning === 'UTILIZATION'
    ? percentage(cpuValue)
    : cpuValue !== null && cpuValue >= 0 ? cpuValue : null;
  const memory = percentage(reportedTelemetry.ram);
  const disk = percentage(reportedTelemetry.disk);
  const sensors = rows(raw.thermalSensors)
    .map((sensor, index) => {
      const value = numberValue(sensor.celsius);
      if (value === null || value < -50 || value > 150) return null;
      return {
        id: `thermal-${index + 1}`,
        label: text(sensor.label) || `Thermal zone ${index + 1}`,
        value,
        unit: '°C' as const,
        state: 'OBSERVED' as const,
        source: platform.source,
        observedAt: platform.observedAt
      };
    })
    .filter((sensor): sensor is DiagnosticsSensor => sensor !== null);
  const components = collectComponents(raw, platform.source, platform.observedAt);
  const host = record(raw.host);
  const errors = Array.isArray(raw.providerErrors)
    ? raw.providerErrors.filter((item): item is string => typeof item === 'string' && /^[A-Z0-9_]{3,80}$/.test(item))
    : [];
  const hasObservation = cpu !== null || memory !== null || disk !== null || components.length > 0 || sensors.length > 0;
  const state: DiagnosticsSnapshot['state'] = !hasObservation
    ? 'UNAVAILABLE'
    : errors.length > 0 || cpu === null || memory === null || disk === null
      ? 'PARTIAL'
      : 'OBSERVED';
  const source = platform.source;

  return {
    schemaVersion: 1,
    state,
    observedAt: platform.observedAt,
    source,
    platform: {
      name: platform.name,
      release: platform.release,
      architecture: platform.architecture
    },
    device: {
      manufacturer: text(host.manufacturer),
      model: text(host.model),
      binding: 'HOST_PROCESS_ONLY',
      enrollment: 'UNVERIFIED'
    },
    metrics: {
      cpu: makeMetric(cpu, '%', source, 'Host CPU measurement is unavailable from this adapter.'),
      memory: makeMetric(memory, '%', source, 'Host memory measurement is unavailable from this adapter.'),
      disk: makeMetric(disk, '%', source, 'Host storage utilization is unavailable from this adapter.'),
      temperature: makeMetric(null, '°C', 'NO_DEVICE_PACKAGE_SENSOR', 'No supported package-level temperature measurement was returned.'),
      processRss: makeMetric(numberValue(platform.processRssBytes), 'bytes', 'TABLET_SERVER_PROCESS', 'Tablet process memory is unavailable.'),
      processHeap: makeMetric(numberValue(platform.processHeapUsedBytes), 'bytes', 'TABLET_SERVER_PROCESS', 'Tablet process heap is unavailable.'),
      uptime: makeMetric(numberValue(platform.uptimeSeconds), 'seconds', 'TABLET_SERVER_PROCESS', 'Tablet process uptime is unavailable.')
    },
    telemetry: {
      cpu,
      cpuMeaning: platform.cpuMeaning,
      ram: memory,
      disk,
      temp: null,
      source
    },
    components,
    sensors,
    capabilities: {
      matched3dModel: 'UNAVAILABLE',
      physicalComponentPlacement: 'UNVERIFIED',
      busTopology: 'UNAVAILABLE',
      gpuUtilization: 'UNAVAILABLE',
      gpuMemory: 'UNVERIFIED',
      durableHistory: 'UNBOUND',
      runtimeAgentEvidence: 'UNBOUND',
      independentVeritas: 'NOT_PROVIDED',
      receiptAuthority: 'NOT_PROVIDED',
      deviceBridgeEnrollment: 'UNVERIFIED'
    },
    errors
  };
}

export function isDiagnosticsSnapshot(value: unknown): value is DiagnosticsSnapshot {
  const snapshot = record(value);
  const metrics = record(snapshot.metrics);
  const platform = record(snapshot.platform);
  const device = record(snapshot.device);
  const telemetry = record(snapshot.telemetry);
  const capabilities = record(snapshot.capabilities);
  const finiteOrNull = (candidate: unknown): candidate is number | null =>
    candidate === null || (typeof candidate === 'number' && Number.isFinite(candidate));
  const validMetric = (candidate: unknown): boolean => {
    const item = record(candidate);
    return ['OBSERVED', 'UNAVAILABLE'].includes(String(item.state))
      && ['%', 'bytes', 'seconds', '°C'].includes(String(item.unit))
      && finiteOrNull(item.value)
      && typeof item.source === 'string'
      && (item.reason === null || typeof item.reason === 'string');
  };
  const validComponent = (candidate: unknown): boolean => {
    const item = record(candidate);
    return typeof item.id === 'string'
      && typeof item.name === 'string'
      && typeof item.observedAt === 'string'
      && typeof item.source === 'string'
      && ['processor', 'memory', 'graphics', 'storage', 'motherboard', 'firmware', 'battery', 'network', 'usb', 'audio']
        .includes(String(item.category))
      && item.state === 'OBSERVED'
      && (item.manufacturer === null || typeof item.manufacturer === 'string')
      && (item.model === null || typeof item.model === 'string')
      && Array.isArray(item.details)
      && item.details.every(detail => {
        const row = record(detail);
        return typeof row.label === 'string'
          && (typeof row.value === 'string' || (typeof row.value === 'number' && Number.isFinite(row.value)));
      });
  };
  const validSensor = (candidate: unknown): boolean => {
    const item = record(candidate);
    return typeof item.id === 'string'
      && typeof item.label === 'string'
      && typeof item.value === 'number'
      && Number.isFinite(item.value)
      && item.unit === '°C'
      && item.state === 'OBSERVED'
      && typeof item.source === 'string'
      && typeof item.observedAt === 'string';
  };
  return snapshot.schemaVersion === 1
    && ['OBSERVED', 'PARTIAL', 'UNAVAILABLE'].includes(String(snapshot.state))
    && typeof snapshot.observedAt === 'string'
    && typeof snapshot.source === 'string'
    && typeof platform.name === 'string'
    && typeof platform.release === 'string'
    && typeof platform.architecture === 'string'
    && (device.manufacturer === null || typeof device.manufacturer === 'string')
    && (device.model === null || typeof device.model === 'string')
    && device.binding === 'HOST_PROCESS_ONLY'
    && device.enrollment === 'UNVERIFIED'
    && Array.isArray(snapshot.components) && snapshot.components.every(validComponent)
    && Array.isArray(snapshot.sensors) && snapshot.sensors.every(validSensor)
    && ['UTILIZATION', 'NORMALIZED_LOAD'].includes(String(telemetry.cpuMeaning))
    && finiteOrNull(telemetry.cpu)
    && finiteOrNull(telemetry.ram)
    && finiteOrNull(telemetry.disk)
    && telemetry.temp === null
    && typeof telemetry.source === 'string'
    && ['cpu', 'memory', 'disk', 'temperature', 'processRss', 'processHeap', 'uptime']
      .every(key => validMetric(metrics[key]))
    && capabilities.matched3dModel === 'UNAVAILABLE'
    && capabilities.physicalComponentPlacement === 'UNVERIFIED'
    && capabilities.busTopology === 'UNAVAILABLE'
    && capabilities.gpuUtilization === 'UNAVAILABLE'
    && capabilities.gpuMemory === 'UNVERIFIED'
    && capabilities.durableHistory === 'UNBOUND'
    && capabilities.runtimeAgentEvidence === 'UNBOUND'
    && capabilities.independentVeritas === 'NOT_PROVIDED'
    && capabilities.receiptAuthority === 'NOT_PROVIDED'
    && capabilities.deviceBridgeEnrollment === 'UNVERIFIED'
    && Array.isArray(snapshot.errors) && snapshot.errors.every(error => typeof error === 'string');
}

export function isLoopbackDiagnosticsAddress(address: string | undefined): boolean {
  const normalized = String(address || '').replace(/^::ffff:/i, '').toLowerCase();
  return normalized === '127.0.0.1' || normalized === '::1';
}

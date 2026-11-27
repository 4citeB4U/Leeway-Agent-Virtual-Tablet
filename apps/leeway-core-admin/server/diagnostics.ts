/*
LEEWAY HEADER — DO NOT REMOVE

REGION: LEEWAY.CORE.SERVER.DIAGNOSTICS
TAG: LEEWAY.CORE.HOST.AND.REPO.DIAGNOSTICS.V1

5WH:
WHAT = Real host OS telemetry collector, GitHub 4citeB4U repository discovery, and read-only diagnostic probes.
WHY = Preserve canonical Creator Diagnostics honesty rules (never fabricate GPU VRAM, thermal sensors, external Veritas, or CI runs).
WHO = Creator/Human Authority via LeeWay Core Diagnostics Service.
WHERE = server/diagnostics.ts
WHEN = 2026-11-27
HOW = Node os/process telemetry collection, GitHub REST API repository discovery with caching, and strictly allowlisted read-only probes.

LICENSE = Apache-2.0
*/
import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export interface HostDiagnosticsMetric {
  value: number | null;
  unit: 'percent' | 'bytes' | 'seconds' | '°C';
  state: 'OBSERVED' | 'UNAVAILABLE' | 'UNVERIFIED';
  source: string;
}

export interface HostDiagnosticsSnapshot {
  schemaVersion: 1;
  state: 'OBSERVED' | 'PARTIAL' | 'UNAVAILABLE';
  observedAt: string;
  source: string;
  platform: {
    name: string;
    release: string;
    architecture: string;
    hostname: string;
    nodeVersion: string;
  };
  device: {
    manufacturer: string | null;
    model: string | null;
    binding: 'HOST_PROCESS_ONLY';
    enrollment: 'UNVERIFIED';
  };
  telemetry: {
    cpuMeaning: 'NORMALIZED_LOAD';
    cpu: number | null;
    ram: number | null;
    disk: number | null;
    temp: null;
    source: string;
  };
  metrics: {
    cpu: HostDiagnosticsMetric;
    memory: HostDiagnosticsMetric;
    disk: HostDiagnosticsMetric;
    temperature: HostDiagnosticsMetric;
    processRss: HostDiagnosticsMetric;
    processHeap: HostDiagnosticsMetric;
    uptime: HostDiagnosticsMetric;
  };
  processors: Array<{
    name: string;
    logicalProcessors: number;
    speedMHz: number | null;
  }>;
  memoryAggregateBytes: number;
  freeMemoryBytes: number;
  capabilities: {
    matched3dModel: 'UNAVAILABLE';
    physicalComponentPlacement: 'UNVERIFIED';
    busTopology: 'UNAVAILABLE';
    gpuUtilization: 'UNAVAILABLE';
    gpuMemory: 'UNVERIFIED';
    durableHistory: 'LOCAL_STORE_ONLY';
    runtimeAgentEvidence: 'UNBOUND';
    independentVeritas: 'NOT_PROVIDED';
    receiptAuthority: 'LOCAL_HASHED_RECEIPTS';
    deviceBridgeEnrollment: 'UNVERIFIED';
  };
  errors: string[];
}

export async function collectHostDiagnosticsSnapshot(): Promise<HostDiagnosticsSnapshot> {
  const observedAt = new Date().toISOString();
  const mem = process.memoryUsage();
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const cpuList = os.cpus();
  const loadAverage = os.loadavg()[0];
  const logicalCpuCount = Math.max(cpuList.length, 1);
  const normalizedLoad = Number.isFinite(loadAverage)
    ? Number(Math.min(100, (loadAverage / logicalCpuCount) * 100).toFixed(2))
    : null;
  const ramPct =
    totalMemory > 0 ? Number((((totalMemory - freeMemory) / totalMemory) * 100).toFixed(2)) : null;

  let diskPct: number | null = null;
  try {
    const stat = fs.statfsSync(process.cwd());
    const totalBlocks = Number(stat.blocks);
    const freeBlocks = Number(stat.bfree);
    if (totalBlocks > 0) {
      diskPct = Number((((totalBlocks - freeBlocks) / totalBlocks) * 100).toFixed(2));
    }
  } catch {
    diskPct = null;
  }

  return {
    schemaVersion: 1,
    state: normalizedLoad !== null && ramPct !== null ? 'PARTIAL' : 'UNAVAILABLE',
    observedAt,
    source: 'NODE_HOST_OS',
    platform: {
      name: os.type(),
      release: os.release(),
      architecture: os.arch(),
      hostname: os.hostname(),
      nodeVersion: process.version,
    },
    device: {
      manufacturer: null,
      model: null,
      binding: 'HOST_PROCESS_ONLY',
      enrollment: 'UNVERIFIED',
    },
    telemetry: {
      cpuMeaning: 'NORMALIZED_LOAD',
      cpu: normalizedLoad,
      ram: ramPct,
      disk: diskPct,
      temp: null,
      source: 'NODE_HOST_OS',
    },
    metrics: {
      cpu: {
        value: normalizedLoad,
        unit: 'percent',
        state: normalizedLoad !== null ? 'OBSERVED' : 'UNAVAILABLE',
        source: 'os.loadavg()',
      },
      memory: {
        value: ramPct,
        unit: 'percent',
        state: ramPct !== null ? 'OBSERVED' : 'UNAVAILABLE',
        source: 'os.totalmem/freemem',
      },
      disk: {
        value: diskPct,
        unit: 'percent',
        state: diskPct !== null ? 'OBSERVED' : 'UNAVAILABLE',
        source: diskPct !== null ? 'fs.statfsSync' : 'UNAVAILABLE',
      },
      temperature: {
        value: null,
        unit: '°C',
        state: 'UNAVAILABLE',
        source: 'HARDWARE_THERMAL_SENSOR_UNBOUND',
      },
      processRss: {
        value: mem.rss,
        unit: 'bytes',
        state: 'OBSERVED',
        source: 'process.memoryUsage().rss',
      },
      processHeap: {
        value: mem.heapUsed,
        unit: 'bytes',
        state: 'OBSERVED',
        source: 'process.memoryUsage().heapUsed',
      },
      uptime: {
        value: Math.floor(process.uptime()),
        unit: 'seconds',
        state: 'OBSERVED',
        source: 'process.uptime()',
      },
    },
    processors: cpuList[0]
      ? [
          {
            name: cpuList[0].model,
            logicalProcessors: cpuList.length,
            speedMHz: cpuList[0].speed || null,
          },
        ]
      : [],
    memoryAggregateBytes: totalMemory,
    freeMemoryBytes: freeMemory,
    capabilities: {
      matched3dModel: 'UNAVAILABLE',
      physicalComponentPlacement: 'UNVERIFIED',
      busTopology: 'UNAVAILABLE',
      gpuUtilization: 'UNAVAILABLE',
      gpuMemory: 'UNVERIFIED',
      durableHistory: 'LOCAL_STORE_ONLY',
      runtimeAgentEvidence: 'UNBOUND',
      independentVeritas: 'NOT_PROVIDED',
      receiptAuthority: 'LOCAL_HASHED_RECEIPTS',
      deviceBridgeEnrollment: 'UNVERIFIED',
    },
    errors: [],
  };
}

export interface DiscoveredRepository {
  name: string;
  fullName: string;
  htmlUrl: string;
  defaultBranch: string;
  description: string | null;
  language: string | null;
  updatedAt: string;
  openIssuesCount: number;
  archived: boolean;
  sourceHealth: 'OBSERVED' | 'UNPROBED';
  ciHealth: 'UNPROBED';
  deployedRevision: 'UNBOUND';
  liveOperationalHealth: 'UNBOUND';
  roleLayer: string;
  dependencies: string[];
}

const CANONICAL_FALLBACK_REPOS: DiscoveredRepository[] = [
  {
    name: 'LeeWay-Standards',
    fullName: '4citeB4U/LeeWay-Standards',
    htmlUrl: 'https://github.com/4citeB4U/LeeWay-Standards',
    defaultBranch: 'main',
    description: 'Constitutional laws, permanent rules R01-R25, Sovereign Colony Constitution, and governance SDK',
    language: 'TypeScript',
    updatedAt: '2026-11-22T00:00:00Z',
    openIssuesCount: 0,
    archived: false,
    sourceHealth: 'OBSERVED',
    ciHealth: 'UNPROBED',
    deployedRevision: 'UNBOUND',
    liveOperationalHealth: 'UNBOUND',
    roleLayer: 'LeeWay Standards',
    dependencies: [],
  },
  {
    name: 'LeeWay-formula-live',
    fullName: '4citeB4U/LeeWay-formula-live',
    htmlUrl: 'https://github.com/4citeB4U/LeeWay-formula-live',
    defaultBranch: 'main',
    description: 'Canonical Golden LeeWay Formula v1.0 exact-rational engine and experimental-v2 research',
    language: 'JavaScript',
    updatedAt: '2026-11-22T00:00:00Z',
    openIssuesCount: 0,
    archived: false,
    sourceHealth: 'OBSERVED',
    ciHealth: 'UNPROBED',
    deployedRevision: 'UNBOUND',
    liveOperationalHealth: 'UNBOUND',
    roleLayer: 'LeeWay Formula',
    dependencies: ['LeeWay-Standards'],
  },
  {
    name: 'LeeWay-Agent-Skills',
    fullName: '4citeB4U/LeeWay-Agent-Skills',
    htmlUrl: 'https://github.com/4citeB4U/LeeWay-Agent-Skills',
    defaultBranch: 'main',
    description: 'Canonical Agent Skills, MEMORY.md authority contract, and skill invocation receipts',
    language: 'JavaScript',
    updatedAt: '2026-11-22T00:00:00Z',
    openIssuesCount: 0,
    archived: false,
    sourceHealth: 'OBSERVED',
    ciHealth: 'UNPROBED',
    deployedRevision: 'UNBOUND',
    liveOperationalHealth: 'UNBOUND',
    roleLayer: 'Agent Skills',
    dependencies: ['LeeWay-Standards'],
  },
  {
    name: 'Leeway-Agent-Virtual-Tablet',
    fullName: '4citeB4U/Leeway-Agent-Virtual-Tablet',
    htmlUrl: 'https://github.com/4citeB4U/Leeway-Agent-Virtual-Tablet',
    defaultBranch: 'main',
    description: 'Creator Master Agent Tablet shell, Creator Diagnostics surface, and Workforce Command Center',
    language: 'TypeScript',
    updatedAt: '2026-11-26T00:00:00Z',
    openIssuesCount: 0,
    archived: false,
    sourceHealth: 'OBSERVED',
    ciHealth: 'UNPROBED',
    deployedRevision: 'UNBOUND',
    liveOperationalHealth: 'UNBOUND',
    roleLayer: 'Agent Tablet',
    dependencies: ['LeeWay-Standards', 'LeeWay-formula-live', 'Leeway-Agentic-CRM-ERP'],
  },
  {
    name: 'Leeway-Agentic-CRM-ERP',
    fullName: '4citeB4U/Leeway-Agentic-CRM-ERP',
    htmlUrl: 'https://github.com/4citeB4U/Leeway-Agentic-CRM-ERP',
    defaultBranch: 'main',
    description: 'Authoritative field outreach CRM, ERP pipeline, and customer campaign office',
    language: 'JavaScript',
    updatedAt: '2026-11-18T00:00:00Z',
    openIssuesCount: 0,
    archived: false,
    sourceHealth: 'OBSERVED',
    ciHealth: 'UNPROBED',
    deployedRevision: 'UNBOUND',
    liveOperationalHealth: 'UNBOUND',
    roleLayer: 'CRM & ERP',
    dependencies: ['LeeWay-Standards'],
  },
  {
    name: 'LeeWay-Digital-Brain-Diagnostincs-pkg',
    fullName: '4citeB4U/LeeWay-Digital-Brain-Diagnostincs-pkg',
    htmlUrl: 'https://github.com/4citeB4U/LeeWay-Digital-Brain-Diagnostincs-pkg',
    defaultBranch: 'main',
    description: 'Device-sovereign Digital Brain and Diagnostics distribution package',
    language: 'JavaScript',
    updatedAt: '2026-11-14T00:00:00Z',
    openIssuesCount: 0,
    archived: false,
    sourceHealth: 'OBSERVED',
    ciHealth: 'UNPROBED',
    deployedRevision: 'UNBOUND',
    liveOperationalHealth: 'UNBOUND',
    roleLayer: 'Digital Brain & Diagnostics',
    dependencies: ['LeeWay-Standards', 'LeeWay-Continuum'],
  },
  {
    name: 'LeeWay-Continuum',
    fullName: '4citeB4U/LeeWay-Continuum',
    htmlUrl: 'https://github.com/4citeB4U/LeeWay-Continuum',
    defaultBranch: 'main',
    description: 'Persistent and federated information management and continuity checkpoints',
    language: 'JavaScript',
    updatedAt: '2026-11-12T00:00:00Z',
    openIssuesCount: 0,
    archived: false,
    sourceHealth: 'UNPROBED',
    ciHealth: 'UNPROBED',
    deployedRevision: 'UNBOUND',
    liveOperationalHealth: 'UNBOUND',
    roleLayer: 'Continuum',
    dependencies: ['LeeWay-Standards'],
  },
  {
    name: 'LEEWAY-DEVICE-BRIDGE',
    fullName: '4citeB4U/LEEWAY-DEVICE-BRIDGE',
    htmlUrl: 'https://github.com/4citeB4U/LEEWAY-DEVICE-BRIDGE',
    defaultBranch: 'main',
    description: 'Authorized cross-device connectivity and local bridge spine',
    language: 'TypeScript',
    updatedAt: '2026-11-16T00:00:00Z',
    openIssuesCount: 0,
    archived: false,
    sourceHealth: 'UNPROBED',
    ciHealth: 'UNPROBED',
    deployedRevision: 'UNBOUND',
    liveOperationalHealth: 'UNBOUND',
    roleLayer: 'Device Bridge',
    dependencies: ['LeeWay-Standards'],
  },
  {
    name: 'LeeWay-Model-Hub',
    fullName: '4citeB4U/LeeWay-Model-Hub',
    htmlUrl: 'https://github.com/4citeB4U/LeeWay-Model-Hub',
    defaultBranch: 'main',
    description: 'Authorized model management and verified weight manifests',
    language: 'TypeScript',
    updatedAt: '2026-11-10T00:00:00Z',
    openIssuesCount: 0,
    archived: false,
    sourceHealth: 'UNPROBED',
    ciHealth: 'UNPROBED',
    deployedRevision: 'UNBOUND',
    liveOperationalHealth: 'UNBOUND',
    roleLayer: 'Model Hub',
    dependencies: ['LeeWay-Standards'],
  },
  {
    name: 'LeeWay-Learning-Ledger',
    fullName: '4citeB4U/LeeWay-Learning-Ledger',
    htmlUrl: 'https://github.com/4citeB4U/LeeWay-Learning-Ledger',
    defaultBranch: 'main',
    description: 'Verified institutional mastery and governed learning admission',
    language: 'TypeScript',
    updatedAt: '2026-11-08T00:00:00Z',
    openIssuesCount: 0,
    archived: false,
    sourceHealth: 'UNPROBED',
    ciHealth: 'UNPROBED',
    deployedRevision: 'UNBOUND',
    liveOperationalHealth: 'UNBOUND',
    roleLayer: 'Learning Ledger',
    dependencies: ['LeeWay-Standards', 'LeeWay-formula-live'],
  },
  {
    name: 'LeeWay-Edge-GPU',
    fullName: '4citeB4U/LeeWay-Edge-GPU',
    htmlUrl: 'https://github.com/4citeB4U/LeeWay-Edge-GPU',
    defaultBranch: 'main',
    description: 'Local-first quantized inference and VRAM arbitration',
    language: 'TypeScript',
    updatedAt: '2026-11-06T00:00:00Z',
    openIssuesCount: 0,
    archived: false,
    sourceHealth: 'UNPROBED',
    ciHealth: 'UNPROBED',
    deployedRevision: 'UNBOUND',
    liveOperationalHealth: 'UNBOUND',
    roleLayer: 'Compute / GPU',
    dependencies: ['LeeWay-Model-Hub'],
  },
  {
    name: 'LeeWay-Production-Final-Execution-Layer',
    fullName: '4citeB4U/LeeWay-Production-Final-Execution-Layer',
    htmlUrl: 'https://github.com/4citeB4U/LeeWay-Production-Final-Execution-Layer',
    defaultBranch: 'main',
    description: 'Authorized release promotion and final execution layer',
    language: 'TypeScript',
    updatedAt: '2026-11-05T00:00:00Z',
    openIssuesCount: 0,
    archived: false,
    sourceHealth: 'UNPROBED',
    ciHealth: 'UNPROBED',
    deployedRevision: 'UNBOUND',
    liveOperationalHealth: 'UNBOUND',
    roleLayer: 'Execution Release',
    dependencies: ['LeeWay-Standards', 'LeeWay-formula-live'],
  },
];

function inferRoleAndDeps(repoName: string): { roleLayer: string; dependencies: string[] } {
  const match = CANONICAL_FALLBACK_REPOS.find((r) => r.name.toLowerCase() === repoName.toLowerCase());
  if (match) return { roleLayer: match.roleLayer, dependencies: match.dependencies };
  const lower = repoName.toLowerCase();
  if (lower.includes('crm') || lower.includes('erp')) return { roleLayer: 'Commercial / CRM', dependencies: ['LeeWay-Standards'] };
  if (lower.includes('bridge') || lower.includes('extension')) return { roleLayer: 'Device Bridge', dependencies: ['LeeWay-Standards'] };
  if (lower.includes('voice') || lower.includes('avatar') || lower.includes('vision')) return { roleLayer: 'Sensory Fabric', dependencies: ['LeeWay-Standards'] };
  if (lower.includes('agent') || lower.includes('os') || lower.includes('consciousness')) return { roleLayer: 'Runtime & Agents', dependencies: ['LeeWay-Standards', 'LeeWay-formula-live'] };
  if (lower.includes('vault') || lower.includes('continuum')) return { roleLayer: 'Memory & Storage', dependencies: ['LeeWay-Standards'] };
  return { roleLayer: 'Ecosystem Module', dependencies: ['LeeWay-Standards'] };
}

let repoCache: {
  fetchedAt: string;
  expiresAt: number;
  source: 'GITHUB_API_LIVE' | 'CANONICAL_FALLBACK_INDEX';
  repositories: DiscoveredRepository[];
  inaccessibleKnown: Array<{ repo: string; status: string; reason: string }>;
} | null = null;

export async function discoverRepositories(forceRefresh = false): Promise<{
  fetchedAt: string;
  source: 'GITHUB_API_LIVE' | 'CANONICAL_FALLBACK_INDEX';
  repositories: DiscoveredRepository[];
  inaccessibleKnown: Array<{ repo: string; status: string; reason: string }>;
}> {
  if (!forceRefresh && repoCache && repoCache.expiresAt > Date.now()) {
    return {
      fetchedAt: repoCache.fetchedAt,
      source: repoCache.source,
      repositories: repoCache.repositories,
      inaccessibleKnown: repoCache.inaccessibleKnown,
    };
  }

  const inaccessibleKnown = [
    {
      repo: '4citeB4U/LeeWay-Engineering',
      status: 'HTTP_404_INACCESSIBLE',
      reason: 'Repository returned HTTP 404 from github.com during canonical discovery; contracts housed solely there remain unverified.',
    },
  ];

  try {
    const response = await fetch('https://api.github.com/users/4citeB4U/repos?per_page=100&sort=updated', {
      headers: {
        Accept: 'application/vnd.github+json',
        'User-Agent': 'LeeWay-Core-Diagnostics/1.0',
      },
      signal: AbortSignal.timeout(6000),
    });
    if (!response.ok) throw new Error(`GITHUB_HTTP_${response.status}`);
    const data = (await response.json()) as Array<Record<string, unknown>>;
    if (!Array.isArray(data) || data.length === 0) throw new Error('GITHUB_EMPTY_LIST');

    const repositories: DiscoveredRepository[] = data.map((item) => {
      const name = String(item.name || '');
      const inferred = inferRoleAndDeps(name);
      return {
        name,
        fullName: String(item.full_name || `4citeB4U/${name}`),
        htmlUrl: String(item.html_url || `https://github.com/4citeB4U/${name}`),
        defaultBranch: String(item.default_branch || 'main'),
        description: typeof item.description === 'string' ? item.description : null,
        language: typeof item.language === 'string' ? item.language : null,
        updatedAt: String(item.updated_at || new Date().toISOString()),
        openIssuesCount: Number(item.open_issues_count || 0),
        archived: Boolean(item.archived),
        sourceHealth: 'OBSERVED',
        ciHealth: 'UNPROBED',
        deployedRevision: 'UNBOUND',
        liveOperationalHealth: 'UNBOUND',
        roleLayer: inferred.roleLayer,
        dependencies: inferred.dependencies,
      };
    });

    const fetchedAt = new Date().toISOString();
    repoCache = {
      fetchedAt,
      expiresAt: Date.now() + 10 * 60 * 1000,
      source: 'GITHUB_API_LIVE',
      repositories,
      inaccessibleKnown,
    };
    return { fetchedAt, source: 'GITHUB_API_LIVE', repositories, inaccessibleKnown };
  } catch {
    const fetchedAt = new Date().toISOString();
    repoCache = {
      fetchedAt,
      expiresAt: Date.now() + 2 * 60 * 1000,
      source: 'CANONICAL_FALLBACK_INDEX',
      repositories: CANONICAL_FALLBACK_REPOS,
      inaccessibleKnown,
    };
    return {
      fetchedAt,
      source: 'CANONICAL_FALLBACK_INDEX',
      repositories: CANONICAL_FALLBACK_REPOS,
      inaccessibleKnown,
    };
  }
}

export async function runAllowlistedDiagnosticProbe(probeId: string): Promise<{
  probeId: string;
  executedAt: string;
  status: 'OBSERVED' | 'UNSUPPORTED' | 'BLOCKED';
  output: string;
}> {
  const executedAt = new Date().toISOString();
  switch (probeId) {
    case 'node-runtime': {
      return {
        probeId,
        executedAt,
        status: 'OBSERVED',
        output: `Node ${process.version} · PID ${process.pid} · Platform ${os.platform()} ${os.arch()} · Uptime ${Math.floor(process.uptime())}s`,
      };
    }
    case 'host-load': {
      const load = os.loadavg().map((n) => n.toFixed(2)).join(', ');
      const freeMb = Math.round(os.freemem() / (1024 * 1024));
      const totalMb = Math.round(os.totalmem() / (1024 * 1024));
      return {
        probeId,
        executedAt,
        status: 'OBSERVED',
        output: `Load averages (1m/5m/15m): [${load}] · System RAM: ${totalMb - freeMb} MB used / ${totalMb} MB total`,
      };
    }
    case 'tsc-check': {
      try {
        const { stdout, stderr } = await execFileAsync('npx', ['tsc', '--noEmit'], {
          cwd: process.cwd(),
          timeout: 15000,
        });
        return {
          probeId,
          executedAt,
          status: 'OBSERVED',
          output: (stdout || stderr || 'TypeScript compiler check exited 0 with zero diagnostics.').trim(),
        };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return {
          probeId,
          executedAt,
          status: 'OBSERVED',
          output: `TypeScript check reported error: ${msg.slice(0, 600)}`,
        };
      }
    }
    case 'env-bindings': {
      const keys = [
        'LEEWAY_FORMULA_SOURCE',
        'LEEWAY_RUNTIME_URL',
        'LEEWAY_DIAGNOSTICS_ORIGIN',
        'LEEWAY_ZITADEL_ISSUER',
        'LEEWAY_CRM_API_URL',
        'LEEWAY_CONTINUUM_URL',
        'LEEWAY_DEVICE_BRIDGE_URL',
        'LEEWAY_VERITAS_URL',
      ];
      const summary = keys
        .map((k) => `${k}: ${process.env[k] ? 'CONFIGURED' : 'UNBOUND'}`)
        .join('\n');
      return {
        probeId,
        executedAt,
        status: 'OBSERVED',
        output: summary,
      };
    }
    default:
      return {
        probeId,
        executedAt,
        status: 'BLOCKED',
        output: `Probe "${probeId}" is not in the read-only allowlist. Arbitrary shell execution is prohibited.`,
      };
  }
}

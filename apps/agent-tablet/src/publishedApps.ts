import type { WorkstationAppId } from './types';
import { resolvePublishedAppSurface, tabletSurfaceUrl, type PublishedAppSurfaceDecision } from './mobileSurfacePolicy.mjs';

export type PublishedLeeWayAppId = Extract<WorkstationAppId,
  | 'agentSkills'
  | 'creatorControl'
  | 'continuum'
  | 'leewayIde'
  | 'officeSuite'
  | 'logistics'
  | 'contentFoundry'
  | 'erpCrm'
  | 'agentVision'
  | 'voiceFabric'
  | 'employmentCenter'
  | 'contentVault'
  | 'workforce'
  | 'notepad'
  | 'diagnostics'
  | 'agentRoster'
  | 'digitalBrain'
>;

export type PublishedLeeWayApp = {
  id: PublishedLeeWayAppId;
  title: string;
  shortTitle: string;
  description: string;
  url: string;
  capabilityRef: string;
  accent: string;
  iconImage: string;
  gradient: string;
};

// Office is the reference implementation for the LeeWay shared-session
// protocol. The native Agent VT starts this owner-local Office host; the
// public static Office deployment remains a separate, not-yet-session-aware
// release until this source is deployed there.
const OWNER_LOCAL_OFFICE_URL = 'http://127.0.0.1:3221/';

export const PUBLISHED_LEEWAY_APPS: readonly PublishedLeeWayApp[] = [
  {
    id: 'employmentCenter',
    title: 'LeeWay Digital Employment Center',
    shortTitle: 'Employment',
    description: 'Canonical employee, agent onboarding, identity, assignment, and governed workforce UI.',
    url: 'https://4citeb4u.github.io/LeeWay-Digital-Workforce/',
    capabilityRef: 'leeway.digital-employment-center',
    accent: 'border-orange-700 bg-orange-950/20',
    iconImage: '/app-icons/employment-center.png',
    gradient: 'from-amber-200 via-orange-500 to-rose-950'
  },
  {
    id: 'continuum',
    title: 'LeeWay Continuum',
    shortTitle: 'Continuum',
    description: 'Canonical honeycomb memory, storage, retrieval, and owner-scoped information UI.',
    url: 'https://4citeb4u.github.io/LeeWay-Continuum/',
    capabilityRef: 'leeway.continuum',
    accent: 'border-amber-700 bg-amber-950/20',
    iconImage: '/app-icons/continuum.png',
    gradient: 'from-amber-300 via-orange-700 to-black'
  },
  {
    id: 'agentSkills',
    title: 'LeeWay Agent Skills',
    shortTitle: 'Agent Skills',
    description: 'Canonical Grapevine 3D registry and governed skill pipeline UI.',
    url: 'http://127.0.0.1:3217/agent-skills-vine/',
    capabilityRef: 'leeway.agent-skills',
    accent: 'border-lime-700 bg-lime-950/20',
    iconImage: '/app-icons/agent-skills.png',
    gradient: 'from-lime-300 via-emerald-500 to-slate-950'
  },
  {
    id: 'creatorControl',
    title: 'LeeWay Core - Creator Enterprise Administrative Control Center',
    shortTitle: 'Creator Control',
    description: 'Creator enterprise administrative control center for the LeeWay ecosystem.',
    url: 'http://127.0.0.1:3217/leeway-core-admin/',
    capabilityRef: 'leeway.creator-administrative-control',
    accent: 'border-amber-700 bg-amber-950/20',
    iconImage: '/app-icons/diagnostics-motherboard.png',
    gradient: 'from-amber-300 via-orange-700 to-slate-950'
  },
  {
    id: 'leewayIde',
    title: 'LeeWay IDE',
    shortTitle: 'IDE',
    description: 'Canonical orchestration canvas, node workspace, terminal planner, and development UI.',
    url: 'https://4citeb4u.github.io/leeway-ide/',
    capabilityRef: 'leeway.ide',
    accent: 'border-cyan-700 bg-cyan-950/20',
    iconImage: '/app-icons/ide.jpg',
    gradient: 'from-cyan-300 via-sky-600 to-indigo-950'
  },
  {
    id: 'officeSuite',
    title: 'LeeWay Office Suites',
    shortTitle: 'Office Suites',
    description: 'Canonical AGPU document, spreadsheet, presentation, research, and review workstation.',
    url: OWNER_LOCAL_OFFICE_URL,
    capabilityRef: 'leeway.office',
    accent: 'border-blue-700 bg-blue-950/20',
    iconImage: '/app-icons/Gemini_Generated_Image_y6aytty6aytty6ay.jpg',
    gradient: 'from-blue-300 via-indigo-600 to-slate-950'
  },
  {
    id: 'logistics',
    title: 'LeeWay Logistics',
    shortTitle: 'Logistics',
    description: 'Canonical Cesium transit world, globe, fleet, CCTV, map, and tactical logistics UI.',
    url: 'https://4citeb4u.github.io/leeway_logistics/#v=2&lat=35.1557&lon=-82.5000&alt=15460975&heading=360&pitch=-90&roll=0&style=normal&bloom=0&sharpen=1&bi=0&bv=2&si=49&hud=tactical&hv=1&dm=DENSE&dd=75&da=elastic&kf=7&ko=1&cr=0&sc=1&scf=11&map=osm&l=&lo=f.e.1_k.o.n&ui=c.c.1_c.p.0_l.c.1_l.p.0_d.c.1_v.c.1_i.c.0_r.c.1_s.c.1_g.c.1_p.c.1_m.c.0',
    capabilityRef: 'leeway.logistics',
    accent: 'border-sky-700 bg-sky-950/20',
    iconImage: '/app-icons/logistics.png',
    gradient: 'from-sky-300 via-blue-700 to-slate-950'
  },
  {
    id: 'contentFoundry',
    title: 'LeeWay Agentic Content Foundry',
    shortTitle: 'Content',
    description: 'Canonical Beast AI creation canvas, transformation clusters, and publishing workflow UI.',
    url: 'https://4citeb4u.github.io/Leeway-agentic-content-foundry/',
    capabilityRef: 'leeway.content-foundry',
    accent: 'border-fuchsia-700 bg-fuchsia-950/20',
    iconImage: '/app-icons/content-foundry.jpg',
    gradient: 'from-fuchsia-300 via-violet-700 to-slate-950'
  },
  {
    id: 'erpCrm',
    title: 'LeeWay Agentic CRM & ERP',
    shortTitle: 'CRM & ERP',
    description: 'Canonical sovereign commercial, manufacturing, fulfillment, device, and governance UI.',
    url: 'http://127.0.0.1:3217/crm/',
    capabilityRef: 'leeway.erp-crm',
    accent: 'border-indigo-700 bg-indigo-950/20',
    iconImage: '/app-icons/crm-erp.png',
    gradient: 'from-violet-300 via-indigo-700 to-slate-950'
  },
  {
    id: 'agentVision',
    title: 'Agent Lee Vision',
    shortTitle: 'Vision',
    description: 'Canonical optical command pad and organic Wi-Fi camera vision shell.',
    url: 'https://4citeb4u.github.io/Leeway-Agent-Lee-Vision/',
    capabilityRef: 'leeway.vision-fabric',
    accent: 'border-emerald-700 bg-emerald-950/20',
    iconImage: '/app-icons/agent-vision.png',
    gradient: 'from-emerald-300 via-teal-700 to-slate-950'
  },
  {
    id: 'voiceFabric',
    title: 'LeeWay Voice Fabric',
    shortTitle: 'Voice Fabric',
    description: 'Canonical voice library, spatial audio studio, 3D engine, and governed runtime controls.',
    url: 'https://4citeb4u.github.io/LeeWay-Voice-Fabric/',
    capabilityRef: 'leeway.voice-fabric',
    accent: 'border-violet-700 bg-violet-950/20',
    iconImage: '/app-icons/voice-fabric.png',
    gradient: 'from-violet-300 via-purple-700 to-slate-950'
  },
  {
    id: 'contentVault',
    title: 'LeeWay Content Vault',
    shortTitle: 'Content Vault',
    description: 'Canonical sovereign asset store, handoff lake, and verified evidence vault.',
    url: 'http://127.0.0.1:3217/?view=contentVault&leewaySurface=widget',
    capabilityRef: 'leeway.content-vault',
    accent: 'border-amber-700 bg-amber-950/20',
    iconImage: '/app-icons/content-vault.jpg',
    gradient: 'from-amber-200 via-fuchsia-600 to-indigo-950'
  },
  {
    id: 'workforce',
    title: 'LeeWay Workforce Center',
    shortTitle: 'Workforce Center',
    description: 'Canonical employee, agent dispatch, assignment, and governed workforce UI.',
    url: 'http://127.0.0.1:3217/?view=workforce&leewaySurface=widget',
    capabilityRef: 'leeway.workforce',
    accent: 'border-orange-700 bg-orange-950/20',
    iconImage: '/app-icons/workforce.svg',
    gradient: 'from-amber-300 via-orange-500 to-rose-950'
  },
  {
    id: 'notepad',
    title: 'LeeWay Blackboard',
    shortTitle: 'Blackboard',
    description: 'Canonical shared scratchpad, evidence blackboard, and collaborative canvas.',
    url: 'http://127.0.0.1:3217/?view=notepad&leewaySurface=widget',
    capabilityRef: 'leeway.blackboard',
    accent: 'border-fuchsia-700 bg-fuchsia-950/20',
    iconImage: '/app-icons/blackboard.jpg',
    gradient: 'from-fuchsia-300 via-violet-600 to-indigo-950'
  },
  {
    id: 'diagnostics',
    title: 'LeeWay Diagnostics',
    shortTitle: 'Diagnostics',
    description: 'Canonical device health, compute diagnostics, and telemetry console.',
    url: 'http://127.0.0.1:3218/?view=diagnostics&leewaySurface=widget',
    capabilityRef: 'leeway.diagnostics',
    accent: 'border-rose-700 bg-rose-950/20',
    iconImage: '/app-icons/diagnostics-motherboard.png',
    gradient: 'from-rose-300 via-red-600 to-zinc-950'
  },
  {
    id: 'agentRoster',
    title: 'Agent Lee Roster',
    shortTitle: 'Agent Roster',
    description: 'Canonical Agent Lee providers, identity, voice studio, and active fleet.',
    url: 'http://127.0.0.1:3217/?view=agentRoster&leewaySurface=widget',
    capabilityRef: 'leeway.agent-roster',
    accent: 'border-cyan-700 bg-cyan-950/20',
    iconImage: '/app-icons/agent-roster.png',
    gradient: 'from-cyan-300 via-teal-500 to-blue-950'
  },
  {
    id: 'digitalBrain',
    title: 'LeeWay Digital Brain',
    shortTitle: 'Digital Brain',
    description: 'Existing local Digital Brain universe and device-owned file-navigation experience.',
    url: 'http://127.0.0.1:3217/brain-ui/brain.html',
    capabilityRef: 'leeway.digital-brain',
    accent: 'border-blue-700 bg-blue-950/20',
    iconImage: '/app-icons/digital-brain.png',
    gradient: 'from-blue-200 via-cyan-600 to-indigo-950'
  }
] as const;

export const LOCAL_ADAPTER_CANDIDATE_APPS = Object.freeze(['officeSuite', 'contentVault', 'workforce', 'notepad', 'diagnostics', 'agentRoster', 'digitalBrain']);

export const PUBLISHED_LEEWAY_APP_BY_ID = Object.fromEntries(
  PUBLISHED_LEEWAY_APPS.map(app => [app.id, app])
) as Record<PublishedLeeWayAppId, PublishedLeeWayApp>;

/**
 * A surface is a presentation of one LeeWay application session, not a second
 * application identity.  The native widget host uses the same query contract
 * when it opens the external surface.  Individual applications must consume
 * `leewaySession` with their real state adapter (document/voice/media/etc.);
 * the tablet never attempts to copy DOM events or pixels between surfaces.
 */
export function publishedAppSurfaceUrl(
  app: PublishedLeeWayApp,
  surface: 'tablet' | 'widget',
  compact = false,
  decision?: PublishedAppSurfaceDecision,
): string | null {
  return resolvePublishedAppSurface(app, surface, compact, decision).url;
}

export function isPublishedLeeWayAppId(value: WorkstationAppId): value is PublishedLeeWayAppId {
  return Object.prototype.hasOwnProperty.call(PUBLISHED_LEEWAY_APP_BY_ID, value);
}

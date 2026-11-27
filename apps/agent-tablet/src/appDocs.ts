/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.TABLET.DOCS
TAG: LEEWAY.TABLET.APP_README_BINDING.V1
WHAT: Map every tablet application to its canonical GitHub repository README for the About instruction manual.
WHY: Users need the real project documentation, not tablet-authored summaries.
WHO: LeeWay Industries / creator-authorized outside contributor (LW-OPENCODE).
WHERE: apps/agent-tablet/src/appDocs.ts
WHEN: 2026-11-27
HOW: GitHub raw HTTPS README reads; no write authority, credentials or repository mutation.
AUTHORITY: DOCUMENTATION_READ_ONLY. No entitlement, Veritas or production claim.
LICENSE: Existing repository terms.
*/
import type { WorkstationAppId } from './types';

export type AppDocBinding = {
  repo: string;
  title: string;
  purpose: string;
  scope: string;
  agentLeeTasks: string[];
  screenshots: Array<{ url: string; caption: string }>;
};

const rawReadme = (repo: string, branch = 'main') =>
  `https://raw.githubusercontent.com/4citeB4U/${repo}/${branch}/README.md`;

export const APP_DOC_BINDINGS: Partial<Record<WorkstationAppId, AppDocBinding>> = {
  desktop: {
    repo: 'Leeway-Agent-Virtual-Tablet', title: 'LeeWay Agent Virtual Tablet',
    purpose: 'The governed master workstation: one tablet surface, one coin launcher and native LeeWay floating widgets.',
    scope: 'Local tablet UI, taskbar, desktop shortcuts, app surfaces and native widget mirror. Not an authorization or deployment authority.',
    agentLeeTasks: ['Open an application', 'Pin or unpin a taskbar item', 'Run UPDATE from GitHub main', 'Inspect connected capabilities'],
    screenshots: [{ url: 'https://raw.githubusercontent.com/4citeB4U/Leeway-Agent-Virtual-Tablet/main/docs/screenshots/tablet-home.png', caption: 'Tablet home: desktop shortcuts, taskbar and header controls.' }]
  },
  settings: {
    repo: 'Leeway-Agent-Virtual-Tablet', title: 'Settings & System Documentation',
    purpose: 'Explain system operations, user permissions, capabilities and Employment Center setup.',
    scope: 'Read-only documentation surface; displays truthful capability state from the local carrier.',
    agentLeeTasks: ['Explain a capability', 'Open a settings guide', 'Check current system state'],
    screenshots: []
  },
  employmentCenter: {
    repo: 'LeeWay-Digital-Workforce', title: 'LeeWay Digital Employment Center',
    purpose: 'Employee and digital-worker onboarding, identity, assignments and governed work execution.',
    scope: 'Workforce records and work orders under Runtime and Receipt authority; not a self-employment activation.',
    agentLeeTasks: ['Onboard an authorized employee', 'Create a work order', 'Inspect assignment state', 'Bind a role to an agent'],
    screenshots: []
  },
  continuum: {
    repo: 'LeeWay-Continuum', title: 'LeeWay Continuum',
    purpose: 'Durable owner-authorized storage and retained records for the ecosystem.',
    scope: 'Persistence authority only with per-request owner admission; no automatic write.',
    agentLeeTasks: ['Retrieve an authorized record', 'Inspect storage state', 'Explain retention policy'],
    screenshots: []
  },
  agentSkills: {
    repo: 'LeeWay-Agent-Skills', title: 'LeeWay Agent Skills — Grapevine',
    purpose: 'Canonical SKILL.md registry and governed capability vine.',
    scope: 'Descriptors and selection signals; presence does not prove execution.',
    agentLeeTasks: ['Select an authorized skill', 'Explain a skill', 'Show active skills'],
    screenshots: []
  },
  leewayIde: {
    repo: 'leeway-ide', title: 'LeeWay IDE',
    purpose: 'Agent development workspace for LeeWay source and governed execution.',
    scope: 'Local source editing and runtime-bound tooling; no deployment authority.',
    agentLeeTasks: ['Open a source file', 'Run a bounded qualification', 'Explain a repository'],
    screenshots: []
  },
  officeSuite: {
    repo: 'Leeway-office-suites', title: 'LeeWay Office Suites',
    purpose: 'Owner-local document, spreadsheet and presentation workspace.',
    scope: 'Local office applications under the owner session; external publishing requires separate approval.',
    agentLeeTasks: ['Create a document', 'Summarize a spreadsheet', 'Prepare a presentation'],
    screenshots: []
  },
  logistics: {
    repo: 'leeway_logistics', title: 'LeeWay Logistics',
    purpose: 'Spatial logistics and transit-world application with map grounding.',
    scope: 'Training/demo fallback is not live location; Device Bridge location evidence is required.',
    agentLeeTasks: ['Inspect a route', 'Explain nearby context', 'Open a map layer'],
    screenshots: []
  },
  contentFoundry: {
    repo: 'Leeway-agentic-content-foundry', title: 'LeeWay Agentic Content Foundry',
    purpose: 'Governed content creation and media production surface.',
    scope: 'Content drafting and production under owner approval; provider execution is separately admitted.',
    agentLeeTasks: ['Draft a campaign', 'Create a content plan', 'Inspect production state'],
    screenshots: []
  },
  erpCrm: {
    repo: 'LeeWay-Agentic-CRM-ERP', title: 'LeeWay Agentic CRM & ERP',
    purpose: 'Sovereign commercial, manufacturing, fulfillment, device and governance operations.',
    scope: 'Local CRM/ERP records; customer access requires current LeeWay account authorization.',
    agentLeeTasks: ['Inspect a customer record', 'Prepare a business report', 'Review an operational pipeline'],
    screenshots: []
  },
  agentVision: {
    repo: 'Leeway-Agent-Lee-Vision', title: 'LeeWay Agent Lee Vision',
    purpose: 'Visual perception and spatial observation surface.',
    scope: 'Camera/screen observation only with device permission; no inference claim without an admitted provider.',
    agentLeeTasks: ['Describe a visible scene', 'Open a camera view', 'Explain a visual state'],
    screenshots: []
  },
  voiceFabric: {
    repo: 'LeeWay-Voice-Fabric', title: 'LeeWay Voice Fabric',
    purpose: 'Governed speech selection, synthesis and delivery for Agent Lee.',
    scope: 'Voice selection belongs to LeeWay Voice Fabric; carrier readiness is not a persona clone claim.',
    agentLeeTasks: ['Speak a response', 'List available voices', 'Explain voice binding'],
    screenshots: []
  },
  contentVault: {
    repo: 'Leeway-Content-Vault', title: 'LeeWay Content Vault',
    purpose: 'Owner-controlled content retention and retrieval.',
    scope: 'Durable storage through Continuum only; no automatic write.',
    agentLeeTasks: ['Store an authorized artifact', 'Retrieve a record', 'Explain retention'],
    screenshots: []
  },
  workforce: {
    repo: 'LeeWay-Digital-Workforce', title: 'LeeWay Workforce',
    purpose: 'Agent and employee operational status, missions and work-plane evidence.',
    scope: 'Read-only status unless Runtime admits a work order.',
    agentLeeTasks: ['Inspect worker status', 'Explain a mission', 'Open a work order'],
    screenshots: []
  },
  notepad: {
    repo: 'Leeway-Agent-Workstation-Open-Notebook', title: 'LeeWay Blackboard / Open Notebook',
    purpose: 'Grounded notes, assignments and agent communication.',
    scope: 'Local notebook state; no Workboard write API is assumed.',
    agentLeeTasks: ['Draft a note', 'Create an assignment', 'Summarize a thread'],
    screenshots: []
  },
  diagnostics: {
    repo: 'LEEWAY-DEVICE-BRIDGE', title: 'LeeWay Diagnostics',
    purpose: 'Device, runtime and capability diagnostics for the physical host.',
    scope: 'Observes reported state; physical hardware claims require independent evidence.',
    agentLeeTasks: ['Inspect device state', 'Explain a failed gate', 'List connected providers'],
    screenshots: []
  },
  agentRoster: {
    repo: 'LeeWay-Digital-Workforce', title: 'LeeWay Agent Roster',
    purpose: 'Registered agents, providers, instances and missions.',
    scope: 'Registry view; badges do not grant permissions.',
    agentLeeTasks: ['Find an agent', 'Explain a role', 'Inspect a provider'],
    screenshots: []
  },
  digitalBrain: {
    repo: 'Leeway-Digital-Brain-Diagnostincs-pkg', title: 'LeeWay Digital Brain',
    purpose: 'Machine-consciousness body/brain surface for the physical host.',
    scope: 'Belongs to its physical host; portable elsewhere only as documentation.',
    agentLeeTasks: ['Inspect brain state', 'Explain a body binding', 'Review a capability'],
    screenshots: []
  },
  modelHub: {
    repo: 'LeeWay-Model-Hub', title: 'LeeWay Model Hub',
    purpose: 'Model catalog, provider intake and governed inference routing.',
    scope: 'Listing is not inference; weights require owner admission and materialization.',
    agentLeeTasks: ['List a model', 'Explain an inference route', 'Check resident assets'],
    screenshots: []
  }
};

export function docUrl(binding: AppDocBinding, branch = 'main') {
  return rawReadme(binding.repo, branch);
}

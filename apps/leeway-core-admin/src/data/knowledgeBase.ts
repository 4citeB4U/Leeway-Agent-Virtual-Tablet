/*
LEEWAY HEADER — DO NOT REMOVE

REGION: LEEWAY.CORE.KNOWLEDGE.BASE
TAG: LEEWAY.CORE.EMBEDDED.CANON.KB.V1

5WH:
WHAT = Versioned Embedded LeeWay Knowledge Base preserving exact canonical sources, commit SHAs, and accessibility status.
WHY = Prevent architectural drift and document exact canonical contracts, Formula v1 spec, Laws, Rules R01-R25, and missing repo limitations.
WHO = Creator/Human Authority via Leeway Innovations.
WHERE = src/data/knowledgeBase.ts
WHEN = 2026-11-27
HOW = Structured immutable TypeScript dataset derived from cloned 4citeB4U repositories.

LICENSE = Apache-2.0
*/

export interface CanonicalSourceRecord {
  repository: string;
  commitSha: string | null;
  status: 'VERIFIED_CLONED' | 'INACCESSIBLE_404';
  documentsRead: string[];
  note: string;
}

export interface KnowledgeArticle {
  id: string;
  category: 'LAW_&_GOVERNANCE' | 'FORMULA_MATHEMATICS' | 'ARCHITECTURE' | 'CRM_&_WORKFORCE' | 'LIMITATIONS';
  title: string;
  sourceRef: string;
  version: string;
  summary: string;
  clauses: string[];
}

export const KNOWLEDGE_BASE_VERSION = '2026.11.27-canon-v1';

export const CANONICAL_SOURCE_REVISIONS: CanonicalSourceRecord[] = [
  {
    repository: '4citeB4U/LeeWay-Standards',
    commitSha: 'e6f6b66c5c0a132fb607f643abe420c2af341174',
    status: 'VERIFIED_CLONED',
    documentsRead: [
      'Docs/governance/LEEWAY-CANONICAL-ENGINEERING-LAWS.md',
      'standards/PERMANENT-ENGINEERING-RULES.md',
      'contracts/LEEWAY-SOVEREIGN-COLONY-CONSTITUTION.v1.json',
      'AGENTS.md',
      '.leeway/registry.json',
    ],
    note: 'Constitutional laws, permanent rules R01-R25, Sovereign Colony Constitution v1, and canonical 5WH header standards.',
  },
  {
    repository: '4citeB4U/LeeWay-Agent-Skills',
    commitSha: '66a08688c6ccb3a932d6860198b02954adecbc64',
    status: 'VERIFIED_CLONED',
    documentsRead: ['MEMORY.md', 'AGENTS.md'],
    note: 'Canonical LeeWay Memory Authority Contract v1.0.0 and Agent Skills onboarding requirements.',
  },
  {
    repository: '4citeB4U/LeeWay-formula-live',
    commitSha: 'd261796f2698258922952d868b6f226030d64391',
    status: 'VERIFIED_CLONED',
    documentsRead: [
      'runtime/kernel-integrity.json',
      'runtime/server.mjs',
      'runtime/canonical/leeway-formula/v1/leeway-formula-v1.mjs',
      'runtime/canonical/leeway-formula/v1/formula-service.mjs',
      'runtime/canonical/leeway-formula/v1/rational.mjs',
      'runtime/canonical/standards/formulas/LEEWAY-FORMULA-v1.0.md',
    ],
    note: 'Frozen Golden LEEWAY-FORMULA-v1.0 engine and SHA-256 kernel integrity manifest.',
  },
  {
    repository: '4citeB4U/Leeway-Agent-Virtual-Tablet',
    commitSha: '8947bc30e9666df46743dd780cccbe8882133fc3',
    status: 'VERIFIED_CLONED',
    documentsRead: [
      'apps/agent-tablet/server.ts',
      'apps/agent-tablet/src/components/OriginalDiagnosticsMatrix.tsx',
      'apps/agent-tablet/src/components/DiagnosticsBoard.tsx',
      'apps/agent-tablet/src/components/CoreServiceDock.tsx',
      'apps/agent-tablet/src/components/AgentVTWorkforceCommandCenter.tsx',
      'apps/agent-tablet/src/components/creatorBusinessReadModel.ts',
      'apps/agent-tablet/src/diagnostics/contract.ts',
      'apps/agent-tablet/src/diagnostics/surface.ts',
      'apps/agent-tablet/src/diagnostics/sync.ts',
    ],
    note: 'Master Agent Tablet shell contracts, Diagnostics 8-section architecture, W00-W17 Workforce model, and canonical LeeWay logo assets.',
  },
  {
    repository: '4citeB4U/Leeway-Agentic-CRM-ERP',
    commitSha: 'b940c46c07dbc956fd7c884b1d764263aff2bcdf',
    status: 'VERIFIED_CLONED',
    documentsRead: ['docs/erp-crm-integration.md', 'data/leeway-crm-campaign-starter-data.json'],
    note: 'Authoritative CRM-ERP coexistence contract and Milwaukee starter campaign fixtures.',
  },
  {
    repository: '4citeB4U/LeeWay-Digital-Brain-Diagnostincs-pkg',
    commitSha: 'aed6a78c72272dc600dccb8da4e2fb3542b88c99',
    status: 'VERIFIED_CLONED',
    documentsRead: ['README.md'],
    note: 'Device-sovereign boundary separating Diagnostics, Digital Brain, and Continuum.',
  },
  {
    repository: '4citeB4U/LeeWay-Engineering',
    commitSha: null,
    status: 'INACCESSIBLE_404',
    documentsRead: [],
    note: 'Repository returned HTTP 404 during canonical discovery. Any contracts housed solely in LeeWay-Engineering (e.g., External Support Assistant Operating Contract) are documented as unverified/inaccessible.',
  },
];

export const KNOWLEDGE_ARTICLES: KnowledgeArticle[] = [
  {
    id: 'kb-hierarchy',
    category: 'LAW_&_GOVERNANCE',
    title: 'LeeWay 12-Tier Architectural Authority Hierarchy',
    sourceRef: '4citeB4U/LeeWay-Agent-Skills/MEMORY.md',
    version: '1.0.0',
    summary: 'Strict sovereign precedence from Creator Authority down to Learning Ledger.',
    clauses: [
      '1. Creator/Human Authority (Leonard J. Lee) > 2. LeeWay Standards > 3. Root of Trust > 4. Runtime Fabric > 5. Agent Lee > 6. Harness > 7. Formula > 8. Authorized models/skills/MCPs > 9. Authorized execution > 10. Independent Veritas > 11. Receipt Authority > 12. Learning Ledger.',
      'Approval of a decision never equals execution; execution never equals independent Veritas verification.',
      'Ordinary users and external customers never receive Creator privileges or access to competing control planes.',
    ],
  },
  {
    id: 'kb-cycle',
    category: 'LAW_&_GOVERNANCE',
    title: 'Uniform 12-Stage Engineering Cycle & Path-Agnostic Gate',
    sourceRef: '4citeB4U/LeeWay-Standards/Docs/governance/LEEWAY-CANONICAL-ENGINEERING-LAWS.md',
    version: '2026-11-12',
    summary: 'Every substantive mission, repair, and worker flow obeys all 12 stages with fail-closed checkpoints.',
    clauses: [
      'Sequence: INVESTIGATE → DIAGNOSE → PLAN → IMPLEMENT → TEST → VALIDATE → REPAIR → RETEST → VERIFY → EVIDENCE → CHECKPOINT → CONTINUE.',
      'Corrections amend active missions without erasing prior verified stage evidence or resetting mission state.',
      'Path-Agnostic Gate (R10/R25): Source identity and execution must never depend on hardcoded developer workstation drives (C:/, E:/).',
    ],
  },
  {
    id: 'kb-formula-v1',
    category: 'FORMULA_MATHEMATICS',
    title: 'Frozen Golden LEEWAY-FORMULA-v1.0 Specification',
    sourceRef: '4citeB4U/LeeWay-formula-live/runtime/canonical/standards/formulas/LEEWAY-FORMULA-v1.0.md',
    version: '1.0.0 (FROZEN_VERIFIED)',
    summary: 'Exact BigInt rational arithmetic across candidate universe Ω={0..69} and 16×6 observation matrix.',
    clauses: [
      '10 Canonical Features Φ_t(x) = [F, G, R, P, v, a, D, H, C, φ] with equal weight w_k = 1/10 and min-max normalization Norm_Ω.',
      'Golden Matrix (96 cells, ΣX=2908, μ=727/24) must yield exact Decimal=[4, 50, 63, 59, 48, 69] and RFC4648 Base64=[E, y, /, 7, w, BF].',
      'Tie-break rule permanently: S↓ → F↓ → R↓ → P↓ → x↑. Failure triggers LEEWAY_FORMULA_V1_BLOCKED.',
      'Experimental v2 math (G41, G42, G43, G44) remains isolated in R&D and never overwrites Golden v1.0.',
    ],
  },
  {
    id: 'kb-diagnostics-boundary',
    category: 'ARCHITECTURE',
    title: 'Creator Diagnostics 8-Section & Truthful Telemetry Boundary',
    sourceRef: '4citeB4U/Leeway-Agent-Virtual-Tablet/apps/agent-tablet/src/diagnostics/contract.ts',
    version: 'v25',
    summary: 'Preserves DIAG, BOARD, AGENTS, BUS, VERITAS, PROBES, SHELL, SETUP with strict non-fabrication rules.',
    clauses: [
      'Distinguish Source Health, CI Health, Deployed Revision, and Live Operational Health.',
      'Unbound hardware sensors (GPU VRAM, thermal sensors, physical placement, external Veritas) must explicitly render UNAVAILABLE / UNVERIFIED / NOT_PROVIDED.',
      'Digital Brain and Diagnostics remain device-sovereign; LeeWay Core never exposes private customer files or camera streams.',
    ],
  },
  {
    id: 'kb-crm-workforce',
    category: 'CRM_&_WORKFORCE',
    title: 'CRM-ERP Synchronization & Workforce Categories A–E',
    sourceRef: '4citeB4U/Leeway-Agentic-CRM-ERP/docs/erp-crm-integration.md & Sovereign Colony Constitution',
    version: '1.0.0',
    summary: 'Unified canonical customer identity and 5-tier digital workforce governance.',
    clauses: [
      'CRM remains the Creator business office; LeeWay Core provides executive oversight without duplicating CRM workflows.',
      'Workforce A–E separates LeeWay Internal (W00–W17), LeeWay Contracted, Customer Private Internal Agents, Customer External Candidates, and Externally Deployed Contracted Employees.',
      'Every external employment candidate requires Creator + Contracting Authority + Veritas qualification before deployment.',
    ],
  },
  {
    id: 'kb-missing-repo',
    category: 'LIMITATIONS',
    title: 'Compliance Disclosure: Inaccessible External Services & 4citeB4U/LeeWay-Engineering',
    sourceRef: 'Runtime Discovery & GitHub Verification Log (2026-11-27)',
    version: '1.0.0',
    summary: 'Explicit record of unavailable remote systems and inaccessible documentation.',
    clauses: [
      '4citeB4U/LeeWay-Engineering returned HTTP 404 during canonical fetch; contracts exclusive to that repository could not be reviewed.',
      'External Zitadel OIDC, live Device Bridge hosts, Continuum remote servers, GPU VRAM probes, and independent Veritas daemons are UNBOUND in this sandbox.',
      'All actions performed in LeeWay Core persist to the local atomic state store with SHA-256 receipts, clearly marked distinct from external production execution.',
    ],
  },
];

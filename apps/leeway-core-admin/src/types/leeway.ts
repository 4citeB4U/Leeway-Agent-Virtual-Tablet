/*
LEEWAY HEADER — DO NOT REMOVE

REGION: LEEWAY.CORE.FRONTEND.TYPES
TAG: LEEWAY.CORE.CANONICAL.TYPES.V1

5WH:
WHAT = Canonical TypeScript types for all 10 LeeWay Core sections, Formula lifecycle, Diagnostics, Workforce A-E, Customers 360, Missions, and Governance.
WHY = Maintain strict type alignment between Express backend contracts and React interactive UI components.
WHO = Creator/Human Authority via Leeway Innovations.
WHERE = src/types/leeway.ts
WHEN = 2026-11-27
HOW = Shared TypeScript interfaces mirroring server/store.ts, server/diagnostics.ts, and server/formulaAdapters.ts.

LICENSE = Apache-2.0
*/

export type PrimarySectionId =
  | 'executive-operations'
  | 'organization-workforce'
  | 'creator-diagnostics'
  | 'business-intelligence'
  | 'product-user-management'
  | 'infrastructure-control'
  | 'mission-command'
  | 'governance-authority'
  | 'research-development'
  | 'executive-decisions';

export const TWELVE_ENGINEERING_STAGES = [
  'INVESTIGATE',
  'DIAGNOSE',
  'PLAN',
  'IMPLEMENT',
  'TEST',
  'VALIDATE',
  'REPAIR',
  'RETEST',
  'VERIFY',
  'EVIDENCE',
  'CHECKPOINT',
  'CONTINUE',
] as const;

export type EngineeringStage = (typeof TWELVE_ENGINEERING_STAGES)[number];

export const FORMULA_LIFECYCLE_STAGES = [
  'REGISTERED',
  'BOUND',
  'CONTACTED',
  'EVALUATED',
  'CONSUMED',
  'EXECUTED',
  'MEASURED',
  'VERIFIED',
  'RETAINED',
] as const;

export type FormulaLifecycleStage = (typeof FORMULA_LIFECYCLE_STAGES)[number];

export type WorkforceCategory =
  | 'A_LEEWAY_INTERNAL'
  | 'B_LEEWAY_CONTRACTED'
  | 'C_CUSTOMER_INTERNAL_AGENT'
  | 'D_CUSTOMER_EXTERNAL_CANDIDATE'
  | 'E_EXTERNALLY_DEPLOYED_CONTRACTED';

export interface CustomerRecord {
  id: string;
  contactRef: string;
  accountRef: string;
  displayName: string;
  legalName: string;
  accountType: 'PERSONAL' | 'COMPANY';
  edition: 'PERSONAL' | 'INDUSTRIAL';
  verifiedEmail: string;
  representatives: string[];
  accountStatus: 'REGISTERED' | 'ACTIVE' | 'SUSPENDED' | 'CLOSED' | 'PENDING_ADMISSION';
  onboardingStatus: 'COMPLETED' | 'IN_PROGRESS' | 'REVIEW_REQUIRED';
  registeredAt: string;
  subscriptionTier: string;
  monthlyRevenueUsd: number;
  billingStatus: 'CURRENT' | 'PAST_DUE' | 'TRIAL' | 'EXEMPT';
  renewalDate: string;
  retentionRisk: 'LOW' | 'MODERATE' | 'HIGH';
  productsPurchased: string[];
  productsEnabled: string[];
  authorizedDeviceCount: number;
  bridgeEnrollment: 'ENROLLED' | 'PENDING' | 'REVOKED' | 'NO_DEVICE' | 'NOT_PROBED';
  verifiedExtensionCount: number;
  extensionFleetStatus: 'CURRENT' | 'UPDATE_REQUIRED' | 'PENDING' | 'REVOKED' | 'NO_EXTENSION' | 'NOT_PROBED';
  lastVerifiedDeviceAt: string | null;
  permittedEmployeeHeadcount: number;
  contractedEmployeeIds: string[];
  internalAgentCount: number | null;
  storageUsedGb: number;
  storageQuotaGb: number;
  computeHoursUsed: number;
  computeQuotaHours: number;
  openIncidentIds: string[];
  crmSegment: string;
  crmOffer: string;
  crmStage: string;
  marketingAllowed: boolean;
  privateContentAccess: false;
  extensionDeviceCommands: false;
  provenance: 'CRM_STARTER_FIXTURE' | 'CORE_ADMIN_STORE';
  permissions: Record<string, boolean>;
  restrictions: string[];
  permissionHistory: Array<{ timestamp: string; action: string; actor: string }>;
}

export interface WorkforceMember {
  id: string;
  workerCode: string;
  name: string;
  citizenId: string;
  genesisSeedHash: string;
  caste: 'CASTE_COORDINATOR' | 'CASTE_SOLDIER' | 'CASTE_BUILDER' | 'CASTE_SCOUT';
  homeNodeId: string;
  tabletId: string;
  category: WorkforceCategory;
  originatingOrg: string;
  creatingAccount: string;
  employingOrg: string;
  contractingAuthority: string;
  contractId: string | null;
  contractStart: string | null;
  contractExpiry: string | null;
  position: string;
  department: string;
  supervisor: string;
  assignedCustomerIds: string[];
  authorizedSkills: string[];
  assignedModels: string[];
  approvedCapabilities: string[];
  currentAssignments: string[];
  operationalStatus: 'ACTIVE' | 'CHECKPOINTED' | 'PAUSED' | 'SUSPENDED' | 'REVOKED' | 'PENDING_APPROVAL';
  workloadPct: number;
  cpuUnitsConsumed: number;
  memoryMbConsumed: number;
  measuredTaskSuccessPct: number | null;
  restrictions: string[];
  veritasQualification: 'QUALIFIED' | 'PENDING' | 'UNVERIFIED' | 'REVOKED';
  receiptIds: string[];
  contractHistory: Array<{ date: string; event: string; authority: string }>;
  permissionHistory: Array<{ date: string; change: string; actor: string }>;
  provenance: 'CANONICAL_W00_W17_PROJECTION' | 'ECOSYSTEM_CONTRACT_FIXTURE';
}

export interface MissionRecord {
  id: string;
  title: string;
  department: string;
  stage: EngineeringStage;
  ownerWorkerId: string;
  assignedWorkerIds: string[];
  dependencies: string[];
  blockedReason: string | null;
  executiveAuthorizationRequired: boolean;
  authorizationStatus: 'AUTHORIZED' | 'PENDING_CREATOR' | 'BLOCKED';
  stageEvidence: Partial<Record<EngineeringStage, { verifiedAt: string; receiptId: string; summary: string }>>;
  createdAt: string;
  updatedAt: string;
  correctionNotes: string[];
}

export interface CommercialRecord {
  id: string;
  title: string;
  productId: string;
  targetSegment: string;
  channel: string;
  offerText: string;
  mediaPreviewType: 'PRODUCT_GRAPHIC' | 'VIDEO_STORYBOARD' | 'INTERACTIVE_OFFER';
  mediaAssetPath: string;
  claimVerificationStatus: 'VERIFIED_CAPABILITY' | 'REQUIRES_EVIDENCE_REVIEW';
  approvalStatus: 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'REVISION_REQUESTED' | 'PAUSED' | 'WITHDRAWN';
  distributionStatus: 'NOT_DISTRIBUTED' | 'SCHEDULED' | 'DISTRIBUTING' | 'PAUSED' | 'WITHDRAWN';
  scheduledFor: string | null;
  eligibleCustomerCount: number;
  observedReach: number | null;
  observedConversions: number | null;
  provenance: 'CRM_CAMPAIGN_FIXTURE' | 'CORE_COMMERCIAL_STORE';
  revisionNote: string | null;
}

export interface SupportIncident {
  id: string;
  customerId: string;
  customerName: string;
  severity: 'HEALTHY' | 'WARNING' | 'CRITICAL';
  workflowStep:
    | 'OBSERVE'
    | 'DETECT'
    | 'EVALUATE'
    | 'DIAGNOSE'
    | 'RECOMMEND'
    | 'AUTHORIZE'
    | 'DISPATCH'
    | 'EXECUTE'
    | 'VERIFY'
    | 'RETAIN_EVIDENCE';
  issueCategory: 'LATENCY' | 'STORAGE_PRESSURE' | 'SYNC_DRIFT' | 'UPDATE_FAILURE' | 'RESOURCE_SATURATION';
  summary: string;
  observedSignal: string;
  predictedRisk: string;
  recommendedAction: string;
  preservesCustomerData: true;
  assignedSupportWorkerId: string | null;
  formulaEvaluationId: string | null;
  detectedAt: string;
  updatedAt: string;
}

export interface ExecutiveDecision {
  id: string;
  category:
    | 'Customers'
    | 'Permissions'
    | 'Digital Employment'
    | 'Contracts'
    | 'Commercials'
    | 'Products'
    | 'Releases'
    | 'Infrastructure'
    | 'Support'
    | 'Research'
    | 'Engineering'
    | 'Financial Commitments';
  title: string;
  requestingIdentity: string;
  purpose: string;
  affectedParties: string[];
  restrictions: string[];
  alternatives: Array<{ label: string; riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'; estimatedCostUsd: number }>;
  riskSummary: string;
  evidenceRefs: string[];
  formulaSummary: string;
  agentLeeRecommendation: string;
  decisionStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'DEFERRED' | 'CHANGES_REQUESTED';
  executionStatus: 'NOT_EXECUTED' | 'EXECUTED_LOCAL_STORE' | 'EXTERNAL_RUNTIME_UNBOUND';
  veritasStatus: 'NOT_VERIFIED' | 'UNBOUND_EXTERNAL_VERITAS';
  createdAt: string;
  decidedAt: string | null;
  decisionNote: string | null;
}

export interface GovernedProposal {
  id: string;
  proposalType: 'WORKFORCE_REASSIGNMENT' | 'MISSION_STAGE_ADVANCE' | 'CUSTOMER_ADMIN_CHANGE' | 'EXTERNAL_EMPLOYMENT';
  summary: string;
  targetId: string;
  requestedChange: Record<string, unknown>;
  status: 'PROPOSED' | 'AUTHORIZED' | 'CANCELLED';
  createdAt: string;
  resolvedAt: string | null;
  receiptId: string;
}

export interface FormulaEvaluationLog {
  id: string;
  domainId: string;
  domainName: string;
  adapterId: string;
  lifecycleStage: FormulaLifecycleStage;
  decimalState: number[];
  base64State: string[];
  inputHash: string;
  resultHash: string;
  receiptPath: string;
  inputSummary: string;
  baselineMetric: number;
  evaluatedMetric: number;
  outcomePolarity: 'FAVORABLE' | 'UNFAVORABLE' | 'NEUTRAL_UNVERIFIED';
  outcomeNote: string;
  evaluatedAt: string;
}

export interface DomainAdapterContract {
  domainId: string;
  domainName: string;
  canonicalAdapterId: 'runtime-state-v1' | 'raw-base64-v1';
  inputContract: string;
  inputProvenance: string;
  canonicalOperation: string;
  outputContract: string;
  operationalConsumer: string;
  authorizationBoundary: string;
  errorHandling: string;
  executionEvidence: string;
  measurementRequirements: string;
  verificationRequirements: string;
}

export interface ReceiptEntry {
  receiptId: string;
  timestamp: string;
  actionType: string;
  actor: string;
  targetId: string;
  summary: string;
  sha256: string;
  veritasState: 'NOT_VERIFIED_EXTERNALLY';
}

export interface WorkspacePanelConfig {
  id: string;
  title: string;
  span: 1 | 2 | 3;
  collapsed: boolean;
  pinned: boolean;
  hidden: boolean;
}

export interface WorkspaceView {
  id: string;
  name: string;
  sectionId: string;
  panels: WorkspacePanelConfig[];
  savedAt: string;
}

export interface CoreState {
  version: string;
  updatedAt: string;
  customers: CustomerRecord[];
  workforce: WorkforceMember[];
  missions: MissionRecord[];
  commercials: CommercialRecord[];
  supportCases: SupportIncident[];
  decisions: ExecutiveDecision[];
  proposals: GovernedProposal[];
  formulaEvaluations: FormulaEvaluationLog[];
  receipts: ReceiptEntry[];
  workspaceViews: WorkspaceView[];
  products: Array<{
    id: string;
    name: string;
    tier: string;
    activeSubscribers: number;
    monthlyPriceUsd: number;
    latestVersion: string;
    updateChannel: 'STABLE' | 'CANARY';
    adoptionPct: number;
  }>;
  rdProjects: Array<{
    id: string;
    title: string;
    track: 'CANONICAL_BASELINE' | 'EXPERIMENTAL_V2';
    sourcePath: string;
    status: 'FROZEN_VERIFIED' | 'EXPERIMENTAL_UNQUALIFIED' | 'REGRESSION_OBSERVED';
    baselineMetricLabel: string;
    baselineValue: number;
    experimentalValue: number;
    deltaLabel: string;
    notes: string;
  }>;
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
  metrics: Record<
    'cpu' | 'memory' | 'disk' | 'temperature' | 'processRss' | 'processHeap' | 'uptime',
    { value: number | null; unit: string; state: 'OBSERVED' | 'UNAVAILABLE' | 'UNVERIFIED'; source: string }
  >;
  processors: Array<{ name: string; logicalProcessors: number; speedMHz: number | null }>;
  memoryAggregateBytes: number;
  freeMemoryBytes: number;
  capabilities: Record<string, string>;
  errors: string[];
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

export interface FormulaHealthResponse {
  status: string;
  formula?: string;
  loaded?: boolean;
  goldenVectorPass?: boolean;
  specValid?: boolean;
  adapterRegistryPass?: boolean;
  expectedDecimal?: number[];
  expectedBase64?: string[];
  specHash?: string;
  specMdHash?: string;
  integrity?: {
    verified: boolean;
    checkedAt: string;
    sourceDir: string;
    filesChecked: Array<{ file: string; expectedHash: string; actualHash: string; match: boolean }>;
    error: string | null;
  };
  domainAdapters?: DomainAdapterContract[];
}

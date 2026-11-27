/*
LEEWAY HEADER — DO NOT REMOVE

REGION: LEEWAY.CORE.SERVER.STORE
TAG: LEEWAY.CORE.ATOMIC.STATE.STORE.V1

5WH:
WHAT = Atomic-write persistent state store for LeeWay Core customers, workforce A-E, missions, commercials, support, governance, R&D, executive decisions, and receipts.
WHY = Provide functional, stateful Creator administration with provenance separation between local fixture state and unbound external services.
WHO = Creator/Human Authority via LeeWay Core Operational Store.
WHERE = server/store.ts
WHEN = 2026-11-27
HOW = Atomic .tmp -> SHA-256 -> rename persistence in data/core-state.json seeded from canonical CRM-ERP, Workforce, and Standards schemas.

LICENSE = Apache-2.0
*/
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

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
  lifecycleStage:
    | 'REGISTERED'
    | 'BOUND'
    | 'CONTACTED'
    | 'EVALUATED'
    | 'CONSUMED'
    | 'EXECUTED'
    | 'MEASURED'
    | 'VERIFIED'
    | 'RETAINED';
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

const DATA_DIR = path.resolve(process.cwd(), 'data');
const STATE_FILE = path.join(DATA_DIR, 'core-state.json');

function sha256(input: unknown): string {
  return crypto.createHash('sha256').update(JSON.stringify(input), 'utf8').digest('hex');
}

function createInitialState(): CoreState {
  const now = new Date().toISOString();
  const initialCustomers: CustomerRecord[] = [
    {
      id: 'cust-ballers-club',
      contactRef: 'cnt:milwaukee:ballers-club',
      accountRef: 'acct:ind:ballers-club-go',
      displayName: 'Ballers Club Barbershop GO',
      legalName: 'Ballers Club Barbershop LLC',
      accountType: 'COMPANY',
      edition: 'INDUSTRIAL',
      verifiedEmail: 'operations@ballersclub.example',
      representatives: ['Owner / Managing Barber'],
      accountStatus: 'ACTIVE',
      onboardingStatus: 'COMPLETED',
      registeredAt: '2026-07-01T14:00:00Z',
      subscriptionTier: 'Local Business AI Tune-Up',
      monthlyRevenueUsd: 250,
      billingStatus: 'CURRENT',
      renewalDate: '2027-07-01',
      retentionRisk: 'LOW',
      productsPurchased: ['Agent Tablet', 'LeeWay CRM', 'Digital Brain'],
      productsEnabled: ['Agent Tablet', 'LeeWay CRM'],
      authorizedDeviceCount: 2,
      bridgeEnrollment: 'ENROLLED',
      verifiedExtensionCount: 2,
      extensionFleetStatus: 'CURRENT',
      lastVerifiedDeviceAt: '2026-11-26T18:10:00Z',
      permittedEmployeeHeadcount: 3,
      contractedEmployeeIds: ['emp-w14-field'],
      internalAgentCount: 1,
      storageUsedGb: 18.4,
      storageQuotaGb: 100,
      computeHoursUsed: 42,
      computeQuotaHours: 200,
      openIncidentIds: [],
      crmSegment: 'Barbershops · Milwaukee Corridor',
      crmOffer: 'Local Business AI Tune-Up - $250',
      crmStage: 'Visited',
      marketingAllowed: true,
      privateContentAccess: false,
      extensionDeviceCommands: false,
      provenance: 'CRM_STARTER_FIXTURE',
      permissions: { digitalEmployment: true, continuumSync: true, commercialUpdates: true },
      restrictions: ['No external worker deployment without Creator contract approval'],
      permissionHistory: [{ timestamp: '2026-07-01T14:05:00Z', action: 'GRANTED_INDUSTRIAL_STARTER', actor: 'Creator' }],
    },
    {
      id: 'cust-near-west-side',
      contactRef: 'cnt:milwaukee:near-west-corridor',
      accountRef: 'acct:ind:near-west-corridor',
      displayName: 'Near West Side Business Corridor',
      legalName: 'Near West Side Partners Corridor',
      accountType: 'COMPANY',
      edition: 'INDUSTRIAL',
      verifiedEmail: 'corridor@nearwestside.example',
      representatives: ['Corridor Program Director'],
      accountStatus: 'ACTIVE',
      onboardingStatus: 'IN_PROGRESS',
      registeredAt: '2026-07-01T15:30:00Z',
      subscriptionTier: 'Enterprise Corridor Partnership',
      monthlyRevenueUsd: 2500,
      billingStatus: 'CURRENT',
      renewalDate: '2027-01-15',
      retentionRisk: 'MODERATE',
      productsPurchased: ['Agent Tablet', 'LeeWay CRM', 'Content Vault', 'Workforce Pack'],
      productsEnabled: ['Agent Tablet', 'LeeWay CRM', 'Content Vault'],
      authorizedDeviceCount: 6,
      bridgeEnrollment: 'ENROLLED',
      verifiedExtensionCount: 5,
      extensionFleetStatus: 'UPDATE_REQUIRED',
      lastVerifiedDeviceAt: '2026-11-25T11:45:00Z',
      permittedEmployeeHeadcount: 8,
      contractedEmployeeIds: ['emp-w14-field', 'emp-ext-corridor'],
      internalAgentCount: 4,
      storageUsedGb: 142.0,
      storageQuotaGb: 250,
      computeHoursUsed: 184,
      computeQuotaHours: 300,
      openIncidentIds: ['sup-inc-01'],
      crmSegment: 'Workforce / Business Corridor',
      crmOffer: 'Custom Course / Partnership - $2,500',
      crmStage: 'Visited',
      marketingAllowed: true,
      privateContentAccess: false,
      extensionDeviceCommands: false,
      provenance: 'CRM_STARTER_FIXTURE',
      permissions: { digitalEmployment: true, continuumSync: true, commercialUpdates: true },
      restrictions: ['Scoped strictly to corridor administrative tenant'],
      permissionHistory: [{ timestamp: '2026-07-01T15:35:00Z', action: 'GRANTED_CORRIDOR_PARTNERSHIP', actor: 'Creator' }],
    },
    {
      id: 'cust-monumental-church',
      contactRef: 'cnt:milwaukee:monumental-baptist',
      accountRef: 'acct:ind:monumental-church',
      displayName: 'Monumental Missionary Baptist Church',
      legalName: 'Monumental Missionary Baptist Church Inc.',
      accountType: 'COMPANY',
      edition: 'INDUSTRIAL',
      verifiedEmail: 'office@monumental.example',
      representatives: ['Church Administrator', 'Office Manager'],
      accountStatus: 'REGISTERED',
      onboardingStatus: 'REVIEW_REQUIRED',
      registeredAt: '2026-09-12T10:00:00Z',
      subscriptionTier: 'Church Admin & Communications Audit',
      monthlyRevenueUsd: 497,
      billingStatus: 'TRIAL',
      renewalDate: '2026-12-12',
      retentionRisk: 'MODERATE',
      productsPurchased: ['LeeWay CRM', 'Digital Brain'],
      productsEnabled: ['LeeWay CRM'],
      authorizedDeviceCount: 1,
      bridgeEnrollment: 'PENDING',
      verifiedExtensionCount: 1,
      extensionFleetStatus: 'PENDING',
      lastVerifiedDeviceAt: null,
      permittedEmployeeHeadcount: 2,
      contractedEmployeeIds: [],
      internalAgentCount: 0,
      storageUsedGb: 4.2,
      storageQuotaGb: 50,
      computeHoursUsed: 9,
      computeQuotaHours: 100,
      openIncidentIds: ['sup-inc-02'],
      crmSegment: 'Churches with Offices',
      crmOffer: 'Church Admin & Communications Audit - $497',
      crmStage: 'Identified',
      marketingAllowed: true,
      privateContentAccess: false,
      extensionDeviceCommands: false,
      provenance: 'CRM_STARTER_FIXTURE',
      permissions: { digitalEmployment: false, continuumSync: false, commercialUpdates: true },
      restrictions: ['Pending onboarding bridge verification'],
      permissionHistory: [{ timestamp: '2026-09-12T10:00:00Z', action: 'REGISTERED_PROVISIONAL', actor: 'CRM Sync' }],
    },
    {
      id: 'cust-print-n-press',
      contactRef: 'cnt:milwaukee:print-n-press',
      accountRef: 'acct:ind:print-n-press',
      displayName: 'Print-n-Press Production',
      legalName: 'Print-n-Press Milwaukee LLC',
      accountType: 'COMPANY',
      edition: 'INDUSTRIAL',
      verifiedEmail: 'quotes@printnpress.example',
      representatives: ['Production Manager'],
      accountStatus: 'ACTIVE',
      onboardingStatus: 'COMPLETED',
      registeredAt: '2026-08-04T09:20:00Z',
      subscriptionTier: 'Quote & Workflow Suite',
      monthlyRevenueUsd: 497,
      billingStatus: 'CURRENT',
      renewalDate: '2027-08-04',
      retentionRisk: 'LOW',
      productsPurchased: ['Agent Tablet', 'LeeWay CRM', 'Diagnostics'],
      productsEnabled: ['Agent Tablet', 'LeeWay CRM', 'Diagnostics'],
      authorizedDeviceCount: 3,
      bridgeEnrollment: 'ENROLLED',
      verifiedExtensionCount: 3,
      extensionFleetStatus: 'CURRENT',
      lastVerifiedDeviceAt: '2026-11-26T20:15:00Z',
      permittedEmployeeHeadcount: 4,
      contractedEmployeeIds: ['emp-w14-field'],
      internalAgentCount: 2,
      storageUsedGb: 68.5,
      storageQuotaGb: 100,
      computeHoursUsed: 88,
      computeQuotaHours: 150,
      openIncidentIds: [],
      crmSegment: 'Print Shops',
      crmOffer: 'Quote & Workflow Audit - $497',
      crmStage: 'Active Account',
      marketingAllowed: true,
      privateContentAccess: false,
      extensionDeviceCommands: false,
      provenance: 'CRM_STARTER_FIXTURE',
      permissions: { digitalEmployment: true, continuumSync: true, commercialUpdates: true },
      restrictions: ['Standard industrial tenant boundaries'],
      permissionHistory: [{ timestamp: '2026-08-04T09:25:00Z', action: 'ACTIVATED_INDUSTRIAL', actor: 'Creator' }],
    },
    {
      id: 'cust-personal-marcus',
      contactRef: 'cnt:personal:marcus-vance',
      accountRef: 'acct:pers:marcus-vance',
      displayName: 'Marcus Vance',
      legalName: 'Marcus Vance',
      accountType: 'PERSONAL',
      edition: 'PERSONAL',
      verifiedEmail: 'marcus.vance@personal.example',
      representatives: [],
      accountStatus: 'ACTIVE',
      onboardingStatus: 'COMPLETED',
      registeredAt: '2026-10-10T16:40:00Z',
      subscriptionTier: 'Personal Sovereign Tablet',
      monthlyRevenueUsd: 49,
      billingStatus: 'CURRENT',
      renewalDate: '2027-10-10',
      retentionRisk: 'LOW',
      productsPurchased: ['Agent Tablet', 'Digital Brain'],
      productsEnabled: ['Agent Tablet', 'Digital Brain'],
      authorizedDeviceCount: 1,
      bridgeEnrollment: 'ENROLLED',
      verifiedExtensionCount: 1,
      extensionFleetStatus: 'CURRENT',
      lastVerifiedDeviceAt: '2026-11-27T01:05:00Z',
      permittedEmployeeHeadcount: 1,
      contractedEmployeeIds: [],
      internalAgentCount: 1,
      storageUsedGb: 11.8,
      storageQuotaGb: 50,
      computeHoursUsed: 19,
      computeQuotaHours: 60,
      openIncidentIds: [],
      crmSegment: 'Personal Creators & Operators',
      crmOffer: 'Personal Tablet Edition - $49/mo',
      crmStage: 'Active Account',
      marketingAllowed: false,
      privateContentAccess: false,
      extensionDeviceCommands: false,
      provenance: 'CORE_ADMIN_STORE',
      permissions: { digitalEmployment: false, continuumSync: true, commercialUpdates: false },
      restrictions: ['Personal edition; private Digital Brain stays device-sovereign'],
      permissionHistory: [{ timestamp: '2026-10-10T16:45:00Z', action: 'ACTIVATED_PERSONAL', actor: 'Self-Service' }],
    },
    {
      id: 'cust-personal-elena',
      contactRef: 'cnt:personal:elena-rostova',
      accountRef: 'acct:pers:elena-rostova',
      displayName: 'Elena Rostova',
      legalName: 'Elena Rostova',
      accountType: 'PERSONAL',
      edition: 'PERSONAL',
      verifiedEmail: 'elena.rostova@personal.example',
      representatives: [],
      accountStatus: 'PENDING_ADMISSION',
      onboardingStatus: 'REVIEW_REQUIRED',
      registeredAt: '2026-11-24T08:15:00Z',
      subscriptionTier: 'Personal + External Candidate Offer',
      monthlyRevenueUsd: 99,
      billingStatus: 'TRIAL',
      renewalDate: '2026-12-24',
      retentionRisk: 'HIGH',
      productsPurchased: ['Agent Tablet', 'Agent Skills'],
      productsEnabled: ['Agent Tablet'],
      authorizedDeviceCount: 1,
      bridgeEnrollment: 'PENDING',
      verifiedExtensionCount: 0,
      extensionFleetStatus: 'NO_EXTENSION',
      lastVerifiedDeviceAt: null,
      permittedEmployeeHeadcount: 1,
      contractedEmployeeIds: [],
      internalAgentCount: 1,
      storageUsedGb: 44.1,
      storageQuotaGb: 50,
      computeHoursUsed: 54,
      computeQuotaHours: 60,
      openIncidentIds: ['sup-inc-03'],
      crmSegment: 'Personal Builders / Candidate Authors',
      crmOffer: 'Creator Candidate Admission',
      crmStage: 'Review Required',
      marketingAllowed: true,
      privateContentAccess: false,
      extensionDeviceCommands: false,
      provenance: 'CORE_ADMIN_STORE',
      permissions: { digitalEmployment: false, continuumSync: false, commercialUpdates: true },
      restrictions: ['External candidate agent requires Creator approval before ecosystem deployment'],
      permissionHistory: [{ timestamp: '2026-11-24T08:15:00Z', action: 'SUBMITTED_ADMISSION', actor: 'Onboarding' }],
    },
  ];

  const w00ToW17Names = [
    ['W00', 'Command Operations', 'Executive Operations', 'CASTE_COORDINATOR'],
    ['W01', 'LeeWay Standards', 'Governance & Law', 'CASTE_COORDINATOR'],
    ['W02', 'LeeWay Formula', 'Mathematics & Runtime', 'CASTE_BUILDER'],
    ['W03', 'Runtime Fabric', 'Infrastructure & Execution', 'CASTE_COORDINATOR'],
    ['W04', 'Independent Veritas', 'Verification Authority', 'CASTE_SCOUT'],
    ['W05', 'Receipt Authority', 'Evidence Custody', 'CASTE_SCOUT'],
    ['W06', 'Learning Ledger', 'Institutional Mastery', 'CASTE_BUILDER'],
    ['W07', 'Device Bridge & Zitadel', 'Zero-Trust & Bridge', 'CASTE_SOLDIER'],
    ['W08', 'Skills & MCP', 'Capability Registry', 'CASTE_BUILDER'],
    ['W09', 'Continuum & Digital Brain', 'Memory & Continuity', 'CASTE_BUILDER'],
    ['W10', 'GPU & VRAM', 'Compute Arbitration', 'CASTE_SOLDIER'],
    ['W11', 'Agent Lee Intelligence', 'Cognitive Coordination', 'CASTE_COORDINATOR'],
    ['W12', 'Voice & RTC', 'Sensory & Edge RTC', 'CASTE_SOLDIER'],
    ['W13', 'Federation', 'Cross-Node Federation', 'CASTE_SCOUT'],
    ['W14', 'Digital Workforce', 'Customer & Field Ops', 'CASTE_BUILDER'],
    ['W15', 'Integration Lead', 'Ecosystem Adapters', 'CASTE_BUILDER'],
    ['W16', 'Security Review', 'Security & Rules', 'CASTE_SOLDIER'],
    ['W17', 'Evidence Review', 'Audit & Checkpoint', 'CASTE_SCOUT'],
  ] as const;

  const workforce: WorkforceMember[] = [
    ...w00ToW17Names.map(([code, name, dept, caste], idx) => ({
      id: `emp-${code.toLowerCase()}`,
      workerCode: code,
      name,
      citizenId: `CTZ-LW-${code}`,
      genesisSeedHash: sha256(`genesis:${code}:${name}`).slice(0, 16),
      caste,
      homeNodeId: 'NODE-CREATOR-MASTER',
      tabletId: `TAB-${code}`,
      category: 'A_LEEWAY_INTERNAL' as WorkforceCategory,
      originatingOrg: 'Leeway Industries',
      creatingAccount: 'creator:leonard-j-lee',
      employingOrg: 'Leeway Industries',
      contractingAuthority: 'Creator Sovereign Authority',
      contractId: `LW-INT-${code}-2026`,
      contractStart: '2026-01-15',
      contractExpiry: '2027-12-31',
      position: `${name} Specialist`,
      department: dept,
      supervisor: code === 'W00' ? 'Leonard J. Lee (Creator)' : 'W00 · Command Operations',
      assignedCustomerIds: code === 'W14' ? ['cust-ballers-club', 'cust-near-west-side', 'cust-print-n-press'] : [],
      authorizedSkills: ['12-stage-loop', 'receipt-attestation', dept.toLowerCase().replace(/\s+/g, '-')],
      assignedModels: ['LEEWAY-RUNTIME-BOUNDARY'],
      approvedCapabilities: ['DIAGNOSTIC_READ', 'EVIDENCE_CHECKPOINT'],
      currentAssignments: [`Core ${name} governance & operational continuity`],
      operationalStatus: (idx % 5 === 4 ? 'CHECKPOINTED' : 'ACTIVE') as WorkforceMember['operationalStatus'],
      workloadPct: 34 + ((idx * 11) % 52),
      cpuUnitsConsumed: 120 + idx * 19,
      memoryMbConsumed: 256 + idx * 42,
      measuredTaskSuccessPct: idx < 6 ? 98.2 - idx * 0.4 : 95.0 - (idx % 4) * 1.1,
      restrictions: ['Bound to LeeWay Standards R01-R25', 'Cannot self-approve Veritas'],
      veritasQualification: 'QUALIFIED' as const,
      receiptIds: [`RCP-${code}-001`],
      contractHistory: [{ date: '2026-01-15', event: 'INTERNAL_APPOINTMENT', authority: 'Leonard J. Lee' }],
      permissionHistory: [{ date: '2026-01-15', change: 'GRANTED_CANONICAL_ROLE', actor: 'Creator' }],
      provenance: 'CANONICAL_W00_W17_PROJECTION' as const,
    })),
    {
      id: 'emp-w14-field',
      workerCode: 'LW-CTR-01',
      name: 'Milwaukee Corridor Dispatch Agent',
      citizenId: 'CTZ-CTR-MIL-01',
      genesisSeedHash: sha256('genesis:LW-CTR-01').slice(0, 16),
      caste: 'CASTE_BUILDER',
      homeNodeId: 'NODE-CREATOR-MASTER',
      tabletId: 'TAB-CTR-01',
      category: 'B_LEEWAY_CONTRACTED',
      originatingOrg: 'Leeway Industries',
      creatingAccount: 'creator:leonard-j-lee',
      employingOrg: 'Near West Side Business Corridor',
      contractingAuthority: 'LeeWay Contracting Authority',
      contractId: 'LW-CTR-2026-0041',
      contractStart: '2026-07-01',
      contractExpiry: '2027-01-15',
      position: 'Contracted SMB Outreach & Support Operator',
      department: 'Customer & Field Ops',
      supervisor: 'W14 · Digital Workforce',
      assignedCustomerIds: ['cust-ballers-club', 'cust-near-west-side', 'cust-print-n-press'],
      authorizedSkills: ['crm-follow-up', 'proactive-support-triage', 'onboarding-assist'],
      assignedModels: ['LEEWAY-RUNTIME-BOUNDARY'],
      approvedCapabilities: ['CRM_METADATA_READ', 'SUPPORT_DIAGNOSTIC_TRIAGE'],
      currentAssignments: ['Corridor SMB onboarding', 'Extension fleet update advisory'],
      operationalStatus: 'ACTIVE',
      workloadPct: 76,
      cpuUnitsConsumed: 310,
      memoryMbConsumed: 640,
      measuredTaskSuccessPct: 94.6,
      restrictions: ['No access to customer private Digital Brain files', 'Requires renewal before 2027-01-15'],
      veritasQualification: 'QUALIFIED',
      receiptIds: ['RCP-CTR-041-A'],
      contractHistory: [{ date: '2026-07-01', event: 'CONTRACT_DEPLOYED', authority: 'Creator' }],
      permissionHistory: [{ date: '2026-07-01', change: 'SCOPED_TO_3_TENANTS', actor: 'Creator' }],
      provenance: 'ECOSYSTEM_CONTRACT_FIXTURE',
    },
    {
      id: 'emp-cust-internal-01',
      workerCode: 'CUST-INT-01',
      name: 'Print-n-Press Quote Summarizer',
      citizenId: 'CTZ-CUST-PNP-01',
      genesisSeedHash: sha256('genesis:CUST-INT-01').slice(0, 16),
      caste: 'CASTE_BUILDER',
      homeNodeId: 'NODE-TENANT-PNP',
      tabletId: 'TAB-TENANT-PNP-01',
      category: 'C_CUSTOMER_INTERNAL_AGENT',
      originatingOrg: 'Print-n-Press Milwaukee LLC',
      creatingAccount: 'acct:ind:print-n-press',
      employingOrg: 'Print-n-Press Milwaukee LLC',
      contractingAuthority: 'Customer Tenant Self-Scope (Private)',
      contractId: null,
      contractStart: '2026-08-10',
      contractExpiry: null,
      position: 'Tenant Private Internal Agent',
      department: 'Customer Private Environment',
      supervisor: 'Tenant Administrator (Print-n-Press)',
      assignedCustomerIds: ['cust-print-n-press'],
      authorizedSkills: ['tenant-internal-only'],
      assignedModels: ['TENANT_LOCAL_MODEL'],
      approvedCapabilities: ['PRIVATE_TENANT_EXECUTION_ONLY'],
      currentAssignments: ['Metadata-only heartbeat observed; internal tasks private to customer'],
      operationalStatus: 'ACTIVE',
      workloadPct: 41,
      cpuUnitsConsumed: 95,
      memoryMbConsumed: 320,
      measuredTaskSuccessPct: null,
      restrictions: ['PRIVATE INTERNAL AGENT: Creator visibility restricted to authorized operational metadata only'],
      veritasQualification: 'UNVERIFIED',
      receiptIds: [],
      contractHistory: [{ date: '2026-08-10', event: 'CUSTOMER_CREATED_PRIVATE', authority: 'Tenant Self-Scope' }],
      permissionHistory: [{ date: '2026-08-10', change: 'DENIED_EXTERNAL_DEPLOYMENT', actor: 'LeeWay Governance Law' }],
      provenance: 'ECOSYSTEM_CONTRACT_FIXTURE',
    },
    {
      id: 'emp-cand-elena-01',
      workerCode: 'CAND-EXT-01',
      name: 'Compliance Citation Auditor v1',
      citizenId: 'CTZ-CAND-ELENA-01',
      genesisSeedHash: sha256('genesis:CAND-EXT-01').slice(0, 16),
      caste: 'CASTE_SCOUT',
      homeNodeId: 'NODE-TENANT-ELENA',
      tabletId: 'TAB-CAND-01',
      category: 'D_CUSTOMER_EXTERNAL_CANDIDATE',
      originatingOrg: 'Elena Rostova',
      creatingAccount: 'acct:pers:elena-rostova',
      employingOrg: 'Pending External Placement',
      contractingAuthority: 'Awaiting LeeWay Creator Approval',
      contractId: 'PROP-CAND-2026-009',
      contractStart: null,
      contractExpiry: null,
      position: 'External Employment Candidate',
      department: 'External Candidate Queue',
      supervisor: 'Unassigned',
      assignedCustomerIds: [],
      authorizedSkills: ['citation-check', 'schema-validation'],
      assignedModels: ['PENDING_MODEL_HUB_REVIEW'],
      approvedCapabilities: ['SANDBOX_EVALUATION_ONLY'],
      currentAssignments: ['Pending Veritas qualification and Creator admission review'],
      operationalStatus: 'PENDING_APPROVAL',
      workloadPct: 0,
      cpuUnitsConsumed: 18,
      memoryMbConsumed: 128,
      measuredTaskSuccessPct: null,
      restrictions: ['Cannot deploy externally until Creator + Contracting Authority + Veritas sign off'],
      veritasQualification: 'PENDING',
      receiptIds: ['RCP-CAND-009'],
      contractHistory: [{ date: '2026-11-24', event: 'SUBMITTED_FOR_EXTERNAL_EMPLOYMENT', authority: 'Elena Rostova' }],
      permissionHistory: [{ date: '2026-11-24', change: 'QUARANTINED_IN_CANDIDATE_QUEUE', actor: 'Governance Gate' }],
      provenance: 'ECOSYSTEM_CONTRACT_FIXTURE',
    },
    {
      id: 'emp-ext-corridor',
      workerCode: 'EXT-DEP-01',
      name: 'Corridor Grant & Intake Coordinator',
      citizenId: 'CTZ-EXT-CORR-01',
      genesisSeedHash: sha256('genesis:EXT-DEP-01').slice(0, 16),
      caste: 'CASTE_COORDINATOR',
      homeNodeId: 'NODE-CORRIDOR-02',
      tabletId: 'TAB-EXT-CORR-01',
      category: 'E_EXTERNALLY_DEPLOYED_CONTRACTED',
      originatingOrg: 'Certified Partner Builder',
      creatingAccount: 'acct:partner:midwest-ops',
      employingOrg: 'Near West Side Business Corridor',
      contractingAuthority: 'LeeWay Contracting Authority',
      contractId: 'LW-EXT-2026-0118',
      contractStart: '2026-09-01',
      contractExpiry: '2027-03-01',
      position: 'Externally Deployed Contracted Coordinator',
      department: 'Ecosystem External Deployments',
      supervisor: 'Corridor Program Director + LeeWay Contract Oversight',
      assignedCustomerIds: ['cust-near-west-side'],
      authorizedSkills: ['intake-routing', 'milestone-tracking', 'receipt-logging'],
      assignedModels: ['LEEWAY-MODEL-HUB-APPROVED'],
      approvedCapabilities: ['CONTRACT_SCOPED_CRM_READ', 'RECEIPT_EMIT'],
      currentAssignments: ['Near West Side intake routing under contract LW-EXT-2026-0118'],
      operationalStatus: 'ACTIVE',
      workloadPct: 68,
      cpuUnitsConsumed: 224,
      memoryMbConsumed: 512,
      measuredTaskSuccessPct: 92.8,
      restrictions: ['Bound to Near West Side tenant', 'Expires 2027-03-01'],
      veritasQualification: 'QUALIFIED',
      receiptIds: ['RCP-EXT-118-A'],
      contractHistory: [{ date: '2026-09-01', event: 'EXTERNAL_CONTRACT_ACTIVE', authority: 'Creator' }],
      permissionHistory: [{ date: '2026-09-01', change: 'VERITAS_QUALIFIED_DEPLOYMENT', actor: 'Veritas + Creator' }],
      provenance: 'ECOSYSTEM_CONTRACT_FIXTURE',
    },
  ];

  const missions: MissionRecord[] = [
    {
      id: 'msn-formula-telemetry',
      title: 'Formula v1.0 Cross-Domain Telemetry Integration',
      department: 'Mathematics & Runtime',
      stage: 'VERIFY',
      ownerWorkerId: 'emp-w02',
      assignedWorkerIds: ['emp-w02', 'emp-w03', 'emp-w15'],
      dependencies: [],
      blockedReason: null,
      executiveAuthorizationRequired: true,
      authorizationStatus: 'AUTHORIZED',
      stageEvidence: {
        INVESTIGATE: { verifiedAt: '2026-11-18T10:00:00Z', receiptId: 'RCP-MSN1-01', summary: 'Canonical v1.0 SHA-256 hashes audited' },
        DIAGNOSE: { verifiedAt: '2026-11-19T11:30:00Z', receiptId: 'RCP-MSN1-02', summary: 'Identified 14 domain adapter boundaries' },
        PLAN: { verifiedAt: '2026-11-20T09:15:00Z', receiptId: 'RCP-MSN1-03', summary: 'Typed input/output contracts approved' },
        IMPLEMENT: { verifiedAt: '2026-11-22T16:40:00Z', receiptId: 'RCP-MSN1-04', summary: 'Adapters bound to runtime-state-v1 and raw-base64-v1' },
        TEST: { verifiedAt: '2026-11-23T14:20:00Z', receiptId: 'RCP-MSN1-05', summary: 'Golden Vector [4,50,63,59,48,69] passed exact rational check' },
        VALIDATE: { verifiedAt: '2026-11-24T17:00:00Z', receiptId: 'RCP-MSN1-06', summary: 'Kernel integrity manifest verified 11/11 files' },
        REPAIR: { verifiedAt: '2026-11-25T09:10:00Z', receiptId: 'RCP-MSN1-07', summary: 'Corrected traceId collision guard' },
        RETEST: { verifiedAt: '2026-11-26T12:00:00Z', receiptId: 'RCP-MSN1-08', summary: 'Re-verified all 14 adapters post-repair' },
      },
      createdAt: '2026-11-18T09:00:00Z',
      updatedAt: '2026-11-26T12:00:00Z',
      correctionNotes: ['Preserve Golden Matrix untouched per Creator Law'],
    },
    {
      id: 'msn-corridor-extension',
      title: 'Near West Side Extension Fleet Remediation',
      department: 'Customer & Field Ops',
      stage: 'IMPLEMENT',
      ownerWorkerId: 'emp-w14-field',
      assignedWorkerIds: ['emp-w14-field', 'emp-w07'],
      dependencies: ['msn-formula-telemetry'],
      blockedReason: null,
      executiveAuthorizationRequired: false,
      authorizationStatus: 'AUTHORIZED',
      stageEvidence: {
        INVESTIGATE: { verifiedAt: '2026-11-23T08:30:00Z', receiptId: 'RCP-MSN2-01', summary: 'Detected 1 extension out-of-sync in Near West Side' },
        DIAGNOSE: { verifiedAt: '2026-11-24T10:15:00Z', receiptId: 'RCP-MSN2-02', summary: 'Confirmed v2.13 manifest mismatch on 1 workstation' },
        PLAN: { verifiedAt: '2026-11-25T13:00:00Z', receiptId: 'RCP-MSN2-03', summary: 'Non-destructive delta update preserving local data' },
      },
      createdAt: '2026-11-23T08:00:00Z',
      updatedAt: '2026-11-25T13:00:00Z',
      correctionNotes: [],
    },
    {
      id: 'msn-zitadel-federation',
      title: 'Zitadel OIDC & Hardware Enclave Authority Binding',
      department: 'Zero-Trust & Bridge',
      stage: 'DIAGNOSE',
      ownerWorkerId: 'emp-w07',
      assignedWorkerIds: ['emp-w07', 'emp-w16'],
      dependencies: [],
      blockedReason: 'LEEWAY_ZITADEL_ISSUER is currently UNBOUND in this environment',
      executiveAuthorizationRequired: true,
      authorizationStatus: 'BLOCKED',
      stageEvidence: {
        INVESTIGATE: { verifiedAt: '2026-11-21T15:00:00Z', receiptId: 'RCP-MSN3-01', summary: 'Audited Zitadel PKCE redirect contract from Tablet server.ts' },
      },
      createdAt: '2026-11-21T14:30:00Z',
      updatedAt: '2026-11-21T15:00:00Z',
      correctionNotes: ['Do not substitute third-party consumer auth for Zitadel'],
    },
    {
      id: 'msn-storage-compaction',
      title: 'Experimental Continuum Compaction Benchmark',
      department: 'Research & Development',
      stage: 'VALIDATE',
      ownerWorkerId: 'emp-w09',
      assignedWorkerIds: ['emp-w09', 'emp-w06'],
      dependencies: ['msn-formula-telemetry'],
      blockedReason: null,
      executiveAuthorizationRequired: true,
      authorizationStatus: 'PENDING_CREATOR',
      stageEvidence: {
        INVESTIGATE: { verifiedAt: '2026-11-15T10:00:00Z', receiptId: 'RCP-MSN4-01', summary: 'Reviewed experimental-v2 locality-preserving-fold' },
        DIAGNOSE: { verifiedAt: '2026-11-16T11:00:00Z', receiptId: 'RCP-MSN4-02', summary: 'Measured tail latency variance under mixed payloads' },
        PLAN: { verifiedAt: '2026-11-17T12:00:00Z', receiptId: 'RCP-MSN4-03', summary: 'Isolated experimental track from Golden v1.0' },
        IMPLEMENT: { verifiedAt: '2026-11-19T16:00:00Z', receiptId: 'RCP-MSN4-04', summary: 'Ran benchmark suite against 4 payload profiles' },
        TEST: { verifiedAt: '2026-11-20T18:00:00Z', receiptId: 'RCP-MSN4-05', summary: '3 favorable compression deltas, 1 unfavorable overhead on tiny JSON' },
      },
      createdAt: '2026-11-15T09:00:00Z',
      updatedAt: '2026-11-20T18:00:00Z',
      correctionNotes: ['Report both favorable and unfavorable outcomes'],
    },
  ];

  const commercials: CommercialRecord[] = [
    {
      id: 'cmp-barbershop-tuneup',
      title: 'Milwaukee SMB AI Growth Tune-Up ($250)',
      productId: 'prod-crm-erp',
      targetSegment: 'Barbershops & Local Service Storefronts',
      channel: 'LeeWay Commercial Distribution + Field Outreach',
      offerText: 'Appointment rebooking, review capture, and local customer follow-up powered by LeeWay CRM.',
      mediaPreviewType: 'PRODUCT_GRAPHIC',
      mediaAssetPath: '/assets/leeway/leeway-approved-coin.png',
      claimVerificationStatus: 'VERIFIED_CAPABILITY',
      approvalStatus: 'APPROVED',
      distributionStatus: 'DISTRIBUTING',
      scheduledFor: '2026-11-01T09:00:00Z',
      eligibleCustomerCount: 14,
      observedReach: null,
      observedConversions: null,
      provenance: 'CRM_CAMPAIGN_FIXTURE',
      revisionNote: null,
    },
    {
      id: 'cmp-church-audit',
      title: 'Church Office Admin & Communications Audit ($497)',
      productId: 'prod-tablet-pro',
      targetSegment: 'Churches & Community Nonprofits',
      channel: 'Eligible Customer Tablet Banner',
      offerText: 'Streamline announcements, volunteer scheduling, and member newsletters under device-sovereign control.',
      mediaPreviewType: 'INTERACTIVE_OFFER',
      mediaAssetPath: '/assets/leeway/leeway-true-logo.png',
      claimVerificationStatus: 'VERIFIED_CAPABILITY',
      approvalStatus: 'PENDING_REVIEW',
      distributionStatus: 'NOT_DISTRIBUTED',
      scheduledFor: '2026-12-01T10:00:00Z',
      eligibleCustomerCount: 8,
      observedReach: null,
      observedConversions: null,
      provenance: 'CRM_CAMPAIGN_FIXTURE',
      revisionNote: null,
    },
    {
      id: 'cmp-edge-gpu-claim',
      title: 'LeeWay Edge GPU Zero-Latency Inference Suite',
      productId: 'prod-edge-gpu',
      targetSegment: 'Industrial Manufacturing & Print Accounts',
      channel: 'Executive Enterprise Newsletter',
      offerText: 'Local quantized inference acceleration for industrial Agent Tablet deployments.',
      mediaPreviewType: 'VIDEO_STORYBOARD',
      mediaAssetPath: '/assets/leeway/diagnostics/lenovo-83nx-topology-stage.png',
      claimVerificationStatus: 'REQUIRES_EVIDENCE_REVIEW',
      approvalStatus: 'REVISION_REQUESTED',
      distributionStatus: 'NOT_DISTRIBUTED',
      scheduledFor: null,
      eligibleCustomerCount: 4,
      observedReach: null,
      observedConversions: null,
      provenance: 'CORE_COMMERCIAL_STORE',
      revisionNote: 'Blocked from publication until live GPU VRAM telemetry is independently verified.',
    },
  ];

  const supportCases: SupportIncident[] = [
    {
      id: 'sup-inc-01',
      customerId: 'cust-near-west-side',
      customerName: 'Near West Side Business Corridor',
      severity: 'WARNING',
      workflowStep: 'RECOMMEND',
      issueCategory: 'UPDATE_FAILURE',
      summary: '1 of 5 authorized browser extensions running stale manifest (v2.13 vs v2.14)',
      observedSignal: 'Extension fleet status reported UPDATE_REQUIRED at last device handshake',
      predictedRisk: 'Moderate: potential CRM sync drift across 1 corridor workstation within 72h',
      recommendedAction: 'Dispatch non-destructive extension update package preserving local CRM cache',
      preservesCustomerData: true,
      assignedSupportWorkerId: 'emp-w14-field',
      formulaEvaluationId: null,
      detectedAt: '2026-11-26T14:20:00Z',
      updatedAt: '2026-11-27T04:10:00Z',
    },
    {
      id: 'sup-inc-02',
      customerId: 'cust-monumental-church',
      customerName: 'Monumental Missionary Baptist Church',
      severity: 'WARNING',
      workflowStep: 'DIAGNOSE',
      issueCategory: 'SYNC_DRIFT',
      summary: 'Device Bridge enrollment stuck in PENDING after initial provisional registration',
      observedSignal: 'bridgeEnrollment=PENDING; lastVerifiedDeviceAt=null since 2026-09-12',
      predictedRisk: 'Moderate: onboarding stall risk before trial renewal 2026-12-12',
      recommendedAction: 'Assign onboarding support worker to complete Device Bridge handshake without resetting CRM leads',
      preservesCustomerData: true,
      assignedSupportWorkerId: null,
      formulaEvaluationId: null,
      detectedAt: '2026-11-25T16:00:00Z',
      updatedAt: '2026-11-26T09:00:00Z',
    },
    {
      id: 'sup-inc-03',
      customerId: 'cust-personal-elena',
      customerName: 'Elena Rostova',
      severity: 'CRITICAL',
      workflowStep: 'EVALUATE',
      issueCategory: 'STORAGE_PRESSURE',
      summary: 'Storage consumption reached 88.2% (44.1 GB / 50 GB) during candidate sandbox tests',
      observedSignal: 'Quota headroom < 6 GB while compute hours at 54 / 60',
      predictedRisk: 'High: imminent sandbox checkpoint write failure if quota exhausted',
      recommendedAction: 'Evaluate Continuum lossless compaction or temporary quota expansion pending admission',
      preservesCustomerData: true,
      assignedSupportWorkerId: null,
      formulaEvaluationId: null,
      detectedAt: '2026-11-27T02:30:00Z',
      updatedAt: '2026-11-27T06:00:00Z',
    },
  ];

  const decisions: ExecutiveDecision[] = [
    {
      id: 'dec-cand-elena',
      category: 'Digital Employment',
      title: 'Admit Customer-Created Candidate "Compliance Citation Auditor v1"',
      requestingIdentity: 'acct:pers:elena-rostova (Elena Rostova)',
      purpose: 'Promote customer-created agent from sandbox candidate queue (Category D) to contracted external employment pool (Category E)',
      affectedParties: ['Elena Rostova', 'LeeWay Contracting Authority', 'Future Industrial Tenants'],
      restrictions: ['Requires Veritas pre-deployment check', 'Initial headcount cap: 1 deployment slot'],
      alternatives: [
        { label: 'Approve Provisional 30-Day Sandbox Contract', riskLevel: 'LOW', estimatedCostUsd: 0 },
        { label: 'Defer Pending Veritas Qualification Receipt', riskLevel: 'LOW', estimatedCostUsd: 0 },
        { label: 'Reject External Employment Request', riskLevel: 'LOW', estimatedCostUsd: 0 },
      ],
      riskSummary: 'Unverified external candidate must not bypass LeeWay employment gate.',
      evidenceRefs: ['RCP-CAND-009', 'CONTRACT-CTZ-008'],
      formulaSummary: 'Pending live domain evaluation via employment-suitability adapter',
      agentLeeRecommendation: 'Hold external deployment until Veritas qualification completes; optionally approve bounded 30-day review.',
      decisionStatus: 'PENDING',
      executionStatus: 'NOT_EXECUTED',
      veritasStatus: 'NOT_VERIFIED',
      createdAt: '2026-11-24T08:30:00Z',
      decidedAt: null,
      decisionNote: null,
    },
    {
      id: 'dec-cmp-church',
      category: 'Commercials',
      title: 'Authorize Distribution: Church Office Admin & Communications Audit ($497)',
      requestingIdentity: 'CRM Campaign Office (W14)',
      purpose: 'Distribute verified CRM audit offer to 8 eligible church & nonprofit accounts',
      affectedParties: ['8 Eligible Community Organizations', 'LeeWay CRM Pipeline'],
      restrictions: ['Must only target marketingAllowed=true accounts', 'No automated outreach without recipient selection'],
      alternatives: [
        { label: 'Approve & Schedule for 2026-12-01', riskLevel: 'LOW', estimatedCostUsd: 120 },
        { label: 'Request Copy Revisions', riskLevel: 'LOW', estimatedCostUsd: 0 },
      ],
      riskSummary: 'Low commercial risk; all product claims align with verified CRM capabilities.',
      evidenceRefs: ['CRM-STARTER-DATA', 'ERP-CRM-INTEGRATION-001'],
      formulaSummary: 'Commercial-analysis adapter ready for evaluation',
      agentLeeRecommendation: 'Approve scheduled distribution after confirming opt-in filter on target organizations.',
      decisionStatus: 'PENDING',
      executionStatus: 'NOT_EXECUTED',
      veritasStatus: 'NOT_VERIFIED',
      createdAt: '2026-11-25T11:00:00Z',
      decidedAt: null,
      decisionNote: null,
    },
    {
      id: 'dec-corridor-renewal',
      category: 'Contracts',
      title: 'Extend Contract LW-CTR-2026-0041 (Milwaukee Corridor Dispatch Agent)',
      requestingIdentity: 'Near West Side Business Corridor',
      purpose: 'Renew contracted digital employee deployment 60 days ahead of 2027-01-15 expiration',
      affectedParties: ['Near West Side Business Corridor', 'EMP LW-CTR-01'],
      restrictions: ['Preserve tenant isolation and privateContentAccess=false'],
      alternatives: [
        { label: 'Approve 12-Month Contract Renewal', riskLevel: 'LOW', estimatedCostUsd: 0 },
        { label: 'Defer to January Renewal Cycle', riskLevel: 'MEDIUM', estimatedCostUsd: 0 },
      ],
      riskSummary: 'Moderate retention risk if contract expires while extension remediation mission is active.',
      evidenceRefs: ['RCP-CTR-041-A', 'msn-corridor-extension'],
      formulaSummary: 'Customer-management & workforce-evaluation adapters aligned',
      agentLeeRecommendation: 'Approve renewal contingent on resolving open extension update incident sup-inc-01.',
      decisionStatus: 'PENDING',
      executionStatus: 'NOT_EXECUTED',
      veritasStatus: 'NOT_VERIFIED',
      createdAt: '2026-11-26T09:15:00Z',
      decidedAt: null,
      decisionNote: null,
    },
    {
      id: 'dec-rd-compaction',
      category: 'Research',
      title: 'Review Experimental Locality-Preserving Fold v2 for Storage Pilot',
      requestingIdentity: 'W09 · Continuum & Digital Brain',
      purpose: 'Evaluate experimental-v2 storage fold results separately from frozen Golden Formula v1.0',
      affectedParties: ['Continuum Storage Layer', 'R&D Track'],
      restrictions: ['NEVER overwrite canonical LEEWAY-FORMULA-v1.0', 'Must disclose negative tiny-JSON overhead'],
      alternatives: [
        { label: 'Defer Adoption — Keep in Experimental Sandbox', riskLevel: 'LOW', estimatedCostUsd: 0 },
        { label: 'Approve Bounded Shadow Pilot (Non-Authoritative)', riskLevel: 'MEDIUM', estimatedCostUsd: 350 },
      ],
      riskSummary: 'Experimental payload overhead regression (+8.4%) observed on small JSON records < 4 KB.',
      evidenceRefs: ['g44-locality-preserving-fold.mjs', 'msn-storage-compaction'],
      formulaSummary: 'Baseline Golden Formula v1.0 remains FROZEN_VERIFIED (100% SHA-256 intact)',
      agentLeeRecommendation: 'Keep experimental math isolated; authorize shadow pilot only for payloads > 64 KB.',
      decisionStatus: 'PENDING',
      executionStatus: 'NOT_EXECUTED',
      veritasStatus: 'NOT_VERIFIED',
      createdAt: '2026-11-26T16:45:00Z',
      decidedAt: null,
      decisionNote: null,
    },
  ];

  const defaultExecPanels: WorkspacePanelConfig[] = [
    { id: 'exec-kpi-strip', title: 'Enterprise Operational Vital Metrics', span: 3, collapsed: false, pinned: true, hidden: false },
    { id: 'exec-customer-growth', title: 'Customer Growth & Account Distribution', span: 2, collapsed: false, pinned: false, hidden: false },
    { id: 'exec-workforce-dist', title: 'Workforce Deployment Categories (A–E)', span: 1, collapsed: false, pinned: false, hidden: false },
    { id: 'exec-revenue-retention', title: 'Revenue Velocity & Retention Cohorts', span: 2, collapsed: false, pinned: false, hidden: false },
    { id: 'exec-infra-gauges', title: 'Host Telemetry & Infrastructure Health', span: 1, collapsed: false, pinned: false, hidden: false },
    { id: 'exec-relationship-graph', title: 'Enterprise Relationship Topology', span: 2, collapsed: false, pinned: true, hidden: false },
    { id: 'exec-agent-lee-briefing', title: 'Agent Lee Executive Briefing & Formula Pulse', span: 1, collapsed: false, pinned: false, hidden: false },
  ];

  const initialReceipt: ReceiptEntry = {
    receiptId: 'RCP-CORE-BOOT-001',
    timestamp: now,
    actionType: 'CORE_STORE_INITIALIZATION',
    actor: 'LeeWay Core Server',
    targetId: 'core-state.json',
    summary: 'Initialized LeeWay Core authoritative local store from canonical CRM-ERP, Workforce, and Standards fixtures.',
    sha256: sha256({ initializedAt: now, customerCount: initialCustomers.length }),
    veritasState: 'NOT_VERIFIED_EXTERNALLY',
  };

  return {
    version: '1.0.0',
    updatedAt: now,
    customers: initialCustomers,
    workforce,
    missions,
    commercials,
    supportCases,
    decisions,
    proposals: [],
    formulaEvaluations: [],
    receipts: [initialReceipt],
    workspaceViews: [
      {
        id: 'view-default-exec',
        name: 'Default Creator Executive Control',
        sectionId: 'executive-operations',
        panels: defaultExecPanels,
        savedAt: now,
      },
    ],
    products: [
      { id: 'prod-tablet-pro', name: 'Agent Virtual Tablet', tier: 'Core Platform', activeSubscribers: 5, monthlyPriceUsd: 49, latestVersion: 'v2.14.0', updateChannel: 'STABLE', adoptionPct: 83.3 },
      { id: 'prod-crm-erp', name: 'LeeWay Agentic CRM & ERP', tier: 'Commercial Office', activeSubscribers: 4, monthlyPriceUsd: 250, latestVersion: 'v1.8.2', updateChannel: 'STABLE', adoptionPct: 66.7 },
      { id: 'prod-digital-brain', name: 'Digital Brain + Diagnostics', tier: 'Device-Sovereign', activeSubscribers: 3, monthlyPriceUsd: 79, latestVersion: 'v0.9.4', updateChannel: 'STABLE', adoptionPct: 50.0 },
      { id: 'prod-content-vault', name: 'Continuum & Content Vault', tier: 'Memory Fabric', activeSubscribers: 1, monthlyPriceUsd: 149, latestVersion: 'v1.2.0', updateChannel: 'CANARY', adoptionPct: 16.7 },
      { id: 'prod-edge-gpu', name: 'LeeWay Edge GPU Suite', tier: 'Unverified / Lab', activeSubscribers: 0, monthlyPriceUsd: 499, latestVersion: 'v0.4.0-exp', updateChannel: 'CANARY', adoptionPct: 0.0 },
    ],
    rdProjects: [
      {
        id: 'rd-golden-v1',
        title: 'LEEWAY-FORMULA-v1.0 (Canonical Golden Baseline)',
        track: 'CANONICAL_BASELINE',
        sourcePath: 'server/canonical/leeway-formula/v1/leeway-formula-v1.mjs',
        status: 'FROZEN_VERIFIED',
        baselineMetricLabel: 'Exact Rational Golden Vector Match',
        baselineValue: 100,
        experimentalValue: 100,
        deltaLabel: '0% drift · SHA-256 Verified',
        notes: 'Frozen by Leonard J. Lee. Must never be overwritten by experimental v2 research.',
      },
      {
        id: 'rd-g41-fusion',
        title: 'G41 Spatial Scene Tensor & Math Core',
        track: 'EXPERIMENTAL_V2',
        sourcePath: 'LeeWay-formula-live/runtime/canonical/leeway-formula/experimental-v2/fused-spatial-scene-tensor.mjs',
        status: 'EXPERIMENTAL_UNQUALIFIED',
        baselineMetricLabel: 'Spatial Projection Throughput (ops/s)',
        baselineValue: 100,
        experimentalValue: 134,
        deltaLabel: '+34.0% favorable in synthetic benchmark',
        notes: 'Requires independent Veritas & physical hardware qualification before production claim.',
      },
      {
        id: 'rd-g42-silos',
        title: 'G42 Compressive Math Silos',
        track: 'EXPERIMENTAL_V2',
        sourcePath: 'LeeWay-formula-live/runtime/canonical/leeway-formula/experimental-v2/tests/g42-compressive-math-silos.test.mjs',
        status: 'EXPERIMENTAL_UNQUALIFIED',
        baselineMetricLabel: 'Structured Matrix Payload Size (KB)',
        baselineValue: 100,
        experimentalValue: 64,
        deltaLabel: '-36.0% payload size on dense matrices',
        notes: 'Valid only for canonical integer streams; unverified for arbitrary multimedia blobs.',
      },
      {
        id: 'rd-g44-fold',
        title: 'G44 Locality-Preserving Fold (Mixed JSON Regression)',
        track: 'EXPERIMENTAL_V2',
        sourcePath: 'LeeWay-formula-live/runtime/canonical/leeway-formula/experimental-v2/locality-preserving-fold.mjs',
        status: 'REGRESSION_OBSERVED',
        baselineMetricLabel: 'Small Payload (<4KB) Latency Index',
        baselineValue: 100,
        experimentalValue: 108.4,
        deltaLabel: '+8.4% UNFAVORABLE latency overhead on small JSON',
        notes: 'Honest regression preserved: folding header overhead outweighs savings below 4 KB.',
      },
    ],
  };
}

let memoryState: CoreState | null = null;

export function loadCoreState(): CoreState {
  if (memoryState) return memoryState;
  try {
    if (fs.existsSync(STATE_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')) as CoreState;
      if (parsed && Array.isArray(parsed.customers) && Array.isArray(parsed.workforce)) {
        memoryState = parsed;
        return memoryState;
      }
    }
  } catch {
    // Re-seed if corrupted
  }
  const initial = createInitialState();
  saveCoreState(initial);
  return initial;
}

export function saveCoreState(nextState: CoreState): CoreState {
  nextState.updatedAt = new Date().toISOString();
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmpPath = `${STATE_FILE}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(nextState, null, 2), 'utf8');
  fs.renameSync(tmpPath, STATE_FILE);
  memoryState = nextState;
  return memoryState;
}

export function appendReceipt(
  state: CoreState,
  actionType: string,
  actor: string,
  targetId: string,
  summary: string,
  payload: unknown
): ReceiptEntry {
  const entry: ReceiptEntry = {
    receiptId: `RCP-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`,
    timestamp: new Date().toISOString(),
    actionType,
    actor,
    targetId,
    summary,
    sha256: sha256(payload),
    veritasState: 'NOT_VERIFIED_EXTERNALLY',
  };
  state.receipts = [entry, ...state.receipts].slice(0, 200);
  return entry;
}

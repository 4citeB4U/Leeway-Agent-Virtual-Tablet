/**
 * Canonical workforce-first product lifecycle instruction set for the Agent VT.
 *
 * This is a retrievable operating policy, not model-weight training and not an
 * execution authority. Agent Lee or another runtime may acknowledge it only via
 * an authorized runtime adapter and evidence-bearing execution receipt.
 */
export const CANONICAL_LIFECYCLE_PLAYBOOK = {
  id: 'leeway.agent-lee.product-lifecycle.workforce-first.v1',
  version: '1.0.0',
  source: {
    repository: '4citeB4U/LeeWay-Standards',
    pullRequest: 73,
    commit: '8bf2446479fd6b6989a44fa1b9f932d13f22aa7a',
    status: 'DRAFT_UNMERGED'
  },
  state: 'TABLET_PLAYBOOK_REGISTERED_RUNTIME_BINDING_UNCONFIGURED',
  governingGate: ['MODEL', 'WORK', 'TEST', 'CONTRARY_EVIDENCE', 'REVIEW'],
  durableProductRecord: ['WHO', 'WHAT', 'WHEN', 'WHERE', 'WHY', 'HOW'],
  operatingRules: [
    'Establish the durable 5W1H product record before lifecycle work is admitted.',
    'Build and qualify the workforce before assigning product work.',
    'Use Blackboard for coordination and evidence handoff only; it never grants execution authority.',
    'Route work through the application that owns the capability and preserve job, artifact, version, and evidence references.',
    'Stop at an unavailable adapter or missing authorization rather than inventing execution, completion, receipts, or production proof.',
    'Treat source tests as source evidence only; require physical or production evidence for corresponding claims.'
  ],
  workforceSequence: [
    'EMPLOYMENT_AND_HIRING',
    'ONBOARDING_AND_IDENTITY',
    'ROSTER_READINESS',
    'TASK_SKILLS_AND_PERMISSIONS',
    'BLACKBOARD_COORDINATION',
    'CAPABILITY_ROUTING',
    'EXECUTION_AND_EVIDENCE',
    'INTEGRATION_AND_VERIFICATION',
    'PRODUCTION_REPLICATION_AND_IMPROVEMENT'
  ],
  lifecycle: [
    ['01', 'IDEA_AND_DISCOVERY', '5W1H, product identity, customer hypothesis, assumptions, and discovery evidence.'],
    ['02', 'PLAN_AND_DESIGN', 'Requirements, business case, architecture, roadmap, risks, and acceptance criteria.'],
    ['03', 'WORKFORCE_FIRST', 'Employment, onboarding, readiness, task-specific skills, permissions, and accountable roles.'],
    ['04', 'BUILD_AND_ENGINEER', 'Capability-routed Office, IDE, Content Foundry, CRM and ERP work packages.'],
    ['05', 'TEST_AND_VALIDATE', 'Model, Work, Test, Contrary Evidence, Review; defects and qualification.'],
    ['06', 'PREPARE_AND_LAUNCH', 'Packaging, market readiness, pricing rationale, support, and release approval.'],
    ['07', 'OPERATE_AND_SUPPORT', 'Approved production, monitoring, customer operations, maintenance, and recovery.'],
    ['08', 'REPLICATE_AND_TRAIN', 'Reproducible packages, onboarding, training, restoration, and controlled transfer.'],
    ['09', 'IMPROVE', 'Feedback, incident learning, controlled updates, and lifecycle review.']
  ]
} as const;

export type CanonicalLifecyclePlaybook = typeof CANONICAL_LIFECYCLE_PLAYBOOK;

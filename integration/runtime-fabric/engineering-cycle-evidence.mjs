/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.DIGITAL_WORKFORCE.VERIFICATION
TAG: WORKFORCE.TEN_STAGE_ENGINEERING_EVIDENCE_REVIEW_V1
5WH: WHAT=Check completeness of the existing ten-stage LeeWay engineering history;
WHY=Prevent undocumented tasks from being represented as production-qualified;
WHO=LeeWay Digital Workforce; WHERE=integration/runtime-fabric/engineering-cycle-evidence.mjs;
WHEN=2026-10-27; HOW=Pure source-evidence preflight without creating authority.
AUTHORITY: Documentation preflight only, NOT independent Veritas or Receipt Authority.
LICENSE: MIT.
*/
export const ENGINEERING_STAGES = Object.freeze([
  'Investigate', 'Diagnose', 'Plan', 'Implement', 'Test',
  'Validate', 'Repair', 'Retest', 'Verify', 'Evidence'
]);
const sha = (v) => typeof v === 'string' && /^[a-f0-9]{40}$/.test(v);
const evidenceLink = (ref) => typeof ref === 'string' &&
  /^https:\/\/github\.com\/4citeB4U\/[A-Za-z0-9_.-]+\/(?:issues|pull|commit|actions|blob)\/[^\s]+$/.test(ref);
export function inspectEngineeringCycle(record) {
  const gaps = [];
  if (!record || typeof record !== 'object') {
    return { status: 'BLOCKED_ENGINEERING_EVIDENCE', missing: ['RECORD_REQUIRED'],
      independentVeritasAccepted: false, productionAuthorized: false, learningAdmitted: false };
  }
  if (typeof record.workId !== 'string' || !/^[a-zA-Z0-9._:-]{3,128}$/.test(record.workId)) gaps.push('WORK_ID');
  if (record.source?.repository !== '4citeB4U/LeeWay-Digital-Workforce' || !sha(record.source?.baseCommit)) {
    gaps.push('CANONICAL_SOURCE_PIN');
  }
  if (!evidenceLink(record.missionIssue)) gaps.push('OWNING_MISSION_ISSUE');
  if (!Array.isArray(record.stages) || record.stages.length !== ENGINEERING_STAGES.length) {
    gaps.push('TEN_STAGES_REQUIRED');
  }
  let prior = -Infinity;
  ENGINEERING_STAGES.forEach((name, index) => {
    const step = record.stages?.[index];
    if (!step || step.stage !== name) {
      gaps.push('STAGE_' + name.toUpperCase() + '_MISSING_OR_OUT_OF_ORDER');
      return;
    }
    if (step.status !== 'DONE' && step.status !== 'NOT_REQUIRED') {
      gaps.push('STAGE_' + name.toUpperCase() + '_INCOMPLETE'); return;
    }
    const instant = Date.parse(step.completedAt);
    if (!Number.isFinite(instant) || instant < prior) gaps.push('STAGE_' + name.toUpperCase() + '_CHRONOLOGY');
    else prior = instant;
    if (step.status === 'NOT_REQUIRED') {
      const priorPassed = name === 'Repair'
        ? record.stages?.[4]?.result === 'PASS' && record.stages?.[5]?.result === 'PASS'
        : name === 'Retest' && record.stages?.[6]?.status === 'NOT_REQUIRED';
      if (!priorPassed || typeof step.reason !== 'string' || step.reason.trim().length < 15) {
        gaps.push('STAGE_' + name.toUpperCase() + '_EXEMPTION_INVALID');
      }
    } else if (!Array.isArray(step.evidence) || !step.evidence.some(evidenceLink)) {
      gaps.push('STAGE_' + name.toUpperCase() + '_PROOF_MISSING');
    }
  });
  return {
    status: gaps.length ? 'BLOCKED_ENGINEERING_EVIDENCE' : 'READY_FOR_INDEPENDENT_VERITAS',
    missing: gaps,
    independentVeritasAccepted: false, productionAuthorized: false,
    learningAdmitted: false, canonicalReceiptCreated: false
  };
}

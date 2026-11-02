/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.DIGITAL_WORKFORCE.TESTS
TAG: WORKFORCE.ENGINEERING_EVIDENCE_NEGATIVE_TEST_V1
5WH: WHAT=Test ten-stage document preflight and bypass denial; WHY=No stage-less Veritas promotion;
WHO=LeeWay Digital Workforce; WHERE=integration/runtime-fabric/engineering-cycle-evidence.test.mjs;
WHEN=2026-10-27; HOW=Node test runner with invented fixture records explicitly TEST_ONLY;
AUTHORITY=TEST_ONLY, no production proof, signer or ledger access; LICENSE=MIT.
*/
import test from 'node:test';
import assert from 'node:assert/strict';
import {ENGINEERING_STAGES,inspectEngineeringCycle} from './engineering-cycle-evidence.mjs';
function valid() {
  const missionIssue='https://github.com/4citeB4U/LeeWay-Digital-Workforce/issues/5';
  return {
    workId:'C3-WORKFORCE-FIXTURE-001',
    missionIssue,
    source:{repository:'4citeB4U/LeeWay-Digital-Workforce',
      baseCommit:'83bfcd976655a41e4422dda7abf27b730c5bfe4d'},
    stages:ENGINEERING_STAGES.map((stage, index)=>({
      stage, status:'DONE', result:'PASS',
      completedAt:new Date(Date.UTC(2026,9,27,18,index)).toISOString(),
      evidence:[missionIssue]
    }))
  };
}
test('complete chronological sourced history is eligible only for independent Veritas review',()=>{
  const r=inspectEngineeringCycle(valid());
  assert.equal(r.status,'READY_FOR_INDEPENDENT_VERITAS');
  assert.equal(r.independentVeritasAccepted,false);
  assert.equal(r.productionAuthorized,false);
  assert.equal(r.canonicalReceiptCreated,false);
  assert.equal(r.learningAdmitted,false);
});
test('missing or out-of-order stages block without destroying history',()=>{
  for(const bad of [
    (r)=>r.stages.splice(1,1),
    (r)=>{r.stages[0].stage='Test';},
    (r)=>{r.stages[5].evidence=[];},
    (r)=>{r.stages[4].status='PENDING';},
    (r)=>{r.stages[8].completedAt='2020-01-01T00:00:00Z';},
    (r)=>{r.source.baseCommit='arbitrary';}
  ]){
    const x=valid();bad(x);const r=inspectEngineeringCycle(x);
    assert.equal(r.status,'BLOCKED_ENGINEERING_EVIDENCE');
    assert.ok(r.missing.length>0);
  }
});
test('repair and retest exemptions are explicit, justified and constrained',()=>{
  const x=valid();
  for(const stage of [6,7]) {
    x.stages[stage].status='NOT_REQUIRED';
    x.stages[stage].reason='First-pass validation passed with no corrective patch.';
    x.stages[stage].evidence=[];
  }
  assert.equal(inspectEngineeringCycle(x).status,'READY_FOR_INDEPENDENT_VERITAS');
  x.stages[4].result='FAIL';
  assert.equal(inspectEngineeringCycle(x).status,'BLOCKED_ENGINEERING_EVIDENCE');
});
test('fixture record cannot impersonate an independent Veritas decision',()=>{
  const x=valid();
  x.verified=true;x.productionAuthorized=true;x.learningAdmitted=true;
  const result=inspectEngineeringCycle(x);
  assert.equal(result.productionAuthorized,false);
  assert.equal(result.independentVeritasAccepted,false);
  assert.equal(result.learningAdmitted,false);
});

/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.AGENT_TABLET.INTEGRATION.TEST
TAG: LEEWAY.TABLET.MODEL_HUB_LOGISTICS_APP_SURFACES.V1
5WH:
WHAT = Guard the tablet's source-linked Model Hub and Logistics app entries.
WHY = Prevent missing applications or false model, location, or Device Bridge claims.
WHO = LeeWay Tablet source reviewers.
WHERE = integration/runtime-fabric/bridge-apps-source-contract.test.mjs
WHEN = 2026-11-05
HOW = Deterministic source assertions; no model requests or device probes.
AUTHORIZED_ROLES: Source-only; no capability authorization.
LICENSE: Existing repository terms.
*/
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const root=new URL('../../',import.meta.url);
const read=path=>readFileSync(new URL(path,root),'utf8');
const t=read('apps/agent-tablet/src/types.ts');
const destination=read('apps/agent-tablet/src/components/TabletDestination.tsx');
const app=read('apps/agent-tablet/src/App.tsx');
test('both existing LeeWay products appear under the authorized Apps destination',()=>{
 for(const [id,title] of [['modelHub','LeeWay Model Hub'],['logistics','LeeWay Logistics']]){
  assert.ok(t.includes("| '"+id+"'"),id+' app type');
  assert.ok(destination.includes("onOpen('"+id+"')"),id+' app launch');
  assert.ok(destination.includes(title),id+' product name');
  assert.ok(app.includes("currentApp === '"+id+"'"),id+' panel');
 }
 assert.ok(destination.includes("destination === 'apps'"));
});
test('only source-grounded internal product site URLs are used without secrets',()=>{
 assert.ok(app.includes('https://4citeb4u.github.io/LeeWay-Model-Hub/'));
 assert.ok(app.includes('https://4citeb4u.github.io/LEEWAY-LOGISTICS-/'));
 assert.ok(app.includes('rel="noopener noreferrer"'));
 assert.ok(app.includes('referrerPolicy="no-referrer"'));
 assert.ok(!app.includes('MODEL_HUB_TOKEN'));
});
test('catalog is not falsely promoted to inference and maps require permission',()=>{
 assert.ok(app.includes('GitHub Pages does not host model inference'));
 assert.ok(app.includes('training/demo fallback')===false || app.includes('Training/demo fallback'));
 assert.ok(app.includes("allow={currentApp === 'logistics' ? 'geolocation' : undefined}"));
 assert.ok(app.includes('owner-authorized Runtime/Device Bridge access'));
 assert.ok(!destination.includes('PRODUCTION_VERIFIED'));
});

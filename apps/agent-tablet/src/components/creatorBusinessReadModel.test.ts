/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.AGENT_TABLET.CREATOR_BUSINESS_READ.TEST
TAG: LEEWAY.TABLET.ORIGINAL_CREATOR_CUSTOMER_OVERVIEW_NEGATIVE_V1
5WH:
WHAT = Test strict authenticated original Runtime customer read model in the Tablet.
WHY = Never render an unverified extension/customer-facing business list, fake metrics or private device content.
WHO = Creator-authorized outside contributor, not Agent Lee or independent Veritas.
WHERE = apps/agent-tablet/src/components/creatorBusinessReadModel.test.ts.
WHEN = 2026-11-24.
HOW = Pure TypeScript parser tests with synthetic Runtime payload fixtures; no live customer data.
LICENSE = Existing repository terms.
*/
import test from 'node:test';
import assert from 'node:assert/strict';
import {parseCreatorBusinessOverview} from './creatorBusinessReadModel';
function valid(){
 return {
  schema:'leeway.creator.business-overview.v1',
  authority:'ORIGINAL_RUNTIME_CRM_ERP',
  status:'VERIFIED',grant:'CRM_ERP_CREATOR_BUSINESS_READ',
  verifiedCreator:true,businessTenantRef:'creator-business-001',
  observedAt:'2026-11-24T12:00:00Z',
  counts:{invitationsIssued:4,invitationsRedeemed:2,verifiedAccounts:2,
   registeredContacts:2,enrolledDevices:3,activeAccounts:2,marketingOptIns:1},
  customers:[{contactRef:'contact:0011',accountRef:'account:0011',
   displayName:'Customer One',verifiedEmail:'Customer@Example.com',
   accountStatus:'ACTIVE',edition:'PERSONAL',marketingAllowed:false,
   enrolledDeviceCount:2,bridgeEnrollment:'ENROLLED',
   registeredAt:'2026-11-24T12:00:00Z',lastVerifiedDeviceAt:null}],
  nextCursor:null,cachePolicy:'NO_STORE',
  monitoringScope:'CUSTOMER_ACCOUNT_AND_DEVICE_REGISTRATION_STATUS_ONLY',
  privateContentAccess:false,extensionDeviceCommands:false
 };
}
test('Creator readback shows verified account counts and customer emails, not device content',()=>{
 const data=parseCreatorBusinessOverview(valid());
 assert.equal(data.counts.verifiedAccounts,2);
 assert.equal(data.customers[0].verifiedEmail,'customer@example.com');
 assert.equal(data.customers[0].enrolledDeviceCount,2);
 assert.equal(data.privateContentAccess,false);
 assert.equal(data.extensionDeviceCommands,false);
});
test('customer/self-declared Creator claims cannot satisfy original Runtime schema',()=>{
 for(const patch of [
  {verifiedCreator:false},{status:'BROWSER_APPROVED'},
  {authority:'GITHUB_PAGES'},{grant:'CUSTOMER_READ'},
  {privateContentAccess:true},{extensionDeviceCommands:true},
  {monitoringScope:'FULL_REMOTE_SCREEN'}
 ])assert.throws(()=>parseCreatorBusinessOverview({...valid(),...patch}),/READBACK_UNVERIFIED/);
});
test('unverified email, missing account grants, fake device status and hostile fields deny entire directory',()=>{
 const sample=valid(),first=sample.customers[0];
 for(const patch of [
  {verifiedEmail:'plain-broken-email'}, {accountStatus:'MASTER'},
  {bridgeEnrollment:'CAMERA_ACTIVE'}, {enrolledDeviceCount:-9},
  {marketingAllowed:'YES'}, {lastVerifiedDeviceAt:'not-a-real-date'}
 ])assert.throws(()=>parseCreatorBusinessOverview({
  ...sample,customers:[{...first,...patch}]
 }),/READBACK_UNVERIFIED/);
});
test('duplicate accounts and oversized user pages are rejected',()=>{
 const data=valid();
 assert.throws(()=>parseCreatorBusinessOverview({
  ...data,customers:[data.customers[0],data.customers[0]]
 }),/READBACK_UNVERIFIED/);
 assert.throws(()=>parseCreatorBusinessOverview({
  ...data,customers:Array.from({length:101},()=>({...data.customers[0],accountRef:'account:some'+Math.random()}))
 }),/READBACK_UNVERIFIED/);
});
test('aggregate source counts and cursor must be bounded and truthful',()=>{
 for(const counts of [{...valid().counts,verifiedAccounts:-1},
  {...valid().counts,activeAccounts:1.5},{...valid().counts,enrolledDevices:'infinite'}])
   assert.throws(()=>parseCreatorBusinessOverview({...valid(),counts}),/READBACK_UNVERIFIED/);
 assert.throws(()=>parseCreatorBusinessOverview({...valid(),nextCursor:'https://attacker.example/'}),/READBACK_UNVERIFIED/);
});

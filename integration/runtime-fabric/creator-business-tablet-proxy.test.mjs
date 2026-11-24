/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.TABLET.RUNTIME_CREATOR_BUSINESS_PROXY.TEST
TAG: LEEWAY.TABLET.ORIGINAL_CREATOR_BUSINESS_SERVER_PROXY_NEGATIVE_V1
5WH:
WHAT = Test original Runtime secure Creator business relay, HTTPS origin, token scope failure and no leaking customer data to extension.
WHY = Tablet must request all business records through its authenticated backend rather than trusting a public CRM iframe.
WHO = Creator-authorized source tester, NOT Agent Lee/Veritas; synthetic HTTP responses only.
WHERE = integration/runtime-fabric/creator-business-tablet-proxy.test.mjs.
WHEN = 2026-11-24.
HOW = Node unit tests using injected mock fetch with exact original-runtime URL and 401/403/redirect/oversized denial.
LICENSE = Existing repository terms.
*/
import test from 'node:test';
import assert from 'node:assert/strict';
import {
 resolveOriginalCreatorBusinessUrl,createOriginalCreatorBusinessTabletProxy
} from './creator-business-tablet-proxy.mjs';
const original='https://leeway-runtime.example.org/';
const token='a'.repeat(60);
test('route can target only configured HTTPS original Runtime with fixed Creator business API',()=>{
 assert.equal(resolveOriginalCreatorBusinessUrl(original),
  'https://leeway-runtime.example.org/api/creator/business/overview');
 assert.equal(resolveOriginalCreatorBusinessUrl(original,'cursor_page_00001'),
  'https://leeway-runtime.example.org/api/creator/business/overview?cursor=cursor_page_00001');
 for(const origin of [
  'http://leeway-runtime.example.org/','https://localhost/',
  'http://127.0.0.1:4001/','https://10.0.0.1/',
  'https://leeway-runtime.example.org/private',
  'https://leeway-runtime.example.org/?token=secret',
  'https://user:password@leeway-runtime.example.org/'
 ])assert.throws(()=>resolveOriginalCreatorBusinessUrl(origin),/ORIGINAL_RUNTIME_ORIGIN_INVALID/);
 assert.throws(()=>resolveOriginalCreatorBusinessUrl(original,'https://evil.example/'),/PAGE_CURSOR_INVALID/);
});
test('Creator Tablet forwards existing bearer to only original Runtime, never browser extension',async()=>{
 const calls=[];
 const proxy=createOriginalCreatorBusinessTabletProxy({fetchImpl:async (url,opts)=>{
  calls.push({url,opts});
  return {status:200,ok:true,redirected:false,url,
   headers:{get:()=> 'application/json; charset=utf-8'},
   text:async()=>JSON.stringify({schema:'original'})};
 }});
 const out=await proxy.read({origin:original,bearer:token});
 assert.equal(out.schema,'original');
 assert.equal(calls.length,1);
 assert.equal(calls[0].opts.headers.authorization,'Bearer '+token);
 assert.equal(calls[0].opts.cache,'no-store');
 assert.equal(calls[0].opts.redirect,'error');
 assert.equal(calls[0].opts.referrerPolicy,'no-referrer');
 assert.equal(calls[0].opts.method,'GET');
 assert.equal(calls[0].url,'https://leeway-runtime.example.org/api/creator/business/overview');
});
test('missing local Zitadel session blocks before any upstream call',async()=>{
 let called=false;
 const proxy=createOriginalCreatorBusinessTabletProxy({fetchImpl:async()=>{
  called=true;throw Error('SHOULD_NOT_CALL');
 }});
 await assert.rejects(()=>proxy.read({origin:original,bearer:'password'}),/SIGNED_ZITADEL_SESSION_REQUIRED/);
 assert.equal(called,false);
});
test('customer 403 and unauthenticated 401 remain denied',async()=>{
 for(const status of [401,403]){
  const proxy=createOriginalCreatorBusinessTabletProxy({fetchImpl:async url=>({
   status,ok:false,url,redirected:false,headers:{get:()=> 'application/json'},
   text:async()=> '{}'
  })});
  await assert.rejects(()=>proxy.read({origin:original,bearer:token}),/RUNTIME_CREATOR_SCOPE_DENIED/);
 }
});
test('invalid content type, redirects and oversized business responses fail closed',async()=>{
 const variants=[
   {status:200,ok:true,redirected:true,headers:{get:()=> 'application/json'},text:async()=> '{}'},
   {status:200,ok:true,redirected:false,headers:{get:()=> 'text/html'},text:async()=> '<script></script>'},
   {status:200,ok:true,redirected:false,headers:{get:()=> 'application/json'},text:async()=> 'x'.repeat(140000)}
 ];
 for(const variant of variants){
  const proxy=createOriginalCreatorBusinessTabletProxy({fetchImpl:async url=>({...variant,url})});
  await assert.rejects(()=>proxy.read({origin:original,bearer:token}),/UNAVAILABLE|OVERSIZED/);
 }
});
test('cannot configure a new bearer-accepting provider with invalid dependencies',()=>{
 assert.throws(()=>createOriginalCreatorBusinessTabletProxy({fetchImpl:null}),/PROXY_DEPENDENCIES_INVALID/);
});

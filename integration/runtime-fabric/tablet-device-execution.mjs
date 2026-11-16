/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.AGENT.TABLET.EXECUTION.CLIENT
TAG: LEEWAY.TABLET.RUNTIME.EXECUTE.MCP.CLIENT.V1
5WH:
WHAT = Call the existing Runtime Fabric Device Bridge execution tool from the authenticated Tablet server.
WHY = Replace the read-only-only Tablet design without introducing a second executor.
WHO = Creator and authorized LeeWay Tablet engineering contributors.
WHERE = integration/runtime-fabric/tablet-device-execution.mjs.
WHEN = 2026-11-16.
HOW = Validate an explicit command, use the caller's scoped bearer and trusted MCP resource, fail closed and preserve upstream proof status.
LICENSE = Existing repository terms retained.
*/
import {resolveWorkforceMcpConfig, scopedBearerFromAuthorization} from './workforce-runtime-mcp.mjs';

const TOOL = 'bridge_device_window_control';
const PROTOCOL = '2025-06-18';
const MAX_RESPONSE = 131072;
const MAX_TARGET = 4096;
const ACTIONS = new Set(['list','observe','input','submit','read','invoke']);
const deny = reason => Object.freeze({state:'BLOCKED',reason,executed:false,veritasVerified:false,receiptAdmitted:false,learningAdmitted:false});
const own = (v,k) => Object.prototype.hasOwnProperty.call(v,k);
const plain = v => v && typeof v==='object' && !Array.isArray(v) && Object.getPrototypeOf(v)===Object.prototype;
const safeCode = s => typeof s==='string' && /^[A-Z][A-Z0-9_]{1,95}$/.test(s) ? s : 'UPSTREAM_DENIED';

export function validateTabletExecutionRequest(body) {
 if (!plain(body)||Object.keys(body).some(k=>!['deviceId','action','target','text'].includes(k))) return null;
 const {deviceId,action,target,text}=body;
 if(typeof deviceId!=='string'||! /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(deviceId)||!ACTIONS.has(action)||!plain(target))return null;
 if(Buffer.byteLength(JSON.stringify(target),'utf8')>MAX_TARGET)return null;
 if(Object.keys(target).some(k=>! /^[A-Za-z][A-Za-z0-9]{0,63}$/.test(k)))return null;
 if(typeof target.app!=='string'||target.app.length<1||target.app.length>128)return null;
 if(Object.values(target).some(v=> !(v===null||typeof v==='boolean'||(typeof v==='string'&&v.length<=2048)||(typeof v==='number'&&Number.isSafeInteger(v)))))return null;
 if(action==='observe'&&(!Number.isSafeInteger(target.pid)||target.pid<1))return null;
 if(['input','submit','read'].includes(action)&&(!Number.isSafeInteger(target.pid)||target.pid<1||typeof target.observationId!=='string'||typeof target.targetId!=='string'))return null;
 if(action==='input'&&(typeof text!=='string'||!text.length||text.length>8192))return null;
 if(action!=='input'&&text!==undefined)return null;
 if(action==='submit'&&(typeof target.actionTargetId!=='string'||! /^[a-f0-9]{64}$/.test(String(target.expectedTextSha256||''))))return null;
 return {deviceId,action,target,...(action==='input'?{text}:{})};
}

async function readJsonRpc(response,id) {
 if(!response||response.status!==200)throw Error('RUNTIME_HTTP_REJECTED');
 const contentType=String(response.headers?.get('content-type')||'');
 if(!/application\/json|text\/event-stream/i.test(contentType))throw Error('RUNTIME_CONTENT_TYPE_REJECTED');
 if(!response.body?.getReader)throw Error('RUNTIME_RESPONSE_UNAVAILABLE');
 const reader=response.body.getReader();
 const chunks=[];let bytes=0;
 try {
   while(true){const {done,value}=await reader.read();if(done)break;bytes+=value.byteLength;if(bytes>MAX_RESPONSE)throw Error('RUNTIME_RESPONSE_OVERSIZE');chunks.push(value);}
 } finally {try{await reader.cancel();}catch{}reader.releaseLock();}
 const raw=Buffer.concat(chunks.map(v=>Buffer.from(v))).toString('utf8');
 const events=contentType.includes('text/event-stream')?raw.split(/\r?\n\r?\n/).map(block=>block.split(/\r?\n/).filter(v=>v.startsWith('data:')).map(v=>v.slice(5).trim()).join('\n')).filter(Boolean):[raw];
 for(const item of events){if(item==='[DONE]')continue;let payload;try{payload=JSON.parse(item);}catch{continue;}
   if(payload?.jsonrpc==='2.0'&&payload.id===id)return payload;
 }
 throw Error('RUNTIME_RPC_UNMATCHED');
}

export async function invokeTabletBridgeExecution({env=process.env,bearer,body,fetchImpl=globalThis.fetch,timeoutMs=12000}={}) {
 const request=validateTabletExecutionRequest(body);
 if(!request)return deny('EXECUTION_REQUEST_INVALID');
 if(!scopedBearerFromAuthorization('Bearer '+String(bearer||'')))return deny('OWNER_TOKEN_REQUIRED');
 const configured=resolveWorkforceMcpConfig({...env,LEEWAY_WORKFORCE_MCP_ACCESS_TOKEN:bearer});
 if(!configured.ok)return deny(configured.reason);
 const deadline=AbortSignal.timeout(Math.min(20000,Math.max(500,timeoutMs)));
 let session='';
 const rpc=async(method,params,id)=>{
   const headers={'authorization':'Bearer '+bearer,'content-type':'application/json',
    'accept':'application/json, text/event-stream','mcp-protocol-version':PROTOCOL};
   if(session)headers['mcp-session-id']=session;
   const payload={jsonrpc:'2.0',method,...(params===undefined?{}:{params}),...(id===undefined?{}:{id})};
   const response=await fetchImpl(configured.resource,{method:'POST',redirect:'error',headers,
     body:JSON.stringify(payload),signal:deadline});
   const assigned=response.headers?.get('mcp-session-id');
   if(assigned){if(!/^[A-Za-z0-9._-]{1,160}$/.test(assigned)||(session&&assigned!==session))throw Error('RUNTIME_SESSION_CHANGED');session=assigned;}
   if(id===undefined){if(![200,202,204].includes(response.status))throw Error('RUNTIME_INITIALIZED_REJECTED');await response.body?.cancel?.().catch(()=>{});return null;}
   const r=await readJsonRpc(response,id);
   if(r.error||!plain(r.result))throw Error('RUNTIME_TOOL_RPC_DENIED');
   return r.result;
 };
 try {
   const initialized=await rpc('initialize',{protocolVersion:PROTOCOL,capabilities:{},clientInfo:{name:'leeway-agent-tablet-execute',version:'1.0.0'}},1);
   if(!initialized.serverInfo||!initialized.capabilities)throw Error('RUNTIME_INITIALIZE_INVALID');
   await rpc('notifications/initialized',{},undefined);
   const listing=await rpc('tools/list',{},2);
   const matching=Array.isArray(listing.tools)?listing.tools.find(t=>t.name===TOOL):null;
   if(!matching||matching.annotations?.readOnlyHint!==false)return deny('EXECUTION_TOOL_NOT_ADVERTISED');
   const result=await rpc('tools/call',{name:TOOL,arguments:request},3);
   if(result.isError!==false&&result.isError!==undefined)return deny('EXECUTION_TOOL_REJECTED');
   if(!Array.isArray(result.content))return deny('EXECUTION_RESULT_MISSING');
   const item=result.content.find(x=>x?.type==='text'&&typeof x.text==='string');
   if(!item||Buffer.byteLength(item.text,'utf8')>MAX_RESPONSE)return deny('EXECUTION_RESULT_MISSING');
   let upstream;try{upstream=JSON.parse(item.text);}catch{return deny('EXECUTION_RESULT_INVALID');}
   if(upstream?.ok===false)return deny(safeCode(upstream.error));
   if(!plain(upstream)||!plain(upstream.result))return deny('EXECUTION_RESULT_INVALID');
   // The Runtime owns execution/admission; Tablet never converts transport success into independent proof.
   return {state:'UPSTREAM_OPERATION_REPORTED',executed:true,deviceId:request.deviceId,
      result:upstream.result,receipt:upstream.receipt??null,
      upstreamExecution:upstream.execution??'NOT_PROBED',veritasVerified:false,
      receiptAdmitted:false,learningAdmitted:false};
 } catch {
   return deny('RUNTIME_EXECUTION_UNAVAILABLE_OR_REJECTED');
 }
}

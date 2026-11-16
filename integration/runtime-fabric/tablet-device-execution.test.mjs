/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.AGENT.TABLET.INTEGRATION.TEST
TAG: LEEWAY.TABLET.DEVICE.EXECUTION.CLIENT.TEST.V1
5WH:
WHAT = Test the Tablet's execute-scoped Device Bridge client and denial behavior.
WHY = Ensure read-only token paths, missing tools and malformed requests never become execution success.
WHO = LeeWay Tablet reviewers and Creator.
WHERE = integration/runtime-fabric/tablet-device-execution.test.mjs.
WHEN = 2026-11-16.
HOW = In-memory MCP protocol fixture and negative cases; does not qualify real device execution.
LICENSE = Existing repository terms retained.
*/
import test from 'node:test';
import assert from 'node:assert/strict';
import {invokeTabletBridgeExecution,validateTabletExecutionRequest} from './tablet-device-execution.mjs';

const URL='https://runtime.example.com/mcp';
const ENV={LEEWAY_WORKFORCE_MCP_RESOURCE_URL:URL};
const TOKEN='qualified-fixture-token';
const body={deviceId:'workstation.example',action:'list',target:{app:'chatgpt'}};
const response=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:{'content-type':'application/json'}});

function fixture({advertised=true,remoteError=false,scopeDenied=false,mode='json'}={}) {
  const seen=[];
  const fetchImpl=async(url,options)=>{
    assert.equal(url,URL);
    assert.equal(options.redirect,'error');
    assert.equal(options.headers.authorization,'Bearer '+TOKEN);
    const req=JSON.parse(options.body);
    seen.push({method:req.method,params:req.params});
    if(req.method==='notifications/initialized')return new Response('',{status:202});
    const result=req.method==='initialize'?
      {protocolVersion:'2025-06-18',capabilities:{tools:{}},serverInfo:{name:'leeway-runtime-fabric'}}:
      req.method==='tools/list'?
        {tools:advertised?[{name:'bridge_device_window_control',annotations:{readOnlyHint:false}}]:[{name:'runtime_health',annotations:{readOnlyHint:true}}]}:
      {isError:scopeDenied,content:[{type:'text',text:JSON.stringify(scopeDenied?
        {ok:false,error:'LEEWAY_BRIDGE_EXECUTION_OWNER_SCOPE_REQUIRED'}:
        remoteError?{ok:false,error:'LEEWAY_BRIDGE_UPSTREAM_ADMISSION_DENIED'}:
        {deviceId:'workstation.example',result:{windows:[{pid:123,title:'ChatGPT',processName:'ChatGPT'}]},execution:'UPSTREAM_RECEIPT_BOUND',receipt:{authority:'CONTROLLER_OBSERVATION'}})}]};
    const envelope={jsonrpc:'2.0',id:req.id,result};
    if(mode==='sse')return new Response('event: message\ndata: '+JSON.stringify(envelope)+'\n\n',{headers:{'content-type':'text/event-stream'}});
    return response(envelope);
  };
  return {seen,fetchImpl};
}
test('rejects invalid actions and missing observation-bound composer target',()=>{
  assert.equal(validateTabletExecutionRequest({...body,action:'shell'}),null);
  assert.equal(validateTabletExecutionRequest({...body,deviceId:'../../etc'}),null);
  assert.equal(validateTabletExecutionRequest({...body,action:'input',text:'hello'}),null);
  assert.equal(validateTabletExecutionRequest({...body,target:{app:'chatgpt',__proto__:null}})?.action,'list');
  assert.equal(validateTabletExecutionRequest({...body,target:{app:'chatgpt',pid:7},action:'observe'})?.action,'observe');
  assert.equal(validateTabletExecutionRequest({...body,target:{app:'chatgpt',pid:7,observationId:'obs',targetId:'t'},action:'input',text:'hello'})?.action,'input');
  assert.equal(validateTabletExecutionRequest({...body,extra:true}),null);
});
test('executes only a listed write-capable Runtime tool with caller token and no self-certified Veritas',async()=>{
 const {seen,fetchImpl}=fixture();
 const r=await invokeTabletBridgeExecution({env:ENV,bearer:TOKEN,body,fetchImpl});
 assert.equal(r.state,'UPSTREAM_OPERATION_REPORTED');
 assert.equal(r.executed,true);
 assert.equal(r.veritasVerified,false);
 assert.equal(r.receiptAdmitted,false);
 assert.equal(r.learningAdmitted,false);
 assert.equal(r.result.windows[0].title,'ChatGPT');
 assert.deepEqual(seen.map(x=>x.method),['initialize','notifications/initialized','tools/list','tools/call']);
 assert.equal(seen[3].params.name,'bridge_device_window_control');
 assert.equal(JSON.stringify(r).includes(TOKEN),false);
});
test('SSE Runtime MCP can return actual upstream observation without upgrading proof',async()=>{
 const r=await invokeTabletBridgeExecution({env:ENV,bearer:TOKEN,body,fetchImpl:fixture({mode:'sse'}).fetchImpl});
 assert.equal(r.state,'UPSTREAM_OPERATION_REPORTED');
 assert.equal(r.veritasVerified,false);
});
test('missing bearer, unsafe endpoint, missing execute tool never dispatch',async()=>{
 const a=await invokeTabletBridgeExecution({env:ENV,bearer:'',body,fetchImpl:fixture().fetchImpl});
 assert.equal(a.state,'BLOCKED');
 const b=await invokeTabletBridgeExecution({env:{LEEWAY_WORKFORCE_MCP_RESOURCE_URL:'http://localhost/mcp'},bearer:TOKEN,body,fetchImpl:fixture().fetchImpl});
 assert.equal(b.state,'BLOCKED');
 const {seen,fetchImpl}=fixture({advertised:false});
 const c=await invokeTabletBridgeExecution({env:ENV,bearer:TOKEN,body,fetchImpl});
 assert.equal(c.reason,'EXECUTION_TOOL_NOT_ADVERTISED');
 assert.equal(seen.some(x=>x.method==='tools/call'),false);
});
test('remote execution denial and scope denial never promoted to success',async()=>{
 for(const variant of [{scopeDenied:true},{remoteError:true}]){
  const r=await invokeTabletBridgeExecution({env:ENV,bearer:TOKEN,body,fetchImpl:fixture(variant).fetchImpl});
  assert.equal(r.state,'BLOCKED');
  assert.equal(r.executed,false);
  assert.equal(r.veritasVerified,false);
 }
});

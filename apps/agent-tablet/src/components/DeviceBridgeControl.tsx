/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.AGENT.TABLET.DEVICE.CONTROL
TAG: LEEWAY.TABLET.DEVICE.BRIDGE.WINDOW.CONTROL.V1
5WH:
WHAT = Give the Tablet user an explicit draft-and-send control bound to observed native windows.
WHY = Replace observation-only UX with governed Device Bridge execution.
WHO = Creator and Tablet user; execution authority remains the original Runtime Fabric/Device Bridge.
WHERE = apps/agent-tablet/src/components/DeviceBridgeControl.tsx.
WHEN = 2026-11-16.
HOW = Separate list, observe, draft input and submit clicks; block on missing upstream evidence.
LICENSE = Existing repository terms retained.
*/
import React, { useState } from 'react';

type WindowItem = {pid: number; title: string; processName: string};
type Target = {targetId: string; name: string; automationId?: string};
type Observation = {pid: number; observationId: string; editableTargets: Target[]; actionTargets: Target[]; expiresInMs?: number};
type Report = {state?: string; reason?: string; result?: Record<string,unknown>; upstreamExecution?: string; receipt?: unknown};
const isObj = (x: unknown): x is Record<string,unknown> => Boolean(x) && typeof x==='object' && !Array.isArray(x);

export function DeviceBridgeControl() {
  const [deviceId,setDeviceId]=useState('');
  const [app,setApp]=useState('');
  const [expectedUrl,setExpectedUrl]=useState('');
  const [windows,setWindows]=useState<WindowItem[]>([]);
  const [observation,setObservation]=useState<Observation|null>(null);
  const [targetId,setTargetId]=useState('');
  const [actionTargetId,setActionTargetId]=useState('');
  const [message,setMessage]=useState('hello');
  const [textSha256,setTextSha256]=useState('');
  const [status,setStatus]=useState('NOT_CONNECTED');
  const [busy,setBusy]=useState(false);
  const [lastEvidence,setLastEvidence]=useState<string|null>(null);
  const reset=()=>{setWindows([]);setObservation(null);setTargetId('');setActionTargetId('');setTextSha256('');setLastEvidence(null);setStatus('TARGET_CHANGED_REOBSERVE_REQUIRED');};

  const execute=async(action:'list'|'observe'|'input'|'submit',target:Record<string,unknown>,text?:string):Promise<Report|null>=>{
    setBusy(true);setLastEvidence(null);
    try {
      const response=await fetch('/api/device-bridge/execute',{
        method:'POST',credentials:'same-origin',
        headers:{'Content-Type':'application/json','X-LeeWay-User-Intent':'execute-click'},
        body:JSON.stringify({deviceId,action,target,...(text===undefined?{}:{text})})
      });
      const data=await response.json() as Report;
      if(!response.ok||data.state!=='UPSTREAM_OPERATION_REPORTED'){
        setStatus(data.reason||'EXECUTION_NOT_AUTHORIZED_OR_UNAVAILABLE');
        return null;
      }
      setStatus('UPSTREAM_OPERATION_REPORTED_NOT_INDEPENDENTLY_VERIFIED');
      setLastEvidence(JSON.stringify({state:data.state,upstreamExecution:data.upstreamExecution,receiptPresent:!!data.receipt,result:data.result},null,2).slice(0,5000));
      return data;
    } catch {setStatus('RUNTIME_EXECUTION_CONNECTION_FAILED');return null;}
    finally {setBusy(false);}
  };

  const list=async()=>{
    reset();
    if(!deviceId.trim()||!app.trim()){setStatus('DEVICE_AND_APP_REQUIRED');return;}
    const value=await execute('list',{app:app.trim()});
    const raw=value?.result?.windows;
    if(!Array.isArray(raw)){setStatus('WINDOW_LIST_READBACK_MISSING');return;}
    const items=raw.filter(isObj).filter(v=>Number.isSafeInteger(v.pid)&&typeof v.title==='string'&&typeof v.processName==='string')
      .map(v=>({pid:Number(v.pid),title:String(v.title),processName:String(v.processName)})).slice(0,30);
    setWindows(items);
    setStatus(items.length?'WINDOWS_OBSERVED_SELECT_EXACT_PROCESS':'NO_WINDOWS_OBSERVED');
  };
  const observe=async(pid:number)=>{
    setObservation(null);setTargetId('');setActionTargetId('');setTextSha256('');
    const target={app:app.trim(),pid,...(expectedUrl.trim()?{expectedUrl:expectedUrl.trim()}:{})};
    const value=await execute('observe',target);
    const raw=value?.result;
    if(!raw||typeof raw.observationId!=='string'||!Array.isArray(raw.editableTargets)||!Array.isArray(raw.actionTargets)){
      setStatus('OBSERVATION_NOT_VERIFIED');return;
    }
    setObservation({pid,observationId:raw.observationId,editableTargets:raw.editableTargets as Target[],actionTargets:raw.actionTargets as Target[],expiresInMs:Number(raw.expiresInMs||0)});
    setStatus('OBSERVED_CHOOSE_COMPOSER_AND_SEND_CONTROL');
  };
  const input=async()=>{
    if(!observation||!targetId||!message.trim()){setStatus('EXACT_COMPOSER_AND_TEXT_REQUIRED');return;}
    setTextSha256('');
    const value=await execute('input',{app:app.trim(),pid:observation.pid,observationId:observation.observationId,targetId},message);
    const hash=value?.result?.textSha256;
    if(typeof hash!=='string'||! /^[a-f0-9]{64}$/.test(hash)){setStatus('INPUT_READBACK_NOT_CONFIRMED');return;}
    setTextSha256(hash);
    setStatus('DRAFT_INPUT_REPORTED_REVIEW_BEFORE_SEND');
  };
  const submit=async()=>{
    if(!observation||!targetId||!actionTargetId||!textSha256){setStatus('SUBMISSION_REQUIRES_OBSERVED_INPUT_AND_SEND_CONTROL');return;}
    const value=await execute('submit',{app:app.trim(),pid:observation.pid,observationId:observation.observationId,targetId,actionTargetId,expectedTextSha256:textSha256});
    if(value?.result?.submitted===true){setStatus('SEND_INVOKED_RESPONSE_NOT_YET_VERIFIED');setTextSha256('');}
    else {setStatus('SUBMISSION_NOT_CONFIRMED');}
  };

  return <section className="space-y-3 rounded-lg border border-cyan-800 p-3 text-xs" aria-label="Device Bridge execution controls">
    <p className="text-zinc-300">Owner-initiated actions use the existing authenticated Runtime Fabric and Device Bridge. No command runs merely by opening this panel.</p>
    <button type="button" className="rounded bg-cyan-900 px-3 py-2 font-bold" onClick={()=>{window.location.assign('/api/auth/start?mode=execute');}}>
      Connect / authorize device execution
    </button>
    <label className="block">Registered device identity
      <input className="mt-1 w-full rounded border border-zinc-700 bg-zinc-950 p-2" value={deviceId} onChange={e=>{setDeviceId(e.target.value);reset();}} placeholder="Choose enrolled device ID" />
    </label>
    <label className="block">Authorized application / worker
      <input className="mt-1 w-full rounded border border-zinc-700 bg-zinc-950 p-2" value={app} onChange={e=>{setApp(e.target.value);reset();}} placeholder="Use registered worker surface ID" />
    </label>
    <label className="block">Expected browser URL (required for browser targets)
      <input className="mt-1 w-full rounded border border-zinc-700 bg-zinc-950 p-2" value={expectedUrl} onChange={e=>{setExpectedUrl(e.target.value);reset();}} placeholder="https://…" />
    </label>
    <button type="button" disabled={busy} onClick={()=>void list()} className="rounded bg-sky-900 px-3 py-2 disabled:opacity-40">1. Discover windows</button>
    {windows.length>0&&<div className="space-y-2">
      <p>Select a real observed process (never the first arbitrary editable field).</p>
      {windows.map(w=><button type="button" key={w.pid} disabled={busy} onClick={()=>void observe(w.pid)}
        className="block w-full rounded border border-zinc-700 p-2 text-left disabled:opacity-40">2. Observe PID {w.pid} — {w.title}</button>)}
    </div>}
    {observation&&<div className="space-y-2 border-t border-zinc-700 pt-3">
      <label className="block">Observed editable composer
        <select value={targetId} onChange={e=>{setTargetId(e.target.value);setTextSha256('');}} className="mt-1 w-full bg-zinc-950 p-2">
          <option value="">Select exact composer</option>
          {observation.editableTargets.map(v=><option key={v.targetId} value={v.targetId}>{v.name||v.automationId||v.targetId}</option>)}
        </select>
      </label>
      <label className="block">Message (draft only, no automatic Send)
        <input className="mt-1 w-full border border-zinc-700 bg-zinc-950 p-2" value={message} onChange={e=>{setMessage(e.target.value);setTextSha256('');}} maxLength={8192} />
      </label>
      <button type="button" disabled={busy||!targetId||!message} onClick={()=>void input()} className="rounded bg-sky-900 px-3 py-2 disabled:opacity-40">3. Type draft and request readback</button>
      {textSha256&&<>
        <label className="block">Observed Send control
          <select className="mt-1 w-full bg-zinc-950 p-2" value={actionTargetId} onChange={e=>setActionTargetId(e.target.value)}>
            <option value="">Select exact Send button</option>
            {observation.actionTargets.map(v=><option key={v.targetId} value={v.targetId}>{v.name||v.automationId||v.targetId}</option>)}
          </select>
        </label>
        <button type="button" disabled={busy||!actionTargetId} onClick={()=>void submit()} className="rounded bg-amber-800 px-3 py-2 font-bold disabled:opacity-40">4. Explicitly Send drafted message</button>
      </>}
    </div>}
    <div role="status" className="rounded border border-zinc-700 bg-zinc-950 p-2">Status: {status}</div>
    {lastEvidence&&<details><summary>Upstream observation (not independent Veritas)</summary><pre className="mt-2 max-h-56 overflow-auto whitespace-pre-wrap break-all text-[10px]">{lastEvidence}</pre></details>}
  </section>;
}

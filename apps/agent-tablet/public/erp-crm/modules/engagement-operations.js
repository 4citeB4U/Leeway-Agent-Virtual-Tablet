/* REGION: LEEWAY_CRM_ENGAGEMENT
 * TAG: LEEWAY-CRM-ENGAGEMENT-001
 * WHAT: Browser-local Voice Capture, Today's Route, and Campaigns
 * WHY: Preserve canonical ERP/CRM while adding bounded engagement capabilities
 * WHO: LeeWay Industries / authorized maintainers
 * WHERE: modules/engagement-operations.js
 * WHEN: 2026-11-02
 * HOW: Explicit user actions and local browser persistence; no claimed provider connectivity
 * LICENSE: Apache-2.0
 */
(function () {
  'use strict';
  const KEY = 'leeway.crm.engagement.v1';
  let state;
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || '{}');
    state = { routes: Array.isArray(parsed.routes) ? parsed.routes : [], campaigns: Array.isArray(parsed.campaigns) ? parsed.campaigns : [] };
  } catch (_) { state = {routes:[],campaigns:[]}; }
  const el = x => document.getElementById(x);
  const value = x => (el(x)?.value || '').trim();
  const safe = x => String(x ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const makeId = () => crypto.randomUUID();
  const persist = () => { try { localStorage.setItem(KEY,JSON.stringify(state)); return true; } catch(e) { alert('Unable to store record: '+e.message); return false; } };
  const date = () => value('lw-route-date') || new Date().toLocaleDateString('en-CA');
  window.lwAddRoute = () => {
    if (!value('lw-route-title')) return alert('Enter a route stop or event.');
    const r = {id:makeId(), title:value('lw-route-title'), date:date(), time:value('lw-route-time'), priority:value('lw-route-priority'), place:value('lw-route-place'), done:false};
    state.routes.push(r); if(persist()) { el('lw-route-title').value=''; lwRenderRoutes(); }
  };
  window.lwRenderRoutes = () => {
    const box=el('lw-route-list'); if(!box) return;
    const rows=state.routes.filter(x=>x.date===date()).sort((a,b)=>a.time.localeCompare(b.time));
    box.replaceChildren();
    if(!rows.length) {box.textContent='No scheduled events for this date.';return;}
    for(const r of rows) {
      const line=document.createElement('div'); line.className='p-3 bg-slate-950 border border-slate-700 rounded-lg flex justify-between gap-3';
      const info=document.createElement('span');info.textContent=(r.done?'✓ ':'')+(r.time||'Unscheduled')+' · '+r.priority+' · '+r.title+' — '+r.place;
      const done=document.createElement('button');done.className='text-cyan-300 underline';done.textContent=r.done?'Reopen':'Complete';done.onclick=()=>{r.done=!r.done;if(persist())lwRenderRoutes();};
      line.append(info,done);box.append(line);
    }
  };
  window.lwSaveCampaign = () => {
    if(!value('lw-campaign-name'))return alert('Enter a campaign name.');
    const c={id:makeId(),name:value('lw-campaign-name'),channel:value('lw-campaign-channel'),audience:value('lw-campaign-audience'),date:value('lw-campaign-date'),content:value('lw-campaign-content'),status:'draft'};
    state.campaigns.unshift(c);if(persist())lwRenderCampaigns();
  };
  window.lwRenderCampaigns = () => {
    const box=el('lw-campaign-list');if(!box)return;box.replaceChildren();
    if(!state.campaigns.length){box.textContent='No campaign drafts.';return;}
    for(const c of state.campaigns) {
      const line=document.createElement('div');line.className='p-4 bg-slate-950 border border-slate-700 rounded-lg space-y-2';
      const title=document.createElement('strong');title.textContent=c.name+' · '+c.channel+' · DRAFT';
      const meta=document.createElement('div');meta.className='text-slate-400';meta.textContent='Audience: '+c.audience+' · Planned: '+(c.date||'Unscheduled');
      const message=document.createElement('p');message.className='whitespace-pre-wrap';message.textContent=c.content;
      const exportBtn=document.createElement('button');exportBtn.textContent='Export draft';exportBtn.className='text-cyan-300 underline';
      exportBtn.onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(c,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='leeway-campaign-'+c.id+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);};
      line.append(title,meta,message,exportBtn);box.append(line);
    }
  };
  let recorder=null, stream=null, chunks=[], activeMeta=null;
  const openDb=()=>new Promise((resolve,reject)=>{const req=indexedDB.open('leeway_voice_capture_v1',1);req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains('recordings'))req.result.createObjectStore('recordings',{keyPath:'id'});};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});
  async function allAudio(){const db=await openDb();return new Promise((res,rej)=>{const q=db.transaction('recordings').objectStore('recordings').getAll();q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error);});}
  async function storeAudio(record){const db=await openDb();return new Promise((res,rej)=>{const tx=db.transaction('recordings','readwrite');tx.objectStore('recordings').put(record);tx.oncomplete=res;tx.onerror=()=>rej(tx.error);});}
  function voiceStatus(text){if(el('lw-voice-status'))el('lw-voice-status').textContent=text;}
  window.lwStartCapture=async()=>{
    if(recorder)return;
    if(!el('lw-voice-consent')?.checked)return alert('Recording authorization and participant consent must be confirmed.');
    if(!navigator.mediaDevices?.getUserMedia||typeof MediaRecorder==='undefined')return voiceStatus('Requires a supported browser on HTTPS or localhost.');
    try{
      stream=await navigator.mediaDevices.getUserMedia({audio:true});
      activeMeta={id:makeId(),title:value('lw-voice-title')||'Untitled recording',link:value('lw-voice-link'),createdAt:new Date().toISOString()};
      const kind=['audio/webm;codecs=opus','audio/webm','audio/mp4'].find(x=>MediaRecorder.isTypeSupported(x));
      recorder=new MediaRecorder(stream,kind?{mimeType:kind}:undefined);chunks=[];
      recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
      recorder.onstop=async()=>{
        try {const blob=new Blob(chunks,{type:recorder.mimeType||'audio/webm'});if(!blob.size)throw Error('No audio recorded');await storeAudio({...activeMeta,blob,mime:blob.type,size:blob.size});voiceStatus('Saved locally in this browser. Not uploaded or synchronized.');await lwRenderRecordings();}
        catch(e){voiceStatus('Recording save failed: '+e.message);}
        finally{stream?.getTracks().forEach(t=>t.stop());stream=null;recorder=null;chunks=[];el('lw-voice-start').disabled=false;el('lw-voice-stop').disabled=true;}
      };
      recorder.start();el('lw-voice-start').disabled=true;el('lw-voice-stop').disabled=false;voiceStatus('Recording microphone input.');
    }catch(e){stream?.getTracks().forEach(t=>t.stop());stream=null;recorder=null;voiceStatus('Microphone unavailable: '+e.message);}
  };
  window.lwStopCapture=()=>{if(recorder?.state==='recording')recorder.stop();};
  window.lwRenderRecordings=async()=>{
    const box=el('lw-recordings');if(!box)return;
    try{
      const recordings=await allAudio();box.replaceChildren();
      if(!recordings.length){box.textContent='No local recordings.';return;}
      for(const r of recordings){
        const row=document.createElement('div');row.className='p-3 bg-slate-950 border border-slate-700 rounded-lg flex justify-between gap-2';
        const name=document.createElement('span');name.textContent=r.title+' · '+r.createdAt+' · '+(r.link||'No CRM record attached');
        const a=document.createElement('button');a.className='text-cyan-300 underline';a.textContent='Download audio';
        a.onclick=()=>{const u=URL.createObjectURL(r.blob);const link=document.createElement('a');link.href=u;link.download='leeway-audio-'+r.id+(r.mime.includes('mp4')?'.m4a':'.webm');link.click();setTimeout(()=>URL.revokeObjectURL(u),2000);};
        row.append(name,a);box.append(row);
      }
    }catch(e){box.textContent='Audio store unavailable: '+e.message;}
  };
  document.addEventListener('DOMContentLoaded',()=>{
    const d=el('lw-route-date');if(d)d.value=new Date().toLocaleDateString('en-CA');
    lwRenderRoutes();lwRenderCampaigns();lwRenderRecordings();
  });
})();

/*
LEEWAY HEADER - DO NOT REMOVE
REGION: LEEWAY.VT.EDITOR
TAG: VT.EDITOR.EXISTING.WORKSPACE.V1
5WH: WHAT = Editor tab in existing VT; WHY = Operable composition, not another application;
WHO = LeeWay Industries / Agent Lee; WHERE = Agent VT; WHEN = 2026-10-06;
HOW = Actual HyperFrames SDK/Player, existing sandbox files and Blackboard navigation.
AUTHORIZED ROLES: OWNER_LOCAL_EDIT / PREVIEW; no live-agent, Formula, render or promotion claims.
LICENSE: MIT; upstream HyperFrames remains separately attributed.
*/
import React,{useEffect,useRef,useState} from 'react';
import '@hyperframes/player';
import {EditorSession,newComposition,type EditorEdit} from './composition-session';
import './editor.css';
import {previewDocument} from './preview-document';
type View=ReturnType<EditorSession['snapshot']>;
type Player=HTMLElement & {play:()=>void;pause:()=>void;seek:(time:number)=>void;iframeElement:HTMLIFrameElement;ready:boolean};
type Props={files:Record<string,string>;onSave:(path:string,html:string,expected:string|null)=>void;onOpenBlackboard:()=>void;onOpenDiagnostics:()=>void;visible:boolean};
export function LeeWayEditor({files,onSave,onOpenBlackboard,onOpenDiagnostics,visible}:Props){
 const session=useRef<EditorSession|null>(null),host=useRef<HTMLDivElement|null>(null),player=useRef<Player|null>(null),loadSequence=useRef(0),saved=useRef<string|null>(null);
 const [view,setView]=useState<View|null>(null),[filePath,setFilePath]=useState('/workspace/untitled.hf.html'),[selection,setSelection]=useState('hf-title'),[text,setText]=useState(''),[start,setStart]=useState('0'),[duration,setDuration]=useState('10'),[fontSize,setFontSize]=useState('72');
 const [notice,setNotice]=useState('Create or open a composition. Existing sandbox and agent controls remain in their own tabs.'),[error,setError]=useState(''),[ready,setReady]=useState(false),[time,setTime]=useState(0),[dirty,setDirty]=useState(false),[review,setReview]=useState<string[]>([]);
 const layer=view?.layers.find(x=>x.id===selection);
 useEffect(()=>{if(layer){setText(layer.text);setStart(String(layer.start));setDuration(String(layer.duration));setFontSize(String(layer.fontSize));}},[layer?.id,view?.revision]);
 useEffect(()=>{
  const p=document.createElement('hyperframes-player') as Player;p.setAttribute('muted','');p.setAttribute('low-power-idle','');p.style.cssText='display:block;width:100%;aspect-ratio:16/9';
  const onReady=()=>{setReady(true);p.seek(0);};const onTime=(e:Event)=>setTime(Number((e as CustomEvent).detail?.currentTime)||0);
  const onError=(e:Event)=>{setReady(false);setError(String((e as CustomEvent).detail?.message||'Preview runtime failed'));};
  p.addEventListener('ready',onReady);p.addEventListener('timeupdate',onTime);p.addEventListener('error',onError);host.current?.appendChild(p);player.current=p;
  return()=>{loadSequence.current++;p.pause();p.remove();session.current?.dispose();};
 },[]);
 useEffect(()=>{if(view&&player.current){setReady(false);player.current.setAttribute('width',String(view.width));player.current.setAttribute('height',String(view.height));player.current.setAttribute('srcdoc',previewDocument(view.html));player.current.style.aspectRatio=`${view.width}/${view.height}`;}},[view?.html]);
 useEffect(()=>{if(!visible)player.current?.pause();},[visible]);
 useEffect(()=>{const leave=(e:BeforeUnloadEvent)=>{if(dirty){e.preventDefault();e.returnValue='';}};window.addEventListener('beforeunload',leave);return()=>window.removeEventListener('beforeunload',leave);},[dirty]);
 async function open(html:string,path:string,original:string|null){
  const sequence=++loadSequence.current;setError('');try{const next=await EditorSession.open(html);if(sequence!==loadSequence.current){next.dispose();return;}session.current?.dispose();session.current=next;saved.current=original;setFilePath(path);setView(next.snapshot());setSelection('hf-title');setDirty(original===null);setReview([]);setNotice(original===null?'New local composition. Save to add it to your VT sandbox.':'Opened the existing sandbox composition.');}catch(e){setError((e as Error).message);}
 }
 function apply(edit:EditorEdit){try{if(!session.current||!view)return;setView(session.current.apply(edit,view.revision));setDirty(true);setError('');setReview([]);}catch(e){setError((e as Error).message);}}
 function history(direction:'undo'|'redo'){if(!session.current)return;setView(session.current[direction]());setDirty(true);setError('');setReview([]);}
 function save(){if(!view)return;try{if(!/^\/workspace\/[a-zA-Z0-9_-]{1,80}\.hf\.html$/.test(filePath))throw new Error('Use /workspace/name.hf.html with letters, numbers, hyphens or underscores.');onSave(filePath,view.html,saved.current);saved.current=view.html;setDirty(false);setNotice('Saved and read back from the existing VT sandbox. This is not Continuum promotion.');setError('');}catch(e){setError((e as Error).message);}}
 function reviewLayout(){
  try{
   const doc=player.current?.iframeElement?.contentDocument;
   const root=doc?.querySelector('[data-composition-id]') as HTMLElement|null;
   if(!doc||!root||!ready){setError('Preview must be ready before measuring layout.');return;}
   const bounds=root.getBoundingClientRect(),results:string[]=[];let measured=0;
   for(const el of [...root.querySelectorAll('.clip')]){
    const h=el as HTMLElement,r=h.getBoundingClientRect();
    if(!r.width||!r.height||getComputedStyle(h).visibility==='hidden')continue;measured++;
    const name=h.getAttribute('data-name')||h.id;
    if(h.scrollWidth>h.clientWidth+1||h.scrollHeight>h.clientHeight+1)results.push(name+': text exceeds its box.');
    if(r.left<bounds.left-1||r.top<bounds.top-1||r.right>bounds.right+1||r.bottom>bounds.bottom+1)results.push(name+': outside the composition bounds.');
   }
   setReview(!measured?['No visible elements could be measured at this frame.']:
    results.length?results:['No overflow found in '+measured+' visible elements. This bounded frame check is not design approval or accessibility certification.']);
  }catch(e){setError('Layout evidence unavailable: '+(e as Error).message);}
 }
 function download(){if(!view)return;const a=document.createElement('a'),url=URL.createObjectURL(new Blob([view.html],{type:'text/html'}));a.href=url;a.download=filePath.split('/').pop()||'composition.hf.html';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 return <section className="leeway-editor" aria-label="LeeWay Editor" hidden={!visible}>
  <header className="le-editor-head"><div><strong>LeeWay Editor</strong><p>Agent VT / local composition workspace</p></div><nav aria-label="Existing workstation controls"><button onClick={onOpenBlackboard}>Agent Blackboard</button><button onClick={onOpenDiagnostics}>Diagnostics</button></nav></header>
  <div className="le-editor-toolbar">
   <button onClick={()=>{if(dirty&&!window.confirm('Discard the unsaved composition?'))return;void open(newComposition(),`/workspace/composition-${Date.now()}.hf.html`,null);}}>New composition</button>
   <label>Open sandbox file<select aria-label="Open sandbox composition" value="" onChange={e=>{const p=e.target.value;if(!p)return;if(dirty&&!window.confirm('Discard unsaved edits?'))return;void open(files[p],p,files[p]);}}><option value="">Choose saved composition</option>{Object.keys(files).filter(p=>p.endsWith('.hf.html')).map(p=><option key={p} value={p}>{p}</option>)}</select></label>
   <button disabled={!view?.canUndo} onClick={()=>history('undo')}>Undo</button><button disabled={!view?.canRedo} onClick={()=>history('redo')}>Redo</button>
   <button disabled={!view} onClick={save}>Save to sandbox</button><button disabled={!view} onClick={download}>Download composition</button>
  </div>
  <div role="status" className="le-editor-status">{dirty?'Unsaved edits. ':''}{notice}</div>{error&&<div role="alert" className="le-editor-error">{error}</div>}
  <div className="le-editor-workarea">
   <div className="le-editor-stage"><div className="le-editor-preview" ref={host} aria-label="Composition preview" />{!view&&<p className="le-editor-empty">Create a composition to edit real text, timing and typography with HyperFrames.</p>}
    <div className="le-editor-playback"><button disabled={!ready} onClick={()=>player.current?.play()}>Play preview</button><button disabled={!ready} onClick={()=>player.current?.pause()}>Pause preview</button><label>Playhead<input aria-label="Preview time" type="range" min="0" max={view?.duration||10} step="0.1" value={time} disabled={!ready} onChange={e=>{const t=Number(e.target.value);setTime(t);player.current?.seek(t);}}/></label><output>{time.toFixed(1)} / {view?.duration||0}s</output></div>
    <div className="le-editor-timeline" aria-label="Composition timeline">{view?.layers.map(l=><button key={l.id} aria-pressed={selection===l.id} onClick={()=>setSelection(l.id)}><span>{l.name}</span><span className="le-editor-track"><span style={{marginLeft:`${l.start/view.duration*100}%`,width:`${l.duration/view.duration*100}%`}} /></span><small>{l.start}s + {l.duration}s</small></button>)}</div>
   </div>
   <aside aria-label="Selected element inspector"><h3>Inspector</h3><label>Sandbox file path<input value={filePath} disabled={!view} onChange={e=>{if(saved.current!==null){setError('Rename through the existing sandbox workflow; save-as is not implied.');return;}setFilePath(e.target.value);}}/></label>
    {layer?<><h4>{layer.name}</h4><label>Text<textarea aria-label="Element text" rows={4} maxLength={2000} value={text} onChange={e=>setText(e.target.value)} /></label><button onClick={()=>apply({type:'text',id:selection,text})}>Apply text</button>
     <label>Font size<input aria-label="Font size" type="number" min="12" max="256" value={fontSize} onChange={e=>setFontSize(e.target.value)}/></label><button onClick={()=>apply({type:'fontSize',id:selection,size:Number(fontSize)})}>Apply typography</button>
     <div className="le-editor-timing"><label>Start (seconds)<input aria-label="Clip start" type="number" min="0" step="0.1" value={start} onChange={e=>setStart(e.target.value)}/></label><label>Duration (seconds)<input aria-label="Clip duration" type="number" min="0.01" step="0.1" value={duration} onChange={e=>setDuration(e.target.value)}/></label></div><button onClick={()=>apply({type:'timing',id:selection,start:Number(start),duration:Number(duration)})}>Apply timing</button></>:<p>Select a timeline element.</p>}
    <h3>Design review</h3><button disabled={!ready} onClick={reviewLayout}>Check visible layout</button>{review.map((s,i)=><p key={i}>{s}</p>)}
    <h3>Production</h3><p>Video renderer: UNBOUND. Saving HTML is not a rendered video.</p><button disabled>Render video — provider required</button>
   </aside>
  </div>
  <footer>Local editor only. Pause preview does not stop agents. Use the existing Blackboard and runtime controls; their live execution must be qualified separately.</footer>
 </section>;
}

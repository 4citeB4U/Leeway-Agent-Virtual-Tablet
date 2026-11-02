/*
LEEWAY HEADER - DO NOT REMOVE
REGION: LEEWAY.VT.EDITOR
TAG: VT.EDITOR.COMPOSITION.SESSION.V1
5WH: WHAT = Bounded HyperFrames edits; WHY = One source and reversible edits;
WHO = LeeWay Industries / Agent Lee; WHERE = Existing VT; WHEN = 2026-10-06;
HOW = Real SDK, revision checks and deliberately restricted no-network compositions.
AUTHORIZED ROLES: LOCAL_EDIT / INSPECT; no agent or render authority granted.
LICENSE: MIT; upstream packages retain their licenses.
*/
import {openComposition, type Composition} from '@hyperframes/sdk';
export type EditorEdit = {type:'text';id:string;text:string}|{type:'timing';id:string;start:number;duration:number}|{type:'fontSize';id:string;size:number};
export type EditorLayer = {id:string;name:string;text:string;start:number;duration:number;fontSize:number};
export const PROFILE='leeway-vt-title-v1';
const tags=new Set(['HTML','HEAD','BODY','META','TITLE','DIV','H1','P']);
const attrs=new Set(['lang','charset','name','content','class','id','style','data-hf-id','data-name','data-composition-id','data-start','data-duration','data-width','data-height','data-no-timeline','data-track-index','data-leeway-editor-profile']);
const styles=new Set(['margin-top','margin-right','margin-bottom','margin-left','overflow-x','overflow-y','background-color','background-image','background-position-x','background-position-y','background-size','background-repeat','background-origin','background-clip','background-attachment','margin','width','height','position','overflow','background','color','font-family','font-size','font-weight','line-height','letter-spacing','left','top','overflow-wrap']);
function fail(message:string):never{throw new Error(message);}
const finite=(n:number,min:number,max:number)=>Number.isFinite(n)&&n>=min&&n<=max;
/** Only this title profile is admitted in v1. Arbitrary HTML/media needs a separately qualified asset/sandbox path. */
export function inspectComposition(html:string){
 if(typeof html!=='string'||html.length>100000||!html.trim())fail('COMPOSITION_SIZE_OR_CONTENT_INVALID');
 const doc=new DOMParser().parseFromString(html,'text/html'), nodes=[...doc.querySelectorAll('*')];
 if(nodes.length>200)fail('COMPOSITION_ELEMENT_LIMIT');
 for(const el of nodes){
  if(!tags.has(el.tagName))fail('COMPOSITION_ACTIVE_OR_UNSUPPORTED_ELEMENT');
  for(const a of [...el.attributes])if(!attrs.has(a.name))fail('COMPOSITION_UNSUPPORTED_ATTRIBUTE');
  if(el.tagName==='META'&&!el.hasAttribute('charset')&&el.getAttribute('name')!=='viewport')fail('COMPOSITION_UNSUPPORTED_META');
  const s=(el as HTMLElement).style;
  for(let i=0;i<s.length;i++){const p=s.item(i),v=s.getPropertyValue(p);if(!styles.has(p)||/url\s*\(|expression\s*\(|@|\\/i.test(v))fail('COMPOSITION_UNSUPPORTED_STYLE: '+p);}
 }
 const roots=doc.querySelectorAll('[data-composition-id]');
 if(roots.length!==1||roots[0].getAttribute('data-leeway-editor-profile')!==PROFILE)fail('COMPOSITION_PROFILE_UNSUPPORTED');
 const root=roots[0],width=Number(root.getAttribute('data-width')),height=Number(root.getAttribute('data-height')),duration=Number(root.getAttribute('data-duration'));
 if(!finite(width,240,4096)||!finite(height,240,4096)||!finite(duration,1,300))fail('COMPOSITION_GEOMETRY_INVALID');
 const ids=new Set<string>();for(const el of doc.querySelectorAll('[data-hf-id]')){const id=el.getAttribute('data-hf-id')!;if(!/^[a-zA-Z0-9_-]{1,100}$/.test(id)||ids.has(id))fail('COMPOSITION_ID_INVALID');ids.add(id);}
 const layers:EditorLayer[]=[...root.querySelectorAll('.clip')].map(el=>{
  const id=el.getAttribute('data-hf-id')||'',start=Number(el.getAttribute('data-start')),length=Number(el.getAttribute('data-duration'));
  if(!ids.has(id)||!finite(start,0,duration)||!finite(length,0.01,duration)||start+length>duration+0.000001)fail('CLIP_TIMING_OR_ID_INVALID');
  return{id,name:el.getAttribute('data-name')||id,text:el.textContent||'',start,duration:length,fontSize:parseFloat((el as HTMLElement).style.fontSize)||32};
 });return{width,height,duration,layers};
}
export function newComposition(){return `<!doctype html><html lang="en"><head><meta charset="UTF-8"><title>LeeWay composition</title></head><body style="margin:0"><div data-composition-id="leeway-title" data-hf-id="hf-scene" data-leeway-editor-profile="${PROFILE}" data-width="1280" data-height="720" data-start="0" data-duration="10" data-no-timeline style="width:1280px;height:720px;position:relative;overflow:hidden;background:#18191f;color:#ffffff;font-family:Arial,sans-serif"><p class="clip" data-hf-id="hf-label" data-name="Label" data-start="0" data-duration="10" data-track-index="1" style="position:absolute;left:80px;top:80px;font-size:24px;font-weight:700;letter-spacing:3px;color:#81e6a8;margin:0">LEEWAY / NEW COMPOSITION</p><h1 class="clip" data-hf-id="hf-title" data-name="Title" data-start="0" data-duration="10" data-track-index="2" style="position:absolute;left:80px;top:235px;width:1080px;font-size:72px;line-height:1.1;margin:0;overflow-wrap:break-word">Your story starts here.</h1><p class="clip" data-hf-id="hf-caption" data-name="Caption" data-start="2" data-duration="8" data-track-index="3" style="position:absolute;left:80px;top:490px;width:1080px;font-size:32px;line-height:1.3;margin:0;overflow-wrap:break-word">Edit this text, set its timing, and save it in your existing VT sandbox.</p></div></body></html>`;}
export class EditorSession{
 private comp:Composition;revision=0;
 private constructor(comp:Composition){this.comp=comp;}
 static async open(html:string){inspectComposition(html);return new EditorSession(await openComposition(html));}
 snapshot(){const html=this.comp.serialize();return{html,revision:this.revision,...inspectComposition(html),canUndo:this.comp.canUndo(),canRedo:this.comp.canRedo()};}
 apply(edit:EditorEdit,expectedRevision:number){
  if(expectedRevision!==this.revision)fail('STALE_EDITOR_REVISION');const state=this.snapshot();
  if(!state.layers.some(x=>x.id===edit.id))fail('EDITOR_TARGET_NOT_FOUND');
  if(edit.type==='text'){if(typeof edit.text!=='string'||edit.text.length>2000)fail('EDITOR_TEXT_LIMIT');this.comp.setText(edit.id,edit.text);}
  else if(edit.type==='fontSize'){if(!finite(edit.size,12,256))fail('EDITOR_FONT_SIZE_INVALID');this.comp.setStyle(edit.id,{fontSize:edit.size+'px'});}
  else if(edit.type==='timing'){if(!finite(edit.start,0,state.duration)||!finite(edit.duration,0.01,state.duration)||edit.start+edit.duration>state.duration+0.000001)fail('EDITOR_TIMING_OUT_OF_BOUNDS');this.comp.setTiming(edit.id,{start:edit.start,duration:edit.duration});}
  else fail('EDITOR_OPERATION_UNSUPPORTED');this.revision++;return this.snapshot();
 }
 undo(){if(this.comp.canUndo()){this.comp.undo();this.revision++;}return this.snapshot();}
 redo(){if(this.comp.canRedo()){this.comp.redo();this.revision++;}return this.snapshot();}
 dispose(){this.comp.dispose();}
}

/*
LEEWAY REGION: UI.WINDOWS.LOCAL_PROOF
TAG: LEEWAY.WIDGET.AGENTVT.GOLDEN
WHAT: isolated Agent VT side tab + true native floating window
WHY: test approved Pocket pattern without changing Golden Package
WHO: Creator / Agent Lee
WHERE: E:\LeeWay-Work\agent-vt-golden-widget-proof
WHEN: 2026-10-11
HOW: Electron BrowserWindow native host and bounded controls
LICENSE: MIT
*/
const {app,BrowserWindow,ipcMain,screen,webFrameMain}=require('electron');
const fs=require('fs'),path=require('path'),http=require('http'),{spawn}=require('child_process'),{URL:NodeUrl}=require('url');
// The approved exterior is one coin.  Electron's process-wide lock prevents a
// second launch from creating another coin or resurrecting the retired AGENT VT
// edge tab alongside the active tablet host.
if(!app.requestSingleInstanceLock()){
  app.exit(0);
}
const userDataPath=path.join(__dirname,'.userData');try{fs.mkdirSync(userDataPath,{recursive:true});}catch{}app.setPath('userData',userDataPath);
const LOCAL_TABLET_ROOT=process.env.LEEWAY_AGENT_TABLET_ROOT||'E:/LeeWay-Work/AGENT-LEE-FLOATING-WIDGET-TEST/work/agent-virtual-tablet-target/apps/agent-tablet';
const TABLET_PORT=Number(process.env.LEEWAY_AGENT_TABLET_PORT||3217);
const URL=`http://127.0.0.1:${TABLET_PORT}/`;
const LOCAL_OFFICE_ROOT=process.env.LEEWAY_OFFICE_ROOT||'E:/LeeWay-Work/AGENT-LEE-FLOATING-WIDGET-TEST/work/published-app-sources/Leeway-office-suites';
const OFFICE_PORT=Number(process.env.LEEWAY_OFFICE_PORT||3221);
const OFFICE_URL=`http://127.0.0.1:${OFFICE_PORT}/`;
// Model Hub's proven 3D visual stage is a preserved, source-controlled
// presentation artifact.  The public catalog remains the Model Hub service
// authority; this local binding restores the actual HARDLINE 3D widget that
// was previously qualified for the native tablet surface.  A deployment may
// replace the bootstrap path without changing the app identity.
const MODEL_HUB_3D_SOURCE=process.env.LEEWAY_MODEL_HUB_3D_SOURCE||'E:/LeeWay-Work/AGENT-LEE-FLOATING-WIDGET-TEST/work/hardline-3d-widget-test-20261013/restore-recorded-overview-evidence/index-native-models-brain-contract.html';
let localTabletServer=null,localOfficeServer=null;
function probeLocalTabletServer(){return new Promise(resolve=>{const req=http.get(`http://127.0.0.1:${TABLET_PORT}/api/health`,res=>{res.resume();resolve(Boolean(res.statusCode&&res.statusCode>=200&&res.statusCode<500));});req.on('error',()=>resolve(false));req.setTimeout(700,()=>{req.destroy();resolve(false);});});}
async function ensureLocalTabletServer(){
  const distEntry=path.join(LOCAL_TABLET_ROOT,'dist','server.cjs');
  if(!fs.existsSync(distEntry))throw new Error(`LOCAL_AGENT_TABLET_BUILD_MISSING: ${distEntry}`);
  if(await probeLocalTabletServer())return {state:'REUSED',url:URL};
  localTabletServer=spawn(process.execPath,[distEntry],{cwd:LOCAL_TABLET_ROOT,env:{...process.env,PORT:String(TABLET_PORT)},stdio:'ignore',windowsHide:true});
  for(let i=0;i<40;i++){if(await probeLocalTabletServer())return {state:'STARTED',url:URL,pid:localTabletServer.pid};await new Promise(resolve=>setTimeout(resolve,250));}
  throw new Error('LOCAL_AGENT_TABLET_SERVER_START_TIMEOUT');
}
function probeLocalOfficeServer(){return new Promise(resolve=>{const req=http.get(`${OFFICE_URL}api/health`,res=>{res.resume();resolve(Boolean(res.statusCode&&res.statusCode>=200&&res.statusCode<500));});req.on('error',()=>resolve(false));req.setTimeout(700,()=>{req.destroy();resolve(false);});});}
async function ensureLocalOfficeServer(){
  const entry=path.join(LOCAL_OFFICE_ROOT,'server.ts'),tsx=path.join(LOCAL_OFFICE_ROOT,'node_modules','tsx','dist','cli.mjs');
  if(!fs.existsSync(entry)||!fs.existsSync(tsx))throw new Error(`LOCAL_OFFICE_SESSION_HOST_MISSING: ${LOCAL_OFFICE_ROOT}`);
  if(await probeLocalOfficeServer())return {state:'REUSED',url:OFFICE_URL};
  // `process.execPath` is electron.exe here, not Node.  Launch the Office
  // TypeScript host with Node so a tablet restart owns the real session host.
  localOfficeServer=spawn(process.env.LEEWAY_NODE_EXECUTABLE||'node',[tsx,entry,'--port',String(OFFICE_PORT)],{cwd:LOCAL_OFFICE_ROOT,env:{...process.env,LEEWAY_DISABLE_HMR:'true'},stdio:'ignore',windowsHide:true});
  for(let i=0;i<40;i++){if(await probeLocalOfficeServer())return {state:'STARTED',url:OFFICE_URL,pid:localOfficeServer.pid};await new Promise(resolve=>setTimeout(resolve,250));}
  throw new Error('LOCAL_OFFICE_SESSION_HOST_START_TIMEOUT');
}
let tab,tablet,rail,opened=false,drag,loaded=false,appWidgetDrag=null;let edgeMonitorId=null,edgeY=null,edgeLock=false;const appWidgets=new Map();const WIDGET_ID='leeway.widget.agent-vt';const EDGE_TAB_ID='leeway.widget.agent-vt.edge-tab';const TABLET_WINDOW_ID='leeway.widget.agent-vt.tablet-window';const TABLET_BEZEL_ID='leeway.widget.agent-vt.tablet-bezel';const CONTROLLER_ID='leeway.widget.agent-vt.controller';const WIDGET_CHROME_VERSION='2.1.0';
const agentLeePresenceCommand=path.resolve(__dirname,'..','agent-lee-sphere-widget-proof','local-interaction-test.json');
function setAgentLeePresence(action){try{fs.writeFileSync(agentLeePresenceCommand,JSON.stringify({action,from:'UnifiedLeeWayCoin',time:Date.now()}));}catch(error){fs.writeFileSync(path.join(__dirname,'agent-lee-presence-command-error.txt'),String(error));}}
const PUBLISHED_APPS=Object.freeze({
  employmentCenter:{title:'LeeWay Digital Employment Center',url:'https://4citeb4u.github.io/LeeWay-Digital-Workforce/',designSize:{width:1440,height:900}},
  continuum:{title:'LeeWay Continuum',url:'https://4citeb4u.github.io/LeeWay-Continuum/',designSize:{width:1440,height:900}},
  agentSkills:{title:'LeeWay Agent Skills',url:'https://4citeb4u.github.io/LeeWay-Agent-Skills/',designSize:{width:1440,height:900}},
  leewayIde:{title:'LeeWay IDE',url:'https://4citeb4u.github.io/leeway-ide/',designSize:{width:1600,height:1000}},
  officeSuite:{title:'LeeWay Office Suites',url:OFFICE_URL,designSize:{width:1440,height:900}},
  logistics:{title:'LeeWay Logistics',url:'https://4citeb4u.github.io/leeway_logistics/#v=2&lat=35.1557&lon=-82.5000&alt=15460975&heading=360&pitch=-90&roll=0&style=normal&bloom=0&sharpen=1&bi=0&bv=2&si=49&hud=tactical&hv=1&dm=DENSE&dd=75&da=elastic&kf=7&ko=1&cr=0&sc=1&scf=11&map=osm&l=&lo=f.e.1_k.o.n&ui=c.c.1_c.p.0_l.c.1_l.p.0_d.c.1_v.c.1_i.c.0_r.c.1_s.c.1_g.c.1_p.c.1_m.c.0',designSize:{width:1600,height:900}},
  contentFoundry:{title:'LeeWay Agentic Content Foundry',url:'https://4citeb4u.github.io/Leeway-agentic-content-foundry/',designSize:{width:1440,height:900}},
  erpCrm:{title:'LeeWay Agentic CRM & ERP',url:'https://4citeb4u.github.io/Leeway-Agentic-CRM-ERP/',designSize:{width:2160,height:1080}},
  agentVision:{title:'Agent Lee Vision',url:'https://4citeb4u.github.io/Leeway-Agent-Lee-Vision/',designSize:{width:900,height:900}},
  voiceFabric:{title:'LeeWay Voice Fabric',url:'https://4citeb4u.github.io/LeeWay-Voice-Fabric/',designSize:{width:1100,height:900}},
  modelHub:{title:'LeeWay Model Hub',url:'https://4citeb4u.github.io/LeeWay-Model-Hub/',sourceFile:MODEL_HUB_3D_SOURCE,designSize:{width:920,height:528}},
  contentVault:{title:'LeeWay Content Vault',url:`${URL}?view=contentVault&leewaySurface=widget`,designSize:{width:1440,height:900}},
  workforce:{title:'LeeWay Workforce Center',url:`${URL}?view=workforce&leewaySurface=widget`,designSize:{width:1440,height:900}},
  notepad:{title:'LeeWay Blackboard',url:`${URL}?view=notepad&leewaySurface=widget`,designSize:{width:1440,height:900}},
  diagnostics:{title:'LeeWay Diagnostics',url:`${URL}?view=diagnostics&leewaySurface=widget`,designSize:{width:1440,height:900}},
  agentRoster:{title:'Agent Lee Roster',url:`${URL}?view=agentRoster&leewaySurface=widget`,designSize:{width:1440,height:900}},
  editor:{title:'LeeWay Editor',url:`${URL}?view=editor&leewaySurface=widget`,designSize:{width:1440,height:900}},
  openNotebook:{title:'LeeWay Open Notebook',url:`${URL}?view=openNotebook&leewaySurface=widget`,designSize:{width:1440,height:900}},
  crm:{title:'LeeWay CRM',url:`${URL}?view=crm&leewaySurface=widget`,designSize:{width:1440,height:900}},
  vscode:{title:'LeeWay Development Workspace',url:`${URL}?view=vscode&leewaySurface=widget`,designSize:{width:1440,height:900}},
  browser:{title:'LeeWay Research Fabric',url:`${URL}?view=browser&leewaySurface=widget`,designSize:{width:1440,height:900}},
  terminal:{title:'LeeWay Terminal Gateway',url:`${URL}?view=terminal&leewaySurface=widget`,designSize:{width:1440,height:900}},
  workboard:{title:'LeeWay Workboard',url:`${URL}?view=workboard&leewaySurface=widget`,designSize:{width:1440,height:900}},
  database:{title:'LeeWay Data Fabric',url:`${URL}?view=database&leewaySurface=widget`,designSize:{width:1440,height:900}},
  pallium:{title:'LeeWay Memory Pallium',url:`${URL}?view=pallium&leewaySurface=widget`,designSize:{width:1440,height:900}},
  preview:{title:'LeeWay Preview',url:`${URL}?view=preview&leewaySurface=widget`,designSize:{width:1440,height:900}},
  apps:{title:'LeeWay Applications',url:`${URL}?view=apps&leewaySurface=widget`,designSize:{width:1440,height:900}},
  standalone:{title:'LeeWay Standalone',url:`${URL}?view=standalone&leewaySurface=widget`,designSize:{width:1440,height:900}},
  federated:{title:'LeeWay Federated',url:`${URL}?view=federated&leewaySurface=widget`,designSize:{width:1440,height:900}},
  digitalBrain:{title:'LeeWay Digital Brain',url:`${URL}brain-ui/brain.html`,designSize:{width:1440,height:900}}
});
function appSurfaceUrl(spec,appId,surface){const url=new NodeUrl(spec.url);url.searchParams.set('leewaySurface',surface);url.searchParams.set('leewaySession',`leeway.app.${appId}`);return url.toString();}
function loadAppSurface(widget,spec,appId){
  const query=`leewaySurface=widget&leewaySession=${encodeURIComponent(`leeway.app.${appId}`)}`;
  if(spec.sourceFile&&fs.existsSync(spec.sourceFile))return widget.loadFile(spec.sourceFile,{query});
  return widget.loadURL(appSurfaceUrl(spec,appId,'widget'));
}
const appWidgetGeometryFile=path.join(__dirname,'app-widget-geometry.json');
let appWidgetGeometry={};
try{appWidgetGeometry=JSON.parse(fs.readFileSync(appWidgetGeometryFile,'utf8'));}catch{}
let suspendedAppWidgets=new Set();
function overlapWithArea(bounds,a){return{width:Math.max(0,Math.min(bounds.x+bounds.width,a.x+a.width)-Math.max(bounds.x,a.x)),height:Math.max(0,Math.min(bounds.y+bounds.height,a.y+a.height)-Math.max(bounds.y,a.y))};}
function displayForWidget(bounds){const displays=screen.getAllDisplays();let best=displays[0],bestArea=-1;for(const display of displays){const overlap=overlapWithArea(bounds,display.workArea),area=overlap.width*overlap.height;if(area>bestArea){best=display;bestArea=area;}}if(bestArea<=0){const centerX=bounds.x+bounds.width/2,centerY=bounds.y+bounds.height/2;let bestDistance=Number.POSITIVE_INFINITY;for(const display of displays){const area=display.workArea,nearestX=Math.max(area.x,Math.min(centerX,area.x+area.width)),nearestY=Math.max(area.y,Math.min(centerY,area.y+area.height)),distance=Math.hypot(centerX-nearestX,centerY-nearestY);if(distance<bestDistance){bestDistance=distance;best=display;}}}return best||screen.getPrimaryDisplay();}
function hasVisibleHandle(bounds){
  const handleX = bounds.x + bounds.width / 2;
  const handleY = bounds.y + 16;
  return screen.getAllDisplays().some(({workArea: a}) => {
    return handleX >= a.x + 35 && handleX <= a.x + a.width - 35 &&
           handleY >= a.y + 8 && handleY <= a.y + a.height - 20;
  });
}
function intersectsDisplay(bounds){
  if (!hasVisibleHandle(bounds)) return false;
  return screen.getAllDisplays().some(({workArea:a})=>{const overlap=overlapWithArea(bounds,a);return overlap.width>=Math.min(160,bounds.width*.35)&&overlap.height>=Math.min(72,bounds.height*.2);});
}
function fitSizeToArea(width,height,area){const scale=Math.min(1,area.width/width,area.height/height);return{width:Math.max(280,Math.round(width*scale)),height:Math.max(180,Math.round(height*scale))};}
function recoverWidgetBounds(bounds,fallbackArea=screen.getPrimaryDisplay().workArea){const proposed=fitSizeToArea(Math.max(280,Number(bounds?.width)||Math.round(fallbackArea.width*.66)),Math.max(180,Number(bounds?.height)||Math.round(fallbackArea.height*.72)),fallbackArea);const candidate={x:Math.round(Number(bounds?.x)||fallbackArea.x),y:Math.round(Number(bounds?.y)||fallbackArea.y),...proposed};if(bounds&&Number.isFinite(bounds.x)&&Number.isFinite(bounds.y)&&intersectsDisplay(candidate))return candidate;const target=displayForWidget(candidate).workArea||fallbackArea,width=Math.min(candidate.width,target.width),height=Math.min(candidate.height,target.height);return{x:target.x+Math.round((target.width-width)/2),y:target.y+Math.round((target.height-height)/2),width,height};}
function persistAppWidgetGeometry(appId,widget){if(!widget||widget.isDestroyed())return;appWidgetGeometry[appId]=widget.getBounds();fs.writeFileSync(appWidgetGeometryFile,JSON.stringify(appWidgetGeometry,null,2));}
function recoverAppWidget(appId,widget){
  if(!widget||widget.isDestroyed())return;
  // A valid user-selected monitor is never an error. Only rehome a widget
  // when it has no meaningful overlap with any currently active display,
  // such as after a monitor is disconnected or its saved bounds are stale.
  if(!intersectsDisplay(widget.getBounds()))widget.setBounds(recoverWidgetBounds(widget.getBounds()));
  persistAppWidgetGeometry(appId,widget);
}
function widgetPresentationCss(){return `html{margin:0!important;width:100%!important;height:100%!important;overflow:hidden!important;background:transparent!important}body{box-sizing:border-box!important;position:fixed!important;inset:5px!important;width:auto!important;height:auto!important;margin:0!important;overflow:hidden!important;border:2px solid #65e7f2!important;border-radius:24px!important;background:#02070b!important;box-shadow:inset 0 0 0 2px #143d59,0 0 22px #22d3ee99!important}/* The Agent VT owns workstation navigation.  Office widgets retain Office tools, never Office's duplicate dock. */footer.agpu-system-dock{display:none!important}#leeway-app-widget-chrome,#leeway-app-widget-chrome *{box-sizing:border-box!important;pointer-events:auto!important}#leeway-app-widget-chrome{display:flex!important;position:fixed!important;z-index:2147483647!important;top:10px!important;left:50%!important;transform:translateX(-50%)!important;align-items:center!important;gap:6px!important;padding:4px 6px!important;border:1px solid #79eaff!important;border-radius:18px!important;background:#052b4af0!important;box-shadow:0 5px 14px #000d,0 0 14px #38caff7a,inset 0 1px #ffffff2e!important;font:800 10px system-ui!important;color:white!important;user-select:none!important}#leeway-app-widget-chrome .leeway-widget-mark{display:inline-flex!important;padding:0 5px!important;color:#8ffcff!important;letter-spacing:.12em!important}#leeway-app-widget-chrome button{display:flex!important;height:25px!important;align-items:center!important;justify-content:center!important;margin:0!important;padding:0 9px!important;border:1px solid #79eaff!important;border-radius:14px!important;background:linear-gradient(180deg,#0e4e78,#073958)!important;color:#fff!important;font:900 10px system-ui!important;letter-spacing:.08em!important;cursor:grab!important}#leeway-app-widget-chrome button:active{transform:translateY(1px) scale(.96)!important}#leeway-app-widget-chrome .leeway-widget-close{width:25px!important;min-width:25px!important;padding:0!important;border-color:#ff9aa3!important;border-radius:50%!important;background:linear-gradient(145deg,#ef3c4e,#8e0719)!important;cursor:pointer!important;font-size:17px!important}`;}
function fitAppWidgetContent(appId,widget){if(!widget||widget.isDestroyed()||widget.webContents.isDestroyed())return;const spec=PUBLISHED_APPS[appId],bounds=widget.getContentBounds(),design=spec.designSize;const zoom=Math.max(.22,Math.min(1.15,(bounds.width-10)/design.width,(bounds.height-10)/design.height));widget.webContents.setZoomFactor(zoom);widget.__leewayZoom=zoom;}
// A published LeeWay app may have exactly one live WebContents.  The floating
// widget owns that instance; the tablet receives its rendered frames and sends
// input back to the same WebContents.  This replaces the former two-page
// BroadcastChannel replay, which could never faithfully carry WebGL, camera,
// canvas, private component state, or arbitrary side-panel transitions.
const appMirrorState = new Map();
function stopAppMirror(appId) {
  const state = appMirrorState.get(appId);
  if (state) {
    if (state.timer) { clearInterval(state.timer); state.timer = null; }
    state.pending = false;
  }
}
async function publishAppMirrorFrame(appId) {
  const widget = appWidgets.get(appId);
  if (!widget || widget.isDestroyed() || !tablet || tablet.isDestroyed()) return;
  const wc = widget.webContents;
  if (!wc || wc.isDestroyed() || !tablet.webContents || tablet.webContents.isDestroyed()) return;

  let state = appMirrorState.get(appId);
  if (!state) {
    state = { capturing: false, pending: false, timer: null };
    appMirrorState.set(appId, state);
  }
  if (state.capturing) {
    state.pending = true;
    return;
  }
  state.capturing = true;

  try {
    const image = await wc.capturePage();
    if (widget.isDestroyed() || wc.isDestroyed() || tablet.isDestroyed() || tablet.webContents.isDestroyed()) return;
    if (image.isEmpty()) return;

    const bounds = widget.getContentBounds();
    const width = Math.max(320, Math.min(1280, bounds.width));
    const ratio = width / Math.max(1, image.getSize().width);
    const height = Math.max(180, Math.round(image.getSize().height * ratio));
    const resized = image.resize({ width, height });
    const payload = {
      appId,
      width: bounds.width,
      height: bounds.height,
      frame: 'data:image/jpeg;base64,' + resized.toJPEG(78).toString('base64'),
      at: Date.now()
    };
    tablet.webContents.send('vt:app-mirror-frame', payload);
  } catch (error) {
    if (!String(error).includes('destroyed')) {
      fs.writeFileSync(path.join(__dirname, 'app-mirror-' + appId + '-error.txt'), String(error));
    }
  } finally {
    state.capturing = false;
    if (state.pending) {
      state.pending = false;
      setImmediate(() => { void publishAppMirrorFrame(appId); });
    }
  }
}
function startAppMirror(appId) {
  stopAppMirror(appId);
  let state = appMirrorState.get(appId);
  if (!state) {
    state = { capturing: false, pending: false, timer: null };
    appMirrorState.set(appId, state);
  }
  void publishAppMirrorFrame(appId);
  state.timer = setInterval(() => {
    if (!tablet || tablet.isDestroyed()) {
      stopAppMirror(appId);
      return;
    }
    void publishAppMirrorFrame(appId);
  }, 66);
  state.timer.unref?.();
}
function forwardAppMirrorInput(appId, input) {
  const widget = appWidgets.get(appId);
  if (!widget || widget.isDestroyed()) return { state: 'MIRROR_SOURCE_UNAVAILABLE', appId };
  const wc = widget.webContents;
  if (!wc || wc.isDestroyed()) return { state: 'MIRROR_SOURCE_UNAVAILABLE', appId };

  const bounds = widget.getContentBounds();
  const x = Math.max(0, Math.min(bounds.width - 1, Math.round(Number(input.x) || 0)));
  const y = Math.max(0, Math.min(bounds.height - 1, Math.round(Number(input.y) || 0)));
  try {
    if (input.type === 'wheel') {
      wc.sendInputEvent({ type: 'mouseWheel', x, y, deltaX: Number(input.deltaX) || 0, deltaY: Number(input.deltaY) || 0 });
    } else if (input.type === 'key') {
      const keyCode = String(input.keyCode || '');
      if (keyCode) wc.sendInputEvent({ type: input.phase === 'up' ? 'keyUp' : 'keyDown', keyCode });
      if (input.phase !== 'up' && typeof input.key === 'string' && input.key.length === 1) {
        wc.sendInputEvent({ type: 'char', keyCode: input.key });
      }
    } else {
      wc.sendInputEvent({ type: input.type || 'mouseMove', x, y, button: input.button || 'left', clickCount: Number(input.clickCount) || 1 });
    }
    setImmediate(() => { void publishAppMirrorFrame(appId); });
    return { state: 'MIRROR_INPUT_FORWARDED', appId };
  } catch (error) {
    return { state: 'MIRROR_INPUT_FAILED', appId, error: String(error) };
  }
}
function syncBridgeSource(appId,role){return `(()=>{if(window.__LeeWaySharedViewBridge)return window.__LeeWaySharedViewBridge;const appId=${JSON.stringify(appId)},role=${JSON.stringify(role)},instance=role+'-'+Math.random().toString(36).slice(2),channel=new BroadcastChannel('leeway.shared-capability.'+appId);let replaying=false,scrollTimer=0,appliedHash=null;const esc=value=>{try{return CSS.escape(String(value))}catch{return String(value).replace(/[^a-zA-Z0-9_-]/g,'\\\\$&')}};function selector(node){if(!(node instanceof Element))return null;if(node.id)return'#'+esc(node.id);for(const key of ['data-testid','data-voice-id','data-goto','data-action','aria-label','name']){const value=node.getAttribute(key);if(value)return node.tagName.toLowerCase()+'['+key+'="'+String(value).replace(/"/g,'\\\\"')+'"]'}const parts=[];let current=node;while(current&&current!==document.body&&parts.length<6){let part=current.tagName.toLowerCase();const siblings=current.parentElement?[...current.parentElement.children].filter(item=>item.tagName===current.tagName):[];if(siblings.length>1)part+=':nth-of-type('+(siblings.indexOf(current)+1)+')';parts.unshift(part);current=current.parentElement}return parts.join('>')}function post(payload){if(!replaying)channel.postMessage({source:instance,appId,role,...payload})}function postHash(){post({kind:'hash',hash:location.hash})}document.addEventListener('click',event=>{const target=event.target instanceof Element?event.target.closest('button,a,[role="button"],input,label,select,textarea'):null;if(!target||target.closest('#leeway-app-widget-chrome'))return;const path=selector(target);if(path)post({kind:'click',selector:path})},true);for(const kind of ['input','change'])document.addEventListener(kind,event=>{const target=event.target;if(!(target instanceof HTMLInputElement||target instanceof HTMLTextAreaElement||target instanceof HTMLSelectElement))return;const path=selector(target);if(path)post({kind,selector:path,value:target.value,checked:'checked'in target?target.checked:undefined})},true);document.addEventListener('scroll',event=>{clearTimeout(scrollTimer);scrollTimer=setTimeout(()=>{const target=event.target===document?document.scrollingElement:event.target,path=target===document.scrollingElement?'__document__':selector(target);if(path)post({kind:'scroll',selector:path,left:target.scrollLeft||0,top:target.scrollTop||0})},45)},true);window.addEventListener('hashchange',()=>{if(appliedHash===location.hash){appliedHash=null;return}postHash()});channel.onmessage=event=>{const message=event.data;if(!message||message.source===instance||message.appId!==appId)return;if(message.kind==='hello'){if(role==='tablet')postHash();return}if(message.kind==='hash'){if(typeof message.hash==='string'&&message.hash!==location.hash){appliedHash=message.hash;location.hash=message.hash}return}const target=message.selector==='__document__'?document.scrollingElement:document.querySelector(message.selector);if(!target)return;replaying=true;try{if(message.kind==='click')target.click();else if(message.kind==='scroll')target.scrollTo(message.left||0,message.top||0);else{if('value'in target)target.value=message.value;if('checked'in target&&typeof message.checked==='boolean')target.checked=message.checked;target.dispatchEvent(new Event(message.kind,{bubbles:true,composed:true}))}}finally{setTimeout(()=>{replaying=false},0)}};window.__LeeWaySharedViewBridge={state:'CONNECTED',appId,role,instance,hashSync:true};post({kind:'hello'});return window.__LeeWaySharedViewBridge})()`;}
function syncBridgeSourceV2(appId,role){return `(()=>{if(window.__LeeWaySharedViewBridgeV2)return window.__LeeWaySharedViewBridgeV2;const appId=${JSON.stringify(appId)},role=${JSON.stringify(role)},instance=role+'-'+Math.random().toString(36).slice(2),channel=new BroadcastChannel('leeway.shared-capability.'+appId);let replaying=false,scrollTimer=0,appliedHash=null,lastHash=location.hash;const esc=value=>{try{return CSS.escape(String(value))}catch{return String(value).replace(/[^a-zA-Z0-9_-]/g,'\\\\$&')}};function selector(node){if(!(node instanceof Element))return null;if(node.id)return'#'+esc(node.id);for(const key of ['data-testid','data-voice-id','data-goto','data-action','aria-label','name']){const value=node.getAttribute(key);if(value)return node.tagName.toLowerCase()+'['+key+'="'+String(value).replace(/"/g,'\\\\"')+'"]'}const parts=[];let current=node;while(current&&current!==document.body&&parts.length<6){let part=current.tagName.toLowerCase();const siblings=current.parentElement?[...current.parentElement.children].filter(item=>item.tagName===current.tagName):[];if(siblings.length>1)part+=':nth-of-type('+(siblings.indexOf(current)+1)+')';parts.unshift(part);current=current.parentElement}return parts.join('>')}function post(payload){if(!replaying)channel.postMessage({source:instance,appId,role,...payload})}function postHash(){lastHash=location.hash;post({kind:'hash',hash:lastHash})}function observeHash(){if(location.hash===lastHash)return;lastHash=location.hash;if(appliedHash===lastHash){appliedHash=null;return}postHash()}for(const method of ['pushState','replaceState']){const original=history[method];history[method]=function(...args){const result=original.apply(this,args);queueMicrotask(observeHash);return result}}document.addEventListener('click',event=>{const target=event.target instanceof Element?event.target.closest('button,a,[role="button"],input,label,select,textarea'):null;if(!target||target.closest('#leeway-app-widget-chrome'))return;const path=selector(target);if(path)post({kind:'click',selector:path})},true);for(const kind of ['input','change'])document.addEventListener(kind,event=>{const target=event.target;if(!(target instanceof HTMLInputElement||target instanceof HTMLTextAreaElement||target instanceof HTMLSelectElement))return;const path=selector(target);if(path)post({kind,selector:path,value:target.value,checked:'checked'in target?target.checked:undefined})},true);document.addEventListener('scroll',event=>{clearTimeout(scrollTimer);scrollTimer=setTimeout(()=>{const target=event.target===document?document.scrollingElement:event.target,path=target===document.scrollingElement?'__document__':selector(target);if(path)post({kind:'scroll',selector:path,left:target.scrollLeft||0,top:target.scrollTop||0})},45)},true);window.addEventListener('hashchange',observeHash);setInterval(observeHash,180);channel.onmessage=event=>{const message=event.data;if(!message||message.source===instance||message.appId!==appId)return;if(message.kind==='hello'){if(role==='tablet')postHash();return}if(message.kind==='hash'){if(typeof message.hash==='string'&&message.hash!==location.hash){appliedHash=message.hash;lastHash=message.hash;location.hash=message.hash}return}const target=message.selector==='__document__'?document.scrollingElement:document.querySelector(message.selector);if(!target)return;replaying=true;try{if(message.kind==='click')target.click();else if(message.kind==='scroll')target.scrollTo(message.left||0,message.top||0);else{if('value'in target)target.value=message.value;if('checked'in target&&typeof message.checked==='boolean')target.checked=message.checked;target.dispatchEvent(new Event(message.kind,{bubbles:true,composed:true}))}}finally{setTimeout(()=>{replaying=false},0)}};window.__LeeWaySharedViewBridgeV2={state:'CONNECTED',appId,role,instance,hashSync:true,historySync:true};post({kind:'hello'});return window.__LeeWaySharedViewBridgeV2})()`;}
async function installSyncBridge(frame,appId,role){try{return await frame.executeJavaScript(syncBridgeSourceV2(appId,role));}catch(error){fs.writeFileSync(path.join(__dirname,`app-widget-${appId}-sync-error.txt`),String(error));return{state:'SYNC_BRIDGE_FAILED',appId,role};}}
function appForFrameUrl(frameUrl){try{const candidate=new NodeUrl(frameUrl);return Object.entries(PUBLISHED_APPS).find(([,spec])=>{const expected=new NodeUrl(spec.url);return candidate.origin===expected.origin&&candidate.pathname===expected.pathname;})?.[0]||null;}catch{return null;}}
function installOfficeEmbeddedPresentation(frame){return frame.executeJavaScript(`(()=>{if(document.getElementById('leeway-office-embedded-presentation'))return 'ALREADY_APPLIED';const style=document.createElement('style');style.id='leeway-office-embedded-presentation';style.textContent='footer.agpu-system-dock{display:none!important}';document.head.append(style);return 'OFFICE_DOCK_HIDDEN';})()`);}
// Do not inject selector/click replay into a published application. It creates
// a second, divergent renderer and cannot carry the application's actual
// document, media, canvas, voice, or runtime state.  A widget is eligible for
// simultaneous tablet presentation only once its owning application exposes a
// canonical state adapter for the stable `leewaySession` identity.  The one
// retained host-side presentation adjustment is Office's duplicate dock.
function installTabletFrameBridges(){if(!tablet||tablet.isDestroyed()||tablet.webContents.isDestroyed())return;const pending=[...tablet.webContents.mainFrame.frames];while(pending.length){const frame=pending.shift();if(!frame)continue;const appId=appForFrameUrl(frame.url);if(appId==='officeSuite')void installOfficeEmbeddedPresentation(frame).catch(()=>{});pending.push(...frame.frames);}}
function scaleAppWidget(appId,widget,factor){const spec=PUBLISHED_APPS[appId],current=widget.getBounds(),display=displayForWidget(current),area=display.workArea,ratio=spec.designSize.width/spec.designSize.height;let width=Math.round(current.width*factor),height=Math.round(width/ratio);const minWidth=Math.min(320,area.width),minHeight=Math.min(Math.round(minWidth/ratio),area.height);if(width<minWidth){width=minWidth;height=Math.round(width/ratio);}if(height<minHeight){height=minHeight;width=Math.round(height*ratio);}const fit=Math.min(1,area.width/width,area.height/height);width=Math.round(width*fit);height=Math.round(height*fit);const centerX=current.x+current.width/2,centerY=current.y+current.height/2,x=Math.round(Math.max(area.x,Math.min(area.x+area.width-width,centerX-width/2))),y=Math.round(Math.max(area.y,Math.min(area.y+area.height-height,centerY-height/2)));widget.setBounds({x,y,width,height});fitAppWidgetContent(appId,widget);persistAppWidgetGeometry(appId,widget);}
function openAppWidget(appId) {
  const spec = PUBLISHED_APPS[appId];
  if (!spec) return { state: 'APP_NOT_ALLOWLISTED', appId };

  const existing = appWidgets.get(appId);
  if (existing && !existing.isDestroyed()) {
    recoverAppWidget(appId, existing);
    existing.show();
    existing.moveTop();
    fitAppWidgetContent(appId, existing);
    startAppMirror(appId);
    save();
    return { state: 'WIDGET_RESTORED', appId };
  }

  const area = screen.getDisplayMatching(tablet && !tablet.isDestroyed() ? tablet.getBounds() : screen.getPrimaryDisplay().workArea).workArea;
  const ratio = spec.designSize.width / spec.designSize.height;
  let width = Math.max(560, Math.min(1120, Math.round(area.width * .66))), height = Math.round(width / ratio);
  if (height > area.height * .78) {
    height = Math.round(area.height * .78);
    width = Math.round(height * ratio);
  }
  const defaultBounds = { x: area.x + Math.round((area.width - width) / 2), y: area.y + Math.round((area.height - height) / 2), width, height };
  const saved = appWidgetGeometry[appId];
  const normalizedSaved = saved ? { ...saved, width: Math.max(280, saved.width), height: Math.max(180, Math.round(Math.max(280, saved.width) / ratio)) } : null;
  const initial = recoverWidgetBounds(normalizedSaved || defaultBounds, area);

  const widget = new BrowserWindow({
    title: `${spec.title} · LeeWay Floating Widget`,
    ...initial,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    hasShadow: false,
    alwaysOnTop: true,
    resizable: true,
    minWidth: 280,
    minHeight: 180,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'app-widget-preload.cjs'),
      additionalArguments: [`--leeway-app-id=${encodeURIComponent(appId)}`],
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      backgroundThrottling: false
    }
  });

  widget.setAspectRatio(ratio);
  widget.setAlwaysOnTop(true, 'floating');
  widget.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));

  widget.webContents.on('did-finish-load', async () => {
    try {
      await widget.webContents.insertCSS(widgetPresentationCss());
      fitAppWidgetContent(appId, widget);
      startAppMirror(appId);
    } catch (error) {
      fs.writeFileSync(path.join(__dirname, 'app-widget-' + appId + '-load-error.txt'), String(error));
    }
  });

  widget.once('ready-to-show', () => {
    fitAppWidgetContent(appId, widget);
    widget.show();
    widget.moveTop();
    startAppMirror(appId);
    persistAppWidgetGeometry(appId, widget);
    save();
  });

  widget.on('moved', () => persistAppWidgetGeometry(appId, widget));
  widget.on('resized', () => {
    fitAppWidgetContent(appId, widget);
    persistAppWidgetGeometry(appId, widget);
  });

  // Canonical session preservation: intercept close to hide presentation surface without destroying WebContents
  widget.on('close', event => {
    if (tablet && !tablet.isDestroyed()) {
      event.preventDefault();
      closeAppWidget(appId);
    }
  });

  loadAppSurface(widget,spec,appId);
  appWidgets.set(appId, widget);
  save();
  return { state: 'WIDGET_OPENED', appId };
}

function closeAppWidget(appId) {
  const widget = appWidgets.get(appId);
  if (!widget || widget.isDestroyed()) return { state: 'WIDGET_NOT_OPEN', appId };
  // Hide presentation surface only; preserve WebContents and session for tablet!
  widget.hide();
  save();
  return { state: 'WIDGET_CLOSED', appId };
}

function controlAppWidget(appId, action) {
  const widget = appWidgets.get(appId);
  if (!widget || widget.isDestroyed()) return { state: 'WIDGET_NOT_OPEN', appId };
  if (action === 'reload') {
    widget.reload();
    return { state: 'WIDGET_RELOADING', appId };
  }
  const current = widget.getBounds(), area = displayForWidget(current).workArea;
  if (action === 'center') {
    widget.setPosition(area.x + Math.round((area.width - current.width) / 2), area.y + Math.round((area.height - current.height) / 2));
  } else if (action === 'larger' || action === 'smaller') {
    scaleAppWidget(appId, widget, action === 'larger' ? 1.1 : .9);
  } else {
    return { state: 'WIDGET_ACTION_REJECTED', appId };
  }
  widget.show();
  widget.moveTop();
  save();
  return { state: `WIDGET_${action.toUpperCase()}`, appId };
}
const file=path.join(__dirname,'geometry.json');
const work=()=>screen.getPrimaryDisplay().workArea;
let rect={x:120,y:80,width:980,height:740};
try{rect=JSON.parse(fs.readFileSync(file,'utf8'));}catch{}
function clamp(b){const a=screen.getDisplayMatching(b).workArea;let width=Math.max(420,Math.min(b.width,a.width)),height=Math.max(320,Math.min(b.height,a.height));return{x:Math.min(Math.max(b.x,a.x),a.x+a.width-width),y:Math.min(Math.max(b.y,a.y),a.y+a.height-height),width,height};}
function save(){fs.writeFileSync(file,JSON.stringify(rect,null,2));fs.writeFileSync(path.join(__dirname,'status.json'),JSON.stringify({loaded,opened,coinVisible:Boolean(tab&&!tab.isDestroyed()&&tab.isVisible()),tabletVisible:Boolean(tablet&&!tablet.isDestroyed()&&tablet.isVisible()),openAppWidgets:[...appWidgets.entries()].filter(([,widget])=>!widget.isDestroyed()&&widget.isVisible()).map(([appId])=>appId),appWidgetBounds:Object.fromEntries([...appWidgets.entries()].filter(([,widget])=>!widget.isDestroyed()).map(([appId,widget])=>[appId,widget.getBounds()])),rect,source:URL,widgetChromeVersion:WIDGET_CHROME_VERSION,at:new Date().toISOString()},null,2));}
function position(){}
function bounds(b){rect=clamp(b);tablet.setBounds(rect);position();save();}
const configuredCoin=process.env.LEEWAY_APPROVED_COIN_PATH;
const coinPath=configuredCoin&&fs.existsSync(configuredCoin)?configuredCoin:path.join(__dirname,'edge-art.png');
const tabArtURI='data:image/png;base64,'+fs.readFileSync(coinPath).toString('base64');
const tabPage=String.raw`<!doctype html><meta charset="utf-8"><style>*{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;background:transparent;overflow:hidden}button{width:100%;height:100%;border:0;background:transparent;padding:3px;cursor:grab}button:active{cursor:grabbing}img{width:100%;height:100%;object-fit:contain;filter:drop-shadow(0 4px 7px #000b)}button:hover img{filter:drop-shadow(0 0 14px #54dfff)}</style><button aria-label="Open Agent Virtual Tablet" title="Open Agent Virtual Tablet"><img alt="LeeWay coin" src="${tabArtURI}"></button><script>const ipc=require('electron').ipcRenderer;let sy=null,moved=false;window.onmousedown=e=>{sy=e.screenY;moved=false};window.onmousemove=e=>{if(sy===null||!(e.buttons&1))return;let dy=e.screenY-sy;if(Math.abs(dy)>4){moved=true;ipc.send('vt:edge-move',dy);sy=e.screenY}};window.onmouseup=()=>{if(!moved)ipc.send('vt:toggle');sy=null;moved=false};window.onblur=()=>{sy=null;moved=false};</script>`;
const railPage=String.raw`<meta charset="utf-8"><style>body{margin:0;background:transparent}section{display:grid;gap:4px;background:#071625ee;border:1px solid #50bad4;border-radius:11px;padding:4px}button{height:42px;background:#163a50;color:white;border:1px solid #407f9c;border-radius:8px;font:700 21px system-ui;cursor:pointer}#handle{cursor:grab}</style><section><button id="handle" title="Drag tablet">⠿</button><button onclick="send('up')" title="Enlarge">+</button><button onclick="send('down')" title="Shrink">−</button><button onclick="send('reset')" title="Restore geometry">□</button><button onclick="send('hide')" title="Collapse to tab">⌄</button></section><script>const ipc=require('electron').ipcRenderer;function send(s){ipc.send('vt:action',s)}let down=false;document.querySelector('#handle').onmousedown=e=>{down=true;ipc.send('vt:dragstart',e.screenX,e.screenY)};window.onmousemove=e=>{if(down)ipc.send('vt:drag',e.screenX,e.screenY)};window.onmouseup=()=>{down=false;ipc.send('vt:dragstop')}</script>`;
function chrome(title,b,html,show=true){const w=new BrowserWindow({title,...b,frame:false,transparent:true,backgroundColor:'#00000000',resizable:false,alwaysOnTop:true,skipTaskbar:true,show,webPreferences:{nodeIntegration:true,contextIsolation:false,sandbox:false}});w.loadURL('data:text/html;charset=utf-8,'+encodeURIComponent(html));w.setAlwaysOnTop(true,'floating');return w;}
function toggle(){if(!tablet||tablet.isDestroyed())return;if(!tablet.isVisible()||!opened){show()}else{hide()}}
function show(){
  bounds(rect);
  tablet.show();
  // The tablet is a single LeeWay surface, but published apps are independent
  // native visual widgets.  Preserve their visibility across a tablet hide /
  // show cycle so the proven 3D stages do not disappear until re-selected.
  for (const appId of suspendedAppWidgets) {
    const widget = appWidgets.get(appId);
    if (!widget || widget.isDestroyed()) continue;
    recoverAppWidget(appId, widget);
    widget.show();
    widget.moveTop();
    fitAppWidgetContent(appId, widget);
    startAppMirror(appId);
  }
  suspendedAppWidgets.clear();
  // Agent Lee's brain is an independent presence surface.  Its command is
  // processed asynchronously and it may call moveTop/focus for itself, so
  // opening it after the tablet used to leave a transparent brain window over
  // the tablet and intercept the user's input.  Start presence first, then
  // explicitly restore the tablet as the active surface once that command has
  // been consumed.  The brain remains open; it simply cannot become an
  // invisible shield in front of the tablet.
  setAgentLeePresence('show');
  setTimeout(()=>{
    if(!tablet||tablet.isDestroyed()||!tablet.isVisible())return;
    tablet.moveTop();
    tablet.focus();
  },520);
  if(tab&&!tab.isDestroyed()){tab.show();tab.moveTop();}
  opened=true;
  save();
}
function hide(){
  if(!tablet.isDestroyed()){rect=tablet.getBounds();tablet.hide();}
  suspendedAppWidgets=new Set([...appWidgets.entries()].filter(([,widget])=>!widget.isDestroyed()&&widget.isVisible()).map(([appId])=>appId));
  for(const widget of appWidgets.values()){if(!widget.isDestroyed())widget.hide();}
  setAgentLeePresence('hide');
  if(tab&&!tab.isDestroyed())tab.show();
  opened=false;
  save();
}
// A second launch restores this host.  It must never make another exterior
// launcher, because the approved exterior contract is one coin.
app.on('second-instance',()=>{
  if(!tab||tab.isDestroyed()||!tablet||tablet.isDestroyed())return;
  show();
});
app.whenReady().then(async()=>{
await ensureLocalTabletServer();
await ensureLocalOfficeServer();
const a=work();rect=clamp({...rect,x:rect.x===120?a.x+Math.round((a.width-rect.width)/2):rect.x,y:rect.y===80?a.y+80:rect.y});
edgeMonitorId=screen.getPrimaryDisplay().id;const edgeFile=path.join(__dirname,'edge-tab-position.json');try{const saved=JSON.parse(fs.readFileSync(edgeFile,'utf8'));if(Number.isFinite(saved.y))edgeY=saved.y;}catch{};edgeY=edgeY??(a.y+Math.round(a.height*.39));const edgeRect=()=>{const display=screen.getAllDisplays().find(d=>d.id===edgeMonitorId)||screen.getPrimaryDisplay(),w=display.workArea;return {x:w.x+w.width-108,y:Math.max(w.y,Math.min(w.y+w.height-108,edgeY)),width:108,height:108};};tab=chrome('Agent Lee Coin',edgeRect(),tabPage);const enforceEdge=()=>{if(edgeLock||!tab||tab.isDestroyed())return;const actual=tab.getBounds(),target=edgeRect();if(actual.x!==target.x||actual.y!==target.y){edgeLock=true;tab.setPosition(target.x,target.y);edgeLock=false;}};tab.show();tab.on('move',()=>{if(edgeLock)return;const b=tab.getBounds(),area=screen.getAllDisplays().find(d=>d.id===edgeMonitorId)?.workArea||screen.getPrimaryDisplay().workArea;edgeY=Math.max(area.y,Math.min(area.y+area.height-b.height,b.y));const x=area.x+area.width-b.width;if(b.x!==x||b.y!==edgeY){edgeLock=true;tab.setPosition(x,edgeY);edgeLock=false}fs.writeFileSync(edgeFile,JSON.stringify({id:EDGE_TAB_ID,monitorId:edgeMonitorId,y:edgeY},null,2));});screen.on('display-metrics-changed',enforceEdge);tab.on('moved',()=>{const b=tab.getBounds(),area=screen.getAllDisplays().find(d=>d.id===edgeMonitorId)?.workArea||screen.getPrimaryDisplay().workArea;const yy=Math.max(area.y,Math.min(area.y+area.height-b.height,b.y));const xx=area.x+area.width-b.width;edgeY=yy;if(b.x!==xx||b.y!==yy)tab.setPosition(xx,yy);fs.writeFileSync(edgeFile,JSON.stringify({id:EDGE_TAB_ID,monitorId:edgeMonitorId,y:edgeY},null,2))});screen.on('display-removed',enforceEdge);
tablet=new BrowserWindow({title:'LeeWay Agent VT - Native Floating Proof',...rect,frame:false,transparent:true,backgroundColor:'#00000000',hasShadow:false,alwaysOnTop:true,resizable:true,minWidth:420,minHeight:320,show:false,webPreferences:{preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:false}});
tablet.setAlwaysOnTop(true,'floating');
tablet.webContents.setWindowOpenHandler(()=>({action:'deny'}));
tablet.webContents.on('did-finish-load',async()=>{loaded=true;tablet.webContents.setZoomFactor(Math.max(0.55,Math.min(1,tablet.getBounds().width/1040)));try{await tablet.webContents.insertCSS('html,body,#root{background:transparent!important;margin:0!important;overflow:hidden!important}');}catch(e){fs.writeFileSync(path.join(__dirname,'css-error.txt'),String(e));}setTimeout(async()=>{try{const geometry=await tablet.webContents.executeJavaScript('(()=>{const s=document.querySelector("section[aria-label=\\"LeeWay Agent VT floating widget\\"]");const corners=document.querySelectorAll("[data-grab]");if(!s)return {state:"TABLET_NOT_FOUND"};const h=s.firstElementChild;const body=s.children[1],inner=body?.firstElementChild;const bar=document.getElementById("leeway-vt-widget-chrome"),close=bar?.querySelector("#leeway-vt-widget-close"),cs=close&&getComputedStyle(close);return{state:"TABLET_OBSERVED",viewport:{w:innerWidth,h:innerHeight},tablet:{w:s.getBoundingClientRect().width,h:s.getBoundingClientRect().height},headerDisplay:h?getComputedStyle(h).display:null,cornerCount:corners.length,moveButton:!!bar?.querySelector("#leeway-vt-widget-move"),closeButton:!!close,chromeVisible:!!bar&&getComputedStyle(bar).display!=="none"&&bar.getBoundingClientRect().width>0,chromeVersion:bar?.getAttribute("aria-label"),closeBackgroundImage:cs?.backgroundImage||null,contentWidth:inner?.getBoundingClientRect().width??null,contentHeight:inner?.getBoundingClientRect().height??null,contentTransform:inner?getComputedStyle(inner).transform:null}})()');fs.writeFileSync(path.join(__dirname,'layout-observation.json'),JSON.stringify(geometry,null,2));const shellState=await tablet.webContents.executeJavaScript("(()=>{const sh=document.getElementById('leeway-vt-native-tabs'),s=document.getElementById('leeway-vt-shell-css'),w=document.querySelector('section[aria-label=\\\"LeeWay Agent VT floating widget\\\"]');return {shellCSS:!!s,nativeTabs:!!sh,buttons:sh?[...sh.querySelectorAll('button')].map(x=>x.textContent):[],outerBorder:w?getComputedStyle(w).borderTopWidth:null,background:w?getComputedStyle(w).backgroundImage:null,viewport:w?.children[1]?.getBoundingClientRect().toJSON(),tabBounds:sh?.getBoundingClientRect().toJSON()}})()");fs.writeFileSync(path.join(__dirname,'shell-observation.json'),JSON.stringify(shellState,null,2));const nav=await tablet.webContents.executeJavaScript("(()=>Array.from(document.querySelectorAll('button,a,[role=button]')).filter(e=>/start|file|edit|view|home|help|agent/i.test((e.innerText||e.title||e.getAttribute('aria-label')||'').trim())).slice(0,36).map(e=>{const r=e.getBoundingClientRect();return{text:(e.innerText||e.title||e.getAttribute('aria-label')||'').trim().slice(0,45),top:Math.round(r.top),left:Math.round(r.left),width:Math.round(r.width),height:Math.round(r.height)}}))()");fs.writeFileSync(path.join(__dirname,'navigation-observation.json'),JSON.stringify(nav,null,2));}catch(e){fs.writeFileSync(path.join(__dirname,'layout-observation-error.txt'),String(e));}},1200);save()});
// Do not inject a generic DOM event replay bridge into an application frame.
// A surface receives the stable leewaySession URL contract and the real app
// supplies its own state adapter; injection cannot reproduce camera, WebGL,
// editor, or voice state faithfully.
tablet.webContents.on('did-fail-load',(_e,code,description,url)=>{loaded=false;fs.writeFileSync(path.join(__dirname,'load-error.json'),JSON.stringify({code,description,url}));save()});
// Local Agent Tablet evidence probe. The canonical frame is rendered by the
// local tablet itself; do not probe the retired remote shell selectors.
tablet.webContents.on('did-finish-load',()=>{setTimeout(async()=>{try{const observation=await tablet.webContents.executeJavaScript(`(()=>{const s=document.querySelector('section[aria-label="LeeWay Agent VT floating widget"]');if(!s)return {state:'TABLET_NOT_FOUND'};const header=document.getElementById('leeway-vt-widget-header');const canvas=s.children[1];const inner=canvas?.firstElementChild;const move=document.getElementById('leeway-vt-widget-move');const close=document.getElementById('leeway-vt-widget-close');const r=s.getBoundingClientRect();return{state:'TABLET_OBSERVED',viewport:{w:innerWidth,h:innerHeight},tablet:{x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height)},headerDisplay:header?getComputedStyle(header).display:null,moveButton:!!move,closeButton:!!close,chromeVisible:!!header&&getComputedStyle(header).display!=='none',frameBorder:getComputedStyle(s).border,frameOutline:getComputedStyle(s).outline,contentWidth:inner?.getBoundingClientRect().width??null,contentHeight:inner?.getBoundingClientRect().height??null,contentTransform:inner?getComputedStyle(inner).transform:null}})()`);fs.writeFileSync(path.join(__dirname,'layout-observation.json'),JSON.stringify(observation,null,2));const shell=await tablet.webContents.executeJavaScript(`(()=>{const s=document.querySelector('section[aria-label="LeeWay Agent VT floating widget"]');const h=document.getElementById('leeway-vt-widget-header');return{shellCSS:!!document.getElementById('leeway-vt-shell-css'),nativeFrame:!!s,header:!!h,buttons:[...document.querySelectorAll('#leeway-vt-widget-move,#leeway-vt-widget-close')].map(x=>({id:x.id,text:x.textContent.trim()})),outerBorder:s?getComputedStyle(s).border:null}})()`);fs.writeFileSync(path.join(__dirname,'shell-observation.json'),JSON.stringify(shell,null,2));}catch(e){fs.writeFileSync(path.join(__dirname,'layout-observation-error.txt'),String(e));}},1800)});
// Audit every large, visible positioned element in the real tablet renderer.
// This exposes a future accidental scrim without relying on the accessibility tree.
tablet.webContents.on('did-finish-load',()=>{setTimeout(async()=>{try{const audit=await tablet.webContents.executeJavaScript(`(()=>{const vw=innerWidth,vh=innerHeight;return [...document.querySelectorAll('*')].map(e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return{tag:e.tagName,id:e.id,cls:String(e.className||'').slice(0,180),z:s.zIndex,position:s.position,opacity:s.opacity,pointer:s.pointerEvents,bg:s.backgroundColor,bounds:{x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height)}}}).filter(x=>x.bounds.w>vw*.7&&x.bounds.h>vh*.65&&x.opacity!=='0').slice(-40)})()`);fs.writeFileSync(path.join(__dirname,'tablet-overlay-audit.json'),JSON.stringify(audit,null,2));}catch(e){fs.writeFileSync(path.join(__dirname,'tablet-overlay-audit-error.txt'),String(e));}},2300)});
tablet.loadURL(URL);
// Published Office does not yet consume leewaySurface itself.  Reapply the narrow
// embedded presentation rule when its iframe finishes navigating; the marker makes
// this idempotent and leaves standalone Office unchanged.
setInterval(installTabletFrameBridges,750);
tablet.on('minimize',()=>{setImmediate(()=>{if(!tablet.isDestroyed()){tablet.restore();hide();}})});
position();
ipcMain.on('leeway:close-tab',()=>{hide();tab.hide();});ipcMain.on('vt:toggle',toggle);ipcMain.on('vt:edge-move',(_e,dy)=>{if(!Number.isFinite(Number(dy)))return;const current=edgeRect();edgeY=current.y+Math.max(-100,Math.min(100,Number(dy)));const target=edgeRect();edgeY=target.y;fs.writeFileSync(edgeFile,JSON.stringify({id:EDGE_TAB_ID,monitorId:edgeMonitorId,y:edgeY},null,2));edgeLock=true;tab.setPosition(target.x,target.y);edgeLock=false;});
ipcMain.on('vt:action',(_e,s)=>{if(s==='hide')return hide();if(s==='reset')return bounds({x:a.x+100,y:a.y+70,width:980,height:740});if(s==='up'||s==='down'){const b=tablet.getBounds(),f=s==='up'?1.12:.88,w=Math.round(b.width*f),h=Math.round(b.height*f);bounds({x:b.x+Math.round((b.width-w)/2),y:b.y+Math.round((b.height-h)/2),width:w,height:h});}});
ipcMain.on('vt:dragstart',(e,x,y)=>{if(!tablet||tablet.isDestroyed()||e.sender!==tablet.webContents||!Number.isFinite(x)||!Number.isFinite(y))return;drag={sender:e.sender,x,y,b:tablet.getBounds()}});
ipcMain.on('vt:drag',(e,x,y)=>{if(!drag||drag.sender!==e.sender||!Number.isFinite(x)||!Number.isFinite(y))return;bounds({...drag.b,x:drag.b.x+x-drag.x,y:drag.b.y+y-drag.y})});
ipcMain.on('vt:dragstop',e=>{if(drag?.sender===e.sender)drag=null});
ipcMain.on('vt:scale',(_e,direction)=>{if(!opened||!['up','down'].includes(direction))return;const b=tablet.getBounds(),f=direction==='up'?1.08:0.92,w=Math.round(b.width*f),h=Math.round(b.height*f);bounds({x:b.x+Math.round((b.width-w)/2),y:b.y+Math.round((b.height-h)/2),width:w,height:h});});
ipcMain.handle('vt:open-app-widget',(event,appId)=>event.sender===tablet.webContents?openAppWidget(String(appId)):{state:'UNAUTHORIZED_SENDER',appId:String(appId)});
ipcMain.handle('vt:close-app-widget',(event,appId)=>event.sender===tablet.webContents?closeAppWidget(String(appId)):{state:'UNAUTHORIZED_SENDER',appId:String(appId)});
ipcMain.handle('vt:control-app-widget',(event,appId,action)=>event.sender===tablet.webContents?controlAppWidget(String(appId),String(action)):{state:'UNAUTHORIZED_SENDER',appId:String(appId)});
ipcMain.on('vt:app-mirror-input',(event,appId,input)=>{if(event.sender!==tablet.webContents||!PUBLISHED_APPS[String(appId)])return;forwardAppMirrorInput(String(appId),input&&typeof input==='object'?input:{});});
const appWidgetForSender=sender=>[...appWidgets.entries()].find(([,widget])=>!widget.isDestroyed()&&widget.webContents===sender);
ipcMain.on('vt:app-widget-dragstart',event=>{const entry=appWidgetForSender(event.sender);if(!entry)return;const [appId,widget]=entry,cursor=screen.getCursorScreenPoint();appWidgetDrag={sender:event.sender,appId,cursor,bounds:widget.getBounds()};});
ipcMain.on('vt:app-widget-drag',event=>{if(!appWidgetDrag||appWidgetDrag.sender!==event.sender)return;const entry=appWidgetForSender(event.sender);if(!entry)return;const widget=entry[1],start=appWidgetDrag.bounds,cursor=screen.getCursorScreenPoint();widget.setPosition(Math.round(start.x+cursor.x-appWidgetDrag.cursor.x),Math.round(start.y+cursor.y-appWidgetDrag.cursor.y));});
ipcMain.on('vt:app-widget-dragstop',event=>{if(appWidgetDrag?.sender===event.sender){const entry=appWidgetForSender(event.sender);if(entry)persistAppWidgetGeometry(entry[0],entry[1]);appWidgetDrag=null;save();}});
ipcMain.on('vt:app-widget-action',(event,action)=>{const entry=appWidgetForSender(event.sender);if(!entry)return;const [appId]=entry;const next=String(action);if(next==='close')closeAppWidget(appId);else if(['smaller','larger','center','reload'].includes(next))controlAppWidget(appId,next);});
tablet.on('resize',()=>{rect=tablet.getBounds();position();tablet.webContents.setZoomFactor(Math.max(0.55,Math.min(1,rect.width/1040)));save()});
screen.on('display-removed',()=>{for(const [appId,widget] of appWidgets)recoverAppWidget(appId,widget);});
setInterval(()=>{try{const f=path.join(__dirname,'open-request.json');if(!fs.existsSync(f))return;const request=JSON.parse(fs.readFileSync(f,'utf8'));fs.unlinkSync(f);if(request.command==='tab'){hide()}else if(request.command==='show'){show()}else if(request.command==='show-near'){if(Number.isFinite(request.x)&&Number.isFinite(request.y)){bounds({...rect,x:request.x,y:request.y});}show()}else if(request.command==='hide'){hide()}else if(request.command==='hide-tab'){hide();tab.hide();save()}else if(request.command==='toggle'){toggle()}else if(request.command==='capture'){if(tablet&&!tablet.isDestroyed()){tablet.capturePage().then(img=>fs.writeFileSync(path.join(__dirname,'workstation-live-capture.png'),img.toPNG()));}}else if(request.command==='select-app'&&PUBLISHED_APPS[request.appId]){show();tablet.loadURL(`${URL}?view=${encodeURIComponent(request.appId)}`);fs.writeFileSync(path.join(__dirname,'app-selection-test.json'),JSON.stringify({appId:request.appId,result:'ALLOWLISTED_DEEP_LINK_REQUESTED',at:new Date().toISOString()},null,2))}else if(request.command==='open-app-widget'&&PUBLISHED_APPS[request.appId]){openAppWidget(request.appId)}else if(request.command==='capture-app-widget'&&PUBLISHED_APPS[request.appId]){const widget=appWidgets.get(request.appId);if(widget&&!widget.isDestroyed())widget.capturePage().then(img=>fs.writeFileSync(path.join(__dirname,`app-widget-${request.appId}.png`),img.toPNG()));}else if(request.command==='close-app-widget'&&PUBLISHED_APPS[request.appId]){closeAppWidget(request.appId)}const isTabVis=Boolean(tab&&!tab.isDestroyed()&&tab.isVisible()),isTablVis=Boolean(tablet&&!tablet.isDestroyed()&&tablet.isVisible());fs.writeFileSync(path.join(__dirname,'tab-state.json'),JSON.stringify({coinVisible:isTabVis,tabletVisible:isTablVis,openAppWidgets:[...appWidgets.keys()],command:request.command,at:new Date().toISOString()},null,2))}catch(e){fs.writeFileSync(path.join(__dirname,'request-error.txt'),String(e))}},400);require('./Pocket-EdgeTab-Contract.cjs')(tab,screen,__dirname,EDGE_TAB_ID);tab.on('closed',()=>app.quit());save();
}).catch(error=>{try{fs.writeFileSync(path.join(__dirname,'startup-error.txt'),String(error&&error.stack||error));}catch{}app.exit(1);});
app.on('window-all-closed',()=>app.quit());
app.on('will-quit',()=>{for(const widget of appWidgets.values()){try{if(!widget.isDestroyed())widget.destroy();}catch{}}try{if(localTabletServer&&!localTabletServer.killed)localTabletServer.kill();}catch{}try{if(localOfficeServer&&!localOfficeServer.killed)localOfficeServer.kill();}catch{}});

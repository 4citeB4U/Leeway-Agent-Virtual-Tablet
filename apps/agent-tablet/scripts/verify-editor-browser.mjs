/*
LEEWAY HEADER - DO NOT REMOVE
REGION: LEEWAY.VT.EDITOR.VERIFICATION
TAG: VT.EDITOR.BROWSER.GATE.V1
5WH: WHAT real browser editor tests; WHY source assertions are insufficient;
WHO LeeWay Industries / Agent Lee; WHERE isolated VT candidate; WHEN 2026-10-06;
HOW actual Chromium, SDK/Player, sandbox save/reopen and bounded failure cases.
AUTHORIZED ROLES: TEST / EVIDENCE; no user browser, physical phone or remote execution proof.
LICENSE: MIT
*/
import {chromium} from 'playwright';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
const base=process.env.LEEWAY_EDITOR_TEST_URL;if(!base)throw Error('LEEWAY_EDITOR_TEST_URL required');
const parsed=new URL(base);if(!['127.0.0.1','localhost','[::1]'].includes(parsed.hostname))throw Error('Only the explicitly selected local test target is admitted');
const output=path.resolve(process.env.LEEWAY_EDITOR_EVIDENCE||'evidence/editor-c3');fs.mkdirSync(output,{recursive:true});
const results=[],pageErrors=[],networkFailures=[],externalRequests=[];let browser,debugPage,entrySha256;
const check=(name,condition)=>{assert.ok(condition,name);results.push({name,status:'PASS'});};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function eventually(test){for(let i=0;i<50;i++){if(await test())return;await sleep(100);}throw Error('Browser condition timeout');}
try{
 browser=await chromium.launch({channel:process.env.LEEWAY_TEST_BROWSER_CHANNEL||'chrome',headless:true});
 const context=await browser.newContext({viewport:{width:1440,height:1000}});
 await context.route('**/*',route=>{const u=new URL(route.request().url());if(u.protocol==='http:'||u.protocol==='https:'){if(u.origin!==parsed.origin){externalRequests.push(u.origin+u.pathname);return route.abort();}}return route.continue();});
 const page=await context.newPage();debugPage=page;page.on('pageerror',e=>pageErrors.push(e.message));page.on('response',r=>{if(r.status()>=400)networkFailures.push({url:r.url(),status:r.status()});});
 const entry=await page.goto(base,{waitUntil:'domcontentloaded'});entrySha256=crypto.createHash('sha256').update(await entry.body()).digest('hex');
 const openEditor=()=>page.getByRole('button',{name:/^leeway editor$/i}).click();
 await openEditor();const editor=page.getByRole('region',{name:'LeeWay Editor',exact:true});
 check('editor is part of existing VT navigation',await editor.isVisible());
 for(const name of ['Agent Blackboard','LeeCode','Terminal','Diagnostics','Workboard'])check('preserved '+name,await page.getByRole('button',{name:new RegExp('^'+name+'$','i')}).count()>0);
 await editor.getByRole('button',{name:'New composition',exact:true}).click();
 await eventually(()=>editor.getByRole('button',{name:'Play preview',exact:true}).isEnabled());
 check('actual HyperFrames Player ready',true);
 const text=editor.getByRole('textbox',{name:'Element text',exact:true});
 await text.fill('Creator-controlled edit');await editor.getByRole('button',{name:'Apply text',exact:true}).click();
 const title=()=>page.locator('hyperframes-player').evaluate(p=>p.iframeElement?.contentDocument?.querySelector('[data-hf-id="hf-title"]')?.textContent);
 await eventually(async()=>await title()==='Creator-controlled edit');check('SDK edit appears in actual preview',true);
 await editor.getByRole('button',{name:'Undo',exact:true}).click();await eventually(async()=>await title()==='Your story starts here.');check('SDK undo restores content',true);
 await editor.getByRole('button',{name:'Redo',exact:true}).click();await eventually(async()=>await title()==='Creator-controlled edit');check('SDK redo restores edit',true);
 await editor.getByRole('spinbutton',{name:'Font size',exact:true}).fill('84');await editor.getByRole('button',{name:'Apply typography',exact:true}).click();
 await eventually(()=>page.locator('hyperframes-player').evaluate(p=>p.iframeElement?.contentDocument?.querySelector('[data-hf-id="hf-title"]')?.style.fontSize==='84px'));check('typography modifies actual composition',true);
 await editor.getByRole('spinbutton',{name:'Clip start',exact:true}).fill('3');await editor.getByRole('spinbutton',{name:'Clip duration',exact:true}).fill('5');await editor.getByRole('button',{name:'Apply timing',exact:true}).click();
 await eventually(()=>editor.getByRole('button',{name:'Play preview',exact:true}).isEnabled());
 check('timeline timing committed to actual DOM',await page.locator('hyperframes-player').evaluate(p=>{const e=p.iframeElement.contentDocument.querySelector('[data-hf-id="hf-title"]');return e.getAttribute('data-start')==='3'&&e.getAttribute('data-duration')==='5';}));
 await editor.getByRole('spinbutton',{name:'Clip duration',exact:true}).fill('100');await editor.getByRole('button',{name:'Apply timing',exact:true}).click();check('invalid timing fails visibly',await editor.getByRole('alert').innerText()==='EDITOR_TIMING_OUT_OF_BOUNDS');
 await editor.getByRole('spinbutton',{name:'Clip duration',exact:true}).fill('5');await editor.getByRole('button',{name:'Apply timing',exact:true}).click();
 await editor.getByRole('button',{name:'Agent Blackboard',exact:true}).click();check('existing Blackboard opened',!(await editor.isVisible()));await openEditor();check('draft survives Blackboard navigation',await text.inputValue()==='Creator-controlled edit');
 await editor.getByRole('button',{name:'Save to sandbox',exact:true}).click();const savedPath=await editor.getByRole('textbox',{name:'Sandbox file path',exact:true}).inputValue();
 const saved=await page.evaluate(p=>JSON.parse(localStorage.getItem('leeway_virtual_files')||'{}')[p],savedPath);check('saved in existing sandbox storage',saved?.includes('Creator-controlled edit'));
 await page.reload({waitUntil:'domcontentloaded'});await openEditor();await editor.getByRole('combobox',{name:'Open sandbox composition',exact:true}).selectOption(savedPath);await eventually(()=>editor.getByRole('button',{name:'Play preview',exact:true}).isEnabled());check('save/reopen persists actual edit',await text.inputValue()==='Creator-controlled edit');
 await editor.getByRole('button',{name:'Play preview',exact:true}).click();await eventually(()=>editor.locator('output').innerText().then(s=>parseFloat(s)>0.2));await editor.getByRole('button',{name:'Pause preview',exact:true}).click();check('preview clock advances and can pause',true);
 await page.locator('hyperframes-player').evaluate(p=>p.seek(4));await sleep(150);await editor.getByRole('button',{name:'Check visible layout',exact:true}).click();check('bounded layout evidence returned',await editor.getByText(/No overflow found|outside the composition|text exceeds/).count()>0);
 await page.screenshot({path:path.join(output,'editor-desktop.png'),fullPage:true});
 await page.evaluate(p=>{const s=JSON.parse(localStorage.getItem('leeway_virtual_files')||'{}');s[p]=s[p].replace('Creator-controlled edit','Concurrent external edit');localStorage.setItem('leeway_virtual_files',JSON.stringify(s));},savedPath);
 await editor.getByRole('button',{name:'Save to sandbox',exact:true}).click();check('stale save rejected without overwriting external edit',(await editor.getByRole('alert').innerText()).includes('SANDBOX_REVISION_CONFLICT'));
 await page.evaluate(()=>{const s=JSON.parse(localStorage.getItem('leeway_virtual_files')||'{}');s['/workspace/unsafe.hf.html']='<script>window.bad=true</script>';localStorage.setItem('leeway_virtual_files',JSON.stringify(s));});
 await page.reload({waitUntil:'domcontentloaded'});await openEditor();await editor.getByRole('combobox',{name:'Open sandbox composition',exact:true}).selectOption('/workspace/unsafe.hf.html');check('active HTML rejected before preview',(await editor.getByRole('alert').innerText()).includes('COMPOSITION_ACTIVE_OR_UNSUPPORTED_ELEMENT'));
 check('unsafe payload did not execute',await page.evaluate(()=>window.bad===undefined));
 await editor.getByRole('combobox',{name:'Open sandbox composition',exact:true}).selectOption(savedPath);await eventually(()=>editor.getByRole('button',{name:'Play preview',exact:true}).isEnabled());
 await page.setViewportSize({width:390,height:844});await sleep(200);check('phone-size editor remains visible',await editor.isVisible());
 const bounds=await editor.evaluate(e=>({client:e.clientWidth,scroll:e.scrollWidth}));check('editor no horizontal overflow at phone viewport',bounds.scroll<=bounds.client+1);
 await editor.getByRole('textbox',{name:'Element text',exact:true}).fill('Phone viewport edit');await editor.getByRole('button',{name:'Apply text',exact:true}).click();await eventually(async()=>await title()==='Phone viewport edit');check('phone-size interaction edits actual preview',true);
 await editor.getByRole('button',{name:'Save to sandbox',exact:true}).click();check('unbound render cannot claim success',await editor.getByRole('button',{name:/Render video/}).isDisabled());
 await eventually(()=>editor.getByRole('button',{name:'Play preview',exact:true}).isEnabled());await page.locator('hyperframes-player').evaluate(p=>p.seek(4));await sleep(100);await page.screenshot({path:path.join(output,'editor-phone-viewport.png'),fullPage:true});check('no uncaught JavaScript exceptions',pageErrors.length===0);
 console.log('PASS '+results.length+' actual browser checks');
}catch(error){if(debugPage){console.log(await debugPage.evaluate(()=>({editor:document.querySelector('.leeway-editor')?.innerText,player:(()=>{const p=document.querySelector('hyperframes-player');return p?{ready:p.ready,readyInternal:p._ready,html:p.iframeElement?.contentDocument?.documentElement?.outerHTML?.slice(0,1200),runtime:typeof p.iframeElement?.contentWindow?.__hyperframes,scripts:p.iframeElement?.contentDocument?.scripts.length}:null;})()})));await debugPage.screenshot({path:path.join(output,'failure.png'),fullPage:true});}results.push({name:'browser execution',status:'FAIL',error:String(error)});process.exitCode=1;console.error(error);}
finally{
 if(browser)await browser.close();
 const receipt={kind:'LEEWAY_VT_EDITOR_BROWSER_CANDIDATE',testedAt:new Date().toISOString(),entrySha256,results,pageErrors,networkFailures,externalRequests,backend:'STATIC_PREVIEW_PROVIDER_APIS_UNBOUND',phone:'VIEWPORT_ONLY_NOT_PHYSICAL',render:'NOT_EXECUTED',agentExecution:'NOT_EXECUTED',formula:'NOT_EXECUTED',learningLedger:'NOT_UPDATED'};
 fs.writeFileSync(path.join(output,'browser-receipt.json'),JSON.stringify(receipt,null,2)+'\n');
 const hashes={};for(const file of fs.readdirSync(output)){if(file==='hashes.json')continue;hashes[file]=crypto.createHash('sha256').update(fs.readFileSync(path.join(output,file))).digest('hex');}fs.writeFileSync(path.join(output,'hashes.json'),JSON.stringify(hashes,null,2)+'\n');
}

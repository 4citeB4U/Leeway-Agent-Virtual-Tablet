import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir=path.dirname(fileURLToPath(import.meta.url));
const tabletRoot=path.resolve(scriptDir,'..');
const crmSource=path.resolve(tabletRoot,'..','crm');
const crmTarget=path.resolve(tabletRoot,'public','crm');
const required=['index.html','manifest.json','service-worker.js','icon.svg','data/leeway-crm-campaign-starter-data.json','UPSTREAM.json'];

for(const rel of required){
  const source=path.join(crmSource,rel);
  if(!fs.existsSync(source)) throw new Error('CRM source missing required runtime file: '+rel);
}
fs.rmSync(crmTarget,{recursive:true,force:true});
for(const rel of required){
  const source=path.join(crmSource,rel);
  const target=path.join(crmTarget,rel==='UPSTREAM.json'?'_leeway-upstream.json':rel);
  fs.mkdirSync(path.dirname(target),{recursive:true});
  fs.copyFileSync(source,target);
}
console.log(JSON.stringify({state:'CRM_RUNTIME_SYNCED',files:required.length}));

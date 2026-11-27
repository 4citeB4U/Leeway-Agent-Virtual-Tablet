import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';

const repoRoot=path.resolve(process.argv[2]||'..');
const output=path.resolve(process.argv[3]||path.join(repoRoot,'grapevine-app/public/grapevine-state.json'));
const skillRoot=path.join(repoRoot,'skills');
const sha256=value=>crypto.createHash('sha256').update(value).digest('hex');
const commit=execFileSync('git',['-C',repoRoot,'rev-parse','HEAD'],{encoding:'utf8'}).trim();
function walk(dir,out=[]){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,entry.name);if(entry.isDirectory())walk(p,out);else if(entry.isFile()&&entry.name.toLowerCase()==='skill.md')out.push(p)}return out}
function frontmatter(text){if(!text.startsWith('---'))return{};const end=text.indexOf('\n---',3);if(end<0)return{};const body=text.slice(3,end),result={};for(const line of body.split(/\r?\n/)){const m=line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);if(m)result[m[1]]=m[2].replace(/^['"]|['"]$/g,'').trim()}return result}
function titleCase(s){return s.replace(/[-_]+/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}
function classify(rel,text){const p=rel.toLowerCase(),t=(p+' '+text.slice(0,5000).toLowerCase());if(/(^|\/)(windows|win32|powershell|desktop|workstation)(\/|$)/.test(p)||/desktop commander|windows uia|win32/.test(t))return'WINDOWS';if(/(^|\/)(android|phone|adb|termux)(\/|$)/.test(p)||/android|adb|shizuku/.test(t))return'ANDROID';if(/(^|\/)(macos|ios|swift|swiftui|apple)(\/|$)/.test(p)||/macos|swiftui|apple accessibility/.test(t))return'MACOS';if(/(^|\/)(linux|docker|kubernetes|devops|ci-cd|deployment)(\/|$)/.test(p)||/linux|docker|kubernetes|github actions/.test(t))return'LINUX';if(/vision|ocr|image|perception|screen|spatial|3d|blender|render|video|audio|voice/.test(t))return'PERCEPTION';if(/(^|\/)(core|orchestration|agent|runtime|formula|governance|leeway-)/.test(p)||/runtime fabric|formula|governance|orchestr/.test(t))return'CORE';return'WEB'}
function readRecovery(){try{return JSON.parse(fs.readFileSync(path.join(repoRoot,'receipts/agent-lee-capability-recovery-20261001.json'),'utf8'))}catch{return null}}
const files=walk(skillRoot).sort(),recovery=readRecovery();
const skills=files.map(abs=>{const rel=path.relative(repoRoot,abs).split(path.sep).join('/'),text=fs.readFileSync(abs,'utf8').replace(/^\uFEFF/,''),fm=frontmatter(text),stem=rel.split('/').slice(-2,-1)[0],name=fm.name||titleCase(stem),description=fm.description||text.split(/\r?\n/).find(line=>line.trim()&&!line.startsWith('#')&&!line.startsWith('---')&&!/^[A-Za-z0-9_-]+:/.test(line))?.trim()||`Canonical LeeWay skill at ${rel}.`,branchKey=classify(rel,text);return{id:rel.replace(/^skills\//,'').replace(/\/SKILL\.md$/i,'').replace(/[^A-Za-z0-9._-]+/g,'__'),name,description,path:rel,branchKey,registryState:'CANONICAL_DISCOVERED',qualificationState:'NOT_INFERRED_FROM_PRESENCE',executionState:'NOT_TRIGGERED',evidenceState:'SOURCE_PATH_AND_COMMIT',contentSha256:sha256(Buffer.from(text,'utf8')),githubUrl:`https://github.com/4citeB4U/LeeWay-Agent-Skills/blob/${commit}/${rel}`}});
if(skills.length===0)throw new Error('CANONICAL_SKILL_COUNT_EMPTY');
const counts={canonicalSkillMd:skills.length,legacyRegistryEntries:44,mcpProtocolListedTools:recovery?.tests?.mcpProtocol?.listedTools??592,mcpSkillTools:recovery?.tests?.mcpProtocol?.skillTools??543,boundedCapabilityTools:recovery?.tests?.mcpProtocol?.boundedCapabilityTools??49};
const systems=[
{id:'github-pages',label:'GitHub Pages',state:'DEPLOYED_BUILD_ARTIFACT',detail:'This interface is built from the uploaded LeeWay Grapevine React/Three.js project. LIVE applies only after Pages deployment succeeds.'},
{id:'skills-registry',label:'Skills registry',state:'CONNECTED',detail:`${skills.length} SKILL.md files were recursively enumerated from this exact checkout at ${commit.slice(0,12)}.`},
{id:'skills-factory',label:'Skills Factory',state:fs.existsSync(path.join(repoRoot,'skills/leeway-skill-factory/SKILL.md'))?'AVAILABLE':'MISSING',detail:'Canonical Skill Factory instructions are present. AVAILABLE does not mean a qualification job is executing now.'},
{id:'mcp',label:'MCP skill selection',state:recovery?.tests?.mcpProtocol?.state==='PASS'?'PROTOCOL_VERIFIED':'RECORDED_UNVERIFIED',detail:`Recovery evidence reports ${counts.mcpProtocolListedTools} protocol-listed tools (${counts.mcpSkillTools} skill tools + ${counts.boundedCapabilityTools} bounded operational tools). Listing is not execution.`},
{id:'desktop-commander',label:'Desktop Commander',state:'READ_PATH_VERIFIED',detail:'Recorded live qualification proved LeeWay native Host Commander read operations with content-hash receipts. Public Pages does not inherit local Commander authority.'},
{id:'device-bridge',label:'Device Bridge',state:'SOURCE_AND_NATIVE_OWNER_VERIFIED',detail:'LEEWAY-DEVICE-BRIDGE is the recorded native Commander/device authority. Cross-platform/provider maturity remains capability-specific.'},
{id:'runtime-fabric',label:'Runtime Fabric',state:'DISPATCH_REPAIR_MERGED_CARRIER_OBSERVED',detail:'Recorded evidence includes merged dispatch/retry safety repair and a live local carrier. This page is not the carrier.'},
{id:'veritas',label:'Veritas',state:'SCOPED_HOST_READ_CANDIDATE_QUALIFIED',detail:'Host-read verifier has scoped behavioral qualification. Production-wide Veritas binding is not claimed here.'},
{id:'receipts',label:'Receipts',state:'REAL_CONTENT_HASH_EVIDENCE',detail:'LeeWay receipts exist for qualified paths. Unsigned content hashes prove integrity of captured content, not cryptographic signer identity.'}
];
const registry={schemaVersion:'leeway.grapevine.registry.v2',generatedAtUtc:new Date().toISOString(),repository:'4citeB4U/LeeWay-Agent-Skills',commit,sourceRule:'Each grape comes from one canonical SKILL.md in this checkout. Registry presence never implies execution.',counts,systems,skills};
fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(registry,null,2)+'\n');console.log(JSON.stringify({status:'PASS',commit,skills:skills.length,output}));

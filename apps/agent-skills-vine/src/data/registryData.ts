import { BranchKey, GrapevineRegistry, Skill } from '../types/skills';

const CATEGORY: Record<BranchKey, Skill['category']> = {
  CORE:'Orchestration', PERCEPTION:'Perception', MACOS:'Control', WINDOWS:'Control', LINUX:'Control', ANDROID:'Control', WEB:'Input'
};

export async function loadCanonicalRegistry(): Promise<{registry:GrapevineRegistry;skills:Skill[]}> {
  const response = await fetch('./grapevine-state.json', { cache: 'no-store' });
  if (!response.ok) throw new Error(`GRAPEVINE_REGISTRY_${response.status}`);
  const registry = await response.json() as GrapevineRegistry;
  if (registry.schemaVersion !== 'leeway.grapevine.registry.v2' || !Array.isArray(registry.skills)) throw new Error('GRAPEVINE_REGISTRY_SCHEMA_INVALID');
  const byBranch = new Map<BranchKey, typeof registry.skills>();
  for (const raw of registry.skills) {
    const list=byBranch.get(raw.branchKey)||[];
    list.push(raw);
    byBranch.set(raw.branchKey,list);
  }
  const skills: Skill[] = registry.skills.map((raw,index)=>{
    const branchList=byBranch.get(raw.branchKey)||[];
    const branchIndex=branchList.findIndex(v=>v.id===raw.id);
    const neighbors=[branchList[branchIndex-1],branchList[branchIndex+1]].filter(Boolean).map(v=>v.id);
    return {
      id:raw.id, name:raw.name, subtitle:raw.registryState, branchKey:raw.branchKey, category:CATEGORY[raw.branchKey],
      radius:.2+((index%13)/18), angleDeg:(index*137.507764)%360, heightY:-.75+((index%31)/30)*1.5,
      latencyMs:0, cloudLatencyMs:0, costPerRun:'NOT MEASURED', cloudCostPerRun:'NOT COMPARED',
      cli:`skill://${raw.path.replace(/\\/g,'/')}`,
      codeSnippet:`Canonical source: ${raw.path}\nRepository commit: ${registry.commit}\nRegistry: ${raw.registryState}\nQualification: ${raw.qualificationState}\nExecution: ${raw.executionState}`,
      desc:raw.description || `Canonical LeeWay skill at ${raw.path}. Presence in the registry does not imply that the skill executed in this browser session.`,
      perms:'Governed by SKILL.md + LeeWay Runtime Fabric authority. Public GitHub Pages does not grant local device authority.',
      inputs:['Authorized user request','Canonical SKILL.md instructions','Runtime/provider context when connected'],
      outputs:['Capability-specific result','Evidence/receipt only when actual execution occurs'], compatibleNeighbors:neighbors,
      githubPath:raw.path, githubUrl:raw.githubUrl, sourceCommit:registry.commit, registryState:raw.registryState,
      qualificationState:raw.qualificationState, executionState:raw.executionState, evidenceState:raw.evidenceState
    };
  });
  return {registry,skills};
}

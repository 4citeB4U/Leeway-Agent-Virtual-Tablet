/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.AGENT_SKILLS.VINE
TAG: LEEWAY.AGENT_SKILLS.LIVE_VINE.V1
WHAT: Grapevine-only surface. Grapes grow/removal follow the canonical registry; active skill selection from Machine Consciousness blinks the matching grape. All secondary panels live under the hamburger.
WHY: The operator must see the vine, not dashboards. Blinking must reflect real carrier usage, not a canned timer.
WHO: LeeWay Industries / creator-authorized outside contributor (LW-OPENCODE).
WHERE: apps/agent-skills-vine/src/App.tsx
WHEN: 2026-11-27
HOW: Polls the existing carrier /skills/usage seam and the canonical registry; no new authority, no skill execution claim.
AUTHORITY: TEST_ONLY. Selection is not execution proof; no Veritas or receipt claim.
LICENSE: Existing repository terms.
*/
import React, { useState, useCallback, useEffect } from 'react';
import { Branch, BranchKey, Skill } from './types/skills';
import { BRANCHES } from './data/skillsData';
import { loadCanonicalRegistry } from './data/registryData';
import { Grapevine3DCanvas } from './components/Grapevine3DCanvas';
import { BranchDrawer } from './components/BranchDrawer';
import { HarvestBasket } from './components/HarvestBasket';
import { SkillInspectorModal } from './components/SkillInspectorModal';
import { PipelineRunnerModal } from './components/PipelineRunnerModal';
import { GitHubSyncModal } from './components/GitHubSyncModal';
import { ExportPipelineModal } from './components/ExportPipelineModal';
import { GrapevineNearRadar } from './components/GrapevineNearRadar';
import { sounds } from './utils/audio';

const CARRIER_USAGE_URL = 'http://127.0.0.1:8890/skills/usage';
const CARRIER_REGISTRY_URL = 'http://127.0.0.1:8890/skills/registry';

function skillFromLiveName(name: string, index: number): Skill {
  return {
    id: `live-${name}`.replace(/[^A-Za-z0-9._-]/g, '__'), name, subtitle: 'LIVE_CARRIER_DISCOVERY',
    branchKey: 'CORE', category: 'Orchestration', radius: .2 + ((index % 13) / 18),
    angleDeg: (index * 137.507764) % 360, heightY: -.75 + ((index % 31) / 30) * 1.5,
    latencyMs: 0, cloudLatencyMs: 0, costPerRun: 'NOT MEASURED', cloudCostPerRun: 'NOT COMPARED',
    cli: `skill://${name}`, codeSnippet: `Live carrier discovery: ${name}\nPresence is not execution proof.`,
    desc: `Canonical skill ${name} discovered live from Machine Consciousness.`,
    perms: 'Governed by SKILL.md and LeeWay Runtime Fabric authority.',
    inputs: ['Authorized request'], outputs: ['Capability-specific result with evidence only when executed'],
    compatibleNeighbors: [], registryState: 'CANONICAL_DISCOVERED', qualificationState: 'NOT_INFERRED_FROM_PRESENCE',
    executionState: 'NOT_TRIGGERED', evidenceState: 'CARRIER_DESCRIPTOR'
  };
}

export default function App() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [registry, setRegistry] = useState<{ counts: { canonicalSkillMd: number; mcpProtocolListedTools: number }; commit: string } | null>(null);
  const [registryError, setRegistryError] = useState<string | null>(null);
  const [branches] = useState<Record<BranchKey, Branch>>(BRANCHES);
  const [activeSkillNames, setActiveSkillNames] = useState<Set<string>>(() => new Set());
  const [usageSource, setUsageSource] = useState('UNAVAILABLE');
  const [liveSkillNames, setLiveSkillNames] = useState<Set<string> | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [panel, setPanel] = useState<'none' | 'branches' | 'basket' | 'pipeline' | 'github' | 'export' | 'near'>('none');

  const refreshRegistry = useCallback(() => {
    loadCanonicalRegistry().then(({ registry: nextRegistry, skills: nextSkills }) => {
      setRegistry(nextRegistry);
      setSkills(nextSkills);
      setRegistryError(null);
    }).catch((error) => setRegistryError(error?.message || 'GRAPEVINE_REGISTRY_LOAD_FAILED'));
  }, []);

  useEffect(() => {
    refreshRegistry();
    const registryTimer = window.setInterval(refreshRegistry, 15000);
    let alive = true;
    const pollUsage = async () => {
      try {
        const response = await fetch(CARRIER_USAGE_URL, { cache: 'no-store' });
        if (!response.ok) throw new Error(`USAGE_${response.status}`);
        const payload = await response.json();
        if (!alive) return;
        setActiveSkillNames(new Set((payload.active || []).map((item: { name: string }) => item.name)));
        setUsageSource('MACHINE_CONSCIOUSNESS_CARRIER');
      } catch {
        if (!alive) return;
        setActiveSkillNames(new Set());
        setUsageSource('UNAVAILABLE');
      }
    };
    pollUsage();
    const usageTimer = window.setInterval(pollUsage, 1000);
    const pollRegistry = async () => {
      try {
        const response = await fetch(CARRIER_REGISTRY_URL, { cache: 'no-store' });
        if (!response.ok) throw new Error(`REGISTRY_${response.status}`);
        const payload = await response.json();
        if (alive) setLiveSkillNames(new Set((payload.skills || []).map((item: { name: string }) => item.name)));
      } catch { if (alive) setLiveSkillNames(null); }
    };
    pollRegistry();
    const liveTimer = window.setInterval(pollRegistry, 15000);
    return () => { alive = false; window.clearInterval(registryTimer); window.clearInterval(usageTimer); window.clearInterval(liveTimer); };
  }, [refreshRegistry]);

  useEffect(() => {
    if (!liveSkillNames) return;
    setSkills((previous) => {
      const kept = previous.filter((skill) => liveSkillNames.has(skill.name));
      const present = new Set(kept.map((skill) => skill.name));
      const grown = [...liveSkillNames].filter((name) => !present.has(name)).map((name, index) => skillFromLiveName(name, index));
      return [...kept, ...grown];
    });
  }, [liveSkillNames]);

  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [nearFocalSkill, setNearFocalSkill] = useState<Skill | null>(null);
  const [basket, setBasket] = useState<Skill[]>([]);
  useEffect(() => {
    if (!skills.length) return;
    try {
      const saved = localStorage.getItem('leeway_harvest_basket_v2');
      const ids = saved ? JSON.parse(saved) : [];
      if (Array.isArray(ids)) setBasket(ids.map((id) => skills.find((s) => s.id === id)).filter(Boolean).slice(0, 5) as Skill[]);
    } catch { /* ignore local state */ }
  }, [skills]);
  useEffect(() => {
    try { localStorage.setItem('leeway_harvest_basket_v2', JSON.stringify(basket.map((s) => s.id))); } catch { /* ignore */ }
  }, [basket]);

  const [activeBranchFilter, setActiveBranchFilter] = useState<BranchKey | null>(null);
  const [isCloseUp, setIsCloseUp] = useState(false);
  const [cameraYaw, setCameraYaw] = useState(0);
  const [cameraPitch, setCameraPitch] = useState(0);
  const [cameraZoom, setCameraZoom] = useState(1);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const handleToggleAudio = () => { const next = !isAudioEnabled; setIsAudioEnabled(next); sounds.enabled = next; };
  const handleCenterCamera = useCallback(() => { setCameraYaw(0); setCameraPitch(0); setCameraZoom(1); setActiveBranchFilter(null); setIsCloseUp(false); setPanel('none'); }, []);
  const handleSelectSkill = useCallback((skill: Skill) => {
    setSelectedSkill(skill);
    setNearFocalSkill(skill);
    sounds.playChime();
  }, []);
  const handleAddToBasket = useCallback((skill: Skill) => setBasket((prev) => prev.some((s) => s.id === skill.id) || prev.length >= 5 ? prev : [...prev, skill]), []);
  const handleRemoveFromBasket = useCallback((skillId: string) => setBasket((prev) => prev.filter((s) => s.id !== skillId)), []);
  const handleClearBasket = useCallback(() => setBasket([]), []);
  const handleToggleAttach = useCallback((skill: Skill) => setBasket((prev) => prev.some((s) => s.id === skill.id) ? prev.filter((s) => s.id !== skill.id) : prev.length >= 5 ? prev : [...prev, skill]), []);
  const handleSuggestNear = useCallback(() => {
    if (!skills.length) return;
    const anchor = basket[basket.length - 1] || skills[0];
    const candidate = skills.find((s) => anchor.compatibleNeighbors.includes(s.id) && !basket.some((b) => b.id === s.id)) || skills.find((s) => s.branchKey === anchor.branchKey && !basket.some((b) => b.id === s.id)) || skills.find((s) => !basket.some((b) => b.id === s.id));
    if (candidate) { handleAddToBasket(candidate); setNearFocalSkill(candidate); }
  }, [basket, skills, handleAddToBasket]);
  const handleSelectBranch = useCallback((key: BranchKey) => {
    const branch = branches[key];
    setCameraYaw(branch.yaw); setCameraPitch(branch.pitch); setCameraZoom(1.5); setActiveBranchFilter(key); setPanel('none');
  }, [branches]);

  const togglePanel = (next: typeof panel) => { setPanel((current) => current === next ? 'none' : next); setMenuOpen(false); };

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-black select-none">
      <Grapevine3DCanvas
        skills={skills} branches={branches} selectedSkill={selectedSkill} basket={basket}
        activeSkillNames={activeSkillNames} activeBranchFilter={activeBranchFilter}
        nearModeSkill={nearFocalSkill} isNearModeActive={panel === 'near'} isCloseUp={isCloseUp}
        onSelectSkill={handleSelectSkill} cameraYaw={cameraYaw} cameraPitch={cameraPitch} cameraZoom={cameraZoom}
        onCameraChange={(yaw, pitch, zoom) => { setCameraYaw(yaw); setCameraPitch(pitch); setCameraZoom(zoom); }}
      />
      {registryError && <div className="absolute left-1/2 top-3 z-30 -translate-x-1/2 rounded-xl border border-red-500/60 bg-red-950/90 px-4 py-2 font-mono text-xs text-red-100">Registry blocked: {registryError}</div>}

      <button type="button" aria-label="Agent Skills menu" title="Agent Skills menu"
        className="absolute right-4 top-4 z-40 flex h-12 w-12 items-center justify-center rounded-full border border-emerald-300/50 bg-black/80 font-black text-emerald-200 shadow-lg backdrop-blur hover:bg-emerald-900/40"
        onClick={() => setMenuOpen((v) => !v)}>≡</button>
      {menuOpen && (
        <div className="absolute right-4 top-16 z-30 w-56 rounded-xl border border-emerald-300/40 bg-black/90 p-2 text-xs text-emerald-100 shadow-2xl backdrop-blur">
          <div className="border-b border-emerald-300/20 px-2 pb-2 text-[10px] uppercase tracking-widest text-emerald-300/70">Usage {usageSource} · {activeSkillNames.size} active</div>
          {[['branches','Branches'],['basket','Harvest Basket'],['near','Near Radar'],['pipeline','Pipeline'],['github','GitHub'],['export','Export'],].map(([key,label]) => (
            <button key={key} type="button" onClick={() => togglePanel(key as typeof panel)}
              className="mt-1 block w-full rounded-lg px-2 py-2 text-left font-semibold hover:bg-emerald-400/15">{label}</button>
          ))}
          <button type="button" onClick={handleCenterCamera} className="mt-2 block w-full rounded-lg border border-emerald-300/30 px-2 py-2 text-left font-semibold hover:bg-emerald-400/15">Center vine</button>
          <button type="button" onClick={handleToggleAudio} className="mt-1 block w-full rounded-lg px-2 py-2 text-left font-semibold hover:bg-emerald-400/15">Sound {isAudioEnabled ? 'on' : 'off'}</button>
        </div>
      )}

      {panel === 'branches' && <BranchDrawer isOpen onClose={() => setPanel('none')} branches={branches} skills={skills} activeBranchFilter={activeBranchFilter} onSelectBranch={handleSelectBranch} onClearFilter={() => setActiveBranchFilter(null)} onCenterCamera={handleCenterCamera} />}
      {panel === 'basket' && <HarvestBasket basket={basket} branches={branches} onRemoveSkill={handleRemoveFromBasket} onClearBasket={handleClearBasket} onInspectSkill={setSelectedSkill} onExecutePipeline={() => togglePanel('pipeline')} onExportPipeline={() => togglePanel('export')} onSuggestNear={handleSuggestNear} />}
      {panel === 'near' && nearFocalSkill && <GrapevineNearRadar focalSkill={nearFocalSkill} allSkills={skills} branches={branches} basket={basket} onSelectSkill={handleSelectSkill} onAddToBasket={handleAddToBasket} onClose={() => setPanel('none')} />}
      {panel === 'pipeline' && <PipelineRunnerModal basket={basket} branches={branches} registry={registry as never} onClose={() => setPanel('none')} />}
      {panel === 'github' && <GitHubSyncModal registry={registry as never} onClose={() => setPanel('none')} />}
      {panel === 'export' && <ExportPipelineModal basket={basket} branches={branches} registry={registry as never} onClose={() => setPanel('none')} />}
      {selectedSkill && <SkillInspectorModal skill={selectedSkill} branch={branches[selectedSkill.branchKey]} basket={basket} onClose={() => setSelectedSkill(null)} onToggleAttach={handleToggleAttach} onSelectNeighbor={(neighborId) => { const found = skills.find((s) => s.id === neighborId); if (found) { setSelectedSkill(found); setNearFocalSkill(found); } }} />}
    </main>
  );
}

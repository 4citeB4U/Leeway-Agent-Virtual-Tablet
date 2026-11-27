import React from 'react';
import { Branch, BranchKey, Skill } from '../types/skills';
import { X, Compass, ExternalLink, ShieldCheck } from 'lucide-react';
import { sounds } from '../utils/audio';

interface BranchDrawerProps {
  isOpen: boolean; onClose: () => void; branches: Record<BranchKey, Branch>; skills: Skill[];
  activeBranchFilter: BranchKey | null; onSelectBranch: (branchKey: BranchKey) => void;
  onClearFilter: () => void; onCenterCamera: () => void;
}
export const BranchDrawer: React.FC<BranchDrawerProps> = ({ isOpen,onClose,branches,skills,activeBranchFilter,onSelectBranch,onClearFilter,onCenterCamera }) => (
<>
  <div onClick={onClose} className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 ${isOpen?'opacity-100 pointer-events-auto':'opacity-0 pointer-events-none'}`} />
  <aside className={`fixed top-0 bottom-0 left-0 w-80 max-w-[85vw] bg-[#060e13]/98 border-r border-[#39FF14]/40 z-50 p-6 flex flex-col shadow-[8px_0_36px_rgba(0,0,0,0.85)] transition-transform duration-300 ease-out ${isOpen?'translate-x-0':'-translate-x-full'}`}>
    <div className="flex items-center justify-between pb-4 border-b border-white/10">
      <div><h2 className="text-lg font-black text-[#39FF14] tracking-wide">LeeWay Skills</h2><p className="text-xs text-zinc-400 font-mono">Grapevine 3D Navigator</p></div>
      <button onClick={onClose} className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"><X className="w-5 h-5"/></button>
    </div>
    <div className="mt-5 mb-3 flex items-center justify-between"><span className="text-[10px] font-mono font-bold tracking-wider text-zinc-500 uppercase">Tendril Platform Orbits</span>{activeBranchFilter&&<button onClick={()=>{sounds.playClick();onClearFilter()}} className="text-[10px] font-mono text-[#39FF14] hover:underline">Show All</button>}</div>
    <div className="flex-1 overflow-y-auto space-y-2 pr-1">
      {(Object.keys(branches) as BranchKey[]).map(key=>{const b=branches[key],branchSkills=skills.filter(s=>s.branchKey===key),selected=activeBranchFilter===key;return <div key={key} onClick={()=>{sounds.playClick();onSelectBranch(key)}} className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between group ${selected?'bg-white/10 border-[#39FF14] shadow-[0_0_15px_rgba(57,255,20,0.2)]':'bg-white/[0.03] border-white/5 hover:border-white/20 hover:bg-white/[0.06]'}`}>
        <div className="flex items-center gap-3 overflow-hidden"><div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 border" style={{backgroundColor:`${b.color}20`,borderColor:b.color,color:b.color}}>{b.icon}</div><div className="truncate"><h4 className="text-xs font-bold text-white group-hover:text-[#39FF14] transition-colors truncate">{b.title}</h4><p className="text-[10px] text-zinc-400 truncate">{b.subtitle}</p></div></div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 text-zinc-300">{branchSkills.length} grapes</span>
      </div>})}
    </div>
    <div className="pt-4 border-t border-white/10 space-y-2">
      <button onClick={()=>{sounds.playClick();onCenterCamera();onClose()}} className="w-full py-3 rounded-xl bg-[#39FF14] hover:bg-[#32e012] text-black font-black text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all"><Compass className="w-4 h-4"/>Center Full Grapevine</button>
      <a href="https://github.com/4citeB4U/LeeWay-Agent-Skills" target="_blank" rel="noreferrer" className="w-full py-2.5 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] text-zinc-300 hover:text-white font-mono text-[11px] flex items-center justify-center gap-1.5 transition-colors"><ExternalLink className="w-3.5 h-3.5"/>Open Canonical Repository</a>
      <div className="pt-2 flex items-center gap-1.5 text-[9px] font-mono text-zinc-500"><ShieldCheck className="w-3 h-3 text-[#39FF14]"/>Branches visualize registry grouping, not blanket platform qualification.</div>
    </div>
  </aside>
</>
);

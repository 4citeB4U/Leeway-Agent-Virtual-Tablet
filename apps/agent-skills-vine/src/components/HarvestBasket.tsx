import React from 'react';
import { Branch, BranchKey, Skill } from '../types/skills';
import { Play, RotateCcw, Download, Sparkles, X, ShieldCheck } from 'lucide-react';
import { sounds } from '../utils/audio';

interface HarvestBasketProps {
  basket: Skill[];
  branches: Record<BranchKey, Branch>;
  onRemoveSkill:(skillId:string)=>void;
  onClearBasket:()=>void;
  onInspectSkill:(skill:Skill)=>void;
  onExecutePipeline:()=>void;
  onExportPipeline:()=>void;
  onSuggestNear:()=>void;
}

export const HarvestBasket: React.FC<HarvestBasketProps> = ({
  basket, branches, onRemoveSkill, onClearBasket, onInspectSkill, onExecutePipeline, onExportPipeline, onSuggestNear
}) => {
  const maxSlots=5;

  const controls = (mobile=false) => (
    <div className="flex items-center gap-1.5 shrink-0">
      {basket.length<maxSlots&&<button onClick={()=>{sounds.playChime();onSuggestNear()}} title="Suggest a nearby canonical skill" className={`${mobile?'w-9 px-0':'h-8 px-2.5'} h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#39FF14] text-[11px] font-mono font-medium text-zinc-300 hover:text-[#39FF14] flex items-center justify-center gap-1.5 transition-all`}><Sparkles className="w-3.5 h-3.5 text-[#39FF14]"/>{!mobile&&<span>Near Suggest</span>}</button>}
      {basket.length>0&&<>
        <button onClick={()=>{sounds.playClick();onExportPipeline()}} title="Export selection manifest" className={`${mobile?'w-9 px-0':'h-8 px-2.5'} h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#38edf8] text-[11px] font-mono font-medium text-zinc-300 hover:text-[#38edf8] flex items-center justify-center gap-1.5 transition-all`}><Download className="w-3.5 h-3.5"/>{!mobile&&<span>Export Manifest</span>}</button>
        <button onClick={()=>{sounds.playClick();onClearBasket()}} title="Clear harvest basket" className="w-9 h-9 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 flex items-center justify-center transition-colors"><RotateCcw className="w-3.5 h-3.5"/></button>
      </>}
      <button onClick={()=>{if(!basket.length)return;sounds.playChime();onExecutePipeline()}} disabled={!basket.length} title="Open Pipeline Authority Gate" className={`${mobile?'w-10 px-0':'h-8 px-3.5'} h-9 rounded-xl font-black text-xs tracking-wider flex items-center justify-center gap-1.5 uppercase transition-all shadow-lg ${basket.length?'bg-[#39FF14] text-black hover:bg-[#32e012]':'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'}`}><Play className="w-3.5 h-3.5 fill-current"/>{!mobile&&<span>Pipeline Gate</span>}</button>
    </div>
  );

  return <>
    {/* Mobile: compact one-row footer. No oversized multi-row box. */}
    <div className="md:hidden absolute bottom-2 left-2 right-2 bg-[#060e13]/95 backdrop-blur-xl border border-[#39FF14]/45 rounded-xl px-2 py-2 shadow-[0_10px_35px_rgba(0,0,0,0.86)] z-20">
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-[66px] shrink-0 border-r border-white/10 pr-2">
          <div className="text-[9px] font-black tracking-wider text-[#39FF14] uppercase leading-none">Harvest</div>
          <div className="mt-1 text-[9px] font-mono text-zinc-400">{basket.length}/{maxSlots} skills</div>
        </div>
        <div className="flex-1 min-w-0 overflow-x-auto">
          <div className="flex items-center gap-1.5 min-w-max pr-1">
            {basket.length===0&&<span className="text-[9px] font-mono text-zinc-600 whitespace-nowrap px-1">Tap a grape to select it</span>}
            {basket.map((skill,index)=>{const branch=branches[skill.branchKey];return <button key={skill.id} onClick={()=>{sounds.playClick();onInspectSkill(skill)}} style={{borderColor:`${branch.color}70`}} className="group relative h-9 max-w-[94px] min-w-[74px] rounded-lg bg-[#09151c]/95 border px-2 flex items-center gap-1.5 text-left">
              <span className="w-2 h-2 rounded-full shrink-0" style={{backgroundColor:branch.color,boxShadow:`0 0 8px ${branch.color}`}}/>
              <span className="text-[9px] font-bold text-white truncate">{skill.name}</span>
              <span onClick={(e)=>{e.stopPropagation();sounds.playPop();onRemoveSkill(skill.id)}} className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-black border border-white/15 text-zinc-400 flex items-center justify-center"><X className="w-2.5 h-2.5"/></span>
              <span className="sr-only">Slot {index+1}</span>
            </button>})}
          </div>
        </div>
        {controls(true)}
      </div>
    </div>

    {/* Tablet/Desktop: retain the full authority-oriented basket. */}
    <div className="hidden md:block absolute bottom-4 left-8 right-8 bg-[#060e13]/95 backdrop-blur-xl border border-[#39FF14]/50 rounded-2xl p-4 shadow-[0_12px_45px_rgba(0,0,0,0.85)] z-20 transition-all">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-[#39FF14] animate-ping"/><h2 className="text-sm font-black tracking-widest text-[#39FF14] uppercase">Agent Harvest Basket</h2></div>
          <span className="text-[11px] font-mono text-zinc-400">{basket.length}/{maxSlots} canonical skills selected</span>
          {basket.length>0&&<div className="flex items-center gap-2 text-[10px] font-mono text-zinc-400"><span>·</span><span className="text-[#38edf8] font-bold flex items-center gap-1"><ShieldCheck className="w-3 h-3"/>Selection only — execution still requires Runtime Fabric authority</span></div>}
        </div>
        {controls(false)}
      </div>
      <div className="grid grid-cols-3 lg:grid-cols-5 gap-2">{Array.from({length:maxSlots}).map((_,index)=>{const skill=basket[index];if(skill){const branch=branches[skill.branchKey];return <div key={skill.id} onClick={()=>{sounds.playClick();onInspectSkill(skill)}} style={{borderColor:`${branch.color}80`}} className="group relative h-14 rounded-xl bg-[#09151c]/90 border p-2 flex flex-col justify-between cursor-pointer hover:bg-white/[0.07] transition-all"><div className="flex items-center justify-between gap-1"><div className="flex items-center gap-1.5 truncate"><span className="text-xs shrink-0" style={{color:branch.color}}>{branch.icon}</span><span className="text-[11px] font-bold text-white truncate group-hover:text-[#39FF14]">{skill.name}</span></div><button onClick={(e)=>{e.stopPropagation();sounds.playPop();onRemoveSkill(skill.id)}} className="w-4 h-4 rounded-full bg-black/60 hover:bg-red-500/80 text-zinc-400 hover:text-white flex items-center justify-center"><X className="w-2.5 h-2.5"/></button></div><div className="flex items-center justify-between text-[9px] font-mono text-zinc-400"><span style={{color:branch.color}}>SLOT {index+1}</span><span className="text-[#39FF14]">{skill.registryState.replace('CANONICAL_','')}</span></div></div>}return <div key={index} className="h-14 rounded-xl border border-dashed border-white/10 bg-black/30 flex flex-col items-center justify-center text-zinc-600 font-mono text-[10px]"><span>EMPTY SLOT {index+1}</span><span className="text-[8px] text-zinc-700">Click grape to harvest</span></div>})}</div>
    </div>
  </>;
};

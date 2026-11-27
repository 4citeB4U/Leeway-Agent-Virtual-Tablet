import React from 'react';
import { Menu, RotateCcw, Crosshair, ZoomIn, ZoomOut, Volume2, VolumeX, Github, Compass } from 'lucide-react';
import { sounds } from '../utils/audio';

interface TopBarProps {
  onOpenDrawer: () => void;
  onCenterCamera: () => void;
  onToggleNearMode: () => void;
  isNearModeActive: boolean;
  onToggleCloseUp: () => void;
  isCloseUp: boolean;
  isAudioEnabled: boolean;
  onToggleAudio: () => void;
  onOpenGitHubModal: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  onOpenDrawer,
  onCenterCamera,
  onToggleNearMode,
  isNearModeActive,
  onToggleCloseUp,
  isCloseUp,
  isAudioEnabled,
  onToggleAudio,
  onOpenGitHubModal,
}) => {
  return (
    <header className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none z-20">
      <div className="flex items-center gap-2.5 pointer-events-auto">
        <button
          onClick={() => { sounds.playClick(); onOpenDrawer(); }}
          title="Open Tendril Branches Drawer"
          className="w-11 h-11 rounded-full bg-[#060e13]/85 border-[1.5px] border-[#39FF14] text-[#39FF14] flex items-center justify-center cursor-pointer shadow-[0_4px_20px_rgba(0,0,0,0.8)] hover:bg-[#39FF14]/20 active:scale-92 transition-all"
        >
          <Menu className="w-5 h-5" />
        </button>
        <button
          onClick={() => { sounds.playClick(); onOpenGitHubModal(); }}
          title="LeeWay GitHub Repo Registry"
          className="h-9 px-3.5 rounded-full bg-[#060e13]/85 border border-white/20 text-zinc-300 hover:text-white hover:border-[#39FF14] flex items-center gap-2 text-xs font-mono font-bold tracking-wider shadow-lg active:scale-95 transition-all"
        >
          <Github className="w-3.5 h-3.5 text-[#39FF14]" />
          <span className="hidden sm:inline">4citeB4U/LeeWay-Agent-Skills</span>
          <span className="sm:hidden">LeeWay</span>
        </button>
      </div>
      <div className="flex items-center gap-2 pointer-events-auto">
        <button
          onClick={() => { sounds.playClick(); onToggleNearMode(); }}
          title="Toggle Grapevine Near Proximity Mode"
          className={`h-9 px-3.5 rounded-full text-[11px] font-mono font-bold tracking-wider flex items-center gap-1.5 shadow-lg transition-all ${isNearModeActive ? 'bg-[#39FF14] text-black border border-[#39FF14] shadow-[#39FF14]/30' : 'bg-[#060e13]/85 border border-[#39FF14]/60 text-[#39FF14] hover:bg-[#39FF14]/15'}`}
        >
          <Crosshair className="w-3.5 h-3.5 animate-pulse" />
          <span>GRAPEVINE NEAR</span>
        </button>
        <button
          onClick={() => { sounds.playClick(); onToggleCloseUp(); }}
          title={isCloseUp ? 'Switch to Full Tree View' : 'Macro 1-Inch View (Close-Up)'}
          className={`h-9 px-3 rounded-full text-[11px] font-mono font-bold tracking-wider flex items-center gap-1.5 border transition-all ${isCloseUp ? 'bg-[#ff007f]/20 border-[#ff007f] text-[#ff007f]' : 'bg-[#060e13]/85 border-white/20 text-zinc-300 hover:text-white hover:border-white/40'}`}
        >
          {isCloseUp ? <ZoomOut className="w-3.5 h-3.5" /> : <ZoomIn className="w-3.5 h-3.5" />}
          <span className="hidden md:inline">{isCloseUp ? 'FULL TREE' : '1" CLOSE-UP'}</span>
        </button>
        <button
          onClick={() => { sounds.playClick(); onCenterCamera(); }}
          title="Reset Camera & Center Grapevine Tree"
          className="h-9 px-3 rounded-full bg-[#060e13]/85 border border-[#39FF14]/60 text-[#39FF14] text-[11px] font-mono font-bold tracking-wider flex items-center gap-1.5 hover:bg-[#39FF14]/15 active:scale-95 transition-all shadow-lg"
        >
          <Compass className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">CENTER</span>
        </button>
        <button
          onClick={() => { onToggleAudio(); sounds.playClick(); }}
          title={isAudioEnabled ? 'Mute Procedural Audio' : 'Unmute Procedural Audio'}
          className="w-9 h-9 rounded-full bg-[#060e13]/85 border border-white/20 text-zinc-400 hover:text-white flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all"
        >
          {isAudioEnabled ? <Volume2 className="w-3.5 h-3.5 text-[#39FF14]" /> : <VolumeX className="w-3.5 h-3.5" />}
        </button>
      </div>
    </header>
  );
};

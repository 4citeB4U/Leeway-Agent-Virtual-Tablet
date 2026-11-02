import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Volume2, Sparkles, Loader2, Download, Copy, Check } from 'lucide-react';
import { StudioArtifact } from '../../types';

interface AudioOverviewPlayerProps {
  artifact?: StudioArtifact;
  onGenerateNew: () => void;
  isGenerating: boolean;
  notebookTitle: string;
}

interface DialogueLine {
  speaker: string;
  text: string;
}

export const AudioOverviewPlayer: React.FC<AudioOverviewPlayerProps> = ({
  artifact,
  onGenerateNew,
  isGenerating,
  notebookTitle,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeLineIdx, setActiveLineIdx] = useState<number>(-1);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [copied, setCopied] = useState(false);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const linesRef = useRef<DialogueLine[]>([]);

  // Parse dialogue lines from transcript
  const lines: DialogueLine[] = React.useMemo(() => {
    if (!artifact?.content) return [];
    const rawLines = artifact.content.split('\n').filter(l => l.trim().length > 0);
    const parsed: DialogueLine[] = [];

    for (const line of rawLines) {
      const match = line.match(/^(Morgan|Alex|Host 1|Host 2|Speaker 1|Speaker 2):\s*(.*)$/i);
      if (match) {
        parsed.push({
          speaker: match[1],
          text: match[2].trim()
        });
      } else if (parsed.length > 0) {
        parsed[parsed.length - 1].text += ' ' + line.trim();
      } else {
        parsed.push({
          speaker: 'Alex',
          text: line.trim()
        });
      }
    }
    return parsed;
  }, [artifact?.content]);

  linesRef.current = lines;

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }
    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  const stopPlayback = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    setIsPlaying(false);
    setActiveLineIdx(-1);
  };

  const playLine = (index: number) => {
    if (!synthRef.current || index >= lines.length) {
      stopPlayback();
      return;
    }

    setActiveLineIdx(index);
    const current = lines[index];
    const utterance = new SpeechSynthesisUtterance(current.text);
    utterance.rate = playbackSpeed;

    // Pick natural voices if available
    const voices = synthRef.current.getVoices();
    if (voices.length > 0) {
      const isAlex = /alex|host 1|speaker 1/i.test(current.speaker);
      const voice = isAlex
        ? voices.find(v => v.lang.startsWith('en') && (v.name.includes('Male') || v.name.includes('David') || v.name.includes('Daniel') || v.name.includes('George'))) || voices[0]
        : voices.find(v => v.lang.startsWith('en') && (v.name.includes('Female') || v.name.includes('Samantha') || v.name.includes('Victoria') || v.name.includes('Zira') || v.name.includes('Google US English'))) || voices[1] || voices[0];
      if (voice) utterance.voice = voice;
    }

    utterance.onend = () => {
      if (isPlaying) {
        playLine(index + 1);
      }
    };

    utterance.onerror = () => {
      stopPlayback();
    };

    synthRef.current.speak(utterance);
  };

  const togglePlay = () => {
    if (isPlaying) {
      stopPlayback();
    } else {
      setIsPlaying(true);
      const startIdx = activeLineIdx >= 0 && activeLineIdx < lines.length ? activeLineIdx : 0;
      playLine(startIdx);
    }
  };

  const handleCopyTranscript = () => {
    if (!artifact?.content) return;
    navigator.clipboard.writeText(artifact.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTranscript = () => {
    if (!artifact?.content) return;
    const blob = new Blob([artifact.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audio-overview-${notebookTitle.toLowerCase().replace(/\s+/g, '-')}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!artifact && !isGenerating) {
    return (
      <div className="p-6 bg-stone-900/60 border border-stone-800 rounded-xl text-center flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-orange-950/60 border border-orange-500/40 text-orange-400 flex items-center justify-center">
          <Volume2 size={24} />
        </div>
        <div>
          <h4 className="text-sm font-bold text-stone-200">Generate Audio Overview</h4>
          <p className="text-xs text-stone-400 max-w-sm mt-1">
            Turn your notebook sources into a lively 2-host conversational podcast (like NotebookLM's Audio Overview) with Alex and Morgan.
          </p>
        </div>
        <button
          onClick={onGenerateNew}
          className="px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-md transition-all active:scale-95"
        >
          <Sparkles size={14} />
          <span>Generate Podcast Deep Dive</span>
        </button>
      </div>
    );
  }

  return (
    <div className="bg-stone-900/90 border border-stone-800 rounded-xl overflow-hidden flex flex-col shadow-lg">
      {/* Player Header */}
      <div className="p-4 bg-stone-950 border-b border-stone-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isPlaying ? 'bg-orange-500 text-white animate-pulse' : 'bg-stone-800 text-orange-400'}`}>
            <Volume2 size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-orange-950/80 border border-orange-800/60 text-orange-300">
                Audio Overview
              </span>
              <span className="text-[10px] text-stone-400">2-Host Deep Dive</span>
            </div>
            <h4 className="text-xs font-bold text-white mt-0.5 truncate max-w-md">
              {artifact?.title || `Deep Dive: ${notebookTitle}`}
            </h4>
          </div>
        </div>

        {/* Player Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={togglePlay}
            disabled={isGenerating || lines.length === 0}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm ${
              isPlaying
                ? 'bg-amber-500 hover:bg-amber-400 text-black font-extrabold'
                : 'bg-orange-600 hover:bg-orange-500 text-white'
            }`}
          >
            {isPlaying ? <Pause size={14} /> : <Play size={14} />}
            <span>{isPlaying ? 'Pause Audio' : 'Listen Now'}</span>
          </button>

          <button
            onClick={stopPlayback}
            title="Reset from start"
            className="p-1.5 text-stone-400 hover:text-white rounded bg-stone-800 border border-stone-700 hover:bg-stone-700"
          >
            <RotateCcw size={13} />
          </button>

          <select
            value={playbackSpeed}
            onChange={e => setPlaybackSpeed(parseFloat(e.target.value))}
            className="bg-stone-800 text-stone-200 border border-stone-700 rounded px-1.5 py-1 text-[10px] outline-none"
          >
            <option value="0.85">0.85x</option>
            <option value="1">1.0x</option>
            <option value="1.25">1.25x</option>
            <option value="1.5">1.5x</option>
          </select>

          <button
            onClick={onGenerateNew}
            disabled={isGenerating}
            title="Regenerate podcast script from current sources"
            className="p-1.5 text-stone-300 hover:text-orange-400 rounded bg-stone-800 border border-stone-700 hover:bg-stone-700 disabled:opacity-50"
          >
            {isGenerating ? <Loader2 size={13} className="animate-spin text-orange-400" /> : <Sparkles size={13} />}
          </button>

          <button
            onClick={handleCopyTranscript}
            title="Copy script to clipboard"
            className="p-1.5 text-stone-400 hover:text-white rounded bg-stone-800 border border-stone-700"
          >
            {copied ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
          </button>

          <button
            onClick={handleDownloadTranscript}
            title="Download script markdown"
            className="p-1.5 text-stone-400 hover:text-white rounded bg-stone-800 border border-stone-700"
          >
            <Download size={13} />
          </button>
        </div>
      </div>

      {/* Transcript Scroll Area */}
      <div className="p-4 space-y-3 max-h-80 overflow-y-auto font-sans text-xs">
        {lines.map((line, idx) => {
          const isAlex = /alex|host 1|speaker 1/i.test(line.speaker);
          const isCurrent = activeLineIdx === idx;

          return (
            <div
              key={idx}
              onClick={() => {
                setIsPlaying(true);
                playLine(idx);
              }}
              className={`p-3 rounded-xl border transition-all cursor-pointer ${
                isCurrent
                  ? 'bg-orange-950/40 border-orange-500/60 ring-1 ring-orange-500/40 shadow-sm'
                  : 'bg-stone-950/40 border-stone-800 hover:border-stone-700 text-stone-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                  isAlex ? 'bg-cyan-900 text-cyan-200' : 'bg-purple-900 text-purple-200'
                }`}>
                  {isAlex ? 'A' : 'M'}
                </div>
                <span className={`text-[11px] font-bold ${isAlex ? 'text-cyan-400' : 'text-purple-400'}`}>
                  {line.speaker}
                </span>
                {isCurrent && (
                  <span className="ml-auto text-[9px] text-orange-400 font-bold flex items-center gap-1 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span>
                    Speaking
                  </span>
                )}
              </div>
              <p className={`text-xs leading-relaxed ${isCurrent ? 'text-white font-medium' : 'text-stone-300'}`}>
                {line.text}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import {
  Brain,
  Layers,
  Columns,
  MessageSquare,
  Database,
  Play,
  Plus,
  Search,
  Check,
  ChevronRight,
  Edit3,
  Download,
  Send,
  FileText,
  BookOpen,
  Sparkles,
  Share2,
  Copy,
  Loader2,
  X
} from 'lucide-react';

// Multi-Agent Registry
export interface AgentDefinition {
  id: string;
  name: string;
  role: string;
  color: string;
  badgeBg: string;
  badgeText: string;
  borderColor: string;
  avatarIcon: string;
  description: string;
}

export const AGENT_REGISTRY: Record<string, AgentDefinition> = {
  ResearchAgent: {
    id: 'ResearchAgent',
    name: 'Dr. Rachel (Research)',
    role: 'Evidence & Benchmarking',
    color: '#0284c7',
    badgeBg: 'bg-sky-50',
    badgeText: 'text-sky-700',
    borderColor: 'border-sky-300',
    avatarIcon: '🔍',
    description: 'Evaluates hardware requirements, gathers benchmarks, and posts verified evidence.'
  },
  PlannerAgent: {
    id: 'PlannerAgent',
    name: 'Devon (Planner)',
    role: 'Architecture & Task Breakdown',
    color: '#d97706',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-700',
    borderColor: 'border-amber-300',
    avatarIcon: '📐',
    description: 'Reads research evidence from the board, designs system architecture, and decomposes tasks.'
  },
  CoderAgent: {
    id: 'CoderAgent',
    name: 'Alex (Coder)',
    role: 'Implementation & Artifacts',
    color: '#4f46e5',
    badgeBg: 'bg-indigo-50',
    badgeText: 'text-indigo-700',
    borderColor: 'border-indigo-300',
    avatarIcon: '💻',
    description: 'Claims tasks marked ready, writes API endpoints, schema, and implementation code artifacts.'
  },
  ReviewerAgent: {
    id: 'ReviewerAgent',
    name: 'Marcus (Reviewer)',
    role: 'Verification & Safety Auditing',
    color: '#e11d48',
    badgeBg: 'bg-rose-50',
    badgeText: 'text-rose-700',
    borderColor: 'border-rose-300',
    avatarIcon: '🛡️',
    description: 'Monitors new code and decisions, tests for latency/security constraints, and posts approval.'
  },
  AgentLee: {
    id: 'AgentLee',
    name: 'Agent Lee (Coordinator)',
    role: 'Blackboard Orchestrator',
    color: '#059669',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-700',
    borderColor: 'border-emerald-300',
    avatarIcon: '🧠',
    description: 'Maintains single source of truth, prioritizes tasks, resolves conflicts, and syncs durable state.'
  }
};

export interface BlackboardRecord {
  id: string;
  goal: string;
  task: string;
  owner: string;
  status: 'Proposed' | 'In Progress' | 'Review' | 'Resolved';
  evidence: string;
  decision: string;
  nextAction: string;
  priority: 'high' | 'medium' | 'low';
  timestamp: string;
  tags: string[];
  codeSnippet?: string;
}

export interface BlackboardEvent {
  id: string;
  agent: string;
  text: string;
  type: 'post' | 'decision' | 'claim' | 'verify' | 'system';
  timestamp: string;
  relatedRecordId?: string;
}

export interface BlackboardMemory {
  id: string;
  category: 'DecisionLog' | 'Constraint' | 'TechStack' | 'Pattern';
  title: string;
  content: string;
  updatedBy: string;
  lastUpdated: string;
}

export interface NotepadTaskItem {
  id: string;
  text: string;
  done: boolean;
}

const INITIAL_RECORDS: BlackboardRecord[] = [
  {
    id: 'rec-1',
    goal: 'Build a local voice-assistant prototype',
    task: 'Compare offline speech-to-text models & benchmark latency',
    owner: 'ResearchAgent',
    status: 'Resolved',
    evidence: 'whisper.cpp vs faster-whisper: faster-whisper achieves 112ms per 5s audio chunk on Apple Silicon CPU (4x faster, 65% lower VRAM footprint than vanilla PyTorch whisper).',
    decision: 'Use faster-whisper with CTranslate2 backend for the local prototype.',
    nextAction: 'CodeAgent creates FastAPI streaming WebSocket endpoint',
    priority: 'high',
    timestamp: '10:14 AM',
    tags: ['STT', 'faster-whisper', 'Latency'],
    codeSnippet: `from faster_whisper import WhisperModel\n\nmodel = WhisperModel("small.en", device="cpu", compute_type="int8")\nsegments, info = model.transcribe("audio.wav", beam_size=5)`
  },
  {
    id: 'rec-2',
    goal: 'Build a local voice-assistant prototype',
    task: 'Construct streaming FastAPI WebSocket endpoint for audio chunks',
    owner: 'CoderAgent',
    status: 'In Progress',
    evidence: 'WebSocket binary frames reduce protocol overhead to <4ms compared to HTTP chunked multipart requests.',
    decision: 'Implement /ws/transcribe accepting raw PCM 16kHz 16-bit mono chunks.',
    nextAction: 'ReviewerAgent checks buffer overflow protection & concurrency bounds',
    priority: 'high',
    timestamp: '10:28 AM',
    tags: ['FastAPI', 'WebSockets', 'AsyncIO'],
    codeSnippet: `@app.websocket("/ws/transcribe")\nasync def websocket_endpoint(ws: WebSocket):\n    await ws.accept()\n    while True:\n        pcm_chunk = await ws.receive_bytes()\n        text = transcribe_buffer(pcm_chunk)\n        await ws.send_json({"transcript": text})`
  },
  {
    id: 'rec-3',
    goal: 'Multi-tenant semantic cache for LLM queries',
    task: 'Evaluate vector similarity threshold for cache hit false-positive rate',
    owner: 'PlannerAgent',
    status: 'Proposed',
    evidence: 'Cosine distance cutoff at 0.92 gives 98.4% precision on intent-identical queries while pruning conversational drift.',
    decision: 'Default to 0.93 similarity cosine threshold with tenant isolation salt.',
    nextAction: 'ResearchAgent gathers Qdrant vs pgvector index RAM consumption data',
    priority: 'medium',
    timestamp: '09:45 AM',
    tags: ['RAG', 'VectorCache', 'Embeddings']
  }
];

const INITIAL_EVENTS: BlackboardEvent[] = [
  {
    id: 'evt-1',
    agent: 'ResearchAgent',
    text: 'Posted STT benchmark evidence: faster-whisper vs whisper.cpp on M-series CPU.',
    type: 'post',
    timestamp: '10:14 AM',
    relatedRecordId: 'rec-1'
  },
  {
    id: 'evt-2',
    agent: 'AgentLee',
    text: 'Consensus confirmed: Decision locked to faster-whisper (CTranslate2). Next action assigned.',
    type: 'decision',
    timestamp: '10:18 AM',
    relatedRecordId: 'rec-1'
  },
  {
    id: 'evt-3',
    agent: 'CoderAgent',
    text: 'Claimed task "Construct streaming FastAPI WebSocket endpoint". Posted code draft.',
    type: 'claim',
    timestamp: '10:28 AM',
    relatedRecordId: 'rec-2'
  }
];

const INITIAL_MEMORY: BlackboardMemory[] = [
  {
    id: 'mem-1',
    category: 'DecisionLog',
    title: 'STT Engine Selection',
    content: 'faster-whisper (int8) selected over whisper.cpp for pure Python runtime cohesion and superior batch streaming.',
    updatedBy: 'AgentLee',
    lastUpdated: '10:18 AM'
  },
  {
    id: 'mem-2',
    category: 'Constraint',
    title: 'Hardware & Latency Limits',
    content: 'Target max end-to-end voice latency: 250ms on local CPU. Audio format: PCM 16kHz single-channel.',
    updatedBy: 'ReviewerAgent',
    lastUpdated: '10:05 AM'
  },
  {
    id: 'mem-3',
    category: 'TechStack',
    title: 'Core System Stack',
    content: 'Backend: FastAPI 0.111+ with Uvicorn. Model runtime: CTranslate2. Agent bus: Blackboard shared memory state.',
    updatedBy: 'PlannerAgent',
    lastUpdated: '09:50 AM'
  }
];

interface AgentNotepadBlackboardProps {
  onExportWorkspace?: (title: string, content: string) => void;
  onShowToast?: (msg: string) => void;
}

export const AgentNotepadBlackboard: React.FC<AgentNotepadBlackboardProps> = ({
  onExportWorkspace,
  onShowToast
}) => {
  // LocalStorage Sync Helpers
  const loadSaved = <T,>(key: string, fallback: T): T => {
    try {
      const item = localStorage.getItem(`leeway_agent_notepad_${key}`);
      const legacy = localStorage.getItem(`agent_lee_${key}`);
      return item ? JSON.parse(item) : (legacy ? JSON.parse(legacy) : fallback);
    } catch (_e) {
      return fallback;
    }
  };

  const saveState = (key: string, val: any) => {
    try {
      localStorage.setItem(`leeway_agent_notepad_${key}`, JSON.stringify(val));
    } catch (_e) {}
  };

  // Top-level Navigation & View
  const [activeMainTab, setActiveMainTab] = useState<'studio' | 'board' | 'notepad'>('studio');
  const [boardSubTab, setBoardSubTab] = useState<'blackboard' | 'taskboard' | 'bus' | 'memory'>('blackboard');
  const [notepadView, setNotepadView] = useState<'split' | 'user' | 'agent'>('split');

  // Master Notepad & Agent Notepad State
  const [userContent, setUserContent] = useState<string>(() => loadSaved('user_content',
    '# Product Goal: Local Voice-Assistant Prototype\n\n' +
    'We need a private, zero-cloud voice assistant that runs entirely locally on consumer laptops.\n' +
    'Target latency: under 250ms from speech end to response start.\n\n' +
    'Key questions to answer:\n' +
    '1. What offline STT model provides real-time streaming without frying the CPU?\n' +
    '2. How should the WebSocket audio ingestion pipeline be structured?\n' +
    '3. What guardrails does ReviewerAgent need to ensure stability?'
  ));

  const DEFAULT_AGENT_NOTES: Record<string, string> = Object.keys(AGENT_REGISTRY).reduce((acc, id) => {
    acc[id] = id === 'AgentLee'
      ? 'AGENT LEE SYNTHESIS:\n\nI have synchronized our master goal into the Multi-Agent Blackboard.\nCurrent Active Threads:\n• ResearchAgent: evidence and benchmark work.\n• PlannerAgent: architecture and task decomposition.\n• CoderAgent: implementation artifacts.\n• ReviewerAgent: verification and safety review.\n\nRecommendation: keep all handoffs visible on the shared Blackboard.'
      : `${AGENT_REGISTRY[id].name.toUpperCase()} SCRATCHPAD:\n\nPrivate working notes for this agent. Publish only the portions that should become shared Blackboard state.`;
    return acc;
  }, {} as Record<string, string>);

  const [activePadAgent, setActivePadAgent] = useState<string>(() => loadSaved('active_pad_agent', 'AgentLee'));
  const [agentNotes, setAgentNotes] = useState<Record<string, string>>(() => loadSaved('agent_notes', DEFAULT_AGENT_NOTES));

  const agentContent = agentNotes[activePadAgent] || '';
  const setAgentContent = (value: string | ((prev: string) => string)) => {
    setAgentNotes(prev => ({
      ...prev,
      [activePadAgent]: typeof value === 'function' ? value(prev[activePadAgent] || '') : value
    }));
  };

  const [displayAgentText, setDisplayAgentText] = useState<string>(agentContent);
  const [isTyping, setIsTyping] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [customCommand, setCustomCommand] = useState('');
  const [notepadTasks, setNotepadTasks] = useState<NotepadTaskItem[]>(() => loadSaved('tasks', [
    { id: 't-1', text: 'Confirm faster-whisper int8 quant compatibility', done: true },
    { id: 't-2', text: 'Review WebSocket binary buffer limit (max 64KB/frame)', done: false },
    { id: 't-3', text: 'Benchmark end-to-end turn time on M3/Core Ultra', done: false }
  ]));

  // Blackboard State
  const [records, setRecords] = useState<BlackboardRecord[]>(() => loadSaved('records', INITIAL_RECORDS));
  const [events, setEvents] = useState<BlackboardEvent[]>(() => loadSaved('events', INITIAL_EVENTS));
  const [sharedMemory, setSharedMemory] = useState<BlackboardMemory[]>(() => loadSaved('memory', INITIAL_MEMORY));

  const [activeAgentCycle, setActiveAgentCycle] = useState<string | null>(null);
  const [isAgentRunning, setIsAgentRunning] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOwner, setFilterOwner] = useState('all');
  const [showNewRecordModal, setShowNewRecordModal] = useState(false);
  const [newGoalInput, setNewGoalInput] = useState('');
  const [agentBusInput, setAgentBusInput] = useState('');
  const [shareToast, setShareToast] = useState<string | null>(null);

  // Auto-save changes to localStorage
  useEffect(() => { saveState('user_content', userContent); }, [userContent]);
  useEffect(() => { saveState('agent_notes', agentNotes); }, [agentNotes]);
  useEffect(() => { saveState('active_pad_agent', activePadAgent); }, [activePadAgent]);
  useEffect(() => { setDisplayAgentText(agentNotes[activePadAgent] || ''); }, [activePadAgent, agentNotes]);
  useEffect(() => { saveState('tasks', notepadTasks); }, [notepadTasks]);
  useEffect(() => { saveState('records', records); }, [records]);
  useEffect(() => { saveState('events', events); }, [events]);
  useEffect(() => { saveState('memory', sharedMemory); }, [sharedMemory]);

  // Continuum staging sync. localStorage remains the immediate sandbox/cache; this endpoint
  // provides the governed namespace boundary. Promotion to canonical memory is a separate gate.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      fetch('/api/continuum/notepad', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          employerId: localStorage.getItem('leeway_employer_id') || 'local',
          workspaceId: localStorage.getItem('leeway_workspace_id') || 'default',
          agentId: activePadAgent,
          authorityOwner: activePadAgent,
          payload: {
            userNotes: userContent,
            agentScratchpads: agentNotes,
            tasks: notepadTasks,
            sharedBlackboard: records,
            decisions: records.map(record => ({
              id: record.id,
              decision: record.decision,
              status: record.status,
              owner: record.owner,
              timestamp: record.timestamp
            })),
            evidenceLinks: records.filter(record => Boolean(record.evidence)).map(record => ({
              recordId: record.id,
              evidence: record.evidence
            })),
            promotedMemoryCandidates: sharedMemory,
            sandboxArtifacts: { events }
          }
        })
      }).catch(() => undefined);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [userContent, agentNotes, activePadAgent, notepadTasks, records, events, sharedMemory]);

  const showToast = (msg: string) => {
    setShareToast(msg);
    if (onShowToast) onShowToast(msg);
    setTimeout(() => setShareToast(null), 3500);
  };

  // Typewriter Effect for Active Agent Workspace
  const typeText = (newText: string, append = false) => {
    setIsTyping(true);
    let i = 0;
    const baseText = append ? agentContent + "\n\n" : "";
    if (!append) setDisplayAgentText('');

    const interval = setInterval(() => {
      const currentChunk = newText.slice(0, i + 1);
      setDisplayAgentText(baseText + currentChunk);
      i++;
      if (i >= newText.length) {
        clearInterval(interval);
        setIsTyping(false);
        setAgentContent(baseText + newText);
      }
    }, 12);
  };

  // Direct Action Buttons for Active Agent Notepad
  const askAgentLeeNotepad = (action: 'rewrite' | 'expand' | 'tasks' | 'command') => {
    const context = agentContent || userContent;
    if (!context.trim() && action !== 'command') return;
    setIsThinking(true);
    const cmd = customCommand;
    if (action === 'command') setCustomCommand('');

    setTimeout(() => {
      let generated = "";
      let isAppend = false;

      if (action === 'rewrite') {
        generated =
          `# ${AGENT_REGISTRY[activePadAgent]?.name || activePadAgent} — WORKING REFINEMENT\n\n` +
          `## Core Architectural Goal\n` +
          `Deliver an ultra-low latency, zero-cloud voice assistant pipeline with full hardware sovereignty.\n\n` +
          `## Team Work Allocation (Blackboard State)\n` +
          `1. **Dr. Rachel (Research)**: faster-whisper int8 model benchmarked at 112ms inference latency.\n` +
          `2. **Devon (Planner)**: WebSocket audio frame ingestion buffer capped at 64KB chunks.\n` +
          `3. **Alex (Coder)**: AsyncIO streaming FastAPI endpoints (/ws/transcribe).\n` +
          `4. **Marcus (Reviewer)**: Verified no memory leaks during 1-hour sustained streaming.\n\n` +
          `## Next Immediate Milestone\n` +
          `Trigger live end-to-end microphone loop test and monitor frame drop rate.`;
      } else if (action === 'expand') {
        generated =
          `\n\n## Multi-Agent Depth Expansion:\n` +
          `• **Audio Ingestion**: Implement a ring buffer with circular overwrite to ensure the audio queue never causes backpressure memory exhaustion.\n` +
          `• **VAD (Voice Activity Detection)**: Integrate Silero VAD (1ms inference per frame) to filter out background room noise before triggering faster-whisper.\n` +
          `• **Blackboard Alignment**: Record all Silero confidence threshold tweaks on the Shared Memory table for persistent visibility.`;
        isAppend = true;
      } else if (action === 'tasks') {
        const newTasks: NotepadTaskItem[] = [
          { id: `t-${Date.now()}-1`, text: 'Benchmark Silero VAD vs WebRTC VAD CPU load', done: false },
          { id: `t-${Date.now()}-2`, text: 'Implement circular ring-buffer audio ingestion in FastAPI', done: false },
          { id: `t-${Date.now()}-3`, text: 'Profile memory consumption during 60s continuous voice stream', done: false }
        ];
        setNotepadTasks(prev => [...prev, ...newTasks]);
        setIsThinking(false);
        showToast('Generated 3 new action items from Blackboard');
        return;
      } else {
        generated = `${AGENT_REGISTRY[activePadAgent]?.name || activePadAgent} evaluated: "${cmd}". Checked against current shared Blackboard records and memory constraints.`;
      }

      setIsThinking(false);
      typeText(generated, isAppend);
    }, 600);
  };

  const addEventMessage = (
    agent: string,
    text: string,
    type: BlackboardEvent['type'],
    relatedRecordId?: string
  ) => {
    const msg: BlackboardEvent = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      agent,
      text,
      type,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      relatedRecordId
    };
    setEvents(prev => [msg, ...prev.slice(0, 39)]);
  };

  // Autonomous Multi-Agent Cycle Orchestrator
  const runMultiAgentCycle = async (targetId?: string) => {
    if (isAgentRunning) return;
    setIsAgentRunning(true);

    const target = targetId
      ? records.find(r => r.id === targetId)
      : records.find(r => r.status !== 'Resolved') || records[0];

    if (!target) {
      setIsAgentRunning(false);
      return;
    }

    const steps = [
      { role: 'ResearchAgent', action: 'Auditing benchmarks and memory profile...', dur: 1200 },
      { role: 'PlannerAgent', action: 'Validating architecture and task decomposition...', dur: 1200 },
      { role: 'CoderAgent', action: 'Drafting streaming endpoint artifact and schema...', dur: 1300 },
      { role: 'ReviewerAgent', action: 'Checking latency bounds (<250ms) and security bounds...', dur: 1200 },
      { role: 'AgentLee', action: 'Confirming consensus and writing to durable Shared Memory...', dur: 1200 }
    ];

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      setActiveAgentCycle(step.role);
      addEventMessage(
        step.role,
        `${AGENT_REGISTRY[step.role].name}: ${step.action}`,
        step.role === 'CoderAgent' ? 'claim' : step.role === 'ReviewerAgent' ? 'verify' : step.role === 'AgentLee' ? 'decision' : 'post',
        target.id
      );
      await new Promise(r => setTimeout(r, step.dur));

      if (step.role === 'ResearchAgent') {
        setRecords(prev => prev.map(r => r.id === target.id ? { ...r, owner: 'PlannerAgent', status: 'In Progress' } : r));
      } else if (step.role === 'PlannerAgent') {
        setRecords(prev => prev.map(r => r.id === target.id ? { ...r, owner: 'CoderAgent', status: 'In Progress' } : r));
      } else if (step.role === 'CoderAgent') {
        setRecords(prev => prev.map(r => r.id === target.id ? { ...r, owner: 'ReviewerAgent', status: 'Review' } : r));
      } else if (step.role === 'ReviewerAgent') {
        setRecords(prev => prev.map(r => r.id === target.id ? { ...r, owner: 'AgentLee', status: 'Review' } : r));
      } else if (step.role === 'AgentLee') {
        setRecords(prev => prev.map(r => r.id === target.id ? { ...r, owner: 'AgentLee', status: 'Resolved', nextAction: 'Deployment verification complete' } : r));
        setSharedMemory(prev => [
          {
            id: `mem-${Date.now()}`,
            category: 'DecisionLog',
            title: `Resolved: ${target.goal}`,
            content: target.decision,
            updatedBy: 'AgentLee',
            lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          },
          ...prev
        ]);
      }
    }

    setActiveAgentCycle(null);
    setIsAgentRunning(false);
    showToast(`Multi-Agent cycle completed for "${target.goal}"`);
  };

  // Send Notepad to Blackboard
  const sendNotepadToBlackboard = () => {
    const lines = userContent.split('\n').filter(l => l.trim().length > 0);
    const goalTitle = lines[0] ? lines[0].replace(/^#+\s*/, '') : 'User Defined Goal';
    const taskTitle = lines[1] ? lines[1].replace(/^#+\s*/, '') : 'Decomposition and benchmark phase';

    const newRec: BlackboardRecord = {
      id: `rec-${Date.now()}`,
      goal: goalTitle,
      task: taskTitle,
      owner: activePadAgent,
      status: 'Proposed',
      evidence: userContent.slice(0, 200) + '...',
      decision: 'Awaiting multi-agent blackboard cycle',
      nextAction: 'PlannerAgent decomposes tasks upon research completion',
      priority: 'high',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      tags: ['NotepadSync', 'NewGoal']
    };

    setRecords(prev => [newRec, ...prev]);
    addEventMessage(activePadAgent, `New goal posted from Shared Intake Workspace: "${goalTitle}"`, 'post', newRec.id);
    setActiveMainTab('studio');
    setBoardSubTab('blackboard');
    showToast(`Sent "${goalTitle}" to Blackboard!`);
  };

  // Pull Blackboard Decisions into Notepad
  const exportBlackboardToNotepad = () => {
    const resolved = records.filter(r => r.status === 'Resolved');
    let summary = "\n\n# SYNTHESIZED BLACKBOARD DECISIONS\n\n";
    resolved.forEach((r, idx) => {
      summary += `### ${idx + 1}. Goal: ${r.goal}\n`;
      summary += `• Task: ${r.task}\n`;
      summary += `• Decision: ${r.decision}\n`;
      summary += `• Evidence: ${r.evidence}\n`;
      summary += `• Next Action: ${r.nextAction}\n\n`;
    });
    setUserContent(prev => prev + summary);
    setActiveMainTab('studio');
    showToast('Pulled Blackboard decisions into Notepad');
  };

  // Advance Blackboard Record Status
  const advanceRecordStatus = (recId: string) => {
    const flow: Record<string, BlackboardRecord['status']> = {
      'Proposed': 'In Progress',
      'In Progress': 'Review',
      'Review': 'Resolved',
      'Resolved': 'Proposed'
    };
    setRecords(prev => prev.map(r => {
      if (r.id === recId) {
        const nextStatus = flow[r.status] || 'Proposed';
        addEventMessage(r.owner, `Record status changed to "${nextStatus}" for goal: "${r.goal}"`, 'verify', r.id);
        return { ...r, status: nextStatus };
      }
      return r;
    }));
  };

  // Add New Goal Modal Submit
  const handleAddNewGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalInput.trim()) return;
    const newRec: BlackboardRecord = {
      id: `rec-${Date.now()}`,
      goal: newGoalInput.trim(),
      task: 'Initial multi-agent problem decomposition & feasibility analysis',
      owner: 'ResearchAgent',
      status: 'Proposed',
      evidence: 'Awaiting ResearchAgent initial benchmark scan.',
      decision: 'Pending multi-agent review.',
      nextAction: 'ResearchAgent gathers baseline metrics and requirements.',
      priority: 'high',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      tags: ['ActiveGoal']
    };
    setRecords(prev => [newRec, ...prev]);
    addEventMessage('AgentLee', `New Goal registered to Blackboard: "${newGoalInput.trim()}"`, 'post', newRec.id);
    setNewGoalInput('');
    setShowNewRecordModal(false);
    showToast(`Registered "${newRec.goal}" to Blackboard`);
  };

  // Export standalone HTML
  const downloadSelfAsHTML = () => {
    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>LeeWay Agent Notepad & Multi-Agent Blackboard</title>
  <meta name="description" content="A LeeWay-native shared agent notepad and multi-agent blackboard utility." />
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    .notepad-paper-human { background-color: #fffdf5; background-image: linear-gradient(transparent 2.45rem, #eef2ff 2.5rem); background-size: 100% 2.5rem; }
    .notepad-paper-agent { background-color: #fafaf9; background-image: linear-gradient(transparent 2.45rem, #f1f5f9 2.5rem); background-size: 100% 2.5rem; }
  </style>
</head>
<body class="bg-stone-100 p-6 font-sans">
  <div class="max-w-4xl mx-auto bg-white p-8 rounded-2xl shadow-xl border border-stone-200 space-y-6">
    <h1 class="text-2xl font-black text-stone-900">LeeWay Agent Notepad & Multi-Agent Blackboard</h1>
    <p class="text-stone-600 text-sm">Exported snapshot with durable state.</p>
    <div class="border-t pt-4">
      <h2 class="text-lg font-bold mb-2">User Notepad Content</h2>
      <pre class="bg-stone-50 p-4 rounded-xl text-xs whitespace-pre-wrap font-serif">${userContent.replace(/</g, '&lt;')}</pre>
    </div>
    <div class="border-t pt-4">
      <h2 class="text-lg font-bold mb-2">Active Blackboard Goals (${records.length})</h2>
      ${records.map(r => `<div class="mb-3 p-3 bg-stone-50 rounded-lg border"><b>[${r.status}]</b> ${r.goal} (Owner: ${r.owner})<br/><span class="text-xs text-stone-600">${r.decision}</span></div>`).join('')}
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'leeway-agent-notepad.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Saved standalone HTML file!');
  };

  // Share link
  const shareSelfLink = async () => {
    const currentUrl = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'LeeWay Agent Notepad & Multi-Agent Blackboard',
          text: 'Open the LeeWay shared Agent Notepad and Multi-Agent Blackboard',
          url: currentUrl,
        });
        return;
      } catch (_e) {}
    }
    try {
      await navigator.clipboard.writeText(currentUrl);
      showToast('Link copied to clipboard!');
    } catch (_e) {
      showToast(`URL: ${currentUrl}`);
    }
  };

  // Filtered records
  const filteredRecords = records.filter(r => {
    const matchesSearch = r.goal.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          r.task.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          r.decision.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesOwner = filterOwner === 'all' || r.owner === filterOwner;
    return matchesSearch && matchesOwner;
  });

  return (
    <div className="flex-grow flex flex-col h-full w-full bg-[#071523] text-slate-100 font-sans overflow-y-auto select-text relative">
      {/* Top Navigation Header */}
      <header className="bg-[#081a2b]/95 border-b border-cyan-900/70 sticky top-0 z-30 shadow-[0_0_24px_rgba(14,165,233,0.12)] shrink-0">
        <div className="max-w-[1720px] mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
          {/* Brand & Identity */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-700 text-white rounded-xl flex items-center justify-center shadow-[0_0_18px_rgba(34,211,238,0.45)] shrink-0">
              <Brain size={22} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-extrabold text-lg tracking-tight text-white leading-none">
                  Agent <span className="text-cyan-300">Blackboard</span>
                </h1>
                <span className="bg-cyan-950 text-cyan-200 text-[8.5px] font-bold px-1.5 py-0.2 rounded-full uppercase tracking-wider border border-cyan-700">MISSION CONTROL</span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">
                Collaboration, directives, and writable mission workspace
              </p>
            </div>
          </div>

          {/* Active Agent Status Bar */}
          <div className="hidden lg:flex items-center gap-1.5 bg-stone-50 px-2.5 py-1 rounded-xl border border-stone-200 text-xs">
            <span className="text-[9px] font-bold uppercase tracking-widest text-stone-400 mr-1">Agents:</span>
            {Object.keys(AGENT_REGISTRY).map((role) => {
              const agent = AGENT_REGISTRY[role];
              const isActive = activeAgentCycle === role;
              return (
                <div
                  key={role}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-lg transition-all ${
                    isActive
                      ? `${agent.badgeBg} ${agent.badgeText} border ${agent.borderColor} font-bold shadow-xs scale-105`
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <span className="text-xs">{agent.avatarIcon}</span>
                  <span className="text-[10.5px] font-medium">{agent.name.split(' ')[0]}</span>
                  {isActive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />}
                </div>
              );
            })}
          </div>

          {/* Primary View Switcher & Action CTAs */}
          <div className="flex items-center gap-2">
            <div className="flex bg-stone-100 p-0.5 rounded-xl border border-stone-200">
              <button
                onClick={() => setActiveMainTab('studio')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  activeMainTab === 'studio' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-900'
                }`}
              >
                <Columns size={13} />
                <span>Split Studio</span>
              </button>
              <button
                onClick={() => setActiveMainTab('board')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  activeMainTab === 'board' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-900'
                }`}
              >
                <Layers size={13} />
                <span>Blackboard</span>
                <span className="bg-stone-200 text-stone-700 text-[9.5px] px-1.5 py-0.2 rounded-full font-bold">
                  {records.length}
                </span>
              </button>
              <button
                onClick={() => setActiveMainTab('notepad')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  activeMainTab === 'notepad' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-900'
                }`}
              >
                <FileText size={13} />
                <span>Dual Notepad</span>
              </button>
            </div>

            {/* Run Agent Cycle Button */}
            <button
              onClick={() => runMultiAgentCycle()}
              disabled={isAgentRunning}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-sm ${
                isAgentRunning ? 'bg-emerald-600 text-white animate-pulse' : 'bg-stone-900 text-white hover:bg-stone-800'
              }`}
            >
              {isAgentRunning ? (
                <>
                  <Loader2 size={13} className="animate-spin text-emerald-300" />
                  <span>Cycle Active</span>
                </>
              ) : (
                <>
                  <Play size={11} className="text-emerald-400 fill-emerald-400" />
                  <span>Run Agent Cycle</span>
                </>
              )}
            </button>

            {/* Export to LeeCode Workspace */}
            {onExportWorkspace && (
              <button
                onClick={() => {
                  onExportWorkspace('Agent Blackboard Consensus', `# User Working Notepad\n\n${userContent}\n\n# Active Blackboard Decisions\n\n` + records.map(r => `* [${r.owner}] ${r.goal}: ${r.decision}`).join('\n'));
                  showToast('Exported Blackboard state to LeeCode workspace!');
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-950 hover:bg-amber-900 text-amber-300 border border-amber-700/80 rounded-xl text-xs font-bold transition-all shadow-xs"
                title="Export Blackboard decisions to LeeCode IDE"
              >
                <FileText size={12} />
                <span className="hidden sm:inline">Export to Workspace</span>
              </button>
            )}

            {/* Standalone Action Buttons */}
            <div className="flex items-center gap-1">
              <button
                onClick={shareSelfLink}
                title="Share link"
                className="p-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-300 rounded-lg text-xs transition-all shadow-2xs"
              >
                <Share2 size={13} className="text-stone-700" />
              </button>
              <button
                onClick={downloadSelfAsHTML}
                title="Download HTML"
                className="p-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs transition-all shadow-2xs"
              >
                <Download size={13} className="text-emerald-400" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* LeeWay Capability Sub-bar */}
      <div className="bg-stone-950 text-stone-200 border-b border-stone-800 shrink-0">
        <div className="max-w-[1720px] mx-auto px-4 py-1.5 flex flex-wrap items-center justify-between gap-2 text-[9.5px] uppercase tracking-wider">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-extrabold text-orange-400">LeeWay Ecosystem</span>
            <span className="text-stone-600">›</span>
            <span>Skills / MCPs</span>
            <span className="text-stone-600">›</span>
            <span>Agent Collaboration</span>
            <span className="text-stone-600">›</span>
            <span className="text-white font-bold">Agent Notepad &amp; Multi-Agent Blackboard</span>
          </div>
          <div className="normal-case tracking-normal text-stone-400 hidden sm:inline">
            Working collaboration state • not Runtime execution proof or canonical Learning Ledger custody
          </div>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="flex-1 max-w-[1720px] w-full mx-auto p-4 md:p-5">
        <div className={`grid gap-5 items-start ${
          activeMainTab === 'studio' ? 'grid-cols-1 xl:grid-cols-12' : 'grid-cols-1'
        }`}>

          {/* LEFT COLUMN: Skeuomorphic Dual-Notepad */}
          {(activeMainTab === 'studio' || activeMainTab === 'notepad') && (
            <section className={`space-y-4 ${activeMainTab === 'studio' ? 'xl:col-span-6' : 'w-full'}`}>
              {/* Focus Bar */}
              <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-xs flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[11px] uppercase tracking-widest text-stone-500">Notepad Focus:</span>
                  <div className="flex bg-stone-100 p-0.5 rounded-lg border border-stone-200 text-xs">
                    {(['split', 'user', 'agent'] as const).map(v => (
                      <button
                        key={v}
                        onClick={() => setNotepadView(v)}
                        className={`px-2.5 py-0.5 text-[11px] font-semibold rounded-md transition-all ${
                          notepadView === v ? 'bg-white shadow-xs text-stone-900' : 'text-stone-500 hover:text-stone-800'
                        }`}
                      >
                        {v.charAt(0).toUpperCase() + v.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <div className="flex items-center gap-1.5 bg-stone-50 border border-stone-200 rounded-lg px-2 py-0.5">
                    <span className="text-[9.5px] font-bold uppercase tracking-wider text-stone-400">Agent</span>
                    <select
                      value={activePadAgent}
                      onChange={(e) => setActivePadAgent(e.target.value)}
                      className="bg-white border border-stone-200 rounded-md text-[11px] font-semibold text-stone-800 px-1.5 py-0.5 outline-none cursor-pointer"
                    >
                      {Object.keys(AGENT_REGISTRY).map(id => (
                        <option key={id} value={id}>{AGENT_REGISTRY[id].name}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={sendNotepadToBlackboard}
                    className="flex items-center gap-1 px-2.5 py-1 bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 rounded-lg text-[11px] font-bold transition-colors"
                    title="Promote note to Blackboard as a durable multi-agent goal"
                  >
                    <span>Send Goal to Board</span>
                    <ChevronRight size={12} />
                  </button>
                  <button
                    onClick={exportBlackboardToNotepad}
                    className="flex items-center gap-1 px-2.5 py-1 bg-stone-100 text-stone-700 hover:bg-stone-200 border border-stone-200 rounded-lg text-[11px] font-bold transition-colors"
                    title="Pull decisions from Blackboard into Master Notepad"
                  >
                    <BookOpen size={12} />
                    <span>Pull Decisions</span>
                  </button>
                </div>
              </div>

              {/* Dual Skeuomorphic Spiral Notepads */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
                {/* Shared Intake Workspace (Human Notepad) */}
                {(notepadView === 'split' || notepadView === 'user') && (
                  <div className="relative pt-6">
                    {/* Realistic Spiral Rings */}
                    <div className="absolute top-0 left-0 right-0 z-20 flex justify-around px-6 pointer-events-none">
                      {[...Array(10)].map((_, i) => (
                        <div key={i} className="flex flex-col items-center">
                          <div className="w-2.5 h-7 bg-gradient-to-r from-stone-400 via-stone-200 to-stone-400 rounded-full shadow-md" />
                          <div className="w-3 h-3 bg-stone-800 rounded-full -mt-2 border border-stone-600 shadow-inner" />
                        </div>
                      ))}
                    </div>

                    <div className="bg-white rounded-b-xl shadow-lg border border-stone-300 relative overflow-hidden mt-3">
                      <div className="h-11 bg-stone-100 border-b border-stone-200 flex items-center justify-between px-4 pt-2">
                        <span className="font-extrabold text-[9.5px] uppercase tracking-[0.25em] text-stone-500">
                          Shared Intake Workspace
                        </span>
                        <button
                          onClick={() => { setAgentContent(userContent); setDisplayAgentText(userContent); }}
                          className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-blue-600 hover:text-blue-700 transition-colors"
                        >
                          <span>Sync to Active Agent</span>
                          <ChevronRight size={12} />
                        </button>
                      </div>

                      <div className="relative notepad-paper-human min-h-[44vh] flex shadow-inner">
                        {/* Red Margin Rule & Binder Holes */}
                        <div className="w-[42px] border-r-2 border-red-200 flex flex-col items-center pt-5 shrink-0">
                          {[...Array(8)].map((_, i) => (
                            <div key={i} className="w-2.5 h-2.5 rounded-full bg-stone-100 border border-stone-300 mb-8 shadow-inner" />
                          ))}
                        </div>
                        <textarea
                          value={userContent}
                          onChange={(e) => setUserContent(e.target.value)}
                          placeholder="Draft creator instructions, shared objectives, specifications, or material to hand off to an agent..."
                          className="flex-1 p-4 text-sm leading-[2.5rem] outline-none resize-none bg-transparent font-serif text-stone-900"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Active Agent Workspace */}
                {(notepadView === 'split' || notepadView === 'agent') && (
                  <div className="relative pt-6">
                    {/* Dark Spiral Rings */}
                    <div className="absolute top-0 left-0 right-0 z-20 flex justify-around px-6 pointer-events-none">
                      {[...Array(10)].map((_, i) => (
                        <div key={i} className="flex flex-col items-center">
                          <div className={`w-2.5 h-7 bg-gradient-to-r from-stone-900 via-stone-700 to-stone-900 rounded-full shadow-md transition-all duration-500 ${
                            isThinking ? 'ring-1 ring-emerald-400' : ''
                          }`} />
                          <div className="w-3 h-3 bg-stone-950 rounded-full -mt-2 border border-stone-800 shadow-inner" />
                        </div>
                      ))}
                    </div>

                    <div className="bg-white rounded-b-xl shadow-lg border border-stone-800 relative overflow-hidden mt-3 ring-1 ring-stone-900/5">
                      <div className="h-11 bg-stone-950 border-b border-stone-900 flex items-center justify-between px-4 pt-2">
                        <div className="flex items-center gap-1.5">
                          <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
                            isThinking || isTyping ? 'bg-emerald-400 animate-pulse' : 'bg-stone-600'
                          }`} />
                          <span className="font-bold text-[9.5px] uppercase tracking-[0.2em] text-stone-300">
                            {AGENT_REGISTRY[activePadAgent]?.name || activePadAgent} Workspace
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            if (window.confirm(`Adopt ${AGENT_REGISTRY[activePadAgent]?.name || activePadAgent}'s working note into Shared Intake Workspace?`)) {
                              setUserContent(agentContent);
                              showToast('Adopted agent working note into Intake Workspace');
                            }
                          }}
                          disabled={!agentContent}
                          className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 hover:text-emerald-300 transition-colors disabled:opacity-30"
                        >
                          Adopt Version
                        </button>
                      </div>

                      <div className="relative notepad-paper-agent min-h-[44vh] flex shadow-inner border-b border-stone-200">
                        {isTyping && (
                          <div className="absolute z-30 pointer-events-none right-5 top-5 text-stone-900/50 animate-bounce">
                            <Edit3 size={24} className="transform -rotate-45 text-stone-800" />
                          </div>
                        )}

                        <div className="w-[42px] border-r-2 border-stone-200 flex flex-col items-center pt-5 shrink-0">
                          {[...Array(8)].map((_, i) => (
                            <div key={i} className="w-2.5 h-2.5 rounded-full bg-stone-100 border border-stone-300 mb-8 transition-colors" />
                          ))}
                        </div>
                        <textarea
                          value={displayAgentText}
                          readOnly
                          placeholder="The active agent keeps private working notes and synthesizes shared Blackboard context here..."
                          className="flex-1 p-4 text-sm leading-[2.5rem] outline-none resize-none bg-transparent font-serif italic text-stone-700"
                        />
                      </div>

                      {/* Quick Actions Strip */}
                      <div className="p-3 bg-stone-50 flex flex-col gap-2 border-t border-stone-200">
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => askAgentLeeNotepad('rewrite')}
                            disabled={isThinking}
                            className="flex-1 bg-stone-900 text-white py-1.5 px-2 rounded-lg text-[11px] font-bold uppercase tracking-wider hover:bg-stone-800 disabled:opacity-50 transition-colors"
                          >
                            Refine
                          </button>
                          <button
                            onClick={() => askAgentLeeNotepad('expand')}
                            disabled={isThinking}
                            className="flex-1 bg-stone-900 text-white py-1.5 px-2 rounded-lg text-[11px] font-bold uppercase tracking-wider hover:bg-stone-800 disabled:opacity-50 transition-colors"
                          >
                            Expand
                          </button>
                          <button
                            onClick={() => askAgentLeeNotepad('tasks')}
                            disabled={isThinking}
                            className="flex-1 border border-stone-300 bg-white text-stone-800 py-1.5 px-2 rounded-lg text-[11px] font-bold uppercase tracking-wider hover:bg-stone-100 disabled:opacity-50 transition-colors"
                          >
                            Tasks
                          </button>
                        </div>
                        <div className="relative">
                          <input
                            type="text"
                            value={customCommand}
                            onChange={e => setCustomCommand(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && askAgentLeeNotepad('command')}
                            placeholder={`Direct instruction for ${AGENT_REGISTRY[activePadAgent]?.name || activePadAgent}...`}
                            className="w-full text-xs p-2 rounded-lg border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-stone-900 pr-9"
                          />
                          <button
                            onClick={() => askAgentLeeNotepad('command')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-900 transition-colors"
                          >
                            <ChevronRight size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Checklist */}
              {notepadTasks.length > 0 && (
                <div className="bg-white rounded-xl border border-stone-200 p-3.5 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                      Notepad Action Items ({notepadTasks.filter(t => t.done).length}/{notepadTasks.length})
                    </span>
                    <button
                      onClick={() => setNotepadTasks([])}
                      className="text-[10.5px] text-stone-400 hover:text-red-500 transition-colors"
                    >
                      Clear All
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                    {notepadTasks.map(task => (
                      <button
                        key={task.id}
                        onClick={() => setNotepadTasks(prev => prev.map(t => t.id === task.id ? { ...t, done: !t.done } : t))}
                        className={`text-left flex items-start gap-2 p-2 rounded-lg border transition-all ${
                          task.done ? 'bg-stone-50 border-stone-200 text-stone-400 line-through' : 'bg-white border-stone-200 text-stone-800 hover:border-stone-400'
                        }`}
                      >
                        <div className={`mt-0.5 w-3.5 h-3.5 rounded border flex items-center justify-center transition-all ${
                          task.done ? 'bg-stone-900 border-stone-900 text-white' : 'border-stone-300'
                        }`}>
                          {task.done && <Check size={10} />}
                        </div>
                        <span className="text-xs font-medium leading-snug">{task.text}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* RIGHT COLUMN: Multi-Agent Blackboard Architecture */}
          {(activeMainTab === 'studio' || activeMainTab === 'board') && (
            <section className={`space-y-4 ${activeMainTab === 'studio' ? 'xl:col-span-6' : 'w-full'}`}>
              {activeMainTab === 'board' && (
                <div className="rounded-2xl border border-cyan-800/80 bg-gradient-to-br from-[#0c2639] via-[#0b1b2b] to-[#07131f] p-4 shadow-[0_0_30px_rgba(8,145,178,0.18)]">
                  <div className="grid gap-4 xl:grid-cols-[220px_minmax(0,1fr)_260px]">
                    <aside className="space-y-2">
                      <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.16em] text-cyan-300"><span>Mission Pads</span><button type="button" onClick={() => setShowNewRecordModal(true)} className="rounded border border-cyan-700 px-2 py-1 text-cyan-200 hover:bg-cyan-900/60"><Plus size={12} /></button></div>
                      {records.slice(0, 5).map((record, index) => <button type="button" key={record.id} onClick={() => setSearchQuery(record.goal)} className={`w-full rounded-xl border p-3 text-left shadow-lg transition hover:-translate-y-0.5 ${index % 4 === 0 ? 'border-cyan-500/70 bg-cyan-900/50' : index % 4 === 1 ? 'border-amber-500/60 bg-amber-950/50' : index % 4 === 2 ? 'border-violet-500/60 bg-violet-950/40' : 'border-slate-500/60 bg-slate-800/70'}`}><div className="flex items-center gap-2 text-sm font-black text-white"><FileText size={14} />{record.goal}</div><div className="mt-1 text-[10px] text-slate-300">{record.tags.slice(0, 2).join(' · ') || record.status}</div></button>)}
                    </aside>
                    <main className="rounded-2xl border border-slate-600/80 bg-[#f7f0dc] p-5 text-slate-900 shadow-2xl rotate-[0.1deg]">
                      <div className="flex items-center justify-between border-b-2 border-cyan-500 pb-2"><div><div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Mission Command Pad</div><h2 className="mt-1 text-xl font-black">{records[0]?.goal || 'Awaiting Creator directive'}</h2></div><span className="rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-black text-emerald-800">{records[0]?.status || 'READY'}</span></div>
                      <div className="mt-4 grid gap-3 md:grid-cols-2"><div><div className="text-[10px] font-black uppercase text-slate-500">Command</div><p className="mt-1 text-sm font-semibold">{records[0]?.task || 'Create a governed mission from the Blackboard.'}</p></div><div><div className="text-[10px] font-black uppercase text-slate-500">Active agent</div><p className="mt-1 text-sm font-semibold">{AGENT_REGISTRY[activePadAgent]?.name || activePadAgent} · {AGENT_REGISTRY[activePadAgent]?.role}</p></div></div>
                      <div className="mt-5 grid grid-cols-3 gap-2 text-center text-[10px] font-black uppercase"><div className="rounded border border-slate-300 bg-white/70 p-2">{records.filter(r => r.status !== 'Resolved').length}<span className="mt-1 block font-normal normal-case text-slate-500">open missions</span></div><div className="rounded border border-slate-300 bg-white/70 p-2">{records.filter(r => Boolean(r.evidence)).length}<span className="mt-1 block font-normal normal-case text-slate-500">evidence links</span></div><div className="rounded border border-slate-300 bg-white/70 p-2">{events.length}<span className="mt-1 block font-normal normal-case text-slate-500">recorded events</span></div></div>
                    </main>
                    <aside className="space-y-3"><div className="rounded-xl border border-cyan-800 bg-[#0b2233] p-3"><div className="text-[10px] font-black uppercase tracking-[0.16em] text-cyan-300">Active Agent</div><div className="mt-3 flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-700 text-xl">{AGENT_REGISTRY[activePadAgent]?.avatarIcon || '🧠'}</div><div><div className="font-black text-white">{AGENT_REGISTRY[activePadAgent]?.name || activePadAgent}</div><div className="text-[10px] text-slate-400">{AGENT_REGISTRY[activePadAgent]?.role}</div></div></div></div><div className="rounded-xl border border-slate-600 bg-slate-900/80 p-3"><div className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-300">Recent Blackboard Activity</div><div className="mt-2 space-y-2">{events.slice(0, 3).map(event => <div key={event.id} className="border-b border-slate-700 pb-2 text-[10px] text-slate-300"><span className="text-cyan-300">{event.agent}</span> · {event.text}</div>)}</div></div></aside>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2 border-t border-cyan-900/70 pt-3"><button type="button" onClick={() => setBoardSubTab('blackboard')} className="rounded-lg bg-cyan-500 px-4 py-2 text-xs font-black text-slate-950 shadow-[0_0_14px_rgba(34,211,238,0.4)]">Mission Command</button><button type="button" onClick={() => setBoardSubTab('taskboard')} className="rounded-lg border border-slate-600 bg-slate-900 px-4 py-2 text-xs font-bold text-slate-200">Surfaces</button><button type="button" onClick={() => setBoardSubTab('bus')} className="rounded-lg border border-slate-600 bg-slate-900 px-4 py-2 text-xs font-bold text-slate-200">Receipts / Events</button><button type="button" onClick={() => setActiveMainTab('notepad')} className="rounded-lg border border-slate-600 bg-slate-900 px-4 py-2 text-xs font-bold text-slate-200">Scratchpad</button></div>
                </div>
              )}
              {/* Modalities Header */}
              <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-1 bg-stone-100 p-0.5 rounded-xl border border-stone-200">
                  <button
                    onClick={() => setBoardSubTab('blackboard')}
                    className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                      boardSubTab === 'blackboard' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-900'
                    }`}
                  >
                    <Layers size={13} className="text-sky-600" />
                    <span>Blackboard</span>
                  </button>
                  <button
                    onClick={() => setBoardSubTab('taskboard')}
                    className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                      boardSubTab === 'taskboard' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-900'
                    }`}
                  >
                    <Columns size={13} className="text-amber-600" />
                    <span>Task Board</span>
                  </button>
                  <button
                    onClick={() => setBoardSubTab('bus')}
                    className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                      boardSubTab === 'bus' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-900'
                    }`}
                  >
                    <MessageSquare size={13} className="text-indigo-600" />
                    <span>Agent Event Bus</span>
                    <span className="bg-indigo-100 text-indigo-800 text-[9.5px] px-1.5 py-0.2 rounded-full font-bold">
                      {events.length}
                    </span>
                  </button>
                  <button
                    onClick={() => setBoardSubTab('memory')}
                    className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                      boardSubTab === 'memory' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-900'
                    }`}
                  >
                    <Database size={13} className="text-emerald-600" />
                    <span>Shared Memory</span>
                  </button>
                </div>

                <div className="flex items-center gap-1.5 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-40">
                    <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search records..."
                      className="w-full pl-7 pr-2.5 py-1 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:bg-white focus:border-stone-400"
                    />
                  </div>

                  <button
                    onClick={() => setShowNewRecordModal(true)}
                    className="flex items-center gap-1 px-2.5 py-1 bg-stone-900 text-white rounded-lg text-xs font-bold hover:bg-stone-800 transition-colors shadow-xs shrink-0"
                  >
                    <Plus size={13} />
                    <span>Post Goal</span>
                  </button>
                </div>
              </div>

              {/* 1. BLACKBOARD VIEW */}
              {boardSubTab === 'blackboard' && (
                <div className="space-y-3.5">
                  <div className="bg-stone-900 text-stone-200 rounded-2xl p-3.5 border border-stone-800 shadow-sm relative overflow-hidden">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 relative z-10">
                      <div>
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          <h3 className="font-black text-xs uppercase tracking-wider text-white">
                            Shared Problem-Solving Blackboard
                          </h3>
                        </div>
                        <p className="text-[11px] text-stone-400 max-w-xl leading-relaxed">
                          Agents post evidence, debate technical decisions, claim tasks, and advance status asynchronously.
                        </p>
                      </div>

                      <select
                        value={filterOwner}
                        onChange={(e) => setFilterOwner(e.target.value)}
                        className="bg-stone-800 text-stone-300 text-[11px] px-2.5 py-1 rounded-lg border border-stone-700 outline-none cursor-pointer"
                      >
                        <option value="all">All Agents</option>
                        <option value="ResearchAgent">ResearchAgent</option>
                        <option value="PlannerAgent">PlannerAgent</option>
                        <option value="CoderAgent">CoderAgent</option>
                        <option value="ReviewerAgent">ReviewerAgent</option>
                        <option value="AgentLee">AgentLee</option>
                      </select>
                    </div>
                  </div>

                  {/* Goal Cards */}
                  <div className="space-y-3">
                    {filteredRecords.map((rec) => {
                      const ownerProfile = AGENT_REGISTRY[rec.owner] || AGENT_REGISTRY.AgentLee;
                      const isResolved = rec.status === 'Resolved';
                      return (
                        <div
                          key={rec.id}
                          className={`bg-white rounded-2xl border transition-all duration-200 shadow-sm overflow-hidden ${
                            isResolved ? 'border-emerald-200 ring-1 ring-emerald-500/10' : 'border-stone-200 hover:border-stone-400'
                          }`}
                        >
                          <div className="p-3.5 bg-stone-50/80 border-b border-stone-200 flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-lg border ${
                                rec.priority === 'high' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-stone-100 text-stone-700 border-stone-200'
                              }`}>
                                {rec.priority}
                              </span>
                              <h4 className="font-extrabold text-xs text-stone-900">{rec.goal}</h4>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => advanceRecordStatus(rec.id)}
                                className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border transition-colors flex items-center gap-1 ${
                                  rec.status === 'Resolved' ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100' :
                                  rec.status === 'In Progress' ? 'bg-indigo-50 text-indigo-800 border-indigo-300 hover:bg-indigo-100' :
                                  rec.status === 'Review' ? 'bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100' :
                                  'bg-stone-100 text-stone-700 border-stone-300 hover:bg-stone-200'
                                }`}
                              >
                                <span>{rec.status}</span>
                                <ChevronRight size={11} />
                              </button>
                            </div>
                          </div>

                          <div className="p-4 space-y-3">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Active Task:</span>
                              <span className="text-[11px] font-semibold text-stone-800">{rec.task}</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
                              <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200">
                                <span className="font-bold text-stone-500 uppercase tracking-wider text-[9.5px] block mb-1">
                                  Evidence / Benchmark Finding:
                                </span>
                                <p className="text-stone-700 text-[11px] leading-relaxed">{rec.evidence}</p>
                              </div>
                              <div className="p-2.5 bg-emerald-50/50 rounded-xl border border-emerald-100">
                                <span className="font-bold text-emerald-800 uppercase tracking-wider text-[9.5px] block mb-1">
                                  Consensus Decision:
                                </span>
                                <p className="text-emerald-950 font-medium text-[11px] leading-relaxed">{rec.decision}</p>
                              </div>
                            </div>

                            {rec.codeSnippet && (
                              <div className="bg-stone-950 text-emerald-400 p-3 rounded-xl font-mono text-[10.5px] overflow-x-auto shadow-inner">
                                <pre>{rec.codeSnippet}</pre>
                              </div>
                            )}

                            <div className="pt-2 border-t border-stone-100 flex flex-wrap items-center justify-between text-xs gap-2">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[9.5px] font-bold text-stone-400 uppercase">Assigned Agent:</span>
                                <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-bold ${ownerProfile.badgeBg} ${ownerProfile.badgeText} ${ownerProfile.borderColor}`}>
                                  <span>{ownerProfile.avatarIcon}</span>
                                  <span>{ownerProfile.name}</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 text-stone-500 text-[10.5px]">
                                <span className="font-medium text-stone-400">Next Action:</span>
                                <span className="font-semibold text-stone-700">{rec.nextAction}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 2. TASK BOARD (KANBAN) VIEW */}
              {boardSubTab === 'taskboard' && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  {(['Proposed', 'In Progress', 'Review', 'Resolved'] as const).map(col => {
                    const colRecords = records.filter(r => r.status === col);
                    return (
                      <div key={col} className="bg-stone-50 rounded-xl border border-stone-200 p-2.5 flex flex-col min-h-[350px]">
                        <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-stone-200">
                          <span className="font-black text-[11px] uppercase tracking-wider text-stone-700">{col}</span>
                          <span className="bg-stone-200 text-stone-700 text-[9.5px] font-bold px-1.5 py-0.2 rounded-full">
                            {colRecords.length}
                          </span>
                        </div>

                        <div className="space-y-2 flex-1">
                          {colRecords.map(r => (
                            <div key={r.id} className="bg-white p-2.5 rounded-lg border border-stone-200 shadow-xs text-xs space-y-1.5">
                              <span className="font-bold text-stone-900 block leading-snug text-[11px]">{r.goal}</span>
                              <p className="text-stone-500 text-[10px] line-clamp-2">{r.task}</p>
                              <div className="flex items-center justify-between pt-1.5 border-t border-stone-100">
                                <span className="text-[9.5px] font-bold text-stone-600">{r.owner}</span>
                                <button
                                  onClick={() => advanceRecordStatus(r.id)}
                                  className="text-stone-400 hover:text-stone-900 transition-colors"
                                  title="Advance stage"
                                >
                                  <ChevronRight size={13} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 3. AGENT EVENT BUS VIEW */}
              {boardSubTab === 'bus' && (
                <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-stone-200">
                    <div>
                      <h3 className="font-black text-xs uppercase tracking-wider text-stone-900">
                        Real-Time Agent Event Bus
                      </h3>
                      <p className="text-[11px] text-stone-500">
                        Live telemetry and coordination broadcasts across the multi-agent cluster.
                      </p>
                    </div>
                    <button
                      onClick={() => setEvents([])}
                      className="text-[11px] text-stone-400 hover:text-red-500"
                    >
                      Clear Feed
                    </button>
                  </div>

                  {/* Human Directive Input */}
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    if (!agentBusInput.trim()) return;
                    addEventMessage('AgentLee', `[Human Directive]: ${agentBusInput.trim()}`, 'system');
                    setAgentBusInput('');
                  }} className="flex gap-2">
                    <input
                      type="text"
                      value={agentBusInput}
                      onChange={(e) => setAgentBusInput(e.target.value)}
                      placeholder="Broadcast direct guidance to all agents..."
                      className="flex-1 text-xs p-2 bg-stone-50 border border-stone-300 rounded-lg outline-none focus:bg-white focus:ring-2 focus:ring-stone-900"
                    />
                    <button
                      type="submit"
                      className="bg-stone-900 text-white px-3.5 py-2 rounded-lg text-xs font-bold hover:bg-stone-800 transition-colors flex items-center gap-1"
                    >
                      <Send size={12} />
                      <span>Broadcast</span>
                    </button>
                  </form>

                  {/* Event Stream */}
                  <div className="space-y-2 max-h-[44vh] overflow-y-auto pr-1">
                    {events.map((evt) => {
                      const agent = AGENT_REGISTRY[evt.agent] || AGENT_REGISTRY.AgentLee;
                      return (
                        <div key={evt.id} className="p-2.5 bg-stone-50 rounded-xl border border-stone-200 text-xs flex items-start gap-2.5">
                          <span className="text-sm leading-none mt-0.5">{agent.avatarIcon}</span>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-stone-900 text-[11px]">{agent.name}</span>
                              <span className="text-[9.5px] text-stone-400">{evt.timestamp}</span>
                            </div>
                            <p className="text-stone-700 mt-0.5 text-[11px] leading-relaxed">{evt.text}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 4. SHARED MEMORY VIEW */}
              {boardSubTab === 'memory' && (
                <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs space-y-3">
                  <div className="pb-2 border-b border-stone-200">
                    <h3 className="font-black text-xs uppercase tracking-wider text-stone-900">
                      Durable Shared Memory &amp; Knowledge Base
                    </h3>
                    <p className="text-[11px] text-stone-500">
                      Persistent system constraints, architecture patterns, and decision logs accessible to all agents.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {sharedMemory.map((mem) => (
                      <div key={mem.id} className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex flex-col justify-between space-y-2">
                        <div>
                          <span className="bg-stone-200 text-stone-800 text-[9.5px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md">
                            {mem.category}
                          </span>
                          <h4 className="font-extrabold text-xs text-stone-900 mt-1.5">{mem.title}</h4>
                          <p className="text-[11px] text-stone-600 mt-1 leading-relaxed">{mem.content}</p>
                        </div>
                        <div className="pt-2 border-t border-stone-200/60 flex items-center justify-between text-[9.5px] text-stone-400">
                          <span>By: {mem.updatedBy}</span>
                          <span>{mem.lastUpdated}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}
        </div>
      </div>

      {/* Modal for Creating New Blackboard Goal */}
      {showNewRecordModal && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-stone-200 max-w-md w-full p-5 shadow-2xl space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-sm text-stone-900">Post New Blackboard Objective</h3>
              <button
                onClick={() => setShowNewRecordModal(false)}
                className="text-stone-400 hover:text-stone-700 font-bold"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddNewGoal} className="space-y-3.5">
              <div>
                <label className="text-[11px] font-bold text-stone-700 block mb-1">
                  Objective / Goal Title:
                </label>
                <input
                  type="text"
                  required
                  value={newGoalInput}
                  onChange={(e) => setNewGoalInput(e.target.value)}
                  placeholder="e.g. Implement WebGPU hardware acceleration for whisper..."
                  className="w-full text-xs p-2.5 rounded-lg border border-stone-300 outline-none focus:ring-2 focus:ring-stone-900"
                />
              </div>

              <p className="text-[11px] text-stone-500 leading-relaxed">
                Once submitted, Dr. Rachel (ResearchAgent) will automatically claim this goal to evaluate evidence and constraints.
              </p>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowNewRecordModal(false)}
                  className="px-3.5 py-1.5 text-xs font-bold text-stone-600 hover:bg-stone-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 text-xs font-bold text-white bg-stone-900 hover:bg-stone-800 rounded-lg shadow-sm"
                >
                  Register to Blackboard
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {shareToast && (
        <div className="fixed bottom-5 right-5 z-50 bg-stone-900 text-white px-4 py-2.5 rounded-xl shadow-2xl border border-stone-700 flex items-center gap-2.5 text-xs font-semibold max-w-md animate-bounce">
          <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
          <span className="flex-1">{shareToast}</span>
          <button
            onClick={() => setShareToast(null)}
            className="text-stone-400 hover:text-white text-xs px-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-stone-200 py-2.5 px-4 text-center text-[10.5px] text-stone-500 shrink-0">
        <p>
          LeeWay Agent Notepad &bull; Shared Agent Utility / Tool / Skill &bull; Skeuomorphic Dual-Notepad &amp; Multi-Agent Blackboard Coordination Surface
        </p>
      </footer>
    </div>
  );
};

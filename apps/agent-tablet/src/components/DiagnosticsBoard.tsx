import React, { useState, useEffect } from 'react';
import {
  Activity,
  Cpu,
  Layers,
  Search,
  CheckCircle,
  AlertTriangle,
  Clock,
  Zap,
  BarChart2,
  Maximize2,
  RefreshCw,
  Eye,
  Sliders,
  Terminal,
  Shield,
  FileText,
  Database
} from 'lucide-react';

export interface FlowNode {
  id: string;
  label: string;
  x: number;
  y: number;
  state: 'passed' | 'active' | 'needs_fix' | 'failed' | 'blocked' | 'queued';
  turns: number;
  charge: number;
}

export interface GanttItem {
  label: string;
  start: number;
  dur: number;
  type: 'plan' | 'tool' | 'work' | 'wait' | 'review' | 'gate';
}

export interface GanttRow {
  agent: string;
  items: GanttItem[];
}

export interface ToolBenchmark {
  name: string;
  reliability: number;
  latency: number;
  success: number;
  cost: number;
}

export interface AuditSignal {
  ts: string;
  type: 'passed' | 'tool' | 'needs_fix' | 'escalate' | 'blocked';
  node: string;
  agent: string;
  message: string;
  corr: string;
}

export interface DiagnosticsSnapshot {
  telemetry?: {
    cpu: number;
    ram: number;
    disk: number;
    temp: number;
  };
  flowNodes?: FlowNode[];
  flowEdges?: [string, string][];
  charge?: number[];
  systemCharge?: number[];
  progress?: number[];
  gantt?: GanttRow[];
  tools?: ToolBenchmark[];
  signals?: AuditSignal[];
}

interface DiagnosticsBoardProps {
  telemetry: { cpu: number; ram: number; disk: number; temp: number };
  openNotebookStatus: string;
  workboardStatus: string;
  terminalStatus: string;
  dataStatus: string;
  activeAgentId?: string;
  onOptimizeWorkloads?: () => void;
}

const DEFAULT_FLOW_NODES: FlowNode[] = [];
const DEFAULT_FLOW_EDGES: [string, string][] = [];
const DEFAULT_GANTT: GanttRow[] = [];
const DEFAULT_TOOLS: ToolBenchmark[] = [];
const DEFAULT_SIGNALS: AuditSignal[] = [];
const DEMO_CHARGE: number[] = [];
const DEMO_PROGRESS: number[] = [];
const DEMO_SYSTEM: number[] = [];

export const DiagnosticsBoard: React.FC<DiagnosticsBoardProps> = ({
  telemetry,
  openNotebookStatus,
  workboardStatus,
  terminalStatus,
  dataStatus,
  activeAgentId = 'agent-lee',
  onOptimizeWorkloads
}) => {
  const [diagStatus, setDiagStatus] = useState<'BOUND' | 'UNBOUND'>('UNBOUND');
  const [diagMode, setDiagMode] = useState<'live' | 'trace'>('live');
  const [diagWindow, setDiagWindow] = useState<'1m' | '5m' | '15m' | '1h'>('5m');
  const [selectedDiagNode, setSelectedDiagNode] = useState<string>('runtime');
  const [diagSnapshot, setDiagSnapshot] = useState<DiagnosticsSnapshot | null>(null);
  const [signals, setSignals] = useState<AuditSignal[]>([]);

  // Poll diagnostics endpoint
  useEffect(() => {
    let stopped = false;
    const poll = async () => {
      try {
        const res = await fetch('/api/diagnostics/snapshot', {
          headers: { Accept: 'application/json' },
          cache: 'no-store'
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (stopped) return;
        setDiagSnapshot(data);
        setDiagStatus('BOUND');
        setSignals(Array.isArray(data.signals) ? data.signals.slice(0, 40) : []);
      } catch (_e) {
        if (!stopped) setDiagStatus('UNBOUND');
      }
    };

    poll();
    const intervalId = setInterval(poll, 2500);
    return () => {
      stopped = true;
      clearInterval(intervalId);
    };
  }, []);

  // SVG helper for sparkline curves
  const sparkPath = (values: number[], w = 360, h = 100) => {
    if (!values || !values.length) return '';
    const max = Math.max(...values, 1);
    const min = Math.min(...values, 0);
    const range = Math.max(1, max - min);
    return values
      .map((v, i) => {
        const x = (i / Math.max(1, values.length - 1)) * w;
        const y = h - ((v - min) / range) * (h * 0.9);
        return `${i ? 'L' : 'M'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');
  };

  // Helper for Radar charts
  const radarPoints = (tool: ToolBenchmark, size = 112) => {
    const vals = [tool.reliability, tool.latency, tool.success, tool.cost];
    return vals
      .map((v, i) => {
        const angle = -Math.PI / 2 + (i * Math.PI) / 2;
        const radius = (v / 100) * (size * 0.38);
        return `${(size / 2 + Math.cos(angle) * radius).toFixed(1)},${(
          size / 2 +
          Math.sin(angle) * radius
        ).toFixed(1)}`;
      })
      .join(' ');
  };

  const nodeColor = (state: FlowNode['state']) => {
    switch (state) {
      case 'passed':
        return '#22c55e'; // green
      case 'active':
        return '#22d3ee'; // cyan
      case 'needs_fix':
        return '#f59e0b'; // amber
      case 'failed':
      case 'blocked':
        return '#ef4444'; // red
      case 'queued':
      default:
        return '#64748b'; // slate
    }
  };

  const diagSeries = (key: 'charge' | 'systemCharge' | 'progress', fallback: number[]) => {
    if (diagSnapshot && Array.isArray(diagSnapshot[key]) && diagSnapshot[key]!.length > 0) {
      return diagSnapshot[key]!;
    }
    return fallback;
  };

  const flowNodes = diagSnapshot?.flowNodes || DEFAULT_FLOW_NODES;
  const flowEdges = diagSnapshot?.flowEdges || DEFAULT_FLOW_EDGES;
  const ganttRows = diagSnapshot?.gantt || DEFAULT_GANTT;
  const tools = diagSnapshot?.tools || DEFAULT_TOOLS;

  const activeNode = flowNodes.find(n => n.id === selectedDiagNode) || flowNodes[0];

  const taskChargeData = diagSeries('charge', DEMO_CHARGE);
  const systemChargeData = diagSeries('systemCharge', DEMO_SYSTEM);
  const progressData = diagSeries('progress', DEMO_PROGRESS);

  const currentTaskCharge = taskChargeData[taskChargeData.length - 1] ?? 0;
  const currentProgress = progressData[progressData.length - 1] ?? 0;

  return (
    <div className="flex-grow flex flex-col bg-[#06090f] text-zinc-200 font-mono select-none overflow-hidden h-full">
      {/* Top Header Bar */}
      <div className="h-10 bg-[#0d1320] border-b border-cyan-950 flex items-center justify-between gap-3 px-3 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Activity size={15} className="text-cyan-400 shrink-0" />
          <div>
            <div className="text-[10px] font-black text-white tracking-widest leading-none">
              LEEWAY VISUAL DIAGNOSTIC BOARD
            </div>
            <div className="text-[7.5px] text-zinc-500 tracking-tight mt-0.5">
              workflow observability · charge · latency · tools · signals · evidence
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div
            className={`px-2.5 py-0.5 rounded border text-[8px] font-black tracking-wider ${
              diagStatus === 'BOUND'
                ? 'bg-green-950/60 border-green-700 text-green-300'
                : 'bg-amber-950/50 border-amber-700 text-amber-300'
            }`}
          >
            {diagStatus}
          </div>

          <div className="flex items-center gap-1 bg-black border border-zinc-800 rounded px-1.5 py-0.5 text-[8px]">
            <span className="text-zinc-500">WINDOW:</span>
            <select
              value={diagWindow}
              onChange={e => setDiagWindow(e.target.value as any)}
              className="bg-transparent text-zinc-300 outline-none cursor-pointer"
            >
              <option value="1m">1m</option>
              <option value="5m">5m</option>
              <option value="15m">15m</option>
              <option value="1h">1h</option>
            </select>
          </div>

          <button
            onClick={() => setDiagMode(prev => (prev === 'live' ? 'trace' : 'live'))}
            className="px-2.5 py-1 rounded border border-cyan-900 bg-cyan-950/30 text-cyan-300 text-[8px] font-bold hover:bg-cyan-900/40 transition-colors"
          >
            {diagMode === 'live' ? 'LIVE VIEW' : 'TRACE VIEW'}
          </button>
        </div>
      </div>

      {/* Main 3-Column Diagnostic Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_1.45fr_0.95fr] gap-2 p-2 flex-grow min-h-0 overflow-hidden">
        {/* ================= COLUMN 1: MACRO FLOW + RUNTIME HEALTH ================= */}
        <div className="flex flex-col gap-2 min-w-0 min-h-0">
          {/* Global Flow / Path Taken */}
          <section className="bg-[#0a1019] border border-zinc-800 rounded-lg flex flex-col min-h-0 flex-[1.25]">
            <div className="px-3 py-1.5 border-b border-zinc-800 flex items-center justify-between shrink-0">
              <div>
                <div className="text-[9px] font-black text-white">GLOBAL FLOW / PATH TAKEN</div>
                <div className="text-[7px] text-zinc-500">
                  Heatmapped workflow graph · click a node to inspect charge and turns
                </div>
              </div>
              <span className="text-[7px] text-zinc-600 font-bold bg-zinc-900 px-1.5 py-0.5 rounded">
                MAX TURNS WATCH
              </span>
            </div>

            <div className="flex-grow min-h-0 p-2 overflow-auto relative">
              <svg viewBox="0 0 950 205" className="w-full min-w-[500px] h-full min-h-[170px]">
                <defs>
                  <filter id="diag-glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="4" result="b" />
                    <feMerge>
                      <feMergeNode in="b" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {/* Edges */}
                {flowEdges.map((edge, idx) => {
                  const nodeA = flowNodes.find(n => n.id === edge[0]);
                  const nodeB = flowNodes.find(n => n.id === edge[1]);
                  if (!nodeA || !nodeB) return null;

                  const midX1 = nodeA.x + 95;
                  const midX2 = nodeB.x - 95;
                  return (
                    <g key={idx}>
                      {/* Background track */}
                      <path
                        d={`M ${nodeA.x + 52} ${nodeA.y} C ${midX1} ${nodeA.y}, ${midX2} ${nodeB.y}, ${nodeB.x - 52} ${nodeB.y}`}
                        stroke="#17324b"
                        strokeWidth="6"
                        fill="none"
                        opacity=".5"
                      />
                      {/* Active state line */}
                      <path
                        d={`M ${nodeA.x + 52} ${nodeA.y} C ${midX1} ${nodeA.y}, ${midX2} ${nodeB.y}, ${nodeB.x - 52} ${nodeB.y}`}
                        stroke={nodeColor(nodeB.state)}
                        strokeWidth="1.8"
                        fill="none"
                        opacity=".8"
                      />
                    </g>
                  );
                })}

                {/* Nodes */}
                {flowNodes.map(node => {
                  const isSelected = selectedDiagNode === node.id;
                  const hasGlow = node.state === 'active' || node.state === 'needs_fix';
                  return (
                    <g
                      key={node.id}
                      onClick={() => setSelectedDiagNode(node.id)}
                      className="cursor-pointer group"
                      filter={hasGlow ? 'url(#diag-glow)' : undefined}
                    >
                      <rect
                        x={node.x - 55}
                        y={node.y - 24}
                        width="110"
                        height="48"
                        rx="8"
                        fill={isSelected ? '#111d2b' : '#0c1420'}
                        stroke={nodeColor(node.state)}
                        strokeWidth={isSelected ? 2.5 : 1.2}
                        className="transition-all"
                      />
                      <circle cx={node.x - 42} cy={node.y - 10} r="4" fill={nodeColor(node.state)} />
                      <text
                        x={node.x}
                        y={node.y - 4}
                        fill="#e5eef7"
                        fontSize="9.5"
                        fontWeight="700"
                        textAnchor="middle"
                      >
                        {node.label}
                      </text>
                      <text
                        x={node.x}
                        y={node.y + 11}
                        fill="#718096"
                        fontSize="7.5"
                        textAnchor="middle"
                      >
                        turns {node.turns} · charge {node.charge}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Selected Node Details Bar */}
            {activeNode && (
              <div className="grid grid-cols-4 border-t border-zinc-800 text-center shrink-0 bg-black/40">
                <div className="p-1.5">
                  <div className="text-[6.5px] text-zinc-500 uppercase tracking-wider">NODE</div>
                  <div className="text-[8px] text-white font-bold truncate">{activeNode.label}</div>
                </div>
                <div className="p-1.5 border-l border-zinc-800">
                  <div className="text-[6.5px] text-zinc-500 uppercase tracking-wider">STATE</div>
                  <div
                    className="text-[8px] font-bold uppercase"
                    style={{ color: nodeColor(activeNode.state) }}
                  >
                    {activeNode.state}
                  </div>
                </div>
                <div className="p-1.5 border-l border-zinc-800">
                  <div className="text-[6.5px] text-zinc-500 uppercase tracking-wider">TURNS</div>
                  <div className="text-[10px] text-white font-black">{activeNode.turns}</div>
                </div>
                <div className="p-1.5 border-l border-zinc-800">
                  <div className="text-[6.5px] text-zinc-500 uppercase tracking-wider">CHARGE</div>
                  <div className="text-[10px] text-amber-300 font-black">{activeNode.charge}</div>
                </div>
              </div>
            )}
          </section>

          {/* Runtime Health */}
          <section className="bg-[#0a1019] border border-zinc-800 rounded-lg flex flex-col min-h-0 flex-[0.75]">
            <div className="px-3 py-1.5 border-b border-zinc-800 flex justify-between items-center shrink-0">
              <div className="text-[9px] font-black text-white">RUNTIME HEALTH</div>
              <span className="text-[7px] text-zinc-600">service reachability + host pulse</span>
            </div>

            {/* Telemetry Numbers Grid */}
            <div className="grid grid-cols-4 gap-px bg-zinc-800 shrink-0">
              {[
                { label: 'CPU', val: `${telemetry.cpu}%`, color: '#22c55e' },
                { label: 'RAM', val: `${telemetry.ram}%`, color: '#22d3ee' },
                { label: 'DISK I/O', val: `${telemetry.disk}%`, color: '#f59e0b' },
                { label: 'TEMP', val: `${telemetry.temp}°C`, color: '#fb7185' }
              ].map(item => (
                <div key={item.label} className="bg-[#09111b] p-2">
                  <div className="text-[6.5px] text-zinc-500 uppercase">{item.label}</div>
                  <div className="text-[13px] font-black leading-tight" style={{ color: item.color }}>
                    {item.val}
                  </div>
                </div>
              ))}
            </div>

            {/* Services Reachability Strip */}
            <div className="grid grid-cols-2 gap-1.5 p-2 overflow-y-auto">
              {[
                ['Open Notebook :5326', openNotebookStatus],
                ['Workboard :5339', workboardStatus],
                ['Terminal Gateway', terminalStatus],
                ['Data Fabric', dataStatus]
              ].map(([name, status]) => {
                const isGood =
                  String(status).includes('REACH') ||
                  status === 'CONNECTED' ||
                  status === 'BOUND';
                return (
                  <div
                    key={name}
                    className="flex items-center justify-between bg-black/40 border border-zinc-800 rounded px-2 py-1"
                  >
                    <span className="text-[7.5px] text-zinc-400 truncate pr-1">{name}</span>
                    <span
                      className={`text-[7px] font-black uppercase shrink-0 ${
                        isGood ? 'text-green-400' : 'text-amber-400'
                      }`}
                    >
                      {status}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* ================= COLUMN 2: CHARGE + GANTT + TOOL RADAR ================= */}
        <div className="flex flex-col gap-2 min-w-0 min-h-0">
          {/* Intelligence Charge Pulse */}
          <section className="bg-[#0a1019] border border-zinc-800 rounded-lg flex flex-col min-h-0 flex-[1.05]">
            <div className="px-3 py-1.5 border-b border-zinc-800 flex items-center justify-between shrink-0">
              <div>
                <div className="text-[9px] font-black text-white">INTELLIGENCE CHARGE PULSE</div>
                <div className="text-[7px] text-zinc-500">
                  system baseline + task charge overlaid against actual progress
                </div>
              </div>
              <div className="flex gap-2 text-[7px] font-bold">
                <span className="text-amber-400">■ TASK</span>
                <span className="text-cyan-400">■ SYSTEM</span>
                <span className="text-green-400">■ PROGRESS</span>
              </div>
            </div>

            <div className="p-2 h-[125px] relative flex-grow min-h-0">
              <svg viewBox="0 0 360 110" className="w-full h-full">
                <defs>
                  <linearGradient id="chargeFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.02" />
                  </linearGradient>
                </defs>

                {/* Horizontal reference lines */}
                {[20, 40, 60, 80, 100].map(y => (
                  <line
                    key={y}
                    x1="0"
                    y1={110 - y}
                    x2="360"
                    y2={110 - y}
                    stroke="#17202b"
                    strokeWidth="1"
                  />
                ))}

                {/* Area Fill for Task Charge */}
                <path
                  d={`${sparkPath(taskChargeData, 360, 100)} L 360 110 L 0 110 Z`}
                  fill="url(#chargeFill)"
                />

                {/* Task Charge Line */}
                <path
                  d={sparkPath(taskChargeData, 360, 100)}
                  stroke="#f59e0b"
                  strokeWidth="2"
                  fill="none"
                />

                {/* System Baseline Line */}
                <path
                  d={sparkPath(systemChargeData, 360, 100)}
                  stroke="#22d3ee"
                  strokeWidth="1.5"
                  fill="none"
                  opacity="0.9"
                />

                {/* Progress Trajectory Line */}
                <path
                  d={sparkPath(progressData, 360, 100)}
                  stroke="#22c55e"
                  strokeWidth="2"
                  fill="none"
                />
              </svg>
            </div>

            {/* Charge Bottom Stats Strip */}
            <div className="grid grid-cols-4 border-t border-zinc-800 text-center shrink-0 bg-black/40">
              <div className="p-1.5">
                <div className="text-[6.5px] text-zinc-500 uppercase">TASK CHARGE</div>
                <div className="text-[10px] font-black text-amber-300">{currentTaskCharge}</div>
              </div>
              <div className="p-1.5 border-l border-zinc-800">
                <div className="text-[6.5px] text-zinc-500 uppercase">PROGRESS</div>
                <div className="text-[10px] font-black text-green-400">{currentProgress}%</div>
              </div>
              <div className="p-1.5 border-l border-zinc-800">
                <div className="text-[6.5px] text-zinc-500 uppercase">LOOP RISK</div>
                <div className="text-[9.5px] font-black text-green-400">LOW</div>
              </div>
              <div className="p-1.5 border-l border-zinc-800">
                <div className="text-[6.5px] text-zinc-500 uppercase">CONFIDENCE</div>
                <div className="text-[8px] font-black text-zinc-500" title="Explicitly unasserted without calibrated runtime model">
                  UNAVAILABLE
                </div>
              </div>
            </div>
          </section>

          {/* Agentic Gantt / Parallel Execution */}
          <section className="bg-[#0a1019] border border-zinc-800 rounded-lg flex flex-col min-h-0 flex-[0.95]">
            <div className="px-3 py-1.5 border-b border-zinc-800 shrink-0">
              <div className="text-[9px] font-black text-white">AGENTIC GANTT / PARALLEL EXECUTION</div>
              <div className="text-[7px] text-zinc-500">
                branch activity, waits, tool calls, and review bottlenecks
              </div>
            </div>

            <div className="p-2 overflow-y-auto space-y-1">
              {ganttRows.map(row => (
                <div key={row.agent} className="grid grid-cols-[68px_1fr] items-center gap-1">
                  <div className="text-[7px] text-zinc-400 font-bold truncate">{row.agent}</div>
                  <div className="relative h-5 bg-black/50 border border-zinc-900 rounded overflow-hidden">
                    {row.items.map((item, i) => {
                      let bg = '#22c55e'; // work
                      if (item.type === 'wait') bg = '#475569';
                      else if (item.type === 'review') bg = '#f59e0b';
                      else if (item.type === 'tool') bg = '#22d3ee';
                      else if (item.type === 'gate') bg = '#a78bfa';

                      return (
                        <div
                          key={i}
                          title={`${item.label}: ${item.start}% - ${item.start + item.dur}%`}
                          className="absolute top-0.5 h-4 rounded px-1 text-[6px] text-black font-black overflow-hidden whitespace-nowrap flex items-center"
                          style={{
                            left: `${item.start}%`,
                            width: `${item.dur}%`,
                            background: bg
                          }}
                        >
                          {item.label}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Tool Registry / Efficiency Radar */}
          <section className="bg-[#0a1019] border border-zinc-800 rounded-lg flex flex-col min-h-0 flex-[0.9]">
            <div className="px-3 py-1.5 border-b border-zinc-800 shrink-0">
              <div className="text-[9px] font-black text-white">TOOL REGISTRY / EFFICIENCY RADAR</div>
              <div className="text-[7px] text-zinc-500">
                axes: reliability · latency score · success · cost efficiency
              </div>
            </div>

            <div className="grid grid-cols-5 gap-1 p-2">
              {tools.map(tool => (
                <div key={tool.name} className="bg-black/40 border border-zinc-800 rounded p-1 text-center">
                  <svg viewBox="0 0 112 112" className="w-full max-h-[70px]">
                    {/* Grid guides */}
                    <polygon points="56,10 102,56 56,102 10,56" fill="none" stroke="#263444" strokeWidth="1" />
                    <polygon points="56,28 84,56 56,84 28,56" fill="none" stroke="#182432" strokeWidth="1" />
                    <line x1="56" y1="10" x2="56" y2="102" stroke="#182432" strokeWidth="1" />
                    <line x1="10" y1="56" x2="102" y2="56" stroke="#182432" strokeWidth="1" />
                    {/* Data polygon */}
                    <polygon
                      points={radarPoints(tool)}
                      fill="#22d3ee33"
                      stroke="#22d3ee"
                      strokeWidth="1.5"
                    />
                  </svg>
                  <div className="text-[7px] text-zinc-200 font-bold truncate">{tool.name}</div>
                  <div className="text-[6px] text-zinc-500">
                    R {tool.reliability} · S {tool.success}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* ================= COLUMN 3: SIGNALS + ALERTS + TRACE ================= */}
        <div className="flex flex-col gap-2 min-w-0 min-h-0">
          {/* Signal / Audit Log */}
          <section className="bg-[#0a1019] border border-zinc-800 rounded-lg flex flex-col min-h-0 flex-[1.4]">
            <div className="px-3 py-1.5 border-b border-zinc-800 flex justify-between items-center shrink-0">
              <div>
                <div className="text-[9px] font-black text-white">SIGNAL / AUDIT LOG</div>
                <div className="text-[7px] text-zinc-500">
                  clickable workflow signals with correlation IDs
                </div>
              </div>
              <span className="text-[6.5px] text-zinc-600 font-bold">
                {signals.length} EVENTS
              </span>
            </div>

            <div className="flex-grow overflow-y-auto p-2 space-y-1.5 select-text">
              {signals.map((sig, idx) => {
                let badgeCol = '#22c55e';
                if (sig.type === 'needs_fix') badgeCol = '#f59e0b';
                else if (sig.type === 'escalate') badgeCol = '#a78bfa';
                else if (sig.type === 'blocked') badgeCol = '#ef4444';
                else if (sig.type === 'tool') badgeCol = '#22d3ee';

                return (
                  <div
                    key={idx}
                    className="bg-black/40 border border-zinc-800 rounded p-2 hover:border-zinc-700 transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span
                        className="px-1.5 py-0.2 rounded text-[6px] font-black uppercase"
                        style={{
                          background: `${badgeCol}22`,
                          color: badgeCol,
                          border: `1px solid ${badgeCol}66`
                        }}
                      >
                        {sig.type}
                      </span>
                      <span className="text-[6.5px] text-zinc-500">{sig.ts}</span>
                      <span className="ml-auto text-[6.5px] text-cyan-600 font-bold">{sig.corr}</span>
                    </div>
                    <div className="mt-1 text-[7.5px] text-zinc-200 font-bold">{sig.node}</div>
                    <div className="mt-0.5 text-[7px] text-zinc-400 leading-snug">{sig.message}</div>
                    <div className="mt-1 text-[6px] text-zinc-600">actor: {sig.agent}</div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Actionable Watches */}
          <section className="bg-[#0a1019] border border-zinc-800 rounded-lg flex flex-col min-h-0 flex-[0.72]">
            <div className="px-3 py-1.5 border-b border-zinc-800 shrink-0">
              <div className="text-[9px] font-black text-white">ACTIONABLE WATCHES</div>
            </div>
            <div className="p-2 space-y-1.5 overflow-y-auto">
              <div className="border border-green-900/80 bg-green-950/20 rounded p-2">
                <div className="text-[7px] text-green-400 font-black">LOOP SATURATION · NORMAL</div>
                <div className="text-[6.8px] text-zinc-400 mt-0.5 leading-tight">
                  Charge is declining smoothly as task progress advances toward completion.
                </div>
              </div>
              <div className="border border-amber-900/80 bg-amber-950/20 rounded p-2">
                <div className="text-[7px] text-amber-400 font-black">REVIEW BOTTLENECK · WATCH</div>
                <div className="text-[6.8px] text-zinc-400 mt-0.5 leading-tight">
                  Reviewer lane contains the longest wait interval prior to consensus lock.
                </div>
              </div>
              <div className="border border-cyan-950 bg-cyan-950/20 rounded p-2">
                <div className="text-[7px] text-cyan-400 font-black">TOOL LATENCY · ACCEPTABLE</div>
                <div className="text-[6.8px] text-zinc-400 mt-0.5 leading-tight">
                  No registered tool currently breaches the 250ms target threshold.
                </div>
              </div>
            </div>
          </section>

          {/* Trace Boundary Notice (LeeWay Standard) */}
          <section className="bg-[#0a1019] border border-zinc-800 rounded-lg flex flex-col shrink-0 p-2 text-[7px] text-zinc-500 leading-relaxed">
            <div className="text-[8px] font-black text-white mb-1">TRACE BOUNDARY (LEEWAY STANDARD)</div>
            <div>
              This board visualizes observable workflow signals, token/compute accounting, tool calls, latency,
              states, and evidence. It does <span className="text-zinc-300 font-bold">not</span> expose hidden
              chain-of-thought. &ldquo;Confidence&rdquo; remains unavailable unless a runtime provides an explicit calibrated score.
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

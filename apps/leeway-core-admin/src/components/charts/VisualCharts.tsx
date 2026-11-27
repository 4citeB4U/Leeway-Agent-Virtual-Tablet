/*
LEEWAY HEADER — DO NOT REMOVE

REGION: LEEWAY.CORE.FRONTEND.CHARTS
TAG: LEEWAY.CORE.INTERACTIVE.VISUALIZATIONS.V1

5WH:
WHAT = High-precision interactive SVG chart and graph suite (Trend, Bar, Donut, HeatMap, RadialGauge, TopologyGraph, TwelveStageBar).
WHY = Deliver the 70-80% graphical enterprise control experience with zero decorative animation, metallic gold / electric-blue precision, and direct click drill-down.
WHO = Creator/Human Authority via Leeway Innovations.
WHERE = src/components/charts/VisualCharts.tsx
WHEN = 2026-11-27
HOW = Pure TypeScript React SVG components with hover tooltips, tabular numerals, semantic colors, and selection callbacks.

LICENSE = Apache-2.0
*/
import React, { useState } from 'react';
import { TWELVE_ENGINEERING_STAGES, type EngineeringStage } from '../../types/leeway';

export interface TrendSeries {
  id: string;
  label: string;
  color: string;
  dashed?: boolean;
  values: number[];
}

export function TrendChart({
  labels,
  series,
  height = 200,
  unit = '',
  onPointSelect,
}: {
  labels: string[];
  series: TrendSeries[];
  height?: number;
  unit?: string;
  onPointSelect?: (label: string, index: number) => void;
}) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const w = 640;
  const padL = 44;
  const padR = 16;
  const padT = 16;
  const padB = 28;
  const innerW = w - padL - padR;
  const innerH = height - padT - padB;

  const allVals = series.flatMap((s) => s.values);
  const minVal = Math.min(0, ...allVals);
  const maxVal = Math.max(10, ...allVals) * 1.08;
  const range = Math.max(1, maxVal - minVal);

  const xAt = (i: number) =>
    labels.length <= 1 ? padL + innerW / 2 : padL + (i / (labels.length - 1)) * innerW;
  const yAt = (v: number) => padT + innerH - ((v - minVal) / range) * innerH;

  return (
    <div className="w-full select-none">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300">
          {series.map((s) => (
            <span key={s.id} className="inline-flex items-center gap-1.5">
              <span
                className="inline-block h-2 w-4"
                style={{
                  backgroundColor: s.dashed ? 'transparent' : s.color,
                  borderTop: s.dashed ? `2px dashed ${s.color}` : 'none',
                }}
              />
              <span>{s.label}</span>
            </span>
          ))}
        </div>
        {hoverIdx !== null && labels[hoverIdx] && (
          <div className="font-mono text-xs text-[#F8E7A1] tabular-nums">
            {labels[hoverIdx]} ·{' '}
            {series.map((s) => `${s.label}: ${s.values[hoverIdx] ?? 0}${unit}`).join(' | ')}
          </div>
        )}
      </div>

      <svg
        viewBox={`0 0 ${w} ${height}`}
        className="w-full overflow-visible"
        role="img"
        aria-label="Interactive trend visualization"
      >
        {[0, 0.25, 0.5, 0.75, 1].map((t) => {
          const val = minVal + range * (1 - t);
          const y = padT + innerH * t;
          return (
            <g key={t}>
              <line x1={padL} y1={y} x2={w - padR} y2={y} stroke="#1F2937" strokeWidth="1" />
              <text
                x={padL - 8}
                y={y + 4}
                textAnchor="end"
                className="fill-slate-400 font-mono text-[10px]"
              >
                {Math.round(val)}
                {unit}
              </text>
            </g>
          );
        })}

        {series.map((s) => {
          const pts = s.values.map((v, i) => `${xAt(i)},${yAt(v)}`).join(' ');
          const areaPts = `${xAt(0)},${padT + innerH} ${pts} ${xAt(s.values.length - 1)},${padT + innerH}`;
          return (
            <g key={s.id}>
              {!s.dashed && (
                <polygon points={areaPts} fill={s.color} fillOpacity="0.08" />
              )}
              <polyline
                fill="none"
                stroke={s.color}
                strokeWidth={s.dashed ? 1.75 : 2.25}
                strokeDasharray={s.dashed ? '5 4' : undefined}
                points={pts}
              />
              {s.values.map((v, i) => (
                <circle
                  key={`${s.id}-${i}`}
                  cx={xAt(i)}
                  cy={yAt(v)}
                  r={hoverIdx === i ? 5 : 3}
                  fill={hoverIdx === i ? '#D4AF37' : s.color}
                  stroke="#0B0E14"
                  strokeWidth="1.5"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoverIdx(i)}
                  onMouseLeave={() => setHoverIdx(null)}
                  onClick={() => onPointSelect?.(labels[i], i)}
                />
              ))}
            </g>
          );
        })}

        {labels.map((lbl, i) => (
          <text
            key={lbl + i}
            x={xAt(i)}
            y={height - 6}
            textAnchor="middle"
            className="fill-slate-400 font-mono text-[10px]"
          >
            {lbl}
          </text>
        ))}

        {hoverIdx !== null && (
          <line
            x1={xAt(hoverIdx)}
            y1={padT}
            x2={xAt(hoverIdx)}
            y2={padT + innerH}
            stroke="rgba(212,175,55,0.45)"
            strokeWidth="1"
            strokeDasharray="3 3"
          />
        )}
      </svg>
    </div>
  );
}

export interface BarDatum {
  id: string;
  label: string;
  value: number;
  secondaryValue?: number;
  color?: string;
  note?: string;
}

export function BarChart({
  data,
  height = 190,
  unit = '',
  primaryLabel = 'Current',
  secondaryLabel = 'Baseline',
  onSelect,
}: {
  data: BarDatum[];
  height?: number;
  unit?: string;
  primaryLabel?: string;
  secondaryLabel?: string;
  onSelect?: (item: BarDatum) => void;
}) {
  const [hoverId, setHoverId] = useState<string | null>(null);
  const w = 560;
  const padL = 42;
  const padR = 12;
  const padT = 16;
  const padB = 34;
  const innerW = w - padL - padR;
  const innerH = height - padT - padB;
  const maxVal = Math.max(
    10,
    ...data.flatMap((d) => [d.value, d.secondaryValue ?? 0])
  ) * 1.1;

  const slotW = innerW / Math.max(1, data.length);
  const hasSecondary = data.some((d) => typeof d.secondaryValue === 'number');
  const hovered = data.find((d) => d.id === hoverId);

  return (
    <div className="w-full select-none">
      <div className="mb-2 flex items-center justify-between text-xs">
        <div className="flex items-center gap-4 text-slate-300">
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 bg-[#38BDF8]" />
            <span>{primaryLabel}</span>
          </span>
          {hasSecondary && (
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 bg-[#D4AF37]" />
              <span>{secondaryLabel}</span>
            </span>
          )}
        </div>
        {hovered && (
          <span className="font-mono text-[#F8E7A1] tabular-nums">
            {hovered.label}: {hovered.value}
            {unit}
            {typeof hovered.secondaryValue === 'number'
              ? ` vs ${hovered.secondaryValue}${unit}`
              : ''}
          </span>
        )}
      </div>

      <svg viewBox={`0 0 ${w} ${height}`} className="w-full overflow-visible">
        {[0, 0.5, 1].map((t) => {
          const y = padT + innerH * (1 - t);
          return (
            <g key={t}>
              <line x1={padL} y1={y} x2={w - padR} y2={y} stroke="#1F2937" strokeWidth="1" />
              <text x={padL - 6} y={y + 4} textAnchor="end" className="fill-slate-400 font-mono text-[10px]">
                {Math.round(maxVal * t)}
                {unit}
              </text>
            </g>
          );
        })}

        {data.map((d, i) => {
          const barW = hasSecondary ? Math.min(20, slotW * 0.34) : Math.min(34, slotW * 0.58);
          const cx = padL + i * slotW + slotW / 2;
          const h1 = (d.value / maxVal) * innerH;
          const y1 = padT + innerH - h1;
          const fill = d.color || '#38BDF8';
          return (
            <g
              key={d.id}
              className="cursor-pointer"
              onMouseEnter={() => setHoverId(d.id)}
              onMouseLeave={() => setHoverId(null)}
              onClick={() => onSelect?.(d)}
            >
              <rect
                x={hasSecondary ? cx - barW - 2 : cx - barW / 2}
                y={y1}
                width={barW}
                height={Math.max(2, h1)}
                rx="2"
                fill={hoverId === d.id ? '#F8E7A1' : fill}
              />
              {hasSecondary && typeof d.secondaryValue === 'number' && (
                <rect
                  x={cx + 2}
                  y={padT + innerH - (d.secondaryValue / maxVal) * innerH}
                  width={barW}
                  height={Math.max(2, (d.secondaryValue / maxVal) * innerH)}
                  rx="2"
                  fill="#D4AF37"
                  fillOpacity="0.85"
                />
              )}
              <text
                x={cx}
                y={height - 10}
                textAnchor="middle"
                className="fill-slate-400 text-[10px]"
              >
                {d.label.length > 11 ? `${d.label.slice(0, 10)}…` : d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export interface DonutSegment {
  id: string;
  label: string;
  value: number;
  color: string;
}

export function DonutChart({
  segments,
  centerValue,
  centerLabel,
  onSelect,
}: {
  segments: DonutSegment[];
  centerValue: string | number;
  centerLabel: string;
  onSelect?: (seg: DonutSegment) => void;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const total = Math.max(1, segments.reduce((acc, s) => acc + s.value, 0));
  const r = 54;
  const c = 2 * Math.PI * r;

  let offset = 0;
  return (
    <div className="flex flex-col sm:flex-row items-center gap-5">
      <div className="relative h-36 w-36 shrink-0">
        <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90">
          <circle cx="70" cy="70" r={r} fill="none" stroke="#1E2533" strokeWidth="16" />
          {segments.map((seg) => {
            const frac = seg.value / total;
            const dash = frac * c;
            const currentOffset = offset;
            offset += dash;
            return (
              <circle
                key={seg.id}
                cx="70"
                cy="70"
                r={r}
                fill="none"
                stroke={seg.color}
                strokeWidth={activeId === seg.id ? 20 : 16}
                strokeDasharray={`${dash} ${c - dash}`}
                strokeDashoffset={-currentOffset}
                className="cursor-pointer"
                onMouseEnter={() => setActiveId(seg.id)}
                onMouseLeave={() => setActiveId(null)}
                onClick={() => onSelect?.(seg)}
              />
            );
          })}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="font-mono text-xl font-semibold text-white tabular-nums">{centerValue}</span>
          <span className="text-[11px] text-slate-400">{centerLabel}</span>
        </div>
      </div>

      <div className="flex-1 space-y-2 w-full">
        {segments.map((seg) => {
          const pct = Math.round((seg.value / total) * 100);
          return (
            <button
              key={seg.id}
              type="button"
              onClick={() => onSelect?.(seg)}
              onMouseEnter={() => setActiveId(seg.id)}
              onMouseLeave={() => setActiveId(null)}
              className="flex w-full items-center justify-between rounded border border-transparent px-2 py-1 text-left text-xs hover:border-[#D4AF37]/40 hover:bg-[#171D2A]"
            >
              <span className="flex items-center gap-2 text-slate-200 truncate">
                <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-xs" style={{ backgroundColor: seg.color }} />
                <span className="truncate">{seg.label}</span>
              </span>
              <span className="font-mono text-slate-300 tabular-nums shrink-0 ml-2">
                {seg.value} ({pct}%)
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function RadialGauge({
  value,
  label,
  statusText,
  tone,
  sublabel,
}: {
  value: number | null;
  label: string;
  statusText: string;
  tone: 'GREEN' | 'AMBER' | 'RED' | 'BLUE' | 'GRAY';
  sublabel?: string;
}) {
  const colorMap = {
    GREEN: '#22C55E',
    AMBER: '#F59E0B',
    RED: '#EF4444',
    BLUE: '#38BDF8',
    GRAY: '#64748B',
  };
  const stroke = colorMap[tone];
  const r = 42;
  const halfC = Math.PI * r;
  const pct = value === null ? 0 : Math.max(0, Math.min(100, value));
  const dash = (pct / 100) * halfC;

  return (
    <div className="flex flex-col items-center justify-between rounded-lg border border-[#252D3D] bg-[#0E131C] p-3 text-center">
      <svg viewBox="0 0 110 66" className="w-28">
        <path
          d="M 13 58 A 42 42 0 0 1 97 58"
          fill="none"
          stroke="#1F2937"
          strokeWidth="10"
          strokeLinecap="round"
        />
        {value !== null && (
          <path
            d="M 13 58 A 42 42 0 0 1 97 58"
            fill="none"
            stroke={stroke}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${halfC}`}
          />
        )}
        <text x="55" y="50" textAnchor="middle" className="fill-white font-mono text-sm font-semibold">
          {value === null ? 'N/A' : `${value.toFixed(1)}%`}
        </text>
      </svg>
      <div className="mt-1 text-xs font-medium text-slate-200">{label}</div>
      <div className="mt-0.5 font-mono text-[11px]" style={{ color: stroke }}>
        {statusText}
      </div>
      {sublabel && <div className="mt-0.5 text-[11px] text-slate-400 truncate max-w-full">{sublabel}</div>}
    </div>
  );
}

export interface HeatCell {
  id: string;
  label: string;
  sublabel: string;
  intensity: number; // 0..100
  tone: 'GREEN' | 'AMBER' | 'RED' | 'BLUE' | 'GRAY';
}

export function HeatMapGrid({
  cells,
  onSelect,
}: {
  cells: HeatCell[];
  onSelect?: (cell: HeatCell) => void;
}) {
  const toneBg = {
    GREEN: 'border-emerald-500/40 bg-emerald-950/40 text-emerald-200',
    AMBER: 'border-amber-500/40 bg-amber-950/40 text-amber-200',
    RED: 'border-rose-500/45 bg-rose-950/45 text-rose-200',
    BLUE: 'border-sky-500/40 bg-sky-950/40 text-sky-200',
    GRAY: 'border-slate-600/40 bg-slate-900/60 text-slate-300',
  };
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
      {cells.map((cell) => (
        <button
          key={cell.id}
          type="button"
          onClick={() => onSelect?.(cell)}
          className={`rounded-md border p-2.5 text-left hover:border-[#D4AF37] ${toneBg[cell.tone]}`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-xs font-semibold text-white">{cell.label}</span>
            <span className="font-mono text-xs tabular-nums shrink-0">{cell.intensity}%</span>
          </div>
          <div className="mt-1 truncate text-[11px] opacity-85">{cell.sublabel}</div>
        </button>
      ))}
    </div>
  );
}

export interface GraphNode {
  id: string;
  label: string;
  group: string;
  x: number;
  y: number;
  tone: 'GOLD' | 'BLUE' | 'GREEN' | 'AMBER' | 'RED' | 'GRAY';
  metric?: string;
}

export interface GraphEdge {
  from: string;
  to: string;
  label?: string;
}

export function TopologyGraph({
  nodes,
  edges,
  selectedId,
  onSelectNode,
  height = 290,
}: {
  nodes: GraphNode[];
  edges: GraphEdge[];
  selectedId?: string | null;
  onSelectNode?: (node: GraphNode) => void;
  height?: number;
}) {
  const toneStroke = {
    GOLD: '#D4AF37',
    BLUE: '#38BDF8',
    GREEN: '#22C55E',
    AMBER: '#F59E0B',
    RED: '#EF4444',
    GRAY: '#64748B',
  };
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 760 ${height}`} className="w-full min-w-[560px]">
        <defs>
          <marker id="lw-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#475569" />
          </marker>
        </defs>
        {edges.map((edge, idx) => {
          const a = nodeMap.get(edge.from);
          const b = nodeMap.get(edge.to);
          if (!a || !b) return null;
          return (
            <g key={`${edge.from}-${edge.to}-${idx}`}>
              <line
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke="#334155"
                strokeWidth="1.5"
                markerEnd="url(#lw-arrow)"
              />
              {edge.label && (
                <text
                  x={(a.x + b.x) / 2}
                  y={(a.y + b.y) / 2 - 4}
                  textAnchor="middle"
                  className="fill-slate-400 font-mono text-[9px]"
                >
                  {edge.label}
                </text>
              )}
            </g>
          );
        })}

        {nodes.map((node) => {
          const active = selectedId === node.id;
          const color = toneStroke[node.tone];
          return (
            <g
              key={node.id}
              transform={`translate(${node.x}, ${node.y})`}
              className="cursor-pointer"
              onClick={() => onSelectNode?.(node)}
            >
              <rect
                x="-70"
                y="-24"
                width="140"
                height="48"
                rx="6"
                fill={active ? '#1E2738' : '#111622'}
                stroke={active ? '#F8E7A1' : color}
                strokeWidth={active ? 2 : 1.3}
              />
              <text y="-6" textAnchor="middle" className="fill-slate-400 font-mono text-[9px]">
                {node.group}
              </text>
              <text y="9" textAnchor="middle" className="fill-white text-[11px] font-semibold">
                {node.label.length > 20 ? `${node.label.slice(0, 19)}…` : node.label}
              </text>
              {node.metric && (
                <text y="20" textAnchor="middle" className="font-mono text-[9px]" fill={color}>
                  {node.metric}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function TwelveStageBar({
  currentStage,
  stageEvidence,
  onSelectStage,
}: {
  currentStage: EngineeringStage;
  stageEvidence: Partial<Record<EngineeringStage, { verifiedAt: string; receiptId: string; summary: string }>>;
  onSelectStage?: (stage: EngineeringStage) => void;
}) {
  const currentIdx = TWELVE_ENGINEERING_STAGES.indexOf(currentStage);
  return (
    <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-1">
      {TWELVE_ENGINEERING_STAGES.map((stage, idx) => {
        const hasEvidence = Boolean(stageEvidence[stage]);
        const isCurrent = stage === currentStage;
        let cls = 'border-slate-700 bg-slate-900/60 text-slate-400';
        if (hasEvidence) {
          cls = 'border-emerald-500/50 bg-emerald-950/40 text-emerald-200';
        } else if (isCurrent) {
          cls = 'border-[#D4AF37] bg-[#D4AF37]/15 text-[#F8E7A1]';
        } else if (idx < currentIdx) {
          cls = 'border-amber-500/40 bg-amber-950/30 text-amber-200';
        }
        return (
          <button
            key={stage}
            type="button"
            onClick={() => onSelectStage?.(stage)}
            title={`${stage}${hasEvidence ? ' · Evidence Verified' : isCurrent ? ' · Current Stage' : ''}`}
            className={`rounded border px-1.5 py-1.5 text-center font-mono text-[9px] font-medium truncate hover:border-[#38BDF8] ${cls}`}
          >
            {stage.slice(0, 5)}
          </button>
        );
      })}
    </div>
  );
}

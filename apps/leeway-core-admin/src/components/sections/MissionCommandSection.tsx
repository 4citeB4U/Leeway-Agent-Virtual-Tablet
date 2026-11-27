/*
LEEWAY HEADER — DO NOT REMOVE

REGION: LEEWAY.CORE.SECTION.MISSION_COMMAND
TAG: LEEWAY.CORE.MISSION.COMMAND.12STAGE.V1

5WH:
WHAT = Section 07 Mission Command workspace enforcing the 12-stage engineering cycle, evidence-driven completion, dependency graph, and governed stage proposals.
WHY = Satisfy Section 15 mission governance: progress comes strictly from verified stage evidence and corrections never reset existing missions.
WHO = Creator/Human Authority via Leeway Innovations.
WHERE = src/components/sections/MissionCommandSection.tsx
WHEN = 2026-11-27
HOW = Interactive 12-stage mission cards, TopologyGraph dependency map, BarChart workload, and governed stage proposal dialog.

LICENSE = Apache-2.0
*/
import React, { useState } from 'react';
import { ArrowRight, X } from 'lucide-react';
import {
  TWELVE_ENGINEERING_STAGES,
  type CoreState,
  type EngineeringStage,
  type FormulaHealthResponse,
  type MissionRecord,
} from '../../types/leeway';
import { BarChart, TopologyGraph, TwelveStageBar } from '../charts/VisualCharts';
import { FormulaIntelligencePanel } from '../formula/FormulaIntelligencePanel';

export function MissionCommandSection({
  state,
  formulaHealth,
  onRunFormula,
  runningDomain,
  onProposeStageAdvance,
}: {
  state: CoreState;
  formulaHealth: FormulaHealthResponse | null;
  onRunFormula: (domainId: string) => Promise<void>;
  runningDomain: string | null;
  onProposeStageAdvance: (mission: MissionRecord, nextStage: EngineeringStage, authorizeNow: boolean) => Promise<void>;
}) {
  const [selectedMissionId, setSelectedMissionId] = useState<string>(state.missions[0]?.id || '');
  const [pendingStageChange, setPendingStageChange] = useState<{
    mission: MissionRecord;
    stage: EngineeringStage;
  } | null>(null);

  const selectedMission = state.missions.find((m) => m.id === selectedMissionId) || state.missions[0];

  const missionNodes = state.missions.map((m, idx) => ({
    id: m.id,
    label: m.title,
    group: m.stage,
    x: 190 + (idx % 2) * 380,
    y: idx < 2 ? 70 : 195,
    tone: (m.blockedReason
      ? 'RED'
      : m.authorizationStatus === 'PENDING_CREATOR'
        ? 'AMBER'
        : 'GREEN') as 'RED' | 'AMBER' | 'GREEN',
    metric: `${Object.keys(m.stageEvidence).length}/12 Evidence`,
  }));

  const missionEdges = state.missions.flatMap((m) =>
    m.dependencies.map((dep) => ({ from: dep, to: m.id, label: 'blocks/feeds' }))
  );

  return (
    <div className="space-y-4">
      {/* Visual Dependency Graph & Evidence Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <section className="lg:col-span-2 rounded-lg border border-[#252D3D] bg-[#121721] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm font-semibold text-white">
              Mission Dependency & Stage Topology
            </h3>
            <span className="font-mono text-xs text-slate-400">
              Progress derived strictly from verified stageEvidence
            </span>
          </div>
          <TopologyGraph
            nodes={missionNodes}
            edges={missionEdges}
            selectedId={selectedMission?.id}
            onSelectNode={(n) => setSelectedMissionId(n.id)}
            height={250}
          />
        </section>

        <section className="rounded-lg border border-[#252D3D] bg-[#121721] p-4 space-y-3">
          <h3 className="font-display text-sm font-semibold text-white">
            Evidence-Verified Stage Completion (%)
          </h3>
          <BarChart
            data={state.missions.map((m) => {
              const verifiedCount = Object.keys(m.stageEvidence).length;
              const pct = Math.round((verifiedCount / 12) * 100);
              return {
                id: m.id,
                label: m.title.split(' ')[0],
                value: pct,
                color: m.blockedReason ? '#EF4444' : '#38BDF8',
              };
            })}
            unit="%"
            height={195}
            primaryLabel="Verified Evidence %"
            onSelect={(b) => setSelectedMissionId(b.id)}
          />
        </section>
      </div>

      {/* Mission Cards with 12-Stage Cycle Bar */}
      <div className="space-y-3">
        {state.missions.map((m) => {
          const verifiedCount = Object.keys(m.stageEvidence).length;
          const currentIdx = TWELVE_ENGINEERING_STAGES.indexOf(m.stage);
          const nextStage =
            currentIdx >= 0 && currentIdx < TWELVE_ENGINEERING_STAGES.length - 1
              ? TWELVE_ENGINEERING_STAGES[currentIdx + 1]
              : null;

          return (
            <article
              key={m.id}
              onClick={() => setSelectedMissionId(m.id)}
              className={`rounded-lg border p-4 space-y-3 bg-[#121721] ${
                selectedMission?.id === m.id ? 'border-[#D4AF37]/70' : 'border-[#252D3D]'
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="font-mono text-[11px] text-[#38BDF8]">
                    {m.id} · {m.department} · Owner: {m.ownerWorkerId}
                  </div>
                  <h3 className="font-display text-base font-semibold text-white">{m.title}</h3>
                  {m.blockedReason && (
                    <div className="mt-1 text-xs text-rose-400 font-mono">
                      BLOCKED: {m.blockedReason}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-slate-300 tabular-nums">
                    Stage: <span className="text-[#F8E7A1]">{m.stage}</span> ({verifiedCount}/12 evidence)
                  </span>
                  {nextStage && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPendingStageChange({ mission: m, stage: nextStage });
                      }}
                      className="inline-flex items-center gap-1 rounded border border-[#D4AF37]/60 bg-[#D4AF37]/15 px-2.5 py-1 text-xs font-medium text-[#F8E7A1] hover:bg-[#D4AF37]/25"
                    >
                      <span>Propose → {nextStage}</span>
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>

              <TwelveStageBar
                currentStage={m.stage}
                stageEvidence={m.stageEvidence}
                onSelectStage={(stage) => setPendingStageChange({ mission: m, stage })}
              />

              {m.correctionNotes.length > 0 && (
                <div className="text-xs text-amber-300">
                  Creator Amendments Preserved: {m.correctionNotes.join(' · ')}
                </div>
              )}
            </article>
          );
        })}
      </div>

      <section className="rounded-lg border border-[#252D3D] bg-[#121721] p-4">
        <FormulaIntelligencePanel
          domainId="mission-evaluation"
          formulaHealth={formulaHealth}
          evaluations={state.formulaEvaluations}
          onRunEvaluation={onRunFormula}
          runningDomain={runningDomain}
        />
      </section>

      {/* Governed Stage Transition Modal */}
      {pendingStageChange && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-xl border border-[#D4AF37]/60 bg-[#121721] p-5 space-y-4">
            <header className="flex items-center justify-between">
              <h3 className="font-display text-base font-semibold text-white">
                Governed Mission Stage Proposal
              </h3>
              <button type="button" onClick={() => setPendingStageChange(null)} className="text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </header>
            <p className="text-xs text-slate-300 leading-relaxed">
              Propose transitioning <span className="font-semibold text-white">{pendingStageChange.mission.title}</span>{' '}
              from <span className="font-mono">{pendingStageChange.mission.stage}</span> to{' '}
              <span className="font-mono text-[#F8E7A1]">{pendingStageChange.stage}</span>. Prior verified stage evidence is preserved automatically.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPendingStageChange(null)}
                className="rounded border border-[#2D3648] bg-[#171D2A] px-3 py-1.5 text-xs text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  await onProposeStageAdvance(pendingStageChange.mission, pendingStageChange.stage, false);
                  setPendingStageChange(null);
                }}
                className="rounded border border-[#38BDF8]/60 bg-[#38BDF8]/15 px-3 py-1.5 text-xs text-[#38BDF8]"
              >
                Create Proposal
              </button>
              <button
                type="button"
                onClick={async () => {
                  await onProposeStageAdvance(pendingStageChange.mission, pendingStageChange.stage, true);
                  setPendingStageChange(null);
                }}
                className="rounded border border-[#D4AF37] bg-[#D4AF37]/20 px-3 py-1.5 text-xs font-semibold text-[#F8E7A1]"
              >
                Authorize Transition
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

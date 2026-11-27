/*
LEEWAY HEADER — DO NOT REMOVE

REGION: LEEWAY.UI.SOURCE
TAG: LEEWAY.UI.UPLOAD.PIPELINE

5WH:
WHAT = Left sidebar workspace for uploading custom raster/SVG icons, selecting labeled development fixtures, and tuning segmentation thresholds.
WHY = Allow users to ingest artwork and deterministically control pixel-clustering granularity.
WHO = Leeway Innovations — KineticGlyph Studio UI
WHERE = src/components/SourcePanel.tsx
WHEN = 2026-11-27
HOW = Handles file input/drag-drop via FileReader and passes SegmentationOptions back to the segmentation engine.

LICENSE = Apache-2.0
*/

import React, { useRef, useState } from 'react';
import { Upload, Sliders, RefreshCw, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { SegmentationOptions } from '../types/studio';
import { STARTER_FIXTURES, StarterFixture } from '../engine/starterFixtures';

interface SourcePanelProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  activeSourceName: string;
  activeSourceKind: string;
  normalizedPreviewUrl: string | null;
  options: SegmentationOptions;
  isProcessing: boolean;
  layerCount: number;
  processingMs: number;
  onUploadFile: (file: File) => void;
  onSelectFixture: (fixture: StarterFixture) => void;
  onChangeOptions: (next: SegmentationOptions) => void;
  onReSegment: () => void;
}

export const SourcePanel: React.FC<SourcePanelProps> = ({
  collapsed,
  onToggleCollapse,
  activeSourceName,
  activeSourceKind,
  normalizedPreviewUrl,
  options,
  isProcessing,
  layerCount,
  processingMs,
  onUploadFile,
  onSelectFixture,
  onChangeOptions,
  onReSegment,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file.type.startsWith('image/')) return;
    onUploadFile(file);
  };

  if (collapsed) {
    return (
      <aside className="w-full lg:w-11 border-b lg:border-b-0 lg:border-r border-slate-800 bg-[#0F1520] flex lg:flex-col items-center justify-between lg:justify-start px-3 py-2 lg:py-3 gap-3 shrink-0">
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label="Expand Source Panel"
          title="Expand Source Panel"
          className="p-1.5 rounded-lg border border-slate-700 bg-[#151C28] hover:border-sky-400 text-slate-300 hover:text-slate-100 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
        >
          <PanelLeftOpen className="w-4 h-4" />
        </button>
        <span className="text-[11px] font-medium text-slate-400 lg:hidden truncate">
          Source: {activeSourceName}
        </span>
        <span className="hidden lg:block text-[11px] font-mono text-slate-500 [writing-mode:vertical-rl] rotate-180 tracking-wider select-none">
          Source
        </span>
      </aside>
    );
  }

  return (
    <aside className="w-full lg:w-[288px] border-b lg:border-b-0 lg:border-r border-slate-800 bg-[#0F1520] flex flex-col shrink-0 overflow-y-auto">
      {/* Upload Dropzone */}
      <div className="p-4 border-b border-slate-800/90">
        <div className="flex items-center justify-between mb-3 gap-2">
          <h2 className="text-xs font-semibold text-slate-300 tracking-wide">
            Source Artwork
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-slate-400">
              PNG · JPG · SVG
            </span>
            <button
              type="button"
              onClick={onToggleCollapse}
              aria-label="Collapse Source Panel"
              title="Collapse Source Panel"
              className="p-1 rounded border border-slate-800 hover:border-slate-600 text-slate-400 hover:text-slate-100 transition-colors cursor-pointer"
            >
              <PanelLeftClose className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragActive(false);
            handleFiles(e.dataTransfer.files);
          }}
          className={`w-full rounded-xl border border-dashed p-4 text-left transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${
            dragActive
              ? 'border-sky-400 bg-sky-500/10'
              : 'border-slate-700 hover:border-slate-500 bg-[#151C28]'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
              {normalizedPreviewUrl ? (
                <img
                  src={normalizedPreviewUrl}
                  alt={activeSourceName}
                  className="w-8 h-8 object-contain"
                />
              ) : (
                <Upload className="w-4 h-4 text-sky-400" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-100 truncate">
                Upload Icon or Image
              </p>
              <p className="text-[11px] text-slate-400 truncate mt-0.5">
                {activeSourceName}
              </p>
            </div>
          </div>
        </button>

        <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400">
          <span className="truncate">{activeSourceKind}</span>
          <span className="font-mono tabular-nums shrink-0">
            {layerCount} layers · {processingMs}ms
          </span>
        </div>
      </div>

      {/* Starter Fixtures */}
      <div className="p-4 border-b border-slate-800/90">
        <div className="flex items-center justify-between mb-2.5">
          <h2 className="text-xs font-semibold text-slate-300">
            Reference Fixtures
          </h2>
          <span className="text-[11px] text-slate-500">Test Icons</span>
        </div>
        <div className="space-y-1.5">
          {STARTER_FIXTURES.map((fixture) => {
            const selected = activeSourceName === fixture.name;
            return (
              <button
                key={fixture.id}
                type="button"
                onClick={() => onSelectFixture(fixture)}
                className={`w-full flex items-center gap-2.5 p-2 rounded-lg border text-left transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${
                  selected
                    ? 'border-sky-500/60 bg-sky-500/10'
                    : 'border-slate-800 bg-[#151C28]/70 hover:border-slate-700'
                }`}
              >
                <img
                  src={fixture.dataUrl}
                  alt={fixture.name}
                  className="w-8 h-8 rounded bg-slate-900/90 p-0.5 object-contain shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium text-slate-100 truncate">
                    {fixture.name}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">
                    {fixture.subtitle}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Segmentation Tuning */}
      <div className="p-4 flex-1">
        <div className="flex items-center gap-2 mb-3">
          <Sliders className="w-3.5 h-3.5 text-slate-400" />
          <h2 className="text-xs font-semibold text-slate-300">
            Segmentation Controls
          </h2>
        </div>

        <div className="space-y-3.5">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <label htmlFor="seg-color-tol" className="text-slate-400">
                Color Tolerance
              </label>
              <span className="font-mono text-slate-200 tabular-nums">
                {options.colorTolerance}
              </span>
            </div>
            <input
              id="seg-color-tol"
              type="range"
              min={12}
              max={72}
              value={options.colorTolerance}
              onChange={(e) =>
                onChangeOptions({ ...options, colorTolerance: Number(e.target.value) })
              }
              className="w-full accent-sky-400 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <label htmlFor="seg-min-area" className="text-slate-400">
                Min Region Area
              </label>
              <span className="font-mono text-slate-200 tabular-nums">
                {options.minRegionArea} px
              </span>
            </div>
            <input
              id="seg-min-area"
              type="range"
              min={40}
              max={600}
              step={10}
              value={options.minRegionArea}
              onChange={(e) =>
                onChangeOptions({ ...options, minRegionArea: Number(e.target.value) })
              }
              className="w-full accent-sky-400 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <label htmlFor="seg-bg-tol" className="text-slate-400">
                Backdrop Tolerance
              </label>
              <span className="font-mono text-slate-200 tabular-nums">
                {options.backdropTolerance}
              </span>
            </div>
            <input
              id="seg-bg-tol"
              type="range"
              min={8}
              max={64}
              value={options.backdropTolerance}
              onChange={(e) =>
                onChangeOptions({ ...options, backdropTolerance: Number(e.target.value) })
              }
              className="w-full accent-sky-400 cursor-pointer"
            />
          </div>

          <div>
            <label htmlFor="seg-bg-mode" className="block text-xs text-slate-400 mb-1">
              Backdrop Isolation
            </label>
            <select
              id="seg-bg-mode"
              value={options.backdropMode}
              onChange={(e) =>
                onChangeOptions({
                  ...options,
                  backdropMode: e.target.value as SegmentationOptions['backdropMode'],
                })
              }
              className="w-full rounded-lg bg-[#151C28] border border-slate-700 px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-400"
            >
              <option value="auto">Auto (Alpha or Flood Border)</option>
              <option value="alpha-only">Alpha Channel Only</option>
              <option value="flood-border">Solid Border Flood-Fill</option>
            </select>
          </div>

          <button
            type="button"
            disabled={isProcessing}
            onClick={onReSegment}
            className="w-full mt-1 py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-100 flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
            {isProcessing ? 'Segmenting...' : 'Re-Segment Image'}
          </button>
        </div>
      </div>
    </aside>
  );
};

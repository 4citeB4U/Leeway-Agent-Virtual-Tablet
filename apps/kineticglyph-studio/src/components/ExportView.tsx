/*
LEEWAY HEADER — DO NOT REMOVE

REGION: LEEWAY.UI.EXPORT
TAG: LEEWAY.UI.CODE.GENERATOR

5WH:
WHAT = Interactive export workspace compiling segmented layers for Button, Logo, and Favicon/Web Icon modes into HTML/CSS/JS, Lottie v5.9.0 JSON, Animated SVG, and complete Favicon & Manifest asset kits.
WHY = Deliver clean, portable code and multi-size static/dynamic web icon files with live sandbox verification and honest browser compatibility notes.
WHO = Leeway Innovations — KineticGlyph Studio UI
WHERE = src/components/ExportView.tsx
WHEN = 2026-11-27
HOW = Calls pure deterministic exporters and faviconCompiler to build copyable code, downloadable PNG/ICO/Manifest assets, and isolated iframe sandbox previews.

LICENSE = Apache-2.0
*/

import React, { useEffect, useMemo, useState } from 'react';
import { Copy, Check, Download } from 'lucide-react';
import {
  ButtonConfig,
  ExportFormat,
  FaviconRenderedAsset,
  SegmentedLayer,
} from '../types/studio';
import {
  generateAnimatedSvgExport,
  generateFaviconKitExport,
  generateHtmlButtonExport,
  generateLottieJsonExport,
} from '../engine/exporters';
import {
  buildMultiResolutionIcoBytes,
  generateWebManifestJson,
  renderFaviconMatrixAssets,
} from '../engine/faviconCompiler';

interface ExportViewProps {
  layers: SegmentedLayer[];
  config: ButtonConfig;
  onRecordExport: (format: ExportFormat, byteLength: number) => void;
}

export const ExportView: React.FC<ExportViewProps> = ({
  layers,
  config,
  onRecordExport,
}) => {
  const [format, setFormat] = useState<ExportFormat>(
    config.targetMode === 'favicon' ? 'favicon-kit' : 'html'
  );
  const [copied, setCopied] = useState(false);
  const [faviconAssets, setFaviconAssets] = useState<FaviconRenderedAsset[]>([]);

  useEffect(() => {
    if (config.targetMode === 'favicon') {
      setFormat('favicon-kit');
    }
  }, [config.targetMode]);

  useEffect(() => {
    let active = true;
    void renderFaviconMatrixAssets(layers, config).then((assets) => {
      if (active) setFaviconAssets(assets);
    });
    return () => {
      active = false;
    };
  }, [layers, config]);

  const outputs = useMemo(() => {
    const html = generateHtmlButtonExport(layers, config);
    const lottie = generateLottieJsonExport(layers, config);
    const svg = generateAnimatedSvgExport(layers, config);
    const faviconKit = generateFaviconKitExport(layers, config);
    return {
      html,
      lottie,
      svg,
      'favicon-kit': faviconKit,
    };
  }, [layers, config]);

  const activeCode = outputs[format];
  const fileExtension =
    format === 'html' || format === 'favicon-kit'
      ? 'html'
      : format === 'lottie'
      ? 'lottie.json'
      : 'svg';
  const mimeType =
    format === 'html' || format === 'favicon-kit'
      ? 'text/html;charset=utf-8'
      : format === 'lottie'
      ? 'application/json;charset=utf-8'
      : 'image/svg+xml;charset=utf-8';

  const triggerDownload = (filename: string, content: BlobPart, type: string, byteLength: number) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    onRecordExport(format, byteLength);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(activeCode);
      setCopied(true);
      onRecordExport(format, activeCode.length);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const handleDownloadPrimary = () => {
    const slug = (config.label || 'kinetic-asset')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    triggerDownload(`${slug || 'kinetic-asset'}.${fileExtension}`, activeCode, mimeType, activeCode.length);
  };

  const handleDownloadIco = () => {
    const frames = faviconAssets
      .filter((a) => a.size <= 48)
      .map((a) => ({ size: a.size, pngDataUrl: a.dataUrl }));
    const icoBytes = buildMultiResolutionIcoBytes(frames);
    triggerDownload('favicon.ico', icoBytes.buffer as ArrayBuffer, 'image/x-icon', icoBytes.byteLength);
  };

  const handleDownloadManifest = () => {
    const manifestJson = generateWebManifestJson(config.label);
    triggerDownload('site.webmanifest', manifestJson, 'application/manifest+json;charset=utf-8', manifestJson.length);
  };

  const handleDownloadPng = (asset: FaviconRenderedAsset) => {
    const byteString = atob(asset.dataUrl.split(',')[1] ?? '');
    const bytes = new Uint8Array(byteString.length);
    for (let i = 0; i < byteString.length; i++) {
      bytes[i] = byteString.charCodeAt(i);
    }
    const name =
      asset.size === 180
        ? 'apple-touch-icon.png'
        : asset.size >= 192
        ? `icon-${asset.size}.png`
        : `favicon-${asset.size}x${asset.size}.png`;
    triggerDownload(name, bytes.buffer as ArrayBuffer, 'image/png', bytes.byteLength);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#0B0F17] p-6">
      <div className="max-w-6xl mx-auto space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h1 className="font-display text-xl font-semibold text-slate-100">
              Export {config.targetMode === 'logo' ? 'Animated Logo Mark' : config.targetMode === 'favicon' ? 'Favicon & Web Icon Kit' : 'Living Interactive Button'}
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Target mode: <span className="text-slate-200 font-medium capitalize">{config.targetMode}</span> · {layers.filter((l) => l.visible).length} visible layers compiled with zero external scripts.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCopy}
              className="px-3.5 py-2 rounded-lg border border-slate-700 bg-[#151C28] hover:border-slate-500 text-xs font-medium text-slate-100 flex items-center gap-2 cursor-pointer whitespace-nowrap"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy Code'}
            </button>

            <button
              type="button"
              onClick={handleDownloadPrimary}
              className="px-4 py-2 rounded-lg bg-sky-400 hover:bg-sky-300 text-xs font-semibold text-slate-950 flex items-center gap-2 cursor-pointer whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              Download .{fileExtension}
            </button>
          </div>
        </div>

        {/* Format Tabs */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center p-1 rounded-lg bg-[#151C28] border border-slate-800">
            {(
              [
                { id: 'html', label: 'HTML / CSS / JS' },
                { id: 'lottie', label: 'Lottie JSON (v5.9.0)' },
                { id: 'svg', label: 'Animated SVG' },
                { id: 'favicon-kit', label: 'Favicon & Manifest Kit' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFormat(tab.id)}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                  format === tab.id
                    ? 'bg-slate-700 text-slate-100'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <span className="text-xs font-mono text-slate-400 tabular-nums">
            Payload size: {(activeCode.length / 1024).toFixed(1)} KB
          </span>
        </div>

        {/* Multi-Size Static Fallback Asset Bar for Favicon Kit */}
        {format === 'favicon-kit' && (
          <div className="border border-slate-800 rounded-xl bg-[#0F1520] p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xs font-semibold text-slate-200">
                  Static Fallback Assets (PNG · Multi-Res ICO · Web Manifest)
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Download simplified high-contrast raster files alongside the dynamic tab controller snippet. Safari &amp; mobile browsers require these static links.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadIco}
                  disabled={faviconAssets.length === 0}
                  className="px-3 py-1.5 rounded-lg border border-slate-700 bg-[#151C28] hover:border-sky-400 text-xs font-medium text-slate-100 cursor-pointer disabled:opacity-40"
                >
                  Download favicon.ico (16/32/48)
                </button>
                <button
                  type="button"
                  onClick={handleDownloadManifest}
                  className="px-3 py-1.5 rounded-lg border border-slate-700 bg-[#151C28] hover:border-sky-400 text-xs font-medium text-slate-100 cursor-pointer"
                >
                  Download site.webmanifest
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
              {faviconAssets.map((asset) => (
                <button
                  key={asset.size}
                  type="button"
                  onClick={() => handleDownloadPng(asset)}
                  className="p-2.5 rounded-lg border border-slate-800 bg-[#151C28] hover:border-sky-400 flex flex-col items-center gap-2 cursor-pointer transition-colors"
                >
                  <img
                    src={asset.dataUrl}
                    alt={`${asset.size}x${asset.size} icon`}
                    className="w-8 h-8 object-contain"
                  />
                  <span className="text-[11px] font-mono text-slate-200 tabular-nums">
                    {asset.size}×{asset.size} PNG
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Code + Sandbox Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-8 border border-slate-800 rounded-xl bg-[#0F1520] overflow-hidden flex flex-col">
            <div className="px-4 py-2.5 border-b border-slate-800 bg-[#151C28] flex items-center justify-between text-xs text-slate-400">
              <span className="font-mono">
                {format === 'favicon-kit' ? 'favicon-controller-kit' : `${config.targetMode}-artifact`}.{fileExtension}
              </span>
              <span>Zero external dependencies</span>
            </div>
            <pre className="p-4 text-[11px] leading-relaxed font-mono text-slate-300 overflow-auto max-h-[540px] whitespace-pre-wrap break-all">
              {activeCode}
            </pre>
          </div>

          <div className="lg:col-span-4 border border-slate-800 rounded-xl bg-[#0F1520] overflow-hidden flex flex-col">
            <div className="px-4 py-2.5 border-b border-slate-800 bg-[#151C28] text-xs font-medium text-slate-300">
              Standalone Sandbox Verification
            </div>
            <div className="flex-1 min-h-[320px] bg-[#0B0F17] flex items-center justify-center p-4">
              {format === 'html' || format === 'favicon-kit' ? (
                <iframe
                  title="Exported HTML Artifact Sandbox"
                  srcDoc={format === 'favicon-kit' ? generateHtmlButtonExport(layers, { ...config, targetMode: 'favicon' }) : outputs.html}
                  sandbox="allow-scripts"
                  className="w-full h-[300px] border-0 rounded-lg bg-[#0B0F17]"
                />
              ) : format === 'svg' ? (
                <div
                  className="flex items-center justify-center"
                  dangerouslySetInnerHTML={{ __html: outputs.svg }}
                />
              ) : (
                <div className="text-center space-y-2 p-4">
                  <p className="text-xs font-medium text-slate-200">
                    Bodymovin / Lottie JSON Ready
                  </p>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Contains {layers.filter((l) => l.visible).length} embedded image assets and keyframed transform/opacity tracks at 60 fps (180 frames). Compatible with lottie-web, LottieFiles, iOS, and Android.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

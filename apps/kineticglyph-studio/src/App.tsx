/*
LEEWAY HEADER — DO NOT REMOVE

REGION: LEEWAY.APP.ROOT
TAG: LEEWAY.APP.STUDIO.ORCHESTRATOR

5WH:
WHAT = Main KineticGlyph Studio application root coordinating image ingestion, deterministic segmentation, living button preview, export compilation, and LeeWay governance receipts.
WHY = Provide a unified, responsive workbench converting static icons into living interactive buttons.
WHO = Leeway Innovations — KineticGlyph Studio
WHERE = src/App.tsx
WHEN = 2026-11-27
HOW = React functional root component managing studio state, running Canvas 2D segmentation, checking Formula Fabric authority, and logging Web Crypto SHA-256 execution receipts.

LICENSE = Apache-2.0
*/

import { useCallback, useEffect, useState } from 'react';
import {
  ButtonConfig,
  ExecutionReceipt,
  ExportFormat,
  FormulaBridgeStatus,
  SegmentationOptions,
  SegmentedLayer,
  WorkspaceTab,
} from './types/studio';
import { STARTER_FIXTURES, StarterFixture } from './engine/starterFixtures';
import {
  DEFAULT_SEGMENTATION_OPTIONS,
  mergeTwoLayers,
  segmentImageFromUrl,
} from './engine/segmenter';
import {
  FORMULA_CLIENT_CONTRACT,
  inspectFormulaFabricAuthority,
} from './leeway/formulaAdapter';
import { createExecutionReceipt } from './leeway/receiptLedger';
import { TopBar } from './components/TopBar';
import { SourcePanel } from './components/SourcePanel';
import { ButtonStage } from './components/ButtonStage';
import { LayerPanel } from './components/LayerPanel';
import { LayerInspectorView } from './components/LayerInspectorView';
import { ExportView } from './components/ExportView';
import { GovernanceView } from './components/GovernanceView';

const INITIAL_BUTTON_CONFIG: ButtonConfig = {
  targetMode: 'button',
  label: 'Reactor Telemetry',
  ariaLabel: 'Activate Reactor Telemetry',
  shape: 'squircle',
  sizePx: 148,
  hoverSpeedMultiplier: 2.4,
  hoverGlowIntensity: 1.2,
  pressDepthPx: 3,
  showCaption: true,
  surfaceTint: '#111927',
  accentColor: '#38BDF8',
  reducedMotion: false,
  toggleable: false,
  logoReveal: 'fade-scale',
  logoLoading: false,
  faviconContrastBoost: 1.25,
  faviconSimplifyMinArea: 240,
};

export default function App() {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('studio');
  const [sourceUrl, setSourceUrl] = useState<string>(STARTER_FIXTURES[0].dataUrl);
  const [sourceName, setSourceName] = useState<string>(STARTER_FIXTURES[0].name);
  const [sourceKind, setSourceKind] = useState<string>(STARTER_FIXTURES[0].kind);
  const [normalizedUrl, setNormalizedUrl] = useState<string | null>(null);

  const [segOptions, setSegOptions] = useState<SegmentationOptions>(
    DEFAULT_SEGMENTATION_OPTIONS
  );
  const [layers, setLayers] = useState<SegmentedLayer[]>([]);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingMs, setProcessingMs] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [buttonConfig, setButtonConfig] = useState<ButtonConfig>(INITIAL_BUTTON_CONFIG);
  const [leftCollapsed, setLeftCollapsed] = useState<boolean>(false);
  const [rightCollapsed, setRightCollapsed] = useState<boolean>(false);
  const [receipts, setReceipts] = useState<ExecutionReceipt[]>([]);
  const [isCheckingFormula, setIsCheckingFormula] = useState<boolean>(false);
  const [formulaStatus, setFormulaStatus] = useState<FormulaBridgeStatus>({
    contractId: FORMULA_CLIENT_CONTRACT.contractId,
    schemaVersion: FORMULA_CLIENT_CONTRACT.schemaVersion,
    endpointConfigured: false,
    endpointUrl: null,
    authorityState: 'BLOCKED_NO_VERIFIED_FORMULA_CAPABILITY',
    lastCheckedAt: null,
    message: 'Pending initial Formula Fabric authority check.',
  });

  const appendReceipt = useCallback(
    async (
      action: ExecutionReceipt['action'],
      summary: string,
      details: Record<string, string | number | boolean>
    ) => {
      const receipt = await createExecutionReceipt(action, summary, details);
      setReceipts((prev) => [receipt, ...prev].slice(0, 50));
    },
    []
  );

  const runSegmentation = useCallback(
    async (url: string, name: string, opts: SegmentationOptions) => {
      setIsProcessing(true);
      setErrorMessage(null);
      try {
        const result = await segmentImageFromUrl(url, opts);
        setNormalizedUrl(result.normalizedUrl);
        setLayers(result.layers);
        setSelectedLayerId(result.layers[0]?.id ?? null);
        setProcessingMs(result.processingMs);
        await appendReceipt(
          'SEGMENTATION_RUN',
          `Segmented "${name}" into ${result.layers.length} independent layers`,
          {
            sourceName: name,
            layerCount: result.layers.length,
            processingMs: result.processingMs,
            colorTolerance: opts.colorTolerance,
            minRegionArea: opts.minRegionArea,
          }
        );
      } catch (err) {
        setErrorMessage(
          err instanceof Error ? err.message : 'Unable to segment image.'
        );
      } finally {
        setIsProcessing(false);
      }
    },
    [appendReceipt]
  );

  const checkFormula = useCallback(async () => {
    setIsCheckingFormula(true);
    const status = await inspectFormulaFabricAuthority();
    setFormulaStatus(status);
    await appendReceipt(
      'FORMULA_CHECK',
      `Formula Fabric check: ${status.authorityState}`,
      {
        authorityState: status.authorityState,
        endpointConfigured: status.endpointConfigured,
      }
    );
    setIsCheckingFormula(false);
  }, [appendReceipt]);

  useEffect(() => {
    void runSegmentation(STARTER_FIXTURES[0].dataUrl, STARTER_FIXTURES[0].name, DEFAULT_SEGMENTATION_OPTIONS);
    void checkFormula();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUploadFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const cleanLabel = file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ');
        setSourceUrl(reader.result);
        setSourceName(file.name);
        setSourceKind('User Uploaded Asset');
        setButtonConfig((prev) => ({
          ...prev,
          label: cleanLabel || 'Custom Control',
          ariaLabel: cleanLabel || 'Custom interactive button',
        }));
        void appendReceipt('IMAGE_LOADED', `Loaded user upload "${file.name}"`, {
          fileName: file.name,
          fileBytes: file.size,
        });
        void runSegmentation(reader.result, file.name, segOptions);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSelectFixture = (fixture: StarterFixture) => {
    setSourceUrl(fixture.dataUrl);
    setSourceName(fixture.name);
    setSourceKind(fixture.kind);
    setButtonConfig((prev) => ({
      ...prev,
      label: fixture.name,
      ariaLabel: `Activate ${fixture.name}`,
    }));
    void runSegmentation(fixture.dataUrl, fixture.name, segOptions);
  };

  const handleUpdateLayer = (id: string, patch: Partial<SegmentedLayer>) => {
    setLayers((prev) =>
      prev.map((layer) => (layer.id === id ? { ...layer, ...patch } : layer))
    );
  };

  const handleMergeWithNext = async (id: string) => {
    const idx = layers.findIndex((l) => l.id === id);
    if (idx < 0 || idx >= layers.length - 1) return;
    const nextLayer = layers[idx + 1];
    const updated = await mergeTwoLayers(layers, id, nextLayer.id);
    setLayers(updated);
    await appendReceipt(
      'LAYER_UPDATED',
      `Merged "${nextLayer.name}" into "${layers[idx].name}"`,
      { remainingLayers: updated.length }
    );
  };

  const handleRecordExport = (format: ExportFormat, byteLength: number) => {
    void appendReceipt(
      'EXPORT_GENERATED',
      `Generated ${format.toUpperCase()} button package (${byteLength} bytes)`,
      { format, byteLength, layerCount: layers.filter((l) => l.visible).length }
    );
  };

  return (
    <div className="h-screen flex flex-col bg-[#0B0F17] text-slate-100 overflow-hidden">
      <TopBar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onQuickExport={() => setActiveTab('export')}
      />

      {errorMessage && (
        <div className="bg-rose-950/80 border-b border-rose-800 px-5 py-2 text-xs text-rose-200 flex items-center justify-between">
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-rose-300 hover:text-white underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Mobile Tab Switcher */}
      <div className="md:hidden border-b border-slate-800 bg-[#0F1520] px-4 py-2 flex items-center gap-2 overflow-x-auto">
        {(['studio', 'inspector', 'export', 'governance'] as WorkspaceTab[]).map(
          (tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1 rounded-md text-xs font-medium capitalize whitespace-nowrap ${
                activeTab === tab
                  ? 'bg-sky-500/20 text-sky-300'
                  : 'text-slate-400'
              }`}
            >
              {tab}
            </button>
          )
        )}
      </div>

      <main className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
        {activeTab === 'studio' && (
          <>
            <SourcePanel
              collapsed={leftCollapsed}
              onToggleCollapse={() => setLeftCollapsed((v) => !v)}
              activeSourceName={sourceName}
              activeSourceKind={sourceKind}
              normalizedPreviewUrl={normalizedUrl}
              options={segOptions}
              isProcessing={isProcessing}
              layerCount={layers.length}
              processingMs={processingMs}
              onUploadFile={handleUploadFile}
              onSelectFixture={handleSelectFixture}
              onChangeOptions={setSegOptions}
              onReSegment={() => void runSegmentation(sourceUrl, sourceName, segOptions)}
            />
            <ButtonStage
              layers={layers}
              selectedLayerId={selectedLayerId}
              config={buttonConfig}
              onSelectLayer={setSelectedLayerId}
              onChangeConfig={setButtonConfig}
            />
            <LayerPanel
              collapsed={rightCollapsed}
              onToggleCollapse={() => setRightCollapsed((v) => !v)}
              layers={layers}
              selectedLayerId={selectedLayerId}
              onSelectLayer={setSelectedLayerId}
              onUpdateLayer={handleUpdateLayer}
              onMergeWithNext={(id) => void handleMergeWithNext(id)}
            />
          </>
        )}

        {activeTab === 'inspector' && (
          <LayerInspectorView
            layers={layers}
            selectedLayerId={selectedLayerId}
            normalizedPreviewUrl={normalizedUrl}
            onSelectLayer={setSelectedLayerId}
            onUpdateLayer={handleUpdateLayer}
            onSelectForEdit={(id) => {
              setSelectedLayerId(id);
              setActiveTab('studio');
            }}
          />
        )}

        {activeTab === 'export' && (
          <ExportView
            layers={layers}
            config={buttonConfig}
            onRecordExport={handleRecordExport}
          />
        )}

        {activeTab === 'governance' && (
          <GovernanceView
            formulaStatus={formulaStatus}
            receipts={receipts}
            isCheckingFormula={isCheckingFormula}
            onRefreshFormula={() => void checkFormula()}
          />
        )}
      </main>

      <footer className="h-8 border-t border-slate-800/90 bg-[#0B0F17] px-5 flex items-center justify-between text-[11px] text-slate-500 shrink-0">
        <span>Powered by Leeway Innovations — A Leeway Industries Product</span>
        <span className="hidden sm:inline font-mono">
          KineticGlyph Studio · Local Deterministic Engine
        </span>
      </footer>
    </div>
  );
}

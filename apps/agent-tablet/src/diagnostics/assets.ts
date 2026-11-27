/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.AGENT.TABLET.DIAGNOSTICS.ASSETS
TAG: LEEWAY.TABLET.ORIGINAL.DIAGNOSTICS.ASSET.MANIFEST.V1
5WH:
WHAT = Pin the recovered original Diagnostics visualization assets and their evidence qualification.
WHY = Restore missing assets without promoting illustration or schematic imagery to verified physical geometry.
WHO = Creator-authorized Tablet surface maintainer.
WHERE = apps/agent-tablet/src/diagnostics/assets.ts.
WHEN = 2026-11-26.
HOW = Copy exact original bytes from the authorized golden widget proof package and verify SHA-256 at test time.
LICENSE = User-supplied artwork; external redistribution rights not assessed. Repository terms apply to this manifest.
*/

export interface RecoveredDiagnosticsAsset {
  file: string;
  sha256: string;
  bytes: number;
  qualification: 'CATEGORY_ILLUSTRATION_NOT_MODEL_EVIDENCE' | 'REFERENCE_DOCUMENT_NOT_DEVICE_SPECIFIC';
  sourcePackage: string;
  sourcePath: string;
}

export const ORIGINAL_DIAGNOSTICS_EXPLODED_ASSET = Object.freeze({
  file: 'omniboard-laptop-exploded-reference.jpg',
  sha256: '9a9815ceeae9125509ecf9adf099a231672d1740ee54310baa341be361cd6086',
  sourceArchive: 'omniboard---universal-hardware-diagnostic-engine.zip',
  sourceFile: 'device_laptop_exploded_1792090347526.jpg',
  embeddedQualification: 'CATEGORY_ILLUSTRATION_NOT_MODEL_EVIDENCE'
});

export const RECOVERED_DIAGNOSTICS_ASSETS: readonly RecoveredDiagnosticsAsset[] = Object.freeze([
  { file: 'lenovo-83nx-laptop-front.png', sha256: '30a7b6eb64410b53da4c0699c632f92131f63e09390ca8440fe2e708623dcbf7', bytes: 467597, qualification: 'CATEGORY_ILLUSTRATION_NOT_MODEL_EVIDENCE', sourcePackage: 'digital-brain-golden-widget-proof', sourcePath: 'E:/LeeWay-Work/digital-brain-golden-widget-proof/lenovo-83nx-laptop-front.png' },
  { file: 'lenovo-83nx-laptop-rear.png', sha256: 'a02a359e0c9f3336117176eb15422e05edd626b77007779808fbfca461f291ef', bytes: 172681, qualification: 'CATEGORY_ILLUSTRATION_NOT_MODEL_EVIDENCE', sourcePackage: 'digital-brain-golden-widget-proof', sourcePath: 'E:/LeeWay-Work/digital-brain-golden-widget-proof/lenovo-83nx-laptop-rear.png' },
  { file: 'lenovo-83nx-motherboard-map.png', sha256: '5a0e7004c0b2956c9a7d3b8c15485896beb66b7dc5e86eb239c8d9d4b34f71ac', bytes: 160654, qualification: 'CATEGORY_ILLUSTRATION_NOT_MODEL_EVIDENCE', sourcePackage: 'digital-brain-golden-widget-proof', sourcePath: 'E:/LeeWay-Work/digital-brain-golden-widget-proof/lenovo-83nx-motherboard-map.png' },
  { file: 'lenovo-83nx-thermal-board.png', sha256: 'fbe7a8149be71d49a2e65ef935fd71cd6efb6b763486751a28a6a0703ddd0114', bytes: 89421, qualification: 'CATEGORY_ILLUSTRATION_NOT_MODEL_EVIDENCE', sourcePackage: 'digital-brain-golden-widget-proof', sourcePath: 'E:/LeeWay-Work/digital-brain-golden-widget-proof/lenovo-83nx-thermal-board.png' },
  { file: 'lenovo-83nx-side-bars.png', sha256: '4ebd7a8d1f7c204fd19559855482af390554462d7f6dffa53a5e7d4a9a20f4af', bytes: 17208, qualification: 'CATEGORY_ILLUSTRATION_NOT_MODEL_EVIDENCE', sourcePackage: 'digital-brain-golden-widget-proof', sourcePath: 'E:/LeeWay-Work/digital-brain-golden-widget-proof/lenovo-83nx-side-bars.png' },
  { file: 'lenovo-83nx-topology-stage.png', sha256: '3fa2f1e2e2e84460ca022a3ff2bffd0dea26ea5a0ed4141bf7f11fd8ce91c8c6', bytes: 263534, qualification: 'CATEGORY_ILLUSTRATION_NOT_MODEL_EVIDENCE', sourcePackage: 'digital-brain-golden-widget-proof', sourcePath: 'E:/LeeWay-Work/digital-brain-golden-widget-proof/lenovo-83nx-topology-stage.png' },
  { file: 'omniboard-laptop-exploded-reference.jpg', sha256: '9a9815ceeae9125509ecf9adf099a231672d1740ee54310baa341be361cd6086', bytes: 566966, qualification: 'CATEGORY_ILLUSTRATION_NOT_MODEL_EVIDENCE', sourcePackage: 'omniboard---universal-hardware-diagnostic-engine.zip', sourcePath: 'E:/LeeWay-Work/digital-brain-golden-widget-proof/omniboard-laptop-exploded-reference.jpg' },
  { file: 'lenovo-83nx-manufacturer-reference.pdf', sha256: 'e4f079bc6fb4557df099886e5b6c6d06da6e7080d4ff9027507cac88b7607465', bytes: 895877, qualification: 'REFERENCE_DOCUMENT_NOT_DEVICE_SPECIFIC', sourcePackage: 'digital-brain-golden-widget-proof', sourcePath: 'E:/LeeWay-Work/digital-brain-golden-widget-proof/lenovo-83nx-manufacturer-reference.pdf' }
]);

export const RECOVERED_ASSET_FILES: readonly string[] = Object.freeze(RECOVERED_DIAGNOSTICS_ASSETS.map(asset => asset.file));

/* LEEWAY HEADER - DO NOT REMOVE
REGION: LEEWAY.VT.EDITOR.PREVIEW; TAG: PINNED.LOCAL.RUNTIME.V1
5WH: WHAT local runtime injection; WHY no CDN dependency; WHO LeeWay Industries;
WHERE preview only; WHEN 2026-10-06; HOW upstream published runtime export.
ROLES: PREVIEW. LICENSE: MIT; HyperFrames runtime retains Apache-2.0 license.
*/
import {getHyperframeRuntimeScript} from '@hyperframes/core/runtime-script';
import {inspectComposition} from './composition-session';
const runtime=getHyperframeRuntimeScript();
/** The trusted pinned runtime is presentation machinery, never saved into the user's composition. */
export function previewDocument(html:string):string{
 inspectComposition(html);
 const script='<script data-leeway-runtime="hyperframe.runtime.iife.js">'+runtime.replace(/<\/script/gi,'<\\/script')+'</script>';
 return html.replace(/<\/body>/i,()=>script+'</body>');
}

const { ipcRenderer } = require('electron');

const appIdArgument = process.argv.find(value => value.startsWith('--leeway-app-id='));
const appId = appIdArgument ? decodeURIComponent(appIdArgument.slice('--leeway-app-id='.length)) : 'unknown';
let dragging = false;

function sendAction(action) {
  ipcRenderer.send('vt:app-widget-action', action);
}

function mountChrome() {
  if (document.getElementById('leeway-app-widget-chrome')) return;
  const bar = document.createElement('div');
  bar.id = 'leeway-app-widget-chrome';
  bar.setAttribute('role', 'toolbar');
  bar.setAttribute('aria-label', 'LeeWay widget controls');
  bar.innerHTML = `
    <span class="leeway-widget-mark">LEEWAY</span>
    <button data-drag type="button" title="Move widget">MOVE</button>
    <button data-action="cast" class="leeway-widget-cast" type="button" title="Casting unavailable: verified receiver transport is not bound" aria-label="Casting unavailable" disabled>CAST UNAVAILABLE</button>
    <button data-action="close" class="leeway-widget-close" type="button" title="Close widget">×</button>`;
  document.documentElement.appendChild(bar);
  bar.querySelectorAll('[data-action]').forEach(button => button.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    sendAction(button.dataset.action);
  }));
  const move = bar.querySelector('[data-drag]');
  move.addEventListener('pointerdown', event => {
    if (event.button !== 0) return;
    dragging = true;
    move.setAttribute('aria-pressed', 'true');
    try { move.setPointerCapture(event.pointerId); } catch {}
    ipcRenderer.send('vt:app-widget-dragstart');
    event.preventDefault();
    event.stopPropagation();
  });
  move.addEventListener('pointermove', event => {
    if (!dragging) return;
    ipcRenderer.send('vt:app-widget-drag');
    event.preventDefault();
  });
  for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    move.addEventListener(name, () => {
      if (!dragging) return;
      dragging = false;
      move.setAttribute('aria-pressed', 'false');
      ipcRenderer.send('vt:app-widget-dragstop');
    });
  }
}

window.addEventListener('blur', () => {
  if (!dragging) return;
  dragging = false;
  ipcRenderer.send('vt:app-widget-dragstop');
});

let wheelTimer = 0;
function handleWidgetWheel(event) {
  // Never scale when dragging or pointer is down on move handle / chrome
  if (dragging) return;
  if (event.target.closest?.('#leeway-app-widget-chrome')) return;
  if (event.shiftKey || event.target.closest?.('input,textarea,select,[contenteditable="true"]')) return;

  // Crucial: Only resize if Ctrl key is held OR require explicit gesture,
  // preventing involuntary widget growth when moving pointer or scrolling inside widget.
  if (!event.ctrlKey) return;

  event.preventDefault();
  event.stopImmediatePropagation();
  const now = Date.now();
  if (now - wheelTimer < 180) return;
  wheelTimer = now;
  const delta = Number.isFinite(event.deltaY) && event.deltaY !== 0
    ? event.deltaY
    : -(Number(event.wheelDelta) || 0);
  if (delta !== 0) sendAction(delta < 0 ? 'larger' : 'smaller');
}

// Some embedded WebGL applications consume the bubble path before it reaches
// window. Listen at both capture roots so the LeeWay whole-surface gesture
// remains authoritative while Shift+wheel stays available to the app.
window.addEventListener('wheel', handleWidgetWheel, { capture: true, passive: false });
document.addEventListener('wheel', handleWidgetWheel, { capture: true, passive: false });

window.addEventListener('DOMContentLoaded', mountChrome, { once: true });
window.addEventListener('load', mountChrome);
console.info(`[LeeWay Widget] native controls mounted for ${appId}`);

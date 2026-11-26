/*
REGION: LEEWAY.UI.WIDGET.WINDOWS
TAG: LEEWAY.WIDGET.AGENTVT.INTERACTION
WHAT: Corner grab areas, native wheel scale, canonical LeeWay chrome pill, and UI sound for Agent VT Workstation
WHY: Hide redundant header without sacrificing drag or interactive workstation
WHO: LeeWay Creator / Agent Lee
WHERE: Isolated Agent VT Windows widget proof
WHEN: 2026-10-16
HOW: Safe isolated preload event handling, bounded native IPC, and WebAudio sound
LICENSE: MIT
*/
require('./edge-glow.cjs');
require('./vt-shell-frame.cjs');
const path = require('path');
const { contextBridge, ipcRenderer } = require('electron');
const soundAndChrome = require(path.resolve(__dirname, '..', 'agent-lee-sphere-widget-proof', 'leeway-ui-sound-and-chrome.cjs'));

soundAndChrome.installInPreload();

contextBridge.exposeInMainWorld('leewayNative', {
  openAppWidget: (appId, launchOrigin = 'desktop') => ipcRenderer.invoke('vt:open-app-widget', appId, launchOrigin),
  resolveAppSurface: (appId, surface, launchOrigin) => ipcRenderer.invoke('vt:resolve-app-surface', appId, surface, launchOrigin),
  authorizeCoreSurface: () => ipcRenderer.invoke('vt:authorize-core-surface'),
  closeAppWidget: appId => ipcRenderer.invoke('vt:close-app-widget', appId),
  controlAppWidget: (appId, action) => ipcRenderer.invoke('vt:control-app-widget', appId, action),
  sendAppMirrorInput: (appId, input) => ipcRenderer.send('vt:app-mirror-input', appId, input),
  onAppMirrorFrame: listener => {
    const bridge = (_event, payload) => listener(payload);
    ipcRenderer.on('vt:app-mirror-frame', bridge);
    return () => ipcRenderer.removeListener('vt:app-mirror-frame', bridge);
  },
  onOpenCastDialog: listener => {
    const bridge = (_event, appId) => listener(appId);
    ipcRenderer.on('vt:open-cast-dialog', bridge);
    return () => ipcRenderer.removeListener('vt:open-cast-dialog', bridge);
  }
});

const WIDGET = 'section[aria-label="LeeWay Agent VT floating widget"]';
window.addEventListener('DOMContentLoaded', () => {
  const parityStyle = document.createElement('style');
  parityStyle.id = 'leeway-vt-vision-parity-css';
  parityStyle.textContent = `
    html { background: transparent !important; }
    body { background: transparent !important; }
    #leeway-vt-widget-chrome {
      position: fixed !important;
      z-index: 2147483647 !important;
      top: 6px !important;
      left: 50% !important;
      transform: translateX(-50%) !important;
    }
  `;
  document.head.appendChild(parityStyle);

  const addWidgetChrome = () => {
    if (document.getElementById('leeway-vt-widget-chrome')) return;
    const existingMove = document.getElementById('leeway-vt-widget-move');
    const existingClose = document.getElementById('leeway-vt-widget-close');

    // The canonical local Agent Tablet now owns the exact Open Notebook frame
    // and renders MOVE/CLOSE in that frame's top rail. Bind the native window
    // adapter to those controls instead of adding a second floating pill.
    if (existingMove && existingClose) {
      if (!existingMove.dataset.leewayNativeBound) {
        existingMove.dataset.leewayNativeBound = 'true';
        let dragging = false;
        existingMove.addEventListener('pointerdown', e => {
          if (e.button !== 0) return;
          dragging = true;
          existingMove.setAttribute('aria-pressed', 'true');
          try { existingMove.setPointerCapture(e.pointerId); } catch {}
          ipcRenderer.send('vt:dragstart', e.screenX, e.screenY);
          e.preventDefault();
          e.stopPropagation();
        });
        existingMove.addEventListener('pointermove', e => {
          if (dragging) {
            ipcRenderer.send('vt:drag', e.screenX, e.screenY);
            e.preventDefault();
          }
        });
        for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) {
          existingMove.addEventListener(name, () => {
            if (dragging) {
              dragging = false;
              existingMove.setAttribute('aria-pressed', 'false');
              ipcRenderer.send('vt:dragstop');
            }
          });
        }
        existingClose.addEventListener('click', e => {
          e.preventDefault();
          e.stopPropagation();
          ipcRenderer.send('vt:action', 'hide');
        });
      }
      window.__LeeWayWidgetChrome = { version: '1.0.1', moveButton: true, closeButton: true, inFrame: true };
      return;
    }
    const bar = document.createElement('div');
    bar.id = 'leeway-vt-widget-chrome';
    bar.className = 'leeway-canonical-chrome-pill';
    bar.setAttribute('role', 'group');
    bar.setAttribute('aria-label', 'Agent VT widget controls version 1.0.1');

    const move = document.createElement('button');
    move.type = 'button';
    move.id = 'leeway-vt-widget-move';
    move.className = 'leeway-canonical-move-btn';
    move.textContent = '⠿ MOVE';
    move.setAttribute('aria-label', 'Move Agent VT widget');
    move.setAttribute('aria-pressed', 'false');
    move.title = 'Drag to move Agent VT widget';

    const version = document.createElement('span');
    version.className = 'leeway-canonical-version-label';
    version.textContent = 'v1.0.1';
    version.setAttribute('aria-label', 'Widget controls version 1.0.1');

    const close = document.createElement('button');
    close.type = 'button';
    close.id = 'leeway-vt-widget-close';
    close.className = 'leeway-canonical-close-btn';
    close.textContent = '×';
    close.setAttribute('aria-label', 'Close Agent VT widget');
    close.title = 'Close this widget';

    bar.append(move, version, close);
    document.body.appendChild(bar);
    window.__LeeWayWidgetChrome = { version: '1.0.1', moveButton: true, closeButton: true };

    let dragging = false;
    move.addEventListener('pointerdown', e => {
      if (e.button !== 0) return;
      dragging = true;
      move.setAttribute('aria-pressed', 'true');
      try { move.setPointerCapture(e.pointerId); } catch {}
      ipcRenderer.send('vt:dragstart', e.screenX, e.screenY);
      e.preventDefault();
      e.stopPropagation();
    });
    move.addEventListener('pointermove', e => {
      if (dragging) {
        ipcRenderer.send('vt:drag', e.screenX, e.screenY);
        e.preventDefault();
      }
    });
    for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) {
      move.addEventListener(name, () => {
        if (dragging) {
          dragging = false;
          move.setAttribute('aria-pressed', 'false');
          ipcRenderer.send('vt:dragstop');
        }
      });
    }
    close.addEventListener('click', () => ipcRenderer.send('vt:action', 'hide'));
  };

  const addGrabs = () => {
    if (document.getElementById('leeway-vt-grab-corners')) return;
    const host = document.createElement('div');
    host.id = 'leeway-vt-grab-corners';
    host.setAttribute('aria-label', 'Agent VT window grab corners');
    Object.assign(host.style, { position: 'fixed', inset: '0', pointerEvents: 'none', zIndex: '2147483646' });
    for (const spot of ['top-left', 'top-right', 'bottom-left', 'bottom-right']) {
      const handle = document.createElement('div');
      handle.dataset.grab = spot;
      handle.title = 'Drag Agent VT to move';
      Object.assign(handle.style, {
        position: 'absolute',
        width: '40px',
        height: '40px',
        pointerEvents: 'auto',
        WebkitAppRegion: 'drag',
        cursor: 'grab',
        background: 'rgba(255,64,64,.06)',
        borderRadius: '10px',
        transition: 'box-shadow 160ms ease,background 160ms ease'
      });
      handle.addEventListener('mouseenter', () => {
        handle.style.background = 'rgba(255,48,48,.32)';
        handle.style.boxShadow = 'inset 0 0 0 2px #ff4b4b,0 0 18px #ff3030';
      });
      handle.addEventListener('mouseleave', () => {
        handle.style.background = 'rgba(255,64,64,.06)';
        handle.style.boxShadow = 'none';
      });
      handle.style[spot.includes('top') ? 'top' : 'bottom'] = '0';
      handle.style[spot.includes('left') ? 'left' : 'right'] = '0';
      host.appendChild(handle);
    }
    document.body.appendChild(host);
  };

  const refresh = () => {
    addWidgetChrome();
    addGrabs();
    const tablet = document.querySelector(WIDGET);
    if (!tablet) return;
    // React may render the canonical frame after DOMContentLoaded. If the
    // fallback pill was created during that gap, remove it once the in-frame
    // MOVE/CLOSE controls exist so the widget never shows duplicate chrome.
    if (document.getElementById('leeway-vt-widget-move') && document.getElementById('leeway-vt-widget-close')) {
      document.getElementById('leeway-vt-widget-chrome')?.remove();
      addWidgetChrome();
    }
    const inner = tablet.children[1];
    if (inner) {
      inner.style.flex = '1 1 auto';
      inner.style.minHeight = '0';
      inner.style.width = '100%';
      const canvas = inner.firstElementChild;
      if (canvas) {
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.setProperty('transform', 'none', 'important');
        canvas.style.setProperty('transform-origin', 'top left', 'important');
      }
    }
  };
  let pending = false;
  const schedule = () => {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => {
      pending = false;
      refresh();
    });
  };
  new MutationObserver(schedule).observe(document.documentElement, { subtree: true, childList: true });
  schedule();

  document.addEventListener('wheel', event => {
    if (event.target.closest?.('input,textarea,select,[contenteditable=true]')) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    ipcRenderer.send('vt:scale', event.deltaY < 0 ? 'up' : 'down');
  }, { capture: true, passive: false });
});

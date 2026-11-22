/* REGION: LEEWAY_CRM_NAVIGATION
 * TAG: LEEWAY-CRM-NAV-001
 * WHAT: Accessible collapsible sidebar and consistent navigation icon presentation
 * WHY: Surface canonical ERP features without obstructing the existing application
 * WHO: LeeWay Industries / authorized maintainers
 * WHERE: modules/sidebar-navigation.js
 * WHEN: 2026-11-02
 * HOW: DOM enhancement only. No Runtime or customer-record mutation.
 * LICENSE: Apache-2.0
 */
(function () {
  'use strict';
  const items = {
    crm:          {label:'Commercial & Sales',        accent:'#60a5fa', paths:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>'},
    voice_capture:{label:'Voice Capture',             accent:'#67e8f9', paths:'<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0M12 17v5m-4 0h8"/>'},
    todays_route: {label:"Today's Route",            accent:'#fbbf24', paths:'<circle cx="6" cy="19" r="2"/><path d="M9 19h7a4 4 0 0 0 0-8H8a4 4 0 0 1 0-8h7"/><path d="m13 1 3 2-3 2"/>'},
    campaigns:    {label:'Campaigns',                 accent:'#f9a8d4', paths:'<path d="m3 11 18-5v12L3 13z"/><path d="M3 11v2m4 1 2 6h4l-2-7M21 8a4 4 0 0 1 0 8"/>'},
    bom:          {label:'Product Engineering (BOM)', accent:'#a5b4fc', paths:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l-1.8 1.8a1.7 1.7 0 0 0-1.9-.3l-1.2.5-.4 2.1h-2.6l-.4-2.1-1.2-.5a1.7 1.7 0 0 0-1.9.3l-1.8-1.8A1.7 1.7 0 0 0 6.8 15l-.5-1.2-2.1-.4v-2.6l2.1-.4.5-1.2a1.7 1.7 0 0 0-.3-1.9l1.8-1.8a1.7 1.7 0 0 0 1.9.3l1.2-.5.4-2.1h2.6l.4 2.1 1.2.5a1.7 1.7 0 0 0 1.9-.3l1.8 1.8a1.7 1.7 0 0 0-.3 1.9l.5 1.2 2.1.4v2.6l-2.1.4z"/>'},
    manufacturing:{label:'Manufacturing Orders',      accent:'#fb923c', paths:'<path d="M3 21V9l6 3V9l6 3V5h4v16z"/><path d="M3 21h18M7 17h2m4 0h2m4 0h1"/>'},
    warehousing:  {label:'Warehousing & Dispatch',    accent:'#34d399', paths:'<path d="m3 8 9-5 9 5v10l-9 5-9-5z"/><path d="m3 8 9 5 9-5M12 13v10M7.5 5.5l9 5"/>'},
    device_bridge:{label:'DEVICE-BRIDGE',             accent:'#22d3ee', paths:'<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 3v4m8-4v4M8 17v4m8-4v4M3 8h4m-4 8h4m10-8h4m-4 8h4M9 9h6v6H9z"/>'},
    integrations: {label:'Unified CRM Gateway',       accent:'#93c5fd', paths:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/>'},
    infrastructure:{label:'Sovereign Infrastructure', accent:'#c4b5fd', paths:'<path d="m3 9 9-6 9 6M4 10h16M6 10v9m4-9v9m4-9v9m4-9v9M3 21h18"/>'}
  };
  const sidebar=document.getElementById('lw-sidebar');
  const toggle=document.getElementById('lw-sidebar-toggle');
  if(!sidebar || !toggle) return;
  for (const [id,item] of Object.entries(items)) {
    const button=document.getElementById('nav-'+id);
    if (!button) continue;
    const spans=[...button.children].filter(x=>x.tagName==='SPAN');
    const badge=spans.length>1?spans.slice(1):[];
    for(const b of badge)b.classList.add('lw-nav-badge');
    const icon=document.createElement('span');
    icon.className='lw-nav-icon';
    icon.style.setProperty('--lw-icon-accent',item.accent);
    icon.setAttribute('aria-hidden','true');
    icon.innerHTML='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+item.paths+'</svg>';
    const text=document.createElement('span');
    text.className='lw-nav-label';text.textContent=item.label;
    button.replaceChildren(icon,text,...badge);
    button.title=item.label;
    button.setAttribute('aria-label',item.label);
    button.classList.add('lw-nav-upgraded');
    button.classList.remove('justify-between');
  }
  const key='leeway.crm.sidebar.collapsed.v1';
  function setCollapsed(collapsed) {
    sidebar.classList.toggle('lw-sidebar-collapsed',collapsed);
    toggle.setAttribute('aria-expanded',String(!collapsed));
    toggle.setAttribute('aria-label',collapsed?'Expand sidebar':'Collapse sidebar');
    toggle.title=collapsed?'Expand sidebar':'Collapse sidebar';
    const glyph=toggle.querySelector('svg');
    if(glyph)glyph.style.transform=collapsed?'rotate(180deg)':'rotate(0deg)';
    try{localStorage.setItem(key,collapsed?'1':'0');}catch(_){}
  }
  toggle.addEventListener('click',()=>setCollapsed(!sidebar.classList.contains('lw-sidebar-collapsed')));
  let collapsed=false;
  try{collapsed=localStorage.getItem(key)==='1';}catch(_){}
  setCollapsed(collapsed);
})();

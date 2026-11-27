/*
LEEWAY HEADER — DO NOT REMOVE

REGION: LEEWAY.UI.NAVIGATION
TAG: LEEWAY.UI.TOPBAR.CONTRACT

5WH:
WHAT = Three-zone application top bar providing brand mark, single-line workspace navigation, and primary export action.
WHY = Provide clean spatial orientation across Studio, Layer Inspector, Export Code, and Governance workspaces.
WHO = Leeway Innovations — KineticGlyph Studio UI
WHERE = src/components/TopBar.tsx
WHEN = 2026-11-27
HOW = Functional React component adhering to strict 3-zone top bar contract with single-line whitespace-nowrap controls.

LICENSE = Apache-2.0
*/

import React from 'react';
import { WorkspaceTab } from '../types/studio';

interface TopBarProps {
  activeTab: WorkspaceTab;
  onSelectTab: (tab: WorkspaceTab) => void;
  onQuickExport: () => void;
}

const NAV_ITEMS: Array<{ id: WorkspaceTab; label: string }> = [
  { id: 'studio', label: 'Studio' },
  { id: 'inspector', label: 'Layer Inspector' },
  { id: 'export', label: 'Export Code' },
  { id: 'governance', label: 'Governance' },
];

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  onSelectTab,
  onQuickExport,
}) => {
  return (
    <header className="h-14 border-b border-slate-800 bg-[#0B0F17] px-5 flex items-center justify-between gap-8 shrink-0">
      {/* Zone 1: Brand Wordmark */}
      <div className="flex items-center gap-2.5 whitespace-nowrap shrink-0">
        <img
          src="/leeway-standards-logo.png"
          alt="LeeWay Standards Official Mark"
          className="w-6 h-6 object-contain rounded-sm"
        />
        <span className="font-display text-base font-semibold tracking-tight text-slate-100 whitespace-nowrap shrink-0">
          KineticGlyph Studio
        </span>
      </div>

      {/* Zone 2: Clean Single-Line Navigation Links */}
      <nav aria-label="Workspace Sections" className="hidden md:flex items-center gap-6">
        {NAV_ITEMS.map((item) => {
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`py-1.5 text-sm font-medium whitespace-nowrap shrink-0 border-b-2 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 rounded-t ${
                active
                  ? 'border-sky-400 text-slate-100'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Zone 3: Single Primary Action */}
      <div className="flex items-center shrink-0">
        <button
          type="button"
          onClick={onQuickExport}
          className="px-4 py-2 text-xs font-semibold text-slate-950 bg-sky-400 hover:bg-sky-300 active:translate-y-px rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
        >
          Export Button
        </button>
      </div>
    </header>
  );
};

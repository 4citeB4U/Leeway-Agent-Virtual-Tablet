import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FileImage, FileText, Film, FolderArchive, Search, Send, Upload, X } from 'lucide-react';
import type { WorkstationAppId } from '../types';

type VaultKind = 'video' | 'short' | 'thumbnail' | 'pdf' | 'blog';
type VaultArtifact = {
  id: string;
  name: string;
  kind: VaultKind;
  size: number;
  updatedAt: string;
  storageState: 'local-cache' | 'pending-sync' | 'canonical-reference';
  canonicalLocation: string;
  handoff?: { destination: string; state: 'staged'; stagedAt: string };
};

const STORAGE_KEY = 'leeway.content-vault.shared.v1';
const FILTERS: Array<'all' | VaultKind> = ['all', 'video', 'short', 'thumbnail', 'pdf', 'blog'];

function inferKind(file: File): VaultKind | null {
  const name = file.name.toLowerCase();
  if (file.type === 'application/pdf' || name.endsWith('.pdf')) return 'pdf';
  if (file.type.startsWith('video/')) return /short|reel|vertical/.test(name) ? 'short' : 'video';
  if (file.type.startsWith('image/')) return 'thumbnail';
  if (/\.md$|\.txt$|\.docx?$|\.html?$/.test(name)) return 'blog';
  return null;
}

function readVault(): VaultArtifact[] {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function kindIcon(kind: VaultKind) {
  if (kind === 'video' || kind === 'short') return Film;
  if (kind === 'thumbnail') return FileImage;
  return FileText;
}

export function ContentVault({
  mode,
  onClose,
  onOpenApp,
  onNotice
}: {
  mode: 'page' | 'drawer';
  onClose?: () => void;
  onOpenApp: (app: WorkstationAppId) => void;
  onNotice: (message: string) => void;
}) {
  const [artifacts, setArtifacts] = useState<VaultArtifact[]>(readVault);
  const [filter, setFilter] = useState<'all' | VaultKind>('all');
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(artifacts)); } catch { /* session state remains available */ }
  }, [artifacts]);

  const visible = useMemo(() => artifacts.filter(item =>
    (filter === 'all' || item.kind === filter) && item.name.toLowerCase().includes(query.toLowerCase())
  ), [artifacts, filter, query]);

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const next: VaultArtifact[] = [];
    Array.from(files).forEach(file => {
      const kind = inferKind(file);
      if (!kind) return;
      const id = crypto.randomUUID();
      next.push({
        id,
        name: file.name,
        kind,
        size: file.size,
        updatedAt: new Date().toISOString(),
        storageState: 'local-cache',
        canonicalLocation: `continuum://local-working-set/artifacts/${id}`
      });
    });
    setArtifacts(current => [...next, ...current]);
    onNotice(next.length ? `${next.length} item${next.length === 1 ? '' : 's'} added to the shared local Vault working set.` : 'No supported Vault files were selected.');
  };

  const stageHandoff = (artifact: VaultArtifact, destination: 'contentFoundry' | 'leewayIde' | 'officeSuite') => {
    setArtifacts(current => current.map(item => item.id === artifact.id ? {
      ...item,
      storageState: 'pending-sync',
      handoff: { destination, state: 'staged', stagedAt: new Date().toISOString() }
    } : item));
    onNotice(`${artifact.name} staged for ${destination}. The Continuum adapter is unbound, so no external transfer was claimed.`);
    onOpenApp(destination);
  };

  return (
    <section className={`${mode === 'drawer' ? 'absolute inset-y-3 right-3 z-[70] w-[min(560px,calc(100%-24px))] rounded-[24px]' : 'h-full w-full'} flex min-h-0 flex-col overflow-hidden border border-cyan-300/30 bg-[#07101a]/[.98] text-white shadow-[0_24px_70px_rgba(0,0,0,.75),0_0_30px_rgba(34,211,238,.12)] backdrop-blur-2xl`} aria-label="LeeWay Content Vault">
      <header className="flex shrink-0 items-center gap-3 border-b border-white/10 bg-gradient-to-r from-fuchsia-950/80 via-slate-950 to-cyan-950/80 px-4 py-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-300 via-fuchsia-600 to-indigo-950 shadow-lg"><FolderArchive size={24} /></span>
        <div className="min-w-0 flex-1"><h1 className="text-sm font-black tracking-[.13em]">CONTENT VAULT</h1><p className="truncate text-[9px] text-cyan-100/60">One shared working set · Foundry ↔ Continuum ↔ Digital Brain</p></div>
        {onClose && <button onClick={onClose} className="rounded-xl border border-white/15 bg-white/5 p-2 hover:bg-white/10" aria-label="Close Content Vault"><X size={17} /></button>}
      </header>

      <div className="grid shrink-0 grid-cols-2 gap-2 border-b border-white/10 p-3 text-[9px] sm:grid-cols-3">
        <button onClick={() => onOpenApp('contentFoundry')} className="rounded-xl border border-fuchsia-400/30 bg-fuchsia-950/30 p-2 text-left"><b className="block text-fuchsia-200">CONTENT FOUNDRY</b><span className="text-zinc-500">Vault owner UI · AVAILABLE</span></button>
        <button onClick={() => onOpenApp('continuum')} className="rounded-xl border border-amber-400/30 bg-amber-950/30 p-2 text-left"><b className="block text-amber-200">CONTINUUM</b><span className="text-zinc-500">Meaning / lineage · UI AVAILABLE</span></button>
        <div className="col-span-2 rounded-xl border border-rose-400/30 bg-rose-950/20 p-2 sm:col-span-1"><b className="block text-rose-200">DIGITAL BRAIN</b><span className="text-zinc-500">Durable bytes / index · ADAPTER UNBOUND</span></div>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2 p-3 pb-2">
        <label className="flex min-w-[180px] flex-1 items-center gap-2 rounded-xl border border-white/10 bg-black/35 px-3 py-2"><Search size={14} className="text-cyan-300" /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Find videos, PDFs, blogs…" className="min-w-0 flex-1 bg-transparent text-xs outline-none" /></label>
        <input ref={inputRef} type="file" multiple accept="video/*,image/*,.pdf,.md,.txt,.doc,.docx,.html" className="hidden" onChange={event => addFiles(event.target.files)} />
        <button onClick={() => inputRef.current?.click()} className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-700 px-3 py-2 text-[10px] font-black"><Upload size={14} /> ADD FILES</button>
      </div>

      <div className="flex shrink-0 gap-1 overflow-x-auto px-3 pb-2">
        {FILTERS.map(item => <button key={item} onClick={() => setFilter(item)} className={`rounded-full px-3 py-1 text-[9px] font-bold uppercase ${filter === item ? 'bg-cyan-300 text-slate-950' : 'bg-white/5 text-zinc-400 hover:bg-white/10'}`}>{item}</button>)}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3 pt-1">
        {visible.length === 0 ? (
          <div className="flex h-full min-h-[180px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-black/20 p-8 text-center"><FolderArchive size={42} className="mb-3 text-cyan-300/50" /><b className="text-sm">Shared Vault is ready</b><p className="mt-1 max-w-sm text-[10px] leading-4 text-zinc-500">Add a video, short, thumbnail, PDF, or blog file. Metadata stays in this one tablet instance. Durable Continuum/Digital Brain synchronization remains unclaimed until its authorized adapter is bound.</p></div>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {visible.map(item => { const Icon = kindIcon(item.kind); return <article key={item.id} className="rounded-2xl border border-white/10 bg-white/[.045] p-3">
              <div className="flex items-start gap-3"><span className="rounded-xl bg-gradient-to-br from-cyan-500/30 to-fuchsia-600/30 p-2"><Icon size={19} /></span><div className="min-w-0 flex-1"><b className="block truncate text-xs">{item.name}</b><span className="text-[8px] uppercase text-zinc-500">{item.kind} · {(item.size / 1024).toFixed(1)} KB · {item.storageState}</span></div></div>
              {item.handoff && <div className="mt-2 rounded-lg bg-amber-400/10 px-2 py-1 text-[8px] text-amber-200">STAGED → {item.handoff.destination} · NOT EXECUTED</div>}
              <div className="mt-2 flex flex-wrap gap-1"><span className="mr-1 flex items-center gap-1 text-[8px] text-zinc-500"><Send size={10} /> SEND TO</span>{(['contentFoundry','leewayIde','officeSuite'] as const).map(destination => <button key={destination} onClick={() => stageHandoff(item, destination)} className="rounded-lg border border-white/10 bg-black/30 px-2 py-1 text-[8px] hover:border-cyan-300/50">{destination === 'contentFoundry' ? 'Foundry' : destination === 'leewayIde' ? 'IDE' : 'Office'}</button>)}</div>
            </article>; })}
          </div>
        )}
      </div>
      <footer className="shrink-0 border-t border-white/10 px-3 py-2 text-[8px] text-zinc-500">SHARED INSTANCE: {artifacts.length} ITEMS · CONTINUUM ADAPTER: UNBOUND · DIGITAL BRAIN ADAPTER: UNBOUND</footer>
    </section>
  );
}

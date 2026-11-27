/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.TABLET.ABOUT
TAG: LEEWAY.TABLET.APP_README_MANUAL.V1
WHAT: Visual instruction manual for a tablet application: purpose, scope, Agent Lee task examples, README from GitHub and annotated screenshots.
WHY: Users must understand what each tool does and how to use it from its canonical project documentation.
WHO: LeeWay Industries / creator-authorized outside contributor (LW-OPENCODE).
WHERE: apps/agent-tablet/src/components/AppAbout.tsx
WHEN: 2026-11-27
HOW: Read-only HTTPS README retrieval from 4citeB4U repositories; no write, entitlement or deployment claim.
AUTHORITY: DOCUMENTATION_READ_ONLY. No Veritas, receipt or production claim.
LICENSE: Existing repository terms.
*/
import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ExternalLink, FileText, Image as ImageIcon, RefreshCw, Sparkles } from 'lucide-react';
import { APP_DOC_BINDINGS, docUrl, type AppDocBinding } from '../appDocs';
import type { WorkstationAppId } from '../types';

type Props = { appId: WorkstationAppId; onClose: () => void };

type MarkdownNode =
  | { kind: 'heading'; level: number; text: string }
  | { kind: 'paragraph'; text: string }
  | { kind: 'list'; items: string[] }
  | { kind: 'code'; text: string }
  | { kind: 'image'; src: string; alt: string }
  | { kind: 'link'; text: string; href: string };

function safeHttpUrl(value: string, base: string) {
  const trimmed = value.trim().replace(/^<|>$/g, '');
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith('#')) return trimmed;
  try { return new URL(trimmed, base).toString(); } catch { return ''; }
}

function parseMarkdown(markdown: string, base: string): MarkdownNode[] {
  const nodes: MarkdownNode[] = [];
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  let paragraph: string[] = [];
  let list: string[] = [];
  let code: string[] | null = null;
  const flushParagraph = () => { if (paragraph.length) { nodes.push({ kind: 'paragraph', text: paragraph.join(' ').trim() }); paragraph = []; } };
  const flushList = () => { if (list.length) { nodes.push({ kind: 'list', items: [...list] }); list = []; } };
  for (const line of lines) {
    if (line.startsWith('```')) {
      if (code) { nodes.push({ kind: 'code', text: code.join('\n') }); code = null; }
      else { flushParagraph(); flushList(); code = []; }
      continue;
    }
    if (code) { code.push(line); continue; }
    const image = line.match(/^!\[([^\]]*)\]\(([^)]+)\)/);
    if (image) {
      flushParagraph(); flushList();
      nodes.push({ kind: 'image', alt: image[1], src: safeHttpUrl(image[2], base) });
      continue;
    }
    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      flushParagraph(); flushList();
      nodes.push({ kind: 'heading', level: heading[1].length, text: heading[2].replace(/[*`_]/g, '').trim() });
      continue;
    }
    const bullet = line.match(/^\s*[-*]\s+(.+)$/);
    if (bullet) { flushParagraph(); list.push(bullet[1].replace(/[*`_]/g, '').trim()); continue; }
    if (!line.trim()) { flushParagraph(); flushList(); continue; }
    paragraph.push(line.trim());
  }
  flushParagraph(); flushList();
  if (code) nodes.push({ kind: 'code', text: code.join('\n') });
  return nodes;
}

function renderInline(text: string, base: string) {
  const parts = text.split(/(\[[^\]]+\]\([^)]+\))/g);
  return parts.map((part, index) => {
    const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (!link) return <React.Fragment key={index}>{part}</React.Fragment>;
    const href = safeHttpUrl(link[2], base);
    if (!href || href.startsWith('#')) return <React.Fragment key={index}>{link[1]}</React.Fragment>;
    return <a key={index} href={href} target="_blank" rel="noreferrer" className="text-cyan-300 underline">{link[1]}</a>;
  });
}

export function AppAbout({ appId, onClose }: Props) {
  const binding: AppDocBinding | undefined = APP_DOC_BINDINGS[appId];
  const [branch, setBranch] = useState('main');
  const [markdown, setMarkdown] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const url = useMemo(() => binding ? docUrl(binding, branch) : '', [binding, branch]);

  useEffect(() => {
    if (!binding) { setLoading(false); setError('NO_DOCUMENTATION_BINDING'); return; }
    let alive = true;
    setLoading(true); setError(null);
    fetch(url, { cache: 'no-store' })
      .then(async response => {
        if (!response.ok) throw new Error(`README_${response.status}`);
        return response.text();
      })
      .then(text => { if (alive) { setMarkdown(text); setLoading(false); } })
      .catch(async () => {
        if (!alive) return;
        if (branch === 'main') { setBranch('master'); return; }
        setError('README_UNAVAILABLE'); setLoading(false);
      });
    return () => { alive = false; };
  }, [url, binding, branch]);

  const nodes = useMemo(() => markdown ? parseMarkdown(markdown, url) : [], [markdown, url]);
  const images = useMemo(() => nodes.filter(node => node.kind === 'image').slice(0, 8), [nodes]);
  const githubUrl = binding ? `https://github.com/${binding.owner || '4citeB4U'}/${binding.repo}` : '';

  return (
    <section className="absolute inset-0 z-40 flex flex-col overflow-hidden bg-[#050a10] text-zinc-100" aria-label={`${appId} About`}>
      <header className="flex shrink-0 items-center gap-3 border-b border-cyan-300/20 bg-[#07131c] px-4 py-3">
        <button type="button" onClick={onClose} className="flex min-h-11 min-w-11 items-center justify-center rounded-full border border-cyan-300/40 bg-[#0077ff] text-white hover:bg-[#2a95ff]" aria-label="Close About"><ArrowLeft size={18} /></button>
        <FileText size={20} className="text-cyan-300" />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-black tracking-wide text-cyan-100">{binding?.title || appId} — About</div>
          <div className="truncate text-[10px] text-zinc-400">Visual instruction manual · README from {binding?.repo || 'unbound'}</div>
        </div>
        {githubUrl && <a href={githubUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 rounded border border-cyan-300/40 px-3 py-2 text-[10px] font-bold text-cyan-100 hover:bg-cyan-400/10"><ExternalLink size={12} /> GitHub</a>}
        <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full border border-[#ff9aa3] bg-[#dc2626] text-lg font-black text-white hover:bg-[#ef4444]" aria-label="Close">×</button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 md:px-8">
        {!binding && <div className="rounded-xl border border-amber-300/40 bg-amber-950/30 p-4 text-sm text-amber-100">No canonical documentation binding for this application.</div>}
        {binding && (
          <>
            <div className="mx-auto max-w-5xl space-y-4">
              <div className="rounded-2xl border border-cyan-300/25 bg-gradient-to-br from-[#0b2030] to-[#061018] p-5 shadow-xl">
                <h1 className="text-xl font-black text-cyan-100">{binding.title}</h1>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <div><div className="text-[10px] font-black uppercase tracking-widest text-cyan-300/70">Purpose</div><p className="mt-1 text-sm text-zinc-200">{binding.purpose}</p></div>
                  <div><div className="text-[10px] font-black uppercase tracking-widest text-cyan-300/70">Scope & boundary</div><p className="mt-1 text-sm text-zinc-200">{binding.scope}</p></div>
                </div>
                <div className="mt-4 rounded-xl border border-[#66c6ff]/30 bg-[#0077ff]/10 p-3">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-cyan-200"><RefreshCw size={13} /> Updates</div>
                  <p className="mt-1 text-xs leading-relaxed text-cyan-50/80">This application can be updated from the tablet UPDATE button. The Update Center compares the installed commit with the canonical GitHub main commit and raises an UPDATE FLAG when a newer version exists. Whole-system and per-application updates are separate, owner-authorized actions.</p>
                </div>
                <div className="mt-4 rounded-xl border border-emerald-300/25 bg-emerald-950/20 p-3">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-300"><Sparkles size={13} /> Tasks you can request from Agent Lee</div>
                  <ul className="mt-2 grid gap-1 text-sm text-emerald-50 md:grid-cols-2">
                    {binding.agentLeeTasks.map(task => <li key={task}>• {task}</li>)}
                  </ul>
                </div>
              </div>

              {loading && <div className="rounded-xl border border-cyan-300/20 bg-black/40 p-5 text-sm text-cyan-200">Loading README from GitHub…</div>}
              {error && <div className="rounded-xl border border-rose-400/40 bg-rose-950/30 p-5 text-sm text-rose-100">{error}</div>}

              {images.length > 0 && (
                <div className="rounded-2xl border border-cyan-300/20 bg-[#07121b] p-4">
                  <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-cyan-200"><ImageIcon size={14} /> Annotated screenshots from the canonical README</div>
                  <div className="grid gap-4 md:grid-cols-2">
                    {images.map((node, index) => node.kind === 'image' && (
                      <figure key={index} className="overflow-hidden rounded-xl border border-white/10 bg-black">
                        <img src={node.src} alt={node.alt} className="max-h-64 w-full object-contain" />
                        <figcaption className="border-t border-white/10 px-3 py-2 text-[11px] text-zinc-300">{node.alt || `Screenshot ${index + 1}`}</figcaption>
                      </figure>
                    ))}
                  </div>
                </div>
              )}

              <article className="space-y-3 rounded-2xl border border-white/10 bg-[#070d14] p-5">
                {nodes.map((node, index) => {
                  if (node.kind === 'heading') {
                    const level = Math.min(6, Math.max(2, node.level + 1));
                    return React.createElement(`h${level}`, { key: index, className: 'mt-4 border-b border-white/10 pb-1 text-base font-black text-cyan-100 first:mt-0' }, node.text);
                  }
                  if (node.kind === 'paragraph') return <p key={index} className="text-sm leading-relaxed text-zinc-300">{renderInline(node.text, url)}</p>;
                  if (node.kind === 'list') return <ul key={index} className="ml-5 list-disc space-y-1 text-sm text-zinc-300">{node.items.map((item, i) => <li key={i}>{renderInline(item, url)}</li>)}</ul>;
                  if (node.kind === 'code') return <pre key={index} className="overflow-x-auto rounded-lg border border-white/10 bg-black p-3 text-[11px] text-emerald-200">{node.text}</pre>;
                  return null;
                })}
              </article>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

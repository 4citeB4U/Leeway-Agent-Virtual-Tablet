/*
LEEWAY HEADER — DO NOT REMOVE

REGION: LEEWAY.CORE.FRONTEND.KNOWLEDGE_BASE
TAG: LEEWAY.CORE.EMBEDDED.KNOWLEDGE.VIEWER.V1

5WH:
WHAT = Interactive searchable viewer for the Embedded LeeWay Knowledge Base and canonical GitHub revision ledger.
WHY = Give the Creator direct inspection of canonical Standards, R01-R25, MEMORY.md, Formula v1 spec, and inaccessible repository disclosures.
WHO = Creator/Human Authority via Leeway Innovations.
WHERE = src/components/knowledge/KnowledgeBaseModal.tsx
WHEN = 2026-11-27
HOW = Modal browser filtering KNOWLEDGE_ARTICLES and CANONICAL_SOURCE_REVISIONS.

LICENSE = Apache-2.0
*/
import React, { useState } from 'react';
import { BookOpen, Search, X } from 'lucide-react';
import {
  CANONICAL_SOURCE_REVISIONS,
  KNOWLEDGE_ARTICLES,
  KNOWLEDGE_BASE_VERSION,
} from '../../data/knowledgeBase';

export function KnowledgeBaseModal({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string>('ALL');

  const filtered = KNOWLEDGE_ARTICLES.filter((a) => {
    const matchCat = category === 'ALL' || a.category === category;
    const q = query.trim().toLowerCase();
    const matchQuery =
      !q ||
      a.title.toLowerCase().includes(q) ||
      a.summary.toLowerCase().includes(q) ||
      a.clauses.some((c) => c.toLowerCase().includes(q));
    return matchCat && matchQuery;
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Embedded LeeWay Knowledge Base"
    >
      <div className="flex max-h-[90vh] w-full max-w-5xl flex-col rounded-xl border border-[#D4AF37]/50 bg-[#121721]">
        <header className="flex items-center justify-between border-b border-[#252D3D] px-5 py-4">
          <div className="flex items-center gap-3">
            <BookOpen className="h-5 w-5 text-[#D4AF37]" />
            <div>
              <h2 className="font-display text-lg font-semibold text-white">
                Embedded LeeWay Canonical Knowledge Base
              </h2>
              <p className="font-mono text-xs text-slate-400">
                Version {KNOWLEDGE_BASE_VERSION} · Grounded in verified 4citeB4U repositories
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Knowledge Base"
            className="rounded p-1.5 text-slate-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="overflow-y-auto p-5 space-y-5">
          {/* Search & Category Filter */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search canonical laws, Formula v1.0, R01-R25, MEMORY.md..."
                className="w-full rounded-lg border border-[#2D3648] bg-[#0B0E14] py-2 pl-9 pr-3 text-xs text-white placeholder:text-slate-500"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {['ALL', 'LAW_&_GOVERNANCE', 'FORMULA_MATHEMATICS', 'ARCHITECTURE', 'CRM_&_WORKFORCE', 'LIMITATIONS'].map(
                (cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`rounded px-2.5 py-1.5 text-xs font-medium whitespace-nowrap ${
                      category === cat
                        ? 'bg-[#D4AF37]/20 text-[#F8E7A1] border border-[#D4AF37]/60'
                        : 'bg-[#171D2A] text-slate-300 border border-[#2D3648]'
                    }`}
                  >
                    {cat.replace(/_/g, ' ')}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Canonical Articles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((article) => (
              <article
                key={article.id}
                className="rounded-lg border border-[#252D3D] bg-[#0E131C] p-4 space-y-2"
              >
                <div className="flex items-center justify-between gap-2 text-[11px] text-slate-400">
                  <span className="font-mono text-[#38BDF8]">{article.category.replace(/_/g, ' ')}</span>
                  <span className="font-mono">v{article.version}</span>
                </div>
                <h3 className="font-display text-sm font-semibold text-white">{article.title}</h3>
                <p className="text-xs text-slate-300">{article.summary}</p>
                <ul className="space-y-1.5 pt-1 text-xs text-slate-300 list-disc pl-4">
                  {article.clauses.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
                <div className="pt-1 font-mono text-[10px] text-slate-500 truncate">
                  Source: {article.sourceRef}
                </div>
              </article>
            ))}
          </div>

          {/* Canonical Source Provenance Table */}
          <div className="rounded-lg border border-[#252D3D] bg-[#0E131C] p-4">
            <h3 className="mb-3 font-display text-sm font-semibold text-white">
              Canonical Repository Revision & Accessibility Ledger
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#252D3D] text-slate-400">
                    <th className="py-2 pr-3">Repository</th>
                    <th className="py-2 pr-3">Status</th>
                    <th className="py-2 pr-3">Commit SHA</th>
                    <th className="py-2">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E2534]">
                  {CANONICAL_SOURCE_REVISIONS.map((rev) => (
                    <tr key={rev.repository}>
                      <td className="py-2 pr-3 font-mono text-white">{rev.repository}</td>
                      <td className="py-2 pr-3 font-mono">
                        <span
                          className={
                            rev.status === 'VERIFIED_CLONED' ? 'text-emerald-400' : 'text-rose-400'
                          }
                        >
                          {rev.status}
                        </span>
                      </td>
                      <td className="py-2 pr-3 font-mono text-slate-300">
                        {rev.commitSha ? rev.commitSha.slice(0, 12) : 'UNAVAILABLE'}
                      </td>
                      <td className="py-2 text-slate-300">{rev.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

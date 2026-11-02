import React, { useState } from 'react';
import { Source } from '../../types';

interface ConceptMapProps {
  sources: Source[];
  notebookTitle: string;
}

interface ConceptNode {
  id: string;
  label: string;
  category: 'core' | 'mechanism' | 'outcome' | 'tool';
  sources: number[];
  x: number;
  y: number;
}

export const ConceptMap: React.FC<ConceptMapProps> = ({ sources, notebookTitle }) => {
  const [selectedNode, setSelectedNode] = useState<ConceptNode | null>(null);

  // Build concept nodes only from the notebook's actual sources.
  const nodes: ConceptNode[] = React.useMemo(() => {
    const positions = [
      [200, 95], [95, 195], [305, 195], [200, 305], [70, 95], [330, 95]
    ];
    return sources.slice(0, 6).map((source, index) => ({
      id: String(index + 1),
      label: source.tags?.[0] || source.title.slice(0, 42),
      category: index === 0 ? 'core' : index % 3 === 0 ? 'tool' : index % 2 === 0 ? 'outcome' : 'mechanism',
      sources: [index + 1],
      x: positions[index][0],
      y: positions[index][1]
    }));
  }, [sources]);

  const connections = nodes.slice(1).map((node) => ({ from: nodes[0]?.id || '', to: node.id }));

  return (
    <div className="bg-stone-950 border border-stone-800 rounded-xl p-4 flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between pb-3 border-b border-stone-800 text-xs">
        <div>
          <span className="font-bold text-stone-200">Knowledge Concept Graph</span>
          <p className="text-[10px] text-stone-400">Interlinked research entities across notebook sources</p>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded bg-orange-950 border border-orange-800 text-orange-400 font-bold">
          {nodes.length} Key Concepts
        </span>
      </div>

      {/* SVG Canvas */}
      <div className="relative flex-grow min-h-[340px] flex items-center justify-center overflow-hidden">
        <svg className="w-full h-full" viewBox="0 0 420 400">
          {/* Connection Lines */}
          {connections.map((c, i) => {
            const n1 = nodes.find(n => n.id === c.from);
            const n2 = nodes.find(n => n.id === c.to);
            if (!n1 || !n2) return null;
            return (
              <line
                key={i}
                x1={n1.x}
                y1={n1.y}
                x2={n2.x}
                y2={n2.y}
                stroke="#44403c"
                strokeWidth="1.5"
                strokeDasharray="4,4"
              />
            );
          })}

          {/* Nodes */}
          {nodes.map(n => {
            const isSelected = selectedNode?.id === n.id;
            const fill =
              n.category === 'core'
                ? '#f97316'
                : n.category === 'mechanism'
                ? '#0284c7'
                : n.category === 'outcome'
                ? '#10b981'
                : '#a855f7';

            return (
              <g
                key={n.id}
                onClick={() => setSelectedNode(n)}
                className="cursor-pointer transition-transform hover:scale-105"
              >
                <circle
                  cx={n.x}
                  cy={n.y}
                  r={isSelected ? 22 : 18}
                  fill={fill}
                  fillOpacity={isSelected ? 0.9 : 0.75}
                  stroke="#ffffff"
                  strokeWidth={isSelected ? 2.5 : 1}
                  className="shadow-lg"
                />
                <text
                  x={n.x}
                  y={n.y + 32}
                  textAnchor="middle"
                  fill="#d6d3d1"
                  fontSize="10"
                  fontWeight="600"
                  className="select-none pointer-events-none drop-shadow"
                >
                  {n.label}
                </text>
              </g>
            );
          })}
        </svg>

        {selectedNode && (
          <div className="absolute bottom-2 left-2 right-2 p-3 bg-stone-900/90 border border-stone-700 rounded-lg text-xs backdrop-blur-xs flex items-center justify-between shadow-xl">
            <div>
              <div className="font-bold text-white flex items-center gap-2">
                <span>{selectedNode.label}</span>
                <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-stone-800 text-stone-300">
                  {selectedNode.category}
                </span>
              </div>
              <p className="text-[11px] text-stone-400 mt-0.5">
                Cited in source(s): {selectedNode.sources.map(s => `[Source ${s}]`).join(', ')}
              </p>
            </div>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-stone-400 hover:text-white text-xs px-2 py-1 rounded bg-stone-800"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

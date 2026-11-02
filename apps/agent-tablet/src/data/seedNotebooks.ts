/*
LEEWAY HEADER — DO NOT REMOVE
REGION: DATA.OPEN_NOTEBOOK
TAG: DATA.AGENT_TABLET.OPEN_NOTEBOOK.SEED
5WH:
WHAT = Empty, evidence-ready initial Open Notebook workspace.
WHY = Prevent demo fixtures, synthetic benchmarks, or generated examples from being presented as live evidence.
WHO = Creator/Human Authority through LeeWay Digital Workforce.
WHERE = Agent Tablet Open Notebook initial state.
WHEN = 2026.
HOW = One local workspace with no preloaded sources, artifacts, or chat claims.
AUTHORIZED ROLES: Presentation/bootstrap only; source truth comes from real user/provider ingestion.
LICENSE: LeeWay-authored source.
*/
import { Notebook } from '../types';

export const INITIAL_NOTEBOOKS: Notebook[] = [
  {
    id: 'nb-open-notebook',
    title: 'Open Notebook Workspace',
    description: 'Evidence-ready workspace. Add real sources before grounded research or artifact generation.',
    emoji: '📓',
    createdAt: '2026-10-04',
    updatedAt: '2026-10-04',
    sources: [],
    notes: [
      {
        id: 'note-system-1',
        title: 'Evidence State',
        isPinned: true,
        updatedAt: '2026-10-04',
        tags: ['evidence', 'grounding', 'leeway'],
        content: 'This notebook starts empty by design. No benchmark, citation, provider, execution, or research claim is preloaded as verified evidence. Add or ingest real sources before asking grounded questions.'
      }
    ],
    artifacts: [],
    chatHistory: []
  }
];

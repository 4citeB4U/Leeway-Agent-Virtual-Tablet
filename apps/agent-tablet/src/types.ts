export type WorkstationAppId =
  | 'desktop'
  | 'editor'
  | 'openNotebook'
  | 'crm'
  | 'modelHub'
  | 'logistics'
  | 'vscode'
  | 'browser'
  | 'terminal'
  | 'notepad'
  | 'workboard'
  | 'database'
  | 'diagnostics'
  | 'workforce'
  | 'agentRoster'
  | 'pallium'
  | 'continuum'
  | 'preview'
  | 'apps'
  | 'standalone';

export type TerminalShellType = 'ubuntu' | 'powershell' | 'termux';

export interface Source {
  id: string;
  title: string;
  type: 'url' | 'file' | 'text' | 'research' | 'code';
  content: string;
  summary?: string;
  wordCount: number;
  chunkCount: number;
  isActive: boolean; // whether included in grounding context
  url?: string;
  tags?: string[];
  createdAt: string;
}

export interface NotebookNote {
  id: string;
  title: string;
  content: string;
  isPinned: boolean;
  updatedAt: string;
  tags?: string[];
}

export type ArtifactType = 'audio_overview' | 'study_guide' | 'briefing_doc' | 'faq' | 'timeline';

export interface StudioArtifact {
  id: string;
  type: ArtifactType;
  title: string;
  content: string;
  createdAt: string;
  isPlaying?: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: string;
  citedSources?: {
    index: number;
    title: string;
    snippet: string;
  }[];
  suggestedQuestions?: string[];
}

export interface Notebook {
  id: string;
  title: string;
  description: string;
  emoji: string;
  createdAt: string;
  updatedAt: string;
  sources: Source[];
  notes: NotebookNote[];
  artifacts: StudioArtifact[];
  chatHistory: ChatMessage[];
}

export interface AgentProfile {
  id: string;
  name: string;
  role: string;
  badge: string;
  avatarIcon?: string;
}

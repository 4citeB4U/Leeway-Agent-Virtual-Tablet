export type BranchKey = 'CORE' | 'PERCEPTION' | 'MACOS' | 'WINDOWS' | 'LINUX' | 'ANDROID' | 'WEB';

export interface Branch {
  key: BranchKey;
  title: string;
  subtitle: string;
  color: string;
  glowColor: string;
  icon: string;
  yaw: number;
  pitch: number;
  description: string;
  badge: string;
}

export interface Skill {
  id: string;
  name: string;
  subtitle: string;
  branchKey: BranchKey;
  category: 'Control' | 'Perception' | 'Elevation' | 'Input' | 'Stream' | 'Orchestration';
  radius: number;
  angleDeg: number;
  heightY: number;
  latencyMs: number;
  cloudLatencyMs: number;
  costPerRun: string;
  cloudCostPerRun: string;
  cli: string;
  codeSnippet: string;
  desc: string;
  perms: string;
  inputs: string[];
  outputs: string[];
  compatibleNeighbors: string[];
  githubPath?: string;
  githubUrl?: string;
  sourceCommit?: string;
  registryState: string;
  qualificationState: string;
  executionState: string;
  evidenceState: string;
  custom?: boolean;
}

export interface GrapevineSystemStatus {
  id: string;
  label: string;
  state: string;
  detail: string;
  sourceRef?: string;
}

export interface GrapevineRegistry {
  schemaVersion: string;
  generatedAtUtc: string;
  repository: string;
  commit: string;
  counts: { canonicalSkillMd: number; legacyRegistryEntries: number; mcpProtocolListedTools: number; mcpSkillTools: number; boundedCapabilityTools: number };
  systems: GrapevineSystemStatus[];
  skills: Array<{ id:string; name:string; description:string; path:string; branchKey:BranchKey; registryState:string; qualificationState:string; executionState:string; evidenceState:string; githubUrl:string }>;
}

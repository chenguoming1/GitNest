export type FileStatus = 'added' | 'modified' | 'deleted' | 'conflict';

export interface FileChange {
  filename: string;
  status: FileStatus;
  originalContent: string;
  modifiedContent: string;
}

export interface Commit {
  id: string; // Short SHA (7 chars)
  parents: string[];
  message: string;
  author: string;
  date: string;
  branchName: string; // The branch tracks (for visual column placement)
  changes: FileChange[];
  isMerged?: boolean;
}

export interface Branch {
  name: string;
  head: string; // Commit ID
  isRemote: boolean;
  color: string; // Tailwind color or custom hex for GitNest visuals
}

export interface Stash {
  id: string;
  message: string;
  changes: FileChange[];
}

export interface Conflict {
  filename: string;
  ourBranchName: string;
  theirBranchName: string;
  ourLines: string[];
  theirLines: string[];
  originalLines: string[];
  mergedLines?: string[];
  resolutionStatus: 'unresolved' | 'resolved';
}

export interface ActiveMerge {
  sourceBranch: string;
  targetBranch: string;
  status: 'pending' | 'conflict' | 'success';
  conflicts: string[];
  resolved: string[];
  mergeCommitId?: string;
}

export interface TerminalHistoryItem {
  type: 'input' | 'output' | 'error';
  text: string;
  timestamp: string;
}

export interface GitState {
  commits: Record<string, Commit>;
  branches: Record<string, Branch>;
  activeBranchName: string;
  stashes: Stash[];
  tags: Record<string, string>; // Tag Name -> Commit ID
  stagedFiles: string[]; // Filenames in staging
  unstagedFiles: FileChange[]; // Modified local files not staged yet
  conflicts: Record<string, Conflict>; // Filename -> Conflict
  activeMerge?: ActiveMerge;
  partiallyStaged?: Record<string, Array<{ text: string; type: 'addition' | 'deletion' }>>;
}

export interface HistoryState {
  past: GitState[];
  present: GitState;
  future: GitState[];
}

import React, { useState, useEffect } from 'react';
import { gitScenarios } from './data/gitScenarios';
import { GitState, Commit, FileChange, Conflict, TerminalHistoryItem } from './types';
import MacHeader from './components/MacHeader';
import Sidebar from './components/Sidebar';
import GitGraph from './components/GitGraph';
import Terminal from './components/Terminal';
import AiPanel from './components/AiPanel';
import ConflictEditor from './components/ConflictEditor';
import DiffViewer from './components/DiffViewer';

// Helper for unique commit SHAs
const generateSHA = () => Math.random().toString(16).substring(2, 9);

export default function App() {
  // Scenario selector
  const [currentScenarioId, setCurrentScenarioId] = useState('merge-conflict');

  // Multi-step Transaction Memory Layout
  const [history, setHistory] = useState<{
    past: GitState[];
    present: GitState;
    future: GitState[];
  }>(() => {
    const initialScenario = gitScenarios.find(s => s.id === 'merge-conflict') || gitScenarios[0];
    return {
      past: [],
      present: JSON.parse(JSON.stringify(initialScenario.state)),
      future: []
    };
  });

  const state = history.present;

  // Active terminal logs state
  const [terminalHistory, setTerminalHistory] = useState<TerminalHistoryItem[]>([
    {
      type: 'output',
      text: 'Initialized GitNest Visual Graph Core Sandbox v3.2.1-mac.\nWorking repository loaded with interactive scenario parameters.',
      timestamp: new Date().toLocaleTimeString()
    }
  ]);

  // Panel toggles
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [isTerminalOpen, setIsTerminalOpen] = useState(true);

  // Focus inspect details
  const [selectedCommit, setSelectedCommit] = useState<Commit | null>(null);
  const [selectedDiffFile, setSelectedDiffFile] = useState<FileChange | null>(null);
  const [activeConflictFilename, setActiveConflictFilename] = useState<string | null>(null);

  // Set initial default focus commit
  useEffect(() => {
    const activeHeadSHA = state.branches[state.activeBranchName]?.head;
    if (activeHeadSHA && state.commits[activeHeadSHA]) {
      setSelectedCommit(state.commits[activeHeadSHA]);
    }
  }, [currentScenarioId]);

  // State transaction pushing controller (for Undo/Redo)
  const updateState = (nextState: GitState, logMessage?: string, isError = false) => {
    setHistory(prev => ({
      past: [...prev.past, prev.present],
      present: JSON.parse(JSON.stringify(nextState)),
      future: []
    }));

    if (logMessage) {
      setTerminalHistory(prev => [
        ...prev,
        {
          type: isError ? 'error' : 'output',
          text: logMessage,
          timestamp: new Date().toLocaleTimeString()
        }
      ]);
    }
  };

  // General Undo/Redo trigger utilities
  const handleUndo = () => {
    if (history.past.length === 0) return;
    const previous = history.past[history.past.length - 1];
    const newPast = history.past.slice(0, history.past.length - 1);
    
    setHistory(prev => ({
      past: newPast,
      present: previous,
      future: [prev.present, ...prev.future]
    }));

    setTerminalHistory(prev => [
      ...prev,
      {
        type: 'output',
        text: 'Undo action executed successfully (restored previous git state index).',
        timestamp: new Date().toLocaleTimeString()
      }
    ]);
  };

  const handleRedo = () => {
    if (history.future.length === 0) return;
    const next = history.future[0];
    const newFuture = history.future.slice(1);

    setHistory(prev => ({
      past: [...prev.past, prev.present],
      present: next,
      future: newFuture
    }));

    setTerminalHistory(prev => [
      ...prev,
      {
        type: 'output',
        text: 'Redo action executed (re-applied forward index modification).',
        timestamp: new Date().toLocaleTimeString()
      }
    ]);
  };

  // Trigger Scenario Swap
  const handleScenarioChange = (scenarioId: string) => {
    const target = gitScenarios.find(s => s.id === scenarioId);
    if (!target) return;
    
    setCurrentScenarioId(scenarioId);
    setHistory({
      past: [],
      present: JSON.parse(JSON.stringify(target.state)),
      future: []
    });

    setSelectedDiffFile(null);
    setActiveConflictFilename(null);

    const headSHA = target.state.branches[target.state.activeBranchName]?.head;
    if (headSHA && target.state.commits[headSHA]) {
      setSelectedCommit(target.state.commits[headSHA]);
    }

    setTerminalHistory([
      {
        type: 'output',
        text: `Swapped to scenario: "${target.title}"\n${target.description}`,
        timestamp: new Date().toLocaleTimeString()
      }
    ]);
  };

  // Reset Scenario workspace
  const handleResetScenario = () => {
    handleScenarioChange(currentScenarioId);
  };

  // Stage File click or prompt
  const handleStageFile = (filename: string) => {
    if (state.stagedFiles.includes(filename)) return;
    const nextState = { ...state };
    nextState.stagedFiles = [...nextState.stagedFiles, filename];
    
    updateState(nextState, `[Git] Staged modifications in file: "${filename}"`);
  };

  // Unstage file
  const handleUnstageFile = (filename: string) => {
    const nextState = { ...state };
    nextState.stagedFiles = nextState.stagedFiles.filter(f => f !== filename);
    if (nextState.partiallyStaged) {
      delete nextState.partiallyStaged[filename];
    }
    
    updateState(nextState, `[Git] Removed staged indices for file: "${filename}"`);
  };

  const handleStageAll = () => {
    const nextState = { ...state };
    const allModNames = state.unstagedFiles.map(f => f.filename);
    nextState.stagedFiles = Array.from(new Set([...nextState.stagedFiles, ...allModNames]));
    
    updateState(nextState, `[Git] Staged all unstaged indices in workspace directory.`);
  };

  const handleUnstageAll = () => {
    const nextState = { ...state };
    nextState.stagedFiles = [];
    nextState.partiallyStaged = {};
    
    updateState(nextState, `[Git] Unstaged all active file modifications.`);
  };

  // Stage Specific Line (Hunk Staging)
  const handleStageLine = (filename: string, line: { text: string; type: 'addition' | 'deletion' }) => {
    const nextState = { ...state };
    if (!nextState.partiallyStaged) {
      nextState.partiallyStaged = {};
    }
    if (!nextState.partiallyStaged[filename]) {
      nextState.partiallyStaged[filename] = [];
    }
    
    // Check if line already staged
    const exists = nextState.partiallyStaged[filename].some(
      sl => sl.text === line.text && sl.type === line.type
    );
    if (!exists) {
      nextState.partiallyStaged[filename] = [...nextState.partiallyStaged[filename], line];
    }

    if (!nextState.stagedFiles.includes(filename)) {
      nextState.stagedFiles = [...nextState.stagedFiles, filename];
    }

    updateState(nextState, `[Git Stage] Staged line hunk in "${filename}": ${line.type === 'addition' ? '+' : '-'}"${line.text.trim()}"`);
  };

  // Unstage Specific Line
  const handleUnstageLine = (filename: string, line: { text: string; type: 'addition' | 'deletion' }) => {
    const nextState = { ...state };
    if (nextState.partiallyStaged?.[filename]) {
      nextState.partiallyStaged[filename] = nextState.partiallyStaged[filename].filter(
        sl => !(sl.text === line.text && sl.type === line.type)
      );
      if (nextState.partiallyStaged[filename].length === 0) {
        delete nextState.partiallyStaged[filename];
        // Also remove from staged list entirely
        nextState.stagedFiles = nextState.stagedFiles.filter(f => f !== filename);
      }
    }
    updateState(nextState, `[Git Stage] Unstaged line hunk in "${filename}": ${line.type === 'addition' ? '+' : '-'}"${line.text.trim()}"`);
  };

  // Commit Staged Indices
  const handleCommit = (message: string) => {
    if (state.stagedFiles.length === 0) return;

    const nextState = { ...state };
    const newSHA = generateSHA();
    const activeHeadSHA = state.branches[state.activeBranchName]?.head;

    const committedChanges: FileChange[] = [];
    const partialMap = nextState.partiallyStaged || {};

    nextState.stagedFiles.forEach(filename => {
      const fileChange = nextState.unstagedFiles.find(u => u.filename === filename);
      if (!fileChange) return;

      const stagedLines = partialMap[filename];
      if (stagedLines && stagedLines.length > 0) {
        // Partially committed!
        const committedChange: FileChange = {
          filename,
          status: 'modified',
          originalContent: fileChange.originalContent,
          modifiedContent: fileChange.originalContent + '\n' + stagedLines.map(sl => sl.text).join('\n')
        };
        committedChanges.push(committedChange);
      } else {
        // Fully committed
        committedChanges.push({ ...fileChange });
      }
    });

    const newCommit: Commit = {
      id: newSHA,
      parents: activeHeadSHA ? [activeHeadSHA] : [],
      message,
      author: 'Alex Mercer <alex@krakendev.io>',
      date: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
      branchName: state.activeBranchName,
      changes: committedChanges
    };

    // Save commit
    nextState.commits[newSHA] = newCommit;
    // Advance branch pointer
    nextState.branches[state.activeBranchName].head = newSHA;
    
    // Wipe staged
    nextState.stagedFiles = [];

    // Filter unstaged modifications list
    const updatedUnstaged: FileChange[] = [];
    state.unstagedFiles.forEach(f => {
      const stagedLines = partialMap[f.filename];
      if (stagedLines && stagedLines.length > 0) {
        // Keep file unstaged but advance its original content base
        updatedUnstaged.push({
          ...f,
          originalContent: f.originalContent + '\n' + stagedLines.map(sl => sl.text).join('\n')
        });
      } else if (!state.stagedFiles.includes(f.filename)) {
        // File wasn't staged at all, so keep it unchanged
        updatedUnstaged.push(f);
      }
    });

    nextState.unstagedFiles = updatedUnstaged;
    nextState.partiallyStaged = {}; // Clear partial indices after commit

    setSelectedCommit(newCommit);
    setSelectedDiffFile(null);

    updateState(
      nextState, 
      `[Git commit] Created new visual commit ${newSHA} on branch "${state.activeBranchName}"\nMessage: "${message.split('\n')[0]}"`
    );
  };

  // Revert a Commit
  const handleRevertCommit = (commitId: string) => {
    const targetCommit = state.commits[commitId];
    if (!targetCommit) return;

    const nextState = { ...state };
    const newSHA = generateSHA();
    const activeHeadSHA = state.branches[state.activeBranchName]?.head;

    // Inside revert, we inverse targetCommit.changes
    const reversedChanges: FileChange[] = targetCommit.changes.map(ch => {
      // Swapping modified and original contents to invert effects
      return {
        filename: ch.filename,
        status: ch.status === 'added' ? 'deleted' : ch.status === 'deleted' ? 'added' : 'modified',
        originalContent: ch.modifiedContent || '',
        modifiedContent: ch.originalContent || ''
      };
    });

    const revertCommit: Commit = {
      id: newSHA,
      parents: activeHeadSHA ? [activeHeadSHA] : [],
      message: `Revert "${targetCommit.message.split('\n')[0]}"\n\nThis reverts commit ${commitId}.`,
      author: 'Alex Mercer <alex@krakendev.io>',
      date: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
      branchName: state.activeBranchName,
      changes: reversedChanges
    };

    nextState.commits[newSHA] = revertCommit;
    nextState.branches[state.activeBranchName].head = newSHA;
    
    setSelectedCommit(revertCommit);
    setSelectedDiffFile(null);

    updateState(
      nextState,
      `[Git revert] Successfully reverted commit ${commitId}. Created new revert node commit ${newSHA} on branch "${state.activeBranchName}".`
    );
  };

  // Cherry Pick a Commit
  const handleCherryPickCommit = (commitId: string) => {
    const targetCommit = state.commits[commitId];
    if (!targetCommit) return;

    const nextState = { ...state };
    const newSHA = generateSHA();
    const activeHeadSHA = state.branches[state.activeBranchName]?.head;

    const cherryChanges: FileChange[] = targetCommit.changes.map(ch => ({
      ...ch
    }));

    const cherryCommit: Commit = {
      id: newSHA,
      parents: activeHeadSHA ? [activeHeadSHA] : [],
      message: `Cherry-picked: ${targetCommit.message.split('\n')[0]}\n\n(cherry-picked from commit ${commitId})`,
      author: targetCommit.author,
      date: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
      branchName: state.activeBranchName,
      changes: cherryChanges
    };

    nextState.commits[newSHA] = cherryCommit;
    nextState.branches[state.activeBranchName].head = newSHA;
    
    setSelectedCommit(cherryCommit);
    setSelectedDiffFile(null);

    updateState(
      nextState,
      `[Git cherry-pick] Successfully cherry-picked commit ${commitId} onto "${state.activeBranchName}". Created new commit ${newSHA}.`
    );
  };

  // Resolve conflict in place
  const handleResolveConflict = (filename: string) => {
    setActiveConflictFilename(filename);
  };

  // Dismiss visual merge HUD
  const handleDismissMerge = () => {
    const nextState = { ...state };
    nextState.activeMerge = undefined;
    updateState(nextState, `[Git HUD] Dismissed visual merge tracker overview.`);
  };

  // Branch Checkout Swap
  const handleCheckout = (branchName: string) => {
    if (!state.branches[branchName]) return;
    
    const nextState = { ...state };
    nextState.activeBranchName = branchName;

    const newHeadSHA = nextState.branches[branchName].head;
    const headCommit = nextState.commits[newHeadSHA] || null;
    setSelectedCommit(headCommit);

    updateState(nextState, `[Git checkout] Switched to branch "${branchName}" at commit [${newHeadSHA}]`);
  };

  // Create local branch setup
  const handleNewBranch = (name: string) => {
    const trimmed = name.trim().toLowerCase().replace(/\s+/g, '-');
    if (!trimmed) return;

    if (state.branches[trimmed]) {
      setTerminalHistory(prev => [
        ...prev,
        {
          type: 'error',
          text: `[Git branch error] A branch named "${trimmed}" already exists in the repository.`,
          timestamp: new Date().toLocaleTimeString()
        }
      ]);
      return;
    }

    const nextState = { ...state };
    const headSHA = state.branches[state.activeBranchName]?.head;

    // Visual Color Assignment
    const availableColors = ['#f472b6', '#fbbf24', '#38bdf8', '#f87171', '#c084fc', '#4ade80'];
    const randomColor = availableColors[Math.floor(Math.random() * availableColors.length)];

    nextState.branches[trimmed] = {
      name: trimmed,
      head: headSHA,
      isRemote: false,
      color: randomColor
    };

    updateState(nextState, `[Git branch] Created new tracking branch "${trimmed}" pointing to commit [${headSHA}]`);
  };

  // SHELVE ACTIVE STASH ACTION
  const handleStash = () => {
    if (state.unstagedFiles.length === 0) {
      setTerminalHistory(prev => [
        ...prev,
        {
          type: 'error',
          text: `[Git stash error] No local modifications found. Directory is clean. Working tree nothing to stash.`,
          timestamp: new Date().toLocaleTimeString()
        }
      ]);
      return;
    }

    const nextState = { ...state };
    const newStashId = `stash@{${state.stashes.length}}`;
    const stashMsg = `WIP on ${state.activeBranchName}: shelved file modifications`;

    nextState.stashes = [
      {
        id: newStashId,
        message: stashMsg,
        changes: [...state.unstagedFiles]
      },
      ...state.stashes
    ];

    nextState.unstagedFiles = [];
    nextState.stagedFiles = [];
    setSelectedDiffFile(null);

    updateState(nextState, `[Git stash] Shelved local modified files securely to index stack list: "${newStashId}"`);
  };

  // RESTORE POP STASH ACTION
  const handlePopStash = () => {
    if (state.stashes.length === 0) return;

    const nextState = { ...state };
    const popped = nextState.stashes[0];
    
    // Delete stash
    nextState.stashes = nextState.stashes.slice(1);
    
    // Add files back to unstaged
    const existingFilenames = nextState.unstagedFiles.map(u => u.filename);
    popped.changes.forEach(change => {
      if (!existingFilenames.includes(change.filename)) {
        nextState.unstagedFiles.push(change);
      }
    });

    updateState(nextState, `[Git stash pop] Restored file index modifications from index buffer: "${popped.id}"`);
  };

  // TRIGGER MERGIAN LOGIC
  const handleMerge = (sourceBranch: string, targetBranch: string) => {
    const source = state.branches[sourceBranch];
    const target = state.branches[targetBranch];

    if (!source || !target) return;

    const nextState = { ...state };

    // Fast Forward calculations
    if (source.head === target.head) {
      updateState(nextState, `[Git merge] Branches are already in sync. No actions computed.`);
      return;
    }

    // Merge conflicts checks for Scenario 'merge-conflict'
    if (sourceBranch === 'feature/auth' && targetBranch === 'main') {
      // Create concrete Merge Conflicts!
      nextState.conflicts['index.html'] = {
        filename: 'index.html',
        ourBranchName: 'main',
        theirBranchName: 'feature/auth',
        ourLines: [
          '<!DOCTYPE html>',
          '<html>',
          '<head>',
          '  <title>Nest Core - Production Site</title>',
          '</head>',
          '<body>',
          '  <header><h1>Nest Core Portal</h1></header>',
          '  <div id="root"></div>'
        ],
        theirLines: [
          '<!DOCTYPE html>',
          '<html>',
          '<head>',
          '  <title>Enterprise Security Center</title>',
          '</head>',
          '<body>',
          '  <nav id="auth-nav">Login Panel</nav>',
          '  <div id="root"></div>',
          '  <footer>Secured by OAuth 2.0</footer>'
        ],
        originalLines: [
          '<!DOCTYPE html>',
          '<html>',
          '<head>',
          '  <title>App</title>',
          '</head>',
          '<body>',
          '  <div id="root"></div>'
        ],
        resolutionStatus: 'unresolved'
      };

      nextState.conflicts['api.ts'] = {
        filename: 'api.ts',
        ourBranchName: 'main',
        theirBranchName: 'feature/auth',
        ourLines: [
          'export const fetchUser = async (id: string) => {',
          '  console.log("Routing via master API gateway");',
          '  const res = await fetch(`/api/users/${id}`);',
          '  return res.json();',
          '};'
        ],
        theirLines: [
          'export const fetchUser = async (authToken: string) => {',
          '  console.log("Verifying token via OAuth callback");',
          '  const res = await fetch("/api/auth/token", {',
          '    headers: { Authorization: `Bearer ${authToken}` }',
          '  });',
          '  return res.ok ? res.json() : null;',
          '};'
        ],
        originalLines: [
          'export const fetchUser = () => { return null; };'
        ],
        resolutionStatus: 'unresolved'
      };

      // Put files under local modifications holding zone flagged as 'conflict status'
      nextState.unstagedFiles = [
        ...nextState.unstagedFiles,
        {
          filename: 'index.html',
          status: 'conflict',
          originalContent: nextState.conflicts['index.html'].originalLines.join('\n'),
          modifiedContent: nextState.conflicts['index.html'].ourLines.join('\n')
        },
        {
          filename: 'api.ts',
          status: 'conflict',
          originalContent: nextState.conflicts['api.ts'].originalLines.join('\n'),
          modifiedContent: nextState.conflicts['api.ts'].ourLines.join('\n')
        }
      ];

      // Enable the activeMerge visual tracking HUD state
      nextState.activeMerge = {
        sourceBranch,
        targetBranch,
        status: 'conflict',
        conflicts: ['index.html', 'api.ts'],
        resolved: []
      };

      setActiveConflictFilename('index.html');
      updateState(nextState, `[Git merge warning] Auto-merging failed on files "index.html" and "api.ts". Merge conflicts identified! Complete the visual lines merge editor now to resolve.`, true);
      return;
    }

    // Normal successful Clean Merge calculation
    const newMergeSHA = generateSHA();
    const mergeCommit: Commit = {
      id: newMergeSHA,
      parents: [target.head, source.head],
      message: `Merge branch '${sourceBranch}' into '${targetBranch}'`,
      author: 'Alex Mercer <alex@krakendev.io>',
      date: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
      branchName: targetBranch,
      changes: []
    };

    nextState.commits[newMergeSHA] = mergeCommit;
    nextState.branches[targetBranch].head = newMergeSHA;
    setSelectedCommit(mergeCommit);

    // Track active successful merge pipeline
    nextState.activeMerge = {
      sourceBranch,
      targetBranch,
      status: 'success',
      conflicts: [],
      resolved: [],
      mergeCommitId: newMergeSHA
    };

    updateState(nextState, `[Git merge successful] Integrated branch files trace for "${sourceBranch}" into "${targetBranch}". Created merge node commit [${newMergeSHA}].`);
  };

  // CHERRY CHOP REBASE RESOLVER HELPERS
  const handleRebase = (sourceBranch: string, targetBranch: string) => {
    // Rebase active branch target (e.g. feature/ui) onto base (e.g. dev)
    const baseCommitSHA = state.branches[targetBranch]?.head;
    const sourceCommitSHA = state.branches[sourceBranch]?.head;

    if (!baseCommitSHA || !sourceCommitSHA) return;

    const nextState = { ...state };

    // Linear Rebase simulation: Identify commits belonging exclusively to feature branch
    // (i.e., those in cherry pathway up to divergent base point)
    // Here we can easily slice or rebuild the tracking tree for 'ff22ff2', 'ff33ff3', 'ff44ff4' onto dev's HEAD 'dd22dd2'
    const newSHA1 = 're_ff22ff2';
    const newSHA2 = 're_ff33ff3';
    const newSHA3 = 're_ff44ff4';

    nextState.commits[newSHA1] = {
      id: newSHA1,
      parents: [baseCommitSHA],
      message: 'feature/ui: Add Glassmorphism navigation panel [REBASE HASH]',
      author: 'Alex Mercer <alex@krakendev.io>',
      date: 'May 17, 2026',
      branchName: sourceBranch,
      changes: []
    };

    nextState.commits[newSHA2] = {
      id: newSHA2,
      parents: [newSHA1],
      message: 'feature/ui: Implement Sidebar collapser state [REBASE HASH]',
      author: 'Alex Mercer <alex@krakendev.io>',
      date: 'May 18, 2026',
      branchName: sourceBranch,
      changes: []
    };

    nextState.commits[newSHA3] = {
      id: newSHA3,
      parents: [newSHA2],
      message: 'feature/ui: Styled responsive grid of custom tool cards [REBASE HASH]',
      author: 'Alex Mercer <alex@krakendev.io>',
      date: 'May 19, 2026',
      branchName: sourceBranch,
      changes: []
    };

    nextState.branches[sourceBranch].head = newSHA3;
    setSelectedCommit(nextState.commits[newSHA3]);

    updateState(nextState, `[Git rebase] Cherry-picked 3 commits from target path and re-aligned them linearly on branch "${targetBranch}" at commit [${baseCommitSHA}]`);
  };

  // SAVE CONFLICT RESOLUTIONS LINE BY LINE
  const handleSaveResolution = (filename: string, resolvedLines: string[]) => {
    const nextState = { ...state };

    // Update conflict records
    if (nextState.conflicts[filename]) {
      nextState.conflicts[filename].resolutionStatus = 'resolved';
      nextState.conflicts[filename].mergedLines = resolvedLines;
    }

    // Update active visual merge flow
    if (nextState.activeMerge) {
      if (!nextState.activeMerge.resolved.includes(filename)) {
        nextState.activeMerge.resolved = [...nextState.activeMerge.resolved, filename];
      }
      nextState.activeMerge.conflicts = nextState.activeMerge.conflicts.filter(c => c !== filename);
    }

    // Remodify index file status under unstaged/staged
    nextState.unstagedFiles = nextState.unstagedFiles.filter(f => f.filename !== filename);
    nextState.stagedFiles = [...nextState.stagedFiles, filename];

    // Check if ALL conflicts are resolved now
    const unresolvedFiles = (Object.values(nextState.conflicts) as Conflict[]).filter(c => c.resolutionStatus === 'unresolved');
    
    if (unresolvedFiles.length === 0) {
      // Create final Merge Commit!
      const mainBranch = nextState.branches['main'];
      const featureBranch = nextState.branches['feature/auth'];
      const mergeSHA = generateSHA();

      const resolvedCommit: Commit = {
        id: mergeSHA,
        parents: [mainBranch.head, featureBranch.head],
        message: `Merge branch 'feature/auth' into 'main'\n\nConflicts resolved in line-by-line interactive visual editor on index.html and api.ts.`,
        author: 'Alex Mercer <alex@krakendev.io>',
        date: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
        branchName: 'main',
        changes: [
          {
            filename: 'index.html',
            status: 'modified',
            originalContent: '',
            modifiedContent: resolvedLines.join('\n')
          }
        ]
      };

      nextState.commits[mergeSHA] = resolvedCommit;
      mainBranch.head = mergeSHA;
      
      // Update visual merge manager HUD to success
      if (nextState.activeMerge) {
        nextState.activeMerge.status = 'success';
        nextState.activeMerge.mergeCommitId = mergeSHA;
      }

      // Wipe conflicts tracking record
      nextState.conflicts = {};
      nextState.stagedFiles = [];

      setSelectedCommit(resolvedCommit);
      setActiveConflictFilename(null);
      setSelectedDiffFile(null);

      updateState(nextState, `[Conflict resolved] Successfully resolved all file merges! Created visual resolution merge node commit [${mergeSHA}].`);
    } else {
      // Advance to next unresolved file conflict
      const nextConflict = unresolvedFiles[0];
      setActiveConflictFilename(nextConflict.filename);
      updateState(nextState, `[Conflict saved] Saved resolution for "${filename}". Moving to resolve next file: "${nextConflict.filename}"`);
    }
  };

  // COMMAND EXECUTER SHELL PARSING ROUTER
  const handleExecuteCommand = (cmdStr: string) => {
    const nextState = { ...state };
    
    // Push typed input to shell logs immediately
    setTerminalHistory(prev => [
      ...prev,
      {
        type: 'input',
        text: cmdStr,
        timestamp: new Date().toLocaleTimeString()
      }
    ]);

    const parts = cmdStr.trim().split(/\s+/);
    if (parts[0] !== 'git') {
      setTerminalHistory(prev => [
        ...prev,
        {
          type: 'error',
          text: `Shell error: Command "${parts[0]}" not recognized. This workspace only matches Git operations (e.g. type 'git status').`,
          timestamp: new Date().toLocaleTimeString()
        }
      ]);
      return;
    }

    const sub = parts[1];
    if (!sub) {
      setTerminalHistory(prev => [
        ...prev,
        {
          type: 'error',
          text: `[Git CLI Error] Please provide a valid subcommand. Try 'git status' or 'git log'.`,
          timestamp: new Date().toLocaleTimeString()
        }
      ]);
      return;
    }

    // Git checkout routing
    if (sub === 'checkout') {
      const bName = parts[2];
      if (!bName) {
        setTerminalHistory(prev => [
          ...prev,
          {
            type: 'error',
            text: `[Git CLI error] Branch target expected. Usage: 'git checkout <branch_name>'`,
            timestamp: new Date().toLocaleTimeString()
          }
        ]);
        return;
      }

      if (!state.branches[bName]) {
        setTerminalHistory(prev => [
          ...prev,
          {
            type: 'error',
            text: `[Git checkout error] Pathspec branch name "${bName}" does not match any file or available track in this Git repository.`,
            timestamp: new Date().toLocaleTimeString()
          }
        ]);
        return;
      }

      handleCheckout(bName);
      return;
    }

    // Git branch routing
    if (sub === 'branch') {
      const bName = parts[2];
      if (!bName) {
        // Output lists of branches
        const listing = Object.keys(state.branches).map(b => `${b === state.activeBranchName ? '* ' : '  '}${b}`).join('\n');
        setTerminalHistory(prev => [
          ...prev,
          {
            type: 'output',
            text: listing,
            timestamp: new Date().toLocaleTimeString()
          }
        ]);
        return;
      }

      handleNewBranch(bName);
      return;
    }

    // Git commit routing
    if (sub === 'commit') {
      // Find -m parameter
      const mIdx = parts.indexOf('-m');
      if (mIdx === -1 || !parts[mIdx + 1]) {
        setTerminalHistory(prev => [
          ...prev,
          {
            type: 'error',
            text: `[Git CLI Error] Message string expected. Usage: git commit -m "Commit description words..."`,
            timestamp: new Date().toLocaleTimeString()
          }
        ]);
        return;
      }

      // Re-extract complete message enclosed in quotes
      const quoteMatch = cmdStr.match(/-m\s+["']([^"']+)["']/);
      const msg = quoteMatch ? quoteMatch[1] : parts.slice(mIdx + 1).join(' ').replace(/["']/g, '');

      if (state.stagedFiles.length === 0) {
        setTerminalHistory(prev => [
          ...prev,
          {
            type: 'error',
            text: `[Git CLI Error] Nothing to commit, index is empty. Run 'add' or stage files in the Sidebar panel first.`,
            timestamp: new Date().toLocaleTimeString()
          }
        ]);
        return;
      }

      handleCommit(msg);
      return;
    }

    // Git status routing
    if (sub === 'status') {
      const trackingBranch = state.activeBranchName;
      const stagedList = state.stagedFiles.map(f => `\tstaged:    ${f}`).join('\n');
      const unstagedList = state.unstagedFiles
        .filter(f => !state.stagedFiles.includes(f.filename))
        .map(f => `\tmodified:  ${f.filename}`).join('\n');

      const outputTrace = `On branch ${trackingBranch}\nYour branch is up to date with 'origin/${trackingBranch}'.\n\nChanges to be committed:\n${stagedList || '\t(no files staged for commit)'}\n\nChanges not staged for commit:\n${unstagedList || '\t(working tree clean, list empty)'}`;

      setTerminalHistory(prev => [
        ...prev,
        {
          type: 'output',
          text: outputTrace,
          timestamp: new Date().toLocaleTimeString()
        }
      ]);
      return;
    }

    // Git log routing
    if (sub === 'log') {
      const list: string[] = [];
      let nextCommitSHA = state.branches[state.activeBranchName]?.head;
      
      while (nextCommitSHA && state.commits[nextCommitSHA]) {
        const c = state.commits[nextCommitSHA];
        list.push(`commit ${c.id}\nAuthor: ${c.author}\nDate:   ${c.date}\n\n\t${c.message.split('\n')[0]}\n`);
        nextCommitSHA = c.parents[0]; // Trace back via main parents chain
      }

      setTerminalHistory(prev => [
        ...prev,
        {
          type: 'output',
          text: list.join('\n') || 'No commits found on tracking path.',
          timestamp: new Date().toLocaleTimeString()
        }
      ]);
      return;
    }

    // Git stash routing
    if (sub === 'stash') {
      const popIdx = parts.indexOf('pop');
      if (popIdx !== -1 || parts[2] === 'pop') {
        handlePopStash();
      } else {
        handleStash();
      }
      return;
    }

    // Git add routing (staging helpers)
    if (sub === 'add') {
      const targetPath = parts[2];
      if (!targetPath) {
        setTerminalHistory(prev => [
          ...prev,
          {
            type: 'error',
            text: `[Git CLI Error] Target required. Use 'git add <filename>' or 'git add .'`,
            timestamp: new Date().toLocaleTimeString()
          }
        ]);
        return;
      }

      if (targetPath === '.' || targetPath === '-A') {
        handleStageAll();
      } else {
        const exists = state.unstagedFiles.find(u => u.filename === targetPath);
        if (exists) {
          handleStageFile(targetPath);
        } else {
          setTerminalHistory(prev => [
            ...prev,
            {
              type: 'error',
              text: `[Git CLI Error] File path specifier "${targetPath}" did not match any modified index in the tree directory.`,
              timestamp: new Date().toLocaleTimeString()
            }
          ]);
        }
      }
      return;
    }

    // Git Merge routing
    if (sub === 'merge') {
      const srcName = parts[2];
      if (!srcName) {
        setTerminalHistory(prev => [
          ...prev,
          {
            type: 'error',
            text: `[Git CLI Error] Source branch expected. Usage: git merge <branch>`,
            timestamp: new Date().toLocaleTimeString()
          }
        ]);
        return;
      }

      handleMerge(srcName, state.activeBranchName);
      return;
    }

    // Git Rebase routing
    if (sub === 'rebase') {
      const targetName = parts[2];
      if (!targetName) {
        setTerminalHistory(prev => [
          ...prev,
          {
            type: 'error',
            text: `[Git rebase CLI Error] Base target expected. Usage: git rebase <base_branch>`,
            timestamp: new Date().toLocaleTimeString()
          }
        ]);
        return;
      }

      handleRebase(state.activeBranchName, targetName);
      return;
    }

    // Git reset routing
    if (sub === 'reset') {
      if (cmdStr.toLowerCase().includes('--hard')) {
        nextState.stagedFiles = [];
        nextState.unstagedFiles = [];
        setSelectedDiffFile(null);
        updateState(nextState, `[Git CLI hard reset] Cleared all staged indices and removed all local modified file arrays completely. Working directory is clean.`);
      } else {
        handleUnstageAll();
      }
      return;
    }

    // Help trace fallback
    setTerminalHistory(prev => [
      ...prev,
      {
        type: 'error',
        text: `[Git CLI Warning] Git subcommand "${sub}" is currently modeled simulation-only. Use the visual side panel tabs, drag-and-drop nodes, or write standard git commands like checkout, commit, status, branch, or stash.`,
        timestamp: new Date().toLocaleTimeString()
      }
    ]);
  };

  const handleClearHistory = () => {
    setTerminalHistory([
      {
        type: 'output',
        text: 'Terminal logs cleared by local operator index buffer.',
        timestamp: new Date().toLocaleTimeString()
      }
    ]);
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#0c0a09] text-white">
      
      {/* 1. Traffic Lights and Scenarios Headbar */}
      <MacHeader
        currentScenario={currentScenarioId}
        onScenarioChange={handleScenarioChange}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={history.past.length > 0}
        canRedo={history.future.length > 0}
        onNewBranchClick={() => {
          const name = prompt('Enter a new visual Git branch name (hyphenated):');
          if (name) handleNewBranch(name);
        }}
        onStashClick={handleStash}
        onPopClick={handlePopStash}
        onResetScenario={handleResetScenario}
        isAiOpen={isAiOpen}
        onToggleAi={() => setIsAiOpen(!isAiOpen)}
        isTerminalOpen={isTerminalOpen}
        onToggleTerminal={() => setIsTerminalOpen(!isTerminalOpen)}
        stashCount={state.stashes.length}
      />

      {/* 2. Main Workspace Split Panel */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        
        {/* SIDE BAR TRAC CONTROL */}
        <Sidebar
          state={state}
          onCheckout={handleCheckout}
          onStageFile={handleStageFile}
          onUnstageFile={handleUnstageFile}
          onStageAll={handleStageAll}
          onUnstageAll={handleUnstageAll}
          onCommit={handleCommit}
          onSelectFileToDiff={setSelectedDiffFile}
          selectedDiffFile={selectedDiffFile}
        />

        {/* Dynamic Center Workstation Component */}
        <main className="flex-1 flex flex-col overflow-hidden min-h-0 relative border-r border-zinc-850">
          
          <div className="flex-1 flex relative min-h-0 overflow-hidden">
            {activeConflictFilename && state.conflicts[activeConflictFilename] ? (
              // 1. Conflict Visual Resolver mode
              <ConflictEditor
                filename={activeConflictFilename}
                conflict={state.conflicts[activeConflictFilename]}
                onSaveResolution={handleSaveResolution}
                onSkip={() => setActiveConflictFilename(null)}
              />
            ) : selectedDiffFile ? (
              // 2. Diff viewer inspector mode
              <DiffViewer
                file={selectedDiffFile}
                onClose={() => setSelectedDiffFile(null)}
                onStage={handleStageFile}
                onUnstage={handleUnstageFile}
                isStaged={state.stagedFiles.includes(selectedDiffFile.filename)}
                stagedLines={state.partiallyStaged?.[selectedDiffFile.filename] || []}
                onStageLine={handleStageLine}
                onUnstageLine={handleUnstageLine}
              />
            ) : (
              // 3. Main Git visual railway tracks mode
              <GitGraph
                state={state}
                onSelectCommit={setSelectedCommit}
                selectedCommit={selectedCommit}
                onSelectFileToDiff={setSelectedDiffFile}
                onVisualMerge={handleMerge}
                onVisualRebase={handleRebase}
                onRevertCommit={handleRevertCommit}
                onCherryPickCommit={handleCherryPickCommit}
                onResolveConflict={handleResolveConflict}
                onDismissMerge={handleDismissMerge}
              />
            )}
          </div>

          {/* Expanded Bottom Console Command box */}
          {isTerminalOpen && (
            <Terminal
              state={state}
              history={terminalHistory}
              onExecuteCommand={handleExecuteCommand}
              onClearHistory={handleClearHistory}
            />
          )}

        </main>

        {/* Smart AI helper panel dock */}
        <AiPanel
          state={state}
          isOpen={isAiOpen}
          onClose={() => setIsAiOpen(false)}
        />

      </div>

    </div>
  );
}

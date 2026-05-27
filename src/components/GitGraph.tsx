import React, { useMemo } from 'react';
import { 
  GitCommit, 
  GitMerge, 
  User, 
  Calendar, 
  ArrowRight,
  GitPullRequest,
  CheckCircle2,
  FileText,
  MousePointerClick
} from 'lucide-react';
import { GitState, Commit, FileChange } from '../types';
import { BRANCH_COLORS } from '../data/gitScenarios';

interface GitGraphProps {
  state: GitState;
  onSelectCommit: (commit: Commit) => void;
  selectedCommit: Commit | null;
  onSelectFileToDiff: (file: FileChange | null) => void;
  onVisualMerge: (source: string, target: string) => void;
  onVisualRebase: (source: string, target: string) => void;
  onRevertCommit?: (commitId: string) => void;
  onCherryPickCommit?: (commitId: string) => void;
  onResolveConflict?: (filename: string) => void;
  onDismissMerge?: () => void;
}

export default function GitGraph({
  state,
  onSelectCommit,
  selectedCommit,
  onSelectFileToDiff,
  onVisualMerge,
  onVisualRebase,
  onRevertCommit,
  onCherryPickCommit,
  onResolveConflict,
  onDismissMerge
}: GitGraphProps) {

  // Layout Parser: Compute position of each commit in the visual graph topology
  const graphLayout = useMemo(() => {
    // 1. Gather all commits and sort them chronologically/topologically
    // To ensure parent is always below child, we do a simple relative ranking.
    const allCommits = Object.values(state.commits);
    
    // Define columns for unique branch tracks
    const branchNames = Array.from(new Set(allCommits.map(c => c.branchName)));
    // Prioritize main/master to column 0, dev to column 1, then others
    branchNames.sort((a, b) => {
      if (a === 'main' || a === 'master') return -1;
      if (b === 'main' || b === 'master') return 1;
      if (a === 'dev') return -1;
      if (b === 'dev') return 1;
      return a.localeCompare(b);
    });

    const branchToColumn: Record<string, number> = {};
    branchNames.forEach((name, idx) => {
      branchToColumn[name] = idx;
    });

    // We rank commits topologically
    // Find terminal leaves (commits without child nodes) to compute logical depths.
    const childMap: Record<string, string[]> = {};
    allCommits.forEach(c => {
      c.parents.forEach(p => {
        if (!childMap[p]) childMap[p] = [];
        childMap[p].push(c.id);
      });
    });

    // Simple levels assigner
    const levels: Record<string, number> = {};
    
    function assignLevel(id: string, currentLevel: number) {
      if (levels[id] !== undefined && levels[id] >= currentLevel) return;
      levels[id] = currentLevel;
      const commit = state.commits[id];
      if (commit) {
        commit.parents.forEach(p => {
          assignLevel(p, currentLevel + 1);
        });
      }
    }

    // Initialize from leafs
    const leafCommits = allCommits.filter(c => !childMap[c.id] || childMap[c.id].length === 0);
    leafCommits.forEach(lf => {
      assignLevel(lf.id, 0);
    });

    // Build plotted nodes
    const nodeRadius = 9;
    const rowHeight = 70;
    const columnWidth = 85;
    const paddingLeft = 45;
    const paddingTop = 40;

    const nodes = allCommits.map(c => {
      const col = branchToColumn[c.branchName] ?? 0;
      const level = levels[c.id] ?? 0;
      
      return {
        id: c.id,
        commit: c,
        x: paddingLeft + col * columnWidth,
        y: paddingTop + level * rowHeight,
        color: BRANCH_COLORS[c.branchName] || '#10b981',
        isActive: state.branches[state.activeBranchName]?.head === c.id
      };
    });

    // Order nodes descending by y so recent commits (smaller level/y) render topmost visually
    nodes.sort((a, b) => a.y - b.y);

    // Compute beautiful bezier routing paths between children and parent commits
    const paths: Array<{ id: string; d: string; color: string; branch: string }> = [];
    nodes.forEach(node => {
      node.commit.parents.forEach(parentId => {
        const parentNode = nodes.find(n => n.id === parentId);
        if (parentNode) {
          // Drawing a cubic Bezier curve to simulate railway track curvature
          const x1 = node.x;
          const y1 = node.y;
          const x2 = parentNode.x;
          const y2 = parentNode.y;
          const midY = (y1 + y2) / 2;
          
          let d = '';
          if (x1 === x2) {
            // Straight vertical line
            d = `M ${x1} ${y1} L ${x2} ${y2}`;
          } else {
            // Curvy path
            d = `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;
          }

          // Use the branch color of the child commit for routing lines
          paths.push({
            id: `${node.id}-${parentId}`,
            d,
            color: node.color,
            branch: node.commit.branchName
          });
        }
      });
    });

    // Compute active branch tags pointing to head nodes
    const branchTags: Array<{
      name: string;
      commitId: string;
      x: number;
      y: number;
      color: string;
      isCurrent: boolean;
      isRemote: boolean;
    }> = [];

    Object.values(state.branches).forEach(b => {
      const headNode = nodes.find(n => n.id === b.head);
      if (headNode) {
        branchTags.push({
          name: b.name,
          commitId: b.head,
          x: headNode.x,
          y: headNode.y,
          color: b.color,
          isCurrent: b.name === state.activeBranchName,
          isRemote: b.isRemote
        });
      }
    });

    return { nodes, paths, branchTags, height: Math.max(...nodes.map(n => n.y), 300) + 100 };
  }, [state.commits, state.branches, state.activeBranchName]);

  const activeHeadSHA = state.branches[state.activeBranchName]?.head;

  return (
    <div className="flex-1 flex flex-col bg-[#121212] p-4 text-xs select-none min-h-0 overflow-hidden relative">
      
      {/* Title indicator bar */}
      <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4 shrink-0">
        <div className="flex items-center gap-2">
          <GitCommit size={15} className="text-blue-400 animate-pulse" />
          <h2 className="text-white/80 font-semibold text-sm tracking-tight font-sans">
            Interactive Branch Graph Canvas
          </h2>
        </div>
        
        <div className="flex items-center gap-4 text-white/30 text-[10px] uppercase font-mono tracking-widest">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <span>Main Track</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
            <span>Dev Branch</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-pink-400" />
            <span>Feature Path</span>
          </div>
        </div>
      </div>

      {/* VISUAL BRANCH MERGE MANAGER HUD */}
      {state.activeMerge && (
        <div className="mb-4 bg-[#181818]/95 border border-white/10 rounded-2xl p-4 shadow-2xl relative shrink-0">
          <div className="flex items-center justify-between border-b border-white/5 pb-2.5 mb-3.5">
            <div className="flex items-center gap-2">
              <GitMerge size={15} className={`text-blue-400 ${state.activeMerge.status === 'conflict' ? 'animate-pulse text-amber-500' : 'text-emerald-400'}`} />
              <span className="font-semibold text-xs tracking-tight uppercase text-white/80 font-sans">
                {state.activeMerge.status === 'conflict' ? 'Merge Conflict Resolution Dashboard' : 'Branch Integration Pipeline Completed'}
              </span>
            </div>
            
            <button 
              onClick={() => onDismissMerge?.()}
              className="text-[10px] text-white/40 hover:text-white bg-white/5 px-2 py-0.5 rounded border border-white/5 hover:bg-white/10 transition-colors cursor-pointer"
            >
              ✕ Clear HUD
            </button>
          </div>

          {/* Incoming vs Outgoing Visual Converge Diagram */}
          <div className="flex flex-col md:flex-row items-center justify-around py-4 bg-[#101010]/80 border border-white/5 rounded-xl mb-3.5 relative overflow-hidden">
            {/* Background Grid Accent */}
            <div className="absolute inset-0 opacity-5 pointer-events-none bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:10px_10px]" />
            
            {/* Target Branch Outgoing */}
            <div className="flex items-center gap-3 relative z-10">
              <div className="flex flex-col items-center md:items-start">
                <span className="text-white/30 text-[9px] uppercase font-mono tracking-wider mb-1">Target / Outgoing</span>
                <div className="px-3 py-1.5 rounded-lg bg-cyan-950/20 text-cyan-400 border border-cyan-800/40 font-mono text-[11px] font-bold shadow-sm">
                  {state.activeMerge.targetBranch}
                </div>
              </div>
            </div>

            {/* Convergence schematic line arrows */}
            <div className="flex items-center gap-3 px-5 py-2 border border-white/5 bg-[#141414] rounded-full my-3 md:my-0 shadow-inner select-none relative z-10">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
              <ArrowRight size={13} className="text-white/20 animate-pulse" />
              <span className={`font-mono text-[10px] font-bold tracking-widest ${state.activeMerge.status === 'conflict' ? 'text-amber-400 animate-pulse' : 'text-emerald-400'}`}>
                {state.activeMerge.status === 'conflict' ? '⚠️ 2 BLOCKS CONFLICT' : '★ SYNC SUCCESSFUL'}
              </span>
              <ArrowRight size={13} className="text-white/20 animate-pulse" />
              <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-ping" />
            </div>

            {/* Source Branch Incoming */}
            <div className="flex items-center gap-3 relative z-10">
              <div className="flex flex-col items-center md:items-end">
                <span className="text-white/30 text-[9px] uppercase font-mono tracking-wider mb-1">Incoming / Source</span>
                <div className="px-3 py-1.5 rounded-lg bg-pink-950/20 text-pink-400 border border-pink-800/40 font-mono text-[11px] font-bold shadow-sm">
                  {state.activeMerge.sourceBranch}
                </div>
              </div>
            </div>
          </div>

          {state.activeMerge.status === 'conflict' ? (
            <div>
              <div className="text-[10px] text-amber-500 font-bold uppercase tracking-widest mb-2 px-1">Conflicted blocks demanding interactive resolve:</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {state.activeMerge.conflicts.map(filename => (
                  <div key={filename} className="flex items-center justify-between p-3 bg-red-950/5 hover:bg-red-950/10 border border-red-500/20 hover:border-red-500/30 rounded-xl transition-all">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      <span className="font-mono text-[11px] text-zinc-200 font-medium">{filename}</span>
                    </div>
                    <button
                      onClick={() => onResolveConflict?.(filename)}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold text-[10.5px] rounded-lg transition-all shadow-lg shadow-red-600/15 cursor-pointer hover:scale-103"
                    >
                      Resolve Code Conflicts
                    </button>
                  </div>
                ))}
                
                {state.activeMerge.resolved.map(filename => (
                  <div key={filename} className="flex items-center justify-between p-3 bg-emerald-950/5 border border-emerald-500/15 rounded-xl">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="font-mono text-[11px] text-zinc-500 line-through font-medium">{filename}</span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 size={12} /> Resolved
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex justify-between items-center bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/15 p-3 rounded-xl text-emerald-300 transition-all">
              <div className="flex items-center gap-2 text-[11.5px] font-sans">
                <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                <span>Merge integrated cleanly! Created new merge commit node <strong className="font-mono text-zinc-100 bg-white/5 border border-white/5 py-0.5 px-1.5 rounded">{state.activeMerge.mergeCommitId}</strong>.</span>
              </div>
              <button
                onClick={() => onDismissMerge?.()}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[10.5px] font-bold rounded-lg cursor-pointer transition-all hover:scale-103 shadow-lg shadow-emerald-600/20"
              >
                Complete Integration
              </button>
            </div>
          )}
        </div>
      )}

      {/* Main Split Viewer */}
      <div className="flex-1 flex gap-4 min-h-0 overflow-hidden">
        
        {/* GRAPH SVG DRAW ZONE */}
        <div className="flex-1 bg-[#1a1a1a]/40 border border-white/5 rounded-xl overflow-auto relative p-2 scrollbar-thin flex flex-col items-center">
          
          <div className="w-full max-w-5xl" style={{ height: `${graphLayout.height}px` }}>
            <svg 
              width="100%" 
              height={graphLayout.height}
              className="absolute inset-0"
              style={{ minWidth: '400px' }}
            >
              <defs>
                {/* Glow Filter */}
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                {/* Subtle Grid Pattern */}
                <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                  <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#27272a" strokeWidth="0.5" strokeOpacity="0.4" />
                </pattern>
              </defs>

              {/* Grid Background */}
              <rect width="100%" height={graphLayout.height} fill="url(#grid)" />

              {/* 1. Curved Branch Routing Paths */}
              {graphLayout.paths.map((p) => (
                <path
                  key={p.id}
                  d={p.d}
                  fill="none"
                  stroke={p.color}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeOpacity="0.8"
                  className="transition-all hover:stroke-white hover:strokeWidth-5 hover:strokeOpacity-100 cursor-help"
                >
                  <title>{`Track Router: ${p.branch}`}</title>
                </path>
              ))}

              {/* 2. Interactive Commit Nodes */}
              {graphLayout.nodes.map((node) => {
                const isSelected = selectedCommit?.id === node.id;
                const isCurrentHead = node.id === activeHeadSHA;

                return (
                  <g 
                    key={node.id} 
                    transform={`translate(${node.x}, ${node.y})`}
                    onClick={() => onSelectCommit(node.commit)}
                    className="cursor-pointer group select-none"
                  >
                    {/* Ring Outer Highlight for selected */}
                    {isSelected && (
                      <circle 
                        r="16" 
                        fill="none" 
                        stroke="#ffffff" 
                        strokeWidth="2.5" 
                        className="animate-spin-slow"
                        style={{ strokeDasharray: '4 2' }}
                      />
                    )}

                    {/* Outer pulse for current checked out commit */}
                    {isCurrentHead && (
                      <circle 
                        r="18" 
                        fill="none" 
                        stroke={node.color} 
                        strokeWidth="1.5"
                        filter="url(#glow)" 
                        className="animate-ping"
                        style={{ transformOrigin: 'center' }}
                      />
                    )}

                    {/* Primary Node Bubble */}
                    <circle
                      r={isSelected ? '11' : '8.5'}
                      fill={isCurrentHead ? '#09090b' : node.color}
                      stroke={node.color}
                      strokeWidth="3"
                      className="transition-all duration-150 group-hover:scale-130 group-hover:stroke-white"
                      style={{ transformOrigin: 'center' }}
                    />

                    {/* Inner core bubble for HEAD placeholder */}
                    {isCurrentHead && (
                      <circle
                        r="4"
                        fill={node.color}
                      />
                    )}

                    {/* Message / SHA Label Right offset */}
                    <text
                      x="23"
                      y="4"
                      fill={isSelected ? '#ffffff' : '#a1a1aa'}
                      className={`font-sans font-medium hover:fill-teal-300 transition-colors select-none text-[11px] outline-none ${
                        isSelected ? 'font-semibold text-zinc-100' : ''
                      }`}
                    >
                      {node.commit.message.split('\n')[0]}
                    </text>

                    {/* Render tag pointers right after text */}
                    <text
                      x="23"
                      y="16"
                      fill="#52525b"
                      className="font-mono text-[9px]"
                    >
                      {node.id} · {node.commit.author.split(' <')[0]}
                    </text>
                  </g>
                );
              })}

              {/* 3. Branch Tag Overlay Flags */}
              {graphLayout.branchTags.map((tag) => {
                const isActiveAndTarget = state.branches[tag.name] ? true : false;
                return (
                  <g 
                    key={tag.name}
                    transform={`translate(${tag.x - 7}, ${tag.y - 34})`}
                    className="select-none"
                  >
                    {/* Background Tag Pill */}
                    <rect
                      x="0"
                      y="0"
                      width={90 + (tag.name.length * 4.5)}
                      height="18"
                      rx="4"
                      fill="#18181b"
                      stroke={tag.color}
                      strokeWidth="1.5"
                      className="shadow-xl"
                      filter={tag.isCurrent ? 'url(#glow)' : undefined}
                    />

                    <text
                      x="10"
                      y="12"
                      fill={tag.color}
                      className="font-mono text-[9px] font-bold"
                    >
                      {tag.name}
                    </text>

                    {/* visual checkout helper */}
                    {tag.isCurrent && (
                      <circle
                        cx="4"
                        cy="9"
                        r="2.5"
                        fill="#22d3ee"
                      />
                    )}

                    {/* Action buttons (Merge / Rebase helper options on click) */}
                    <foreignObject 
                      x={65 + (tag.name.length * 4.5)} 
                      y="-1.5" 
                      width="45" 
                      height="20"
                    >
                      <div className="flex gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!tag.isCurrent) {
                              onVisualMerge(tag.name, state.activeBranchName);
                            }
                          }}
                          disabled={tag.isCurrent}
                          className={`text-[9px] font-mono px-1 rounded flex items-center justify-center ${
                            tag.isCurrent 
                              ? 'text-zinc-700 cursor-not-allowed' 
                              : 'bg-emerald-950 text-emerald-400 hover:bg-emerald-900 cursor-pointer border border-emerald-800'
                          }`}
                          title={`Merge branch '${tag.name}' into active '${state.activeBranchName}'`}
                        >
                          Merge
                        </button>
                      </div>
                    </foreignObject>
                  </g>
                );
              })}
            </svg>

            {/* Float helper overlay instructing actions */}
            <div className="absolute top-3 left-3 bg-[#1e1e1e] border border-white/10 p-2.5 text-white/50 text-[10px] rounded-md shadow-xl flex items-center gap-2 pointer-events-none">
              <MousePointerClick size={12} className="text-blue-400" />
              <span>Double-press branch names in Sidebar to checkout. Use Git actions or select nodes to inspect.</span>
            </div>
          </div>

        </div>

        {/* RECENT COMMIT DETAILS DRAWER PANEL */}
        {selectedCommit && (
          <div className="w-80 bg-[#1e1e1e] border border-white/10 p-4 rounded-xl flex flex-col justify-between font-sans shadow-2xl relative shrink-0">
            <div>
              <div className="flex items-center justify-between border-b border-white/5 w-full pb-2.5 mb-3.5">
                <span className="text-[10px] font-sans text-white/40 font-bold uppercase tracking-widest">Commit Inspector</span>
                <span className="text-[10px] font-mono bg-[#121212] border border-white/10 px-2 py-0.5 rounded text-blue-400 font-semibold">{selectedCommit.id}</span>
              </div>

              {/* Message */}
              <div className="text-white/90 font-medium text-[12.5px] leading-relaxed mb-3.5">
                {selectedCommit.message}
              </div>

              {/* Metadata */}
              <div className="space-y-2 mb-3.5 text-white/50 text-[11px] border-b border-white/5 pb-3.5">
                <div className="flex items-center gap-2">
                  <User size={12} className="text-white/30" />
                  <span className="truncate">{selectedCommit.author}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar size={12} className="text-white/30" />
                  <span>{selectedCommit.date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <GitPullRequest size={12} className="text-white/30" />
                  <span>Branch Source: <span className="font-mono text-purple-400">{selectedCommit.branchName}</span></span>
                </div>
              </div>

              {/* Interactive Actions: Revert & Cherry Pick */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                <button
                  onClick={() => onCherryPickCommit?.(selectedCommit.id)}
                  disabled={selectedCommit.branchName === state.activeBranchName}
                  className={`px-2 py-1.5 rounded-lg text-[10.5px] font-bold flex items-center justify-center gap-1.5 transition-all border ${
                    selectedCommit.branchName === state.activeBranchName
                      ? 'bg-zinc-800/50 text-white/20 border-white/5 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-500 text-white border-blue-500/10 cursor-pointer shadow-lg shadow-blue-600/10 hover:scale-103'
                  }`}
                  title={selectedCommit.branchName === state.activeBranchName ? 'Commit is already on this branch' : `Cherry-pick this commit onto ${state.activeBranchName}`}
                >
                  <ArrowRight size={11} />
                  <span>Cherry-pick</span>
                </button>
                <button
                  onClick={() => onRevertCommit?.(selectedCommit.id)}
                  className="px-2 py-1.5 rounded-lg text-[10.5px] font-bold bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 border border-rose-500/15 hover:border-rose-500/25 transition-all flex items-center justify-center gap-1.5 cursor-pointer hover:scale-103 shadow-lg shadow-rose-600/5"
                  title="Create a new commit undoing the changes of this commit"
                >
                  <span>Revert Commit</span>
                </button>
              </div>

              {/* Modified/Involved Files list */}
              <div>
                <div className="text-[9px] text-white/30 font-bold uppercase tracking-widest mb-2">Involved Files ({selectedCommit.changes?.length || 0})</div>
                {selectedCommit.changes?.length === 0 ? (
                  <div className="text-white/20 italic">No files changed (empty commit node)</div>
                ) : (
                  <ul className="space-y-1 max-h-56 overflow-y-auto pr-1 scrollbar-thin">
                    {selectedCommit.changes.map((file) => (
                      <li 
                        key={file.filename}
                        onClick={() => onSelectFileToDiff(file)}
                        className="flex items-center justify-between p-2 rounded bg-white/[0.01] hover:bg-white/5 border border-transparent hover:border-white/5 transition-all cursor-pointer group"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <FileText size={12} className="text-white/30 shrink-0" />
                          <span className="font-mono text-[10px] truncate text-white/70 group-hover:text-white">{file.filename}</span>
                        </div>
                        
                        <span className={`text-[9px] uppercase font-bold tracking-widest px-1.5 py-0.5 bg-[#121212] border rounded scale-90 ${
                          file.status === 'added' ? 'text-emerald-400 border-emerald-950/40' : 
                          file.status === 'deleted' ? 'text-rose-400 border-rose-950/40' : 
                          'text-amber-400 border-amber-950/40'
                        }`}>
                          {file.status}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="border-t border-white/5 pt-3">
              <div className="text-[9px] text-white/30 font-mono text-center">
                Click file listing to preview local diff edits.
              </div>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}

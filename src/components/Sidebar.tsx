import React, { useState } from 'react';
import { 
  GitBranch, 
  Tag, 
  Layers, 
  FileCode, 
  Check, 
  Plus, 
  Minus, 
  ChevronDown, 
  ChevronRight, 
  GitPullRequest,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { GitState, FileChange } from '../types';

interface SidebarProps {
  state: GitState;
  onCheckout: (branchName: string) => void;
  onStageFile: (filename: string) => void;
  onUnstageFile: (filename: string) => void;
  onStageAll: () => void;
  onUnstageAll: () => void;
  onCommit: (message: string) => void;
  onSelectFileToDiff: (file: FileChange | null) => void;
  selectedDiffFile: FileChange | null;
}

export default function Sidebar({
  state,
  onCheckout,
  onStageFile,
  onUnstageFile,
  onStageAll,
  onUnstageAll,
  onCommit,
  onSelectFileToDiff,
  selectedDiffFile
}: SidebarProps) {
  // Accordion toggle states
  const [branchesOpen, setBranchesOpen] = useState(true);
  const [stashesOpen, setStashesOpen] = useState(true);
  const [tagsOpen, setTagsOpen] = useState(true);
  const [workingDirOpen, setWorkingDirOpen] = useState(true);

  // Commit text inputs
  const [commitTitle, setCommitTitle] = useState('');
  const [commitDesc, setCommitDesc] = useState('');

  const handleCommitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commitTitle.trim()) return;
    
    const message = commitDesc.trim() 
      ? `${commitTitle.trim()}\n\n${commitDesc.trim()}`
      : commitTitle.trim();
      
    onCommit(message);
    setCommitTitle('');
    setCommitDesc('');
  };

  const localBranches = Object.values(state.branches).filter(b => !b.isRemote);
  const remoteBranches = Object.values(state.branches).filter(b => b.isRemote);

  return (
    <aside className="w-72 bg-[#181818] border-r border-white/5 flex flex-col h-full shrink-0 font-sans select-none text-xs text-zinc-300">
      
      {/* Scrollable Accoridion Container */}
      <div className="flex-1 overflow-y-auto divide-y divide-white/5 scrollbar-thin">
        
        {/* BRANCHES SECTION */}
        <div>
          <button 
            onClick={() => setBranchesOpen(!branchesOpen)}
            className="w-full flex items-center justify-between px-4 py-3 font-semibold text-[10px] uppercase tracking-widest text-white/40 hover:text-white/80 transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <GitBranch size={13} className="text-white/30" />
              <span>Branches</span>
            </span>
            {branchesOpen ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
          </button>
          
          {branchesOpen && (
            <div className="pb-3 px-2 text-zinc-400">
              {/* Local branches */}
              <div className="px-2 py-1 text-[9px] text-white/20 font-bold uppercase tracking-widest">Local</div>
              <ul className="space-y-[2px]">
                {localBranches.map((b) => {
                  const isActive = b.name === state.activeBranchName;
                  return (
                    <li 
                      key={b.name}
                      onDoubleClick={() => onCheckout(b.name)}
                      className={`group flex items-center justify-between px-2.5 py-1.5 rounded-md cursor-pointer transition-colors ${
                        isActive 
                          ? 'bg-blue-500/10 text-blue-400 font-medium border-l-2 border-blue-500' 
                          : 'hover:bg-white/5 text-white/60 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span 
                          className="w-2 h-2 rounded-full shrink-0" 
                          style={{ backgroundColor: b.color }} 
                        />
                        <span className="truncate">{b.name}</span>
                      </div>
                      
                      <div className="flex items-center gap-1.5">
                        {isActive ? (
                          <Check size={11} className="text-blue-400" />
                        ) : (
                          <button
                            onClick={() => onCheckout(b.name)}
                            className="opacity-0 group-hover:opacity-100 px-1.5 py-0.5 rounded bg-white/5 text-[9px] hover:bg-white/10 text-zinc-300 hover:text-white transition-opacity-all"
                          >
                            Checkout
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>

              {/* Remote branches */}
              {remoteBranches.length > 0 && (
                <>
                  <div className="px-2 py-1 mt-3 text-[9px] text-white/20 font-bold uppercase tracking-widest">Remote (Origin)</div>
                  <ul className="space-y-[2px]">
                    {remoteBranches.map((b) => (
                      <li 
                        key={b.name}
                        className="flex items-center gap-2 px-2.5 py-1 text-white/40 hover:text-white/60 cursor-default"
                      >
                        <span className="w-1.5 h-1.5 rounded bg-emerald-600" />
                        <span className="truncate font-mono text-[10px] text-white/50">{b.name}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}
        </div>

        {/* STASHES SECTION */}
        <div>
          <button 
            onClick={() => setStashesOpen(!stashesOpen)}
            className="w-full flex items-center justify-between px-4 py-3 font-semibold text-[10px] uppercase tracking-widest text-white/40 hover:text-white/80 transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <Layers size={13} className="text-white/30" />
              <span>Stashes ({state.stashes.length})</span>
            </span>
            {stashesOpen ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
          </button>
          
          {stashesOpen && (
            <div className="pb-3 px-2">
              {state.stashes.length === 0 ? (
                <div className="px-3 py-1.5 text-white/20 italic">No shelved stashes</div>
              ) : (
                <ul className="space-y-[2px]">
                  {state.stashes.map((stash) => (
                    <li 
                      key={stash.id}
                      onClick={() => onSelectFileToDiff(stash.changes[0] || null)}
                      className="flex flex-col px-2.5 py-2 rounded-md hover:bg-white/5 cursor-pointer text-white/60 hover:text-white transition-colors"
                    >
                      <div className="font-mono text-amber-500 text-[9px] font-bold tracking-wider">{stash.id}</div>
                      <div className="truncate text-[10.5px] mt-0.5">{stash.message}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* TAGS SECTION */}
        <div>
          <button 
            onClick={() => setTagsOpen(!tagsOpen)}
            className="w-full flex items-center justify-between px-4 py-3 font-semibold text-[10px] uppercase tracking-widest text-white/40 hover:text-white/80 transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <Tag size={13} className="text-white/30" />
              <span>Tags ({Object.keys(state.tags).length})</span>
            </span>
            {tagsOpen ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
          </button>
          
          {tagsOpen && (
            <div className="pb-3 px-2">
              {Object.keys(state.tags).length === 0 ? (
                <div className="px-3 py-1.5 text-white/20 italic text-[11px]">No tags created</div>
              ) : (
                <ul className="grid grid-cols-2 gap-1 px-1">
                  {Object.entries(state.tags).map(([tag, sha]) => (
                    <li 
                      key={tag}
                      className="flex items-center gap-1.5 px-2 py-1 rounded bg-white/5 border border-white/10 text-[10px] text-pink-400/90 truncate cursor-default"
                      title={`Points to ${sha}`}
                    >
                      <Tag size={10} className="shrink-0 text-pink-500" />
                      <span className="truncate">{tag}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* WORKING DIRECTORY / COMMIT CONTROLLER */}
        <div>
          <button 
            onClick={() => setWorkingDirOpen(!workingDirOpen)}
            className="w-full flex items-center justify-between px-4 py-3 font-semibold text-[10px] uppercase tracking-widest text-white/40 hover:text-white/80 transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <FileCode size={13} className="text-white/30" />
              <span>Staged & Unstaged State</span>
            </span>
            {workingDirOpen ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
          </button>
          
          {workingDirOpen && (
            <div className="pb-3 text-[11px]">
              
              {/* STAGED LIST */}
              <div className="px-3 mt-1">
                <div className="flex items-center justify-between text-[9px] text-emerald-400 font-bold uppercase tracking-widest mb-1.5 px-1">
                  <span>Staged Files ({state.stagedFiles.length})</span>
                  {state.stagedFiles.length > 0 && (
                    <button 
                      onClick={onUnstageAll}
                      className="text-white/40 hover:text-white transition-colors cursor-pointer tracking-wider font-semibold text-[9px] uppercase"
                    >
                      Unstage All
                    </button>
                  )}
                </div>
                
                {state.stagedFiles.length === 0 ? (
                  <div className="text-white/20 italic px-1 mb-3 text-[10px]">No staged files</div>
                ) : (
                  <ul className="mb-3 space-y-[2px] max-h-32 overflow-y-auto pr-1 scrollbar-thin">
                    {state.stagedFiles.map((filename) => {
                      const change = state.unstagedFiles.find(f => f.filename === filename) || 
                                     Object.values(state.commits)[0]?.changes.find(f => f.filename === filename);
                      const isSelected = selectedDiffFile?.filename === filename;
                      return (
                        <li 
                          key={filename}
                          onClick={() => {
                            if (change) onSelectFileToDiff(change);
                          }}
                          className={`flex items-center justify-between px-2 py-1.5 rounded-md cursor-pointer transition-colors group ${
                            isSelected ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-zinc-300'
                          }`}
                        >
                          <span className="truncate flex items-center gap-1.5 font-mono text-[10.5px] text-emerald-300">
                            <CheckCircle2 size={11} className="shrink-0 text-emerald-400" />
                            <span className="truncate">{filename}</span>
                            {state.partiallyStaged?.[filename] && (
                              <span className="text-[8px] bg-emerald-950/40 text-emerald-400 px-1 rounded font-sans leading-none py-0.5 border border-emerald-500/20 shadow-sm animate-pulse shrink-0">
                                hunk: {state.partiallyStaged[filename].length}
                              </span>
                            )}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onUnstageFile(filename);
                            }}
                            className="p-0.5 rounded border border-transparent hover:border-white/10 hover:bg-white/5 text-white/40 hover:text-red-400 transition-all cursor-pointer"
                            title="Unstage change"
                          >
                            <Minus size={11} />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              {/* UNSTAGED LIST */}
              <div className="px-3">
                {(() => {
                  const unstagedGroup = state.unstagedFiles.filter(
                    item => !state.stagedFiles.includes(item.filename) || state.partiallyStaged?.[item.filename]
                  );
                  return (
                    <>
                      <div className="flex items-center justify-between text-[9px] text-amber-500 font-bold uppercase tracking-widest mb-1.5 px-1">
                        <span>Unstaged modifications ({unstagedGroup.length})</span>
                        {unstagedGroup.length > 0 && (
                          <button 
                            onClick={onStageAll}
                            className="text-white/40 hover:text-white transition-colors cursor-pointer tracking-wider font-semibold text-[9px] uppercase"
                          >
                            Stage All
                          </button>
                        )}
                      </div>
                      
                      {unstagedGroup.length === 0 ? (
                        <div className="text-white/20 italic px-1 mb-2 text-[10px]">No modifications</div>
                      ) : (
                        <ul className="space-y-[2px] max-h-32 overflow-y-auto pr-1 mb-2 scrollbar-thin">
                          {unstagedGroup.map((file) => {
                            const isSelected = selectedDiffFile?.filename === file.filename;
                            const isConflict = file.status === 'conflict';
                            const isPartiallyStaged = !!state.partiallyStaged?.[file.filename];
                            return (
                              <li 
                                key={file.filename}
                                onClick={() => onSelectFileToDiff(file)}
                                className={`flex items-center justify-between px-2 py-1.5 rounded-md cursor-pointer transition-colors group ${
                                  isSelected ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-zinc-300'
                                }`}
                              >
                                <span className={`truncate flex items-center gap-1.5 font-mono text-[10.5px] ${
                                  isConflict ? 'text-rose-400' : 'text-amber-405'
                                }`}>
                                  {isConflict ? (
                                    <AlertTriangle size={11} className="shrink-0 animate-pulse text-rose-500" />
                                  ) : (
                                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full shrink-0" />
                                  )}
                                  <span className="truncate">{file.filename}</span>
                                  {isPartiallyStaged && (
                                    <span className="text-[8px] bg-amber-950/40 text-amber-450 px-1 rounded font-sans leading-none py-0.5 border border-amber-500/20 shadow-sm shrink-0 ml-1">
                                      remaining
                                    </span>
                                  )}
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (isConflict) {
                                      // Can trigger conflict resolver
                                    } else {
                                      onStageFile(file.filename);
                                    }
                                  }}
                                  className="p-0.5 rounded border border-transparent hover:border-white/10 hover:bg-white/5 text-white/40 hover:text-blue-400 transition-all cursor-pointer"
                                  title={isConflict ? "Resolve conflicts" : "Stage changes"}
                                >
                                  <Plus size={11} />
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </>
                  );
                })()}
              </div>

            </div>
          )}
        </div>

      </div>

      {/* COMMIT BAR AREA (FOOTER ZONE OF SIDEBAR) */}
      <div className="bg-[#1e1e1e] border-t border-white/10 p-4 h-52 flex flex-col justify-between">
        <form onSubmit={handleCommitSubmit} className="flex-1 flex flex-col justify-between gap-2">
          <div>
            <div className="text-[10px] text-white/40 font-bold uppercase tracking-widest mb-1.5 flex items-center justify-between">
              <span>Commit Changes</span>
              <span className="text-[9px] text-[#a78bfa] font-mono">HEAD → {state.activeBranchName}</span>
            </div>
            
            <input
              type="text"
              placeholder="Commit Summary (must be filled)..."
              value={commitTitle}
              onChange={(e) => setCommitTitle(e.target.value)}
              className="w-full bg-[#121212] text-white border border-white/10 rounded-md px-2.5 py-1.5 focus:outline-none focus:border-blue-500 text-[11px] placeholder-zinc-650 mb-1.5 transition-colors"
            />
            
            <textarea
              placeholder="Description (optional)..."
              value={commitDesc}
              onChange={(e) => setCommitDesc(e.target.value)}
              rows={2}
              className="w-full bg-[#121212] text-white border border-white/10 rounded-md px-2.5 py-1.5 focus:outline-none focus:border-blue-500 text-[10.5px] placeholder-zinc-700 resize-none leading-tight transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={!commitTitle.trim() || state.stagedFiles.length === 0}
            className={`w-full py-2 rounded-md text-[11px] font-semibold transition-all flex items-center justify-center gap-1 cursor-pointer border ${
              commitTitle.trim() && state.stagedFiles.length > 0
                ? 'bg-blue-600 hover:bg-blue-500 text-white border-blue-500/20 shadow-lg shadow-blue-500/10'
                : 'bg-[#181818] text-white/20 border-white/5 cursor-not-allowed'
            }`}
          >
            <Check size={13} strokeWidth={2.5} />
            <span>Commit {state.stagedFiles.length} files</span>
          </button>
        </form>
      </div>

    </aside>
  );
}

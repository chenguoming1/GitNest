import React from 'react';
import { 
  Undo2, 
  Redo2, 
  Plus, 
  Play, 
  Sparkles, 
  RefreshCcw, 
  FolderDown, 
  FolderUp, 
  Settings, 
  Tv, 
  Terminal as TerminalIcon 
} from 'lucide-react';

interface MacHeaderProps {
  currentScenario: string;
  onScenarioChange: (id: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onNewBranchClick: () => void;
  onStashClick: () => void;
  onPopClick: () => void;
  onResetScenario: () => void;
  isAiOpen: boolean;
  onToggleAi: () => void;
  isTerminalOpen: boolean;
  onToggleTerminal: () => void;
  stashCount: number;
}

export default function MacHeader({
  currentScenario,
  onScenarioChange,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onNewBranchClick,
  onStashClick,
  onPopClick,
  onResetScenario,
  isAiOpen,
  onToggleAi,
  isTerminalOpen,
  onToggleTerminal,
  stashCount
}: MacHeaderProps) {
  return (
    <header className="bg-[#1e1e1e] border-b border-white/10 h-14 shrink-0 px-4 flex items-center justify-between select-none font-sans">
      {/* OS Controls */}
      <div className="flex items-center gap-3">
        <div className="flex gap-1.5 mr-2">
          <div className="w-3 h-3 rounded-full bg-[#ff5f56] opacity-90 hover:opacity-100 transition-opacity cursor-pointer" />
          <div className="w-3 h-3 rounded-full bg-[#ffbd2e] opacity-90 hover:opacity-100 transition-opacity cursor-pointer" />
          <div className="w-3 h-3 rounded-full bg-[#27c93f] opacity-90 hover:opacity-100 transition-opacity cursor-pointer" />
        </div>
        
        <div className="h-4 w-px bg-white/10 mx-1" />
 
        {/* Brand */}
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-blue-600 flex items-center justify-center text-[10px] font-bold text-white shadow shadow-blue-500/10">
            N
          </div>
          <span className="text-white font-medium text-xs tracking-wider">gitnest</span>
          <span className="text-white/40 text-[9px] uppercase tracking-widest bg-white/5 border border-white/5 px-1.5 py-0.5 rounded font-mono">
            sandbox
          </span>
        </div>
      </div>
 
      {/* Main Actions Bar */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className={`p-1.5 rounded-md transition-all cursor-pointer ${
            canUndo 
              ? 'text-zinc-400 hover:bg-white/5 hover:text-white' 
              : 'text-zinc-650 opacity-30 cursor-not-allowed'
          }`}
          title="Undo Git Action"
        >
          <Undo2 size={15} />
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className={`p-1.5 rounded-md transition-all cursor-pointer ${
            canRedo 
              ? 'text-zinc-400 hover:bg-white/5 hover:text-white' 
              : 'text-zinc-650 opacity-30 cursor-not-allowed'
          }`}
          title="Redo Git Action"
        >
          <Redo2 size={15} />
        </button>
 
        <div className="h-5 w-px bg-white/10 mx-1.5" />
 
        <button
          onClick={onNewBranchClick}
          className="flex items-center gap-1 px-3 py-1.5 rounded bg-white/5 hover:bg-white/10 text-white/90 hover:text-white text-xs font-medium transition-colors cursor-pointer border border-white/10"
        >
          <Plus size={13} className="text-blue-400" />
          <span>Branch</span>
        </button>
 
        <button
          onClick={onStashClick}
          className="flex items-center gap-1 px-3 py-1.5 rounded bg-white/5 hover:bg-white/10 text-white/90 hover:text-white text-xs font-medium transition-colors cursor-pointer border border-white/10"
          title="Temporarily shelf working changes"
        >
          <FolderDown size={13} className="text-amber-400" />
          <span>Stash</span>
        </button>
 
        <button
          onClick={onPopClick}
          disabled={stashCount === 0}
          className={`flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium transition-colors border ${
            stashCount > 0
              ? 'bg-white/5 hover:bg-white/10 text-white/90 hover:text-white border-white/10 cursor-pointer'
              : 'bg-[#181818] border-white/5 text-white/20 cursor-not-allowed'
          }`}
          title="Restore last stashed modifications"
        >
          <FolderUp size={13} className={stashCount > 0 ? 'text-emerald-400' : 'text-zinc-600'} />
          <span>Pop Stash ({stashCount})</span>
        </button>
 
        <div className="h-5 w-px bg-white/10 mx-1.5" />
 
        <button
          onClick={onResetScenario}
          className="flex items-center gap-1 px-3 py-1.5 rounded bg-white/5 hover:bg-white/10 text-white/90 hover:text-white text-xs font-medium transition-colors cursor-pointer border border-white/10"
          title="Reset current simulation layout back to scenario init state"
        >
          <RefreshCcw size={12} className="text-[#ff5f56]" />
          <span>Reset Repo</span>
        </button>
      </div>
 
      {/* Scenario & Panel Control Wrapper */}
      <div className="flex items-center gap-2">
        {/* Scenario Selection dropdown */}
        <div className="flex items-center gap-1.5">
          <span className="text-white/40 text-[11px] font-sans">Scenario:</span>
          <select
            value={currentScenario}
            onChange={(e) => onScenarioChange(e.target.value)}
            className="bg-[#181818] hover:bg-white/5 text-white/80 text-xs rounded border border-white/10 px-2.5 py-1.5 focus:outline-none focus:border-blue-500 transition-colors cursor-pointer font-sans"
          >
            <option value="merge-conflict">⚠️ Merge Conflicts</option>
            <option value="feature-rebase">⚡ Branch Rebase Flow</option>
            <option value="local-working-directory">📂 Stash & Stage Dir</option>
          </select>
        </div>
 
        <div className="h-5 w-px bg-white/10 mx-1" />
 
        {/* Panel Toggles */}
        <div className="flex items-center bg-[#121212] p-0.5 rounded border border-white/10">
          <button
            onClick={onToggleTerminal}
            className={`p-1.5 rounded cursor-pointer transition-colors ${
              isTerminalOpen 
                ? 'bg-white/5 text-blue-400' 
                : 'text-white/40 hover:text-white/80'
            }`}
            title="Toggle Git Terminal Console"
          >
            <TerminalIcon size={13} />
          </button>
          <button
            onClick={onToggleAi}
            className={`p-1.5 rounded cursor-pointer transition-colors ${
              isAiOpen 
                ? 'bg-white/5 text-purple-400' 
                : 'text-white/40 hover:text-white/80'
            }`}
            title="Toggle Nest AI Assistant"
          >
            <Sparkles size={13} />
          </button>
        </div>
      </div>
    </header>
  );
}

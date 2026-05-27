import React, { useState, useRef, useEffect } from 'react';
import { Terminal as TerminalIcon, CornerDownLeft, Info, Key, Check } from 'lucide-react';
import { GitState, TerminalHistoryItem } from '../types';

interface TerminalProps {
  state: GitState;
  history: TerminalHistoryItem[];
  onExecuteCommand: (commandString: string) => void;
  onClearHistory: () => void;
}

const COMMAND_SUGGESTIONS = [
  'git checkout ',
  'git branch ',
  'git merge ',
  'git rebase ',
  'git commit -m "',
  'git status',
  'git stash',
  'git stash pop',
  'git log --oneline',
  'git reset --hard'
];

export default function Terminal({
  state,
  history,
  onExecuteCommand,
  onClearHistory
}: TerminalProps) {
  const [inputVal, setInputVal] = useState('');
  const [activeSuggestionIdx, setActiveSuggestionIdx] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto scroll to bottom of logs on new history change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  // Handle command submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    
    onExecuteCommand(inputVal.trim());
    setInputVal('');
  };

  // Autocomplete Filter
  const filteredSuggestions = inputVal.trim() 
    ? COMMAND_SUGGESTIONS.filter(s => s.startsWith(inputVal.toLowerCase()) && s !== inputVal)
    : [];

  const handleSuggestionClick = (s: string) => {
    setInputVal(s);
    inputRef.current?.focus();
  };

  return (
    <div className="h-64 bg-[#121212] border-t border-white/10 flex flex-col font-mono text-xs select-none relative shrink-0">
      
      {/* Terminal Header */}
      <div className="bg-[#181818] border-b border-white/5 h-10 px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <TerminalIcon size={12} className="text-emerald-500 animate-pulse" />
          <span className="text-white/40 text-[9px] uppercase font-bold tracking-widest">Git Terminal Shell Simulation</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-[10px] text-white/40 bg-[#121212] px-2 py-0.5 rounded border border-white/5">
            Path: <span className="text-white/30">/workspace/repo_sandbox</span>
          </div>
          <button 
            onClick={onClearHistory}
            className="text-[10px] text-white/40 hover:text-white transition-all cursor-pointer hover:underline"
          >
            Clear Console log
          </button>
        </div>
      </div>

      {/* Main Terminal Window Body */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        
        {/* CLI SHELL SCREEN */}
        <div className="flex-1 flex flex-col px-4 py-3 min-h-0 bg-[#0d0d0d]">
          
          {/* Scrollable logs area */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-1.5 pr-2 select-text scrollbar-thin">
            
            {/* Initial Welcome */}
            <div className="text-white/20 text-[10.5px] select-none leading-relaxed">
              Welcome to the GitNest Sandbox Terminal Shell core.<br />
              Type Git commands natively to update the visual graph. Try some command shortcuts from the helper tab.<br />
              Example: <span className="text-blue-400">git status</span>, <span className="text-blue-400">git checkout dev</span>, or <span className="text-blue-400">git branch feature/docs</span>.
            </div>

            {history.map((item, idx) => {
              if (item.type === 'input') {
                return (
                  <div key={idx} className="flex items-start gap-1">
                    <span className="text-pink-500 font-bold">alex@nest:~$ </span>
                    <span className="text-zinc-100 font-semibold">{item.text}</span>
                  </div>
                );
              } else if (item.type === 'error') {
                return (
                  <div key={idx} className="text-rose-500 bg-rose-950/20 border border-rose-950/50 p-1.5 rounded text-[11px] leading-relaxed whitespace-pre-wrap font-sans">
                    ⚠️ {item.text}
                  </div>
                );
              } else {
                return (
                  <div key={idx} className="text-zinc-400 font-mono text-[11px] leading-relaxed whitespace-pre-wrap pl-3 border-l border-zinc-800">
                    {item.text}
                  </div>
                );
              }
            })}

          </div>

          {/* Prompt input line */}
          <form onSubmit={handleSubmit} className="mt-2 shrink-0 border-t border-white/5 pt-2.5 relative">
            
            {/* Suggestions Overlay Popup */}
            {filteredSuggestions.length > 0 && (
              <div className="absolute bottom-full left-0 mb-1.5 bg-[#1e1e1e] border border-white/10 rounded-lg p-1 w-64 shadow-2xl z-50">
                <div className="text-[9px] text-white/30 uppercase font-black px-2 py-1 border-b border-white/5 flex items-center gap-1.5">
                  <Info size={10} className="text-white/25" />
                  <span>Suggestions Match</span>
                </div>
                <div className="py-1 space-y-0.5">
                  {filteredSuggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => handleSuggestionClick(s)}
                      className="w-full text-left px-2 py-1.5 text-[10.5px] text-zinc-300 hover:text-white hover:bg-white/5 rounded transition-all truncate font-mono flex items-center justify-between"
                    >
                      <span>{s}</span>
                      <span className="text-[8px] text-white/40 bg-[#121212] px-1.5 py-0.5 border border-white/5 rounded scale-90">Click</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-1 select-none">
              <span className="text-blue-500 font-bold shrink-0">alex@nest:~$ </span>
              <input
                ref={inputRef}
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="Type git commands here (e.g., git status)..."
                className="flex-1 bg-transparent text-white focus:outline-none caret-blue-400 select-text font-mono text-[11px]"
              />
              <button 
                type="submit"
                className="p-1 rounded text-white/40 hover:text-white transition-colors cursor-pointer shrink-0"
              >
                <CornerDownLeft size={13} />
              </button>
            </div>

          </form>

        </div>

        {/* TERMINAL QUICK-REFERENCE MACROS LIST */}
        <div className="w-80 bg-[#181818] border-l border-white/5 p-3.5 overflow-y-auto shrink-0 select-none scrollbar-thin">
          <div className="text-[9px] text-white/40 font-bold uppercase tracking-widest mb-2.5 border-b border-white/5 pb-2 flex items-center gap-1.5">
            <Info size={11} className="text-white/20" />
            <span>Simplify Command Palettes</span>
          </div>

          <div className="space-y-2.5 text-[10px]">
            <div>
              <div className="text-white/50 font-medium mb-1">Create work branch:</div>
              <button
                onClick={() => handleSuggestionClick('git branch ')}
                className="w-full text-left bg-[#121212] hover:bg-white/5 text-blue-400 font-mono px-2.5 py-1.5 rounded-md border border-white/10 truncate font-semibold transition-colors flex justify-between"
              >
                <span>git branch &lt;name&gt;</span>
                <span className="text-[8px] text-white/40 bg-white/5 border border-white/10 rounded px-1 font-sans">Fill</span>
              </button>
            </div>

            <div>
              <div className="text-white/50 font-medium mb-1">Branch Checker checkout:</div>
              <button
                onClick={() => handleSuggestionClick('git checkout ')}
                className="w-full text-left bg-[#121212] hover:bg-white/5 text-blue-400 font-mono px-2.5 py-1.5 rounded-md border border-white/10 truncate font-semibold transition-colors flex justify-between"
              >
                <span>git checkout &lt;branch&gt;</span>
                <span className="text-[8px] text-white/40 bg-white/5 border border-white/10 rounded px-1 font-sans">Fill</span>
              </button>
            </div>

            <div>
              <div className="text-white/50 font-medium mb-1">Commit staged indices:</div>
              <button
                onClick={() => handleSuggestionClick('git commit -m "Fixed database connection limits"')}
                className="w-full text-left bg-[#121212] hover:bg-white/5 text-blue-400 font-mono px-2.5 py-1.5 rounded-md border border-white/10 truncate font-semibold transition-colors flex justify-between"
              >
                <span>git commit -m &quot;msg&quot;</span>
                <span className="text-[8px] text-white/40 bg-white/5 border border-white/10 rounded px-1 font-sans">Fill</span>
              </button>
            </div>

            <div>
              <div className="text-white/50 font-medium mb-1">Merge target branch:</div>
              <button
                onClick={() => handleSuggestionClick('git merge ')}
                className="w-full text-left bg-[#121212] hover:bg-white/5 text-blue-400 font-mono px-2.5 py-1.5 rounded-md border border-white/10 truncate font-semibold transition-colors flex justify-between"
              >
                <span>git merge &lt;name&gt;</span>
                <span className="text-[8px] text-white/40 bg-white/5 border border-white/10 rounded px-1 font-sans">Fill</span>
              </button>
            </div>

            <div className="pt-1">
              <div className="text-white/50 font-normal text-[9.5px] bg-white/[0.02] px-2.5 py-2 border border-white/5 rounded-lg leading-normal">
                📝 State changes reflect automatically in the main SVG graph track canvas above.
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}

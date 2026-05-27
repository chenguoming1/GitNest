import React, { useState, useEffect } from 'react';
import { ShieldAlert, CheckCircle2, RefreshCw, Eye, ArrowRight, HelpCircle } from 'lucide-react';
import { Conflict } from '../types';

interface ConflictEditorProps {
  filename: string;
  conflict: Conflict;
  onSaveResolution: (filename: string, resolvedLines: string[]) => void;
  onSkip: () => void;
}

export default function ConflictEditor({
  filename,
  conflict,
  onSaveResolution,
  onSkip
}: ConflictEditorProps) {
  const [selectedLines, setSelectedLines] = useState<'ours' | 'theirs' | 'both' | null>(null);
  const [customResult, setCustomResult] = useState<string[]>([]);

  // Reset resolution choice on component or file swap
  useEffect(() => {
    setSelectedLines(null);
    setCustomResult([]);
  }, [filename, conflict]);

  const handleSelectChoice = (choice: 'ours' | 'theirs' | 'both') => {
    setSelectedLines(choice);
    if (choice === 'ours') {
      setCustomResult(conflict.ourLines);
    } else if (choice === 'theirs') {
      setCustomResult(conflict.theirLines);
    } else {
      setCustomResult([...conflict.ourLines, '/* ------ Combined ------ */', ...conflict.theirLines]);
    }
  };

  const handleSave = () => {
    if (!selectedLines) return;
    onSaveResolution(filename, customResult);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#121212] p-4 font-sans select-none overflow-hidden min-h-0">
      
      {/* Header bar */}
      <div className="flex items-center justify-between border border-red-500/20 pb-3 mb-4 shrink-0 bg-red-950/10 p-3.5 rounded-xl">
        <div className="flex items-center gap-2">
          <ShieldAlert size={16} className="text-rose-500 animate-pulse" />
          <div>
            <h3 className="text-white/80 font-bold text-xs tracking-wide">
              Merge Conflict Interactive Editor
            </h3>
            <p className="text-white/40 text-[10px] mt-0.5">
              Overlapping modifications occurred on <span className="font-mono text-blue-400 font-bold">{filename}</span> during merge trigger. Choose which block to preserve.
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={onSkip}
            className="px-2 py-1 text-[10px] text-white/40 hover:text-white hover:underline transition-colors"
          >
            Defer and close
          </button>
        </div>
      </div>

      {/* Selector split view */}
      <div className="flex-1 grid grid-cols-2 gap-4 overflow-hidden min-h-0 mb-4">
        
        {/* OURS (LEFT BOX) */}
        <div 
          onClick={() => handleSelectChoice('ours')}
          className={`flex flex-col rounded-xl border p-3.5 cursor-pointer transition-all bg-[#181818] flex-1 overflow-hidden group ${
            selectedLines === 'ours'
              ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-2xl shadow-blue-500/5'
              : 'border-white/5 hover:border-white/10'
          }`}
        >
          <div className="flex items-center justify-between mb-2.5 shrink-0 border-b border-white/5 pb-2">
            <span className="text-[10px] font-bold text-blue-400 font-mono tracking-widest uppercase">
              Current Changes (Ours: {conflict.ourBranchName})
            </span>
            <span className={`text-[9px] uppercase tracking-wider px-2 py-0.5 rounded font-extrabold font-sans border ${
              selectedLines === 'ours' 
                ? 'bg-blue-600/10 text-blue-400 border-blue-500/20' 
                : 'bg-[#121212] text-white/30 border-white/5'
            }`}>
              {selectedLines === 'ours' ? 'Accepted' : 'Select block'}
            </span>
          </div>
          
          <pre className="flex-1 overflow-auto bg-[#121212] p-2.5 rounded-md text-[10.5px] font-mono text-zinc-300 pointer-events-none scrollbar-thin border border-white/5">
            <code>
              {conflict.ourLines.map((line, i) => (
                <div key={i} className="px-1.5 hover:bg-white/[0.02] py-0.5 border-l-2 border-blue-500/35 bg-blue-500/5">
                  {line || ' '}
                </div>
              ))}
            </code>
          </pre>
        </div>

        {/* THEIRS (RIGHT BOX) */}
        <div 
          onClick={() => handleSelectChoice('theirs')}
          className={`flex flex-col rounded-xl border p-3.5 cursor-pointer transition-all bg-[#181818] flex-1 overflow-hidden group ${
            selectedLines === 'theirs'
              ? 'border-amber-500 ring-2 ring-amber-500/20 shadow-2xl shadow-amber-500/5'
              : 'border-white/5 hover:border-white/10'
          }`}
        >
          <div className="flex items-center justify-between mb-2.5 shrink-0 border-b border-white/5 pb-2">
            <span className="text-[10px] font-bold text-amber-500 font-mono tracking-widest uppercase">
              Incoming Changes (Theirs: {conflict.theirBranchName})
            </span>
            <span className={`text-[9px] uppercase tracking-wider px-2 py-0.5 rounded font-extrabold font-sans border ${
              selectedLines === 'theirs' 
                ? 'bg-amber-600/10 text-amber-400 border-amber-500/20' 
                : 'bg-[#121212] text-white/30 border-white/5'
            }`}>
              {selectedLines === 'theirs' ? 'Accepted' : 'Select block'}
            </span>
          </div>

          <pre className="flex-1 overflow-auto bg-[#121212] p-2.5 rounded-md text-[10.5px] font-mono text-zinc-300 pointer-events-none scrollbar-thin border border-white/5">
            <code>
              {conflict.theirLines.map((line, i) => (
                <div key={i} className="px-1.5 hover:bg-white/[0.02] py-0.5 border-l-2 border-amber-500/35 bg-amber-500/5">
                  {line || ' '}
                </div>
              ))}
            </code>
          </pre>
        </div>

      </div>

      {/* COMBINE ADVANCED OPTION PILL BAR */}
      <div className="flex items-center justify-center gap-3 shrink-0 mb-4 bg-white/[0.01] p-2 border border-white/5 rounded-lg">
        <span className="text-white/30 text-[9px] uppercase font-bold tracking-widest">Advanced resolution macros:</span>
        <button
          onClick={() => handleSelectChoice('both')}
          className={`px-3 py-1 rounded text-[10px] font-semibold flex items-center gap-1 cursor-pointer transition-all border ${
            selectedLines === 'both'
              ? 'bg-purple-600 hover:bg-purple-500 text-white border-purple-500/20'
              : 'bg-[#121212] hover:bg-white/5 border border-white/10 text-white/50'
          }`}
        >
          <span>Accept Both Changes (Append)</span>
        </button>
      </div>

      {/* RESOLUTION RESULT PREVIEW FOOTER */}
      <div className="bg-[#181818] border border-white/10 rounded-xl p-3 shrink-0 flex flex-col justify-between h-44">
        <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-2">
          <div className="flex items-center gap-2">
            <Eye size={12} className="text-[#a78bfa]" />
            <span className="text-[10px] uppercase font-bold text-white/40 tracking-widest font-mono">Stage Result Preview Buffer</span>
          </div>
          <span className="text-[9px] text-white/30 font-sans">Auto-stages index upon resolution</span>
        </div>

        <div className="flex-1 bg-[#121212] rounded p-2 overflow-y-auto font-mono text-[10.5px] text-zinc-300 leading-normal mb-2.5 scrollbar-thin border border-white/5">
          {selectedLines === null ? (
            <div className="flex h-full items-center justify-center text-[#555] italic text-[11px] gap-1.5 select-none font-sans">
              <HelpCircle size={14} />
              <span>Select one of the file branches above to inspect the staging output preview.</span>
            </div>
          ) : (
            customResult.map((line, i) => (
              <div key={i} className="px-1 border-l border-white/5">
                {line}
              </div>
            ))
          )}
        </div>

        <div className="flex justify-end shrink-0">
          <button
            onClick={handleSave}
            disabled={!selectedLines}
            className={`px-4 py-2 rounded-md text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
              selectedLines
                ? 'bg-blue-600 hover:bg-blue-500 text-white border-blue-500/20 shadow-lg shadow-blue-500/10'
                : 'bg-[#121212] text-white/20 border-white/5 cursor-not-allowed'
            }`}
          >
            <CheckCircle2 size={13} strokeWidth={2.5} />
            <span>Mark Conflict Resolved & Stage File</span>
          </button>
        </div>
      </div>

    </div>
  );
}

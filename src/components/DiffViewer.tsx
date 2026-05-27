import React from 'react';
import { FileText, Eye, CheckCircle2, ChevronRight, CornerDownRight } from 'lucide-react';
import { FileChange } from '../types';

interface DiffViewerProps {
  file: FileChange;
  onClose: () => void;
  onStage?: (filename: string) => void;
  onUnstage?: (filename: string) => void;
  isStaged?: boolean;
  stagedLines?: Array<{ text: string; type: 'addition' | 'deletion' }>;
  onStageLine?: (filename: string, line: { text: string; type: 'addition' | 'deletion' }) => void;
  onUnstageLine?: (filename: string, line: { text: string; type: 'addition' | 'deletion' }) => void;
}

export default function DiffViewer({
  file,
  onClose,
  onStage,
  onUnstage,
  isStaged,
  stagedLines = [],
  onStageLine,
  onUnstageLine
}: DiffViewerProps) {
  // Simple line matcher to compute diff additions/removals
  const computeDiffLines = () => {
    const origLines = file.originalContent ? file.originalContent.split('\n') : [];
    const modLines = file.modifiedContent ? file.modifiedContent.split('\n') : [];

    // For added files, everything is additions
    if (file.status === 'added') {
      return modLines.map(line => ({ type: 'addition' as const, text: line }));
    }
    // For deleted files, everything is removals
    if (file.status === 'deleted') {
      return origLines.map(line => ({ type: 'deletion' as const, text: line }));
    }

    // Simple line diff logic for small file visualization
    // Match lines conceptually or do a side-by-side stream
    const combined: Array<{ type: 'addition' | 'deletion' | 'normal'; text: string }> = [];
    
    let oIdx = 0;
    let mIdx = 0;

    while (oIdx < origLines.length || mIdx < modLines.length) {
      if (oIdx < origLines.length && mIdx < modLines.length) {
        if (origLines[oIdx] === modLines[mIdx]) {
          combined.push({ type: 'normal', text: origLines[oIdx] });
          oIdx++;
          mIdx++;
        } else {
          // Check for edits: lookahead to see if lines sync later
          let foundSync = false;
          for (let look = 1; look < 4; look++) {
            if (oIdx + look < origLines.length && origLines[oIdx + look] === modLines[mIdx]) {
              // old lines were deleted
              for (let k = 0; k < look; k++) {
                combined.push({ type: 'deletion', text: origLines[oIdx + k] });
              }
              oIdx += look;
              foundSync = true;
              break;
            }
            if (mIdx + look < modLines.length && origLines[oIdx] === modLines[mIdx + look]) {
              // new lines were added
              for (let k = 0; k < look; k++) {
                combined.push({ type: 'addition', text: modLines[mIdx + k] });
              }
              mIdx += look;
              foundSync = true;
              break;
            }
          }
          if (!foundSync) {
            // General replace replacement
            combined.push({ type: 'deletion', text: origLines[oIdx] });
            combined.push({ type: 'addition', text: modLines[mIdx] });
            oIdx++;
            mIdx++;
          }
        }
      } else if (oIdx < origLines.length) {
        combined.push({ type: 'deletion', text: origLines[oIdx] });
        oIdx++;
      } else {
        combined.push({ type: 'addition', text: modLines[mIdx] });
        mIdx++;
      }
    }

    return combined;
  };

  const diffLines = computeDiffLines();

  return (
    <div className="flex bg-[#121212] p-4 font-sans select-none overflow-hidden flex-col flex-1 min-h-0">
      
      {/* Header info */}
      <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4 shrink-0">
        <div className="flex items-center gap-2">
          <FileText size={15} className="text-blue-400" />
          <h2 className="text-white/80 font-semibold text-sm tracking-tight">
            Local Diff Inspector: <span className="font-mono text-xs bg-white/5 border border-white/10 px-2 py-0.5 rounded text-white">{file.filename}</span>
          </h2>
        </div>

        <div className="flex items-center gap-3">
          {/* Status Indicator */}
          <span className={`text-[9px] tracking-widest uppercase font-extrabold px-1.5 py-0.5 rounded border ${
            file.status === 'added' ? 'text-emerald-400 bg-emerald-950/20 border-emerald-950/40' :
            file.status === 'deleted' ? 'text-rose-400 bg-rose-950/20 border-rose-950/40' : 
            'text-amber-400 bg-amber-950/20 border-amber-950/40'
          }`}>
            {file.status} file
          </span>

          {onStage && !isStaged && (
            <button
              onClick={() => onStage(file.filename)}
              className="px-3 py-1 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-semibold transition-all cursor-pointer border border-blue-500/10 shadow-lg shadow-blue-500/5"
            >
              Stage Entire File
            </button>
          )}

          {onUnstage && isStaged && (
            <button
              onClick={() => onUnstage(file.filename)}
              className="px-3 py-1 rounded-md bg-zinc-700 hover:bg-zinc-650 text-white text-[11px] font-semibold transition-all cursor-pointer border border-white/5"
            >
              Unstage Entire File
            </button>
          )}

          <button
            onClick={onClose}
            className="text-white/40 hover:text-white px-2.5 py-1 rounded hover:bg-white/5 transition-all text-xs cursor-pointer"
          >
            ✕ Close View
          </button>
        </div>
      </div>

      {/* Main Diff list */}
      <div className="flex-1 bg-[#181818] border border-white/10 rounded-xl overflow-y-auto p-4 font-mono text-[11px] leading-relaxed select-text pr-2 scrollbar-thin">
        {diffLines.length === 0 ? (
          <div className="text-white/20 italic select-none text-center pt-8">File has no modifications (content is identical)</div>
        ) : (
          <div className="space-y-[1px]">
            {diffLines.map((line, idx) => {
              let lineStyle = 'text-white/40 hover:bg-white/[0.01] border-l border-transparent';
              let linePrefix = ' ';
              if (line.type === 'addition') {
                lineStyle = 'text-emerald-400 bg-emerald-950/15 border-l-2 border-emerald-500 font-medium px-1';
                linePrefix = '+';
              } else if (line.type === 'deletion') {
                lineStyle = 'text-rose-450 bg-rose-950/15 border-l-2 border-rose-500 line-through px-1';
                linePrefix = '-';
              }

              const isAdditionOrDeletion = line.type === 'addition' || line.type === 'deletion';
              const isLineStaged = isAdditionOrDeletion && stagedLines.some(
                sl => sl.text === line.text && sl.type === line.type
              );

              return (
                <div key={idx} className={`flex items-center gap-3 py-1 transition-colors ${lineStyle}`}>
                  {/* Line Number helper column */}
                  <span className="w-6 text-right text-white/20 font-mono text-[10px] select-none shrink-0 pr-1.5 border-r border-white/5">
                    {idx + 1}
                  </span>
                  {/* Inline Symbol +/- */}
                  <span className="w-2 select-none text-white/30 font-bold font-mono text-center">{linePrefix}</span>
                  
                  {/* Interactive stage/unstage button for line/hunk */}
                  {onStageLine && onUnstageLine && isAdditionOrDeletion && (
                    <button
                      onClick={() => {
                        if (isLineStaged) {
                          onUnstageLine(file.filename, { text: line.text, type: line.type as 'addition' | 'deletion' });
                        } else {
                          onStageLine(file.filename, { text: line.text, type: line.type as 'addition' | 'deletion' });
                        }
                      }}
                      className={`px-1.5 py-0.5 rounded text-[9px] font-mono cursor-pointer transition-all border shrink-0 scale-90 ${
                        isLineStaged 
                          ? 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border-emerald-500/30 font-semibold' 
                          : 'bg-white/5 hover:bg-white/10 text-white/40 hover:text-white border-white/5'
                      }`}
                      title={isLineStaged ? "Click to unstage this line change" : "Stage this single line change"}
                    >
                      {isLineStaged ? '✓ Staged' : '+ Stage'}
                    </button>
                  )}

                  {/* Text value */}
                  <span className="whitespace-pre overflow-x-auto select-text flex-1">{line.text || ' '}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer hint */}
      <div className="mt-3 text-[9px] text-white/30 uppercase tracking-widest font-mono flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <ChevronRight size={11} className="text-white/10" />
          <span>Added edits are highlighted in green, deletions in red.</span>
        </div>
        <span>ESC or Click Close to escape</span>
      </div>

    </div>
  );
}

import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Trash, ShieldAlert, GitBranch, Cpu, MessageSquare } from 'lucide-react';
import { GitState } from '../types';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AiPanelProps {
  state: GitState;
  isOpen: boolean;
  onClose: () => void;
}

// Lightweight, safe markdown formatter mimicking codeblocks, list points, and bullet grids
function CustomResponseFormatter({ text }: { text: string }) {
  const lines = text.split('\n');
  let insideCodeBlock = false;
  let codeBlockLines: string[] = [];

  return (
    <div className="space-y-2 text-zinc-300 font-sans text-xs leading-relaxed">
      {lines.map((line, idx) => {
        // Code blocks switcher
        if (line.trim().startsWith('```')) {
          if (insideCodeBlock) {
            insideCodeBlock = false;
            const content = codeBlockLines.join('\n');
            codeBlockLines = [];
            return (
              <pre key={idx} className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-850 font-mono text-[11px] text-cyan-330 overflow-x-auto my-2 select-all leading-normal">
                <code>{content}</code>
              </pre>
            );
          } else {
            insideCodeBlock = true;
            return null;
          }
        }

        if (insideCodeBlock) {
          codeBlockLines.push(line);
          return null;
        }

        // Headers
        if (line.trim().startsWith('###')) {
          return (
            <h4 key={idx} className="text-zinc-100 font-semibold text-xs pt-2 text-[#a78bfa] flex items-center gap-1">
              <Sparkles size={11} className="text-purple-400" />
              <span>{line.replace('###', '').trim()}</span>
            </h4>
          );
        }
        if (line.trim().startsWith('##')) {
          return (
            <h3 key={idx} className="text-zinc-50 font-bold text-xs pt-3 border-b border-zinc-900 pb-1 text-[#22d3ee]">
              {line.replace('##', '').trim()}
            </h3>
          );
        }

        // List bullets
        if (line.trim().startsWith('-') || line.trim().startsWith('*')) {
          return (
            <div key={idx} className="flex items-start gap-1.5 pl-2">
              <span className="text-[#a78bfa] pt-1">▪</span>
              <span>{line.substring(2).trim()}</span>
            </div>
          );
        }

        // Regular lines with inline code segments parsing
        const formattedLine = line.split(/(`[^`]+`)/g).map((part, pIdx) => {
          if (part.startsWith('`') && part.endsWith('`')) {
            return (
              <code key={pIdx} className="bg-zinc-900 border border-zinc-800 text-teal-400 px-1 py-0.5 rounded font-mono text-[10.5px]">
                {part.slice(1, -1)}
              </code>
            );
          }
          return part;
        });

        return (
          <p key={idx} className="min-h-[1px]">
            {formattedLine}
          </p>
        );
      })}
    </div>
  );
}

export default function AiPanel({ state, isOpen, onClose }: AiPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `### Ahoy, Developer! 🐙\n\nI am **Nest AI**, your built-in Git Command Advisor. I can help simplify complex merge planning, analyze diffs, write commits, and design flawless git layouts!\n\n**Select a macro trigger below or write any question:**`
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    setMessages(prev => [...prev, { role: 'user', content: textToSend }]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/gemini/assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: textToSend,
          context: {
            activeBranchName: state.activeBranchName,
            branches: state.branches,
            conflicts: state.conflicts,
            stashes: state.stashes
          }
        })
      });

      if (!response.ok) {
        throw new Error('API server returned response error status');
      }

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.text || 'Sorry, couldn\'t parse reply.' }]);
    } catch (err: any) {
      setMessages(prev => [
        ...prev, 
        { 
          role: 'assistant', 
          content: `### ❌ Communication Error\n\nFailed to route prompt payload to local server proxy endpoint. Please confirm the servers are online.\n\nError traceback: \`${err.message}\`` 
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        role: 'assistant',
        content: `### Ahoy, Developer! 🐙\n\nChat logs cleared. Ask me any workflow question about branching, staging, stashing, or conflict trees.`
      }
    ]);
  };

  if (!isOpen) return null;

  return (
    <aside className="w-80 bg-[#181818] border-l border-white/5 flex flex-col h-full shrink-0 select-none font-sans">
      
      {/* Header */}
      <div className="bg-[#1e1e1e] border-b border-white/10 p-3 h-12 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-amber-400 animate-pulse" />
          <span className="text-white/80 font-semibold text-xs tracking-tight">Nest AI Assistant</span>
        </div>
        
        <div className="flex items-center gap-1.5">
          <button 
            onClick={clearChat}
            className="p-1 rounded hover:bg-white/5 text-white/40 hover:text-white/80 transition-colors cursor-pointer"
            title="Clear Chat Log"
          >
            <Trash size={12} />
          </button>
          <button 
            onClick={onClose}
            className="text-white/40 hover:text-white font-bold px-1.5 hover:bg-white/5 rounded transition-colors text-[11px] cursor-pointer"
            title="Close Panel"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Messages Scroll viewport */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin bg-[#121212] flex flex-col min-h-0">
        
        {messages.map((m, idx) => {
          const isAssistant = m.role === 'assistant';
          return (
            <div 
              key={idx}
              className={`flex flex-col max-w-[92%] p-3 rounded-xl border ${
                isAssistant 
                  ? 'bg-[#1e1e1e] border-white/10 text-zinc-300 self-start rounded-tl-none shadow-md' 
                  : 'bg-blue-600/10 border-blue-500/20 text-zinc-200 self-end rounded-tr-none shadow shadow-blue-500/5'
              }`}
            >
              {/* Profile icon label */}
              <div className="flex items-center gap-1.5 mb-1 text-[10px] font-bold tracking-wide uppercase">
                {isAssistant ? (
                  <>
                    <Cpu size={11} className="text-[#a78bfa]" />
                    <span className="text-[#a78bfa] font-mono">Nest AI</span>
                  </>
                ) : (
                  <>
                    <MessageSquare size={11} className="text-blue-400" />
                    <span className="text-blue-400 font-mono">Local Operator</span>
                  </>
                )}
              </div>

              {/* Formatted body */}
              <CustomResponseFormatter text={m.content} />
            </div>
          );
        })}

        {/* Loading Bubble */}
        {isLoading && (
          <div className="flex flex-col max-w-[85%] p-3 rounded-xl border bg-[#1e1e1e]/50 border-white/5 text-white/50 self-start rounded-tl-none animate-pulse">
            <div className="flex items-center gap-2 text-[10px] font-mono font-bold text-amber-500">
              <Cpu size={11} className="animate-spin" />
              <span>Thinking with Gemini...</span>
            </div>
            <div className="mt-1 text-[11px] italic">Drafting precise command guide...</div>
          </div>
        )}

      </div>

      {/* Micro Suggestive Prompt Pills Container */}
      <div className="p-3 border-t border-white/5 bg-[#181818] space-y-2">
        <div className="text-[9px] text-white/30 uppercase font-bold tracking-widest shrink-0">Macro Suggestions:</div>
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => handleSendMessage('Explain the difference between git merge and git rebase, when to use which?')}
            className="text-[10px] bg-[#121212] hover:bg-white/5 border border-white/10 rounded px-2.5 py-1.5 text-white/50 hover:text-white truncate max-w-full text-left transition-colors cursor-pointer"
          >
            💡 Merge vs Rebase Difference
          </button>
          <button
            onClick={() => handleSendMessage('I committed directly to main by mistake! How can I safely restore main back to before my commit, but preserve those changes on a separate branches?')}
            className="text-[10px] bg-[#121212] hover:bg-white/5 border border-white/10 rounded px-2.5 py-1.5 text-white/50 hover:text-white truncate max-w-full text-left transition-colors cursor-pointer"
          >
            🛠️ Committed to master by mistake
          </button>
          <button
            onClick={() => handleSendMessage('Explain the exact visual representation that GitNest uses for parallel railway lines.')}
            className="text-[10px] bg-[#121212] hover:bg-white/5 border border-white/10 rounded px-2.5 py-1.5 text-white/50 hover:text-white truncate max-w-full text-left transition-colors cursor-pointer"
          >
            ⚓ Visual branch graph lines guide
          </button>
        </div>
      </div>

      {/* Form Input Footer */}
      <div className="p-3 bg-[#1e1e1e] border-t border-white/10 shrink-0">
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(input);
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            placeholder="Ask Nest AI (e.g., rebase conflicts)..."
            className="flex-1 bg-[#121212] text-white border border-white/10 rounded px-3 py-2 text-xs focus:outline-none focus:border-blue-500 placeholder-zinc-700 disabled:opacity-40 transition-colors"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className={`p-2 rounded-md transition-colors border ${
              input.trim() && !isLoading
                ? 'bg-blue-600 hover:bg-blue-500 text-white border-blue-500/20 cursor-pointer'
                : 'bg-[#181818] text-white/20 border-white/5 cursor-not-allowed'
            }`}
          >
            <Send size={13} />
          </button>
        </form>
      </div>

    </aside>
  );
}

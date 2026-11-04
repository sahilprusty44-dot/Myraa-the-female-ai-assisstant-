import React, { useState, useRef, useEffect } from 'react';
import {
  Terminal as TerminalIcon,
  Send,
  Trash2,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Sparkles,
  Radio,
  CornerDownLeft,
  Zap,
} from 'lucide-react';
import { ThinkingOrb } from 'thinking-orbs';
import { ChatMessage, AssistantState, ThemeConfig } from '../types/live';

interface ChatTerminalProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  onClearMessages: () => void;
  isOpen: boolean;
  onToggleOpen: () => void;
  state: AssistantState;
  theme: ThemeConfig;
  latencyMs: number;
}

export const ChatTerminal: React.FC<ChatTerminalProps> = ({
  messages,
  onSendMessage,
  onClearMessages,
  isOpen,
  onToggleOpen,
  state,
  theme,
  latencyMs,
}) => {
  const [inputText, setInputText] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Auto-scroll to bottom on new message if user hasn't manually scrolled up
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, autoScroll]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 40;
    setAutoScroll(isAtBottom);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed) return;
    onSendMessage(trimmed);
    setInputText('');
    setAutoScroll(true);
  };

  const handleCopyMessage = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const quickPrompts = [
    'What can you help me with?',
    'Take a note for my project',
    'Open GitHub for me',
    'Explain quantum entanglement in 1 line',
  ];

  return (
    <>
      {/* Collapsed Toggle Trigger Pill (when terminal is closed on desktop) */}
      {!isOpen && (
        <button
          onClick={onToggleOpen}
          className="fixed left-3 top-20 z-40 hidden lg:flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900/90 border border-white/20 text-slate-300 hover:text-white hover:border-white/40 shadow-2xl backdrop-blur-xl transition-all duration-300 active:scale-95 group"
          title="Open Live Chat Terminal"
        >
          <TerminalIcon className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
          <span className="text-xs font-mono font-medium tracking-wide">TERMINAL</span>
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
        </button>
      )}

      {/* Cyberpunk Chat Terminal Docked on Left Side */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 transition-all duration-300 flex flex-col 
          bg-[#030712]/90 border-r border-white/10 backdrop-blur-2xl shadow-2xl
          ${
            isOpen
              ? 'w-full sm:w-[400px] lg:w-[420px] translate-x-0'
              : '-translate-x-full pointer-events-none'
          }`}
        style={{
          boxShadow: isOpen ? `0 0 50px -10px ${theme.glow}` : undefined,
        }}
      >
        {/* Terminal Header Bar */}
        <div className="px-4 py-3 border-b border-white/10 bg-slate-950/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center border shrink-0"
              style={{
                backgroundColor: `${theme.primary}20`,
                borderColor: `${theme.primary}40`,
              }}
            >
              <TerminalIcon className="w-4 h-4" style={{ color: theme.primary }} />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-white tracking-wider">
                  MYRAA // LIVE TERMINAL
                </span>
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    backgroundColor: state === 'disconnected' ? '#64748B' : theme.primary,
                  }}
                />
              </div>
              <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
                <span className="uppercase text-slate-400">
                  {state === 'disconnected' ? 'STANDBY' : 'SYNCED'}
                </span>
                {latencyMs > 0 && state !== 'disconnected' && (
                  <>
                    <span>·</span>
                    <span className="text-slate-500">{latencyMs}ms</span>
                  </>
                )}
                <span>·</span>
                <span className="text-slate-500">{messages.length} lines</span>
              </div>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <button
                onClick={onClearMessages}
                className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-white/5 transition-colors"
                title="Clear terminal log"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              onClick={onToggleOpen}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
              title="Collapse terminal"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live Conversation Stream Area */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-xs select-text scroll-smooth"
        >
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-4 py-8 text-slate-500 space-y-3">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center border border-white/10 bg-white/5"
              >
                <TerminalIcon className="w-6 h-6 text-slate-400" />
              </div>
              <div>
                <p className="text-xs font-mono text-slate-300 font-semibold tracking-wide">
                  REAL-TIME CONVERSATION FEED
                </p>
                <p className="text-[11px] text-slate-500 mt-1 max-w-[260px] leading-relaxed">
                  Speech transcription and text replies appear here live with timestamped telemetry as you talk or type.
                </p>
              </div>

              {/* Quick suggestions to kick off */}
              <div className="w-full pt-4 space-y-1.5 text-left">
                <span className="text-[10px] uppercase font-mono text-slate-500 block">
                  Suggested inquiries:
                </span>
                {quickPrompts.slice(0, 3).map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setInputText(prompt);
                      inputRef.current?.focus();
                    }}
                    className="w-full text-left p-2 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 text-slate-300 hover:text-white text-[11px] font-sans transition-all"
                  >
                    "{prompt}"
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => {
              const isUser = msg.sender === 'user';
              const isSystem = msg.sender === 'system';

              return (
                <div
                  key={msg.id}
                  className={`group relative rounded-xl p-3 border transition-all ${
                    isUser
                      ? 'bg-slate-900/60 border-emerald-500/30 hover:border-emerald-500/50'
                      : isSystem
                      ? 'bg-purple-950/40 border-purple-500/30 text-purple-200'
                      : 'bg-black/60 border-white/15 hover:border-white/30'
                  }`}
                >
                  {/* Message Meta Header */}
                  <div className="flex items-center justify-between gap-2 mb-1.5 pb-1 border-b border-white/5 text-[10px]">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`font-bold tracking-wider ${
                          isUser
                            ? 'text-emerald-400'
                            : isSystem
                            ? 'text-purple-400'
                            : 'text-cyan-400'
                        }`}
                        style={{
                          color: !isUser && !isSystem ? theme.primary : undefined,
                        }}
                      >
                        {isUser ? '[USER]' : isSystem ? '[SYSTEM]' : '[MYRAA]'}
                      </span>
                      <span className="text-slate-500 tabular-nums">
                        {msg.timestamp}
                      </span>
                      {msg.isLive && (
                        <span className="inline-flex items-center gap-1 text-[9px] text-amber-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                          LIVE
                        </span>
                      )}
                    </div>

                    {/* Copy message button */}
                    <button
                      onClick={() => handleCopyMessage(msg.text, msg.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-400 hover:text-white rounded"
                      title="Copy text"
                    >
                      {copiedId === msg.id ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>

                  {/* Message Text Content */}
                  <div className="font-sans text-xs sm:text-[13px] text-slate-200 leading-relaxed break-words whitespace-pre-wrap">
                    {msg.text}
                    {msg.isLive && (
                      <span
                        className="inline-block w-1.5 h-3.5 ml-1 animate-pulse align-middle"
                        style={{ backgroundColor: theme.primary }}
                      />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Jump to Latest Floating Pill */}
        {!autoScroll && messages.length > 0 && (
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20">
            <button
              onClick={() => {
                setAutoScroll(true);
                if (scrollRef.current) {
                  scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
                }
              }}
              className="px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-[11px] font-mono shadow-xl backdrop-blur-md hover:bg-cyan-500/30 transition-all flex items-center gap-1.5"
            >
              <span>Jump to latest</span>
              <CornerDownLeft className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Two-Way Input Command Bar */}
        <div className="p-3 border-t border-white/10 bg-slate-950/80 shrink-0">
          <form onSubmit={handleSubmit} className="space-y-2">
            <div className="relative flex items-center rounded-xl border border-white/15 bg-black/60 focus-within:border-white/40 focus-within:ring-1 focus-within:ring-white/20 transition-all">
              <span className="pl-3 text-xs font-mono text-cyan-400 select-none">
                &gt;
              </span>
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={
                  state === 'disconnected'
                    ? 'Type instruction or awaken Myraa...'
                    : 'Type a message to Myraa...'
                }
                className="w-full px-2.5 py-2.5 bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none font-sans"
              />

              <button
                type="submit"
                disabled={!inputText.trim()}
                className={`p-2 mr-1 rounded-lg transition-all ${
                  inputText.trim()
                    ? 'bg-white/20 hover:bg-white/30 text-white active:scale-95'
                    : 'text-slate-600 cursor-not-allowed'
                }`}
                title="Send instruction (Enter)"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 px-1">
              <span>Press [Enter] to transmit</span>
              <span className="flex items-center gap-1 text-slate-400">
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    backgroundColor: state === 'disconnected' ? '#64748B' : theme.primary,
                  }}
                />
                {state === 'disconnected' ? 'Offline' : 'Voice & Text Active'}
              </span>
            </div>
          </form>
        </div>
      </aside>
    </>
  );
};

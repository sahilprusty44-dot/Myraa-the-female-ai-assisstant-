import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  ChevronDown,
  ChevronUp,
  Volume2,
  Mic,
  Copy,
  Check,
  Trash2,
  CornerDownRight,
  Send,
} from 'lucide-react';
import { ThinkingOrb } from 'thinking-orbs';
import { ChatMessage, AssistantState, ThemeConfig } from '../types/live';

interface LiveResponseCardProps {
  messages: ChatMessage[];
  state: AssistantState;
  theme: ThemeConfig;
  outputVolume?: number;
  micVolume?: number;
  onClear?: () => void;
  onSendMessage?: (text: string) => void;
}

export const LiveResponseCard: React.FC<LiveResponseCardProps> = ({
  messages,
  state,
  theme,
  outputVolume = 0,
  micVolume = 0,
  onClear,
  onSendMessage,
}) => {
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [quickInput, setQuickInput] = useState<string>('');
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Auto-scroll to latest response
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickInput.trim() || !onSendMessage) return;
    onSendMessage(quickInput.trim());
    setQuickInput('');
  };

  // Find latest message from Myraa or User
  const latestMessage = messages[messages.length - 1];
  const isSpeaking = state === 'speaking' || outputVolume > 0.05;
  const isListening = state === 'listening' || micVolume > 0.05;

  return (
    <div
      className={`fixed bottom-4 left-4 sm:bottom-6 sm:left-6 z-40 transition-all duration-300 ease-out select-text ${
        isMinimized
          ? 'w-[260px] sm:w-[280px]'
          : 'w-[calc(100vw-32px)] sm:w-[380px] md:w-[420px]'
      }`}
    >
      <div
        className="rounded-2xl border border-white/10 bg-[#050814]/85 backdrop-blur-2xl shadow-2xl overflow-hidden transition-all duration-300"
        style={{
          boxShadow: `0 12px 40px -8px ${theme.glow}, 0 0 0 1px rgba(255, 255, 255, 0.07)`,
        }}
      >
        {/* Header Bar */}
        <div className="px-3.5 py-2.5 bg-slate-950/70 border-b border-white/10 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {/* ThinkingOrb Micro Indicator */}
            <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0">
              <ThinkingOrb
                state={
                  state === 'speaking'
                    ? 'composing'
                    : state === 'thinking'
                    ? 'searching'
                    : state === 'listening'
                    ? 'listening'
                    : 'breathing'
                }
                size={20}
                speed={isSpeaking ? 1.4 : 1}
                theme="dark"
                color={theme.primary}
              />
            </div>

            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[12px] font-semibold text-white tracking-wide truncate">
                  Myraa Live
                </span>
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0 animate-pulse"
                  style={{ backgroundColor: theme.primary }}
                />
              </div>
            </div>
          </div>

          {/* Right Action Icons: Audio waveform indicator & minimize/clear */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Animated Equalizer Wave when speaking */}
            {isSpeaking && (
              <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-white/5 border border-white/10">
                <Volume2 className="w-3 h-3 text-cyan-400 mr-0.5" />
                <span
                  className="w-0.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"
                  style={{ animationDuration: '400ms' }}
                />
                <span
                  className="w-0.5 h-3.5 rounded-full bg-cyan-300 animate-pulse"
                  style={{ animationDuration: '600ms' }}
                />
                <span
                  className="w-0.5 h-2 rounded-full bg-cyan-400 animate-pulse"
                  style={{ animationDuration: '500ms' }}
                />
              </div>
            )}

            {/* Listening Mic Wave when user speaking */}
            {isListening && !isSpeaking && (
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <Mic className="w-3 h-3 animate-pulse" />
                <span className="text-[10px] font-mono">Listening</span>
              </div>
            )}

            {/* Clear Button */}
            {messages.length > 0 && onClear && (
              <button
                type="button"
                onClick={onClear}
                className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                title="Clear conversation"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Minimize / Expand Toggle */}
            <button
              type="button"
              onClick={() => setIsMinimized((prev) => !prev)}
              className="p-1 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              title={isMinimized ? 'Expand conversation' : 'Minimize box'}
            >
              {isMinimized ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Minimized Teaser View */}
        {isMinimized && (
          <div className="p-3 bg-slate-950/40">
            {latestMessage ? (
              <div className="flex items-start gap-2">
                <span className="text-[11px] font-mono text-cyan-400 shrink-0 font-medium">
                  {latestMessage.sender === 'user' ? 'You:' : 'Myraa:'}
                </span>
                <p className="text-xs text-slate-300 truncate font-sans">
                  {latestMessage.text}
                </p>
              </div>
            ) : (
              <p className="text-[11px] font-mono text-slate-400 truncate">
                Say "Hey Myraa" to start...
              </p>
            )}
          </div>
        )}

        {/* Expanded Transcript Stream */}
        {!isMinimized && (
          <>
            <div
              ref={scrollRef}
              className="p-3.5 max-h-[260px] sm:max-h-[300px] overflow-y-auto space-y-3 font-sans text-xs scrollbar-thin scrollbar-thumb-white/10"
            >
              {messages.length === 0 ? (
                <div className="py-6 px-3 flex flex-col items-center justify-center text-center">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center mb-2 border border-white/10"
                    style={{ backgroundColor: `${theme.primary}15` }}
                  >
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                  </div>
                  <p className="text-slate-300 text-xs font-medium">
                    Real-Time Dialogue Stream
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1 font-mono">
                    Say "Hy Myraa" or type below to talk in real-time
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isUser = msg.sender === 'user';
                  return (
                    <div
                      key={msg.id}
                      className={`group relative flex flex-col rounded-xl p-2.5 transition-all ${
                        isUser
                          ? 'bg-white/5 border border-white/5 ml-4'
                          : 'bg-cyan-950/20 border border-cyan-500/20 mr-2'
                      }`}
                    >
                      {/* Speaker & Timestamp */}
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-1.5 font-mono text-[10px] tracking-wider uppercase font-semibold">
                          {isUser ? (
                            <span className="text-slate-400 flex items-center gap-1">
                              <CornerDownRight className="w-2.5 h-2.5" />
                              You
                            </span>
                          ) : (
                            <span className="text-cyan-400 flex items-center gap-1">
                              <Sparkles className="w-2.5 h-2.5" />
                              Myraa
                            </span>
                          )}
                          {msg.isLive && (
                            <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] bg-cyan-500/20 text-cyan-300 font-normal normal-case animate-pulse">
                              live
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-400 font-mono tabular-nums">
                            {msg.timestamp}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(msg.text, msg.id)}
                            className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-white rounded transition-opacity"
                            title="Copy text"
                          >
                            {copiedId === msg.id ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Message Content with typewriter effect indicator when streaming */}
                      <p className="text-slate-200 text-xs sm:text-[13px] leading-relaxed whitespace-pre-wrap break-words font-sans">
                        {msg.text}
                        {msg.isLive && (
                          <span
                            className="inline-block w-1.5 h-3.5 ml-1 align-middle animate-pulse"
                            style={{ backgroundColor: theme.primary }}
                          />
                        )}
                      </p>
                    </div>
                  );
                })
              )}
            </div>

            {/* Compact Quick-Type Input Bar for hybrid voice/text input */}
            {onSendMessage && (
              <form
                onSubmit={handleQuickSubmit}
                className="px-3 py-2 bg-slate-950/80 border-t border-white/10 flex items-center gap-1.5"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={quickInput}
                  onChange={(e) => setQuickInput(e.target.value)}
                  placeholder="Type a message or speak..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400/50 transition-colors"
                />
                <button
                  type="submit"
                  disabled={!quickInput.trim()}
                  className="p-1.5 rounded-xl bg-cyan-500/20 border border-cyan-400/30 text-cyan-300 hover:bg-cyan-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0"
                  title="Send message"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
};

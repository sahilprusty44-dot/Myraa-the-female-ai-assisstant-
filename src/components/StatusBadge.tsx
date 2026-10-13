import React from 'react';
import { Sparkles, Mic, MicOff, Settings2, Zap, BookOpen, Activity } from 'lucide-react';
import { ThinkingOrb, OrbState } from 'thinking-orbs';
import { AssistantState, ThemeConfig } from '../types/live';

interface StatusBadgeProps {
  state: AssistantState;
  theme: ThemeConfig;
  latencyMs: number;
  isMuted: boolean;
  notesCount: number;
  toolsCount: number;
  onToggleMute: () => void;
  onOpenDrawer: () => void;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  state,
  theme,
  latencyMs,
  isMuted,
  notesCount,
  toolsCount,
  onToggleMute,
  onOpenDrawer,
}) => {
  const getOrbState = (): OrbState => {
    switch (state) {
      case 'disconnected':
        return 'breathing';
      case 'connecting':
        return 'connecting';
      case 'listening':
        return 'listening';
      case 'speaking':
        return 'composing';
      case 'thinking':
        return 'searching';
      default:
        return 'working';
    }
  };
  const getBadgeContent = () => {
    switch (state) {
      case 'disconnected':
        return {
          text: 'STANDBY',
          dotClass: 'bg-slate-500',
          textColor: 'text-slate-400',
        };
      case 'connecting':
        return {
          text: 'CONNECTING',
          dotClass: 'bg-amber-400 animate-ping',
          textColor: 'text-amber-300',
        };
      case 'listening':
        return {
          text: 'LISTENING',
          dotClass: 'bg-emerald-400 animate-pulse',
          textColor: 'text-emerald-300',
        };
      case 'speaking':
        return {
          text: 'SPEAKING',
          dotClass: 'bg-cyan-400 animate-ping',
          textColor: 'text-cyan-300',
        };
      case 'thinking':
        return {
          text: 'WORKING',
          dotClass: 'bg-purple-400 animate-pulse',
          textColor: 'text-purple-300',
        };
    }
  };

  const badge = getBadgeContent();

  return (
    <header className="w-full max-w-4xl px-4 py-3 sm:py-4 flex items-center justify-between z-30 select-none">
      {/* Brand & Assistant Persona Identity */}
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-2xl flex items-center justify-center backdrop-blur-xl border border-white/20 shadow-lg relative group overflow-hidden"
          style={{
            background: `radial-gradient(circle at 30% 30%, ${theme.primary}40, rgba(15, 23, 42, 0.8))`,
          }}
        >
          <Sparkles className="w-5 h-5" style={{ color: theme.primary }} />
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-40 transition-opacity"
            style={{ backgroundColor: theme.primary }}
          />
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-1.5">
              <span>Myraa</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-mono bg-white/10 text-slate-300 border border-white/10 font-normal">
                LIVE
              </span>
            </h1>
          </div>
          <p className="text-[11px] text-slate-400 hidden xs:block">
            Voice-to-Voice Companion
          </p>
        </div>
      </div>

      {/* Center Status Pill with ThinkingOrb from thinking-orbs */}
      <div className="flex items-center gap-2">
        <div
          className="flex items-center gap-2 px-3 py-1 rounded-full backdrop-blur-xl border border-white/10 bg-slate-900/80 shadow-inner"
        >
          <div className="w-5 h-5 flex items-center justify-center shrink-0">
            <ThinkingOrb
              size={20}
              state={getOrbState()}
              theme="dark"
              color={theme.primary}
            />
          </div>
          <span className={`text-[11px] font-mono font-medium tracking-wider ${badge.textColor}`}>
            {badge.text}
          </span>
          {latencyMs > 0 && state !== 'disconnected' && (
            <span className="text-[10px] font-mono text-slate-500 hidden sm:inline pl-1 border-l border-white/10 flex items-center gap-0.5">
              <Zap className="w-2.5 h-2.5 text-amber-400 inline" />
              {latencyMs}ms
            </span>
          )}
        </div>
      </div>

      {/* Control Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {state !== 'disconnected' && (
          <button
            onClick={onToggleMute}
            className={`p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-mono backdrop-blur-md border transition-all flex items-center gap-1.5 ${
              isMuted
                ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
            }`}
            title={isMuted ? 'Microphone Muted' : 'Microphone Live'}
          >
            {isMuted ? <MicOff className="w-4 h-4 text-rose-400" /> : <Mic className="w-4 h-4 text-emerald-400" />}
            <span className="hidden md:inline">{isMuted ? 'Muted' : 'Mic Live'}</span>
          </button>
        )}

        {/* Companion Drawer Button with Badge counter */}
        <button
          onClick={onOpenDrawer}
          className="relative p-2 sm:px-3 sm:py-2 rounded-xl text-xs backdrop-blur-md border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 transition-all flex items-center gap-1.5 shadow-md active:scale-95"
          title="Companion Notepad & Settings"
        >
          <Settings2 className="w-4 h-4 text-slate-300" />
          <span className="hidden sm:inline font-sans text-xs">Companion</span>
          {(notesCount > 0 || toolsCount > 0) && (
            <span
              className="w-4 h-4 rounded-full text-[9px] font-mono flex items-center justify-center text-slate-900 font-bold"
              style={{ backgroundColor: theme.primary }}
            >
              {notesCount + toolsCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};

import React, { useState } from 'react';
import { Mic, MicOff, Power, Volume2, Sparkles } from 'lucide-react';
import { ThinkingOrb } from 'thinking-orbs';
import { AssistantState, ThemeConfig, VisualVibe } from '../types/live';

interface MicroOrbAvatarProps {
  state: AssistantState;
  theme: ThemeConfig;
  vibe: VisualVibe;
  micVolume: number;
  outputVolume: number;
  isMuted: boolean;
  onToggleConnect: () => void;
  onToggleMute: () => void;
}

export const MicroOrbAvatar: React.FC<MicroOrbAvatarProps> = ({
  state,
  theme,
  vibe,
  micVolume,
  outputVolume,
  isMuted,
  onToggleConnect,
  onToggleMute,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const isSpeaking = state === 'speaking' || outputVolume > 0.05;
  const isListening = state === 'listening' || micVolume > 0.05;

  // Audio-reactive scale bounce
  const audioScale = 1 + Math.min(outputVolume * 0.25 + micVolume * 0.15, 0.35);

  return (
    <div className="fixed bottom-6 right-6 z-40 select-none animate-in fade-in slide-in-from-bottom-6 duration-500">
      <div
        className="relative group flex items-center justify-center cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={onToggleConnect}
      >
        {/* Glow Halo */}
        <div
          className="absolute -inset-2 rounded-full opacity-60 blur-xl transition-all duration-300 group-hover:opacity-100"
          style={{
            backgroundColor: theme.primary,
            transform: `scale(${audioScale})`,
          }}
        />

        {/* 80px Circular Frosted Glass Medallion */}
        <div
          className="relative w-20 h-20 rounded-full border border-white/20 bg-[#040612]/90 backdrop-blur-2xl shadow-2xl flex items-center justify-center overflow-hidden transition-transform duration-200 active:scale-95"
          style={{
            boxShadow: `0 8px 32px -4px ${theme.glow}, inset 0 0 16px rgba(255, 255, 255, 0.08)`,
          }}
        >
          {/* Animated Wave Ring when speaking */}
          {isSpeaking && (
            <div
              className="absolute inset-1 rounded-full border border-dashed border-cyan-400/40 animate-spin"
              style={{ animationDuration: '6s' }}
            />
          )}

          {/* ThinkingOrb Micro Nucleus */}
          <div
            className="transition-transform duration-150"
            style={{ transform: `scale(${audioScale})` }}
          >
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
              size={64}
              speed={isSpeaking ? 1.4 : 1}
              theme="dark"
              color={theme.primary}
            />
          </div>

          {/* Subtle Center Power Icon on Hover when Disconnected */}
          {state === 'disconnected' && isHovered && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center">
              <Power className="w-5 h-5 text-emerald-400 animate-pulse" />
            </div>
          )}
        </div>

        {/* Floating Mic Mute Mini Toggle Badge */}
        {state !== 'disconnected' && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleMute();
            }}
            className={`absolute -bottom-1 -right-1 p-1.5 rounded-full border shadow-lg backdrop-blur-md transition-all active:scale-90 ${
              isMuted
                ? 'bg-rose-500/80 border-rose-400 text-white'
                : 'bg-slate-900/90 border-white/20 text-slate-300 hover:text-white'
            }`}
            title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
          >
            {isMuted ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3 text-emerald-400" />}
          </button>
        )}

        {/* Small Companion Label Tooltip on Hover */}
        <div
          className={`absolute bottom-full mb-2 px-2.5 py-1 rounded-lg bg-slate-950/90 border border-white/10 text-[10px] font-mono whitespace-nowrap text-slate-300 transition-all pointer-events-none shadow-xl ${
            isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'
          }`}
        >
          Myraa Core · {state.toUpperCase()}
        </div>
      </div>
    </div>
  );
};

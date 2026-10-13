import React from 'react';
import { ExternalLink, X, Globe, Sparkles, Check } from 'lucide-react';
import { ThinkingOrb } from 'thinking-orbs';
import { ActivePortal, ThemeConfig } from '../types/live';

interface PortalCardProps {
  portal: ActivePortal | null;
  theme: ThemeConfig;
  onClose: () => void;
}

export const PortalCard: React.FC<PortalCardProps> = ({ portal, theme, onClose }) => {
  if (!portal) return null;

  return (
    <div className="fixed bottom-24 sm:bottom-28 left-1/2 transform -translate-x-1/2 z-40 w-[92%] max-w-md animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div
        className="relative overflow-hidden rounded-2xl p-4 backdrop-blur-2xl border border-white/20 bg-slate-900/80 shadow-2xl"
        style={{
          boxShadow: `0 16px 40px -10px ${theme.glow}, inset 0 1px 0 rgba(255,255,255,0.2)`,
        }}
      >
        {/* Ambient Top Glow Line */}
        <div
          className="absolute top-0 left-0 right-0 h-[2px]"
          style={{
            background: `linear-gradient(90deg, transparent, ${theme.primary}, transparent)`,
          }}
        />

        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className="p-1 rounded-xl border border-white/10 flex items-center justify-center shrink-0 w-10 h-10 overflow-hidden"
              style={{ backgroundColor: `${theme.primary}20` }}
            >
              <ThinkingOrb size={20} state="solving" theme="dark" color={theme.primary} />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono tracking-wider uppercase text-slate-400">
                  BROWSER TOOL EXECUTED
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <h3 className="text-base font-semibold text-white truncate">
                {portal.title}
              </h3>
              <p className="text-xs text-slate-400 font-mono truncate max-w-[220px] sm:max-w-[280px]">
                {portal.url}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Button */}
        <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between gap-2">
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" />
            Requested by Myraa
          </span>

          <a
            href={portal.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-900 font-sans shadow-md hover:brightness-110 active:scale-95 transition-all"
            style={{ backgroundColor: theme.primary }}
          >
            <span>Visit Destination</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};

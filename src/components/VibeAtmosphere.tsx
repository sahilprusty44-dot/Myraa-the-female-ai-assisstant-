import React from 'react';
import { ThemeConfig, VisualVibe, AssistantState } from '../types/live';

interface VibeAtmosphereProps {
  theme: ThemeConfig;
  vibe: VisualVibe;
  state: AssistantState;
}

export const VibeAtmosphere: React.FC<VibeAtmosphereProps> = ({ theme, vibe, state }) => {
  const isMonochrome = theme.primary.toUpperCase() === '#FFFFFF';

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden select-none -z-10">
      {/* Deep Space Foundation: Pure pitch black for Etienne Jacob monochrome, or deep obsidian for themes */}
      <div
        className="absolute inset-0 transition-colors duration-700"
        style={{ backgroundColor: isMonochrome ? '#000000' : '#04060C' }}
      />

      {/* Primary Radial Cosmic Glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] sm:w-[850px] sm:h-[850px] rounded-full blur-[140px] transition-all duration-1000"
        style={{
          background: isMonochrome
            ? `radial-gradient(circle, rgba(255,255,255,0.08) 0%, rgba(200,210,230,0.03) 50%, transparent 70%)`
            : `radial-gradient(circle, ${theme.primary} 0%, ${theme.secondary} 40%, transparent 70%)`,
          opacity: isMonochrome ? 0.6 : 0.28,
          transform: `translate(-50%, -50%) scale(${
            state === 'speaking' ? 1.25 : state === 'listening' ? 1.12 : 0.95
          })`,
        }}
      />

      {/* Secondary Ambient Accent Spotlights (only when accented) */}
      {!isMonochrome && (
        <>
          <div
            className="absolute -top-40 -left-40 w-96 h-96 rounded-full blur-[100px] opacity-20 transition-colors duration-1000"
            style={{ backgroundColor: theme.primary }}
          />
          <div
            className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full blur-[100px] opacity-20 transition-colors duration-1000"
            style={{ backgroundColor: theme.secondary }}
          />
        </>
      )}

      {/* Minimalist Grid Texture Overlay */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }}
      />

      {/* Subtle Vignette Rim */}
      <div className="absolute inset-0 bg-radial-vignette opacity-90" />
    </div>
  );
};

import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { OrbState } from 'thinking-orbs';
import {
  AssistantState,
  ThemeAccent,
  VisualVibe,
  NoteItem,
  ToolActionLog,
  ActivePortal,
  ChatMessage,
} from './types/live';
import { THEMES } from './utils/theme';
import { ToolManager } from './services/ToolManager';
import { LiveSession } from './services/LiveSession';
import { StatusBadge } from './components/StatusBadge';
import { CoreOrb } from './components/CoreOrb';
import { Visualizer } from './components/Visualizer';
import { PortalCard } from './components/PortalCard';
import { CompanionDrawer } from './components/CompanionDrawer';
import { VibeAtmosphere } from './components/VibeAtmosphere';
import { NotificationBanner } from './components/NotificationBanner';
import { LiveResponseCard } from './components/LiveResponseCard';
import { SpatialCanvas } from './components/SpatialCanvas';
import { MicroOrbAvatar } from './components/MicroOrbAvatar';
import { Scene3DConfig } from './types/live';
import { Volume2, Sparkles } from 'lucide-react';

export default function App() {
  const [assistantState, setAssistantState] = useState<AssistantState>('disconnected');
  const [micVolume, setMicVolume] = useState<number>(0);
  const [outputVolume, setOutputVolume] = useState<number>(0);
  const [latencyMs, setLatencyMs] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Customization & Companion state
  const [themeAccent, setThemeAccent] = useState<ThemeAccent>('monochrome');
  const [vibe, setVibe] = useState<VisualVibe>('energetic');
  const [voice, setVoice] = useState<string>('Aoede');
  const [model, setModel] = useState<string>('gemini-3.1-flash-live-preview');
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [activePortal, setActivePortal] = useState<ActivePortal | null>(null);

  // Libraries.dev ThinkingOrb State & Controls
  const [customOrbState, setCustomOrbState] = useState<OrbState | undefined>(undefined);
  const [orbSpeed, setOrbSpeed] = useState<number>(1);
  const [isOrbPaused, setIsOrbPaused] = useState<boolean>(false);
  const [showNucleusOrb, setShowNucleusOrb] = useState<boolean>(true);

  // Real-Time Transcript History (kept for session memory / notes)
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // 3D Spatial Canvas & Model Showcase State
  const [scene3D, setScene3D] = useState<Scene3DConfig>({
    isOpen: false,
    archetype: 'drone',
    materialPreset: 'default',
    explodeFactor: 0,
    rotationSpeed: 1,
    isWireframe: false,
  });

  // Companion Notepad & Tool History
  const [notes, setNotes] = useState<NoteItem[]>(() => {
    try {
      const saved = localStorage.getItem('myraa_notes');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [toolLogs, setToolLogs] = useState<ToolActionLog[]>([]);

  // Persistent tool manager instance
  const toolManagerRef = useRef<ToolManager | null>(null);
  const liveSessionRef = useRef<LiveSession | null>(null);

  // Sync notes to local storage
  useEffect(() => {
    try {
      localStorage.setItem('myraa_notes', JSON.stringify(notes));
    } catch (e) {
      // ignore
    }
  }, [notes]);

  // Initialize tool manager and live session
  useEffect(() => {
    const tm = new ToolManager({
      onPortalOpen: (portal) => {
        setActivePortal(portal);
      },
      onThemeChange: (newTheme) => {
        setThemeAccent(newTheme);
      },
      onNoteAdded: (note) => {
        setNotes((prev) => [note, ...prev]);
      },
      onVibeChange: (newVibe) => {
        setVibe(newVibe);
      },
      onOpen3DCanvas: (cfg) => {
        setScene3D((prev) => ({
          ...prev,
          isOpen: true,
          archetype: cfg.archetype,
          materialPreset: cfg.materialPreset || prev.materialPreset,
        }));
      },
      onClose3DCanvas: () => {
        setScene3D((prev) => ({ ...prev, isOpen: false }));
      },
      onManipulate3D: (params) => {
        setScene3D((prev) => ({
          ...prev,
          explodeFactor: params.explodeFactor !== undefined ? params.explodeFactor : prev.explodeFactor,
          rotationSpeed: params.rotationSpeed !== undefined ? params.rotationSpeed : prev.rotationSpeed,
          materialPreset: params.materialPreset || prev.materialPreset,
          isWireframe: params.isWireframe !== undefined ? params.isWireframe : prev.isWireframe,
        }));
      },
      onActionLogged: (log) => {
        setToolLogs((prev) => [log, ...prev.slice(0, 40)]);
        const timestamp = new Date().toTimeString().split(' ')[0];
        setMessages((prev) => [
          ...prev,
          {
            id: Math.random().toString(36).substring(2, 9),
            sender: 'system',
            text: `[SYS_EXEC] ${log.toolName}: ${log.summary}`,
            timestamp,
          },
        ]);
      },
    });

    toolManagerRef.current = tm;

    const session = new LiveSession(tm, {
      onStateChange: (newState) => {
        setAssistantState(newState);
      },
      onVolumeChange: (mVol, oVol) => {
        setMicVolume(mVol);
        setOutputVolume(oVol);
      },
      onError: (msg) => {
        setErrorMessage(msg);
      },
      onLatencyUpdate: (ms) => {
        setLatencyMs(ms);
      },
      onTranscript: (text, sender, isFinal) => {
        const timestamp = new Date().toTimeString().split(' ')[0];
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          // If streaming chunk from same sender
          if (last && last.sender === sender && last.isLive) {
            if (isFinal) {
              return [
                ...prev.slice(0, -1),
                {
                  ...last,
                  text: sender === 'myraa' ? (last.text + text).trim() : text,
                  isLive: false,
                },
              ];
            } else {
              return [
                ...prev.slice(0, -1),
                {
                  ...last,
                  text: sender === 'myraa' ? last.text + text : text,
                  isLive: true,
                },
              ];
            }
          }

          if (!text.trim()) return prev;
          return [
            ...prev,
            {
              id: Math.random().toString(36).substring(2, 9),
              sender,
              text,
              timestamp,
              isLive: !isFinal,
            },
          ];
        });
      },
    });

    liveSessionRef.current = session;

    return () => {
      session.disconnect();
    };
  }, []);

  // Update session settings when voice or model changes
  useEffect(() => {
    if (liveSessionRef.current) {
      liveSessionRef.current.setVoice(voice);
      liveSessionRef.current.setModel(model);
    }
  }, [voice, model]);

  const activeTheme = useMemo(() => THEMES[themeAccent] || THEMES.monochrome, [themeAccent]);

  // Connect / Disconnect trigger
  const handleToggleConnect = async () => {
    setErrorMessage(null);
    if (!liveSessionRef.current) return;

    if (assistantState === 'disconnected') {
      try {
        await liveSessionRef.current.connect();
      } catch (err: any) {
        setErrorMessage(err?.message || 'Failed to start session');
      }
    } else {
      liveSessionRef.current.disconnect();
    }
  };

  // Mute toggle
  const handleToggleMute = () => {
    if (!liveSessionRef.current) return;
    const nextMute = !isMuted;
    liveSessionRef.current.setMuted(nextMute);
    setIsMuted(nextMute);
  };

  const handleDeleteNote = (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  const handleSendMessage = async (text: string) => {
    if (!liveSessionRef.current) return;
    if (assistantState === 'disconnected') {
      try {
        await liveSessionRef.current.connect();
      } catch (err: any) {
        setErrorMessage(err?.message || 'Failed to connect to voice session');
        return;
      }
    }
    liveSessionRef.current.sendTextMessage(text);
  };

  const handleClearMessages = () => {
    setMessages([]);
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between overflow-x-hidden bg-[#06080F] text-slate-100 font-sans">
      {/* Immersive Animated Atmosphere */}
      <VibeAtmosphere theme={activeTheme} vibe={vibe} state={assistantState} />

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col justify-between w-full">
        {/* Floating Error / Notification Banner */}
        <NotificationBanner
          message={errorMessage}
          onDismiss={() => setErrorMessage(null)}
        />

        {/* Top Header & Status Indicator */}
        <div className="flex justify-center w-full pt-2">
          <StatusBadge
            state={assistantState}
            theme={activeTheme}
            latencyMs={latencyMs}
            isMuted={isMuted}
            notesCount={notes.length}
            toolsCount={toolLogs.length}
            is3DOpen={scene3D.isOpen}
            onToggle3D={() => setScene3D((prev) => ({ ...prev, isOpen: !prev.isOpen }))}
            onToggleMute={handleToggleMute}
            onOpenDrawer={() => setIsDrawerOpen(true)}
          />
        </div>

        {/* Center Workspace */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 flex flex-col items-center justify-center transition-all duration-500 ease-out z-10">
          {scene3D.isOpen ? (
            /* Full-Screen Expansive 3D Spatial Canvas */
            <div className="w-full flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-500">
              <SpatialCanvas
                config={scene3D}
                theme={activeTheme}
                outputVolume={outputVolume}
                onClose={() => setScene3D((prev) => ({ ...prev, isOpen: false }))}
                onUpdateConfig={(partial) => setScene3D((prev) => ({ ...prev, ...partial }))}
              />
            </div>
          ) : (
            /* Standard Centerpiece: Real-time Audio-to-Audio Core Orb */
            <div className="w-full max-w-xl flex flex-col items-center justify-center -mt-4 sm:-mt-6 animate-in fade-in duration-300">
              <CoreOrb
                state={assistantState}
                theme={activeTheme}
                vibe={vibe}
                micVolume={micVolume}
                outputVolume={outputVolume}
                isMuted={isMuted}
                onToggleConnect={handleToggleConnect}
                onToggleMute={handleToggleMute}
              />
            </div>
          )}
        </main>

        {/* Dynamic Spectral Waveform at Viewport Bottom */}
        <footer className="w-full flex flex-col items-center justify-center pb-4 sm:pb-6 z-20">
          <Visualizer
            state={assistantState}
            theme={activeTheme}
            vibe={vibe}
            micAnalyser={liveSessionRef.current?.getMicAnalyser() || null}
            outputAnalyser={liveSessionRef.current?.getOutputAnalyser() || null}
          />

          {/* Minimalist Subtitle Indicator */}
          <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono tracking-wide mt-1">
            <span className="flex items-center gap-1">
              <Volume2 className="w-3.5 h-3.5 text-slate-400" />
              24kHz PCM Audio
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-slate-400" />
              Libraries.dev Orbs
            </span>
            <span>•</span>
            <span className="hidden sm:inline-flex items-center gap-1 text-slate-400">
              Low-latency Live
            </span>
          </div>
        </footer>
      </div>

      {/* Real-time Conversation Response Box in Bottom-Left Corner (disappears when 3D showcase is active) */}
      {!scene3D.isOpen && (
        <LiveResponseCard
          messages={messages}
          state={assistantState}
          theme={activeTheme}
          outputVolume={outputVolume}
          micVolume={micVolume}
          onClear={handleClearMessages}
          onSendMessage={handleSendMessage}
        />
      )}

      {/* 80px Floating Micro Orb Avatar docked bottom-right below 3D canvas when 3D is active */}
      {scene3D.isOpen && (
        <MicroOrbAvatar
          state={assistantState}
          theme={activeTheme}
          vibe={vibe}
          micVolume={micVolume}
          outputVolume={outputVolume}
          isMuted={isMuted}
          onToggleConnect={handleToggleConnect}
          onToggleMute={handleToggleMute}
        />
      )}

      {/* Floating Browser Tool Card (when Myraa opens website or executes tool) */}
      <PortalCard
        portal={activePortal}
        theme={activeTheme}
        onClose={() => setActivePortal(null)}
      />

      {/* Companion Drawer (Thinking Orbs Showcase, Notes, Tools History, Settings, Voice Options) */}
      <CompanionDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        state={assistantState}
        themeAccent={themeAccent}
        themeConfig={activeTheme}
        onThemeChange={(newTheme) => setThemeAccent(newTheme)}
        vibe={vibe}
        onVibeChange={(newVibe) => setVibe(newVibe)}
        voice={voice}
        onVoiceChange={(newVoice) => setVoice(newVoice)}
        model={model}
        onModelChange={(newModel) => setModel(newModel)}
        notes={notes}
        onDeleteNote={handleDeleteNote}
        toolLogs={toolLogs}
      />
    </div>
  );
}

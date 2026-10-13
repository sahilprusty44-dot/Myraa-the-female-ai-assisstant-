import React, { useState } from 'react';
import {
  X,
  Sparkles,
  BookOpen,
  Wrench,
  Palette,
  Volume2,
  Trash2,
  ExternalLink,
  Copy,
  Check,
  Compass,
  Radio,
  Sliders,
  Orbit,
  Play,
  Pause,
} from 'lucide-react';
import { ThinkingOrb, OrbState } from 'thinking-orbs';
import {
  NoteItem,
  ToolActionLog,
  ThemeAccent,
  VisualVibe,
  ThemeConfig,
  AssistantState,
} from '../types/live';
import { THEMES } from '../utils/theme';

interface CompanionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  state: AssistantState;
  themeAccent: ThemeAccent;
  themeConfig: ThemeConfig;
  onThemeChange: (theme: ThemeAccent) => void;
  vibe: VisualVibe;
  onVibeChange: (vibe: VisualVibe) => void;
  voice: string;
  onVoiceChange: (voice: string) => void;
  model: string;
  onModelChange: (model: string) => void;
  notes: NoteItem[];
  onDeleteNote: (id: string) => void;
  toolLogs: ToolActionLog[];
}

export const CompanionDrawer: React.FC<CompanionDrawerProps> = ({
  isOpen,
  onClose,
  state,
  themeAccent,
  themeConfig,
  onThemeChange,
  vibe,
  onVibeChange,
  voice,
  onVoiceChange,
  model,
  onModelChange,
  notes,
  onDeleteNote,
  toolLogs,
}) => {
  const [activeTab, setActiveTab] = useState<'notes' | 'tools' | 'settings' | 'orbs' | 'prompts'>('notes');
  const [selectedOrbState, setSelectedOrbState] = useState<OrbState>('searching');
  const [orbSize, setOrbSize] = useState<64 | 20>(64);
  const [orbSpeed, setOrbSpeed] = useState<number>(1);
  const [orbPaused, setOrbPaused] = useState<boolean>(false);
  const [orbDark, setOrbDark] = useState<boolean>(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const orbDescriptions: Record<OrbState, string> = {
    working: 'Particles on tilted orbits around the core',
    searching: 'A scan meridian sweeps across a dotted globe',
    solving: 'Bands scramble in quarter turns, then click back',
    listening: 'A waveform rolls through spherical latitude rings',
    connecting: 'A constellation wires itself, packets running edges',
    weaving: 'Three strands plait harmoniously around the sphere',
    composing: 'An undulating multi-band sash',
    breathing: 'A face-on ring slowly morphing and respiring',
    shaping: 'A dotted outline morphs circle → triangle → square',
  };

  const samplePrompts = [
    {
      category: 'Witty Conversation',
      prompt: '"Hey Myraa, tell me something witty about today."',
    },
    {
      category: 'Browser Actions',
      prompt: '"Myraa, open YouTube for me" or "Take me to GitHub"',
    },
    {
      category: 'Theme & Aesthetics',
      prompt: '"Change your theme to neon magenta" or "Set cyber emerald vibes"',
    },
    {
      category: 'Memory & Notes',
      prompt: '"Remember to prep my presentation slides tomorrow at 10 AM"',
    },
    {
      category: 'Context & Time',
      prompt: '"What time and day is it right now?"',
    },
    {
      category: 'Playful Banter',
      prompt: '"Give me your honest opinion on pineapple on pizza."',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
      />

      {/* Slide-out Glass Drawer */}
      <div
        className="relative z-10 w-full max-w-md h-full bg-[#090D18]/90 border-l border-white/10 backdrop-blur-2xl flex flex-col shadow-2xl animate-in slide-in-from-right duration-300"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="p-2 rounded-xl"
              style={{ backgroundColor: `${themeConfig.primary}20` }}
            >
              <Sparkles className="w-5 h-5" style={{ color: themeConfig.primary }} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Myraa Companion Hub</span>
              </h2>
              <p className="text-xs text-slate-400">Settings, Notes & Tools</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-white/10 px-4 pt-2 gap-2 text-xs font-medium">
          <button
            onClick={() => setActiveTab('notes')}
            className={`pb-2.5 px-2 relative transition-colors flex items-center gap-1.5 ${
              activeTab === 'notes' ? 'text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Notes</span>
            {notes.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/10 text-slate-300">
                {notes.length}
              </span>
            )}
            {activeTab === 'notes' && (
              <div
                className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                style={{ backgroundColor: themeConfig.primary }}
              />
            )}
          </button>

          <button
            onClick={() => setActiveTab('tools')}
            className={`pb-2.5 px-2 relative transition-colors flex items-center gap-1.5 ${
              activeTab === 'tools' ? 'text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Tool Logs</span>
            {toolLogs.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/10 text-slate-300">
                {toolLogs.length}
              </span>
            )}
            {activeTab === 'tools' && (
              <div
                className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                style={{ backgroundColor: themeConfig.primary }}
              />
            )}
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`pb-2.5 px-2 relative transition-colors flex items-center gap-1.5 ${
              activeTab === 'settings' ? 'text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Voice & Look</span>
            {activeTab === 'settings' && (
              <div
                className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                style={{ backgroundColor: themeConfig.primary }}
              />
            )}
          </button>

          <button
            onClick={() => setActiveTab('orbs')}
            className={`pb-2.5 px-2 relative transition-colors flex items-center gap-1.5 ${
              activeTab === 'orbs' ? 'text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Orbit className="w-3.5 h-3.5 text-cyan-400" />
            <span>Thinking Orbs</span>
            {activeTab === 'orbs' && (
              <div
                className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                style={{ backgroundColor: themeConfig.primary }}
              />
            )}
          </button>

          <button
            onClick={() => setActiveTab('prompts')}
            className={`pb-2.5 px-2 relative transition-colors flex items-center gap-1.5 ${
              activeTab === 'prompts' ? 'text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Ideas</span>
            {activeTab === 'prompts' && (
              <div
                className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                style={{ backgroundColor: themeConfig.primary }}
              />
            )}
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* TAB: NOTES */}
          {activeTab === 'notes' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Notepad items captured by Myraa</span>
                <span>{notes.length} saved</span>
              </div>

              {notes.length === 0 ? (
                <div className="p-8 text-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02]">
                  <BookOpen className="w-8 h-8 text-slate-500 mx-auto mb-2 opacity-50" />
                  <p className="text-sm text-slate-300 font-medium">No notes recorded yet</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                    Say <span className="text-slate-300">"Myraa, take a note to buy coffee"</span> and she will record it here automatically!
                  </p>
                </div>
              ) : (
                notes.map((note) => (
                  <div
                    key={note.id}
                    className="p-3.5 rounded-xl border border-white/10 bg-white/5 backdrop-blur-md hover:bg-white/[0.07] transition-all group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="text-[10px] font-mono px-2 py-0.5 rounded-md uppercase font-medium"
                          style={{
                            backgroundColor: `${themeConfig.primary}20`,
                            color: themeConfig.primary,
                          }}
                        >
                          {note.category}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">
                          {note.timestamp}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleCopy(note.content, note.id)}
                          className="p-1 text-slate-400 hover:text-white rounded"
                          title="Copy"
                        >
                          {copiedId === note.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          onClick={() => onDeleteNote(note.id)}
                          className="p-1 text-slate-400 hover:text-rose-400 rounded"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <p className="mt-2 text-sm text-slate-200 leading-relaxed font-normal">
                      {note.content}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB: TOOL LOGS */}
          {activeTab === 'tools' && (
            <div className="space-y-3">
              <div className="text-xs text-slate-400">
                Real-time browser actions performed by Myraa
              </div>

              {toolLogs.length === 0 ? (
                <div className="p-8 text-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02]">
                  <Wrench className="w-8 h-8 text-slate-500 mx-auto mb-2 opacity-50" />
                  <p className="text-sm text-slate-300 font-medium">No tools executed yet</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Try asking Myraa to open a website, switch theme colors, or check the time!
                  </p>
                </div>
              ) : (
                toolLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3.5 rounded-xl border border-white/10 bg-white/5 backdrop-blur-md"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono text-[10px] uppercase text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded">
                        {log.toolName}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        {log.timestamp}
                      </span>
                    </div>
                    <h4 className="text-sm font-semibold text-white mt-1.5">{log.title}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">{log.summary}</p>
                    {log.data?.url && (
                      <a
                        href={log.data.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center gap-1 text-xs text-cyan-400 hover:underline"
                      >
                        <span>Open destination link</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB: SETTINGS & CUSTOMIZATION */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              {/* Voice Personality */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-2">
                  <Volume2 className="w-4 h-4 text-slate-300" />
                  <span>Voice Character</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { name: 'Aoede', desc: 'Charming & Expressive (Default)' },
                    { name: 'Kore', desc: 'Warm & Natural' },
                    { name: 'Zephyr', desc: 'Bright & Crisp' },
                  ].map((v) => (
                    <button
                      key={v.name}
                      onClick={() => onVoiceChange(v.name)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        voice === v.name
                          ? 'border-white bg-white/15 text-white shadow-md'
                          : 'border-white/10 bg-white/5 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="font-medium text-xs text-white">{v.name}</div>
                      <div className="text-[10px] text-slate-400 leading-tight mt-0.5">
                        {v.desc}
                      </div>
                    </button>
                  ))}
                </div>
                {state !== 'disconnected' && (
                  <p className="text-[10px] text-amber-400/80 mt-1.5">
                    Voice updates apply when starting a new session.
                  </p>
                )}
              </div>

              {/* Gemini Model */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-2">
                  <Radio className="w-4 h-4 text-slate-300" />
                  <span>Gemini Live Model</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'gemini-3.1-flash-live-preview', label: '3.1 Flash Live' },
                    { id: 'gemini-3.8-live', label: '3.8 Live' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      onClick={() => onModelChange(m.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        model === m.id
                          ? 'border-white bg-white/15 text-white shadow-md'
                          : 'border-white/10 bg-white/5 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="font-medium text-xs text-white">{m.label}</div>
                      <div className="text-[10px] font-mono text-slate-400 truncate">
                        {m.id}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Atmosphere Theme Colors */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-2">
                  <Palette className="w-4 h-4 text-slate-300" />
                  <span>Ambient Atmosphere Theme</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.keys(THEMES) as ThemeAccent[]).map((thmKey) => {
                    const thm = THEMES[thmKey];
                    const isSelected = themeAccent === thmKey;
                    return (
                      <button
                        key={thmKey}
                        onClick={() => onThemeChange(thmKey)}
                        className={`p-2 rounded-xl border flex items-center gap-2 transition-all ${
                          isSelected
                            ? 'border-white bg-white/15 shadow-md'
                            : 'border-white/10 bg-white/5 hover:bg-white/10'
                        }`}
                      >
                        <span
                          className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                          style={{ backgroundColor: thm.primary }}
                        />
                        <span className="text-xs text-slate-200 truncate">{thm.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic Vibe */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-2">
                  <Sparkles className="w-4 h-4 text-slate-300" />
                  <span>Visual Dynamics Vibe</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {(['energetic', 'calm', 'cyberpunk', 'aurora', 'zen'] as VisualVibe[]).map((vb) => (
                    <button
                      key={vb}
                      onClick={() => onVibeChange(vb)}
                      className={`px-3 py-1.5 rounded-xl border text-xs capitalize transition-all ${
                        vibe === vb
                          ? 'border-white bg-white/20 text-white font-medium'
                          : 'border-white/10 bg-white/5 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {vb}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB: THINKING ORBS (LIBRARIES.DEV) */}
          {activeTab === 'orbs' && (
            <div className="space-y-5">
              {/* Intro Banner */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-900/30 via-slate-900/40 to-cyan-900/30 border border-white/10 backdrop-blur-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Orbit className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-semibold text-white">Thinking Orbs</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-mono">
                      Libraries.dev
                    </span>
                  </div>
                  <a
                    href="https://libraries.dev/orbs.html"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-cyan-400 hover:underline"
                  >
                    <span>Docs</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                  Replaces the spinner in an AI "thinking" state with nine hand-tuned animated states. Ships zero runtime dependencies.
                </p>
              </div>

              {/* Main Interactive Orb Stage */}
              <div className="p-5 rounded-2xl border border-white/15 bg-black/60 backdrop-blur-xl flex flex-col items-center justify-center relative overflow-hidden shadow-2xl">
                {/* Glow ring behind orb */}
                <div
                  className="absolute w-36 h-36 rounded-full blur-3xl opacity-30 pointer-events-none"
                  style={{ backgroundColor: themeConfig.primary }}
                />

                <div className="relative py-3 flex items-center justify-center min-h-[90px]">
                  <ThinkingOrb
                    state={selectedOrbState}
                    size={orbSize}
                    speed={orbSpeed}
                    paused={orbPaused}
                    theme={orbDark ? 'dark' : 'light'}
                    color={themeConfig.primary}
                  />
                </div>

                <div className="text-center mt-2">
                  <h3 className="text-sm font-bold text-white capitalize font-mono tracking-wider flex items-center justify-center gap-1.5">
                    <span>{selectedOrbState}</span>
                    <span className="text-[10px] font-normal text-slate-400 font-sans">
                      ({orbSize}px)
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {orbDescriptions[selectedOrbState]}
                  </p>
                </div>

                {/* Orb Interactive Controls */}
                <div className="w-full mt-4 pt-4 border-t border-white/10 grid grid-cols-2 gap-2 text-xs">
                  {/* Size Preset Toggle */}
                  <div className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-[11px] text-slate-400">Scale:</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setOrbSize(64)}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                          orbSize === 64
                            ? 'bg-white/20 text-white font-bold'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        64px
                      </button>
                      <button
                        onClick={() => setOrbSize(20)}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                          orbSize === 20
                            ? 'bg-white/20 text-white font-bold'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        20px
                      </button>
                    </div>
                  </div>

                  {/* Play / Pause Toggle */}
                  <button
                    onClick={() => setOrbPaused(!orbPaused)}
                    className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 transition-colors"
                  >
                    <span className="text-[11px] text-slate-400">Playback:</span>
                    <span className="flex items-center gap-1 text-[11px] font-mono">
                      {orbPaused ? (
                        <>
                          <Play className="w-3 h-3 text-amber-400" /> Paused
                        </>
                      ) : (
                        <>
                          <Pause className="w-3 h-3 text-emerald-400" /> Playing
                        </>
                      )}
                    </span>
                  </button>

                  {/* Speed Multiplier */}
                  <div className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/10 col-span-2">
                    <span className="text-[11px] text-slate-400">Speed Multiplier:</span>
                    <div className="flex items-center gap-1.5">
                      {[0.5, 1, 1.5, 2].map((spd) => (
                        <button
                          key={spd}
                          onClick={() => setOrbSpeed(spd)}
                          className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                            orbSpeed === spd
                              ? 'bg-white/20 text-white font-bold'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          {spd}x
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* 9 Shipped States Showcase Gallery */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-between mb-2.5">
                  <span>Nine Hand-Tuned States</span>
                  <span className="text-[10px] font-mono text-slate-500">Tap to select</span>
                </label>

                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      'working',
                      'searching',
                      'solving',
                      'listening',
                      'connecting',
                      'weaving',
                      'composing',
                      'breathing',
                      'shaping',
                    ] as OrbState[]
                  ).map((st) => {
                    const isSelected = selectedOrbState === st;
                    return (
                      <button
                        key={st}
                        onClick={() => setSelectedOrbState(st)}
                        className={`p-2.5 rounded-xl border flex flex-col items-center justify-center transition-all ${
                          isSelected
                            ? 'border-white bg-white/15 shadow-lg shadow-black/50'
                            : 'border-white/10 bg-white/5 hover:bg-white/10'
                        }`}
                      >
                        <div className="w-10 h-10 flex items-center justify-center my-1 pointer-events-none">
                          <ThinkingOrb
                            state={st}
                            size={32}
                            theme="dark"
                            color={isSelected ? themeConfig.primary : undefined}
                          />
                        </div>
                        <span className="text-[11px] font-mono capitalize text-slate-200 mt-1 truncate max-w-full">
                          {st}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB: IDEAS & PROMPTS */}
          {activeTab === 'prompts' && (
            <div className="space-y-3">
              <div className="text-xs text-slate-400">
                Spoken conversation starters for Myraa
              </div>

              {samplePrompts.map((sp, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl border border-white/10 bg-white/5 backdrop-blur-md"
                >
                  <span className="text-[10px] font-mono uppercase text-slate-400">
                    {sp.category}
                  </span>
                  <p className="text-sm font-medium text-slate-200 mt-1">{sp.prompt}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-white/10 bg-black/40 text-center">
          <p className="text-[11px] text-slate-500 font-mono">
            Myraa AI • Audio-to-Audio Live Session
          </p>
        </div>
      </div>
    </div>
  );
};

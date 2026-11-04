# Real-Time Cyberpunk Chat Terminal for Myraa

A high-fidelity, real-time conversational console docked on the left side of the screen that visualizes live dialogue between the user and Myraa as it happens, supporting both live speech transcription and text messaging.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> The following design and architectural choices have been confirmed through Phase 1 clarification:
> - **Screen Placement**: Docked permanently on the **left side of the screen** on desktop ($380\text{px}$–$440\text{px}$ width) with collapse/expand toggles, transforming into an overlay sheet on mobile.
> - **Two-Way Interaction**: Supports **both live voice transcription and text typing input**, with an inline prompt bar allowing rapid typed instructions or questions while listening to voice.
> - **Visual Aesthetic**: **Cyberpunk glass terminal with timestamped telemetry**—obsidian backdrop, frosted glass blur, glowing hairline borders matching the active theme accent, monospaced tabular timestamps (`HH:MM:SS.mmm`), and role telemetries (`[USER_INPUT]` & `[MYRAA_CORE]`).

---

## 1. Overview & Core Concept

- **What It Does**: Provides a real-time, low-latency text stream of the conversation occurring over the Gemini Live voice session. As the user speaks or types, their inputs appear immediately in the terminal; as Myraa responds via audio, streaming text tokens and tool execution logs appear in sync.
- **Target Experience**: Gives visual clarity and accessibility to the voice companion, allowing users to read along, review previous conversational context, copy past responses, and type instructions when speaking out loud is inconvenient.
- **Key Value**: Bridges the gap between voice-only ambient intelligence and visual text clarity without obstructing the iconic 3D mathematical liquid blob.

---

## 2. User Experience & Visual Design

### Key User Flows
1. **Zero State (Standby)**: The terminal displays a clean terminal header with telemetry indicators (status `READY`, connection latency, session timer) and a tranquil waiting prompt awaiting conversation awakening.
2. **Speech Recognition & Live Transcripts**: When the user speaks, their microphone speech is captured and streamed into the terminal in real-time, rendered with an emerald/cyan `[USER]` badge and timestamp.
3. **Myraa Live Streaming Response**: As Myraa synthesizes speech chunks, text transcript tokens stream simultaneously with a typing cursor effect and active audio frequency level meter.
4. **Text Input Workflow**: User can type into the terminal input bar (`Enter` to submit). Text is transmitted directly to the Gemini Live session via client-content turn protocol, triggering immediate voice response and terminal reflection.
5. **Tool Execution Telemetry**: When browser tools execute (e.g. `openWebsite`, `takeQuickNote`), a compact syntax block appears in the terminal logging the action and parameters.

### Visual Identity & Theme
- **Color Palette**: Pitch obsidian foundations (`#030712` / `rgba(3, 7, 18, 0.75)`), ultra-fine hairline dividers (`1px solid rgba(255, 255, 255, 0.08)`), and theme-driven chromatic glows (`cyan`, `magenta`, `emerald`, `amber`, `monochrome`).
- **Typography & Hierarchy**:
  - Headers & Controls: `Plus Jakarta Sans` (13px–14px, 600 weight)
  - Telemetry & Transcripts: `JetBrains Mono` / `font-mono` with `tabular-nums` (12px–13px, 1.6 line height)
  - Timestamps: Dimmed cyan/slate tabular numerals (`10px font-mono text-slate-500`)
- **Layout Rhythm**: Desktop 2-column spatial balance:
  - Left: Cyberpunk Terminal Console ($400\text{px}$ width, full height minus navigation)
  - Center/Right: 3D Mathematical Wave Blob & CoreOrb Control Dock

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Left-Docked Split Canvas vs Center Overlay**:
  - *Chosen Approach*: Permanent left-docked console on wide screens ($>1024\text{px}$) with a smooth collapse/expand toggle button (`[Terminal Panel]`).
  - *Why*: Prevents covering or obscuring the central 3D Étienne Jacob mathematical wave sphere and gooey liquid blob, giving each system its dedicated visual space.
  - *Alternative Considered*: Floating bottom sheet (crowded the action buttons and audio visualizer).

- **Decision 2: Dual Voice Transcript & Text Injection**:
  - *Chosen Approach*: Synchronize both client-side Web Speech recognition (for instant local transcript feedback) and Gemini Live text parts from the server. Enable text typing via WebSocket `clientContent` messages.
  - *Why*: Gives instantaneous zero-latency typing and speech transcription while maintaining full compatibility with the existing bidirectional 24kHz audio pipeline.

- **Decision 3: Cyberpunk HUD Telemetry Details**:
  - *Chosen Approach*: Include authentic telemetry metrics—message timestamps, character count, active state badge, and auto-scroll button with quick copy action on hover.
  - *Why*: Satisfies the requested cyberpunk aesthetic while maintaining clean readability and zero-clutter typography.

---

## 4. Technical Architecture & Data Strategy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             Myraa App Canvas                                │
├────────────────────────────────────────┬────────────────────────────────────┤
│   Cyberpunk Chat Terminal (Left)       │   3D Liquid Wave Orb (Center)      │
│  ┌──────────────────────────────────┐  │  ┌──────────────────────────────┐  │
│  │ Terminal Header & Telemetry      │  │  │   3D Mathematical Wave Orb   │  │
│  │ Status, Latency, Collapse Btn    │  │  │   Gooey Filter & Droplets    │  │
│  ├──────────────────────────────────┤  │  └──────────────────────────────┘  │
│  │ Live Transcript Feed             │  │  ┌──────────────────────────────┐  │
│  │ - [USER] 17:48:02 Text Message   │  │  │   Awaken & Mute Buttons      │  │
│  │ - [MYRAA] 17:48:04 Live Audio Text│ │  │   Frequency Audio Meter      │  │
│  │ - [TOOL] openWebsite('...')      │  │  └──────────────────────────────┘  │
│  ├──────────────────────────────────┤  │  ┌──────────────────────────────┐  │
│  │ Two-Way Input Command Bar        │  │  │   Sinusoidal Wave Visualizer │  │
│  │ [Type message...] [Send / Mic]   │  │  └──────────────────────────────┘  │
│  └──────────────────────────────────┘  │                                    │
└────────────────────────────────────────┴────────────────────────────────────┘
                                   │
                                   ▼
             WebSocket Client (/live) ◄──► Express Server (server.ts)
                                                │
                                                ▼
                                    Google Gen AI Live Session
```

### State & Component Mapping
1. **`ChatTerminal.tsx` (New Component)**:
   - Houses the left panel, auto-scrolling log view, timestamp generator, message copy action, and input form.
   - Props: `messages`, `onSendMessage`, `isOpen`, `onToggle`, `state`, `theme`, `latencyMs`.
2. **`ChatMessage` Model**:
   - `id`: unique string
   - `sender`: `'user' | 'myraa' | 'system'`
   - `text`: string
   - `timestamp`: string (`HH:MM:SS`)
   - `isStreaming`: boolean
3. **`LiveSession.ts` Enhancements**:
   - Add `sendMessage(text: string)` method sending `{ type: 'text', text }` over WebSocket.
   - Listen for text parts from Gemini Live server content and emit via `onTranscript` callback.
   - Integrate Web Speech recognition listener for real-time speech transcription when mic is active.
4. **`server.ts` Enhancements**:
   - Handle incoming client `{ type: 'text', text }` messages and dispatch via `liveSession.sendClientContent(...)`.
   - Forward any model turn text parts to `clientWs` as `{ type: 'transcript', text }`.

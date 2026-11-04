export type AssistantState = 'disconnected' | 'connecting' | 'listening' | 'speaking' | 'thinking';

export type ThemeAccent = 'monochrome' | 'cyan' | 'magenta' | 'violet' | 'emerald' | 'amber' | 'crimson';

export type VisualVibe = 'calm' | 'energetic' | 'cyberpunk' | 'aurora' | 'zen';

export interface NoteItem {
  id: string;
  content: string;
  category: string;
  timestamp: string;
}

export interface ToolActionLog {
  id: string;
  toolName: string;
  title: string;
  summary: string;
  data?: any;
  timestamp: string;
}

export interface ActivePortal {
  id: string;
  url: string;
  title: string;
  timestamp: string;
}

export interface FunctionCallItem {
  id: string;
  name: string;
  args: Record<string, any>;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'myraa' | 'system';
  text: string;
  timestamp: string; // HH:MM:SS
  isLive?: boolean;
}

export interface ServerMessage {
  type: 'status' | 'audio' | 'transcript' | 'interrupted' | 'turnComplete' | 'toolCall' | 'error' | 'pong';
  status?: string;
  audio?: string;
  text?: string;
  model?: string;
  voice?: string;
  message?: string;
  reason?: string;
  toolCall?: {
    functionCalls?: FunctionCallItem[];
  };
}

export interface ThemeConfig {
  name: string;
  primary: string;
  secondary: string;
  glow: string;
  border: string;
  ring: string;
  badge: string;
  orbGradient: [string, string, string];
}

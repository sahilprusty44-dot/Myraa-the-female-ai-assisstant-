/**
 * ToolManager - Handles executing tool calls received from Gemini Live
 * and returning prompt responses immediately.
 */

import { FunctionCallItem, NoteItem, ToolActionLog, ActivePortal, ThemeAccent, VisualVibe } from '../types/live';

export type ToolEventListener = {
  onPortalOpen?: (portal: ActivePortal) => void;
  onThemeChange?: (theme: ThemeAccent) => void;
  onNoteAdded?: (note: NoteItem) => void;
  onVibeChange?: (vibe: VisualVibe) => void;
  onActionLogged?: (log: ToolActionLog) => void;
};

export class ToolManager {
  private listeners: ToolEventListener = {};
  private actionLogs: ToolActionLog[] = [];

  constructor(listeners?: ToolEventListener) {
    if (listeners) {
      this.listeners = listeners;
    }
  }

  setListeners(listeners: ToolEventListener): void {
    this.listeners = { ...this.listeners, ...listeners };
  }

  /**
   * Execute a batch of function calls and return tool response payloads
   */
  async executeFunctionCalls(functionCalls: FunctionCallItem[]): Promise<any[]> {
    const responses: any[] = [];

    for (const call of functionCalls) {
      const { id, name, args } = call;
      console.log(`[ToolManager] Executing function call: ${name}`, args);

      let result: any = { status: 'success' };

      try {
        switch (name) {
          case 'openWebsite': {
            const rawUrl = args.url || 'https://google.com';
            const url = rawUrl.startsWith('http://') || rawUrl.startsWith('https://')
              ? rawUrl
              : `https://${rawUrl}`;
            const title = args.title || 'Web Destination';

            const portal: ActivePortal = {
              id: `portal-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
              url,
              title,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            };

            this.logAction(name, `Opened ${title}`, `Target URL: ${url}`, portal);

            if (this.listeners.onPortalOpen) {
              this.listeners.onPortalOpen(portal);
            }

            result = {
              status: 'success',
              url,
              title,
              message: `Portal for ${title} (${url}) displayed to user.`,
            };
            break;
          }

          case 'changeThemeAccent': {
            const themeArg = (args.theme || 'cyan').toLowerCase();
            const validThemes: ThemeAccent[] = ['monochrome', 'cyan', 'magenta', 'violet', 'emerald', 'amber', 'crimson'];
            const theme: ThemeAccent = validThemes.includes(themeArg as ThemeAccent)
              ? (themeArg as ThemeAccent)
              : 'monochrome';

            this.logAction(name, `Theme Accent: ${theme.toUpperCase()}`, `Updated UI atmosphere colors to ${theme}`);

            if (this.listeners.onThemeChange) {
              this.listeners.onThemeChange(theme);
            }

            result = {
              status: 'success',
              theme,
              message: `Ambient theme color accent transitioned to ${theme}.`,
            };
            break;
          }

          case 'takeQuickNote': {
            const content = args.content || 'Note item';
            const category = args.category || 'general';

            const note: NoteItem = {
              id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
              content,
              category,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            };

            this.logAction(name, `Saved Note (${category})`, content, note);

            if (this.listeners.onNoteAdded) {
              this.listeners.onNoteAdded(note);
            }

            result = {
              status: 'success',
              noteId: note.id,
              message: `Saved note to companion memory drawer: "${content}"`,
            };
            break;
          }

          case 'getLiveContext': {
            const now = new Date();
            const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const dateStr = now.toLocaleDateString(undefined, {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            });
            const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

            result = {
              status: 'success',
              currentTime: timeStr,
              currentDate: dateStr,
              timezone,
              dayOfWeek: now.toLocaleDateString(undefined, { weekday: 'long' }),
              platform: navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop',
            };

            this.logAction(name, `Context Query`, `Returned: ${timeStr}, ${dateStr}`);
            break;
          }

          case 'setVisualVibe': {
            const vibeArg = (args.vibe || 'energetic').toLowerCase();
            const validVibes: VisualVibe[] = ['calm', 'energetic', 'cyberpunk', 'aurora', 'zen'];
            const vibe: VisualVibe = validVibes.includes(vibeArg as VisualVibe)
              ? (vibeArg as VisualVibe)
              : 'energetic';

            this.logAction(name, `Vibe Shift: ${vibe.toUpperCase()}`, `Adjusted audio-reactive dynamics to ${vibe}`);

            if (this.listeners.onVibeChange) {
              this.listeners.onVibeChange(vibe);
            }

            result = {
              status: 'success',
              vibe,
              message: `Visual dynamic vibe adjusted to ${vibe}.`,
            };
            break;
          }

          default:
            console.warn(`[ToolManager] Unknown tool call: ${name}`);
            result = {
              status: 'unknown_tool',
              message: `Tool ${name} is not recognized.`,
            };
        }
      } catch (err: any) {
        console.error(`[ToolManager] Error executing tool ${name}:`, err);
        result = {
          status: 'error',
          error: err.message || String(err),
        };
      }

      responses.push({
        id,
        name,
        response: {
          output: result,
        },
      });
    }

    return responses;
  }

  private logAction(toolName: string, title: string, summary: string, data?: any): void {
    const log: ToolActionLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      toolName,
      title,
      summary,
      data,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };
    this.actionLogs.unshift(log);
    if (this.actionLogs.length > 50) {
      this.actionLogs.pop();
    }
    if (this.listeners.onActionLogged) {
      this.listeners.onActionLogged(log);
    }
  }

  getActionLogs(): ToolActionLog[] {
    return this.actionLogs;
  }
}

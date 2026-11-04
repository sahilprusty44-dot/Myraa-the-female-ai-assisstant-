/**
 * LiveSession - Manages WebSocket connection to /live, coordinates
 * AudioStreamer, AudioPlayer, and ToolManager, and handles state transitions.
 */

import { AudioStreamer } from './AudioStreamer';
import { AudioPlayer } from './AudioPlayer';
import { ToolManager } from './ToolManager';
import { AssistantState, ServerMessage } from '../types/live';

export interface LiveSessionCallbacks {
  onStateChange: (state: AssistantState) => void;
  onVolumeChange: (micVolume: number, outputVolume: number) => void;
  onError: (errorMsg: string) => void;
  onLatencyUpdate: (ms: number) => void;
  onTranscript?: (text: string, sender: 'user' | 'myraa', isFinal?: boolean) => void;
}

export class LiveSession {
  private ws: WebSocket | null = null;
  private streamer: AudioStreamer;
  private player: AudioPlayer;
  private toolManager: ToolManager;
  private callbacks: LiveSessionCallbacks;

  private state: AssistantState = 'disconnected';
  private pingInterval: number | null = null;
  private animFrameId: number | null = null;
  private lastPingTime: number = 0;
  private micVolume: number = 0;
  private outputVolume: number = 0;
  private selectedVoice: string = 'Aoede';
  private selectedModel: string = 'gemini-3.1-flash-live-preview';
  private recognition: any = null;

  constructor(
    toolManager: ToolManager,
    callbacks: LiveSessionCallbacks
  ) {
    this.toolManager = toolManager;
    this.callbacks = callbacks;

    this.player = new AudioPlayer((isPlaying: boolean) => {
      if (this.state === 'disconnected' || this.state === 'connecting') return;
      if (isPlaying) {
        this.setState('speaking');
      } else {
        this.setState('listening');
      }
    });

    this.streamer = new AudioStreamer();
  }

  setVoice(voice: string): void {
    this.selectedVoice = voice;
  }

  setModel(model: string): void {
    this.selectedModel = model;
  }

  getState(): AssistantState {
    return this.state;
  }

  private setState(newState: AssistantState): void {
    if (this.state === newState) return;
    this.state = newState;
    this.callbacks.onStateChange(newState);
  }

  async connect(): Promise<void> {
    if (this.state !== 'disconnected') return;

    this.setState('connecting');

    try {
      // 1. Initialize AudioPlayer
      await this.player.init();

      // 2. Open WebSocket
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/live`;
      console.log(`[LiveSession] Connecting to ${wsUrl}...`);

      this.ws = new WebSocket(wsUrl);

      let hasOpened = false;

      this.ws.onopen = async () => {
        hasOpened = true;
        console.log('[LiveSession] WebSocket connection established');

        // Start Gemini Live session
        this.ws?.send(
          JSON.stringify({
            type: 'start',
            voice: this.selectedVoice,
            model: this.selectedModel,
          })
        );

        // Start streaming mic audio
        try {
          await this.streamer.start(
            (base64PCM: string) => {
              if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.ws.send(
                  JSON.stringify({
                    type: 'audio',
                    audio: base64PCM,
                  })
                );
              }
            },
            (micRms: number) => {
              this.micVolume = micRms;
            }
          );
        } catch (micErr: any) {
          console.error('[LiveSession] Microphone access denied or failed:', micErr);
          this.callbacks.onError(
            'Microphone access is required for Myraa voice interaction. Please allow microphone permissions.'
          );
          this.disconnect();
          return;
        }

        // Start ping/latency & volume animation loops
        this.startHeartbeat();
        this.startVolumeLoop();

        // Start Web Speech API for real-time user speech-to-text if supported
        if (typeof window !== 'undefined' && (('SpeechRecognition' in window) || ('webkitSpeechRecognition' in window))) {
          try {
            const SpeechClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            this.recognition = new SpeechClass();
            this.recognition.continuous = true;
            this.recognition.interimResults = true;
            this.recognition.lang = 'en-US';

            this.recognition.onresult = (event: any) => {
              let finalTranscript = '';
              let interimTranscript = '';
              for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                  finalTranscript += event.results[i][0].transcript;
                } else {
                  interimTranscript += event.results[i][0].transcript;
                }
              }
              const text = (finalTranscript || interimTranscript).trim();
              if (text) {
                this.callbacks.onTranscript?.(text, 'user', Boolean(finalTranscript));
              }
            };

            this.recognition.onerror = (e: any) => {
              console.warn('[LiveSession] Web Speech recognition notice:', e.error);
            };

            this.recognition.start();
          } catch (recErr) {
            console.warn('[LiveSession] Web Speech recognition failed to initialize:', recErr);
          }
        }
      };

      this.ws.onmessage = async (event: MessageEvent) => {
        try {
          const msg: ServerMessage = JSON.parse(event.data);

          if (msg.type === 'status') {
            if (msg.status === 'connected') {
              console.log('[LiveSession] Gemini Live session is live & ready!');
              this.setState('listening');
            } else if (msg.status === 'disconnected') {
              this.disconnect();
            }
          }

          if (msg.type === 'transcript' && msg.text) {
            this.callbacks.onTranscript?.(msg.text, 'myraa', false);
          }

          if (msg.type === 'audio' && msg.audio) {
            // Model generated audio chunk
            await this.player.playChunk(msg.audio);
          }

          if (msg.type === 'interrupted') {
            // Instant speech interruption
            console.log('[LiveSession] User interrupted Myraa');
            this.player.interrupt();
            this.callbacks.onTranscript?.(' [Interrupted]', 'myraa', true);
            this.setState('listening');
          }

          if (msg.type === 'turnComplete') {
            this.callbacks.onTranscript?.('', 'myraa', true);
            if (!this.player.isPlaying() && this.state !== 'disconnected') {
              this.setState('thinking');
            }
          }

          if (msg.type === 'toolCall' && msg.toolCall?.functionCalls) {
            console.log('[LiveSession] Received function calls from model (thinking/working):', msg.toolCall.functionCalls);
            this.setState('thinking');
            // Execute browser tools
            const responses = await this.toolManager.executeFunctionCalls(msg.toolCall.functionCalls);

            // Send tool responses back
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
              this.ws.send(
                JSON.stringify({
                  type: 'toolResponse',
                  toolResponse: responses,
                })
              );
            }
          }

          if (msg.type === 'pong') {
            const latency = Math.round(performance.now() - this.lastPingTime);
            this.callbacks.onLatencyUpdate(latency);
          }

          if (msg.type === 'error' && msg.message) {
            console.error('[LiveSession] Server error message:', msg.message);
            this.callbacks.onError(msg.message);
          }
        } catch (err) {
          console.error('[LiveSession] Error handling WebSocket message:', err);
        }
      };

      this.ws.onerror = (err: Event) => {
        console.warn('[LiveSession] WebSocket connection event:', err);
        if (!hasOpened) {
          this.callbacks.onError('Could not establish real-time connection to voice server.');
        }
      };

      this.ws.onclose = (event: CloseEvent) => {
        console.log('[LiveSession] WebSocket connection closed, code:', event.code, 'reason:', event.reason);
        if (this.state !== 'disconnected') {
          if (event.code !== 1000 && !hasOpened) {
            this.callbacks.onError('Voice connection closed unexpectedly. Retrying when awakened.');
          }
          this.disconnect();
        }
      };
    } catch (err: any) {
      console.error('[LiveSession] Failed to connect:', err);
      this.callbacks.onError(err?.message || 'Failed to initialize voice session.');
      this.disconnect();
    }
  }

  private startHeartbeat(): void {
    if (this.pingInterval) clearInterval(this.pingInterval);
    this.pingInterval = window.setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.lastPingTime = performance.now();
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 4000);
  }

  private startVolumeLoop(): void {
    const loop = () => {
      this.outputVolume = this.player.getOutputVolume();
      this.callbacks.onVolumeChange(this.micVolume, this.outputVolume);
      this.animFrameId = requestAnimationFrame(loop);
    };
    this.animFrameId = requestAnimationFrame(loop);
  }

  setMuted(muted: boolean): void {
    this.streamer.setMuted(muted);
  }

  getMuted(): boolean {
    return this.streamer.getMuted();
  }

  getMicAnalyser(): AnalyserNode | null {
    return this.streamer.getAnalyser();
  }

  getOutputAnalyser(): AnalyserNode | null {
    return this.player.getAnalyser();
  }

  disconnect(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }

    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    this.streamer.stop();
    this.player.stop();

    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {
        // ignore
      }
      this.recognition = null;
    }

    if (this.ws) {
      try {
        this.ws.close();
      } catch (e) {
        // ignore
      }
      this.ws = null;
    }

    this.micVolume = 0;
    this.outputVolume = 0;
    this.callbacks.onVolumeChange(0, 0);
    this.setState('disconnected');
  }

  sendTextMessage(text: string): boolean {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: 'text',
          text,
        })
      );
      this.callbacks.onTranscript?.(text, 'user', true);
      this.setState('thinking');
      return true;
    }
    return false;
  }
}

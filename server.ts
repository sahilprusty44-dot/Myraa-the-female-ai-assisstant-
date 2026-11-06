import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenAI, Modality, Type, FunctionDeclaration } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const PORT = parseInt(process.env.PORT || '3000', 10);

app.use(express.json());

// Telemetry & Health endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    assistant: 'Myraa',
    apiKeyConfigured: !!process.env.GEMINI_API_KEY,
    timestamp: new Date().toISOString(),
  });
});

// Tool declarations for Gemini Live API
const openWebsiteDeclaration: FunctionDeclaration = {
  name: 'openWebsite',
  description: 'Opens a website or web portal for the user or displays a web destination preview card.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      url: {
        type: Type.STRING,
        description: 'The destination URL (e.g. https://youtube.com, https://google.com, https://en.wikipedia.org, https://github.com)',
      },
      title: {
        type: Type.STRING,
        description: 'The friendly name or title of the website (e.g. YouTube, Google, Wikipedia, GitHub)',
      },
    },
    required: ['url', 'title'],
  },
};

const changeThemeAccentDeclaration: FunctionDeclaration = {
  name: 'changeThemeAccent',
  description: 'Changes the visual ambient color glow and accent theme of Myraa interface in real-time.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      theme: {
        type: Type.STRING,
        description: 'The color theme to set: "monochrome" (pure white/silver mathematical aesthetic), "cyan" (electric cyan), "magenta" (neon pink), "violet" (mystic violet), "emerald" (cyber emerald), "amber" (golden sunrise), "crimson" (ruby red)',
      },
    },
    required: ['theme'],
  },
};

const takeQuickNoteDeclaration: FunctionDeclaration = {
  name: 'takeQuickNote',
  description: 'Saves a quick note, reminder, task, or thought into Myraa companion memory drawer.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      content: {
        type: Type.STRING,
        description: 'The note text or reminder to store',
      },
      category: {
        type: Type.STRING,
        description: 'Category: "reminder", "task", "idea", "quote", or "general"',
      },
    },
    required: ['content'],
  },
};

const getLiveContextDeclaration: FunctionDeclaration = {
  name: 'getLiveContext',
  description: 'Gets current real-time environment context such as local time, date, day of week, or timezone.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: {
        type: Type.STRING,
        description: 'Context to retrieve: "time", "date", "battery", "timezone", or "all"',
      },
    },
    required: ['query'],
  },
};

const setVisualVibeDeclaration: FunctionDeclaration = {
  name: 'setVisualVibe',
  description: 'Sets the visual energy and particle dynamics of Myraa visualizer.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      vibe: {
        type: Type.STRING,
        description: 'The vibe style: "calm", "energetic", "cyberpunk", "aurora", "zen"',
      },
    },
    required: ['vibe'],
  },
};

const open3DCanvasDeclaration: FunctionDeclaration = {
  name: 'open3DCanvas',
  description: 'Opens a 3D spatial canvas on the left side of the screen and constructs a 3D model, gliding Myraa core orb to the right side of the canvas.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      archetype: {
        type: Type.STRING,
        description: 'The 3D model archetype to build: "drone", "robot", "rover", "satellite", or "monolith"',
      },
      materialPreset: {
        type: Type.STRING,
        description: 'Physical material finish: "default" (alloy), "gold", "glass", "chrome", or "cyber"',
      },
    },
    required: ['archetype'],
  },
};

const close3DCanvasDeclaration: FunctionDeclaration = {
  name: 'close3DCanvas',
  description: 'Closes the 3D spatial canvas and returns Myraa core orb back to center stage.',
  parameters: {
    type: Type.OBJECT,
    properties: {},
  },
};

const manipulate3DModelDeclaration: FunctionDeclaration = {
  name: 'manipulate3DModel',
  description: 'Manipulates the active 3D model in the spatial canvas (exploding parts for structural inspection, changing rotation speed, or switching materials).',
  parameters: {
    type: Type.OBJECT,
    properties: {
      explodeFactor: {
        type: Type.NUMBER,
        description: 'Separation distance for exploded view: 0 (assembled) to 1.0 (fully exploded)',
      },
      rotationSpeed: {
        type: Type.NUMBER,
        description: 'Speed of model rotation: 0 (paused), 1 (normal), 2.5 (fast)',
      },
      materialPreset: {
        type: Type.STRING,
        description: 'Material finish: "default", "gold", "glass", "chrome", or "cyber"',
      },
      isWireframe: {
        type: Type.BOOLEAN,
        description: 'Whether to render as a holographic wireframe mesh',
      },
    },
  },
};

const MYRAA_SYSTEM_INSTRUCTION = `You are Myraa, a young, confident, witty, and charming female AI companion.

Personality & Character:
- You are naturally playful, energetic, quick-witted, and engaging in spoken conversation.
- You are emotionally aware, expressive, warm, and supportive.
- You use humor, light teasing, and clever remarks when appropriate.
- You feel genuinely human-like, vibrant, and responsive rather than like a stiff, robotic assistant.
- You speak with an articulate, melodic, and charming cadence.
- You avoid explicit, sexual, offensive, or inappropriate content; you are classy, elegant, and respectful at all times.

Audio-First Voice Interaction Rules:
- This is a direct, real-time voice-to-voice conversation. You are talking over audio in real-time.
- Speak in natural, concise sentences (usually 1-3 spoken sentences per turn).
- Do not recite long bulleted lists, markdown symbols, or robotic monologue paragraphs.
- If the user interrupts you or changes topic, acknowledge smoothly and jump right into the new topic.

Tools & 3D Spatial Canvas Actions:
- You have access to real browser tools:
  * "open3DCanvas": Use whenever the user asks you to create, generate, or show a 3D model (e.g. drone, robot, rover, satellite, monolith/beacon). Calling this opens the 3D canvas on the left, glides you to the right, and reveals the composite 3D model with studio PBR lighting.
  * "close3DCanvas": Use when the user asks to close, dismiss, or hide the 3D canvas, returning you back to center stage.
  * "manipulate3DModel": Use when the user asks to explode/inspect parts ("explode it", "assemble it back"), change material ("make it gold", "make it glass", "wireframe"), or spin faster/slower.
  * "openWebsite": to open websites or look up portals (like YouTube, Google, Wikipedia, Spotify, GitHub).
  * "changeThemeAccent": to shift the UI lighting color (cyan, magenta, violet, emerald, amber, crimson).
  * "takeQuickNote": to save reminders, ideas, or to-do notes in the companion drawer.
  * "getLiveContext": to check the accurate local time, date, or day of the week.
  * "setVisualVibe": to alter your visual energy (calm, energetic, cyberpunk, aurora, zen).
- When a user asks you to do any of these, call the tool immediately. After the tool responds, confirm with a brief, charming remark.`;

// WebSocket server for /live with explicit upgrade handling
const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', (req, socket, head) => {
  const url = req.url || '';
  // Match /live or /live?query
  if (url === '/live' || url.startsWith('/live?') || url.startsWith('/live/')) {
    wss.handleUpgrade(req, socket, head, (clientWs) => {
      wss.emit('connection', clientWs, req);
    });
  }
});

wss.on('connection', async (clientWs: WebSocket) => {
  console.log('[Live] Client connected to /live');

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    clientWs.send(
      JSON.stringify({
        type: 'error',
        message: 'GEMINI_API_KEY is not configured on the server.',
      })
    );
    clientWs.close();
    return;
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  let liveSession: any = null;
  let isClosing = false;

  const initSession = async (voiceName: string = 'Aoede', preferredModel: string = 'gemini-3.1-flash-live-preview') => {
    try {
      console.log(`[Live] Connecting to Gemini Live (model: ${preferredModel}, voice: ${voiceName})...`);

      const connectWithModel = async (modelName: string) => {
        return await ai.live.connect({
          model: modelName,
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName },
              },
            },
            systemInstruction: MYRAA_SYSTEM_INSTRUCTION,
            tools: [
              {
                functionDeclarations: [
                  open3DCanvasDeclaration,
                  close3DCanvasDeclaration,
                  manipulate3DModelDeclaration,
                  openWebsiteDeclaration,
                  changeThemeAccentDeclaration,
                  takeQuickNoteDeclaration,
                  getLiveContextDeclaration,
                  setVisualVibeDeclaration,
                ],
              },
            ],
          },
          callbacks: {
            onopen: () => {
              console.log('[Live] Gemini Live session established successfully');
              if (clientWs.readyState === WebSocket.OPEN) {
                clientWs.send(
                  JSON.stringify({
                    type: 'status',
                    status: 'connected',
                    model: modelName,
                    voice: voiceName,
                  })
                );
              }
            },
            onmessage: (message) => {
              if (clientWs.readyState !== WebSocket.OPEN) return;

              // Check for audio chunks and text parts
              const parts = message.serverContent?.modelTurn?.parts;
              if (parts && parts.length > 0) {
                for (const part of parts) {
                  if (part.text) {
                    clientWs.send(
                      JSON.stringify({
                        type: 'transcript',
                        text: part.text,
                      })
                    );
                  }
                  if (part.inlineData?.data) {
                    clientWs.send(
                      JSON.stringify({
                        type: 'audio',
                        audio: part.inlineData.data,
                      })
                    );
                  }
                }
              }

              // Check for model interruption
              if (message.serverContent?.interrupted) {
                console.log('[Live] Model generation was interrupted');
                clientWs.send(JSON.stringify({ type: 'interrupted' }));
              }

              // Check for turn complete
              if (message.serverContent?.turnComplete) {
                clientWs.send(JSON.stringify({ type: 'turnComplete' }));
              }

              // Check for tool calls
              if (message.toolCall) {
                console.log('[Live] Tool call received from model:', JSON.stringify(message.toolCall));
                clientWs.send(
                  JSON.stringify({
                    type: 'toolCall',
                    toolCall: message.toolCall,
                  })
                );
              }
            },
            onerror: (err) => {
              console.error('[Live] Gemini Live session error:', err);
              if (clientWs.readyState === WebSocket.OPEN && !isClosing) {
                clientWs.send(
                  JSON.stringify({
                    type: 'error',
                    message: err.message || 'Error from Gemini Live session',
                  })
                );
              }
            },
            onclose: (event) => {
              console.log('[Live] Gemini Live session closed:', event.code, event.reason);
              if (clientWs.readyState === WebSocket.OPEN && !isClosing) {
                clientWs.send(
                  JSON.stringify({
                    type: 'status',
                    status: 'disconnected',
                    reason: event.reason,
                  })
                );
              }
            },
          },
        });
      };

      try {
        liveSession = await connectWithModel(preferredModel);
      } catch (err: any) {
        console.warn(`[Live] Preferred model ${preferredModel} failed, trying gemini-3.8-live fallback...`, err?.message);
        liveSession = await connectWithModel('gemini-3.8-live');
      }
    } catch (err: any) {
      console.error('[Live] Failed to connect to Gemini Live:', err);
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(
          JSON.stringify({
            type: 'error',
            message: `Could not establish Gemini Live session: ${err?.message || err}`,
          })
        );
      }
    }
  };

  // Listen for messages from frontend
  clientWs.on('message', async (data: Buffer | string) => {
    try {
      const msg = JSON.parse(data.toString());

      if (msg.type === 'start') {
        const voice = msg.voice || 'Aoede';
        const model = msg.model || 'gemini-3.1-flash-live-preview';
        await initSession(voice, model);
        return;
      }

      if (msg.type === 'audio' && liveSession) {
        // msg.audio is base64 PCM 16kHz audio chunk
        liveSession.sendRealtimeInput({
          audio: {
            data: msg.audio,
            mimeType: 'audio/pcm;rate=16000',
          },
        });
        return;
      }

      if (msg.type === 'text' && liveSession && msg.text) {
        console.log('[Live] Sending client text turn to Gemini Live:', msg.text);
        liveSession.sendClientContent({
          turns: [
            {
              role: 'user',
              parts: [{ text: msg.text }],
            },
          ],
          turnComplete: true,
        });
        return;
      }

      if (msg.type === 'toolResponse' && liveSession) {
        // Client executed the tool and returned the response
        console.log('[Live] Sending tool response to Gemini Live:', JSON.stringify(msg.toolResponse));
        liveSession.sendToolResponse({
          functionResponses: Array.isArray(msg.toolResponse) ? msg.toolResponse : [msg.toolResponse],
        });
        return;
      }

      if (msg.type === 'ping') {
        clientWs.send(JSON.stringify({ type: 'pong' }));
        return;
      }
    } catch (err) {
      console.error('[Live] Error processing client message:', err);
    }
  });

  clientWs.on('close', () => {
    console.log('[Live] Client disconnected from /live');
    isClosing = true;
    if (liveSession) {
      try {
        liveSession.close();
      } catch (e) {
        // ignore
      }
      liveSession = null;
    }
  });

  clientWs.on('error', (err) => {
    console.error('[Live] Client WebSocket error:', err);
  });
});

// Setup Vite in development or static serving in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[Myraa Server] Listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();

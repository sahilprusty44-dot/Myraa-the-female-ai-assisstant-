/**
 * AudioStreamer - Captures microphone audio, encodes to PCM 16-bit 16kHz,
 * and streams chunks to Gemini Live via WebSocket.
 */

export class AudioStreamer {
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private processorNode: ScriptProcessorNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private isRunning: boolean = false;
  private isMuted: boolean = false;
  private onAudioChunkCallback: ((base64: string) => void) | null = null;
  private onVolumeCallback: ((rms: number) => void) | null = null;

  async start(
    onAudioChunk: (base64: string) => void,
    onVolume?: (rms: number) => void
  ): Promise<void> {
    if (this.isRunning) return;

    this.onAudioChunkCallback = onAudioChunk;
    if (onVolume) this.onVolumeCallback = onVolume;

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // Initialize AudioContext at 16kHz as required by Gemini Live
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioCtx({ sampleRate: 16000 });

      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);

      // Analyser for real-time microphone visualization
      this.analyserNode = this.audioContext.createAnalyser();
      this.analyserNode.fftSize = 256;
      this.analyserNode.smoothingTimeConstant = 0.4;
      this.sourceNode.connect(this.analyserNode);

      // Buffer size of 4096 gives ~256ms chunk intervals at 16kHz
      this.processorNode = this.audioContext.createScriptProcessor(4096, 1, 1);

      this.processorNode.onaudioprocess = (e: AudioProcessingEvent) => {
        if (!this.isRunning || this.isMuted) return;

        const inputData = e.inputBuffer.getChannelData(0);

        // Calculate RMS volume for visual feedback
        let sumSquares = 0;
        for (let i = 0; i < inputData.length; i++) {
          sumSquares += inputData[i] * inputData[i];
        }
        const rms = Math.sqrt(sumSquares / inputData.length);
        if (this.onVolumeCallback) {
          this.onVolumeCallback(rms);
        }

        // Convert Float32 to 16-bit PCM little-endian
        const pcm16 = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          // Clamp to [-1, 1] range and scale to 16-bit signed integer
          const s = Math.max(-1, Math.min(1, inputData[i]));
          pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }

        // Convert Int16Array to base64
        const base64 = this.pcm16ToBase64(pcm16);
        if (this.onAudioChunkCallback) {
          this.onAudioChunkCallback(base64);
        }
      };

      this.sourceNode.connect(this.processorNode);
      // Connect to destination to keep ScriptProcessor running (muted gain if needed)
      const silenceGain = this.audioContext.createGain();
      silenceGain.gain.value = 0;
      this.processorNode.connect(silenceGain);
      silenceGain.connect(this.audioContext.destination);

      this.isRunning = true;
    } catch (err) {
      this.stop();
      throw err;
    }
  }

  private pcm16ToBase64(pcm16: Int16Array): string {
    const buffer = pcm16.buffer;
    const bytes = new Uint8Array(buffer);
    let binary = '';
    const len = bytes.byteLength;
    // Process in chunks to prevent call-stack overflow on large buffers
    const chunkSize = 0x8000;
    for (let i = 0; i < len; i += chunkSize) {
      const chunk = bytes.subarray(i, Math.min(i + chunkSize, len));
      binary += String.fromCharCode.apply(null, chunk as any);
    }
    return btoa(binary);
  }

  setMuted(muted: boolean): void {
    this.isMuted = muted;
  }

  getMuted(): boolean {
    return this.isMuted;
  }

  getAnalyser(): AnalyserNode | null {
    return this.analyserNode;
  }

  isActive(): boolean {
    return this.isRunning;
  }

  stop(): void {
    this.isRunning = false;

    if (this.processorNode) {
      this.processorNode.disconnect();
      this.processorNode.onaudioprocess = null;
      this.processorNode = null;
    }

    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }

    if (this.analyserNode) {
      this.analyserNode.disconnect();
      this.analyserNode = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    if (this.audioContext && this.audioContext.state !== 'closed') {
      try {
        this.audioContext.close();
      } catch (e) {
        // ignore
      }
      this.audioContext = null;
    }

    this.onAudioChunkCallback = null;
    this.onVolumeCallback = null;
  }
}

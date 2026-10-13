/**
 * AudioPlayer - Receives 24kHz PCM16 raw audio chunks from Gemini Live,
 * schedules gapless playback using Web Audio API, and handles instant interruptions.
 */

export class AudioPlayer {
  private audioContext: AudioContext | null = null;
  private analyserNode: AnalyserNode | null = null;
  private gainNode: GainNode | null = null;
  private nextStartTime: number = 0;
  private activeSources: Set<AudioBufferSourceNode> = new Set();
  private onPlaybackStateChangeCallback: ((isPlaying: boolean) => void) | null = null;
  private isInitialized: boolean = false;
  private outputDataArray: Uint8Array | null = null;

  constructor(onPlaybackStateChange?: (isPlaying: boolean) => void) {
    if (onPlaybackStateChange) {
      this.onPlaybackStateChangeCallback = onPlaybackStateChange;
    }
  }

  async init(): Promise<void> {
    if (this.isInitialized && this.audioContext && this.audioContext.state !== 'closed') {
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
      return;
    }

    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    // Gemini Live outputs audio at 24000 Hz
    this.audioContext = new AudioCtx({ sampleRate: 24000 });

    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    this.gainNode = this.audioContext.createGain();
    this.gainNode.gain.value = 1.0;

    this.analyserNode = this.audioContext.createAnalyser();
    this.analyserNode.fftSize = 256;
    this.analyserNode.smoothingTimeConstant = 0.3;

    this.gainNode.connect(this.analyserNode);
    this.analyserNode.connect(this.audioContext.destination);

    this.outputDataArray = new Uint8Array(this.analyserNode.frequencyBinCount);
    this.nextStartTime = this.audioContext.currentTime;
    this.isInitialized = true;
  }

  /**
   * Enqueue a raw PCM 16-bit 24kHz base64 audio chunk from the model.
   */
  async playChunk(base64Audio: string): Promise<void> {
    if (!this.audioContext || this.audioContext.state === 'closed') {
      await this.init();
    }

    if (!this.audioContext || !this.gainNode) return;

    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    try {
      // Decode base64 to binary bytes
      const binaryString = atob(base64Audio);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Convert raw PCM16 little-endian to Float32 [-1.0, 1.0]
      const numSamples = Math.floor(len / 2);
      const dataView = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
      const float32Array = new Float32Array(numSamples);

      for (let i = 0; i < numSamples; i++) {
        const int16 = dataView.getInt16(i * 2, true); // true = little-endian
        float32Array[i] = int16 < 0 ? int16 / 0x8000 : int16 / 0x7fff;
      }

      if (numSamples === 0) return;

      // Create AudioBuffer at 24000Hz mono
      const audioBuffer = this.audioContext.createBuffer(1, numSamples, 24000);
      audioBuffer.copyToChannel(float32Array, 0, 0);

      // Create BufferSourceNode
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.gainNode);

      // Schedule gapless playback
      const currentTime = this.audioContext.currentTime;
      const scheduledTime = Math.max(currentTime, this.nextStartTime);
      source.start(scheduledTime);
      this.nextStartTime = scheduledTime + audioBuffer.duration;

      this.activeSources.add(source);

      // Notify that playback is active
      if (this.activeSources.size === 1 && this.onPlaybackStateChangeCallback) {
        this.onPlaybackStateChangeCallback(true);
      }

      source.onended = () => {
        this.activeSources.delete(source);
        if (this.activeSources.size === 0) {
          // If all queued audio has finished playing
          if (this.onPlaybackStateChangeCallback) {
            this.onPlaybackStateChangeCallback(false);
          }
        }
      };
    } catch (err) {
      console.error('[AudioPlayer] Error decoding or scheduling audio chunk:', err);
    }
  }

  /**
   * Instantly stops all playing and scheduled audio when an interruption occurs.
   */
  interrupt(): void {
    console.log('[AudioPlayer] Interruption triggered: stopping all active sources');
    for (const source of this.activeSources) {
      try {
        source.stop();
        source.disconnect();
      } catch (e) {
        // Source might already have finished
      }
    }
    this.activeSources.clear();

    if (this.audioContext) {
      this.nextStartTime = this.audioContext.currentTime;
    } else {
      this.nextStartTime = 0;
    }

    if (this.onPlaybackStateChangeCallback) {
      this.onPlaybackStateChangeCallback(false);
    }
  }

  getAnalyser(): AnalyserNode | null {
    return this.analyserNode;
  }

  getOutputVolume(): number {
    if (!this.analyserNode || !this.outputDataArray || this.activeSources.size === 0) return 0;
    this.analyserNode.getByteFrequencyData(this.outputDataArray as any);
    let sum = 0;
    for (let i = 0; i < this.outputDataArray.length; i++) {
      sum += this.outputDataArray[i];
    }
    return sum / (this.outputDataArray.length * 255);
  }

  isPlaying(): boolean {
    return this.activeSources.size > 0;
  }

  stop(): void {
    this.interrupt();
    if (this.audioContext && this.audioContext.state !== 'closed') {
      try {
        this.audioContext.close();
      } catch (e) {
        // ignore
      }
      this.audioContext = null;
    }
    this.analyserNode = null;
    this.gainNode = null;
    this.isInitialized = false;
  }
}

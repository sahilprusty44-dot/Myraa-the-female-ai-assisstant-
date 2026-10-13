import React, { useEffect, useRef } from 'react';
import { AssistantState, ThemeConfig, VisualVibe } from '../types/live';

interface VisualizerProps {
  state: AssistantState;
  theme: ThemeConfig;
  vibe: VisualVibe;
  micAnalyser: AnalyserNode | null;
  outputAnalyser: AnalyserNode | null;
}

export const Visualizer: React.FC<VisualizerProps> = ({
  state,
  theme,
  vibe,
  micAnalyser,
  outputAnalyser,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    const dataArray = new Uint8Array(128);
    let phase = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      let activeAnalyser: AnalyserNode | null = null;
      if (state === 'speaking') {
        activeAnalyser = outputAnalyser;
      } else if (state === 'listening') {
        activeAnalyser = micAnalyser;
      }

      if (activeAnalyser) {
        activeAnalyser.getByteFrequencyData(dataArray);
      } else {
        // Idle tranquil wave simulation
        for (let i = 0; i < dataArray.length; i++) {
          dataArray[i] = Math.sin(phase + i * 0.1) * 8 + 12;
        }
      }

      let speed = 0.04;
      if (vibe === 'calm') speed = 0.02;
      if (vibe === 'energetic') speed = 0.08;
      if (vibe === 'cyberpunk') speed = 0.1;
      if (vibe === 'zen') speed = 0.015;

      phase += speed;

      const centerY = height / 2;
      const numPoints = 64;
      const step = width / numPoints;

      // Draw subtle background cyber grid line
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      ctx.lineTo(width, centerY);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Render 3 layered harmonic sine/frequency ribbons
      const ribbons = [
        { alpha: 0.85, amp: 1.0, width: 2.5, color: theme.primary, offset: 0 },
        { alpha: 0.45, amp: 0.65, width: 1.8, color: theme.secondary, offset: Math.PI / 4 },
        { alpha: 0.25, amp: 0.4, width: 1.2, color: '#FFFFFF', offset: Math.PI / 2 },
      ];

      ribbons.forEach((ribbon) => {
        ctx.beginPath();
        ctx.moveTo(0, centerY);

        for (let i = 0; i <= numPoints; i++) {
          const x = i * step;
          const dataIdx = Math.floor((i / numPoints) * 32);
          const rawAmp = dataArray[dataIdx] || 0;
          const normalizedAmp = (rawAmp / 255) * (state === 'disconnected' ? 8 : 46);

          // Sine modulation for organic fluidity
          const sineMod = Math.sin(phase + i * 0.15 + ribbon.offset);
          const y = centerY + sineMod * normalizedAmp * ribbon.amp;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            const prevX = (i - 1) * step;
            const cX = (prevX + x) / 2;
            ctx.quadraticCurveTo(prevX, y, cX, y);
          }
        }

        ctx.strokeStyle = ribbon.color;
        ctx.lineWidth = ribbon.width;
        ctx.globalAlpha = ribbon.alpha;
        ctx.shadowColor = ribbon.color;
        ctx.shadowBlur = state !== 'disconnected' ? 12 : 4;
        ctx.stroke();
        ctx.shadowBlur = 0;
      });

      // Ambient glow gradient beneath wave
      const grad = ctx.createLinearGradient(0, centerY - 30, 0, centerY + 30);
      grad.addColorStop(0, 'transparent');
      grad.addColorStop(0.5, theme.glow);
      grad.addColorStop(1, 'transparent');

      ctx.fillStyle = grad;
      ctx.globalAlpha = state === 'disconnected' ? 0.05 : 0.2;
      ctx.fillRect(0, centerY - 25, width, 50);

      ctx.globalAlpha = 1.0;
      animId = requestAnimationFrame(render);
    };

    render();

    const handleResize = () => {
      const newRect = canvas.getBoundingClientRect();
      canvas.width = newRect.width * dpr;
      canvas.height = newRect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [state, theme, vibe, micAnalyser, outputAnalyser]);

  return (
    <div className="w-full max-w-2xl h-16 sm:h-20 px-4 relative flex items-center justify-center">
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
      />
    </div>
  );
};

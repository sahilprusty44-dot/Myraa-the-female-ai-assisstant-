import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Mic, MicOff, Power, Radio, Volume2, Sparkles, Cpu } from 'lucide-react';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import { ThinkingOrb, OrbState } from 'thinking-orbs';
import { AssistantState, ThemeConfig, VisualVibe } from '../types/live';

interface CoreOrbProps {
  state: AssistantState;
  theme: ThemeConfig;
  vibe: VisualVibe;
  micVolume: number;
  outputVolume: number;
  isMuted: boolean;
  onToggleConnect: () => void;
  onToggleMute: () => void;
}

interface SpherePoint {
  theta: number; // latitude angle [0, PI]
  phi: number;   // longitude angle [0, 2*PI]
  baseR: number; // base radius
}

export const CoreOrb: React.FC<CoreOrbProps> = ({
  state,
  theme,
  vibe,
  micVolume,
  outputVolume,
  isMuted,
  onToggleConnect,
  onToggleMute,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const blurElementRef = useRef<SVGFEGaussianBlurElement | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Framer Motion Magnetic Spring Controls
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 18, stiffness: 180, mass: 0.25 };
  const springX = useSpring(mouseX, springConfig);
  const springY = useSpring(mouseY, springConfig);

  // 3D Perspective Magnetic Tilt
  const tiltX = useTransform(springY, [-40, 40], [8, -8]);
  const tiltY = useTransform(springX, [-40, 40], [-8, 8]);

  // Track cursor position near orb for subtle magnetic attraction
  useEffect(() => {
    const handleGlobalPointerMove = (e: PointerEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const deltaX = e.clientX - centerX;
      const deltaY = e.clientY - centerY;
      const distance = Math.hypot(deltaX, deltaY);

      // Distance within which magnetic attraction engages
      const magneticRadius = 290;
      if (distance < magneticRadius) {
        // Non-linear gravitational falloff for physical feel
        const factor = Math.pow(1 - distance / magneticRadius, 1.4) * 0.28;
        mouseX.set(deltaX * factor);
        mouseY.set(deltaY * factor);
      } else {
        mouseX.set(0);
        mouseY.set(0);
      }
    };

    const handleGlobalPointerLeave = () => {
      mouseX.set(0);
      mouseY.set(0);
    };

    window.addEventListener('pointermove', handleGlobalPointerMove);
    window.addEventListener('pointerleave', handleGlobalPointerLeave);
    return () => {
      window.removeEventListener('pointermove', handleGlobalPointerMove);
      window.removeEventListener('pointerleave', handleGlobalPointerLeave);
    };
  }, [mouseX, mouseY]);

  // Volume & Fluid Density Lerp interpolation
  const smoothedMic = useRef(0);
  const smoothedOut = useRef(0);
  const smoothedBlur = useRef(14);

  // 3D Sphere geometry generator (Etienne Jacob mathematical point sphere)
  const spherePointsRef = useRef<SpherePoint[]>([]);

  useEffect(() => {
    // Generate ~2,000 points on a sphere arranged in concentric latitude rings
    const points: SpherePoint[] = [];
    const numRings = 44;
    const baseRadius = 135;

    for (let i = 1; i < numRings; i++) {
      const theta = (i / numRings) * Math.PI;
      const sinTheta = Math.sin(theta);
      const ringPointCount = Math.max(6, Math.round(90 * sinTheta));

      for (let j = 0; j < ringPointCount; j++) {
        const phi = (j / ringPointCount) * Math.PI * 2;
        points.push({
          theta,
          phi,
          baseR: baseRadius,
        });
      }
    }

    spherePointsRef.current = points;
  }, []);

  // Compute CSS Liquid Animation parameters based on AssistantState & Audio
  // Distinct keyframe, speed, blur and droplet orbit for each state
  const liquidAnimationConfig = useMemo(() => {
    switch (state) {
      case 'listening':
        return {
          keyframeName: 'blob-listening',
          duration1: '4.2s',
          duration2: '5.2s',
          scale: 1.02 + Math.min(0.24, micVolume * 0.9),
          opacity: 0.88,
          borderWidth: '2px',
          targetBlur: 11,
          dropletAnim1: 'droplet-orbit-gentle 4.5s linear infinite',
          dropletAnim2: 'droplet-orbit-gentle 6.0s linear infinite',
          dropletAnim3: 'droplet-orbit-gentle 5.2s linear infinite',
        };
      case 'speaking':
        return {
          keyframeName: 'blob-speaking',
          duration1: '2.0s',
          duration2: '2.6s',
          scale: 1.06 + Math.min(0.36, outputVolume * 1.3),
          opacity: 0.98,
          borderWidth: '2.5px',
          targetBlur: 16,
          dropletAnim1: 'droplet-speak-pulse 1.8s ease-in-out infinite',
          dropletAnim2: 'droplet-speak-pulse 2.2s ease-in-out infinite',
          dropletAnim3: 'droplet-speak-pulse 1.5s ease-in-out infinite',
        };
      case 'thinking':
        return {
          keyframeName: 'blob-thinking',
          duration1: '5.5s',
          duration2: '6.8s',
          scale: 0.9,
          opacity: 0.92,
          borderWidth: '2.5px',
          targetBlur: 22,
          dropletAnim1: 'droplet-spin-fast 2.2s linear infinite',
          dropletAnim2: 'droplet-spin-fast 2.8s linear infinite',
          dropletAnim3: 'droplet-spin-fast 2.5s linear infinite',
        };
      case 'connecting':
        return {
          keyframeName: 'blob-connecting',
          duration1: '2.6s',
          duration2: '3.2s',
          scale: 1.08,
          opacity: 0.85,
          borderWidth: '1.5px',
          targetBlur: 17,
          dropletAnim1: 'droplet-spin-fast 1.6s linear infinite',
          dropletAnim2: 'droplet-spin-fast 2.0s linear infinite',
          dropletAnim3: 'droplet-spin-fast 1.8s linear infinite',
        };
      case 'disconnected':
      default:
        return {
          keyframeName: 'blob-disconnected',
          duration1: '18s',
          duration2: '22s',
          scale: 1.0,
          opacity: 0.42,
          borderWidth: '1px',
          targetBlur: 12,
          dropletAnim1: 'droplet-orbit-gentle 14s linear infinite',
          dropletAnim2: 'droplet-orbit-gentle 18s linear infinite',
          dropletAnim3: 'droplet-orbit-gentle 16s linear infinite',
        };
    }
  }, [state, micVolume, outputVolume]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const dpr = window.devicePixelRatio || 1;
    const size = 520;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const cx = size / 2;
    const cy = size / 2;
    let time = 0;

    const points = spherePointsRef.current;
    const projected = new Array(points.length);

    const render = () => {
      ctx.clearRect(0, 0, size, size);

      // Smooth audio volume and blur intensity
      smoothedMic.current += (micVolume - smoothedMic.current) * 0.2;
      smoothedOut.current += (outputVolume - smoothedOut.current) * 0.25;

      // Smoothly transition SVG gooey blur (Fluid Density)
      const targetBlur = liquidAnimationConfig.targetBlur;
      smoothedBlur.current += (targetBlur - smoothedBlur.current) * 0.08;
      if (blurElementRef.current) {
        blurElementRef.current.setAttribute('stdDeviation', smoothedBlur.current.toFixed(1));
      }

      const activeVolume =
        state === 'speaking'
          ? smoothedOut.current
          : state === 'listening'
          ? smoothedMic.current
          : 0;

      // Speed modifier based on vibe
      let vibeSpeed = 1.0;
      if (vibe === 'calm') vibeSpeed = 0.65;
      if (vibe === 'energetic') vibeSpeed = 1.6;
      if (vibe === 'cyberpunk') vibeSpeed = 2.0;
      if (vibe === 'zen') vibeSpeed = 0.45;
      if (vibe === 'aurora') vibeSpeed = 1.1;

      // State-specific time increments for distinct dynamics
      const baseTimeStep =
        state === 'speaking'
          ? 0.038
          : state === 'connecting'
          ? 0.045
          : state === 'thinking'
          ? 0.032
          : state === 'listening'
          ? 0.022
          : 0.012;

      time += (baseTimeStep + activeVolume * 0.05) * vibeSpeed;

      // State-specific 3D Rotations
      let pitch = 0.38 + Math.sin(time * 0.5) * 0.08;
      let effectiveYaw = time * 0.55;
      let roll = Math.cos(time * 0.3) * 0.06;

      if (state === 'connecting') {
        effectiveYaw = time * 2.0; // High speed scan
        pitch = 0.45;
      } else if (state === 'thinking') {
        effectiveYaw = time * 1.6; // Gravitational vortex
        roll = Math.sin(time * 0.8) * 0.15;
      } else if (state === 'speaking') {
        effectiveYaw = time * 0.85;
      } else if (state === 'listening') {
        effectiveYaw = time * 0.4;
      } else {
        effectiveYaw = time * 0.25; // Gentle celestial rotation
      }

      const cosPitch = Math.cos(pitch);
      const sinPitch = Math.sin(pitch);
      const cosYaw = Math.cos(effectiveYaw);
      const sinYaw = Math.sin(effectiveYaw);
      const cosRoll = Math.cos(roll);
      const sinRoll = Math.sin(roll);

      const fov = 520;

      // 1. Calculate displaced 3D positions based on STATE-SPECIFIC MATHEMATICS
      for (let i = 0; i < points.length; i++) {
        const p = points[i];
        let theta = p.theta;
        let phi = p.phi;
        let r = p.baseR;

        if (state === 'disconnected') {
          // CELESTIAL BREATHING SPHERE
          const w = Math.sin(3 * theta + 2 * phi - time * 1.5) * 8 + Math.cos(2 * theta - time * 0.8) * 4;
          r = p.baseR + w;
        } else if (state === 'connecting') {
          // DUAL VERTICAL LASER SCANLINES & DUAL SPINNING HELIX
          const wScan = Math.sin(10 * theta - time * 14) * 24 + Math.cos(5 * phi + time * 10) * 12;
          r = p.baseR + wScan;
        } else if (state === 'listening') {
          // POLAR ACOUSTIC RIPPLE DIAPHRAGM
          const wRipple =
            Math.sin(12 * theta - time * 8) * (8 + activeVolume * 48) +
            Math.cos(6 * phi) * (activeVolume * 24);
          r = p.baseR + wRipple;
        } else if (state === 'speaking') {
          // RESONANT MULTI-LOBED VOCAL PLASMA
          const w1 = Math.sin(4 * theta) * Math.cos(5 * phi - time * 4.8);
          const w2 = Math.cos(3 * theta) * Math.sin(3 * phi + time * 3.8);
          const wAudio = Math.sin(8 * theta + 2 * phi - time * 8) * (activeVolume * 28);
          r = p.baseR + (w1 + w2) * (18 + activeVolume * 56) + wAudio;
        } else if (state === 'thinking') {
          // GRAVITATIONAL MOBIUS SWIRL / VORTEX
          phi = phi + 2.2 * Math.sin(2 * theta - time * 5);
          const wVortex = Math.cos(6 * theta - time * 7) * 20 + Math.sin(3 * phi) * 10;
          r = p.baseR * 0.92 + wVortex;
        }

        const sinT = Math.sin(theta);
        const cosT = Math.cos(theta);
        const sinP = Math.sin(phi);
        const cosP = Math.cos(phi);

        const x0 = r * sinT * cosP;
        const y0 = r * cosT;
        const z0 = r * sinT * sinP;

        // 3D Yaw rotation
        const x1 = x0 * cosYaw + z0 * sinYaw;
        const y1 = y0;
        const z1 = -x0 * sinYaw + z0 * cosYaw;

        // 3D Pitch rotation
        const x2 = x1;
        const y2 = y1 * cosPitch - z1 * sinPitch;
        const z2 = y1 * sinPitch + z1 * cosPitch;

        // 3D Roll rotation
        const xRot = x2 * cosRoll - y2 * sinRoll;
        const yRot = x2 * sinRoll + y2 * cosRoll;
        const zRot = z2;

        // Perspective Projection
        const scale = fov / (fov - zRot);
        const xProj = cx + xRot * scale;
        const yProj = cy + yRot * scale;

        const depthNorm = Math.max(0, Math.min(1, (zRot + 180) / 360));

        projected[i] = {
          x: xProj,
          y: yProj,
          z: zRot,
          scale,
          depthNorm,
        };
      }

      // 2. Sort by depth (back to front)
      projected.sort((a, b) => a.z - b.z);

      // 3. Render dots with state-specific aesthetics
      const isMonochrome = theme.primary.toUpperCase() === '#FFFFFF';

      for (let i = 0; i < projected.length; i++) {
        const pt = projected[i];
        const depth = pt.depthNorm;

        let baseRadius = 1.2 + depth * 2.4;
        if (state === 'speaking') {
          baseRadius += activeVolume * (depth > 0.6 ? 2.0 : 0.6);
        } else if (state === 'connecting') {
          baseRadius += 0.4;
        } else if (state === 'thinking') {
          baseRadius = 1.0 + depth * 2.0;
        }

        const dotRadius = Math.max(0.6, baseRadius * pt.scale * 0.9);
        const alpha = 0.12 + Math.pow(depth, 1.4) * 0.88;

        ctx.beginPath();
        ctx.arc(pt.x, pt.y, dotRadius, 0, Math.PI * 2);

        if (isMonochrome) {
          ctx.fillStyle = depth > 0.75 ? '#FFFFFF' : depth > 0.4 ? '#E2E8F0' : '#94A3B8';
        } else {
          ctx.fillStyle = depth > 0.7 ? '#FFFFFF' : depth > 0.4 ? theme.primary : theme.secondary;
        }

        ctx.globalAlpha = Math.max(0, Math.min(1, alpha));

        if (depth > 0.82 && (state === 'speaking' || state === 'connecting' || state === 'thinking' || isHovered)) {
          ctx.shadowColor = theme.primary;
          ctx.shadowBlur = state === 'speaking' ? 8 : 5;
          ctx.fill();
          ctx.shadowBlur = 0;
        } else {
          ctx.fill();
        }
      }

      ctx.globalAlpha = 1.0;
      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [state, theme, vibe, micVolume, outputVolume, isHovered, liquidAnimationConfig.targetBlur]);

  const stateLabels: Record<AssistantState, { label: string; desc: string; icon: any }> = {
    disconnected: {
      label: 'Tap to awaken Myraa',
      desc: 'Liquid Voice-to-Voice Companion',
      icon: Power,
    },
    connecting: {
      label: 'Connecting to Myraa...',
      desc: 'High-frequency vortex scan',
      icon: Radio,
    },
    listening: {
      label: 'Listening to your voice...',
      desc: 'Acoustic resonance diaphragm',
      icon: Mic,
    },
    speaking: {
      label: 'Myraa is speaking...',
      desc: 'Resonant harmonic plasma flow',
      icon: Volume2,
    },
    thinking: {
      label: 'Working & thinking...',
      desc: 'Gravitational neural vortex',
      icon: Sparkles,
    },
  };

  const getOrbState = (): OrbState => {
    switch (state) {
      case 'disconnected':
        return 'breathing';
      case 'connecting':
        return 'connecting';
      case 'listening':
        return 'listening';
      case 'speaking':
        return 'composing';
      case 'thinking':
        return 'searching';
      default:
        return 'working';
    }
  };

  const currentInfo = stateLabels[state];
  const IconComponent = currentInfo.icon;
  const isMonochrome = theme.primary.toUpperCase() === '#FFFFFF';

  return (
    <div className="relative flex flex-col items-center justify-center select-none py-1 sm:py-2">
      {/* SVG Gooey Filter Definition with Dynamic stdDeviation lerping */}
      <svg
        className="absolute w-0 h-0 pointer-events-none"
        aria-hidden="true"
        style={{ position: 'absolute', width: 0, height: 0 }}
      >
        <defs>
          <filter id="gooey">
            <feGaussianBlur
              ref={blurElementRef}
              in="SourceGraphic"
              stdDeviation="14"
              result="blur"
            />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -9"
              result="gooey"
            />
            <feComposite in="SourceGraphic" in2="gooey" operator="atop" />
          </filter>
        </defs>
      </svg>

      {/* 
        ===========================================================
        Magnetic Spring 3D Mathematical Wave Sphere Liquid Blob
        With distinct state-specific animation physics & keyframes
        =========================================================== 
      */}
      <motion.div
        ref={containerRef}
        style={{
          x: springX,
          y: springY,
          rotateX: tiltX,
          rotateY: tiltY,
          transformPerspective: 1000,
        }}
        whileHover={{ scale: 1.025 }}
        whileTap={{ scale: 0.96 }}
        className="relative w-[320px] h-[320px] sm:w-[440px] sm:h-[440px] flex items-center justify-center cursor-pointer group"
        onClick={onToggleConnect}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        role="button"
        tabIndex={0}
        aria-label={state === 'disconnected' ? 'Start conversation with Myraa' : 'End voice session'}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggleConnect();
          }
        }}
      >
        {/* Gooey Filter Wrapper holding the morphing fluid blob and orbiting droplets */}
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none transition-all duration-700"
          style={{
            filter: 'url(#gooey)',
            transform: `scale(${liquidAnimationConfig.scale})`,
          }}
        >
          {/* Primary Liquid Blob Core with state-dependent fluid keyframes */}
          <div
            className="absolute w-64 h-64 sm:w-80 sm:h-80 transition-all duration-700"
            style={{
              animation: `${liquidAnimationConfig.keyframeName} ${liquidAnimationConfig.duration1} ease-in-out infinite`,
              background: isMonochrome
                ? 'radial-gradient(circle at 35% 35%, rgba(255,255,255,0.22) 0%, rgba(200,215,235,0.08) 55%, rgba(15,23,42,0.4) 100%)'
                : `radial-gradient(circle at 35% 35%, ${theme.primary}35 0%, ${theme.secondary}18 55%, transparent 100%)`,
              boxShadow: `0 0 60px ${theme.glow}, inset 0 0 35px rgba(255,255,255,0.15)`,
              border: `${liquidAnimationConfig.borderWidth} solid ${isMonochrome ? 'rgba(255,255,255,0.25)' : theme.primary + '50'}`,
              opacity: liquidAnimationConfig.opacity,
            }}
          />

          {/* Secondary Counter-Rotating Liquid Blob Layer */}
          <div
            className="absolute w-60 h-60 sm:w-72 sm:h-72 transition-all duration-700"
            style={{
              animation: `${liquidAnimationConfig.keyframeName} ${liquidAnimationConfig.duration2} ease-in-out infinite reverse, blob-counter-turn 16s linear infinite`,
              background: isMonochrome
                ? 'radial-gradient(circle at 65% 65%, rgba(255,255,255,0.15) 0%, rgba(148,163,184,0.05) 50%, transparent 100%)'
                : `radial-gradient(circle at 65% 65%, ${theme.secondary}30 0%, ${theme.primary}10 60%, transparent 100%)`,
              opacity: liquidAnimationConfig.opacity * 0.85,
            }}
          />

          {/* Third Accent Liquid Membrane */}
          <div
            className="absolute w-52 h-52 sm:w-64 sm:h-64 transition-all duration-700"
            style={{
              animation: `${liquidAnimationConfig.keyframeName} ${liquidAnimationConfig.duration1} ease-in-out infinite alternate`,
              border: `1px dashed ${isMonochrome ? 'rgba(255,255,255,0.2)' : theme.primary + '35'}`,
              opacity: state === 'disconnected' ? 0.3 : 0.8,
            }}
          />

          {/* Orbiting Satellite Fluid Droplets that fuse into main blob via #gooey with state-specific physics */}
          <div
            className="absolute w-12 h-12 rounded-full pointer-events-none"
            style={{
              animation: liquidAnimationConfig.dropletAnim1,
              background: isMonochrome
                ? 'radial-gradient(circle, #FFFFFF 0%, rgba(226,232,240,0.6) 70%, transparent 100%)'
                : `radial-gradient(circle, ${theme.primary} 0%, ${theme.secondary}80 70%, transparent 100%)`,
              boxShadow: `0 0 25px ${theme.primary}`,
              opacity: state === 'disconnected' ? 0.4 : 0.9,
            }}
          />

          <div
            className="absolute w-9 h-9 rounded-full pointer-events-none"
            style={{
              animation: liquidAnimationConfig.dropletAnim2,
              background: isMonochrome
                ? 'radial-gradient(circle, #E2E8F0 0%, rgba(148,163,184,0.6) 70%, transparent 100%)'
                : `radial-gradient(circle, ${theme.secondary} 0%, ${theme.primary}80 70%, transparent 100%)`,
              boxShadow: `0 0 20px ${theme.secondary}`,
              opacity: state === 'disconnected' ? 0.3 : 0.85,
            }}
          />

          {state !== 'disconnected' && (
            <div
              className="absolute w-7 h-7 rounded-full pointer-events-none"
              style={{
                animation: liquidAnimationConfig.dropletAnim3,
                background: '#FFFFFF',
                boxShadow: `0 0 18px ${theme.primary}`,
                opacity: 0.9,
              }}
            />
          )}
        </div>

        {/* 3D Mathematical Wave Sphere Canvas (Pinterest generative dots with state-specific equations) */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none transition-transform duration-500 group-hover:scale-[1.03]"
          style={{ width: '100%', height: '100%' }}
        />
      </motion.div>

      {/* 
        ===========================================================
        BUTTON & CONTROLS LOCATED BELOW THE BLOB
        =========================================================== 
      */}
      <div className="mt-2 sm:mt-4 flex flex-col items-center gap-3 z-30 select-none">
        {/* Thinking State 64px Orb HUD Badge from thinking-orbs */}
        {state === 'thinking' && (
          <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-slate-900/90 border border-purple-500/40 shadow-2xl backdrop-blur-xl animate-in zoom-in-95 duration-200 mb-1">
            <ThinkingOrb size={64} state="searching" theme="dark" color={theme.primary} />
            <div className="text-left">
              <div className="text-xs font-semibold text-purple-200">Processing Request</div>
              <div className="text-[10px] text-slate-400 font-mono">Thinking & Executing Tools</div>
            </div>
          </div>
        )}

        {/* 2 Dedicated Action Buttons: Awaken and Mute */}
        <div className="flex items-center gap-3">
          {/* Button 1: Awaken / Sleep */}
          <button
            onClick={onToggleConnect}
            title={state === 'disconnected' ? 'Awaken Myraa' : 'Put Myraa to Sleep'}
            className={`group relative flex items-center gap-2.5 px-5 py-2.5 sm:px-6 sm:py-3 rounded-full 
              transition-all duration-300 transform active:scale-95 cursor-pointer 
              backdrop-blur-xl border shadow-xl focus:outline-none
              ${
                state === 'disconnected'
                  ? 'bg-slate-900/80 hover:bg-slate-800 border-white/20 hover:border-white/40 text-white'
                  : 'bg-black/80 hover:bg-black border-white/30 text-white'
              }`}
            style={{
              boxShadow:
                state !== 'disconnected'
                  ? `0 0 25px ${theme.glow}, inset 0 0 10px rgba(255,255,255,0.15)`
                  : '0 4px 20px rgba(0,0,0,0.6)',
            }}
          >
            {/* ThinkingOrb from thinking-orbs inside Awaken button */}
            <div
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all duration-300 border overflow-hidden shrink-0"
              style={{
                backgroundColor: state === 'disconnected' ? 'rgba(255,255,255,0.08)' : `${theme.primary}25`,
                borderColor: state === 'disconnected' ? 'rgba(255,255,255,0.2)' : theme.primary,
              }}
            >
              <ThinkingOrb
                size={20}
                state={getOrbState()}
                theme="dark"
                color={theme.primary}
              />
            </div>

            <div className="text-left">
              <span className="text-xs sm:text-sm font-semibold tracking-wide text-white block">
                {state === 'disconnected' ? 'Awaken' : 'Sleep'}
              </span>
              <span className="text-[9px] font-mono uppercase tracking-wider text-slate-400 block -mt-0.5">
                {state === 'disconnected' ? 'TAP TO START' : state.toUpperCase()}
              </span>
            </div>
          </button>

          {/* Button 2: Mute / Unmute */}
          <button
            onClick={onToggleMute}
            title={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
            className={`group flex items-center gap-2.5 px-4 py-2.5 sm:px-5 sm:py-3 rounded-full 
              backdrop-blur-xl border transition-all duration-300 transform active:scale-95 shadow-xl cursor-pointer focus:outline-none
              ${
                isMuted
                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 hover:bg-rose-500/30'
                  : 'bg-slate-900/80 hover:bg-slate-800 border-white/20 hover:border-white/40 text-slate-200'
              }`}
            style={{
              boxShadow: isMuted ? '0 0 20px rgba(244,63,94,0.3)' : '0 4px 20px rgba(0,0,0,0.6)',
            }}
          >
            <div
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center border shrink-0 transition-colors ${
                isMuted
                  ? 'bg-rose-500/30 border-rose-500/50 text-rose-300'
                  : 'bg-white/10 border-white/20 text-emerald-400'
              }`}
            >
              {isMuted ? (
                <MicOff className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-300" />
              ) : (
                <Mic className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
              )}
            </div>

            <div className="text-left">
              <span className="text-xs sm:text-sm font-semibold tracking-wide block">
                {isMuted ? 'Unmute' : 'Mute'}
              </span>
              <span className="text-[9px] font-mono uppercase tracking-wider text-slate-400 block -mt-0.5">
                {isMuted ? 'MIC OFF' : 'MIC ON'}
              </span>
            </div>
          </button>
        </div>

        {/* State Description */}
        <div className="text-center max-w-sm px-4">
          <p className="text-xs text-slate-400 font-normal">
            {currentInfo.desc}
          </p>

          {/* Real-time Frequency / Audio Meter Pill */}
          {state !== 'disconnected' && (
            <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
              <Radio className="w-3.5 h-3.5 text-slate-400" />
              <div className="w-20 sm:w-28 h-1.5 bg-slate-900 rounded-full overflow-hidden flex border border-white/5">
                <div
                  className="h-full transition-all duration-75 rounded-full"
                  style={{
                    backgroundColor: theme.primary,
                    width: `${Math.min(
                      100,
                      Math.round(
                        (state === 'speaking' ? outputVolume * 170 : micVolume * 220) || 5
                      )
                    )}%`,
                  }}
                />
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                {state === 'speaking' ? 'OUTPUT' : state === 'thinking' ? 'THINKING' : isMuted ? 'MUTED' : 'INPUT'}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

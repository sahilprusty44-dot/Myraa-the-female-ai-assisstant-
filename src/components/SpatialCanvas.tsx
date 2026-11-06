import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  X,
  Maximize2,
  Minimize2,
  Layers,
  Sparkles,
  RotateCw,
  Sun,
  Shield,
  Eye,
  Camera,
} from 'lucide-react';
import {
  Scene3DConfig,
  Model3DArchetype,
  MaterialPreset3D,
  ThemeConfig,
} from '../types/live';
import {
  buildCompositeModel,
  ProceduralPart,
  createPbrMaterial,
} from '../utils/threeModelBuilder';

interface SpatialCanvasProps {
  config: Scene3DConfig;
  theme: ThemeConfig;
  outputVolume?: number;
  onClose: () => void;
  onUpdateConfig: (partial: Partial<Scene3DConfig>) => void;
}

export const SpatialCanvas: React.FC<SpatialCanvasProps> = ({
  config,
  theme,
  outputVolume = 0,
  onClose,
  onUpdateConfig,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const activeModelGroupRef = useRef<THREE.Group | null>(null);
  const partsRef = useRef<ProceduralPart[]>([]);
  const frameIdRef = useRef<number>(0);
  const modelMetaRef = useRef<{ name: string; category: string }>({
    name: 'Procedural Model',
    category: 'Autonomous Asset',
  });

  const [isExploded, setIsExploded] = useState(config.explodeFactor > 0.05);
  const [controlsCollapsed, setControlsCollapsed] = useState(false);
  const [isRotating, setIsRotating] = useState(true);

  // Dynamic values tracked by ref for continuous render loops
  const explodeFactorRef = useRef(config.explodeFactor);
  const targetExplodeRef = useRef(config.explodeFactor);
  const rotationSpeedRef = useRef(config.rotationSpeed);
  const currentRotationRef = useRef(0);
  const isWireframeRef = useRef(config.isWireframe);
  const outputVolumeRef = useRef(outputVolume);

  useEffect(() => {
    targetExplodeRef.current = config.explodeFactor;
    explodeFactorRef.current = config.explodeFactor;
    setIsExploded(config.explodeFactor > 0.05);
  }, [config.explodeFactor]);

  useEffect(() => {
    rotationSpeedRef.current = config.rotationSpeed;
  }, [config.rotationSpeed]);

  useEffect(() => {
    isWireframeRef.current = config.isWireframe;
    updateMaterialFinishes();
  }, [config.isWireframe, config.materialPreset]);

  useEffect(() => {
    outputVolumeRef.current = outputVolume;
  }, [outputVolume]);

  const updateMaterialFinishes = useCallback(() => {
    if (!partsRef.current.length) return;
    partsRef.current.forEach((part) => {
      const newMat = createPbrMaterial(
        config.materialPreset,
        theme.primary,
        isWireframeRef.current
      );
      part.mesh.material = newMat;
    });
  }, [config.materialPreset, theme.primary]);

  // Initialize Three.js scene
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Detect software WebGL guard according to Three.js guidelines
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 450;

    // 1. Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Ambient studio atmosphere fog
    scene.fog = new THREE.FogExp2('#060812', 0.04);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(3.5, 2.5, 4.5);
    camera.lookAt(0, 1.1, 0);
    cameraRef.current = camera;

    // 3. WebGLRenderer with PBR ToneMapping and Color Space
    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Procedural Studio Environment Reflection Map
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 5. Studio Lighting Rig (Key Light + Cool Hemisphere Fill)
    const keyLight = new THREE.DirectionalLight('#ffffff', 2.4);
    keyLight.position.set(4, 6, 4);
    keyLight.castShadow = !isSoftwareGl;
    if (keyLight.shadow) {
      keyLight.shadow.mapSize.width = 1024;
      keyLight.shadow.mapSize.height = 1024;
      keyLight.shadow.camera.near = 0.5;
      keyLight.shadow.camera.far = 15;
      keyLight.shadow.camera.left = -3;
      keyLight.shadow.camera.right = 3;
      keyLight.shadow.camera.top = 3;
      keyLight.shadow.camera.bottom = -3;
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.normalBias = 0.02;
    }
    scene.add(keyLight);

    const hemiLight = new THREE.HemisphereLight('#60a5fa', '#0f172a', 0.9);
    scene.add(hemiLight);

    const rimLight = new THREE.DirectionalLight(theme.primary, 1.6);
    rimLight.position.set(-4, 3, -3);
    scene.add(rimLight);

    // 6. Ground Studio Radial Contact Shadow & Grid
    const groundGeo = new THREE.PlaneGeometry(16, 16);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x070a14,
      roughness: 0.85,
      metalness: 0.2,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    ground.receiveShadow = true;
    scene.add(ground);

    const grid = new THREE.GridHelper(10, 20, new THREE.Color(theme.primary), new THREE.Color(0x1e293b));
    grid.position.y = 0.005;
    scene.add(grid);

    // 7. Render Loop with Exponential Damping
    const clock = new THREE.Clock();

    const animate = () => {
      frameIdRef.current = requestAnimationFrame(animate);

      const delta = Math.min(clock.getDelta(), 0.1);

      // Smooth exponential damping for exploded parts separation
      explodeFactorRef.current = THREE.MathUtils.damp(
        explodeFactorRef.current,
        targetExplodeRef.current,
        6,
        delta
      );

      // Apply exploded positions
      partsRef.current.forEach((part) => {
        const targetPos = part.basePosition
          .clone()
          .addScaledVector(part.explodeDirection, explodeFactorRef.current * 1.5);
        part.mesh.position.copy(targetPos);
      });

      // Continuous model rotation
      if (activeModelGroupRef.current && isRotating) {
        currentRotationRef.current += rotationSpeedRef.current * delta * 0.8;
        activeModelGroupRef.current.rotation.y = currentRotationRef.current;

        // Subtle audio floating pulsation
        const audioBob = Math.sin(clock.getElapsedTime() * 3) * 0.05 + outputVolumeRef.current * 0.15;
        activeModelGroupRef.current.position.y = audioBob;
      }

      renderer.render(scene, camera);
    };

    animate();

    // 8. Resize listener
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(frameIdRef.current);
      window.removeEventListener('resize', handleResize);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Re-build 3D model whenever archetype changes
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    if (activeModelGroupRef.current) {
      scene.remove(activeModelGroupRef.current);
      activeModelGroupRef.current.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          mesh.geometry?.dispose();
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((m) => m.dispose());
          } else {
            mesh.material?.dispose();
          }
        }
      });
    }

    const { group, parts, name, category } = buildCompositeModel(
      config.archetype,
      config.materialPreset,
      theme.primary
    );

    activeModelGroupRef.current = group;
    partsRef.current = parts;
    modelMetaRef.current = { name, category };

    scene.add(group);
  }, [config.archetype]);

  const toggleExplode = () => {
    const next = !isExploded;
    setIsExploded(next);
    const factor = next ? 0.75 : 0;
    targetExplodeRef.current = factor;
    onUpdateConfig({ explodeFactor: factor });
  };

  const handleCameraPreset = (view: 'iso' | 'front' | 'top') => {
    if (!cameraRef.current) return;
    if (view === 'iso') {
      cameraRef.current.position.set(3.5, 2.5, 4.5);
    } else if (view === 'front') {
      cameraRef.current.position.set(0, 1.4, 5.2);
    } else if (view === 'top') {
      cameraRef.current.position.set(0, 6.0, 0.1);
    }
    cameraRef.current.lookAt(0, 1.1, 0);
  };

  const archetypes: { id: Model3DArchetype; label: string }[] = [
    { id: 'drone', label: 'Drone Mark IV' },
    { id: 'robot', label: 'Cyber Sentinel' },
    { id: 'rover', label: 'Terra-X Rover' },
    { id: 'satellite', label: 'Astra Satellite' },
    { id: 'monolith', label: 'Resonance Spire' },
  ];

  const materialPresets: { id: MaterialPreset3D; label: string }[] = [
    { id: 'default', label: 'Alloy' },
    { id: 'gold', label: 'Gold' },
    { id: 'chrome', label: 'Chrome' },
    { id: 'glass', label: 'Glass' },
    { id: 'cyber', label: 'Cyber' },
  ];

  return (
    <div className="relative w-full h-[60vh] sm:h-[68vh] lg:h-[72vh] min-h-[440px] rounded-3xl overflow-hidden border border-white/10 bg-[#04060f]/90 backdrop-blur-xl shadow-2xl flex flex-col">
      {/* 3D Top Header Bar */}
      <div className="px-4 py-3 bg-slate-950/80 border-b border-white/10 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center border shrink-0"
            style={{
              backgroundColor: `${theme.primary}20`,
              borderColor: `${theme.primary}50`,
            }}
          >
            <Sparkles className="w-4 h-4" style={{ color: theme.primary }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-white tracking-wide">
                {modelMetaRef.current.name}
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300">
                Three.js PBR
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              {modelMetaRef.current.category} · Voice-Directed
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsRotating((prev) => !prev)}
            className={`p-2 rounded-xl text-xs font-mono border transition-colors flex items-center gap-1 ${
              isRotating
                ? 'bg-white/10 border-white/20 text-white'
                : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
            }`}
            title="Toggle rotation"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={toggleExplode}
            className={`p-2 rounded-xl text-xs font-mono border transition-colors flex items-center gap-1.5 ${
              isExploded
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                : 'bg-white/5 border-white/10 text-slate-300 hover:text-white'
            }`}
            title="Explode parts to inspect structure"
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {isExploded ? 'Assembled' : 'Explode'}
            </span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-rose-500/20 hover:border-rose-500/40 border border-transparent transition-all"
            title="Close 3D Canvas"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* WebGL Canvas Container */}
      <div ref={mountRef} className="relative flex-1 w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Collapsible Unified Bottom Control Dock */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 w-[92%] sm:w-auto transition-all duration-300">
        <div className="rounded-2xl border border-white/10 bg-slate-950/85 backdrop-blur-xl p-2 sm:px-3 sm:py-2 flex flex-wrap items-center justify-center gap-2 shadow-2xl">
          {/* Model Archetype Selector */}
          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
            {archetypes.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onUpdateConfig({ archetype: item.id })}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-sans font-medium whitespace-nowrap transition-colors ${
                  config.archetype === item.id
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-white/10 hidden sm:block" />

          {/* Material Finishes */}
          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
            {materialPresets.map((mat) => (
              <button
                key={mat.id}
                type="button"
                onClick={() => onUpdateConfig({ materialPreset: mat.id })}
                className={`px-2 py-1 rounded-lg text-[11px] font-mono whitespace-nowrap transition-colors ${
                  config.materialPreset === mat.id
                    ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {mat.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => onUpdateConfig({ isWireframe: !config.isWireframe })}
              className={`px-2 py-1 rounded-lg text-[11px] font-mono whitespace-nowrap transition-colors ${
                config.isWireframe
                  ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-400/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Wire
            </button>
          </div>

          <div className="h-4 w-px bg-white/10 hidden sm:block" />

          {/* Camera Angles */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => handleCameraPreset('iso')}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-[10px] font-mono"
              title="Isometric Perspective"
            >
              ISO
            </button>
            <button
              type="button"
              onClick={() => handleCameraPreset('front')}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-[10px] font-mono"
              title="Front Perspective"
            >
              FRONT
            </button>
            <button
              type="button"
              onClick={() => handleCameraPreset('top')}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-[10px] font-mono"
              title="Top View"
            >
              TOP
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

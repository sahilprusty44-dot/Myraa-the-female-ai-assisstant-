import * as THREE from 'three';
import { Model3DArchetype, MaterialPreset3D } from '../types/live';

export interface ProceduralPart {
  mesh: THREE.Mesh;
  basePosition: THREE.Vector3;
  explodeDirection: THREE.Vector3;
  originalMaterial: THREE.Material;
}

export interface ProceduralModelResult {
  group: THREE.Group;
  parts: ProceduralPart[];
  name: string;
  category: string;
}

/**
 * Creates physical PBR materials with zero external texture dependencies
 */
export function createPbrMaterial(
  preset: MaterialPreset3D,
  colorHex: string,
  isWireframe = false
): THREE.Material {
  const color = new THREE.Color(colorHex);

  switch (preset) {
    case 'gold':
      return new THREE.MeshPhysicalMaterial({
        color: new THREE.Color('#e5c158'),
        metalness: 0.95,
        roughness: 0.18,
        clearcoat: 0.6,
        clearcoatRoughness: 0.1,
        wireframe: isWireframe,
      });

    case 'chrome':
      return new THREE.MeshStandardMaterial({
        color: new THREE.Color('#d4d8e2'),
        metalness: 0.98,
        roughness: 0.08,
        wireframe: isWireframe,
      });

    case 'glass':
      return new THREE.MeshPhysicalMaterial({
        color: new THREE.Color('#94a3b8'),
        transmission: 0.92,
        opacity: 1,
        transparent: true,
        roughness: 0.12,
        ior: 1.52,
        thickness: 1.2,
        wireframe: isWireframe,
      });

    case 'cyber':
      return new THREE.MeshStandardMaterial({
        color: color.clone().multiplyScalar(0.2),
        emissive: color,
        emissiveIntensity: 0.85,
        metalness: 0.8,
        roughness: 0.25,
        wireframe: isWireframe,
      });

    default:
      // High-grade satin metallic alloy
      return new THREE.MeshStandardMaterial({
        color: new THREE.Color('#222838'),
        metalness: 0.85,
        roughness: 0.3,
        wireframe: isWireframe,
      });
  }
}

/**
 * Builds a composite 3-12 part procedural model according to Three.js guidelines
 */
export function buildCompositeModel(
  archetype: Model3DArchetype,
  preset: MaterialPreset3D = 'default',
  accentColorHex = '#38bdf8'
): ProceduralModelResult {
  const group = new THREE.Group();
  const parts: ProceduralPart[] = [];

  const mainMat = createPbrMaterial(preset, '#262e3d');
  const accentMat = createPbrMaterial(
    preset === 'default' ? 'cyber' : preset,
    accentColorHex
  );
  const darkMetalMat = new THREE.MeshStandardMaterial({
    color: 0x111622,
    metalness: 0.9,
    roughness: 0.35,
  });

  const registerPart = (
    mesh: THREE.Mesh,
    explodeDir: THREE.Vector3,
    mat: THREE.Material
  ) => {
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.material = mat;
    group.add(mesh);
    parts.push({
      mesh,
      basePosition: mesh.position.clone(),
      explodeDirection: explodeDir.clone().normalize(),
      originalMaterial: mat,
    });
  };

  if (archetype === 'drone') {
    // 1. Center Core Body (Primary silhouette)
    const coreGeo = new THREE.CylinderGeometry(0.7, 0.9, 0.4, 8);
    const core = new THREE.Mesh(coreGeo, mainMat);
    core.position.set(0, 1.2, 0);
    registerPart(core, new THREE.Vector3(0, 0.5, 0), mainMat);

    // 2. Cockpit Visor / Dome (Accent)
    const domeGeo = new THREE.SphereGeometry(0.5, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2);
    const dome = new THREE.Mesh(domeGeo, accentMat);
    dome.position.set(0, 1.4, 0);
    registerPart(dome, new THREE.Vector3(0, 1.2, 0), accentMat);

    // 3–6. Four Rotors / Thruster Nacelles
    const rotorOffsets = [
      { x: 1.2, z: 1.2, rot: Math.PI / 4 },
      { x: -1.2, z: 1.2, rot: -Math.PI / 4 },
      { x: 1.2, z: -1.2, rot: -Math.PI / 4 },
      { x: -1.2, z: -1.2, rot: Math.PI / 4 },
    ];

    rotorOffsets.forEach((pos, idx) => {
      // Strut Arm
      const armGeo = new THREE.BoxGeometry(1.2, 0.08, 0.15);
      const arm = new THREE.Mesh(armGeo, darkMetalMat);
      arm.position.set(pos.x * 0.5, 1.2, pos.z * 0.5);
      arm.rotation.y = pos.rot;
      registerPart(arm, new THREE.Vector3(pos.x * 0.6, 0.2, pos.z * 0.6), darkMetalMat);

      // Ducted Thruster Ring
      const ringGeo = new THREE.TorusGeometry(0.4, 0.06, 12, 24);
      const ring = new THREE.Mesh(ringGeo, mainMat);
      ring.position.set(pos.x, 1.25, pos.z);
      ring.rotation.x = Math.PI / 2;
      registerPart(ring, new THREE.Vector3(pos.x, 0.4, pos.z), mainMat);

      // Spinning Blade Propeller
      const bladeGeo = new THREE.BoxGeometry(0.7, 0.02, 0.08);
      const blade = new THREE.Mesh(bladeGeo, accentMat);
      blade.position.set(pos.x, 1.28, pos.z);
      blade.name = `propeller_${idx}`;
      registerPart(blade, new THREE.Vector3(pos.x, 0.8, pos.z), accentMat);
    });

    // Landing Struts (Bottom Pivot)
    const legLeftGeo = new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.5, 1.0, 0.6),
        new THREE.Vector3(-0.6, 0.4, 0.6),
        new THREE.Vector3(-0.6, 0.2, -0.6),
        new THREE.Vector3(-0.5, 1.0, -0.6),
      ]),
      20,
      0.04,
      8,
      false
    );
    const legLeft = new THREE.Mesh(legLeftGeo, darkMetalMat);
    registerPart(legLeft, new THREE.Vector3(-0.8, -0.4, 0), darkMetalMat);

    const legRight = legLeft.clone();
    legRight.scale.set(-1, 1, 1);
    registerPart(legRight, new THREE.Vector3(0.8, -0.4, 0), darkMetalMat);

    return { group, parts, name: 'Aero-V Drone Mark IV', category: 'Autonomous Aerial Scout' };
  }

  if (archetype === 'robot') {
    // 1. Hover/Bipedal Base
    const baseGeo = new THREE.CylinderGeometry(0.8, 0.5, 0.3, 16);
    const base = new THREE.Mesh(baseGeo, darkMetalMat);
    base.position.set(0, 0.3, 0);
    registerPart(base, new THREE.Vector3(0, -0.6, 0), darkMetalMat);

    // 2. Main Torso Chassis
    const torsoGeo = new THREE.BoxGeometry(1.1, 1.2, 0.7);
    const torso = new THREE.Mesh(torsoGeo, mainMat);
    torso.position.set(0, 1.1, 0);
    registerPart(torso, new THREE.Vector3(0, 0, 0), mainMat);

    // 3. Reactor Arc Core in Chest (Glowing Accent)
    const reactorGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.1, 16);
    const reactor = new THREE.Mesh(reactorGeo, accentMat);
    reactor.position.set(0, 1.2, 0.36);
    reactor.rotation.x = Math.PI / 2;
    registerPart(reactor, new THREE.Vector3(0, 0.2, 0.8), accentMat);

    // 4. Head & Articulated Sensor Visor
    const headGeo = new THREE.BoxGeometry(0.65, 0.5, 0.55);
    const head = new THREE.Mesh(headGeo, mainMat);
    head.position.set(0, 1.95, 0);
    registerPart(head, new THREE.Vector3(0, 0.8, 0), mainMat);

    const visorGeo = new THREE.BoxGeometry(0.55, 0.12, 0.1);
    const visor = new THREE.Mesh(visorGeo, accentMat);
    visor.position.set(0, 1.98, 0.28);
    registerPart(visor, new THREE.Vector3(0, 1.1, 0.6), accentMat);

    // 5-6. Articulated Shoulder Pauldrons & Arms
    const shoulderLGeo = new THREE.SphereGeometry(0.32, 12, 12);
    const shoulderL = new THREE.Mesh(shoulderLGeo, darkMetalMat);
    shoulderL.position.set(-0.85, 1.45, 0);
    registerPart(shoulderL, new THREE.Vector3(-1.0, 0.4, 0), darkMetalMat);

    const armLGeo = new THREE.CylinderGeometry(0.12, 0.1, 0.9, 10);
    const armL = new THREE.Mesh(armLGeo, mainMat);
    armL.position.set(-0.85, 0.9, 0);
    registerPart(armL, new THREE.Vector3(-1.2, -0.2, 0), mainMat);

    const shoulderR = shoulderL.clone();
    shoulderR.position.x = 0.85;
    registerPart(shoulderR, new THREE.Vector3(1.0, 0.4, 0), darkMetalMat);

    const armR = armL.clone();
    armR.position.x = 0.85;
    registerPart(armR, new THREE.Vector3(1.2, -0.2, 0), mainMat);

    return { group, parts, name: 'Cybernetic Sentinel Nexus', category: 'Modular Synthetic Companion' };
  }

  if (archetype === 'rover') {
    // 1. Main Platform Chassis
    const chassisGeo = new THREE.BoxGeometry(1.6, 0.4, 2.2);
    const chassis = new THREE.Mesh(chassisGeo, mainMat);
    chassis.position.set(0, 0.8, 0);
    registerPart(chassis, new THREE.Vector3(0, 0.2, 0), mainMat);

    // 2. Solar Panel Sensor Deck
    const solarGeo = new THREE.BoxGeometry(1.3, 0.08, 1.4);
    const solar = new THREE.Mesh(solarGeo, accentMat);
    solar.position.set(0, 1.05, -0.2);
    registerPart(solar, new THREE.Vector3(0, 0.8, -0.3), accentMat);

    // 3. Sensor Mast & Camera Head
    const mastGeo = new THREE.CylinderGeometry(0.06, 0.08, 1.0, 8);
    const mast = new THREE.Mesh(mastGeo, darkMetalMat);
    mast.position.set(0.4, 1.5, 0.7);
    registerPart(mast, new THREE.Vector3(0.5, 1.0, 0.8), darkMetalMat);

    const camGeo = new THREE.BoxGeometry(0.35, 0.2, 0.3);
    const cam = new THREE.Mesh(camGeo, accentMat);
    cam.position.set(0.4, 2.05, 0.7);
    registerPart(cam, new THREE.Vector3(0.6, 1.4, 1.0), accentMat);

    // 4–7. Four Rugged Planetary Wheels
    const wheelPositions = [
      { x: 1.05, z: 0.75 },
      { x: -1.05, z: 0.75 },
      { x: 1.05, z: -0.75 },
      { x: -1.05, z: -0.75 },
    ];

    wheelPositions.forEach((pos) => {
      const wheelGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.3, 16);
      const wheel = new THREE.Mesh(wheelGeo, darkMetalMat);
      wheel.position.set(pos.x, 0.45, pos.z);
      wheel.rotation.z = Math.PI / 2;
      registerPart(wheel, new THREE.Vector3(pos.x * 1.3, -0.3, pos.z * 1.1), darkMetalMat);

      // Hubcap rim
      const hubGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.34, 12);
      const hub = new THREE.Mesh(hubGeo, accentMat);
      hub.position.set(pos.x, 0.45, pos.z);
      hub.rotation.z = Math.PI / 2;
      registerPart(hub, new THREE.Vector3(pos.x * 1.6, -0.3, pos.z * 1.1), accentMat);
    });

    return { group, parts, name: 'Terra-X Rover Probe', category: 'Off-World Exploration Unit' };
  }

  if (archetype === 'satellite') {
    // 1. Central Avionics Bus
    const busGeo = new THREE.BoxGeometry(0.9, 1.2, 0.9);
    const bus = new THREE.Mesh(busGeo, mainMat);
    bus.position.set(0, 1.3, 0);
    registerPart(bus, new THREE.Vector3(0, 0, 0), mainMat);

    // 2. High-Gain Parabolic Dish
    const dishGeo = new THREE.ConeGeometry(0.7, 0.3, 18, 1, true);
    const dish = new THREE.Mesh(dishGeo, accentMat);
    dish.position.set(0, 2.1, 0);
    dish.rotation.x = Math.PI;
    registerPart(dish, new THREE.Vector3(0, 1.0, 0), accentMat);

    // 3–4. Extended Solar Array Wings
    const wingLGeo = new THREE.BoxGeometry(1.6, 0.04, 0.8);
    const wingL = new THREE.Mesh(wingLGeo, accentMat);
    wingL.position.set(-1.4, 1.3, 0);
    registerPart(wingL, new THREE.Vector3(-1.4, 0, 0), accentMat);

    const wingR = wingL.clone();
    wingR.position.set(1.4, 1.3, 0);
    registerPart(wingR, new THREE.Vector3(1.4, 0, 0), accentMat);

    return { group, parts, name: 'Astra-9 Orbital Relay', category: 'Deep Space Telemetry Satellite' };
  }

  // Default: Procedural Obsidian Monolith / Crystal Beacon
  const obeliskGeo = new THREE.CylinderGeometry(0.4, 0.75, 2.2, 6);
  const obelisk = new THREE.Mesh(obeliskGeo, mainMat);
  obelisk.position.set(0, 1.3, 0);
  registerPart(obelisk, new THREE.Vector3(0, 0, 0), mainMat);

  const crownGeo = new THREE.OctahedronGeometry(0.35);
  const crown = new THREE.Mesh(crownGeo, accentMat);
  crown.position.set(0, 2.7, 0);
  registerPart(crown, new THREE.Vector3(0, 1.2, 0), accentMat);

  // Floating concentric energy rings
  const ringGeo = new THREE.TorusGeometry(0.85, 0.03, 12, 36);
  const ring1 = new THREE.Mesh(ringGeo, accentMat);
  ring1.position.set(0, 1.3, 0);
  ring1.rotation.x = Math.PI / 3;
  registerPart(ring1, new THREE.Vector3(0, 0.5, 0.5), accentMat);

  return { group, parts, name: 'Chrono-Core Monolith', category: 'Spatial Resonance Spire' };
}

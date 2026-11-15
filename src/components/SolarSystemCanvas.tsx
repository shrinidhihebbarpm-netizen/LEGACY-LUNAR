import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  DEEP_SPACE_PROBES,
  SOLAR_BODIES,
  advanceSimTime,
  computeBodyPosition3D,
  computeSpacecraftPosition,
  computeSpacecraftTrajectoryPoints,
  type LightingMode,
  type SolarBodyId,
  type SolarTargetId,
} from '../utils/solarSystemSim';
import {
  createProceduralPlanetTexture,
  createSaturnRingTexture,
  detectSoftwareGl,
} from '../utils/proceduralModels';

export interface SolarSystemLayers {
  labels: boolean;
  orbits: boolean;
  spacecraft: boolean;
  asteroidBelt: boolean;
}

interface SolarSystemCanvasProps {
  selectedTargetId: SolarTargetId;
  onSelectTarget: (id: SolarTargetId) => void;
  simTimeMs: number;
  rateSecondsPerSec: number;
  paused: boolean;
  lightingMode: LightingMode;
  layers: SolarSystemLayers;
  zoomDeltaSignal: { seq: number; factor: number };
  resetViewSignal: number;
  onSimTimeTick: (newMs: number) => void;
}

const CORONA_VERTEX_SHADER = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vViewPos;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
    vViewPos = -mvPos.xyz;
    gl_Position = projectionMatrix * mvPos;
  }
`;

const CORONA_FRAGMENT_SHADER = /* glsl */ `
  uniform vec3 uColor;
  uniform float uIntensity;
  varying vec3 vNormal;
  varying vec3 vViewPos;
  void main() {
    vec3 N = normalize(vNormal);
    vec3 V = normalize(vViewPos);
    float rim = pow(clamp(1.0 - abs(dot(N, V)), 0.0, 1.0), 2.4);
    gl_FragColor = vec4(uColor * (0.65 + rim * 0.9), rim * uIntensity);
  }
`;

function buildRingWithRadialUVs(innerR: number, outerR: number, segments = 96): THREE.RingGeometry {
  const geo = new THREE.RingGeometry(innerR, outerR, segments, 1);
  const pos = geo.attributes.position;
  const uv = geo.attributes.uv;
  const v3 = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v3.fromBufferAttribute(pos, i);
    const radius = v3.length();
    const u = (radius - innerR) / Math.max(0.001, outerR - innerR);
    uv.setXY(i, Math.max(0, Math.min(1, u)), 0.5);
  }
  uv.needsUpdate = true;
  return geo;
}

function buildOrbitEllipsePoints(
  a: number,
  eccentricity: number,
  inclinationDeg: number,
  segments = 160
): THREE.Vector3[] {
  const b = a * Math.sqrt(Math.max(0.1, 1 - eccentricity * eccentricity));
  const incRad = (inclinationDeg * Math.PI) / 180;
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i < segments; i++) {
    const theta = (i / segments) * Math.PI * 2;
    const x = Math.cos(theta) * a;
    const rawZ = Math.sin(theta) * b;
    const y = Math.sin(theta) * a * Math.sin(incRad);
    const z = rawZ * Math.cos(incRad);
    pts.push(new THREE.Vector3(x, y, z));
  }
  return pts;
}

export const SolarSystemCanvas: React.FC<SolarSystemCanvasProps> = ({
  selectedTargetId,
  onSelectTarget,
  simTimeMs,
  rateSecondsPerSec,
  paused,
  lightingMode,
  layers,
  zoomDeltaSignal,
  resetViewSignal,
  onSimTimeTick,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const labelRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  // Live prop refs so the WebGL loop reads zero stale closures without context rebuild
  const selectedTargetRef = useRef<SolarTargetId>(selectedTargetId);
  const onSelectRef = useRef(onSelectTarget);
  const simTimeRef = useRef<number>(simTimeMs);
  const rateRef = useRef<number>(rateSecondsPerSec);
  const pausedRef = useRef<boolean>(paused);
  const lightingRef = useRef<LightingMode>(lightingMode);
  const layersRef = useRef<SolarSystemLayers>(layers);
  const onSimTimeTickRef = useRef(onSimTimeTick);
  const flyTransitionRef = useRef<{ active: boolean; progress: number }>({ active: true, progress: 0 });
  const zoomQueueRef = useRef<number>(1);
  const cameraObjRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsObjRef = useRef<OrbitControls | null>(null);

  useEffect(() => {
    selectedTargetRef.current = selectedTargetId;
    flyTransitionRef.current = { active: true, progress: 0 };
  }, [selectedTargetId]);

  useEffect(() => {
    onSelectRef.current = onSelectTarget;
  }, [onSelectTarget]);

  useEffect(() => {
    // Only snap internal sim clock if external prop jumps significantly (e.g. clicking LIVE button)
    if (Math.abs(simTimeMs - simTimeRef.current) > 2500) {
      simTimeRef.current = simTimeMs;
    }
  }, [simTimeMs]);

  useEffect(() => {
    rateRef.current = rateSecondsPerSec;
  }, [rateSecondsPerSec]);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    lightingRef.current = lightingMode;
  }, [lightingMode]);

  useEffect(() => {
    layersRef.current = layers;
  }, [layers]);

  useEffect(() => {
    onSimTimeTickRef.current = onSimTimeTick;
  }, [onSimTimeTick]);

  useEffect(() => {
    if (zoomDeltaSignal.seq > 0) {
      zoomQueueRef.current *= zoomDeltaSignal.factor;
    }
  }, [zoomDeltaSignal]);

  useEffect(() => {
    if (resetViewSignal > 0) {
      flyTransitionRef.current = { active: true, progress: 0 };
    }
  }, [resetViewSignal]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = detectSoftwareGl();
    const width = container.clientWidth || 1280;
    const height = container.clientHeight || 720;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 900);
    camera.position.set(16, 68, 138);
    cameraObjRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envTex = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    pmremGenerator.dispose();

    // Lighting rig switched cleanly by lightingMode (natural / shadow / flood)
    const ambientLight = new THREE.AmbientLight(0xdbeafe, 0.35);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xc6d4f9, 0x18181b, 0.4);
    scene.add(hemiLight);

    const sunPointLight = new THREE.PointLight(0xfff7e6, 4.2, 420, 0.32);
    sunPointLight.position.set(0, 0, 0);
    scene.add(sunPointLight);

    const floodDirLight = new THREE.DirectionalLight(0xffffff, 0.45);
    floodDirLight.position.set(45, 70, 55);
    scene.add(floodDirLight);

    // Track disposable textures/geometries/materials
    const disposables: Array<{ dispose: () => void }> = [envTex];
    const texLoader = new THREE.TextureLoader();

    // 1. Deep Black Starfield + Galactic Plane Band (InstancedMesh)
    const starCount = 1350;
    const starGeo = new THREE.SphereGeometry(0.16, 5, 5);
    const starMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const starField = new THREE.InstancedMesh(starGeo, starMat, starCount);
    const starDummy = new THREE.Object3D();
    const starCol = new THREE.Color();

    for (let i = 0; i < starCount; i++) {
      const r = 185 + ((i * 53) % 165);
      const theta = i * 2.3999632; // Golden angle
      const isBand = i % 3 !== 0;
      const phi = isBand
        ? Math.PI / 2 + (((i * 29) % 100) / 100 - 0.5) * 0.48
        : Math.acos(2 * (((i * 31) % 100) / 100) - 1);

      starDummy.position.set(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.cos(phi),
        r * Math.sin(phi) * Math.sin(theta)
      );
      const scale = 0.45 + ((i % 7) * 0.19);
      starDummy.scale.set(scale, scale, scale);
      starDummy.updateMatrix();
      starField.setMatrixAt(i, starDummy.matrix);

      starCol.setHex(i % 6 === 0 ? 0xc6d4f9 : i % 11 === 0 ? 0xf7f4df : 0xeaeaeb);
      starField.setColorAt(i, starCol);
    }
    starField.instanceMatrix.needsUpdate = true;
    if (starField.instanceColor) starField.instanceColor.needsUpdate = true;
    starField.computeBoundingSphere();
    scene.add(starField);
    disposables.push(starGeo, starMat);

    // 2. Asteroid Belt between Mars (25.0) and Jupiter (39.5)
    const beltCount = 420;
    const beltGeo = new THREE.DodecahedronGeometry(0.16, 0);
    const beltMat = new THREE.MeshStandardMaterial({
      color: 0x95959d,
      roughness: 0.92,
      metalness: 0.1,
    });
    const beltMesh = new THREE.InstancedMesh(beltGeo, beltMat, beltCount);
    const beltDummy = new THREE.Object3D();

    for (let i = 0; i < beltCount; i++) {
      const angle = (i / beltCount) * Math.PI * 2 + (i % 7) * 0.13;
      const r = 29.6 + ((i * 37) % 42) * 0.1;
      const y = (((i * 19) % 100) / 100 - 0.5) * 1.4;
      beltDummy.position.set(Math.cos(angle) * r, y, Math.sin(angle) * r);
      beltDummy.rotation.set(i * 0.4, i * 0.7, i * 0.2);
      const s = 0.5 + (i % 5) * 0.26;
      beltDummy.scale.set(s * 1.2, s * 0.75, s);
      beltDummy.updateMatrix();
      beltMesh.setMatrixAt(i, beltDummy.matrix);
    }
    beltMesh.instanceMatrix.needsUpdate = true;
    beltMesh.computeBoundingSphere();
    scene.add(beltMesh);
    disposables.push(beltGeo, beltMat);

    // 3. Solar System Bodies (Sun + 8 Planets + Earth's Moon)
    const interactables: THREE.Mesh[] = [];
    const bodyNodes = new Map<
      SolarBodyId,
      {
        group: THREE.Group;
        spinMesh: THREE.Mesh;
        hitMesh: THREE.Mesh;
        selectionHalo: THREE.Mesh;
        orbitLine?: THREE.LineLoop;
        orbitMat?: THREE.LineBasicMaterial;
        spec: (typeof SOLAR_BODIES)[number];
      }
    >();

    const sphereGeoShared = new THREE.SphereGeometry(1, 44, 36);
    disposables.push(sphereGeoShared);

    SOLAR_BODIES.forEach((spec) => {
      const group = new THREE.Group();
      const tiltGroup = new THREE.Group();
      tiltGroup.rotation.z = (spec.axialTiltDeg * Math.PI) / 180;
      group.add(tiltGroup);

      let planetMat: THREE.Material;
      if (spec.id === 'sun') {
        const sunTex = createProceduralPlanetTexture('sun', renderer);
        disposables.push(sunTex);
        planetMat = new THREE.MeshBasicMaterial({
          color: 0xffffff,
          map: sunTex,
        });
      } else {
        let mapTex: THREE.Texture | null = null;
        if (spec.textureUrl) {
          mapTex = texLoader.load(spec.textureUrl, (loaded) => {
            loaded.colorSpace = THREE.SRGBColorSpace;
            loaded.anisotropy = renderer.capabilities.getMaxAnisotropy();
            loaded.needsUpdate = true;
          });
          mapTex.colorSpace = THREE.SRGBColorSpace;
          disposables.push(mapTex);
        } else if (spec.proceduralTextureKind) {
          mapTex = createProceduralPlanetTexture(spec.proceduralTextureKind, renderer);
          disposables.push(mapTex);
        }

        planetMat = new THREE.MeshStandardMaterial({
          color: mapTex ? 0xffffff : spec.orbitColorHex,
          map: mapTex,
          roughness: spec.id === 'jupiter' || spec.id === 'saturn' ? 0.68 : 0.78,
          metalness: 0.06,
        });
      }
      disposables.push(planetMat);

      const spinMesh = new THREE.Mesh(sphereGeoShared, planetMat);
      spinMesh.scale.setScalar(spec.radiusUnits);
      tiltGroup.add(spinMesh);

      // Solar Corona Radial Glow Sprite (zero hard sphere edge) or Atmospheric Fresnel Halo
      if (spec.id === 'sun') {
        const glowCanvas = document.createElement('canvas');
        glowCanvas.width = 256;
        glowCanvas.height = 256;
        const gctx = glowCanvas.getContext('2d')!;
        const grad = gctx.createRadialGradient(128, 128, 22, 128, 128, 128);
        grad.addColorStop(0, 'rgba(255, 250, 225, 0.95)');
        grad.addColorStop(0.28, 'rgba(247, 232, 170, 0.55)');
        grad.addColorStop(0.6, 'rgba(245, 190, 95, 0.16)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        gctx.fillStyle = grad;
        gctx.fillRect(0, 0, 256, 256);

        const glowTex = new THREE.CanvasTexture(glowCanvas);
        glowTex.colorSpace = THREE.SRGBColorSpace;
        const spriteMat = new THREE.SpriteMaterial({
          map: glowTex,
          transparent: true,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });
        const coronaSprite = new THREE.Sprite(spriteMat);
        coronaSprite.scale.set(spec.radiusUnits * 3.8, spec.radiusUnits * 3.8, 1);
        group.add(coronaSprite);
        disposables.push(glowTex, spriteMat);
      } else if (spec.atmosphereHex) {
        const atmoMat = new THREE.ShaderMaterial({
          uniforms: {
            uColor: { value: new THREE.Color(spec.atmosphereHex) },
            uIntensity: { value: 0.36 },
          },
          vertexShader: CORONA_VERTEX_SHADER,
          fragmentShader: CORONA_FRAGMENT_SHADER,
          transparent: true,
          blending: THREE.AdditiveBlending,
          side: THREE.BackSide,
          depthWrite: false,
        });
        const atmoMesh = new THREE.Mesh(sphereGeoShared, atmoMat);
        atmoMesh.scale.setScalar(spec.radiusUnits * 1.07);
        group.add(atmoMesh);
        disposables.push(atmoMat);
      }

      // Planetary Ring Systems (Saturn multi-band Cassini rings + Uranus faint ring)
      if (spec.hasRings === 'saturn') {
        const ringGeo = buildRingWithRadialUVs(spec.radiusUnits * 1.28, spec.radiusUnits * 2.38, 96);
        const ringTex = createSaturnRingTexture(renderer);
        const ringMat = new THREE.MeshStandardMaterial({
          map: ringTex,
          transparent: true,
          side: THREE.DoubleSide,
          roughness: 0.65,
          metalness: 0.05,
          depthWrite: false,
        });
        const satRing = new THREE.Mesh(ringGeo, ringMat);
        satRing.rotation.x = Math.PI / 2;
        tiltGroup.add(satRing);
        disposables.push(ringGeo, ringTex, ringMat);
      } else if (spec.hasRings === 'uranus') {
        const uRingGeo = new THREE.RingGeometry(spec.radiusUnits * 1.48, spec.radiusUnits * 1.66, 64);
        const uRingMat = new THREE.MeshBasicMaterial({
          color: 0x99e6f0,
          transparent: true,
          opacity: 0.28,
          side: THREE.DoubleSide,
          depthWrite: false,
        });
        const uRing = new THREE.Mesh(uRingGeo, uRingMat);
        uRing.rotation.x = Math.PI / 2;
        tiltGroup.add(uRing);
        disposables.push(uRingGeo, uRingMat);
      }

      // Selection reticle ring (hairline reticle clear of planetary rings)
      const haloInner = spec.hasRings ? spec.radiusUnits * 2.52 : spec.radiusUnits * 1.38;
      const haloWidth = Math.max(0.032, spec.radiusUnits * 0.036);
      const haloGeo = new THREE.RingGeometry(haloInner, haloInner + haloWidth, 72);
      const haloMat = new THREE.MeshBasicMaterial({
        color: 0x47da84,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.58,
      });
      const selectionHalo = new THREE.Mesh(haloGeo, haloMat);
      selectionHalo.rotation.x = Math.PI / 2;
      selectionHalo.visible = false;
      group.add(selectionHalo);
      disposables.push(haloGeo, haloMat);

      // Generous invisible click target
      const hitGeo = new THREE.SphereGeometry(Math.max(spec.radiusUnits * 2.2, 2.2), 10, 10);
      const hitMat = new THREE.MeshBasicMaterial({ visible: false });
      const hitMesh = new THREE.Mesh(hitGeo, hitMat);
      hitMesh.userData.targetId = spec.id;
      group.add(hitMesh);
      interactables.push(hitMesh);
      disposables.push(hitGeo, hitMat);

      // Crisp 1px NASA Eyes colored elliptical orbit path
      let orbitLine: THREE.LineLoop | undefined;
      let orbitMat: THREE.LineBasicMaterial | undefined;
      if (spec.id !== 'sun') {
        const orbitPts = buildOrbitEllipsePoints(spec.orbitRadiusUnits, spec.eccentricity, spec.inclinationDeg, 180);
        const orbitGeo = new THREE.BufferGeometry().setFromPoints(orbitPts);
        orbitMat = new THREE.LineBasicMaterial({
          color: new THREE.Color(spec.orbitColorHex),
          transparent: true,
          opacity: spec.parentId ? 0.5 : 0.72,
        });
        orbitLine = new THREE.LineLoop(orbitGeo, orbitMat);
        scene.add(orbitLine);
        disposables.push(orbitGeo, orbitMat);
      }

      scene.add(group);
      bodyNodes.set(spec.id, {
        group,
        spinMesh,
        hitMesh,
        selectionHalo,
        orbitLine,
        orbitMat,
        spec,
      });
    });

    // 4. Deep-Space Spacecraft Trajectories & Markers (#cd9745 NASA Eyes --spacecraft gold)
    const probeNodes = new Map<
      string,
      {
        marker: THREE.Group;
        line: THREE.Line;
        lineMat: THREE.LineBasicMaterial;
        spec: (typeof DEEP_SPACE_PROBES)[number];
      }
    >();

    const probeOctGeo = new THREE.OctahedronGeometry(0.48, 0);
    const probeMat = new THREE.MeshBasicMaterial({ color: 0xcd9745 });
    const probeHitGeo = new THREE.SphereGeometry(3.2, 8, 8);
    const probeHitMat = new THREE.MeshBasicMaterial({ visible: false });
    disposables.push(probeOctGeo, probeMat, probeHitGeo, probeHitMat);

    DEEP_SPACE_PROBES.forEach((probe) => {
      const trajPts = computeSpacecraftTrajectoryPoints(probe, 48).map(
        ([x, y, z]) => new THREE.Vector3(x, y, z)
      );
      const trajGeo = new THREE.BufferGeometry().setFromPoints(trajPts);
      const lineMat = new THREE.LineBasicMaterial({
        color: 0xcd9745,
        transparent: true,
        opacity: 0.64,
      });
      const line = new THREE.Line(trajGeo, lineMat);
      scene.add(line);
      disposables.push(trajGeo, lineMat);

      const markerGroup = new THREE.Group();
      const beacon = new THREE.Mesh(probeOctGeo, probeMat);
      const hitProxy = new THREE.Mesh(probeHitGeo, probeHitMat);
      hitProxy.userData.targetId = probe.id;
      markerGroup.add(beacon, hitProxy);
      interactables.push(hitProxy);
      scene.add(markerGroup);

      probeNodes.set(probe.id, { marker: markerGroup, line, lineMat, spec: probe });
    });

    // 5. OrbitControls & Raycasting
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.minDistance = 2.6;
    controls.maxDistance = 230;
    controls.maxPolarAngle = Math.PI * 0.85;
    controlsObjRef.current = controls;

    let userDragging = false;
    controls.addEventListener('start', () => {
      userDragging = true;
      flyTransitionRef.current.active = false;
    });
    controls.addEventListener('end', () => {
      userDragging = false;
    });

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    let downPos = { x: 0, y: 0 };
    const handlePointerDown = (e: MouseEvent) => {
      downPos = { x: e.clientX, y: e.clientY };
    };

    const handlePointerClick = (e: MouseEvent) => {
      // Ignore drag-releases so panning doesn't trigger accidental clicks
      if (Math.hypot(e.clientX - downPos.x, e.clientY - downPos.y) > 6) return;
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(interactables, false);
      if (hits.length > 0) {
        const hitId = hits[0].object.userData.targetId as SolarTargetId | undefined;
        if (hitId) {
          onSelectRef.current(hitId);
        }
      }
    };

    let lastHoverTs = 0;
    const handlePointerMove = (e: MouseEvent) => {
      const now = performance.now();
      if (now - lastHoverTs < 55) return;
      lastHoverTs = now;
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(interactables, false);
      renderer.domElement.style.cursor = hits.length > 0 ? 'pointer' : 'grab';
    };

    renderer.domElement.addEventListener('mousedown', handlePointerDown);
    renderer.domElement.addEventListener('click', handlePointerClick);
    renderer.domElement.addEventListener('mousemove', handlePointerMove);

    // Helper vectors reused every frame (zero GC thrashing)
    const desiredTarget = new THREE.Vector3();
    const prevTrackedWorldPos = new THREE.Vector3();
    let prevTrackedId: SolarTargetId | null = null;
    const targetDelta = new THREE.Vector3();
    const desiredCamPos = new THREE.Vector3();
    const projVec = new THREE.Vector3();
    const clock = new THREE.Clock();
    let lastTickEmit = 0;
    let frameId = 0;

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (gl && typeof gl.fenceSync === 'function') {
        const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
        gl.flush();
        const poll = () => {
          const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
          if (state === gl.UNSIGNALED) {
            frameId = window.setTimeout(poll, 5);
          } else {
            if (sync) gl.deleteSync(sync);
            frameId = window.setTimeout(cb, 75);
          }
        };
        frameId = window.setTimeout(poll, 5);
      } else {
        frameId = window.setTimeout(cb, 75);
      }
    }

    const projectLabel = (id: string, worldPos: THREE.Vector3, yOffsetPx: number, visible: boolean) => {
      const el = labelRefs.current[id];
      if (!el) return;
      if (!visible) {
        el.style.opacity = '0';
        el.style.pointerEvents = 'none';
        return;
      }
      projVec.copy(worldPos).project(camera);
      // Behind camera check
      if (projVec.z > 1 || projVec.z < -1) {
        el.style.opacity = '0';
        el.style.pointerEvents = 'none';
        return;
      }
      const w = container.clientWidth || 1280;
      const h = container.clientHeight || 720;
      const sx = (projVec.x * 0.5 + 0.5) * w;
      const sy = (-projVec.y * 0.5 + 0.5) * h + yOffsetPx;
      if (sx < 24 || sx > w - 24 || sy < 48 || sy > h - 78) {
        el.style.opacity = '0';
        el.style.pointerEvents = 'none';
        return;
      }
      el.style.transform = `translate3d(${sx.toFixed(1)}px, ${sy.toFixed(1)}px, 0) translate(-50%, -100%)`;
      el.style.opacity = '1';
      el.style.pointerEvents = 'auto';
    };

    function tick() {
      const dt = Math.min(clock.getDelta(), 0.1);
      simTimeRef.current = advanceSimTime(
        simTimeRef.current,
        dt,
        rateRef.current,
        pausedRef.current
      );

      // Throttled simulation clock callback (~8Hz) for HUD readout
      const nowPerf = performance.now();
      if (nowPerf - lastTickEmit > 125) {
        lastTickEmit = nowPerf;
        onSimTimeTickRef.current(simTimeRef.current);
      }

      // Apply Lighting Mode
      const lMode = lightingRef.current;
      if (lMode === 'natural') {
        sunPointLight.intensity = 4.2;
        ambientLight.intensity = 0.32;
        hemiLight.intensity = 0.36;
        floodDirLight.intensity = 0.35;
      } else if (lMode === 'shadow') {
        sunPointLight.intensity = 4.8;
        ambientLight.intensity = 0.06;
        hemiLight.intensity = 0.08;
        floodDirLight.intensity = 0.05;
      } else {
        // flood mode
        sunPointLight.intensity = 2.6;
        ambientLight.intensity = 1.65;
        hemiLight.intensity = 1.35;
        floodDirLight.intensity = 1.5;
      }

      const activeTarget = selectedTargetRef.current;
      const curLayers = layersRef.current;
      beltMesh.visible = curLayers.asteroidBelt;

      // Update Earth position first so Moon orbits Earth cleanly
      const earthSpec = SOLAR_BODIES.find((b) => b.id === 'earth')!;
      const earthCoords = computeBodyPosition3D(earthSpec, simTimeRef.current);

      let activeWorldPos: THREE.Vector3 | null = null;
      let activeFocusDist = 118;

      bodyNodes.forEach((node, id) => {
        const parentPos: [number, number, number] = node.spec.parentId === 'earth' ? earthCoords : [0, 0, 0];
        const [bx, by, bz] = computeBodyPosition3D(node.spec, simTimeRef.current, parentPos);
        node.group.position.set(bx, by, bz);

        if (node.orbitLine) {
          node.orbitLine.visible = curLayers.orbits;
          if (node.spec.parentId === 'earth') {
            node.orbitLine.position.set(earthCoords[0], earthCoords[1], earthCoords[2]);
          }
          if (node.orbitMat) {
            node.orbitMat.opacity = activeTarget === id ? 1.0 : node.spec.parentId ? 0.48 : 0.7;
          }
        }

        // Axial spin
        if (!pausedRef.current) {
          node.spinMesh.rotation.y += dt * node.spec.rotationSpeed;
        }

        const isSelected = activeTarget === id;
        node.selectionHalo.visible = isSelected;
        if (isSelected) {
          activeWorldPos = node.group.position;
          activeFocusDist = Math.max(node.spec.radiusUnits * 4.4, 3.8);
        }

        // Hide Moon label unless zoomed reasonably close to Earth/Moon to keep overview uncluttered
        const camToEarth = camera.position.distanceTo(
          bodyNodes.get('earth')?.group.position || new THREE.Vector3()
        );
        const showLabel =
          curLayers.labels &&
          (id !== 'moon' || activeTarget === 'moon' || activeTarget === 'earth' || camToEarth < 24);
        projectLabel(id, node.group.position, id === 'sun' ? -26 : -12, showLabel);
      });

      // Update Deep-Space Probes & Trajectories
      probeNodes.forEach((pNode, id) => {
        pNode.line.visible = curLayers.spacecraft;
        pNode.marker.visible = curLayers.spacecraft;
        const [px, py, pz] = computeSpacecraftPosition(pNode.spec, simTimeRef.current);
        pNode.marker.position.set(px, py, pz);
        pNode.marker.rotation.y += dt * 0.7;
        pNode.lineMat.opacity = activeTarget === id || activeTarget === 'deep-space' ? 0.96 : 0.55;

        if (activeTarget === id) {
          activeWorldPos = pNode.marker.position;
          activeFocusDist = 26;
        }

        projectLabel(id, pNode.marker.position, -10, curLayers.labels && curLayers.spacecraft);
      });

      // Deep Space aggregate focus if user clicks "deep-space" destination pill
      if (activeTarget === 'deep-space') {
        const v1 = probeNodes.get('voyager-1');
        if (v1) {
          activeWorldPos = v1.marker.position;
          activeFocusDist = 42;
        }
      }

      // Smooth Camera Tracking & Overview Fly-To
      if (activeTarget === 'overview') {
        prevTrackedId = 'overview';
        if (flyTransitionRef.current.active && !userDragging) {
          const dampAlpha = isSoftwareGl ? 0.35 : 1 - Math.exp(-3.4 * dt);
          desiredTarget.set(-8, 0, 2);
          desiredCamPos.set(16, 68, 138);
          controls.target.lerp(desiredTarget, dampAlpha);
          camera.position.lerp(desiredCamPos, dampAlpha);
          if (camera.position.distanceTo(desiredCamPos) < 0.35) {
            flyTransitionRef.current.active = false;
          }
        }
      } else if (activeWorldPos) {
        if (prevTrackedId === activeTarget) {
          targetDelta.subVectors(activeWorldPos, prevTrackedWorldPos);
          controls.target.add(targetDelta);
          camera.position.add(targetDelta);
        }
        prevTrackedWorldPos.copy(activeWorldPos);
        prevTrackedId = activeTarget;

        if (flyTransitionRef.current.active && !userDragging) {
          const dampAlpha = isSoftwareGl ? 0.45 : 1 - Math.exp(-4.2 * dt);
          controls.target.lerp(activeWorldPos, dampAlpha);
          desiredCamPos.set(
            activeWorldPos.x + activeFocusDist * 0.72,
            activeWorldPos.y + activeFocusDist * 0.46,
            activeWorldPos.z + activeFocusDist * 0.88
          );
          camera.position.lerp(desiredCamPos, dampAlpha * 0.85);
          if (
            camera.position.distanceTo(desiredCamPos) < 0.25 &&
            controls.target.distanceTo(activeWorldPos) < 0.15
          ) {
            flyTransitionRef.current.active = false;
          }
        }
      }

      // Handle Zoom In / Zoom Out toolbar signals smoothly
      if (Math.abs(zoomQueueRef.current - 1) > 0.002) {
        const offset = camera.position.clone().sub(controls.target);
        const targetDist = THREE.MathUtils.clamp(
          offset.length() * zoomQueueRef.current,
          controls.minDistance,
          controls.maxDistance
        );
        offset.setLength(targetDist);
        camera.position.copy(controls.target).add(offset);
        zoomQueueRef.current = 1;
      }

      controls.update();
      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }
    tick();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 1280;
      const h = container.clientHeight || 720;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('mousedown', handlePointerDown);
      renderer.domElement.removeEventListener('click', handlePointerClick);
      renderer.domElement.removeEventListener('mousemove', handlePointerMove);
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      controls.dispose();
      disposables.forEach((d) => d.dispose());
      renderer.dispose();
    };
  }, []);

  return (
    <div className="relative w-full h-full bg-[#000000] overflow-hidden select-none">
      <div
        ref={mountRef}
        data-testid="solar-system-canvas"
        aria-label="Interactive 3D NASA Eyes Solar System Simulation"
        className="w-full h-full"
      />

      {/* 3D Screen-Space Projected Labels matching eyes.nasa.gov/apps/solar-system */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden z-10">
        {SOLAR_BODIES.map((body) => {
          const isActive = selectedTargetId === body.id;
          return (
            <button
              key={body.id}
              ref={(el) => {
                labelRefs.current[body.id] = el;
              }}
              type="button"
              onClick={() => onSelectTarget(body.id)}
              aria-label={`Focus ${body.name} in 3D Solar System`}
              className="nasa-eyes-label flex items-center gap-1.5 group"
            >
              <span
                className="inline-block w-2 h-2 rounded-full shrink-0 transition-transform group-hover:scale-125"
                style={{
                  backgroundColor: body.orbitColorHex,
                  boxShadow: isActive ? `0 0 8px ${body.orbitColorHex}` : 'none',
                }}
              />
              <span
                className={`nasa-eyes-label-planet ${
                  isActive ? 'text-[#ffffff] font-semibold' : 'text-[#eaeaeb]/90 group-hover:text-[#ffffff]'
                }`}
              >
                {body.name}
              </span>
            </button>
          );
        })}

        {DEEP_SPACE_PROBES.map((probe) => {
          const isActive = selectedTargetId === probe.id;
          return (
            <button
              key={probe.id}
              ref={(el) => {
                labelRefs.current[probe.id] = el;
              }}
              type="button"
              onClick={() => onSelectTarget(probe.id)}
              aria-label={`Focus ${probe.name} spacecraft trajectory`}
              className="nasa-eyes-label flex items-center gap-1.5 group"
            >
              <span
                className="inline-block w-2 h-2 rotate-45 shrink-0 transition-transform group-hover:scale-125"
                style={{
                  backgroundColor: probe.colorHex,
                  boxShadow: isActive ? `0 0 8px ${probe.colorHex}` : 'none',
                }}
              />
              <span
                className={`nasa-eyes-label-probe ${
                  isActive ? 'text-[#ffffff] font-semibold' : 'text-[#c6c6c9] group-hover:text-[#ffffff]'
                }`}
              >
                {probe.shortLabel}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

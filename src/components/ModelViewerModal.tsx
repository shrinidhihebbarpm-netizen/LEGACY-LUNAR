import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import {
  X,
  RotateCcw,
  ExternalLink,
  Box,
  ZoomIn,
  ZoomOut,
  Layers,
  Play,
  Pause,
  AlertTriangle,
} from 'lucide-react';
import { NASA_3D_MODELS, OFFICIAL_CATALOG_LINKS, type Nasa3DModelEntry } from '../data/spaceData';
import { buildProceduralArtifactGroup, detectSoftwareGl } from '../utils/proceduralModels';

interface ModelViewerModalProps {
  isOpen: boolean;
  initialModelId?: string;
  onClose: () => void;
}

function disposeObject3D(root: THREE.Object3D) {
  root.traverse((obj) => {
    if ((obj as THREE.Mesh).isMesh) {
      const mesh = obj as THREE.Mesh;
      mesh.geometry?.dispose();
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      mats.forEach((mat) => {
        if (!mat) return;
        const std = mat as unknown as Record<string, unknown>;
        for (const key of [
          'map',
          'normalMap',
          'roughnessMap',
          'metalnessMap',
          'emissiveMap',
          'aoMap',
          'alphaMap',
          'bumpMap',
          'specularColorMap',
          'specularIntensityMap',
        ]) {
          const tex = std[key];
          if (tex && typeof (tex as THREE.Texture).dispose === 'function') {
            (tex as THREE.Texture).dispose();
          }
        }
        mat.dispose();
      });
    }
  });
}

export const ModelViewerModal: React.FC<ModelViewerModalProps> = ({
  isOpen,
  initialModelId,
  onClose,
}) => {
  const isComingSoonInitial = Boolean(initialModelId?.startsWith('coming-soon:'));
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [comingSoonName, setComingSoonName] = useState<string | null>(() =>
    isComingSoonInitial ? initialModelId!.slice('coming-soon:'.length) : null
  );
  const [activeModel, setActiveModel] = useState<Nasa3DModelEntry>(
    () => NASA_3D_MODELS.find((m) => m.id === initialModelId) || NASA_3D_MODELS[0]
  );
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [reloadSeq, setReloadSeq] = useState<number>(0);
  const [loadStatus, setLoadStatus] = useState<{
    state: 'idle' | 'loading' | 'loaded' | 'procedural' | 'error';
    progress: number;
    message?: string;
  }>({ state: 'idle', progress: 0 });

  const viewportRef = useRef<HTMLDivElement | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const requestRenderRef = useRef<(() => void) | null>(null);
  const autoRotateRef = useRef<boolean>(autoRotate);

  useEffect(() => {
    autoRotateRef.current = autoRotate;
  }, [autoRotate]);

  useEffect(() => {
    if (!isOpen) return;
    if (initialModelId?.startsWith('coming-soon:')) {
      setComingSoonName(initialModelId.slice('coming-soon:'.length));
      return;
    }
    setComingSoonName(null);
    if (initialModelId) {
      const found = NASA_3D_MODELS.find((m) => m.id === initialModelId);
      if (found) {
        setActiveModel(found);
        setSelectedCategory((prev) => (prev === 'All' || prev === found.category ? prev : 'All'));
      }
    }
  }, [isOpen, initialModelId]);

  useEffect(() => {
    if (!isOpen || comingSoonName) return;
    const container = viewportRef.current;
    if (!container) return;

    let cancelled = false;
    const isSoftwareGl = detectSoftwareGl();
    const width = container.clientWidth || 640;
    const height = container.clientHeight || 420;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(3.8, 2.05, 4.5);
    cameraRef.current = camera;

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

    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    pmrem.dispose();

    const keyLight = new THREE.DirectionalLight(0xfffbeb, 1.75);
    keyLight.position.set(5, 7, 5);
    scene.add(keyLight);

    const fillLight = new THREE.HemisphereLight(0xc6d4f9, 0x1e2028, 0.78);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xeaeaeb, 0.95);
    rimLight.position.set(-5, 3, -5);
    scene.add(rimLight);

    const gridHelper = new THREE.PolarGridHelper(2.8, 12, 6, 48, 0x252527, 0x18181b);
    gridHelper.position.y = -1.25;
    scene.add(gridHelper);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.minDistance = 1.6;
    controls.maxDistance = 12.0;
    controlsRef.current = controls;

    let frameId = 0;
    let renderBusy = false;
    let renderDirty = false;
    let userDragging = false;
    let activeObjectRoot: THREE.Object3D | null = null;
    let dracoLoader: DRACOLoader | null = null;
    let pendingRenderCallbacks: Array<() => void> = [];
    const clock = new THREE.Clock();

    function afterDraw(cb: () => void, delayMs = 95) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (gl && typeof gl.fenceSync === 'function') {
        const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
        gl.flush();
        const poll = () => {
          if (cancelled) return;
          const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
          if (state === gl.UNSIGNALED) {
            frameId = window.setTimeout(poll, 5);
          } else {
            if (sync) gl.deleteSync(sync);
            frameId = window.setTimeout(cb, delayMs);
          }
        };
        frameId = window.setTimeout(poll, 5);
      } else {
        frameId = window.setTimeout(cb, delayMs);
      }
    }

    function requestRender(onAfterFirstFrame?: () => void) {
      if (cancelled) return;
      if (onAfterFirstFrame) {
        pendingRenderCallbacks.push(onAfterFirstFrame);
      }
      if (renderBusy) {
        renderDirty = true;
        return;
      }
      renderBusy = true;
      frameId = requestAnimationFrame(() => {
        if (cancelled) return;
        renderDirty = false;
        const dt = Math.min(clock.getDelta(), 0.12);
        if (activeObjectRoot && autoRotateRef.current && !userDragging) {
          activeObjectRoot.rotation.y += dt * 0.34;
        }
        controls.update();
        renderer.render(scene, camera);
        const callbacks = pendingRenderCallbacks;
        pendingRenderCallbacks = [];
        const done = () => {
          renderBusy = false;
          callbacks.forEach((cb) => cb());
          if (!cancelled && (renderDirty || (activeObjectRoot && autoRotateRef.current))) {
            requestRender();
          }
        };
        if (isSoftwareGl) afterDraw(done, 110);
        else done();
      });
    }

    const handleControlsStart = () => {
      userDragging = true;
    };
    const handleControlsEnd = () => {
      userDragging = false;
      requestRender();
    };
    const handleControlsChange = () => requestRender();
    requestRenderRef.current = () => requestRender();
    controls.addEventListener('start', handleControlsStart);
    controls.addEventListener('end', handleControlsEnd);
    controls.addEventListener('change', handleControlsChange);

    const mountProceduralFallback = (statusState: 'procedural' | 'error', msg?: string) => {
      if (cancelled || !activeModel.proceduralArchetype) return;
      if (activeObjectRoot) {
        scene.remove(activeObjectRoot);
        disposeObject3D(activeObjectRoot);
      }
      const group = buildProceduralArtifactGroup(activeModel.proceduralArchetype, renderer);
      activeObjectRoot = group;
      gridHelper.position.y = -1.15;
      scene.add(group);
      requestRender(() => {
        if (!cancelled) {
          setLoadStatus({ state: statusState, progress: 100, message: msg });
        }
      });
    };

    if (activeModel.glbUrl) {
      setLoadStatus({ state: 'loading', progress: 0 });

      dracoLoader = new DRACOLoader();
      dracoLoader.setDecoderPath('/draco/gltf/');
      dracoLoader.preload();

      const gltfLoader = new GLTFLoader();
      gltfLoader.setDRACOLoader(dracoLoader);

      gltfLoader.load(
        activeModel.glbUrl,
        (gltf) => {
          if (cancelled) {
            disposeObject3D(gltf.scene);
            return;
          }

          const pivot = new THREE.Group();
          const root = gltf.scene;
          const orientedGroup = new THREE.Group();
          if (activeModel.id === 'apollo-lrv-3d') {
            // Uploaded rover mesh uses +Z as vertical up-axis; convert cleanly to Three.js +Y-up
            root.rotation.x = -Math.PI / 2;
          }
          orientedGroup.add(root);
          orientedGroup.updateMatrixWorld(true);

          const box = new THREE.Box3().setFromObject(orientedGroup);
          const size = new THREE.Vector3();
          const center = new THREE.Vector3();
          box.getSize(size);
          box.getCenter(center);

          const maxDim = Math.max(size.x, size.y, size.z) || 1;
          const targetSpan = activeModel.id === 'saturn-3d' ? 3.2 : 2.65;
          const scale = targetSpan / maxDim;

          orientedGroup.scale.setScalar(scale);
          orientedGroup.position.set(-center.x * scale, -center.y * scale, -center.z * scale);

          renderer.toneMappingExposure = activeModel.id === 'saturn-3d' ? 0.92 : 1.05;

          orientedGroup.traverse((obj) => {
            if ((obj as THREE.Mesh).isMesh) {
              const mesh = obj as THREE.Mesh;
              mesh.castShadow = !isSoftwareGl;
              mesh.receiveShadow = !isSoftwareGl;
              const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
              mats.forEach((m) => {
                if (!m) return;
                if (/ring/i.test(mesh.name) || /ring/i.test(m.name) || m.transparent) {
                  m.side = THREE.DoubleSide;
                  if (m.transparent) {
                    m.depthWrite = false;
                    m.alphaTest = 0.02;
                  }
                }
                if ('envMapIntensity' in m) {
                  (m as THREE.MeshStandardMaterial).envMapIntensity =
                    activeModel.id === 'saturn-3d'
                      ? 0.42
                      : activeModel.id === 'moon-3d'
                        ? 0.35
                        : 0.78;
                }
                m.needsUpdate = true;
              });
            }
          });

          pivot.add(orientedGroup);
          if (activeModel.id === 'saturn-3d') {
            pivot.rotation.z = 0.16;
            pivot.rotation.x = 0.18;
          }

          const halfHeight = Math.min(1.65, Math.max(0.8, size.y * scale * 0.5 + 0.16));
          gridHelper.position.y = -halfHeight;

          activeObjectRoot = pivot;
          scene.add(pivot);
          requestRender(() => {
            if (!cancelled) {
              setLoadStatus({ state: 'loaded', progress: 100 });
            }
          });
        },
        (xhr) => {
          if (cancelled) return;
          if (xhr.lengthComputable && xhr.total > 0) {
            const pct = Math.min(99, Math.round((xhr.loaded / xhr.total) * 100));
            setLoadStatus({ state: 'loading', progress: pct });
          }
        },
        (err) => {
          console.error(`Failed to load GLB model (${activeModel.glbUrl}):`, err);
          if (!cancelled) {
            setLoadStatus({
              state: 'error',
              progress: 0,
              message: 'Unable to load the 3D model file. Please retry.',
            });
          }
        }
      );
    } else if (activeModel.proceduralArchetype) {
      mountProceduralFallback('procedural');
    } else {
      setLoadStatus({
        state: 'error',
        progress: 0,
        message: '3D model source is currently unavailable.',
      });
    }

    const handleResize = () => {
      if (!container || cancelled) return;
      const w = container.clientWidth || 640;
      const h = container.clientHeight || 420;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      requestRender();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelled = true;
      pendingRenderCallbacks = [];
      window.removeEventListener('resize', handleResize);
      controls.removeEventListener('start', handleControlsStart);
      controls.removeEventListener('end', handleControlsEnd);
      controls.removeEventListener('change', handleControlsChange);
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      if (activeObjectRoot) {
        scene.remove(activeObjectRoot);
        disposeObject3D(activeObjectRoot);
        activeObjectRoot = null;
      }
      envTex.dispose();
      dracoLoader?.dispose();
      controls.dispose();
      renderer.dispose();
    };
  }, [isOpen, activeModel, comingSoonName, reloadSeq]);

  if (!isOpen) return null;

  const glbCount = NASA_3D_MODELS.filter((m) => Boolean(m.glbUrl)).length;
  const categories = [
    'All',
    'Moon',
    'Mars',
    'Outer Planets & Probes',
    'Planets',
    'Moons',
    'Telescopes',
  ];
  const filteredModels =
    selectedCategory === 'All'
      ? NASA_3D_MODELS
      : NASA_3D_MODELS.filter((m) => m.category === selectedCategory);

  const handleResetView = () => {
    if (cameraRef.current && controlsRef.current) {
      cameraRef.current.position.set(3.8, 2.05, 4.5);
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
      requestRenderRef.current?.();
    }
  };

  const handleZoom = (factor: number) => {
    if (cameraRef.current && controlsRef.current) {
      cameraRef.current.position.multiplyScalar(factor);
      controlsRef.current.update();
      requestRenderRef.current?.();
    }
  };

  const handleToggleAutoRotate = () => {
    setAutoRotate((prev) => {
      const next = !prev;
      autoRotateRef.current = next;
      if (next) {
        requestRenderRef.current?.();
      }
      return next;
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="model-library-title"
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-2 sm:p-6 overflow-y-auto"
    >
      <div className="w-full max-w-6xl bg-[#1D1D20] border border-[#95959D]/30 rounded overflow-hidden flex flex-col max-h-[94vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3.5 sm:py-4 border-b border-[#95959D]/20 bg-[#000000]">
          <div className="flex items-center gap-3 min-w-0">
            <Box className="w-5 h-5 text-[#4ADE80] shrink-0" />
            <div className="min-w-0">
              <h2 id="model-library-title" className="text-base sm:text-lg font-medium text-[#FFFFFF] truncate">
                {comingSoonName
                  ? `${comingSoonName} — 3D Model Preview`
                  : activeModel.name}
              </h2>
              <p className="text-[11px] sm:text-xs text-[#C6C6C9] truncate">
                {glbCount} official NASA & observatory .GLB meshes + archival globes
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close 3D Model Library"
            className="p-2 text-[#C6C6C9] hover:text-[#FFFFFF] hover:bg-[#252527] rounded transition-colors shrink-0 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-1.5 px-4 sm:px-5 py-2.5 border-b border-[#95959D]/20 bg-[#1D1D20] overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#FFFFFF] text-[#000000] font-semibold'
                  : 'text-[#C6C6C9] hover:text-[#FFFFFF] hover:bg-[#252527]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Main Body */}
        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 min-h-0 overflow-y-auto lg:overflow-hidden">
          {/* Left Column: Model List */}
          <div className="lg:col-span-3 border-b lg:border-b-0 lg:border-r border-[#95959D]/20 overflow-y-auto max-h-36 sm:max-h-48 lg:max-h-none p-2.5 sm:p-3 space-y-1.5 bg-[#000000]">
            {filteredModels.map((model) => {
              const isSelected = !comingSoonName && model.id === activeModel.id;
              return (
                <button
                  key={model.id}
                  type="button"
                  onClick={() => {
                    setComingSoonName(null);
                    setActiveModel(model);
                  }}
                  className={`w-full text-left p-2.5 sm:p-3 rounded border transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#252527] border-[#FFFFFF] text-[#FFFFFF]'
                      : 'bg-transparent border-transparent hover:bg-[#1D1D20] text-[#C6C6C9]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-xs font-medium leading-snug">{model.name}</div>
                    {model.glbUrl && (
                      <span className="shrink-0 text-[9px] font-mono uppercase tracking-[0.08em] px-1.5 py-0.5 rounded bg-[#14532D]/50 text-[#4ADE80] border border-[#4ADE80]/30">
                        GLB
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] font-mono tracking-[0.12em] uppercase text-[#B5945B] mt-1">
                    {model.category} · {model.status}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Center Column: Interactive 3D Viewport */}
          <div className="lg:col-span-5 relative flex flex-col min-h-[290px] sm:min-h-[340px] lg:min-h-[440px] bg-[#000000]">
            {comingSoonName ? (
              <div
                data-testid="model-coming-soon"
                className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4 bg-[#000000]"
              >
                <Box className="w-10 h-10 text-[#B5945B]" />
                <div className="space-y-1.5 max-w-sm">
                  <div className="text-xs font-mono tracking-[0.16em] uppercase text-[#B5945B]">
                    3D ASSET STATUS
                  </div>
                  <h3 className="text-lg font-medium text-[#FFFFFF]">
                    {comingSoonName} — 3D model coming soon
                  </h3>
                  <p className="text-xs text-[#C6C6C9] leading-relaxed">
                    A dedicated high-resolution GLB mesh for {comingSoonName} is not yet included in this archive. Select any planet, probe, or space telescope on the left to inspect its 3D model now.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const saturn = NASA_3D_MODELS.find((m) => m.id === 'saturn-3d') || NASA_3D_MODELS[0];
                    setComingSoonName(null);
                    setActiveModel(saturn);
                  }}
                  className="px-4 py-2 text-xs font-semibold bg-[#FFFFFF] text-[#000000] hover:bg-[#EAEAEB] rounded transition-colors cursor-pointer"
                >
                  Open Saturn 3D Model
                </button>
              </div>
            ) : (
              <>
                <div
                  ref={viewportRef}
                  data-testid="model-library-viewport"
                  data-model-id={activeModel.id}
                  data-load-state={loadStatus.state}
                  className="flex-1 w-full h-full min-h-[290px] sm:min-h-[340px]"
                />

                {/* Top-left Model Format Badge */}
                <div className="absolute top-3 left-3 flex items-center gap-2 px-2.5 py-1 rounded bg-[#1D1D20]/90 border border-[#95959D]/25 text-[11px] font-mono text-[#EAEAEB]">
                  <Layers className="w-3.5 h-3.5 text-[#4ADE80]" />
                  <span>
                    {activeModel.glbUrl
                      ? activeModel.glbSizeLabel || 'Official GLB Mesh'
                      : 'Procedural 3D Reconstruction'}
                  </span>
                </div>

                {/* Loading Progress Overlay for GLB Streaming */}
                {loadStatus.state === 'loading' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/75 px-6 text-center pointer-events-none">
                    <div className="w-56 space-y-2">
                      <div className="text-xs font-mono tracking-[0.12em] uppercase text-[#EAEAEB]">
                        Loading 3D Model... {loadStatus.progress}%
                      </div>
                      <div className="w-full h-1.5 bg-[#252527] rounded overflow-hidden">
                        <div
                          className="h-full bg-[#4ADE80] transition-all duration-150"
                          style={{ width: `${Math.max(8, loadStatus.progress)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Load Error Overlay */}
                {loadStatus.state === 'error' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 px-6 text-center space-y-3">
                    <AlertTriangle className="w-8 h-8 text-[#F59E0B]" />
                    <div className="text-xs text-[#EAEAEB] max-w-xs">
                      {loadStatus.message || 'Unable to load this 3D model.'}
                    </div>
                    <button
                      type="button"
                      onClick={() => setReloadSeq((s) => s + 1)}
                      className="px-3.5 py-1.5 text-xs font-semibold bg-[#FFFFFF] text-[#000000] rounded cursor-pointer"
                    >
                      Retry Load
                    </button>
                  </div>
                )}

                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded bg-[#252527] border border-[#95959D]/30 text-xs text-[#EAEAEB] whitespace-nowrap max-w-[94%]">
                  <button
                    type="button"
                    onClick={() => handleZoom(0.85)}
                    aria-label="Zoom In 3D Model"
                    className="p-1 hover:text-[#4ADE80] transition-colors cursor-pointer"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleZoom(1.18)}
                    aria-label="Zoom Out 3D Model"
                    className="p-1 hover:text-[#4ADE80] transition-colors cursor-pointer"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <span className="text-[#95959D]/40">|</span>
                  <button
                    type="button"
                    onClick={handleToggleAutoRotate}
                    aria-label={autoRotate ? 'Pause 3D Model Rotation' : 'Resume 3D Model Rotation'}
                    className="flex items-center gap-1 px-1.5 py-0.5 hover:text-[#4ADE80] transition-colors whitespace-nowrap cursor-pointer"
                  >
                    {autoRotate ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    <span>{autoRotate ? 'Pause' : 'Spin'}</span>
                  </button>
                  <span className="text-[#95959D]/40">|</span>
                  <button
                    type="button"
                    onClick={handleResetView}
                    className="flex items-center gap-1 px-1.5 py-0.5 hover:text-[#4ADE80] transition-colors whitespace-nowrap cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset</span>
                  </button>
                  <span className="hidden md:inline text-[#C6C6C9] text-[11px] ml-1 whitespace-nowrap">
                    Drag to rotate · Scroll to zoom
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Right Column: Educational Metadata & Official Source Link */}
          <div className="lg:col-span-4 p-4 sm:p-5 overflow-y-auto space-y-4 bg-[#1D1D20] border-t lg:border-t-0 lg:border-l border-[#95959D]/20">
            <div>
              <div className="text-xs font-mono tracking-[0.16em] uppercase text-[#B5945B]">
                {comingSoonName ? 'OBJECT STATUS · PENDING 3D ASSET' : `${activeModel.missionOrTarget} · ${activeModel.status}`}
              </div>
              <h3 className="text-lg sm:text-xl font-normal text-[#FFFFFF] mt-1">
                {comingSoonName ? `${comingSoonName} (3D Model Coming Soon)` : activeModel.name}
              </h3>
            </div>

            <p className="text-sm text-[#EAEAEB] leading-relaxed">
              {comingSoonName
                ? `${comingSoonName} is currently featured in the interactive Solar System simulation. Choose any model in the library list to inspect its 3D geometry.`
                : activeModel.description}
            </p>

            {/* Key Specifications */}
            {!comingSoonName && (
              <>
                <div className="border-t border-[#95959D]/20 pt-3 space-y-2">
                  <div className="text-xs font-mono tracking-[0.14em] uppercase text-[#B5945B]">
                    Technical Telemetry & Archive Data
                  </div>
                  {activeModel.keySpecs.map((spec) => (
                    <div
                      key={spec.label}
                      className="flex items-center justify-between gap-3 text-xs py-1 border-b border-[#95959D]/15"
                    >
                      <span className="text-[#C6C6C9]">{spec.label}</span>
                      <span className="font-mono text-[#FFFFFF] text-right">{spec.value}</span>
                    </div>
                  ))}
                </div>

                <div className="text-xs text-[#C6C6C9]">
                  Attribution: <span className="text-[#EAEAEB]">{activeModel.attribution}</span>
                </div>

                <a
                  href={activeModel.nasaResourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 text-xs font-semibold text-[#000000] bg-[#FFFFFF] hover:bg-[#EAEAEB] rounded transition-colors whitespace-nowrap"
                >
                  <span>Open Official Mission Resource</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </>
            )}

            {/* Official NASA & Observatory Catalogs Directory */}
            <div className="border-t border-[#95959D]/20 pt-3">
              <div className="text-xs font-mono tracking-[0.14em] uppercase text-[#B5945B] mb-2">
                Official Space & 3D Catalogs
              </div>
              <div className="grid grid-cols-1 gap-1.5">
                {OFFICIAL_CATALOG_LINKS.map((cat) => (
                  <a
                    key={cat.url}
                    href={cat.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between text-xs text-[#C6C6C9] hover:text-[#FFFFFF] py-1 transition-colors"
                  >
                    <span>{cat.name}</span>
                    <ExternalLink className="w-3 h-3 shrink-0 text-[#C6C6C9]" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

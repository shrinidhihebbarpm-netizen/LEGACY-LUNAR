import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { X, RotateCcw, ExternalLink, Box, ZoomIn, ZoomOut, Layers } from 'lucide-react';
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
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeModel, setActiveModel] = useState<Nasa3DModelEntry>(
    () => NASA_3D_MODELS.find((m) => m.id === initialModelId) || NASA_3D_MODELS[0]
  );
  const [loadStatus, setLoadStatus] = useState<{
    state: 'idle' | 'loading' | 'loaded' | 'procedural' | 'error';
    progress: number;
    message?: string;
  }>({ state: 'idle', progress: 0 });

  const viewportRef = useRef<HTMLDivElement | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const requestRenderRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (initialModelId) {
      const found = NASA_3D_MODELS.find((m) => m.id === initialModelId);
      if (found) setActiveModel(found);
    }
  }, [initialModelId]);

  useEffect(() => {
    if (!isOpen) return;
    const container = viewportRef.current;
    if (!container) return;

    let cancelled = false;
    const isSoftwareGl = detectSoftwareGl();
    const width = container.clientWidth || 640;
    const height = container.clientHeight || 420;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(3.9, 2.25, 4.7);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    const keyLight = new THREE.DirectionalLight(0xfffbeb, 1.55);
    keyLight.position.set(5, 7, 5);
    scene.add(keyLight);

    const fillLight = new THREE.HemisphereLight(0xc6d4f9, 0x1e2028, 0.7);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xeaeaeb, 0.85);
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
    let activeObjectRoot: THREE.Object3D | null = null;
    let dracoLoader: DRACOLoader | null = null;
    let pendingRenderCallbacks: Array<() => void> = [];

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
            frameId = window.setTimeout(cb, 80);
          }
        };
        frameId = window.setTimeout(poll, 5);
      } else {
        frameId = window.setTimeout(cb, 80);
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
        controls.update();
        renderer.render(scene, camera);
        const callbacks = pendingRenderCallbacks;
        pendingRenderCallbacks = [];
        const done = () => {
          renderBusy = false;
          callbacks.forEach((cb) => cb());
          if (renderDirty && !cancelled) requestRender();
        };
        if (isSoftwareGl) afterDraw(done);
        else done();
      });
    }

    const handleControlsChange = () => requestRender();
    requestRenderRef.current = () => requestRender();
    controls.addEventListener('change', handleControlsChange);

    const mountProceduralFallback = (statusState: 'procedural' | 'error', msg?: string) => {
      if (cancelled) return;
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

          const root = gltf.scene;
          const box = new THREE.Box3().setFromObject(root);
          const size = new THREE.Vector3();
          const center = new THREE.Vector3();
          box.getSize(size);
          box.getCenter(center);

          const maxDim = Math.max(size.x, size.y, size.z) || 1;
          const targetSpan = 2.65;
          const scale = targetSpan / maxDim;

          root.scale.setScalar(scale);
          root.position.set(-center.x * scale, -center.y * scale, -center.z * scale);

          root.traverse((obj) => {
            if ((obj as THREE.Mesh).isMesh) {
              const mesh = obj as THREE.Mesh;
              mesh.castShadow = !isSoftwareGl;
              mesh.receiveShadow = !isSoftwareGl;
              const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
              mats.forEach((m) => {
                if (m && 'envMapIntensity' in m) {
                  (m as THREE.MeshStandardMaterial).envMapIntensity = 0.72;
                  m.needsUpdate = true;
                }
              });
            }
          });

          const halfHeight = Math.min(1.65, Math.max(0.8, (size.y * scale) * 0.5 + 0.16));
          gridHelper.position.y = -halfHeight;

          activeObjectRoot = root;
          scene.add(root);
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
          console.warn('Failed to load GLB model, falling back to procedural geometry:', err);
          mountProceduralFallback('error', 'Fallback reconstruction active');
        }
      );
    } else {
      mountProceduralFallback('procedural');
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
      controls.removeEventListener('change', handleControlsChange);
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      if (activeObjectRoot) {
        scene.remove(activeObjectRoot);
        disposeObject3D(activeObjectRoot);
        activeObjectRoot = null;
      }
      dracoLoader?.dispose();
      controls.dispose();
      renderer.dispose();
    };
  }, [isOpen, activeModel]);

  if (!isOpen) return null;

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
      cameraRef.current.position.set(3.9, 2.25, 4.7);
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

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="model-library-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-6 overflow-y-auto"
    >
      <div className="w-full max-w-6xl bg-[#1D1D20] border border-[#95959D]/30 rounded overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#95959D]/20 bg-[#000000]">
          <div className="flex items-center gap-3">
            <Box className="w-5 h-5 text-[#4ADE80] shrink-0" />
            <div>
              <h2 id="model-library-title" className="text-lg font-medium text-[#FFFFFF]">
                NASA 3D Hardware & Planetary Model Library
              </h2>
              <p className="text-xs text-[#C6C6C9]">
                18 official NASA .GLB spacecraft & planetary meshes + procedural archives
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close 3D Model Library"
            className="p-2 text-[#C6C6C9] hover:text-[#FFFFFF] hover:bg-[#252527] rounded transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-1.5 px-5 py-2.5 border-b border-[#95959D]/20 bg-[#1D1D20] overflow-x-auto">
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
          <div className="lg:col-span-3 border-b lg:border-b-0 lg:border-r border-[#95959D]/20 overflow-y-auto max-h-52 lg:max-h-none p-3 space-y-1.5 bg-[#000000]">
            {filteredModels.map((model) => {
              const isSelected = model.id === activeModel.id;
              return (
                <button
                  key={model.id}
                  type="button"
                  onClick={() => setActiveModel(model)}
                  className={`w-full text-left p-3 rounded border transition-colors cursor-pointer ${
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
          <div className="lg:col-span-5 relative flex flex-col min-h-[320px] lg:min-h-[440px] bg-[#000000]">
            <div
              ref={viewportRef}
              data-testid="model-library-viewport"
              data-model-id={activeModel.id}
              data-load-state={loadStatus.state}
              className="flex-1 w-full h-full min-h-[320px]"
            />

            {/* Top-left Model Format Badge */}
            <div className="absolute top-3 left-3 flex items-center gap-2 px-2.5 py-1 rounded bg-[#1D1D20]/90 border border-[#95959D]/25 text-[11px] font-mono text-[#EAEAEB]">
              <Layers className="w-3.5 h-3.5 text-[#4ADE80]" />
              <span>
                {activeModel.glbUrl
                  ? activeModel.glbSizeLabel || 'Official NASA GLB'
                  : 'Procedural 3D Reconstruction'}
              </span>
            </div>

            {/* Loading Progress Overlay for GLB Streaming */}
            {loadStatus.state === 'loading' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/75 px-6 text-center pointer-events-none">
                <div className="w-56 space-y-2">
                  <div className="text-xs font-mono tracking-[0.12em] uppercase text-[#EAEAEB]">
                    Loading Official NASA Mesh... {loadStatus.progress}%
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

            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1.5 rounded bg-[#252527] border border-[#95959D]/30 text-xs text-[#EAEAEB] whitespace-nowrap">
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
                onClick={handleResetView}
                className="flex items-center gap-1 px-2 py-0.5 hover:text-[#4ADE80] transition-colors whitespace-nowrap cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset View</span>
              </button>
              <span className="hidden sm:inline text-[#C6C6C9] text-[11px] ml-1 whitespace-nowrap">
                Drag to rotate · Scroll to zoom
              </span>
            </div>
          </div>

          {/* Right Column: Educational Metadata & Official NASA Source Link */}
          <div className="lg:col-span-4 p-5 overflow-y-auto space-y-4 bg-[#1D1D20] border-t lg:border-t-0 lg:border-l border-[#95959D]/20">
            <div>
              <div className="text-xs font-mono tracking-[0.16em] uppercase text-[#B5945B]">
                {activeModel.missionOrTarget} · {activeModel.status}
              </div>
              <h3 className="text-xl font-normal text-[#FFFFFF] mt-1">{activeModel.name}</h3>
            </div>

            <p className="text-sm text-[#EAEAEB] leading-relaxed">{activeModel.description}</p>

            {/* Key Specifications */}
            <div className="border-t border-[#95959D]/20 pt-3 space-y-2">
              <div className="text-xs font-mono tracking-[0.14em] uppercase text-[#B5945B]">
                Technical Telemetry & Archive Data
              </div>
              {activeModel.keySpecs.map((spec) => (
                <div
                  key={spec.label}
                  className="flex items-center justify-between text-xs py-1 border-b border-[#95959D]/15"
                >
                  <span className="text-[#C6C6C9]">{spec.label}</span>
                  <span className="font-mono text-[#FFFFFF]">{spec.value}</span>
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
              <span>Open Official NASA 3D Resource Page</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            {/* Official NASA 3D Catalogs Directory */}
            <div className="border-t border-[#95959D]/20 pt-3">
              <div className="text-xs font-mono tracking-[0.14em] uppercase text-[#B5945B] mb-2">
                Official NASA 3D Repositories
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

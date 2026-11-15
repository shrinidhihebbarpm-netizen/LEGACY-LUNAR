import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Box,
  ExternalLink,
  BookOpen,
  Layers,
  Sun,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Info,
  Pause,
  Play,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Radio,
} from 'lucide-react';
import {
  ARTIFACTS,
  DESTINATIONS,
  NASA_3D_MODELS,
  filterArtifacts,
  getChronologicalTimeline,
  getGhostMissions,
  type DestinationId,
  type SpaceArtifact,
} from '../data/spaceData';
import {
  DEEP_SPACE_PROBES,
  REAL_RATE_INDEX,
  SOLAR_BODIES,
  TIME_RATE_PRESETS,
  formatNasaEyesDateTime,
  type LightingMode,
  type SolarTargetId,
} from '../utils/solarSystemSim';
import { SolarSystemCanvas, type SolarSystemLayers } from '../components/SolarSystemCanvas';
import { ModelViewerModal } from '../components/ModelViewerModal';
import { ExplorerGuideChat } from '../components/ExplorerGuideChat';

type ActiveSectionTab = 'orrery' | 'timeline' | 'silent-explorers' | 'still-traveling';

const FEATURED_STORY_IDS = [
  'apollo-11-eagle-descent',
  'apollo-lunar-rover-lrv',
  'opportunity-rover',
  'perseverance-rover',
  'ingenuity-helicopter',
  'insight-lander',
  'galileo-jupiter-probe',
  'cassini-huygens',
  'voyager-1-2',
  'pioneer-10-11',
  'new-horizons-probe',
];

function mapDestinationToTarget(destId: DestinationId): SolarTargetId {
  switch (destId) {
    case 'moon':
      return 'moon';
    case 'mars':
      return 'mars';
    case 'jupiter':
      return 'jupiter';
    case 'saturn':
      return 'saturn';
    case 'deep-space':
      return 'voyager-1';
  }
}

export const ExplorePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const dossierRef = useRef<HTMLElement | null>(null);
  const profileCardRef = useRef<HTMLElement | null>(null);
  const ghostGalleryRef = useRef<HTMLElement | null>(null);

  const initialDestParam = searchParams.get('destination') as DestinationId | null;
  const initialArtParam = searchParams.get('artifact');

  const [selectedDestinationId, setSelectedDestinationId] = useState<DestinationId>(() =>
    DESTINATIONS.some((d) => d.id === initialDestParam) ? initialDestParam! : 'mars'
  );
  const [selectedArtifactId, setSelectedArtifactId] = useState<string>(() => {
    if (initialArtParam && ARTIFACTS.some((a) => a.id === initialArtParam)) {
      return initialArtParam;
    }
    return 'opportunity-rover';
  });

  // NASA Eyes Solar System HUD state (starts at full Overview unless artifact/dest specified)
  const [selectedTargetId, setSelectedTargetId] = useState<SolarTargetId>(() => {
    if (initialArtParam || initialDestParam) {
      const dest = DESTINATIONS.some((d) => d.id === initialDestParam)
        ? initialDestParam!
        : ARTIFACTS.find((a) => a.id === initialArtParam)?.destinationId || 'mars';
      return mapDestinationToTarget(dest);
    }
    return 'overview';
  });

  const [activeTab, setActiveTab] = useState<ActiveSectionTab>('orrery');
  const [ghostStatusFilter, setGhostStatusFilter] = useState<'all' | 'Dormant' | 'Retired'>('all');
  const [leftRailTab, setLeftRailTab] = useState<'stories' | 'worlds'>('stories');
  const [leftRailOpen, setLeftRailOpen] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
  );
  const [infoDrawerOpen, setInfoDrawerOpen] = useState<boolean>(false);
  const [layersPopoverOpen, setLayersPopoverOpen] = useState<boolean>(false);
  const [lightingPopoverOpen, setLightingPopoverOpen] = useState<boolean>(false);

  // Simulation time & rate controls (default 1 DAY/S so planetary motion is smoothly perceptible, with LIVE snap to REAL RATE)
  const [rateIndex, setRateIndex] = useState<number>(8); // Index 8 = 1 DAY/S; index 5 = REAL RATE
  const [paused, setPaused] = useState<boolean>(false);
  const [simTimeMs, setSimTimeMs] = useState<number>(() => Date.now());
  const [displaySimTimeMs, setDisplaySimTimeMs] = useState<number>(() => Date.now());
  const [lightingMode, setLightingMode] = useState<LightingMode>('natural');
  const [layers, setLayers] = useState<SolarSystemLayers>({
    labels: true,
    orbits: true,
    spacecraft: true,
    asteroidBelt: true,
  });

  const [zoomDeltaSignal, setZoomDeltaSignal] = useState<{ seq: number; factor: number }>({
    seq: 0,
    factor: 1,
  });
  const [resetViewSignal, setResetViewSignal] = useState<number>(0);

  const [modelModalOpen, setModelModalOpen] = useState(false);
  const [modelModalTargetId, setModelModalTargetId] = useState<string | undefined>(undefined);

  useEffect(() => {
    const destParam = searchParams.get('destination') as DestinationId | null;
    const artParam = searchParams.get('artifact');

    if (destParam && DESTINATIONS.some((d) => d.id === destParam)) {
      setSelectedDestinationId(destParam);
      setSelectedTargetId(mapDestinationToTarget(destParam));
    }
    if (artParam && ARTIFACTS.some((a) => a.id === artParam)) {
      const found = ARTIFACTS.find((a) => a.id === artParam)!;
      setSelectedArtifactId(found.id);
      setSelectedDestinationId(found.destinationId);
      setSelectedTargetId(mapDestinationToTarget(found.destinationId));
    }
  }, [searchParams]);

  const currentRatePreset = TIME_RATE_PRESETS[rateIndex] || TIME_RATE_PRESETS[REAL_RATE_INDEX];
  const isLiveMode = !paused && rateIndex === REAL_RATE_INDEX;
  const formattedClock = useMemo(() => formatNasaEyesDateTime(displaySimTimeMs), [displaySimTimeMs]);

  const currentDestination = useMemo(
    () => DESTINATIONS.find((d) => d.id === selectedDestinationId) || DESTINATIONS[0],
    [selectedDestinationId]
  );

  const destinationArtifacts = useMemo(
    () => filterArtifacts(ARTIFACTS, { destinationId: selectedDestinationId }),
    [selectedDestinationId]
  );

  const selectedArtifact: SpaceArtifact = useMemo(() => {
    const found = ARTIFACTS.find((a) => a.id === selectedArtifactId);
    if (found) return found;
    return destinationArtifacts[0] || ARTIFACTS[0];
  }, [selectedArtifactId, destinationArtifacts]);

  const featuredStories = useMemo(
    () =>
      FEATURED_STORY_IDS.map((id) => ARTIFACTS.find((a) => a.id === id)).filter(
        (a): a is SpaceArtifact => Boolean(a)
      ),
    []
  );

  const ghostMissions = useMemo(
    () => getGhostMissions(ARTIFACTS, ghostStatusFilter),
    [ghostStatusFilter]
  );

  const activeTargetDetails = useMemo(() => {
    if (selectedTargetId === 'overview') {
      return {
        kicker: 'SOLAR SYSTEM OVERVIEW',
        title: 'Eight Worlds & Deep Space',
        distance: '0 – 166+ AU',
        summary:
          'Interactive heliocentric simulation with Keplerian orbits, NASA spacecraft trajectories, and left-behind hardware sites across the Moon, Mars, Jupiter, Saturn, and interstellar space.',
        hasMissionDest: false,
      };
    }
    const body = SOLAR_BODIES.find((b) => b.id === selectedTargetId);
    if (body) {
      return {
        kicker: body.classification.toUpperCase(),
        title: body.name,
        distance: body.distanceLabel,
        summary: body.summary,
        hasMissionDest: Boolean(body.destinationId),
      };
    }
    const probe = DEEP_SPACE_PROBES.find((p) => p.id === selectedTargetId);
    if (probe) {
      return {
        kicker: `INTERSTELLAR TRAJECTORY · ${probe.speedKmPerSec} KM/S`,
        title: probe.name,
        distance: `${probe.currentAu} AU from the Sun`,
        summary: probe.summary,
        hasMissionDest: true,
      };
    }
    return {
      kicker: 'DEEP SPACE',
      title: 'DEEP SPACE & INTERSTELLAR',
      distance: '50 – 166+ AU',
      summary: currentDestination.summary,
      hasMissionDest: true,
    };
  }, [selectedTargetId, currentDestination.summary]);

  const timelineItems = useMemo(() => getChronologicalTimeline(ARTIFACTS), []);
  const travelingArtifacts = useMemo(
    () => filterArtifacts(ARTIFACTS, { statusFilter: 'traveling' }),
    []
  );

  const handleSelect3DTarget = (targetId: SolarTargetId) => {
    setSelectedTargetId(targetId);
    if (targetId !== 'overview') {
      setInfoDrawerOpen(true);
    }

    const body = SOLAR_BODIES.find((b) => b.id === targetId);
    if (body?.destinationId) {
      setSelectedDestinationId(body.destinationId);
      if (body.defaultArtifactId) {
        setSelectedArtifactId(body.defaultArtifactId);
      }
      return;
    }

    const probe = DEEP_SPACE_PROBES.find((p) => p.id === targetId);
    if (probe) {
      setSelectedDestinationId(probe.destinationId);
      setSelectedArtifactId(probe.artifactId);
    }
  };

  const handleSelectDestination = (destId: DestinationId) => {
    setSelectedDestinationId(destId);
    setSelectedTargetId(mapDestinationToTarget(destId));
    const firstArt = ARTIFACTS.find((a) => a.destinationId === destId);
    if (firstArt) {
      setSelectedArtifactId(firstArt.id);
    }
    setSearchParams({ destination: destId });
  };

  const handleSelectArtifact = (artifactId: string, scrollToProfile = false) => {
    const art = ARTIFACTS.find((a) => a.id === artifactId);
    if (!art) return;
    setSelectedArtifactId(art.id);
    setSelectedDestinationId(art.destinationId);

    if (art.id === 'voyager-1-2') setSelectedTargetId('voyager-1');
    else if (art.id === 'pioneer-10-11') setSelectedTargetId('pioneer-10');
    else if (art.id === 'new-horizons-probe') setSelectedTargetId('new-horizons');
    else setSelectedTargetId(mapDestinationToTarget(art.destinationId));

    setSearchParams({ destination: art.destinationId, artifact: art.id });
    if (scrollToProfile) {
      setActiveTab('orrery');
      window.setTimeout(() => {
        (profileCardRef.current || dossierRef.current)?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }, 40);
    }
  };

  const open3DModelForArtifact = (modelId: string) => {
    setModelModalTargetId(modelId);
    setModelModalOpen(true);
  };

  const handleSnapLive = () => {
    const now = Date.now();
    setSimTimeMs(now);
    setDisplaySimTimeMs(now);
    setRateIndex(REAL_RATE_INDEX);
    setPaused(false);
  };

  const handleResetOverview = () => {
    setSelectedTargetId('overview');
    setInfoDrawerOpen(false);
    setResetViewSignal((s) => s + 1);
  };

  const getStatusClass = (status: SpaceArtifact['status']) => {
    switch (status) {
      case 'Active':
      case 'Still Traveling':
        return 'text-[#47da84]';
      case 'Dormant':
        return 'text-[#b5945b]';
      case 'Impact Site':
        return 'text-[#d55033]';
      default:
        return 'text-[#c6c6c9]';
    }
  };

  return (
    <div className="min-h-screen bg-[#000000] text-[#ffffff] flex flex-col">
      {/* Compact NASA Eyes Style Top Navigation Header */}
      <header className="sticky top-0 z-30 h-12 flex items-center justify-between gap-4 px-4 sm:px-6 bg-[#000000] border-b border-[#37373a]">
        <div className="flex items-center gap-4 min-w-0">
          <Link
            to="/"
            aria-label="Back to Landing Page"
            className="inline-flex items-center gap-2 text-xs tracking-[0.12em] uppercase font-medium text-[#c6c6c9] hover:text-[#ffffff] transition-colors whitespace-nowrap shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Landing</span>
          </Link>
          <span className="hidden lg:inline-block h-3.5 w-px bg-[#37373a]" aria-hidden="true" />
          <span className="hidden lg:inline-block text-xs tracking-[0.18em] uppercase text-[#c6c6c9] truncate">
            NASA EYES · SILENT EXPLORERS
          </span>
        </div>

        <nav
          aria-label="Solar System Explorer Views"
          className="hidden md:flex items-center gap-6 text-xs tracking-[0.06em]"
        >
          <button
            type="button"
            onClick={() => setActiveTab('orrery')}
            className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'orrery'
                ? 'text-[#ffffff] font-semibold underline underline-offset-8 decoration-[#47da84]'
                : 'text-[#c6c6c9] hover:text-[#ffffff]'
            }`}
          >
            3D Solar System View
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('timeline');
              dossierRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
            className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'timeline'
                ? 'text-[#ffffff] font-semibold underline underline-offset-8 decoration-[#47da84]'
                : 'text-[#c6c6c9] hover:text-[#ffffff]'
            }`}
          >
            Mission Timeline
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('silent-explorers');
              ghostGalleryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
            className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'silent-explorers'
                ? 'text-[#ffffff] font-semibold underline underline-offset-8 decoration-[#cd9745]'
                : 'text-[#c6c6c9] hover:text-[#ffffff]'
            }`}
          >
            Ghost Missions
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('still-traveling');
              dossierRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
            className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'still-traveling'
                ? 'text-[#ffffff] font-semibold underline underline-offset-8 decoration-[#47da84]'
                : 'text-[#c6c6c9] hover:text-[#ffffff]'
            }`}
          >
            Still Traveling
          </button>
        </nav>

        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={() => {
              setModelModalTargetId(selectedArtifact.model3dId);
              setModelModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-[#000000] bg-[#ffffff] hover:bg-[#eaeaeb] rounded-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Box className="w-3.5 h-3.5" />
            <span>3D Model Library</span>
          </button>
        </div>
      </header>

      {/* Mobile Tab Bar */}
      <div className="flex md:hidden items-center gap-1.5 px-3 py-2 bg-[#181818] border-b border-[#37373a] overflow-x-auto">
        {(
          [
            { id: 'orrery', label: '3D Solar System' },
            { id: 'timeline', label: 'Timeline' },
            { id: 'silent-explorers', label: 'Ghost Missions' },
            { id: 'still-traveling', label: 'Still Traveling' },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              setActiveTab(t.id);
              if (t.id === 'silent-explorers') {
                ghostGalleryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              } else if (t.id !== 'orrery') {
                dossierRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }}
            className={`px-3 py-1 text-xs font-medium rounded-sm whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === t.id
                ? 'bg-[#ffffff] text-[#000000] font-semibold'
                : 'text-[#c6c6c9] bg-[#252527]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col bg-[#000000]">
        {/* ================================================================
            FULL-VIEWPORT NASA EYES ON THE SOLAR SYSTEM 3D STAGE
            ================================================================ */}
        <section
          aria-label="Interactive 3D Solar System View"
          className="relative w-full h-[calc(100vh-48px)] min-h-[580px] border-b border-[#37373a] bg-[#000000] overflow-hidden"
        >
          <SolarSystemCanvas
            selectedTargetId={selectedTargetId}
            onSelectTarget={handleSelect3DTarget}
            simTimeMs={simTimeMs}
            rateSecondsPerSec={currentRatePreset.secondsPerSecond}
            paused={paused}
            lightingMode={lightingMode}
            layers={layers}
            zoomDeltaSignal={zoomDeltaSignal}
            resetViewSignal={resetViewSignal}
            onSimTimeTick={setDisplaySimTimeMs}
          />

          {/* Top-Left Title matching eyes.nasa.gov/apps/solar-system/#/home */}
          <div className="pointer-events-none absolute top-4 left-6 z-20 flex items-center gap-3">
            <div>
              <h1 className="text-[15px] font-medium tracking-[0.14em] uppercase text-[#c6c6c9]">
                SOLAR SYSTEM <span className="text-[#95959d]">/</span>{' '}
                <span className="text-[#ffffff]">{activeTargetDetails.title}</span>
              </h1>
              <div className="text-[11px] font-mono tracking-[0.16em] uppercase text-[#b5945b] mt-0.5">
                {activeTargetDetails.kicker} · {activeTargetDetails.distance}
              </div>
            </div>
            {selectedTargetId !== 'overview' && (
              <button
                type="button"
                onClick={handleResetOverview}
                className="pointer-events-auto ml-2 px-2.5 py-1 text-[11px] font-mono tracking-[0.12em] uppercase bg-[#252527] hover:bg-[#37373a] text-[#eaeaeb] border border-[#95959d]/30 rounded-sm cursor-pointer"
              >
                ← Overview
              </button>
            )}
          </div>

          {/* Left Collapsible NASA Eyes Rail ("Featured Hardware Stories" & "Solar System Worlds") */}
          <div className="pointer-events-none absolute top-16 bottom-20 left-6 z-20 flex items-start gap-2">
            {leftRailOpen ? (
              <aside
                aria-label="Featured Hardware Stories and Solar System Worlds"
                className="pointer-events-auto w-[276px] max-h-full flex flex-col bg-[#181818]/90 border border-[#37373a] rounded-sm overflow-hidden"
              >
                {/* Rail Tabs + Collapse button */}
                <div className="flex items-center justify-between border-b border-[#37373a] bg-[#181818]">
                  <div className="flex items-center flex-1">
                    <button
                      type="button"
                      onClick={() => setLeftRailTab('stories')}
                      className={`flex-1 py-2.5 px-2.5 text-[10.5px] font-mono tracking-[0.12em] uppercase transition-colors cursor-pointer whitespace-nowrap ${
                        leftRailTab === 'stories'
                          ? 'text-[#ffffff] border-b-2 border-[#47da84] bg-[#252527]/70'
                          : 'text-[#95959d] hover:text-[#eaeaeb]'
                      }`}
                    >
                      Featured Stories
                    </button>
                    <button
                      type="button"
                      onClick={() => setLeftRailTab('worlds')}
                      className={`flex-1 py-2.5 px-2.5 text-[10.5px] font-mono tracking-[0.12em] uppercase transition-colors cursor-pointer whitespace-nowrap ${
                        leftRailTab === 'worlds'
                          ? 'text-[#ffffff] border-b-2 border-[#47da84] bg-[#252527]/70'
                          : 'text-[#95959d] hover:text-[#eaeaeb]'
                      }`}
                    >
                      All Worlds
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setLeftRailOpen(false)}
                    aria-label="Collapse Featured Panel"
                    className="p-2.5 text-[#95959d] hover:text-[#ffffff] border-l border-[#37373a] cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>

                {/* Scrollable Card Stack */}
                <div className="overflow-y-auto p-2.5 space-y-2">
                  {leftRailTab === 'stories' ? (
                    featuredStories.map((art) => {
                      const isActive = art.id === selectedArtifact.id && selectedTargetId !== 'overview';
                      return (
                        <button
                          key={art.id}
                          type="button"
                          onClick={() => handleSelectArtifact(art.id, false)}
                          className={`nasa-eyes-card w-full text-left p-3 rounded-sm cursor-pointer ${
                            isActive ? 'active' : ''
                          }`}
                        >
                          <div className="text-[10px] font-mono tracking-[0.16em] uppercase text-[#b5945b]">
                            {art.hardwareType} · {art.arrivalDate}
                          </div>
                          <div className="text-[13.5px] font-normal text-[#ffffff] leading-snug mt-1">
                            {art.name}
                          </div>
                          <div className="flex items-center justify-between gap-2 text-[11px] text-[#c6c6c9] mt-2">
                            <span className="truncate min-w-0">{art.mission}</span>
                            <span
                              className={`font-mono whitespace-nowrap shrink-0 ${getStatusClass(art.status)}`}
                            >
                              ● {art.status}
                            </span>
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={handleResetOverview}
                        className={`nasa-eyes-card w-full text-left px-3.5 py-2.5 rounded-sm flex items-center justify-between cursor-pointer ${
                          selectedTargetId === 'overview' ? 'active' : ''
                        }`}
                      >
                        <span className="text-xs tracking-[0.14em] uppercase text-[#ffffff]">
                          Solar System Overview
                        </span>
                        <span className="text-[10px] font-mono text-[#47da84]">ALL</span>
                      </button>

                      {SOLAR_BODIES.map((body) => {
                        const isActive = selectedTargetId === body.id;
                        return (
                          <button
                            key={body.id}
                            type="button"
                            onClick={() => handleSelect3DTarget(body.id)}
                            className={`nasa-eyes-card w-full text-left px-3.5 py-2.5 rounded-sm flex items-center justify-between cursor-pointer ${
                              isActive ? 'active' : ''
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <span
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: body.orbitColorHex }}
                              />
                              <span className="text-xs tracking-[0.16em] uppercase text-[#ffffff]">
                                {body.name}
                              </span>
                            </div>
                            <span className="text-[10px] font-mono text-[#c6c6c9]">
                              {body.destinationId ? 'HARDWARE' : body.distanceLabel.split(' ·')[0]}
                            </span>
                          </button>
                        );
                      })}

                      <div className="pt-2 pb-1 px-1 text-[10px] font-mono tracking-[0.18em] uppercase text-[#b5945b]">
                        Deep-Space Spacecraft
                      </div>
                      {DEEP_SPACE_PROBES.map((probe) => {
                        const isActive = selectedTargetId === probe.id;
                        return (
                          <button
                            key={probe.id}
                            type="button"
                            onClick={() => handleSelect3DTarget(probe.id)}
                            className={`nasa-eyes-card w-full text-left px-3.5 py-2.5 rounded-sm flex items-center justify-between cursor-pointer ${
                              isActive ? 'active' : ''
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <span
                                className="w-2 h-2 rotate-45 shrink-0"
                                style={{ backgroundColor: probe.colorHex }}
                              />
                              <span className="text-xs tracking-[0.12em] uppercase text-[#ffffff]">
                                {probe.name}
                              </span>
                            </div>
                            <span className="text-[10px] font-mono text-[#cd9745]">
                              {probe.currentAu} AU
                            </span>
                          </button>
                        );
                      })}
                    </>
                  )}
                </div>
              </aside>
            ) : (
              <button
                type="button"
                onClick={() => setLeftRailOpen(true)}
                aria-label="Open Featured Hardware Stories Panel"
                className="pointer-events-auto inline-flex items-center gap-2 px-3 py-2 text-[11px] font-mono tracking-[0.14em] uppercase bg-[#181818]/90 hover:bg-[#252527] text-[#eaeaeb] border border-[#37373a] rounded-sm cursor-pointer"
              >
                <ChevronRight className="w-3.5 h-3.5 text-[#b5945b]" />
                <span>Featured Stories</span>
              </button>
            )}
          </div>

          {/* Right Slide-Over Info Drawer (Toggled by Info Icon or Clicking a 3D Planet) */}
          {infoDrawerOpen && (
            <aside
              aria-label="Selected Body Quick Telemetry Card"
              className="pointer-events-auto absolute top-16 right-16 z-20 w-[300px] sm:w-[330px] bg-[#181818]/95 border border-[#37373a] rounded-sm p-4 space-y-3 shadow-2xl"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-[10px] font-mono tracking-[0.18em] uppercase text-[#b5945b]">
                    {activeTargetDetails.kicker}
                  </div>
                  <h2 className="text-lg font-medium tracking-[0.06em] uppercase text-[#ffffff] mt-0.5">
                    {activeTargetDetails.title}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setInfoDrawerOpen(false)}
                  aria-label="Close Quick Telemetry Card"
                  className="text-xs font-mono text-[#95959d] hover:text-[#ffffff] px-1.5 py-0.5 cursor-pointer"
                >
                  ✕
                </button>
              </div>
              <div className="text-xs font-mono text-[#47da84]">{activeTargetDetails.distance}</div>
              <p className="text-xs text-[#eaeaeb] leading-relaxed">{activeTargetDetails.summary}</p>
              <div className="pt-2 border-t border-[#37373a] flex flex-wrap items-center gap-2">
                {activeTargetDetails.hasMissionDest && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('orrery');
                      profileCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold bg-[#ffffff] text-[#000000] hover:bg-[#eaeaeb] rounded-sm cursor-pointer"
                  >
                    <span>Read Left-Behind Story</span>
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => open3DModelForArtifact(selectedArtifact.model3dId)}
                  className="px-3 py-2 text-xs font-mono bg-[#252527] hover:bg-[#37373a] text-[#ffffff] border border-[#37373a] rounded-sm cursor-pointer"
                >
                  3D Model
                </button>
              </div>
            </aside>
          )}

          {/* Right-Edge Vertical NASA Eyes Utility Bar */}
          <div className="pointer-events-auto absolute right-4 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-1.5 items-end">
            <button
              type="button"
              onClick={() => {
                setInfoDrawerOpen((v) => !v);
                setLayersPopoverOpen(false);
                setLightingPopoverOpen(false);
              }}
              aria-pressed={infoDrawerOpen}
              aria-label="Toggle Target Info Panel"
              title="Target Info"
              className="nasa-eyes-tool-btn rounded-sm cursor-pointer"
            >
              <Info className="w-4 h-4" />
            </button>

            <div className="relative flex items-center">
              {layersPopoverOpen && (
                <div className="absolute right-10 top-0 w-48 bg-[#181818]/95 border border-[#37373a] rounded-sm p-3 space-y-2 shadow-2xl">
                  <div className="text-[10px] font-mono tracking-[0.18em] uppercase text-[#b5945b]">
                    Scene Layers
                  </div>
                  {(
                    [
                      { key: 'labels', label: 'Labels' },
                      { key: 'orbits', label: 'Orbit Lines' },
                      { key: 'spacecraft', label: 'Spacecraft Trails' },
                      { key: 'asteroidBelt', label: 'Asteroid Belt' },
                    ] as const
                  ).map((item) => (
                    <label
                      key={item.key}
                      className="flex items-center justify-between text-xs text-[#eaeaeb] cursor-pointer"
                    >
                      <span>{item.label}</span>
                      <input
                        type="checkbox"
                        checked={layers[item.key]}
                        onChange={() =>
                          setLayers((prev) => ({ ...prev, [item.key]: !prev[item.key] }))
                        }
                        className="accent-[#47da84] cursor-pointer"
                      />
                    </label>
                  ))}
                </div>
              )}
              <button
                type="button"
                onClick={() => {
                  setLayersPopoverOpen((v) => !v);
                  setLightingPopoverOpen(false);
                }}
                aria-pressed={layersPopoverOpen}
                aria-label="Toggle 3D Scene Layers"
                title="Layers"
                className="nasa-eyes-tool-btn rounded-sm cursor-pointer"
              >
                <Layers className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setZoomDeltaSignal((prev) => ({ seq: prev.seq + 1, factor: 0.78 }))}
              aria-label="Zoom In"
              title="Zoom In"
              className="nasa-eyes-tool-btn rounded-sm cursor-pointer"
            >
              <ZoomIn className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setZoomDeltaSignal((prev) => ({ seq: prev.seq + 1, factor: 1.28 }))}
              aria-label="Zoom Out"
              title="Zoom Out"
              className="nasa-eyes-tool-btn rounded-sm cursor-pointer"
            >
              <ZoomOut className="w-4 h-4" />
            </button>

            <div className="relative flex items-center">
              {lightingPopoverOpen && (
                <div className="absolute right-10 top-0 w-44 bg-[#181818]/95 border border-[#37373a] rounded-sm p-2.5 space-y-1 shadow-2xl">
                  <div className="text-[10px] font-mono tracking-[0.18em] uppercase text-[#b5945b] px-1.5 pb-1">
                    Lighting Mode
                  </div>
                  {(
                    [
                      { id: 'natural', label: 'Natural Lighting' },
                      { id: 'shadow', label: 'High-Contrast Shadow' },
                      { id: 'flood', label: 'Flood Illumination' },
                    ] as const
                  ).map((mode) => (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => {
                        setLightingMode(mode.id);
                        setLightingPopoverOpen(false);
                      }}
                      className={`w-full text-left px-2 py-1.5 text-xs rounded-sm cursor-pointer ${
                        lightingMode === mode.id
                          ? 'bg-[#252527] text-[#47da84] font-semibold'
                          : 'text-[#c6c6c9] hover:text-[#ffffff] hover:bg-[#252527]/60'
                      }`}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>
              )}
              <button
                type="button"
                onClick={() => {
                  setLightingPopoverOpen((v) => !v);
                  setLayersPopoverOpen(false);
                }}
                aria-pressed={lightingPopoverOpen}
                aria-label="Change Lighting Mode"
                title="Lighting Mode"
                className="nasa-eyes-tool-btn rounded-sm cursor-pointer"
              >
                <Sun className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={handleResetOverview}
              aria-label="Reset Camera to Solar System Overview"
              title="Solar System Overview"
              className="nasa-eyes-tool-btn rounded-sm cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('orrery');
                dossierRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              aria-label="Scroll to Hardware Stories and Archive"
              title="Hardware Dossier"
              className="nasa-eyes-tool-btn rounded-sm cursor-pointer"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {/* Bottom-Center NASA Eyes Time & Rate Scrubber */}
          <div className="pointer-events-auto absolute bottom-3 left-1/2 -translate-x-1/2 z-20 w-[min(680px,94vw)] bg-[#181818]/88 border border-[#37373a] rounded-sm px-4 py-2.5 flex flex-col gap-1.5 shadow-2xl">
            <div className="flex items-center justify-between gap-3 text-[11px] font-mono">
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setPaused((p) => !p)}
                  aria-label={paused ? 'Resume Simulation Clock' : 'Pause Simulation Clock'}
                  className="inline-flex items-center justify-center w-6 h-6 rounded-sm bg-[#252527] hover:bg-[#37373a] text-[#ffffff] cursor-pointer"
                >
                  {paused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
                </button>
                <span
                  className="tracking-[0.14em] uppercase font-semibold"
                  style={{ color: paused ? '#ff9a42' : '#ffffff' }}
                >
                  {paused ? 'PAUSED' : currentRatePreset.label}
                </span>
              </div>

              <div className="text-[#eaeaeb] tracking-[0.08em] text-center">
                {formattedClock.dateStr} <span className="text-[#95959d]">|</span>{' '}
                <span className="text-[#c6c6c9]">{formattedClock.timeStr}</span>
              </div>

              <button
                type="button"
                onClick={handleSnapLive}
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-sm bg-[#252527] hover:bg-[#37373a] border border-[#37373a] cursor-pointer"
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: isLiveMode ? '#47da84' : '#ff9a42' }}
                />
                <span
                  className="tracking-[0.14em] uppercase font-semibold"
                  style={{ color: isLiveMode ? '#47da84' : '#ff9a42' }}
                >
                  LIVE
                </span>
              </button>
            </div>

            <div className="flex items-center gap-2.5">
              <span className="text-[9px] font-mono text-[#95959d] shrink-0">-1YR/S</span>
              <input
                type="range"
                aria-label="Simulation Time Rate Scrubber"
                min={0}
                max={TIME_RATE_PRESETS.length - 1}
                step={1}
                value={rateIndex}
                onChange={(e) => {
                  setRateIndex(Number(e.target.value));
                  if (paused) setPaused(false);
                }}
                className="nasa-eyes-scrubber flex-1"
              />
              <span className="text-[9px] font-mono text-[#95959d] shrink-0">+1YR/S</span>
            </div>
          </div>
        </section>

        {/* ================================================================
            BELOW-STAGE EDUCATIONAL DOSSIER, TIMELINE & SILENT ARCHIVE
            ================================================================ */}
        <section ref={dossierRef} id="dossier-section" className="w-full bg-[#000000] scroll-mt-12">
          {/* Destination Pill Selector Ribbon (Moon, Mars, Jupiter, Saturn, Deep Space) */}
          <div className="border-b border-[#37373a] bg-[#181818]">
            <div className="max-w-7xl mx-auto px-5 sm:px-8 py-3 flex flex-wrap items-center justify-between gap-3">
              <div
                role="group"
                aria-label="Solar System Destinations"
                className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0"
              >
                {DESTINATIONS.map((dest) => {
                  const isSelected = dest.id === selectedDestinationId;
                  return (
                    <button
                      key={dest.id}
                      type="button"
                      onClick={() => handleSelectDestination(dest.id)}
                      className={`px-3.5 py-1.5 text-xs tracking-[0.06em] font-medium rounded-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        isSelected
                          ? 'bg-[#ffffff] text-[#000000] font-semibold'
                          : 'bg-[#252527] hover:bg-[#37373a] text-[#eaeaeb] border border-[#37373a]'
                      }`}
                    >
                      {dest.name}
                    </button>
                  );
                })}
              </div>

              <div className="text-xs font-mono text-[#b5945b]">
                {currentDestination.totalArtifactsNote}
              </div>
            </div>
          </div>

          {activeTab === 'orrery' && (
            <div className="max-w-7xl w-full mx-auto px-5 sm:px-8 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column (5 cols): Destination Archive & Hardware Cards */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-[#252527] border border-[#37373a] rounded-sm p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono tracking-[0.2em] uppercase text-[#b5945b]">
                      DESTINATION ARCHIVE
                    </span>
                    <a
                      href={currentDestination.nasaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[#c6c6c9] hover:text-[#ffffff] inline-flex items-center gap-1"
                    >
                      <span>NASA Overview</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <h2 className="text-2xl font-normal text-[#ffffff]">{currentDestination.name}</h2>
                  <div className="text-xs font-mono text-[#c6c6c9]">
                    {currentDestination.subtitle} · Travel time:{' '}
                    {currentDestination.travelTimeFromEarth}
                  </div>
                  <p className="text-xs text-[#eaeaeb] leading-relaxed">
                    {currentDestination.summary}
                  </p>
                  <div className="pt-2 border-t border-[#37373a] text-xs text-[#c6c6c9]">
                    <strong className="text-[#ffffff]">Why Hardware Remains Here:</strong>{' '}
                    {currentDestination.scienceContext}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs tracking-[0.06em] uppercase text-[#c6c6c9]">
                      Hardware at {currentDestination.name} ({destinationArtifacts.length})
                    </h3>
                    <span className="text-xs text-[#95959d]">Select to inspect</span>
                  </div>

                  <div className="space-y-3">
                    {destinationArtifacts.map((art) => {
                      const isSelected = art.id === selectedArtifact.id;
                      return (
                        <button
                          key={art.id}
                          type="button"
                          onClick={() => handleSelectArtifact(art.id, false)}
                          className={`nasa-eyes-card w-full text-left p-5 rounded-sm cursor-pointer ${
                            isSelected ? 'active' : ''
                          }`}
                        >
                          <div className="text-lg font-normal text-[#ffffff] leading-snug">
                            {art.name}
                          </div>
                          <div className="text-[11px] font-mono tracking-[0.2em] uppercase text-[#b5945b] mt-2">
                            {art.hardwareType} · {art.arrivalDate}
                          </div>
                          <div className="flex items-center justify-between text-xs text-[#c6c6c9] mt-2 pt-2 border-t border-[#37373a]">
                            <span className="truncate max-w-[220px]">{art.mission}</span>
                            <span className={`font-mono ${getStatusClass(art.status)}`}>
                              ● {art.status}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right Column (7 cols): Detailed Artifact Profile */}
              <div className="lg:col-span-7">
                <article
                  ref={profileCardRef}
                  id="artifact-profile-card"
                  aria-label={`Detailed Artifact Profile: ${selectedArtifact.name}`}
                  className="bg-[#181818] border border-[#37373a] rounded-sm p-6 sm:p-8 space-y-6 scroll-mt-16"
                >
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#37373a] pb-5">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2 text-xs font-mono tracking-[0.14em] uppercase text-[#b5945b]">
                        <span>{selectedArtifact.hardwareType}</span>
                        <span aria-hidden="true">·</span>
                        <span>{selectedArtifact.mission}</span>
                        <span aria-hidden="true">·</span>
                        <span className={`font-semibold ${getStatusClass(selectedArtifact.status)}`}>
                          ● {selectedArtifact.status}
                        </span>
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-normal text-[#ffffff]">
                        {selectedArtifact.name}
                      </h2>
                    </div>

                    <button
                      type="button"
                      onClick={() => open3DModelForArtifact(selectedArtifact.model3dId)}
                      className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-[#000000] bg-[#ffffff] hover:bg-[#eaeaeb] rounded-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <Box className="w-4 h-4" />
                      <span>
                        {NASA_3D_MODELS.find((m) => m.id === selectedArtifact.model3dId)?.glbUrl
                          ? 'Inspect 3D Model (NASA GLB)'
                          : 'Inspect 3D Model'}
                      </span>
                    </button>
                  </div>

                  {/* Telemetry Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-[#000000] border border-[#37373a] rounded-sm p-4">
                    <div>
                      <div className="text-[11px] font-mono tracking-[0.14em] uppercase text-[#b5945b]">
                        Launch & Arrival
                      </div>
                      <div className="text-xs font-mono text-[#eaeaeb] mt-1">
                        Launched: {selectedArtifact.launchDate}
                      </div>
                      <div className="text-xs font-mono text-[#47da84]">
                        Arrived: {selectedArtifact.arrivalDate}
                      </div>
                    </div>

                    <div>
                      <div className="text-[11px] font-mono tracking-[0.14em] uppercase text-[#b5945b]">
                        Location / Trajectory
                      </div>
                      <div className="text-xs text-[#eaeaeb] mt-1">
                        {selectedArtifact.locationOrTrajectory}
                      </div>
                      {selectedArtifact.coordinates && (
                        <div className="text-[11px] font-mono text-[#c6c6c9]">
                          Coords: {selectedArtifact.coordinates}
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="text-[11px] font-mono tracking-[0.14em] uppercase text-[#b5945b]">
                        Dry Mass & End of Ops
                      </div>
                      <div className="text-xs font-mono text-[#eaeaeb] mt-1">
                        {selectedArtifact.massKg.toLocaleString()} kg
                      </div>
                      <div className="text-[11px] text-[#c6c6c9]">
                        {selectedArtifact.endDate || 'Ongoing Trajectory / Operations'}
                      </div>
                    </div>
                  </div>

                  {/* Narrative Story */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-mono tracking-[0.16em] uppercase text-[#b5945b]">
                      The Machine’s Story
                    </h3>
                    <p className="text-sm sm:text-base text-[#eaeaeb] leading-relaxed">
                      {selectedArtifact.story}
                    </p>
                  </div>

                  {/* Purpose & Why Left Behind */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div className="p-4 rounded-sm bg-[#252527] border border-[#37373a] space-y-1.5">
                      <div className="text-xs font-mono tracking-[0.12em] uppercase text-[#b5945b]">
                        Why It Was Sent (Mission Purpose)
                      </div>
                      <p className="text-xs text-[#eaeaeb] leading-relaxed">
                        {selectedArtifact.purpose}
                      </p>
                    </div>

                    <div className="p-4 rounded-sm bg-[#252527] border border-[#37373a] space-y-1.5">
                      <div className="text-xs font-mono tracking-[0.12em] uppercase text-[#b5945b]">
                        Why It Was Left Behind
                      </div>
                      <p className="text-xs text-[#eaeaeb] leading-relaxed">
                        {selectedArtifact.whyLeftBehind}
                      </p>
                    </div>
                  </div>

                  {/* Major Scientific Discoveries */}
                  <div className="space-y-2.5 pt-2">
                    <h3 className="text-xs font-mono tracking-[0.16em] uppercase text-[#b5945b]">
                      Major Scientific Discoveries & Contributions
                    </h3>
                    <ul className="space-y-2">
                      {selectedArtifact.discoveries.map((disc, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2.5 text-xs sm:text-sm text-[#eaeaeb]"
                        >
                          <span className="font-mono text-[#47da84] font-semibold">0{idx + 1}.</span>
                          <span>{disc}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Plain-English Glossary Term */}
                  {selectedArtifact.glossaryTerm && (
                    <div className="p-4 rounded-sm bg-[#252527] border border-[#37373a] flex items-start gap-3">
                      <BookOpen className="w-5 h-5 text-[#b5945b] shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <div className="text-xs font-mono tracking-[0.12em] uppercase text-[#b5945b]">
                          Space Term Explained: {selectedArtifact.glossaryTerm.term}
                        </div>
                        <p className="text-xs text-[#eaeaeb] leading-relaxed">
                          {selectedArtifact.glossaryTerm.definition}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Authoritative NASA Source Citation */}
                  <div className="pt-4 border-t border-[#37373a] flex flex-wrap items-center justify-between gap-4">
                    <div className="text-xs text-[#c6c6c9]">
                      Verified against official NASA & JPL mission archives
                    </div>
                    <a
                      href={selectedArtifact.nasaSourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-[#ffffff] bg-[#252527] hover:bg-[#37373a] border border-[#95959d]/30 rounded-sm transition-colors whitespace-nowrap"
                    >
                      <span>Source: {selectedArtifact.nasaSourceTitle}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </article>
              </div>
            </div>
          )}

          {activeTab === 'timeline' && (
            <div className="max-w-7xl w-full mx-auto px-5 sm:px-8 py-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#37373a] pb-4">
                <div>
                  <div className="text-xs font-mono tracking-[0.2em] uppercase text-[#b5945b]">
                    Chronological Mission Archive (1969 – Present)
                  </div>
                  <h2 className="text-2xl font-normal text-[#ffffff] mt-1">
                    Timeline of Left-Behind Space Hardware
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('orrery')}
                  className="text-xs font-medium text-[#47da84] hover:text-[#ffffff] cursor-pointer whitespace-nowrap"
                >
                  ← Return to Destination Inspector
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {timelineItems.map((item) => (
                  <div
                    key={item.id}
                    className="nasa-eyes-card rounded-sm p-5 flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-[#b5945b] tracking-[0.16em] font-semibold">
                          {item.year}
                        </span>
                        <span className={getStatusClass(item.status)}>● {item.status}</span>
                      </div>
                      <h3 className="text-lg font-normal text-[#ffffff]">{item.name}</h3>
                      <div className="text-xs text-[#c6c6c9] font-mono">
                        {item.mission} · {item.locationOrTrajectory}
                      </div>
                      <p className="text-xs text-[#eaeaeb] leading-relaxed">{item.purpose}</p>
                    </div>

                    <div className="pt-3 border-t border-[#37373a] flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => handleSelectArtifact(item.id, true)}
                        className="text-xs font-medium text-[#ffffff] hover:underline cursor-pointer"
                      >
                        Inspect in Explorer →
                      </button>
                      <a
                        href={item.nasaSourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-[#c6c6c9] hover:text-[#ffffff] inline-flex items-center gap-1"
                      >
                        <span>NASA</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'still-traveling' && (
            <div className="max-w-7xl w-full mx-auto px-5 sm:px-8 py-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#37373a] pb-4">
                <div>
                  <div className="text-xs font-mono tracking-[0.2em] uppercase text-[#b5945b]">
                    Interstellar & Kuiper Belt Ambassadors
                  </div>
                  <h2 className="text-2xl font-normal text-[#ffffff] mt-1">
                    Still Traveling: Spacecraft Escaping Our Solar System
                  </h2>
                  <p className="text-xs sm:text-sm text-[#c6c6c9] max-w-3xl mt-1">
                    Accelerated by planetary gravity assists, these probes are traveling faster than the
                    Sun’s gravity can pull them back—carrying golden records and plaques into the Milky
                    Way.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('orrery')}
                  className="text-xs font-medium text-[#47da84] hover:text-[#ffffff] cursor-pointer whitespace-nowrap"
                >
                  ← Return to Destination Inspector
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {travelingArtifacts.map((art) => (
                  <div
                    key={art.id}
                    className="nasa-eyes-card rounded-sm p-6 flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-[#b5945b] tracking-[0.12em] uppercase">
                          Launched {art.launchDate}
                        </span>
                        <span className="text-[#47da84] font-semibold">● {art.status}</span>
                      </div>
                      <h3 className="text-xl font-normal text-[#ffffff]">{art.name}</h3>
                      <div className="text-xs font-mono text-[#eaeaeb]">
                        {art.locationOrTrajectory}
                      </div>
                      <p className="text-xs text-[#c6c6c9] leading-relaxed">{art.story}</p>
                    </div>

                    <div className="pt-4 border-t border-[#37373a] flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => open3DModelForArtifact(art.model3dId)}
                        className="text-xs font-medium text-[#ffffff] hover:underline cursor-pointer"
                      >
                        Inspect 3D Spacecraft
                      </button>
                      <a
                        href={art.nasaSourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-[#c6c6c9] hover:text-[#ffffff] inline-flex items-center gap-1"
                      >
                        <span>NASA Archive</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================================================================
              GHOST MISSIONS GALLERY — QUIET LEGACY OF RETIRED & DORMANT HARDWARE
              (Always featured on the Home Page and highlighted in 'Ghost Missions' view)
              ================================================================ */}
          {(activeTab === 'orrery' || activeTab === 'silent-explorers') && (
            <section
              ref={ghostGalleryRef}
              id="ghost-missions-gallery"
              aria-label="Ghost Missions Gallery"
              className="ghost-gallery-section border-t border-[#37373a] pt-12 pb-24 sm:pb-16 scroll-mt-12"
            >
              <div className="max-w-7xl w-full mx-auto px-5 sm:px-8 space-y-8">
                {/* Gallery Header & Dormant/Retired Filter Bar */}
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-[#b5945b]/25 pb-6">
                  <div className="space-y-2 max-w-3xl">
                    <div className="inline-flex items-center gap-2 text-xs font-mono tracking-[0.22em] uppercase text-[#cd9745]">
                      <Radio className="w-3.5 h-3.5" />
                      <span>MEMORIAL ARCHIVE · LOSS OF SIGNAL & QUIET LEGACY</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-normal tracking-[-0.01em] text-[#ffffff]">
                      Ghost Missions Gallery
                    </h2>
                    <p className="text-xs sm:text-sm text-[#c6c6c9] leading-relaxed">
                      Long after their batteries fade or their final radio transmissions cross the dark,
                      these retired and dormant NASA machines endure—from the dust-covered{' '}
                      <strong className="text-[#eaeaeb]">Opportunity rover</strong> in Perseverance
                      Valley to the silent <strong className="text-[#eaeaeb]">Pioneer 10 & 11</strong>{' '}
                      probes coasting toward the stars.
                    </p>
                  </div>

                  {/* Filter Pills: All / Dormant / Retired */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {(
                      [
                        { id: 'all', label: `All Ghost Missions (${getGhostMissions(ARTIFACTS, 'all').length})` },
                        { id: 'Dormant', label: `Dormant (${getGhostMissions(ARTIFACTS, 'Dormant').length})` },
                        { id: 'Retired', label: `Retired (${getGhostMissions(ARTIFACTS, 'Retired').length})` },
                      ] as const
                    ).map((f) => {
                      const active = ghostStatusFilter === f.id;
                      return (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setGhostStatusFilter(f.id)}
                          className={`px-3.5 py-1.5 text-xs font-mono tracking-[0.1em] uppercase rounded-sm transition-all cursor-pointer ${
                            active
                              ? 'bg-[#cd9745] text-[#000000] font-semibold shadow-md'
                              : 'bg-[#181818] hover:bg-[#252527] text-[#c6c6c9] border border-[#37373a]'
                          }`}
                        >
                          {f.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Ghost Missions Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {ghostMissions.map((entry, idx) => {
                    const { artifact, ghostStatus, silenceYearLabel, lastTransmissionNote } = entry;
                    const isSelected = artifact.id === selectedArtifact.id;
                    const isDormant = ghostStatus === 'Dormant';

                    return (
                      <article
                        key={artifact.id}
                        style={{ animationDelay: `${idx * 65}ms` }}
                        className={`ghost-mission-card rounded-sm p-6 flex flex-col justify-between space-y-5 ${
                          isSelected ? 'is-selected' : ''
                        }`}
                      >
                        <div className="space-y-3.5">
                          {/* Top Archival Kicker & Status Badge (Dormant / Retired) */}
                          <div className="flex items-center justify-between gap-2 text-[11px] font-mono">
                            <span className="tracking-[0.16em] uppercase text-[#b5945b]">
                              {silenceYearLabel}
                            </span>
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-sm border text-[10.5px] tracking-[0.12em] uppercase font-semibold ${
                                isDormant
                                  ? 'bg-[#cd9745]/15 border-[#cd9745]/50 text-[#cd9745]'
                                  : 'bg-[#95959d]/15 border-[#95959d]/40 text-[#eaeaeb]'
                              }`}
                            >
                              <span>●</span>
                              <span>{ghostStatus}</span>
                            </span>
                          </div>

                          {/* Hardware Title & Mission Subtitle */}
                          <div>
                            <h3 className="text-lg sm:text-xl font-normal text-[#ffffff] leading-snug">
                              {artifact.name}
                            </h3>
                            <div className="text-xs font-mono text-[#c6c6c9] mt-1">
                              {artifact.mission} · {artifact.hardwareType}
                            </div>
                          </div>

                          {/* Brief Mission Description */}
                          <p className="text-xs sm:text-[13px] text-[#eaeaeb] leading-relaxed">
                            {artifact.purpose}
                          </p>

                          {/* Quiet Legacy / Final Signal Plaque with Carrier Flatline SVG */}
                          <div className="p-3.5 rounded-sm bg-[#0b0b0d]/90 border border-[#b5945b]/20 space-y-2">
                            <div className="flex items-center justify-between gap-2 text-[10px] font-mono tracking-[0.14em] uppercase text-[#b5945b]">
                              <span>FINAL TELEMETRY & RESTING SITE</span>
                              <svg
                                width="54"
                                height="10"
                                viewBox="0 0 54 10"
                                fill="none"
                                aria-hidden="true"
                                className="opacity-75"
                              >
                                <path
                                  d="M0 5 H12 L15 1.5 L18 8.5 L21 3 L24 7 L27 5 H54"
                                  stroke="#cd9745"
                                  strokeWidth="1.2"
                                />
                              </svg>
                            </div>
                            <div className="text-[11px] font-mono text-[#eaeaeb]">
                              {artifact.locationOrTrajectory}
                            </div>
                            <div className="text-[11px] text-[#c6c6c9] leading-relaxed">
                              {lastTransmissionNote}
                            </div>
                          </div>
                        </div>

                        {/* Card Footer: Link to Detailed Profile + 3D Model + NASA Source */}
                        <div className="pt-4 border-t border-[#37373a] flex flex-wrap items-center justify-between gap-3">
                          <button
                            type="button"
                            onClick={() => handleSelectArtifact(artifact.id, true)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-[#ffffff] text-[#000000] hover:bg-[#eaeaeb] rounded-sm transition-colors cursor-pointer"
                          >
                            <span>View Detailed Profile →</span>
                          </button>

                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => open3DModelForArtifact(artifact.model3dId)}
                              className="text-xs font-mono text-[#cd9745] hover:text-[#ffffff] transition-colors cursor-pointer"
                            >
                              3D Model
                            </button>
                            <a
                              href={artifact.nasaSourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-[#95959d] hover:text-[#ffffff] inline-flex items-center gap-1"
                            >
                              <span>NASA</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            </section>
          )}
        </section>
      </main>

      {/* Interactive 3D Model Library Modal */}
      <ModelViewerModal
        isOpen={modelModalOpen}
        initialModelId={modelModalTargetId}
        onClose={() => setModelModalOpen(false)}
      />

      {/* Persistent Explorer Guide Chatbot */}
      <ExplorerGuideChat
        selectedDestinationId={selectedDestinationId}
        selectedArtifactId={selectedArtifact.id}
        onSelectArtifact={(id) => handleSelectArtifact(id, true)}
      />
    </div>
  );
};

import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ARTIFACTS, NASA_3D_MODELS, type SpaceArtifact } from '../data/spaceData';
import { ExplorerGuideChat } from '../components/ExplorerGuideChat';
import { ModelViewerModal } from '../components/ModelViewerModal';

/**
 * Character-by-character rolling hover animation (.roll > .rl > (.rl-a + .rl-b) > .rl-c)
 * Exact replica of Pe() in jehaduddin.vercel.app
 */
function RollingText({ text }: { text: string }) {
  const chars = Array.from(text);
  return (
    <span className="roll" aria-label={text}>
      <span className="rl" aria-hidden="true">
        <span className="rl-a">
          {chars.map((ch, idx) => (
            <span
              key={`a-${idx}`}
              className="rl-c"
              style={{ '--i': idx } as React.CSSProperties}
            >
              {ch === ' ' ? '\u00A0' : ch}
            </span>
          ))}
        </span>
        <span className="rl-b">
          {chars.map((ch, idx) => (
            <span
              key={`b-${idx}`}
              className="rl-c"
              style={{ '--i': idx } as React.CSSProperties}
            >
              {ch === ' ' ? '\u00A0' : ch}
            </span>
          ))}
        </span>
      </span>
    </span>
  );
}

/**
 * Odometer Rolling Digits (.ln-d > .ln-s > span 0..9)
 * Exact replica of Pr() in jehaduddin.vercel.app
 */
function OdometerNumber({ value }: { value: number }) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  const digits = String(clamped).padStart(2, '0').split('');
  return (
    <div className="jehad-loader-num" aria-label={`Loading ${clamped} percent`}>
      {digits.map((digitChar, idx) => {
        const d = Number(digitChar);
        return (
          <span key={idx} className="ln-d">
            <span
              className="ln-s"
              style={{ transform: `translate3d(0, ${-d * 10}%, 0)` }}
            >
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                <span key={n}>{n}</span>
              ))}
            </span>
          </span>
        );
      })}
    </div>
  );
}

interface StoryBeat {
  id: string;
  pStart: number;
  pEnd: number;
  chapterNum: string;
  chapterTitle: string;
  lines: string[];
  flipRight?: boolean;
  centerBeat?: boolean;
  surfaceBeat?: boolean;
  ctaLabel?: string;
  ctaTarget?: string;
}

const STORY_BEATS: StoryBeat[] = [
  {
    id: 'ground',
    pStart: 0.05,
    pEnd: 0.16,
    chapterNum: '01',
    chapterTitle: 'The Ground — Sea of Tranquility',
    lines: [
      'A gold-wrapped descent stage sits in vacuum.',
      'Left behind so two astronauts could lift off and come home.',
    ],
  },
  {
    id: 'adrift',
    pStart: 0.17,
    pEnd: 0.28,
    chapterNum: '02',
    chapterTitle: 'Lunar Dust — Six Apollo Sites',
    lines: [
      'Three electric rovers and laser mirrors still face Earth.',
      'Bouncing light back across 384,400 kilometers of dark.',
    ],
    flipRight: true,
    ctaLabel: 'Inspect Lunar Hardware →',
    ctaTarget: 'lunar-hardware',
  },
  {
    id: 'push',
    pStart: 0.29,
    pEnd: 0.40,
    chapterNum: '03',
    chapterTitle: 'The Red Horizon — Martian Fleet',
    lines: [
      'Across rust-red craters, silent solar wings gather dust.',
      'Opportunity sent one last reading after 5,111 sols: my battery is low.',
    ],
    ctaLabel: 'Inspect Martian Fleet →',
    ctaTarget: 'martian-fleet',
  },
  {
    id: 'gravity-well',
    pStart: 0.41,
    pEnd: 0.52,
    chapterNum: '04',
    chapterTitle: 'Gravity Assist — The Outer Giants',
    lines: [
      'Falling into Jupiter and Saturn’s deep gravity wells.',
      'Trading orbital momentum to fling machines beyond the planets.',
    ],
    flipRight: true,
  },
  {
    id: 'pieces',
    pStart: 0.53,
    pEnd: 0.70,
    chapterNum: '05',
    chapterTitle: 'Pieces of a World — Hardware Fragments',
    lines: [
      'Every discarded heat shield, seismometer, and probe',
      'is a time capsule of human curiosity.',
    ],
  },
  {
    id: 'interstellar',
    pStart: 0.71,
    pEnd: 0.83,
    chapterNum: '06',
    chapterTitle: 'The Dark — 24 Billion Kilometers Out',
    lines: [
      'Beyond the heliopause, Voyager 1 & 2 carry a golden phonograph record',
      'into the quiet between stars.',
    ],
    centerBeat: true,
    ctaLabel: 'Inspect Deep-Space Probes →',
    ctaTarget: 'deep-space-probes',
  },
  {
    id: 'dawn-surface',
    pStart: 0.84,
    pEnd: 0.96,
    chapterNum: '07',
    chapterTitle: 'The Surface — Earth & Beyond',
    lines: [
      'They do not return, yet their telemetry changed how we see home.',
      'Step into the interactive solar system or explore the archive below.',
    ],
    centerBeat: true,
    surfaceBeat: true,
  },
];

interface FloatingRockFragment {
  index: number;
  code: string;
  name: string;
  mission: string;
  year: string;
  location: string;
  status: string;
  tag: string;
  line: string;
  story: string;
  science: string[];
  nasaUrl: string;
  destinationId: string;
  artifactId: string;
  baseAngle: number;
  radiusOffset: number;
  yOffset: number;
  tint: string;
}

const FLOATING_FRAGMENTS: FloatingRockFragment[] = [
  {
    index: 0,
    code: '01',
    name: 'Apollo 11 Descent Stage & LRRR',
    mission: 'Apollo 11 — Mare Tranquillitatis',
    year: '1969',
    location: '0.674° N, 23.473° E (Moon)',
    status: 'Retired Stage / Active Mirror',
    tag: 'Lunar Surface · 1969',
    line: 'The octagonal gold-foil landing base and quartz corner-cube mirror array still reflecting Earth lasers.',
    story:
      'To launch Neil Armstrong and Buzz Aldrin safely back to lunar orbit, the heavy lower half of Eagle stayed behind as a launchpad. Nearby sits the Lunar Laser Ranging Retroreflector—an unpowered quartz prism array that scientists still ping with lasers today.',
    science: [
      'Proved the Moon is receding from Earth at 3.8 centimeters per year',
      'Revealed a fluid lunar core through millimeter-precision laser ranging',
      'Tested Einstein’s Equivalence Principle across five decades',
    ],
    nasaUrl: 'https://www.nasa.gov/mission/apollo-11/',
    destinationId: 'moon',
    artifactId: 'apollo-11-eagle-descent',
    baseAngle: -0.95,
    radiusOffset: 0.28,
    yOffset: -0.14,
    tint: '#e9e7e1',
  },
  {
    index: 1,
    code: '02',
    name: 'Opportunity Rover & Ingenuity',
    mission: 'Mars Exploration Rover-B / Mars 2020',
    year: '2004–2024',
    location: 'Perseverance Valley & Neretva Vallis (Mars)',
    status: 'Retired Monument',
    tag: 'Martian Surface · 5,111 Sols',
    line: 'A 90-day golf-cart rover that drove 45 km across ancient seabeds, and the first aircraft on another world.',
    story:
      'Designed for just 90 Martian sols, Opportunity explored Mars for nearly 15 Earth years before a planet-encircling dust storm in 2018 ended contact. Across the planet in Jezero Crater rests Ingenuity, which flew 72 powered flights in air only 1% as thick as Earth’s.',
    science: [
      'Discovered hematite “blueberries” proving liquid water once soaked Mars',
      'Logged the longest off-Earth driving distance (45.16 km) on Mars',
      'Proved aerodynamic rotorcraft flight in an extraterrestrial atmosphere',
    ],
    nasaUrl: 'https://science.nasa.gov/mission/mer-opportunity/',
    destinationId: 'mars',
    artifactId: 'opportunity-rover',
    baseAngle: -0.28,
    radiusOffset: 0.24,
    yOffset: 0.16,
    tint: '#e8b89f',
  },
  {
    index: 2,
    code: '03',
    name: 'Cassini-Huygens & Galileo Probes',
    mission: 'Outer Planet Flagships',
    year: '1995–2017',
    location: 'Titan Surface & Saturn/Jupiter Atmospheres',
    status: 'Dormant Lander / Vaporized Orbiters',
    tag: 'Outer Giants · Titan & Jupiter',
    line: 'A saucer resting on Titan’s methane gravel floodplain and orbiters sacrificed to protect ocean moons.',
    story:
      'In 2005, the Huygens probe parachuted through Titan’s orange haze and landed on pebbles of water ice frozen harder than granite. Twelve years later, Cassini plunged into Saturn’s clouds so it could never contaminate Enceladus’s subsurface ocean.',
    science: [
      'Executed the farthest landing from Earth on Saturn’s moon Titan',
      'Sampled organic plumes erupting from Enceladus’s warm subsurface sea',
      'Measured Jupiter’s bone-dry hot spots with the Galileo atmospheric probe',
    ],
    nasaUrl: 'https://science.nasa.gov/mission/cassini/',
    destinationId: 'saturn',
    artifactId: 'cassini-huygens',
    baseAngle: 0.38,
    radiusOffset: 0.27,
    yOffset: -0.11,
    tint: '#d8cfb8',
  },
  {
    index: 3,
    code: '04',
    name: 'Voyager 1, Voyager 2 & Golden Record',
    mission: 'Voyager Interstellar Mission',
    year: '1977–Present',
    location: 'Interstellar Space (24.6B km from Earth)',
    status: 'Still Traveling',
    tag: 'Interstellar Medium · 17 km/s',
    line: 'Humanity’s farthest functioning ambassadors, carrying a gold-plated copper record into the Milky Way.',
    story:
      'Launched in 1977 on a once-in-176-year Grand Tour of the outer planets, both Voyagers have crossed the heliopause into interstellar space. Bolted to each aluminum bus is a 12-inch gold-plated copper phonograph record of Earth’s music, greetings, and coordinates.',
    science: [
      'First human-made spacecraft to sample the interstellar medium directly',
      'Discovered active sulfur volcanoes on Io and geysers on Neptune’s moon Triton',
      'Carries the Golden Record engineered to endure for over one billion years',
    ],
    nasaUrl: 'https://science.nasa.gov/mission/voyager/',
    destinationId: 'deep-space',
    artifactId: 'voyager-1-2',
    baseAngle: 0.96,
    radiusOffset: 0.29,
    yOffset: 0.14,
    tint: '#b4c8e2',
  },
];

// Smoothstep helper ($e in reference)
function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0 || 1)));
  return t * t * (3 - 2 * t);
}

// Color interpolation helper matching _t in reference
function lerpHex(hexA: string, hexB: string, t: number): [number, number, number] {
  const cA = parseInt(hexA.slice(1), 16);
  const cB = parseInt(hexB.slice(1), 16);
  const rA = (cA >> 16) & 255;
  const gA = (cA >> 8) & 255;
  const bA = cA & 255;
  const rB = (cB >> 16) & 255;
  const gB = (cB >> 8) & 255;
  const bB = cB & 255;
  return [
    Math.round(rA + (rB - rA) * t),
    Math.round(gA + (gB - gA) * t),
    Math.round(bA + (bB - bA) * t),
  ];
}

function rgbStr(rgb: [number, number, number], alpha = 1): string {
  return alpha >= 1
    ? `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`
    : `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha.toFixed(3)})`;
}

/**
 * Exact Dawn Color Stop Interpolation (_t in jehaduddin.vercel.app)
 * d = 0 -> 0.2 -> 0.36 -> 0.62 -> 1.0
 */
function sampleDawnPalette(d: number) {
  const stops = [
    { d: 0.0, top: '#000000', hor: '#000000', mist: '#000000', floor: '#000000', sun: '#000000' },
    { d: 0.2, top: '#030817', hor: '#0e1a36', mist: '#161b2e', floor: '#050914', sun: '#ff9d5c' },
    { d: 0.36, top: '#0c1d4a', hor: '#3e5f9e', mist: '#6e5259', floor: '#0e1a33', sun: '#ffb070' },
    { d: 0.62, top: '#5b74a3', hor: '#e8b89f', mist: '#ead0be', floor: '#586882', sun: '#ffc596' },
    { d: 1.0, top: '#b4c8e2', hor: '#f3e8dc', mist: '#f5f0e9', floor: '#cdd5da', sun: '#fff0d8' },
  ];
  const clamped = Math.max(0, Math.min(1, d));
  let i = 0;
  while (i < stops.length - 2 && clamped > stops[i + 1].d) {
    i++;
  }
  const s0 = stops[i];
  const s1 = stops[i + 1];
  const localT = smoothstep(s0.d, s1.d, clamped);
  return {
    top: lerpHex(s0.top, s1.top, localT),
    hor: lerpHex(s0.hor, s1.hor, localT),
    mist: lerpHex(s0.mist, s1.mist, localT),
    floor: lerpHex(s0.floor, s1.floor, localT),
    sun: lerpHex(s0.sun, s1.sun, localT),
  };
}

export function LandingPage() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const journeyRef = useRef<HTMLDivElement | null>(null);

  // Loader state (.jehad-loader -> .opening -> .ready)
  const [loadPct, setLoadPct] = useState<number>(18);
  const [loaderPhase, setLoaderPhase] = useState<'loading' | 'opening' | 'ready'>('loading');
  const [irisRadius, setIrisRadius] = useState<number>(0);

  // Scroll & navigation state
  const [scrollProgress, setScrollProgress] = useState<number>(0); // 0..1 across the 360vh scroll journey
  const [isPaperChrome, setIsPaperChrome] = useState<boolean>(false);
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const [creditsOpen, setCreditsOpen] = useState<boolean>(false);
  const [routeDive, setRouteDive] = useState<boolean>(false);
  const [showVideoModal, setShowVideoModal] = useState<boolean>(false);

  // Interactive 3D Floating Fragment state (.rock-label & .overlay)
  const [hoveredFragmentIdx, setHoveredFragmentIdx] = useState<number>(0);
  const [selectedFragment, setSelectedFragment] = useState<FloatingRockFragment | null>(null);
  const [fragmentAnchor, setFragmentAnchor] = useState<{ x: number; y: number }>({ x: 560, y: 380 });

  // Selected Hardware Gallery state (.gal-info)
  const [galleryIndex, setGalleryIndex] = useState<number>(0);
  const [galleryDir, setGalleryDir] = useState<1 | -1>(1);

  // Hardware Ledger filter state
  const [ledgerRegion, setLedgerRegion] = useState<'all' | 'moon' | 'mars' | 'deep-space'>('all');

  // Live UTC Clock in Footer (.so)
  const [utcTime, setUtcTime] = useState<string>('');

  // Direct 3D Model Viewer state (opens exact model clicked without redirecting to generic library)
  const [modelViewerOpen, setModelViewerOpen] = useState<boolean>(false);
  const [directModelId, setDirectModelId] = useState<string>('saturn-3d');

  const openDirect3DModel = (modelId: string) => {
    setDirectModelId(modelId);
    setModelViewerOpen(true);
  };

  // Mutable ref for 60fps canvas animation loop
  const animStateRef = useRef({
    scrollP: 0,
    targetP: 0,
    px: 0,
    py: 0,
    targetPx: 0,
    targetPy: 0,
    hoveredRock: 0,
    projectedRocks: [
      { x: 0, y: 0, r: 42 },
      { x: 0, y: 0, r: 42 },
      { x: 0, y: 0, r: 42 },
      { x: 0, y: 0, r: 42 },
    ],
    trail: [] as { x: number; y: number; vx: number; vy: number; life: number }[],
  });

  // 1. Odometer Loader & Radial Iris Opening sequence
  useEffect(() => {
    let rafId = 0;
    const start = performance.now();
    const loadDuration = 420; // crisp 420ms odometer count 18 -> 100
    const irisDuration = 520; // smooth radial iris open

    const step = (now: number) => {
      const elapsed = now - start;
      if (elapsed < loadDuration) {
        const t = elapsed / loadDuration;
        const eased = 1 - Math.pow(1 - t, 3);
        setLoadPct(Math.round(18 + eased * 82));
        rafId = requestAnimationFrame(step);
      } else if (elapsed < loadDuration + irisDuration) {
        setLoadPct(100);
        setLoaderPhase('opening');
        const it = (elapsed - loadDuration) / irisDuration;
        const easedIris = it * it * (3 - 2 * it);
        setIrisRadius(easedIris * 145);
        rafId = requestAnimationFrame(step);
      } else {
        setLoadPct(100);
        setIrisRadius(150);
        setLoaderPhase('ready');
      }
    };

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, []);

  // 2. UTC Clock updater
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setUtcTime(
        now.toLocaleTimeString('en-US', {
          timeZone: 'UTC',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        }) + ' UTC'
      );
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  // 3. Scroll listener syncing journey progress & paper chrome mode
  useEffect(() => {
    const onScroll = () => {
      const scrollY = window.scrollY;
      const vh = Math.max(window.innerHeight, 1);
      const journeyEl = journeyRef.current;
      const journeyHeight = journeyEl ? Math.max(journeyEl.offsetHeight - vh, vh * 2.6) : vh * 2.6;
      const p = Math.max(0, Math.min(1, scrollY / journeyHeight));
      animStateRef.current.targetP = p;
      setScrollProgress(p);

      // Switch header chrome to dark paper ink when over the dawn sky (p > 0.82) or warm paper sections
      const ledgerEl = document.getElementById('mission-ledger');
      let overPaperSection = p > 0.82 && p < 0.99;
      if (ledgerEl) {
        const rect = ledgerEl.getBoundingClientRect();
        if (rect.top <= 72 && rect.bottom >= 72) {
          overPaperSection = true;
        }
      }
      setIsPaperChrome(overPaperSection);
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  // 4. Full-Viewport Canvas Stage (.jehad-gl) replicating all 4 reference acts with batched sub-2ms rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let animationFrameId = 0;
    let width = window.innerWidth;
    let height = window.innerHeight;

    const handleResize = () => {
      if (!canvas) return;
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    // Pre-generate 650 stardust particles (batched into 2 Path draws per frame for ultra-fast rendering)
    const particles = Array.from({ length: 650 }, (_, i) => {
      const u1 = ((i * 73) % 997) / 997;
      const u2 = ((i * 199) % 991) / 991;
      const angle = u1 * Math.PI * 2;
      const radius = Math.pow(u2, 0.62);
      return {
        seed: u1,
        angle,
        radius,
        yNorm: ((i * 313) % 983) / 983,
        size: i % 15 === 0 ? 2.2 : i % 4 === 0 ? 1.45 : 0.95,
        speed: 0.25 + u2 * 0.85,
        isWarm: i % 5 === 0,
      };
    });

    // Pre-generate 28 rising dark lunar rock shards in the central shaft of light (matching poster.jpg)
    const risingShards = Array.from({ length: 28 }, (_, i) => ({
      xSpread: (((i * 61) % 100) / 100 - 0.5) * 2,
      yBase: ((i * 43) % 100) / 100,
      size: 3 + ((i * 29) % 10),
      rotSpeed: (i % 2 === 0 ? 1 : -1) * (0.4 + (i % 5) * 0.2),
      sides: 5 + (i % 3),
    }));

    const onPointerMove = (e: PointerEvent) => {
      const nx = (e.clientX / Math.max(width, 1)) * 2 - 1;
      const ny = (e.clientY / Math.max(height, 1)) * 2 - 1;
      animStateRef.current.targetPx = nx;
      animStateRef.current.targetPy = ny;

      if (animStateRef.current.trail.length < 24) {
        animStateRef.current.trail.push({
          x: e.clientX,
          y: e.clientY,
          vx: (Math.random() - 0.5) * 0.8,
          vy: -0.4 - Math.random() * 0.6,
          life: 1.0,
        });
      }

      const p = animStateRef.current.scrollP;
      if (p >= 0.44 && p <= 0.76) {
        let closestIdx = -1;
        let minDist = 85;
        animStateRef.current.projectedRocks.forEach((rock, idx) => {
          const dist = Math.hypot(e.clientX - rock.x, e.clientY - rock.y);
          if (dist < minDist) {
            minDist = dist;
            closestIdx = idx;
          }
        });
        if (closestIdx !== -1 && closestIdx !== animStateRef.current.hoveredRock) {
          animStateRef.current.hoveredRock = closestIdx;
          setHoveredFragmentIdx(closestIdx);
          const proj = animStateRef.current.projectedRocks[closestIdx];
          if (proj) {
            setFragmentAnchor({ x: proj.x, y: proj.y });
          }
        }
      }
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });

    const render = (timeMs: number) => {
      const journeyBottom = journeyRef.current ? journeyRef.current.offsetHeight : height * 3.6;
      if (window.scrollY > journeyBottom + 40) {
        timerId = window.setTimeout(() => {
          animationFrameId = requestAnimationFrame(render);
        }, 120);
        return;
      }

      const t = timeMs * 0.001;
      const st = animStateRef.current;

      st.scrollP += (st.targetP - st.scrollP) * 0.18;
      st.px += (st.targetPx - st.px) * 0.1;
      st.py += (st.targetPy - st.py) * 0.1;

      const p = st.scrollP;
      const cx = width * 0.5 + st.px * 22;
      const cy = height * 0.46 + st.py * 16;

      const canyonWeight = 1 - smoothstep(0.24, 0.38, p);
      const marsWeight = smoothstep(0.22, 0.34, p) * (1 - smoothstep(0.42, 0.52, p));
      const gravityWeight = smoothstep(0.36, 0.45, p) * (1 - smoothstep(0.56, 0.66, p));
      const rocksWeight = smoothstep(0.48, 0.56, p) * (1 - smoothstep(0.70, 0.79, p));
      const dawnProgress = smoothstep(0.76, 0.96, p);

      // 1. Background Sky / Vacuum Fill
      if (dawnProgress > 0.005) {
        const pal = sampleDawnPalette(dawnProgress);
        const horizonY = height * (0.62 - dawnProgress * 0.04);
        const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
        skyGrad.addColorStop(0, rgbStr(pal.top));
        skyGrad.addColorStop(0.72, rgbStr(pal.hor));
        skyGrad.addColorStop(1, rgbStr(pal.mist));
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, width, horizonY + 2);

        const waterGrad = ctx.createLinearGradient(0, horizonY, 0, height);
        waterGrad.addColorStop(0, rgbStr(pal.mist));
        waterGrad.addColorStop(0.35, rgbStr(pal.hor));
        waterGrad.addColorStop(1, rgbStr(pal.floor));
        ctx.fillStyle = waterGrad;
        ctx.fillRect(0, horizonY, width, height - horizonY);

        const sunX = width * 0.5 + st.px * 18;
        const sunY = horizonY - dawnProgress * height * 0.09;
        const sunGlow = ctx.createRadialGradient(sunX, sunY, 4, sunX, sunY, Math.max(width, height) * 0.4);
        sunGlow.addColorStop(0, rgbStr(pal.sun, 0.92 * dawnProgress));
        sunGlow.addColorStop(0.3, rgbStr(pal.sun, 0.3 * dawnProgress));
        sunGlow.addColorStop(1, 'rgba(255, 240, 216, 0)');
        ctx.fillStyle = sunGlow;
        ctx.fillRect(0, 0, width, height);

        // Shimmering Cox-Munk water glitter road
        ctx.fillStyle = rgbStr(pal.sun, 0.42 * dawnProgress);
        ctx.beginPath();
        for (let i = 0; i < 36; i++) {
          const wy = horizonY + 6 + Math.pow(i / 36, 1.45) * (height - horizonY - 12);
          const spread = (14 + (i / 36) * 135) * (0.7 + 0.3 * Math.sin(t * 2.2 + i * 1.7));
          const wx = sunX + Math.sin(t * 1.3 + i * 2.3) * (8 + i * 0.6);
          ctx.rect(wx - spread * 0.5, wy, spread, 1.6);
        }
        ctx.fill();
      } else {
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, width, height);
      }

      // 2. Act I: Lunar Canyon Walls, Vertical Shaft of Starlight & Luminous Crater Floor
      if (canyonWeight > 0.01) {
        ctx.save();
        ctx.globalAlpha = canyonWeight;

        const shaftX = width * 0.5 + st.px * 14;
        const floorY = height * 0.78 + st.py * 10;

        const beamGrad = ctx.createRadialGradient(
          shaftX,
          height * 0.42,
          8,
          shaftX,
          height * 0.48,
          Math.min(width, height) * 0.44
        );
        beamGrad.addColorStop(0, 'rgba(242, 245, 255, 0.28)');
        beamGrad.addColorStop(0.35, 'rgba(210, 222, 245, 0.11)');
        beamGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = beamGrad;
        ctx.fillRect(0, 0, width, height);

        const colWidth = Math.max(42, width * 0.055);
        const colGrad = ctx.createLinearGradient(shaftX - colWidth, 0, shaftX + colWidth, 0);
        colGrad.addColorStop(0, 'rgba(233, 231, 225, 0)');
        colGrad.addColorStop(0.5, `rgba(248, 249, 255, ${Math.max(0, 0.22 * (1 - p * 1.4))})`);
        colGrad.addColorStop(1, 'rgba(233, 231, 225, 0)');
        ctx.fillStyle = colGrad;
        ctx.fillRect(shaftX - colWidth, height * 0.06, colWidth * 2, floorY - height * 0.04);

        const floorGrad = ctx.createRadialGradient(shaftX, floorY + 20, 10, shaftX, floorY + 40, width * 0.32);
        floorGrad.addColorStop(0, 'rgba(233, 231, 225, 0.46)');
        floorGrad.addColorStop(0.4, 'rgba(182, 186, 198, 0.18)');
        floorGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = floorGrad;
        ctx.fillRect(0, floorY - 80, width, height - floorY + 80);

        const wallSpread = p * width * 0.22;
        for (let layer = 0; layer < 4; layer++) {
          const depthT = layer / 3;
          const leftEdge = width * (0.28 - depthT * 0.09) - wallSpread + st.px * (8 + layer * 4);
          const rightEdge = width * (0.72 + depthT * 0.09) + wallSpread + st.px * (8 + layer * 4);
          const shade = Math.round(24 - depthT * 18);

          ctx.fillStyle = `rgb(${shade}, ${shade + 1}, ${shade + 4})`;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          for (let y = 0; y <= height; y += 36) {
            const ny = y / height;
            const pinch = Math.sin(ny * Math.PI) * width * 0.055;
            const rib = Math.sin(ny * 26 + layer * 1.9) * 14 + Math.cos(ny * 64 - layer) * 5;
            ctx.lineTo(leftEdge + pinch + rib, y);
          }
          ctx.lineTo(0, height);
          ctx.closePath();

          ctx.moveTo(width, 0);
          for (let y = 0; y <= height; y += 36) {
            const ny = y / height;
            const pinch = Math.sin(ny * Math.PI) * width * 0.055;
            const rib = Math.sin(ny * 24 + layer * 2.1) * 14 + Math.cos(ny * 58 + layer) * 5;
            ctx.lineTo(rightEdge - pinch + rib, y);
          }
          ctx.lineTo(width, height);
          ctx.closePath();
          ctx.fill();
        }

        // Apollo Descent Stage silhouette on crater floor
        ctx.save();
        ctx.translate(shaftX, floorY - 6);
        ctx.strokeStyle = 'rgba(233, 231, 225, 0.45)';
        ctx.fillStyle = 'rgba(18, 20, 25, 0.92)';
        ctx.lineWidth = 1.1;
        ctx.fillRect(-20, -14, 40, 12);
        ctx.strokeRect(-20, -14, 40, 12);
        ctx.beginPath();
        ctx.moveTo(-20, -12);
        ctx.lineTo(-36, 4);
        ctx.moveTo(20, -12);
        ctx.lineTo(36, 4);
        ctx.stroke();
        ctx.restore();

        // Rising dark lunar rock shards
        ctx.fillStyle = 'rgba(22, 24, 29, 0.92)';
        ctx.strokeStyle = 'rgba(233, 231, 225, 0.38)';
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        risingShards.forEach((shard, idx) => {
          const riseY = ((shard.yBase - t * 0.035 - p * 0.45) % 1 + 1) % 1;
          const sy = height * (0.14 + riseY * 0.66);
          const funnelWidth = 22 + Math.pow(1 - riseY, 1.5) * (width * 0.16);
          const sx = shaftX + shard.xSpread * funnelWidth + Math.sin(t * 0.8 + idx) * 6;
          const sSize = shard.size * (0.65 + (1 - riseY) * 0.55);
          const rot = t * shard.rotSpeed + idx;
          for (let v = 0; v < shard.sides; v++) {
            const a = rot + (v / shard.sides) * Math.PI * 2;
            const r = sSize * (v % 2 === 0 ? 1 : 0.68);
            const px = sx + Math.cos(a) * r;
            const py = sy + Math.sin(a) * r;
            if (v === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
        });
        ctx.fill();
        ctx.stroke();

        ctx.restore();
      }

      // 3. Swirling Stardust Plume / Martian Dust / Relativistic Keplerian Ring (Batched into 2 fills)
      if (dawnProgress < 0.95) {
        const dustAlpha = 1 - dawnProgress * 0.92;
        const maxR = Math.min(width, height) * 0.44;

        ctx.fillStyle =
          gravityWeight > 0.15
            ? `rgba(205, 226, 255, ${(0.78 * dustAlpha).toFixed(3)})`
            : `rgba(240, 242, 248, ${(0.76 * dustAlpha).toFixed(3)})`;
        ctx.beginPath();
        particles.forEach((pt, idx) => {
          if (pt.isWarm) return;
          const orbitalAngle = pt.angle + t * (0.12 + (1 - pt.radius) * 0.28) + p * 3.2;
          const plumeSpread = (0.08 + Math.pow(pt.yNorm, 1.35) * 0.92) * maxR * 0.85;
          const plumeX = cx + Math.cos(orbitalAngle * 0.7 + idx) * plumeSpread * (0.55 + pt.radius * 0.65);
          const plumeY = height * (0.12 + pt.yNorm * 0.64) + Math.sin(orbitalAngle + idx * 0.5) * 18 + st.py * 14;

          const ringR = (0.24 + pt.radius * 0.72) * maxR;
          const tilt = 0.34 + Math.sin(p * Math.PI) * 0.12;
          const discX = cx + Math.cos(orbitalAngle) * ringR;
          const discY = cy + Math.sin(orbitalAngle) * ringR * tilt;

          const wideX = ((pt.seed * width * 1.3 + t * 8 * pt.speed) % width + width) % width;
          const wideY = ((pt.yNorm * height * 1.2 + st.py * 20) % height + height) % height;

          let x = plumeX;
          let y = plumeY;
          if (p > 0.22 && p <= 0.58) {
            const m = smoothstep(0.22, 0.38, p);
            x = plumeX + (discX - plumeX) * m;
            y = plumeY + (discY - plumeY) * m;
          } else if (p > 0.58) {
            const m = smoothstep(0.58, 0.74, p);
            x = discX + (wideX - discX) * m;
            y = discY + (wideY - discY) * m;
          }
          ctx.rect(x, y, pt.size, pt.size);
        });
        ctx.fill();

        ctx.fillStyle =
          marsWeight > 0.15 || gravityWeight > 0.15
            ? `rgba(238, 190, 156, ${(0.82 * dustAlpha).toFixed(3)})`
            : `rgba(255, 255, 255, ${(0.88 * dustAlpha).toFixed(3)})`;
        ctx.beginPath();
        particles.forEach((pt, idx) => {
          if (!pt.isWarm) return;
          const orbitalAngle = pt.angle + t * (0.12 + (1 - pt.radius) * 0.28) + p * 3.2;
          const plumeSpread = (0.08 + Math.pow(pt.yNorm, 1.35) * 0.92) * maxR * 0.85;
          const plumeX = cx + Math.cos(orbitalAngle * 0.7 + idx) * plumeSpread * (0.55 + pt.radius * 0.65);
          const plumeY = height * (0.12 + pt.yNorm * 0.64) + Math.sin(orbitalAngle + idx * 0.5) * 18 + st.py * 14;

          const ringR = (0.24 + pt.radius * 0.72) * maxR;
          const tilt = 0.34 + Math.sin(p * Math.PI) * 0.12;
          const discX = cx + Math.cos(orbitalAngle) * ringR;
          const discY = cy + Math.sin(orbitalAngle) * ringR * tilt;

          const wideX = ((pt.seed * width * 1.3 + t * 8 * pt.speed) % width + width) % width;
          const wideY = ((pt.yNorm * height * 1.2 + st.py * 20) % height + height) % height;

          let x = plumeX;
          let y = plumeY;
          if (p > 0.22 && p <= 0.58) {
            const m = smoothstep(0.22, 0.38, p);
            x = plumeX + (discX - plumeX) * m;
            y = plumeY + (discY - plumeY) * m;
          } else if (p > 0.58) {
            const m = smoothstep(0.58, 0.74, p);
            x = discX + (wideX - discX) * m;
            y = discY + (wideY - discY) * m;
          }
          ctx.rect(x, y, pt.size, pt.size);
        });
        ctx.fill();

        if (gravityWeight > 0.02) {
          const bhR = Math.min(width, height) * 0.11 * (0.85 + gravityWeight * 0.25);
          const lensGrad = ctx.createRadialGradient(cx, cy, bhR * 0.85, cx, cy, bhR * 2.2);
          lensGrad.addColorStop(0, 'rgba(0, 0, 0, 0.96)');
          lensGrad.addColorStop(0.45, `rgba(255, 212, 168, ${0.55 * gravityWeight})`);
          lensGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = lensGrad;
          ctx.beginPath();
          ctx.arc(cx, cy, bhR * 2.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 4. Act III: 4 Interactive 3D Faceted Hardware Fragments ("Pieces of a World")
      if (rocksWeight > 0.02) {
        ctx.save();
        ctx.globalAlpha = rocksWeight;
        const spreadX = Math.min(width * 0.36, 460);
        const spreadY = Math.min(height * 0.22, 190);

        FLOATING_FRAGMENTS.forEach((frag, idx) => {
          const bobX = Math.cos(t * 0.55 + idx * 1.7) * 14;
          const bobY = Math.sin(t * 0.7 + idx * 2.1) * 12;
          const rx = cx + frag.baseAngle * spreadX + bobX;
          const ry = cy + frag.yOffset * spreadY * 2.2 + bobY;
          const isHovered = st.hoveredRock === idx;
          const rockRadius = (isHovered ? 44 : 34) * Math.min(1.15, Math.max(0.75, width / 1200));

          st.projectedRocks[idx] = { x: rx, y: ry, r: rockRadius };

          ctx.save();
          ctx.translate(rx, ry);
          const rot = t * 0.35 * (idx % 2 === 0 ? 1 : -1) + idx * 1.1;

          const pts: { x: number; y: number }[] = [];
          const count = 7;
          for (let v = 0; v < count; v++) {
            const a = rot + (v / count) * Math.PI * 2;
            const rad = rockRadius * (0.76 + 0.24 * Math.sin(v * 2.7 + idx));
            pts.push({ x: Math.cos(a) * rad, y: Math.sin(a) * rad });
          }

          ctx.fillStyle = isHovered ? '#343842' : '#1c1f26';
          ctx.strokeStyle = isHovered ? 'rgba(255, 255, 255, 0.88)' : 'rgba(233, 231, 225, 0.44)';
          ctx.lineWidth = isHovered ? 1.3 : 0.9;

          ctx.beginPath();
          pts.forEach((pt, v) => {
            if (v === 0) ctx.moveTo(pt.x, pt.y);
            else ctx.lineTo(pt.x, pt.y);
          });
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          const apexX = Math.cos(rot * 1.3) * (rockRadius * 0.22);
          const apexY = Math.sin(rot * 1.3) * (rockRadius * 0.22);
          ctx.strokeStyle = isHovered ? 'rgba(233, 231, 225, 0.45)' : 'rgba(233, 231, 225, 0.18)';
          ctx.lineWidth = 0.75;
          ctx.beginPath();
          pts.forEach((pt, v) => {
            if (v % 2 === 0) {
              ctx.moveTo(apexX, apexY);
              ctx.lineTo(pt.x, pt.y);
            }
          });
          ctx.stroke();

          ctx.fillStyle = isHovered ? '#ffffff' : 'rgba(233, 231, 225, 0.65)';
          ctx.font = '300 10px "Plus Jakarta Sans", sans-serif';
          ctx.fillText(frag.code, -rockRadius - 14, -rockRadius + 4);
          ctx.restore();
        });

        ctx.restore();
      }

      // 5. Render Stardust Pointer Trail
      for (let i = st.trail.length - 1; i >= 0; i--) {
        const tp = st.trail[i];
        tp.x += tp.vx;
        tp.y += tp.vy;
        tp.life -= 0.04;
        if (tp.life <= 0) {
          st.trail.splice(i, 1);
        } else {
          ctx.fillStyle =
            dawnProgress > 0.6
              ? `rgba(22, 24, 28, ${(tp.life * 0.35).toFixed(3)})`
              : `rgba(233, 231, 225, ${(tp.life * 0.55).toFixed(3)})`;
          ctx.fillRect(tp.x, tp.y, 1.8, 1.8);
        }
      }

      timerId = window.setTimeout(() => {
        animationFrameId = requestAnimationFrame(render);
      }, 36);
    };

    let timerId = 0;
    animationFrameId = requestAnimationFrame(render);
    return () => {
      window.clearTimeout(timerId);
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('pointermove', onPointerMove);
    };
  }, []);

  // Smooth navigation helper with `.route-dive` transition
  const triggerExploreRoute = (destId?: string, artId?: string) => {
    setRouteDive(true);
    const params = new URLSearchParams();
    if (destId) params.set('destination', destId);
    if (artId) params.set('artifact', artId);
    const query = params.toString();
    setTimeout(() => {
      navigate(query ? `/explore?${query}` : '/explore');
    }, 220);
  };

  // Scroll to a specific progress ratio inside the 360vh scroll journey or a below-the-fold section
  const scrollToTarget = (target: string | number) => {
    setMenuOpen(false);
    if (typeof target === 'number') {
      const journeyEl = journeyRef.current;
      const vh = window.innerHeight;
      const total = journeyEl ? journeyEl.offsetHeight - vh : vh * 2.6;
      window.scrollTo({ top: total * target, behavior: 'smooth' });
      return;
    }
    const el = document.getElementById(target);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Categorized artifacts for Moon, Mars, and Deep Space sections + Ledger
  const moonArtifacts = ARTIFACTS.filter((a) => a.destinationId === 'moon');
  const marsArtifacts = ARTIFACTS.filter((a) => a.destinationId === 'mars');
  const deepSpaceArtifacts = ARTIFACTS.filter(
    (a) =>
      a.destinationId === 'deep-space' ||
      a.destinationId === 'jupiter' ||
      a.destinationId === 'saturn'
  );

  const ledgerArtifacts: SpaceArtifact[] =
    ledgerRegion === 'all'
      ? ARTIFACTS
      : ledgerRegion === 'moon'
      ? moonArtifacts
      : ledgerRegion === 'mars'
      ? marsArtifacts
      : deepSpaceArtifacts;

  // Compute Hero opacity & rise transform (exact reference formula: fades out across p = 0..0.08)
  const heroFade = Math.max(0, Math.min(1, 1 - scrollProgress / 0.085));
  const heroRisePx = (1 - heroFade) * -28;

  // Compute Rock Fragment Callout visibility (visible during Act III: p = 0.49..0.72)
  const rockCalloutAlpha =
    smoothstep(0.49, 0.54, scrollProgress) * (1 - smoothstep(0.69, 0.74, scrollProgress));
  const activeFragment = FLOATING_FRAGMENTS[hoveredFragmentIdx] || FLOATING_FRAGMENTS[0];

  const vw = typeof window !== 'undefined' ? window.innerWidth : 1280;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
  const spreadX = Math.min(vw * 0.36, 460);
  const spreadY = Math.min(vh * 0.22, 190);
  const computedAnchorX = vw * 0.5 + activeFragment.baseAngle * spreadX;
  const computedAnchorY = vh * 0.46 + activeFragment.yOffset * spreadY * 2.2;
  const anchorX = fragmentAnchor.x !== 560 ? fragmentAnchor.x : computedAnchorX;
  const anchorY = fragmentAnchor.y !== 380 ? fragmentAnchor.y : computedAnchorY;

  // SVG bent callout geometry (`M ax,ay L kx,ky L ex,ey`) matching reference `.rock-lines`
  const calloutDir = anchorX > vw * 0.52 ? -1 : 1;
  const kneeX = anchorX + calloutDir * 44;
  const kneeY = anchorY - 38;
  const endX = kneeX + calloutDir * 96;
  const endY = kneeY;
  const blockX = calloutDir > 0 ? endX + 12 : Math.max(20, endX - 245);
  const blockY = Math.max(84, endY - 14);

  const selectedGalleryItem = FLOATING_FRAGMENTS[galleryIndex] || FLOATING_FRAGMENTS[0];

  return (
    <div className="jehad-root min-h-screen select-none sm:select-auto">
      {/* =====================================================================
          1. Odometer Loader & Radial Iris Reveal (.jehad-loader)
          ===================================================================== */}
      <div
        className={`jehad-loader ${
          loaderPhase === 'opening' ? 'opening' : loaderPhase === 'ready' ? 'ready' : ''
        }`}
        style={
          loaderPhase === 'opening'
            ? ({ '--iris': `${irisRadius}vmax` } as React.CSSProperties)
            : undefined
        }
        aria-hidden={loaderPhase === 'ready'}
      >
        <div className="jehad-loader-star" />
        <svg className="jehad-loader-orbit" viewBox="-28 -28 56 56">
          <circle className="lo-track" r="25" />
          <circle
            className="lo-fill"
            r="25"
            strokeDasharray={`${(loadPct / 100) * 157.08} 157.08`}
          />
        </svg>
        <div className="jehad-loader-foot">
          <span className="jehad-loader-name">SILENT EXPLORERS · NASA ARCHIVE</span>
          <span className="jehad-loader-line">
            <i style={{ transform: `scaleX(${loadPct / 100})` }} />
          </span>
          <OdometerNumber value={loadPct} />
        </div>
      </div>

      {/* =====================================================================
          2. Fixed Full-Viewport Interactive Canvas Stage (.jehad-gl)
          ===================================================================== */}
      <div className={`jehad-gl ${routeDive ? 'route-dive' : ''}`} aria-hidden="true">
        <canvas ref={canvasRef} />
      </div>

      {/* =====================================================================
          3. Top Chrome Header (.jehad-chrome) with RollingText & 2-Line Menu
          ===================================================================== */}
      <header
        className={`jehad-chrome shown ${menuOpen ? 'menu-open' : ''} ${
          isPaperChrome && !menuOpen ? 'paper' : ''
        }`}
      >
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="jehad-brand"
          aria-label="Silent Explorers — Return to top"
        >
          <span className="jehad-brand-wordmark">
            <RollingText text="SILENT EXPLORERS" />
          </span>
        </button>

        <nav className="jehad-pill" aria-label="Primary Navigation">
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="jehad-pill-link"
          >
            <RollingText text="Home" />
          </button>
          <button
            type="button"
            onClick={() => scrollToTarget('lunar-hardware')}
            className="jehad-pill-link"
          >
            <RollingText text="Lunar" />
          </button>
          <button
            type="button"
            onClick={() => scrollToTarget('martian-fleet')}
            className="jehad-pill-link"
          >
            <RollingText text="Martian" />
          </button>
          <button
            type="button"
            onClick={() => scrollToTarget('deep-space-probes')}
            className="jehad-pill-link"
          >
            <RollingText text="Deep Space" />
          </button>
          <button
            type="button"
            onClick={() => scrollToTarget('mission-ledger')}
            className="jehad-pill-link"
          >
            <RollingText text="Archive" />
          </button>
          <button
            type="button"
            onClick={() => scrollToTarget('direct-3d-objects')}
            className="jehad-pill-link"
          >
            <RollingText text="3D Models" />
          </button>
          <button
            type="button"
            onClick={() => triggerExploreRoute()}
            className="jehad-pill-link"
          >
            <RollingText text="3D Orrery ↗" />
          </button>

          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            className="jehad-pill-menu"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? 'Close chapter menu' : 'Open chapter menu'}
          >
            <span className="pm-label">
              <RollingText text={menuOpen ? 'Close' : 'Menu'} />
            </span>
            <span className="pm-icon" aria-hidden="true">
              <i />
              <i />
            </span>
          </button>
        </nav>
      </header>

      {/* =====================================================================
          4. Full-Screen Blurred Chapter Menu Overlay (.jehad-menu)
          ===================================================================== */}
      <div className={`jehad-menu ${menuOpen ? 'open' : ''}`} aria-hidden={!menuOpen}>
        <div className="jehad-menu-inner">
          <ol className="jehad-chapters">
            <li>
              <button
                type="button"
                aria-current={scrollProgress < 0.16 ? 'true' : undefined}
                onClick={() => scrollToTarget(0)}
              >
                <span>01 · The Ground (Hero)</span>
                <span className="dot" />
              </button>
            </li>
            <li>
              <button
                type="button"
                aria-current={scrollProgress >= 0.16 && scrollProgress < 0.36 ? 'true' : undefined}
                onClick={() => scrollToTarget('lunar-hardware')}
              >
                <span>02 · Moon Hardware</span>
                <span className="dot" />
              </button>
            </li>
            <li>
              <button
                type="button"
                aria-current={scrollProgress >= 0.36 && scrollProgress < 0.54 ? 'true' : undefined}
                onClick={() => scrollToTarget('martian-fleet')}
              >
                <span>03 · Mars Hardware</span>
                <span className="dot" />
              </button>
            </li>
            <li>
              <button
                type="button"
                aria-current={scrollProgress >= 0.54 && scrollProgress < 0.75 ? 'true' : undefined}
                onClick={() => scrollToTarget('deep-space-probes')}
              >
                <span>04 · Deep-Space Probes</span>
                <span className="dot" />
              </button>
            </li>
            <li>
              <button
                type="button"
                aria-current={scrollProgress >= 0.75 ? 'true' : undefined}
                onClick={() => scrollToTarget('mission-ledger')}
              >
                <span>05 · Complete Hardware Ledger</span>
                <span className="dot" />
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  triggerExploreRoute();
                }}
              >
                <span>06 · Launch 3D Solar-System Explorer ↗</span>
                <span className="dot" />
              </button>
            </li>
          </ol>

          <div className="flex flex-wrap items-center justify-between gap-6 border-t border-[rgba(233,231,225,0.14)] pt-6 text-[12px] tracking-[0.12em] uppercase text-[rgba(233,231,225,0.68)]">
            <span>NASA Space Apps Challenge 2026 · Discarded Equipment Storytelling</span>
            <div className="flex items-center gap-6">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  setShowVideoModal(true);
                }}
                className="so-u text-[#e9e7e1]"
              >
                Watch Mission Film
              </button>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  setCreditsOpen(true);
                }}
                className="so-u text-[#e9e7e1]"
              >
                Credits & NASA Sources
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================================
          5. Fixed Hero Statement (.jehad-hero-statement) + Bouncing Scroll Hint
          ===================================================================== */}
      <section
        className="jehad-hero-statement"
        style={{
          opacity: heroFade,
          visibility: heroFade <= 0.01 ? 'hidden' : 'visible',
          '--rise': `${heroRisePx.toFixed(1)}px`,
        } as React.CSSProperties}
        aria-label="Hero Introduction"
      >
        <div className="jehad-hs-main">
          <div className="mb-3 inline-flex items-center gap-2.5 text-[11px] font-normal tracking-[0.18em] uppercase text-[rgba(233,231,225,0.74)]">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#e9e7e1]" />
            <span>NASA Space Apps Challenge 2026</span>
          </div>

          <h1 className="jehad-hs-name">
            Silent Explorers: NASA’s Left-Behind Machines
          </h1>

          <p className="jehad-hs-role">
            LUNAR DESCENT STAGES · MARTIAN ROVERS · INTERSTELLAR VOYAGERS
          </p>

          {/* Primary & Secondary CTAs matching jehaduddin.vercel.app typographic & rolling button polish */}
          <div className="mt-7 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => triggerExploreRoute()}
              className="group inline-flex items-center gap-3 rounded-none border border-[#e9e7e1] bg-[#e9e7e1] px-6 py-3.5 text-[12px] font-medium tracking-[0.14em] uppercase text-[#16181c] transition-all duration-300 hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
            >
              <RollingText text="Begin Exploration" />
              <span
                className="inline-block transition-transform duration-300 group-hover:translate-x-1"
                aria-hidden="true"
              >
                →
              </span>
            </button>

            <button
              type="button"
              onClick={() => scrollToTarget('lunar-hardware')}
              className="group inline-flex items-center gap-2.5 border border-[rgba(233,231,225,0.34)] bg-[rgba(6,8,13,0.65)] px-5 py-3.5 text-[12px] font-normal tracking-[0.14em] uppercase text-[#e9e7e1] transition-colors duration-300 hover:border-[#e9e7e1] hover:bg-[rgba(233,231,225,0.1)]"
            >
              <RollingText text="Meet the Machines" />
              <span
                className="inline-block transition-transform duration-300 group-hover:translate-y-0.5"
                aria-hidden="true"
              >
                ↓
              </span>
            </button>

            <button
              type="button"
              onClick={() => setShowVideoModal(true)}
              className="jehad-hole-link mt-0 ml-1 text-[12px] tracking-[0.12em] uppercase"
            >
              <span>Mission Film</span>
              <span aria-hidden="true">↗</span>
            </button>
          </div>
        </div>

        <div className="jehad-hs-side">
          <p className="jehad-hs-tag">
            Every mission leaves a footprint in the dark.
          </p>
          <p className="jehad-hs-does">
            Across the Moon, Mars, and the outer solar system rest the spacecraft that made human discovery possible—from Apollo laser mirrors and dust-covered rovers to probes still hurtling toward the stars.
          </p>
        </div>
      </section>

      <button
        type="button"
        onClick={() => scrollToTarget(0.11)}
        className="jehad-hint"
        style={{
          opacity: heroFade,
          pointerEvents: heroFade > 0.2 ? 'auto' : 'none',
        }}
        aria-label="Scroll to begin story journey"
      >
        Scroll
      </button>

      {/* =====================================================================
          6. Scroll-Driven Story Beats (.jehad-text-layer / .jehad-beat)
          Exact smoothstep opacity, translate3d(0, (1-V)*22px, 0) & blur((1-V)*5px)
          ===================================================================== */}
      <div
        className={`jehad-text-layer ${scrollProgress > 0.82 ? 'dawn-ink' : ''}`}
        aria-hidden="true"
      >
        {STORY_BEATS.map((beat) => {
          const mid = (beat.pStart + beat.pEnd) * 0.5;
          const span = (beat.pEnd - beat.pStart) * 0.5;
          const dist = Math.abs(scrollProgress - mid);
          const v = 1 - smoothstep(span * 0.45, span * 1.05, dist);
          if (v <= 0.01) return null;

          const yPx = (1 - v) * 22;
          const blurPx = (1 - v) * 5;

          return (
            <div
              key={beat.id}
              className={`jehad-beat ${beat.flipRight ? 'flip-right' : ''} ${
                beat.centerBeat ? 'center-beat' : ''
              } ${beat.surfaceBeat ? 'surface-beat' : ''}`}
              style={{ '--ga': v.toFixed(3) } as React.CSSProperties}
            >
              <div
                className="jehad-chapter"
                style={{
                  opacity: v,
                  transform: `translate3d(0, ${yPx.toFixed(1)}px, 0)`,
                  filter: `blur(${blurPx.toFixed(2)}px)`,
                }}
              >
                <span>{beat.chapterNum}</span>
                <span>—</span>
                <span>{beat.chapterTitle}</span>
              </div>

              {beat.lines.map((line, lIdx) => {
                const lineV = Math.max(0, Math.min(1, v * 1.08 - lIdx * 0.08));
                const lY = (1 - lineV) * 22;
                const lBlur = (1 - lineV) * 5;
                return (
                  <p
                    key={lIdx}
                    className="jehad-line"
                    style={{
                      opacity: lineV,
                      transform: `translate3d(0, ${lY.toFixed(1)}px, 0)`,
                      filter: `blur(${lBlur.toFixed(2)}px)`,
                    }}
                  >
                    {line}
                  </p>
                );
              })}

              {beat.ctaLabel && beat.ctaTarget && (
                <button
                  type="button"
                  onClick={() => scrollToTarget(beat.ctaTarget!)}
                  className="jehad-hole-link"
                  style={{ opacity: v }}
                >
                  <span>{beat.ctaLabel}</span>
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* =====================================================================
          7. Interactive 3D Floating Rock / Hardware Fragment Callout (.jehad-rock-label)
          ===================================================================== */}
      {rockCalloutAlpha > 0.02 && !selectedFragment && (
        <div
          className="jehad-rock-label"
          style={{ opacity: rockCalloutAlpha }}
        >
          <svg className="jehad-rock-lines">
            <path
              d={`M ${anchorX.toFixed(1)} ${anchorY.toFixed(1)} L ${kneeX.toFixed(
                1
              )} ${kneeY.toFixed(1)} L ${endX.toFixed(1)} ${endY.toFixed(1)}`}
              strokeDasharray="260"
              strokeDashoffset={(1 - rockCalloutAlpha) * 260}
            />
            <circle
              cx={anchorX}
              cy={anchorY}
              r={4.5}
            />
          </svg>

          <div
            className="jehad-rock-block"
            style={{
              transform: `translate3d(${blockX.toFixed(1)}px, ${blockY.toFixed(1)}px, 0)`,
            }}
          >
            <div className="flex items-center gap-2">
              {FLOATING_FRAGMENTS.map((frag) => (
                <button
                  key={frag.code}
                  type="button"
                  onClick={() => {
                    animStateRef.current.hoveredRock = frag.index;
                    setHoveredFragmentIdx(frag.index);
                    setFragmentAnchor({ x: 560, y: 380 });
                  }}
                  className={`px-1.5 py-0.5 text-[10px] tracking-[0.14em] uppercase transition-colors ${
                    hoveredFragmentIdx === frag.index
                      ? 'bg-[#e9e7e1] text-[#16181c]'
                      : 'border border-[rgba(255,255,255,0.22)] text-[rgba(255,255,255,0.72)] hover:text-white'
                  }`}
                >
                  {frag.code}
                </button>
              ))}
            </div>

            <div className="jehad-rock-name">{activeFragment.name}</div>
            <div className="jehad-rock-line">{activeFragment.line}</div>
            <div className="jehad-rock-tag">{activeFragment.tag}</div>
            <button
              type="button"
              onClick={() => setSelectedFragment(activeFragment)}
              className="jehad-rock-cta text-left hover:text-white"
            >
              Click to explore artifact dossier →
            </button>
          </div>
        </div>
      )}

      {/* =====================================================================
          8. Scroll Journey Spacer (360vh) Driving the 4 Canvas Acts
          ===================================================================== */}
      <div
        ref={journeyRef}
        className="relative z-10 h-[360vh] w-full pointer-events-none"
        aria-hidden="true"
      />

      {/* =====================================================================
          9. Editorial Hardware Chapters & Selected Gallery (Moon, Mars, Deep Space)
          ===================================================================== */}
      <main className="relative z-20 bg-[#050609]">
        {/* Direct Interactive 3D Models: Saturn, James Webb, Hubble & Solar System Worlds */}
        <section
          id="direct-3d-objects"
          className="border-t border-[rgba(233,231,225,0.12)] px-[var(--col)] py-20"
          aria-labelledby="direct-3d-heading"
        >
          <div className="mx-auto max-w-[1280px]">
            <div className="flex flex-col justify-between gap-6 border-b border-[rgba(233,231,225,0.14)] pb-8 md:flex-row md:items-end">
              <div>
                <div className="text-[11px] tracking-[0.16em] uppercase text-[#b4c8e2]">
                  00 / DIRECT 3D INSPECTION — CLICK ANY OBJECT TO OPEN ITS 3D MODEL
                </div>
                <h2
                  id="direct-3d-heading"
                  className="mt-3 text-[clamp(28px,3.4vw,48px)] font-light tracking-[-0.025em] text-[#e9e7e1]"
                >
                  Planets, Telescopes, Lunar Landers &amp; Rovers in Direct 3D
                </h2>
              </div>
              <button
                type="button"
                onClick={() => triggerExploreRoute()}
                className="jehad-hole-link shrink-0"
              >
                <span>Open Full 3D Solar System</span>
                <span aria-hidden="true">↗</span>
              </button>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { modelId: 'apollo-lrv-3d', badge: 'ROVER · GLB', accent: '#f59e0b', title: 'Apollo Lunar Roving Vehicle', sub: 'Electric Moon Buggy driven across Apollo 15–17' },
                { modelId: 'surveyor-3-3d', badge: 'LANDER · GLB', accent: '#e2e8f0', title: 'Surveyor 3 Lunar Lander', sub: '1967 Sea of Storms lander visited by Apollo 12' },
                { modelId: 'moon-3d', badge: 'MOON · GLB', accent: '#cbd5e1', title: 'Earth’s Moon', sub: 'High-resolution 3D Moon globe & Apollo sites' },
                { modelId: 'saturn-3d', badge: 'PLANET · GLB', accent: '#facc15', title: 'Saturn & Ring System', sub: 'High-detail 3D Saturn & ice-rock rings' },
                { modelId: 'jwst-3d', badge: 'TELESCOPE · GLB', accent: '#fbbf24', title: 'James Webb Space Telescope', sub: '6.5m gold mirror & 5-layer sunshield at L2' },
                { modelId: 'hubble-3d', badge: 'TELESCOPE · GLB', accent: '#38bdf8', title: 'Hubble Space Telescope', sub: '2.4m Low Earth Orbit space observatory' },
                { modelId: 'mars-3d', badge: 'PLANET · 3D', accent: '#fb923c', title: 'Planet Mars', sub: 'Red Planet topography & rover landing zones' },
                { modelId: 'jupiter-3d', badge: 'PLANET · GLB', accent: '#f59e0b', title: 'Jupiter', sub: 'Largest gas giant & Great Red Spot' },
                { modelId: 'earth-3d', badge: 'PLANET · GLB', accent: '#60a5fa', title: 'Planet Earth', sub: 'Blue Marble homeworld & DSN hub' },
                { modelId: 'voyager-3d', badge: 'PROBE · GLB', accent: '#22d3ee', title: 'Voyager 1 & 2', sub: 'Interstellar probes carrying Golden Record' },
                { modelId: 'perseverance-3d', badge: 'ROVER · GLB', accent: '#f97316', title: 'Perseverance Mars Rover', sub: 'Nuclear Jezero Crater rover & sample tubes' },
                { modelId: 'cassini-3d', badge: 'ORBITER · GLB', accent: '#eab308', title: 'Cassini-Huygens', sub: 'Saturn flagship & Huygens Titan lander' },
              ].map((card) => {
                const entry = NASA_3D_MODELS.find((m) => m.id === card.modelId);
                return (
                  <button
                    key={card.modelId}
                    type="button"
                    data-direct-model-id={card.modelId}
                    onClick={() => openDirect3DModel(card.modelId)}
                    className="group flex flex-col justify-between border border-[rgba(233,231,225,0.16)] bg-[rgba(14,16,22,0.78)] p-5 text-left transition-all duration-300 hover:-translate-y-1 hover:border-[#e9e7e1] hover:bg-[rgba(22,26,38,0.94)]"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 text-[10px] tracking-[0.12em] uppercase text-[rgba(233,231,225,0.64)]">
                        <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                          <span
                            className="inline-block h-2 w-2 rounded-full shrink-0"
                            style={{ backgroundColor: card.accent }}
                          />
                          {card.badge}
                        </span>
                        <span className="font-mono text-[9.5px] text-[rgba(233,231,225,0.52)] whitespace-nowrap">
                          {entry?.glbSizeLabel || 'Interactive 3D'}
                        </span>
                      </div>
                      <h3 className="mt-3 text-[17px] font-normal leading-snug text-[#e9e7e1] group-hover:text-white">
                        {card.title}
                      </h3>
                      <p className="mt-1.5 text-[12.5px] font-light leading-relaxed text-[rgba(233,231,225,0.72)]">
                        {card.sub}
                      </p>
                    </div>
                    <div className="mt-4 flex items-center justify-between border-t border-[rgba(233,231,225,0.12)] pt-3 text-[11px] font-medium tracking-[0.12em] uppercase text-[#b4c8e2] group-hover:text-white">
                      <span>Open 3D Model Directly</span>
                      <span aria-hidden="true">↗</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Selected Hardware Spotlight Switcher (.jehad-gal-title animation) */}
        <section
          className="border-t border-[rgba(233,231,225,0.12)] px-[var(--col)] py-24"
          aria-labelledby="selected-machines-heading"
        >
          <div className="mx-auto max-w-[1280px]">
            <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-[rgba(233,231,225,0.14)] pb-6">
              <div className="text-[11px] tracking-[0.16em] uppercase text-[rgba(233,231,225,0.68)]">
                01 / CURATED ARTIFACT SPOTLIGHT — PIECES OF A WORLD
              </div>
              <div className="flex items-center gap-3 font-mono text-[12px] text-[rgba(233,231,225,0.74)]">
                <span>0{galleryIndex + 1}</span>
                <span>/</span>
                <span>0{FLOATING_FRAGMENTS.length}</span>
              </div>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-end">
              <div className="lg:col-span-7">
                <div className="mb-3 text-[11px] tracking-[0.16em] uppercase text-[rgba(233,231,225,0.62)]">
                  {selectedGalleryItem.mission} · {selectedGalleryItem.year}
                </div>
                <h2 id="selected-machines-heading" className="jehad-gal-title">
                  <span
                    key={selectedGalleryItem.code}
                    className="jehad-gal-title-inner"
                    data-dir={galleryDir}
                  >
                    {selectedGalleryItem.name}
                  </span>
                </h2>
                <p className="mt-6 max-w-[58ch] text-[16px] font-light leading-[1.65] text-[rgba(233,231,225,0.82)]">
                  {selectedGalleryItem.story}
                </p>

                <div className="mt-8 flex flex-wrap items-center gap-5">
                  <button
                    type="button"
                    onClick={() =>
                      triggerExploreRoute(
                        selectedGalleryItem.destinationId,
                        selectedGalleryItem.artifactId
                      )
                    }
                    className="inline-flex items-center gap-3 border border-[#e9e7e1] bg-[#e9e7e1] px-5 py-3 text-[11.5px] font-medium tracking-[0.14em] uppercase text-[#16181c] transition-colors hover:bg-white"
                  >
                    <RollingText text="Inspect in 3D Solar System" />
                    <span aria-hidden="true">↗</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedFragment(selectedGalleryItem)}
                    className="jehad-hole-link mt-0"
                  >
                    <span>Read Full Engineering & Science Dossier</span>
                    <span aria-hidden="true">→</span>
                  </button>
                </div>
              </div>

              <div className="flex flex-col justify-between border-l border-[rgba(233,231,225,0.14)] pl-6 lg:col-span-5">
                <div>
                  <div className="text-[11px] tracking-[0.14em] uppercase text-[rgba(233,231,225,0.58)]">
                    Major Scientific Contributions
                  </div>
                  <ul className="mt-4 space-y-3 text-[14px] font-light leading-[1.5] text-[rgba(233,231,225,0.86)]">
                    {selectedGalleryItem.science.map((fact, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[#e9e7e1]" />
                        <span>{fact}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Prev / Next Gallery Controls */}
                <div className="mt-10 flex items-center justify-between border-t border-[rgba(233,231,225,0.14)] pt-5">
                  <div className="flex items-center gap-2">
                    {FLOATING_FRAGMENTS.map((item, idx) => (
                      <button
                        key={item.code}
                        type="button"
                        onClick={() => {
                          setGalleryDir(idx >= galleryIndex ? 1 : -1);
                          setGalleryIndex(idx);
                        }}
                        className={`px-2.5 py-1 text-[11px] tracking-[0.14em] uppercase transition-colors ${
                          galleryIndex === idx
                            ? 'bg-[#e9e7e1] text-[#16181c]'
                            : 'text-[rgba(233,231,225,0.62)] hover:text-white'
                        }`}
                      >
                        {item.code}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => {
                        setGalleryDir(-1);
                        setGalleryIndex(
                          (prev) => (prev - 1 + FLOATING_FRAGMENTS.length) % FLOATING_FRAGMENTS.length
                        );
                      }}
                      className="text-[11px] tracking-[0.14em] uppercase text-[rgba(233,231,225,0.78)] hover:text-white"
                    >
                      <RollingText text="← Prev" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setGalleryDir(1);
                        setGalleryIndex((prev) => (prev + 1) % FLOATING_FRAGMENTS.length);
                      }}
                      className="text-[11px] tracking-[0.14em] uppercase text-[rgba(233,231,225,0.78)] hover:text-white"
                    >
                      <RollingText text="Next →" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =================================================================
            SECTION A: MOON HARDWARE (Apollo Experiments, Rovers, Descent Stages)
            ================================================================= */}
        <section
          id="lunar-hardware"
          className="border-t border-[rgba(233,231,225,0.12)] px-[var(--col)] py-24"
          aria-labelledby="moon-section-title"
        >
          <div className="mx-auto max-w-[1280px]">
            <div className="flex flex-col justify-between gap-6 border-b border-[rgba(233,231,225,0.14)] pb-10 md:flex-row md:items-end">
              <div>
                <div className="text-[11px] tracking-[0.16em] uppercase text-[rgba(233,231,225,0.64)]">
                  CHAPTER I · 384,400 KM FROM EARTH
                </div>
                <h2
                  id="moon-section-title"
                  className="mt-3 text-[clamp(30px,3.6vw,54px)] font-light tracking-[-0.025em] text-[#e9e7e1]"
                >
                  Moon Hardware: Apollo Descent Stages, Rovers & Laser Mirrors
                </h2>
              </div>
              <button
                type="button"
                onClick={() => triggerExploreRoute('moon')}
                className="jehad-hole-link shrink-0"
              >
                <span>Fly to the Moon in 3D Orrery</span>
                <span aria-hidden="true">↗</span>
              </button>
            </div>

            <p className="mt-6 max-w-[68ch] text-[15.5px] font-light leading-[1.65] text-[rgba(233,231,225,0.78)]">
              Between 1966 and 1972, NASA landed robotic surveyors and six crewed Apollo missions on the Moon. To save mass for the astronauts’ return trip to lunar orbit, every descent stage, electric Lunar Roving Vehicle, and surface science package stayed behind in the vacuum—forming an untouched open-air museum of human engineering.
            </p>

            <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              {moonArtifacts.map((art, idx) => (
                <article
                  key={art.id}
                  className="group flex flex-col justify-between border border-[rgba(233,231,225,0.16)] bg-[rgba(14,16,22,0.72)] p-6 transition-all duration-500 hover:-translate-y-1 hover:border-[rgba(233,231,225,0.48)] hover:bg-[rgba(22,25,34,0.9)]"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 text-[10.5px] tracking-[0.14em] uppercase text-[rgba(233,231,225,0.6)]">
                      <span>0{idx + 1} · {art.hardwareType}</span>
                      <span className="border border-[rgba(233,231,225,0.24)] px-2 py-0.5 text-[10px] text-[#e9e7e1]">
                        {art.status}
                      </span>
                    </div>

                    <h3 className="mt-4 text-[20px] font-normal leading-[1.2] tracking-[-0.01em] text-[#e9e7e1]">
                      {art.name}
                    </h3>
                    <div className="mt-1 text-[12px] font-light text-[rgba(233,231,225,0.62)]">
                      {art.mission} · {art.arrivalDate}
                    </div>

                    <p className="mt-4 text-[13.5px] font-light leading-[1.58] text-[rgba(233,231,225,0.78)]">
                      {art.purpose}
                    </p>
                  </div>

                  <div className="mt-6 border-t border-[rgba(233,231,225,0.12)] pt-4">
                    <div className="text-[11px] font-light text-[rgba(233,231,225,0.58)]">
                      {art.locationOrTrajectory}
                    </div>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => openDirect3DModel(art.model3dId)}
                          className="text-[11px] font-medium tracking-[0.12em] uppercase text-[#b4c8e2] hover:text-white"
                        >
                          3D Model ↗
                        </button>
                        <button
                          type="button"
                          onClick={() => triggerExploreRoute('moon', art.id)}
                          className="text-[11px] font-medium tracking-[0.12em] uppercase text-[#e9e7e1] group-hover:underline"
                        >
                          <RollingText text="In Orrery →" />
                        </button>
                      </div>
                      <a
                        href={art.nasaSourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-[rgba(233,231,225,0.6)] hover:text-white"
                      >
                        NASA ↗
                      </a>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* =================================================================
            SECTION B: MARS HARDWARE (Retired Rovers, Landers, Orbiters & Rotorcraft)
            ================================================================= */}
        <section
          id="martian-fleet"
          className="border-t border-[rgba(233,231,225,0.12)] px-[var(--col)] py-24"
          aria-labelledby="mars-section-title"
        >
          <div className="mx-auto max-w-[1280px]">
            <div className="flex flex-col justify-between gap-6 border-b border-[rgba(233,231,225,0.14)] pb-10 md:flex-row md:items-end">
              <div>
                <div className="text-[11px] tracking-[0.16em] uppercase text-[#e8b89f]">
                  CHAPTER II · 225 MILLION KM FROM EARTH
                </div>
                <h2
                  id="mars-section-title"
                  className="mt-3 text-[clamp(30px,3.6vw,54px)] font-light tracking-[-0.025em] text-[#e9e7e1]"
                >
                  Mars Hardware: Ghost Rovers, Landers & First Rotorcraft
                </h2>
              </div>
              <button
                type="button"
                onClick={() => triggerExploreRoute('mars')}
                className="jehad-hole-link shrink-0"
              >
                <span>Fly to Mars in 3D Orrery</span>
                <span aria-hidden="true">↗</span>
              </button>
            </div>

            <p className="mt-6 max-w-[68ch] text-[15.5px] font-light leading-[1.65] text-[rgba(233,231,225,0.78)]">
              Mars is the only planet we know inhabited entirely by robots. From Viking 1’s 1976 touchdown in Chryse Planitia to Sojourner, Opportunity, InSight, and the Ingenuity helicopter, retired solar landers and nuclear-powered rovers trace our search for ancient Martian water and habitable environments.
            </p>

            <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-5">
              {marsArtifacts.map((art, idx) => (
                <article
                  key={art.id}
                  className="group flex flex-col justify-between border border-[rgba(233,231,225,0.16)] bg-[rgba(14,16,22,0.72)] p-6 transition-all duration-500 hover:-translate-y-1 hover:border-[#e8b89f] hover:bg-[rgba(24,20,22,0.9)]"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 text-[10.5px] tracking-[0.14em] uppercase text-[rgba(233,231,225,0.6)]">
                      <span>0{idx + 1} · {art.hardwareType}</span>
                      <span className="border border-[rgba(232,184,159,0.38)] px-2 py-0.5 text-[10px] text-[#e8b89f]">
                        {art.status}
                      </span>
                    </div>

                    <h3 className="mt-4 text-[19px] font-normal leading-[1.22] tracking-[-0.01em] text-[#e9e7e1]">
                      {art.name}
                    </h3>
                    <div className="mt-1 text-[12px] font-light text-[rgba(233,231,225,0.62)]">
                      {art.mission}
                    </div>

                    <p className="mt-4 text-[13px] font-light leading-[1.58] text-[rgba(233,231,225,0.78)]">
                      {art.purpose}
                    </p>
                  </div>

                  <div className="mt-6 border-t border-[rgba(233,231,225,0.12)] pt-4">
                    <div className="text-[11px] font-light text-[rgba(233,231,225,0.58)]">
                      {art.locationOrTrajectory}
                    </div>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => openDirect3DModel(art.model3dId)}
                          className="text-[11px] font-medium tracking-[0.12em] uppercase text-[#e8b89f] hover:text-white"
                        >
                          3D Model ↗
                        </button>
                        <button
                          type="button"
                          onClick={() => triggerExploreRoute('mars', art.id)}
                          className="text-[11px] font-medium tracking-[0.12em] uppercase text-[#e9e7e1] group-hover:underline"
                        >
                          <RollingText text="In Orrery →" />
                        </button>
                      </div>
                      <a
                        href={art.nasaSourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-[rgba(233,231,225,0.6)] hover:text-white"
                      >
                        NASA ↗
                      </a>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* =================================================================
            SECTION C: DEEP-SPACE HARDWARE (Voyager, Pioneer, New Horizons, Outer Giants)
            ================================================================= */}
        <section
          id="deep-space-probes"
          className="border-t border-[rgba(233,231,225,0.12)] px-[var(--col)] py-24"
          aria-labelledby="deep-space-section-title"
        >
          <div className="mx-auto max-w-[1280px]">
            <div className="flex flex-col justify-between gap-6 border-b border-[rgba(233,231,225,0.14)] pb-10 md:flex-row md:items-end">
              <div>
                <div className="text-[11px] tracking-[0.16em] uppercase text-[#b4c8e2]">
                  CHAPTER III · OUTER GIANTS & INTERSTELLAR MEDIUM
                </div>
                <h2
                  id="deep-space-section-title"
                  className="mt-3 text-[clamp(30px,3.6vw,54px)] font-light tracking-[-0.025em] text-[#e9e7e1]"
                >
                  Deep-Space Hardware: Voyager, Pioneer, New Horizons & Titan
                </h2>
              </div>
              <button
                type="button"
                onClick={() => triggerExploreRoute('deep-space')}
                className="jehad-hole-link shrink-0"
              >
                <span>Track Interstellar Trajectories in 3D</span>
                <span aria-hidden="true">↗</span>
              </button>
            </div>

            <p className="mt-6 max-w-[68ch] text-[15.5px] font-light leading-[1.65] text-[rgba(233,231,225,0.78)]">
              Beyond the asteroid belt, spacecraft either rest on alien moons like Saturn’s Titan, vaporized inside gas-giant atmospheres to protect ocean worlds from Earth microbes, or coast forever between the stars—carrying gold-plated plaques and phonograph records of humanity.
            </p>

            <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              {deepSpaceArtifacts.map((art, idx) => (
                <article
                  key={art.id}
                  className="group flex flex-col justify-between border border-[rgba(233,231,225,0.16)] bg-[rgba(14,16,22,0.72)] p-6 transition-all duration-500 hover:-translate-y-1 hover:border-[#b4c8e2] hover:bg-[rgba(18,24,36,0.9)]"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 text-[10.5px] tracking-[0.14em] uppercase text-[rgba(233,231,225,0.6)]">
                      <span>0{idx + 1} · {art.hardwareType}</span>
                      <span className="border border-[rgba(180,200,226,0.38)] px-2 py-0.5 text-[10px] text-[#b4c8e2]">
                        {art.status}
                      </span>
                    </div>

                    <h3 className="mt-4 text-[20px] font-normal leading-[1.2] tracking-[-0.01em] text-[#e9e7e1]">
                      {art.name}
                    </h3>
                    <div className="mt-1 text-[12px] font-light text-[rgba(233,231,225,0.62)]">
                      {art.mission} · Launched {art.launchDate}
                    </div>

                    <p className="mt-4 text-[13.5px] font-light leading-[1.58] text-[rgba(233,231,225,0.78)]">
                      {art.purpose}
                    </p>
                  </div>

                  <div className="mt-6 border-t border-[rgba(233,231,225,0.12)] pt-4">
                    <div className="text-[11px] font-light text-[rgba(233,231,225,0.58)]">
                      {art.locationOrTrajectory}
                    </div>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => openDirect3DModel(art.model3dId)}
                          className="text-[11px] font-medium tracking-[0.12em] uppercase text-[#b4c8e2] hover:text-white"
                        >
                          3D Model ↗
                        </button>
                        <button
                          type="button"
                          onClick={() => triggerExploreRoute(art.destinationId, art.id)}
                          className="text-[11px] font-medium tracking-[0.12em] uppercase text-[#e9e7e1] group-hover:underline"
                        >
                          <RollingText text="In Orrery →" />
                        </button>
                      </div>
                      <a
                        href={art.nasaSourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-[rgba(233,231,225,0.6)] hover:text-white"
                      >
                        NASA ↗
                      </a>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* =====================================================================
          10. Warm Paper Editorial Archive Ledger (--paper: #f1efe9, --paper-ink: #16181c)
          Exact ratio and surface transition from jehaduddin.vercel.app
          ===================================================================== */}
      <section
        id="mission-ledger"
        className="relative z-20 bg-[#f1efe9] px-[var(--col)] py-28 text-[#16181c]"
        aria-labelledby="ledger-heading"
      >
        <div className="mx-auto max-w-[1280px]">
          <div className="flex flex-col justify-between gap-6 border-b border-[rgba(22,24,28,0.16)] pb-10 md:flex-row md:items-end">
            <div>
              <div className="text-[11px] font-medium tracking-[0.16em] uppercase text-[rgba(22,24,28,0.62)]">
                ARCHIVE LEDGER · {ARTIFACTS.length} VERIFIED NASA ARTIFACTS
              </div>
              <h2
                id="ledger-heading"
                className="mt-3 text-[clamp(32px,4vw,60px)] font-light tracking-[-0.03em] text-[#16181c]"
              >
                The Left-Behind Machines Index
              </h2>
            </div>

            {/* Region Filter Tabs */}
            <div
              className="flex flex-wrap items-center gap-2"
              role="tablist"
              aria-label="Filter hardware by solar system region"
            >
              {(
                [
                  { id: 'all', label: `All (${ARTIFACTS.length})` },
                  { id: 'moon', label: `Moon (${moonArtifacts.length})` },
                  { id: 'mars', label: `Mars (${marsArtifacts.length})` },
                  { id: 'deep-space', label: `Outer & Deep Space (${deepSpaceArtifacts.length})` },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={ledgerRegion === tab.id}
                  onClick={() => setLedgerRegion(tab.id)}
                  className={`px-4 py-2 text-[11px] font-medium tracking-[0.14em] uppercase transition-colors ${
                    ledgerRegion === tab.id
                      ? 'bg-[#16181c] text-[#f1efe9]'
                      : 'border border-[rgba(22,24,28,0.22)] text-[rgba(22,24,28,0.74)] hover:border-[#16181c] hover:text-[#16181c]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="divide-y divide-[rgba(22,24,28,0.14)]">
            {ledgerArtifacts.map((art, idx) => (
              <div
                key={art.id}
                className="group grid grid-cols-1 gap-4 py-6 transition-colors hover:bg-[rgba(22,24,28,0.03)] md:grid-cols-12 md:items-center"
              >
                <div className="font-mono text-[12px] text-[rgba(22,24,28,0.52)] md:col-span-1">
                  {String(idx + 1).padStart(2, '0')}
                </div>
                <div className="md:col-span-3">
                  <div className="text-[18px] font-normal tracking-[-0.01em] text-[#16181c]">
                    {art.name}
                  </div>
                  <div className="text-[12px] text-[rgba(22,24,28,0.64)]">
                    {art.mission} · {art.hardwareType}
                  </div>
                </div>
                <div className="text-[13px] font-light text-[rgba(22,24,28,0.78)] md:col-span-3">
                  {art.locationOrTrajectory}
                </div>
                <div className="md:col-span-2">
                  <span className="inline-block border border-[rgba(22,24,28,0.28)] px-2.5 py-0.5 text-[10.5px] font-medium tracking-[0.12em] uppercase text-[#16181c]">
                    {art.status}
                  </span>
                </div>
                <div className="flex flex-wrap items-center justify-start gap-4 md:col-span-3 md:justify-end">
                  <button
                    type="button"
                    onClick={() => openDirect3DModel(art.model3dId)}
                    className="border border-[rgba(22,24,28,0.28)] px-2.5 py-1 text-[10.5px] font-medium tracking-[0.12em] uppercase text-[#16181c] hover:bg-[#16181c] hover:text-[#f1efe9]"
                  >
                    3D Model
                  </button>
                  <button
                    type="button"
                    onClick={() => triggerExploreRoute(art.destinationId, art.id)}
                    className="text-[11.5px] font-medium tracking-[0.12em] uppercase text-[#16181c] underline-offset-4 group-hover:underline"
                  >
                    <RollingText text="3D Explorer →" />
                  </button>
                  <a
                    href={art.nasaSourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11.5px] text-[rgba(22,24,28,0.62)] hover:text-[#16181c]"
                  >
                    Source ↗
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================================
          11. Signoff Footer (.so) with Giant CTA, Live UTC Clock & NASA Links
          ===================================================================== */}
      <footer
        id="nasa-sources"
        className="relative z-20 border-t border-[rgba(233,231,225,0.14)] bg-[#050609] px-[var(--col)] pt-24 pb-16 text-[#e9e7e1]"
      >
        <div className="mx-auto max-w-[1280px]">
          <div className="text-[11px] tracking-[0.16em] uppercase text-[rgba(233,231,225,0.62)]">
            NEXT DESTINATION · INTERACTIVE 3D ORRERY & ARTIFACT ARCHIVE
          </div>

          <div className="mt-6 flex flex-col items-start justify-between gap-8 border-b border-[rgba(233,231,225,0.14)] pb-16 lg:flex-row lg:items-end">
            <button
              type="button"
              onClick={() => triggerExploreRoute()}
              className="text-left text-[clamp(34px,5vw,76px)] font-light leading-[1.02] tracking-[-0.03em] text-[#e9e7e1]"
            >
              <span className="so-mail-u">Begin 3D Solar-System Exploration →</span>
            </button>

            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => triggerExploreRoute()}
                className="border border-[#e9e7e1] bg-[#e9e7e1] px-6 py-3.5 text-[12px] font-medium tracking-[0.14em] uppercase text-[#16181c] transition-colors hover:bg-white"
              >
                <RollingText text="Launch /explore" />
              </button>
              <button
                type="button"
                onClick={() => setCreditsOpen(true)}
                className="border border-[rgba(233,231,225,0.3)] px-5 py-3.5 text-[12px] tracking-[0.14em] uppercase text-[#e9e7e1] hover:border-white"
              >
                <RollingText text="Credits & Sources" />
              </button>
            </div>
          </div>

          {/* Official NASA Resource Catalogs */}
          <div className="mt-12 grid grid-cols-1 gap-10 md:grid-cols-3">
            <div>
              <div className="text-[11px] tracking-[0.14em] uppercase text-[rgba(233,231,225,0.54)]">
                Project Mission
              </div>
              <p className="mt-3 text-[13.5px] font-light leading-[1.6] text-[rgba(233,231,225,0.76)]">
                Built for the NASA Space Apps Challenge 2026: “NASA’s Discarded Equipment Storytelling.” Designed for learners ages 10–16 and curious explorers everywhere.
              </p>
            </div>

            <div>
              <div className="text-[11px] tracking-[0.14em] uppercase text-[rgba(233,231,225,0.54)]">
                Official NASA 3D & Science Catalogs
              </div>
              <ul className="mt-3 space-y-2 text-[13px] font-light text-[rgba(233,231,225,0.82)]">
                <li>
                  <a
                    href="https://science.nasa.gov/3d-resources/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="so-u"
                  >
                    NASA 3D Resources Catalog ↗
                  </a>
                </li>
                <li>
                  <a
                    href="https://eyes.nasa.gov/apps/orrery/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="so-u"
                  >
                    NASA Eyes on the Solar System ↗
                  </a>
                </li>
                <li>
                  <a
                    href="https://pds.nasa.gov/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="so-u"
                  >
                    NASA Planetary Data System (PDS) ↗
                  </a>
                </li>
                <li>
                  <a
                    href="https://science.nasa.gov/mission/webb/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="so-u"
                  >
                    NASA James Webb Space Telescope ↗
                  </a>
                </li>
                <li>
                  <a
                    href="https://science.nasa.gov/mission/hubble/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="so-u"
                  >
                    NASA Hubble Space Telescope Archive ↗
                  </a>
                </li>
              </ul>
            </div>

            <div className="flex flex-col justify-between md:items-end">
              <div className="text-left md:text-right">
                <div className="text-[11px] tracking-[0.14em] uppercase text-[rgba(233,231,225,0.54)]">
                  Deep Space Network Telemetry Time
                </div>
                <div className="mt-2 font-mono text-[14px] text-[#e9e7e1]">
                  {utcTime || '00:00:00 UTC'}
                </div>
              </div>

              <div className="mt-6 text-[12px] text-[rgba(233,231,225,0.54)]">
                Silent Explorers · Public Domain NASA Data & Citations
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* =====================================================================
          12. Fragment Detail Overlay Modal (.jehad-overlay)
          ===================================================================== */}
      {selectedFragment && (
        <div
          className="jehad-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="fragment-modal-title"
        >
          <div className="jehad-overlay-inner">
            <div>
              <div className="text-[11px] tracking-[0.16em] uppercase text-[rgba(233,231,225,0.62)]">
                FRAGMENT {selectedFragment.code} · {selectedFragment.mission} ({selectedFragment.year})
              </div>
              <h2
                id="fragment-modal-title"
                className="mt-3 text-[clamp(28px,3.8vw,56px)] font-light leading-[1.05] tracking-[-0.025em] text-[#e9e7e1]"
              >
                {selectedFragment.name}
              </h2>
              <p className="mt-6 text-[16px] font-light leading-[1.68] text-[rgba(233,231,225,0.86)]">
                {selectedFragment.story}
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={() => {
                    const dest = selectedFragment.destinationId;
                    const art = selectedFragment.artifactId;
                    setSelectedFragment(null);
                    triggerExploreRoute(dest, art);
                  }}
                  className="border border-[#e9e7e1] bg-[#e9e7e1] px-5 py-3 text-[11.5px] font-medium tracking-[0.14em] uppercase text-[#16181c] hover:bg-white"
                >
                  <RollingText text="Inspect in 3D Solar System ↗" />
                </button>
                <a
                  href={selectedFragment.nasaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border border-[rgba(233,231,225,0.34)] px-5 py-3 text-[11.5px] tracking-[0.14em] uppercase text-[#e9e7e1] hover:border-white"
                >
                  Official NASA Mission Page ↗
                </a>
              </div>
            </div>

            <div className="border-t border-[rgba(233,231,225,0.16)] pt-6 lg:border-t-0 lg:border-l lg:pl-10">
              <div className="text-[11px] tracking-[0.14em] uppercase text-[rgba(233,231,225,0.58)]">
                Location & Status
              </div>
              <div className="mt-2 text-[14px] text-[#e9e7e1]">{selectedFragment.location}</div>
              <div className="mt-1 text-[12.5px] text-[rgba(233,231,225,0.68)]">
                Status: {selectedFragment.status}
              </div>

              <div className="mt-6 text-[11px] tracking-[0.14em] uppercase text-[rgba(233,231,225,0.58)]">
                Key Discoveries Enabled
              </div>
              <ul className="mt-3 space-y-2.5 text-[13.5px] font-light text-[rgba(233,231,225,0.84)]">
                {selectedFragment.science.map((s, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#e9e7e1]" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={() => setSelectedFragment(null)}
                className="mt-8 inline-flex items-center gap-2 text-[11.5px] tracking-[0.14em] uppercase text-[rgba(233,231,225,0.75)] hover:text-white"
              >
                <RollingText text="✕ Close Dossier" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          13. Warm Paper Credits & NASA Citations Drawer (.jehad-credits)
          ===================================================================== */}
      <div
        className={`jehad-credits ${creditsOpen ? 'open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-hidden={!creditsOpen}
        aria-label="Credits and NASA Sources"
      >
        <div className="jehad-credits-inner">
          <div className="flex items-center justify-between border-b border-[rgba(22,24,28,0.16)] pb-6">
            <span className="text-[11px] font-medium tracking-[0.16em] uppercase text-[rgba(22,24,28,0.68)]">
              SILENT EXPLORERS · DOCUMENTATION
            </span>
            <button
              type="button"
              onClick={() => setCreditsOpen(false)}
              className="border border-[#16181c] px-4 py-1.5 text-[11px] font-medium tracking-[0.14em] uppercase text-[#16181c] hover:bg-[#16181c] hover:text-[#f1efe9]"
            >
              Close
            </button>
          </div>

          <h2 className="mt-8">Credits & Archival Sources</h2>
          <p>
            Silent Explorers tells the story of the spacecraft, rovers, descent stages, and scientific instruments left across our solar system. Rather than waste, each piece of hardware is a scientific monument that unlocked breakthroughs in planetary geology, atmospheric physics, and astrobiology.
          </p>

          <h3>Primary NASA Data & 3D Model Repositories</h3>
          <ul className="list-disc space-y-2 pl-5">
            <li>NASA Science 3D Resources (glTF / GLB spacecraft & planetary models)</li>
            <li>NASA Eyes on the Solar System (ephemeris & orbital context)</li>
            <li>NASA Planetary Data System (PDS) & Apollo Lunar Surface Journal</li>
            <li>Jet Propulsion Laboratory (JPL) Voyager Interstellar Mission Status</li>
          </ul>

          <h3>Motion & Visual Architecture</h3>
          <p>
            Crafted with real-time canvas starlight and dawn shaders, character-by-character rolling typography, smoothstep scroll storytelling beats, and interactive 3D solar-system exploration.
          </p>
        </div>
      </div>

      {/* =====================================================================
          14. Space Apps 2026 Guide Film Modal
          ===================================================================== */}
      {showVideoModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(2,3,7,0.92)] p-4 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-label="Mission Introduction Video"
        >
          <div className="w-full max-w-3xl border border-[rgba(233,231,225,0.22)] bg-[#0b0d13] p-6">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-[11px] tracking-[0.16em] uppercase text-[#e9e7e1]">
                NASA Space Apps 2026 · Visual Guide Briefing
              </span>
              <button
                type="button"
                onClick={() => setShowVideoModal(false)}
                className="text-[11px] tracking-[0.14em] uppercase text-[rgba(233,231,225,0.74)] hover:text-white"
              >
                ✕ Close
              </button>
            </div>
            <video
              src="/assets/aistudio/VID-20261115-WA0003_11873fa1.mp4"
              controls
              autoPlay
              className="aspect-video w-full bg-black"
            />
          </div>
        </div>
      )}

      {/* Persistent Space Explorer AI Assistant */}
      <ExplorerGuideChat
        selectedDestinationId="moon"
        selectedArtifactId={selectedGalleryItem.artifactId}
        onSelectArtifact={(artifactId) => {
          const art = ARTIFACTS.find((a) => a.id === artifactId);
          triggerExploreRoute(art?.destinationId, artifactId);
        }}
      />

      {/* Direct Individual 3D Model Viewer Modal */}
      <ModelViewerModal
        isOpen={modelViewerOpen}
        initialModelId={directModelId}
        onClose={() => setModelViewerOpen(false)}
      />
    </div>
  );
}

export default LandingPage;

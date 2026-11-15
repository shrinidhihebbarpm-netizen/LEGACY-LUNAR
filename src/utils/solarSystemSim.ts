import type { DestinationId } from '../data/spaceData';

export type SolarBodyId =
  | 'sun'
  | 'mercury'
  | 'venus'
  | 'earth'
  | 'moon'
  | 'mars'
  | 'jupiter'
  | 'saturn'
  | 'uranus'
  | 'neptune';

export type SpacecraftMarkerId =
  | 'voyager-1'
  | 'voyager-2'
  | 'pioneer-10'
  | 'pioneer-11'
  | 'new-horizons';

export type SolarTargetId = 'overview' | SolarBodyId | SpacecraftMarkerId | 'deep-space';

export type LightingMode = 'natural' | 'shadow' | 'flood';

export interface SolarBodySpec {
  id: SolarBodyId;
  name: string;
  classification: string;
  orbitColorHex: string;
  orbitRadiusUnits: number;
  radiusUnits: number;
  orbitalPeriodDays: number;
  rotationSpeed: number;
  inclinationDeg: number;
  axialTiltDeg: number;
  eccentricity: number;
  initialAngleRad: number;
  parentId?: 'earth';
  textureUrl?: string;
  modelGlbUrl?: string;
  proceduralTextureKind?: 'sun' | 'mars';
  hasRings?: 'saturn' | 'uranus';
  atmosphereHex?: string;
  destinationId?: DestinationId;
  defaultArtifactId?: string;
  distanceLabel: string;
  summary: string;
}

export interface DeepSpaceProbeSpec {
  id: SpacecraftMarkerId;
  name: string;
  shortLabel: string;
  launchYear: number;
  launchAzimuthRad: number;
  elevationSlope: number;
  currentAu: number;
  speedKmPerSec: number;
  colorHex: string;
  destinationId: DestinationId;
  artifactId: string;
  summary: string;
}

export interface TimeRatePreset {
  id: string;
  label: string;
  shortLabel: string;
  secondsPerSecond: number;
}

/**
 * Discrete time-rate scrubber steps matching https://eyes.nasa.gov/apps/solar-system/
 * Index 5 corresponds to REAL RATE (1 sec/sec).
 */
export const TIME_RATE_PRESETS: TimeRatePreset[] = [
  { id: 'rev-1y', label: '-1 YR/S', shortLabel: '-1Y/s', secondsPerSecond: -31557600 },
  { id: 'rev-1m', label: '-1 MO/S', shortLabel: '-1M/s', secondsPerSecond: -2629800 },
  { id: 'rev-7d', label: '-7 DAYS/S', shortLabel: '-7D/s', secondsPerSecond: -604800 },
  { id: 'rev-1d', label: '-1 DAY/S', shortLabel: '-1D/s', secondsPerSecond: -86400 },
  { id: 'rev-1h', label: '-1 HR/S', shortLabel: '-1H/s', secondsPerSecond: -3600 },
  { id: 'real', label: 'REAL RATE', shortLabel: 'REAL', secondsPerSecond: 1 },
  { id: 'fwd-1m', label: '1 MIN/S', shortLabel: '1M/s', secondsPerSecond: 60 },
  { id: 'fwd-1h', label: '1 HR/S', shortLabel: '1H/s', secondsPerSecond: 3600 },
  { id: 'fwd-1d', label: '1 DAY/S', shortLabel: '1D/s', secondsPerSecond: 86400 },
  { id: 'fwd-7d', label: '7 DAYS/S', shortLabel: '7D/s', secondsPerSecond: 604800 },
  { id: 'fwd-1mo', label: '1 MO/S', shortLabel: '1MO/s', secondsPerSecond: 2629800 },
  { id: 'fwd-1y', label: '1 YR/S', shortLabel: '1Y/s', secondsPerSecond: 31557600 },
];

export const REAL_RATE_INDEX = 5;

/**
 * Exact NASA Eyes Solar System color palette & scaled orbital geometry:
 * - Sun: #f7f4df
 * - Mercury: #9768ac
 * - Venus: #b07919
 * - Earth: #0099cc (Moon: #b6acac)
 * - Mars: #9a4e19
 * - Jupiter: #da8b72
 * - Saturn: #d5c187
 * - Uranus: #68ccda
 * - Neptune: #708ce3
 */
export const SOLAR_BODIES: SolarBodySpec[] = [
  {
    id: 'sun',
    name: 'SUN',
    classification: 'G-Type Main-Sequence Star',
    orbitColorHex: '#f7f4df',
    orbitRadiusUnits: 0,
    radiusUnits: 3.4,
    orbitalPeriodDays: 1,
    rotationSpeed: 0.08,
    inclinationDeg: 0,
    axialTiltDeg: 7.25,
    eccentricity: 0,
    initialAngleRad: 0,
    proceduralTextureKind: 'sun',
    distanceLabel: '0.00 AU · Solar System Barycenter',
    summary:
      'Contains 99.86% of the Solar System’s mass. Its solar wind carves out the protective bubble—the heliosphere—that Voyager 1 and Voyager 2 have crossed.',
  },
  {
    id: 'mercury',
    name: 'MERCURY',
    classification: 'Terrestrial Planet',
    orbitColorHex: '#9768ac',
    orbitRadiusUnits: 9.2,
    radiusUnits: 0.46,
    orbitalPeriodDays: 87.97,
    rotationSpeed: 0.04,
    inclinationDeg: 3.8,
    axialTiltDeg: 0.03,
    eccentricity: 0.08,
    initialAngleRad: 0.9,
    textureUrl: '/textures/planets/mercury.webp',
    distanceLabel: '0.39 AU · Innermost Planet',
    summary:
      'A scarred, iron-rich world blasted by solar heat. NASA’s MESSENGER orbiter mapped its surface and remains in a crater on Mercury’s north pole.',
  },
  {
    id: 'venus',
    name: 'VENUS',
    classification: 'Terrestrial Planet',
    orbitColorHex: '#b07919',
    orbitRadiusUnits: 13.4,
    radiusUnits: 0.72,
    orbitalPeriodDays: 224.7,
    rotationSpeed: -0.025,
    inclinationDeg: 2.1,
    axialTiltDeg: 177.4,
    eccentricity: 0.01,
    initialAngleRad: 2.35,
    textureUrl: '/textures/planets/venus.webp',
    atmosphereHex: '#f5d08a',
    distanceLabel: '0.72 AU · 2nd Planet',
    summary:
      'Shrouded in thick sulfuric clouds and runaway greenhouse heat. Radar orbiters like NASA’s Magellan mapped its volcanic plains before descending into its sky.',
  },
  {
    id: 'earth',
    name: 'EARTH',
    classification: 'Terrestrial Planet',
    orbitColorHex: '#0099cc',
    orbitRadiusUnits: 18.6,
    radiusUnits: 0.78,
    orbitalPeriodDays: 365.25,
    rotationSpeed: 0.32,
    inclinationDeg: 0,
    axialTiltDeg: 23.44,
    eccentricity: 0.016,
    initialAngleRad: 5.55,
    textureUrl: '/textures/planets/earth.webp',
    atmosphereHex: '#288bff',
    destinationId: 'moon',
    defaultArtifactId: 'apollo-11-eagle-descent',
    distanceLabel: '1.00 AU · Homeworld',
    summary:
      'Launchpad for every spacecraft in this archive. From here, Deep Space Network dishes still listen to whispers from Voyager over 24 billion kilometers away.',
  },
  {
    id: 'moon',
    name: 'MOON',
    classification: 'Natural Satellite of Earth',
    orbitColorHex: '#b6acac',
    orbitRadiusUnits: 2.05,
    radiusUnits: 0.25,
    orbitalPeriodDays: 27.32,
    rotationSpeed: 0.06,
    inclinationDeg: 5.14,
    axialTiltDeg: 6.68,
    eccentricity: 0.02,
    initialAngleRad: 1.15,
    parentId: 'earth',
    modelGlbUrl: '/models/moon.glb',
    destinationId: 'moon',
    defaultArtifactId: 'apollo-11-eagle-descent',
    distanceLabel: '384,400 km from Earth',
    summary:
      'Home to 6 Apollo landing sites, Moon Buggies, golden descent stages, seismometers, and laser reflectors still pinged from Earth today.',
  },
  {
    id: 'mars',
    name: 'MARS',
    classification: 'Terrestrial Planet',
    orbitColorHex: '#9a4e19',
    orbitRadiusUnits: 25.0,
    radiusUnits: 0.62,
    orbitalPeriodDays: 686.98,
    rotationSpeed: 0.3,
    inclinationDeg: 1.85,
    axialTiltDeg: 25.19,
    eccentricity: 0.06,
    initialAngleRad: 0.42,
    proceduralTextureKind: 'mars',
    atmosphereHex: '#d97745',
    destinationId: 'mars',
    defaultArtifactId: 'opportunity-rover',
    distanceLabel: '1.52 AU · 4th Planet',
    summary:
      'A robotic museum of exploration—hosting Spirit, Opportunity, InSight, Ingenuity, Perseverance, and their discarded cruise stages and heat shields.',
  },
  {
    id: 'jupiter',
    name: 'JUPITER',
    classification: 'Gas Giant',
    orbitColorHex: '#da8b72',
    orbitRadiusUnits: 39.5,
    radiusUnits: 2.25,
    orbitalPeriodDays: 4332.6,
    rotationSpeed: 0.68,
    inclinationDeg: 1.31,
    axialTiltDeg: 3.13,
    eccentricity: 0.03,
    initialAngleRad: 2.18,
    textureUrl: '/textures/planets/jupiter.webp',
    atmosphereHex: '#e8b89a',
    destinationId: 'jupiter',
    defaultArtifactId: 'galileo-jupiter-probe',
    distanceLabel: '5.20 AU · 5th Planet',
    summary:
      'Largest planet in the Solar System. NASA intentionally steered the Galileo orbiter into Jupiter’s cloud tops to protect its icy ocean moon Europa.',
  },
  {
    id: 'saturn',
    name: 'SATURN',
    classification: 'Ringed Gas Giant',
    orbitColorHex: '#d5c187',
    orbitRadiusUnits: 52.0,
    radiusUnits: 1.88,
    orbitalPeriodDays: 10759.2,
    rotationSpeed: 0.62,
    inclinationDeg: 2.49,
    axialTiltDeg: 26.73,
    eccentricity: 0.04,
    initialAngleRad: 4.15,
    modelGlbUrl: '/models/saturn.glb',
    hasRings: 'saturn',
    atmosphereHex: '#f0dfad',
    destinationId: 'saturn',
    defaultArtifactId: 'cassini-huygens',
    distanceLabel: '9.58 AU · 6th Planet',
    summary:
      'Surrounded by dazzling icy rings. Cassini explored Saturn for 13 years before vaporizing in its upper atmosphere to keep Titan and Enceladus pristine.',
  },
  {
    id: 'uranus',
    name: 'URANUS',
    classification: 'Ice Giant',
    orbitColorHex: '#68ccda',
    orbitRadiusUnits: 64.5,
    radiusUnits: 1.24,
    orbitalPeriodDays: 30688.5,
    rotationSpeed: -0.42,
    inclinationDeg: 0.77,
    axialTiltDeg: 97.77,
    eccentricity: 0.03,
    initialAngleRad: 5.9,
    textureUrl: '/textures/planets/uranus.webp',
    hasRings: 'uranus',
    atmosphereHex: '#7be3f0',
    distanceLabel: '19.2 AU · 7th Planet',
    summary:
      'Spins on its side at nearly 98 degrees. Only Voyager 2 has ever visited this pale cyan ice giant, flying past in January 1986.',
  },
  {
    id: 'neptune',
    name: 'NEPTUNE',
    classification: 'Ice Giant',
    orbitColorHex: '#708ce3',
    orbitRadiusUnits: 76.5,
    radiusUnits: 1.18,
    orbitalPeriodDays: 60182,
    rotationSpeed: 0.45,
    inclinationDeg: 1.77,
    axialTiltDeg: 28.32,
    eccentricity: 0.01,
    initialAngleRad: 3.12,
    textureUrl: '/textures/planets/neptune.webp',
    atmosphereHex: '#5a82f2',
    distanceLabel: '30.1 AU · 8th Planet',
    summary:
      'A windy, deep-blue ice giant 30 times farther from the Sun than Earth. Voyager 2 revealed supersonic storms and geysers on its moon Triton in 1989.',
  },
];

export const DEEP_SPACE_PROBES: DeepSpaceProbeSpec[] = [
  {
    id: 'voyager-1',
    name: 'VOYAGER 1',
    shortLabel: 'VOYAGER 1',
    launchYear: 1977,
    launchAzimuthRad: 0.62,
    elevationSlope: 0.24,
    currentAu: 166,
    speedKmPerSec: 17.0,
    colorHex: '#cd9745',
    destinationId: 'deep-space',
    artifactId: 'voyager-1-2',
    summary: 'Farthest human-made object from Earth, cruising through interstellar space since 2012.',
  },
  {
    id: 'voyager-2',
    name: 'VOYAGER 2',
    shortLabel: 'VOYAGER 2',
    launchYear: 1977,
    launchAzimuthRad: 1.38,
    elevationSlope: -0.22,
    currentAu: 138,
    speedKmPerSec: 15.4,
    colorHex: '#cd9745',
    destinationId: 'deep-space',
    artifactId: 'voyager-1-2',
    summary: 'The only spacecraft to fly by all four giant planets—Jupiter, Saturn, Uranus, and Neptune.',
  },
  {
    id: 'pioneer-10',
    name: 'PIONEER 10',
    shortLabel: 'PIONEER 10',
    launchYear: 1972,
    launchAzimuthRad: 3.45,
    elevationSlope: 0.06,
    currentAu: 137,
    speedKmPerSec: 11.8,
    colorHex: '#cd9745',
    destinationId: 'deep-space',
    artifactId: 'pioneer-10-11',
    summary: 'First spacecraft to cross the asteroid belt and fly past Jupiter; silent since 2003.',
  },
  {
    id: 'pioneer-11',
    name: 'PIONEER 11',
    shortLabel: 'PIONEER 11',
    launchYear: 1973,
    launchAzimuthRad: 4.18,
    elevationSlope: 0.14,
    currentAu: 115,
    speedKmPerSec: 11.2,
    colorHex: '#cd9745',
    destinationId: 'deep-space',
    artifactId: 'pioneer-10-11',
    summary: 'First probe to reach Saturn in 1979, now coasting silently toward the constellation Scutum.',
  },
  {
    id: 'new-horizons',
    name: 'NEW HORIZONS',
    shortLabel: 'NEW HORIZONS',
    launchYear: 2006,
    launchAzimuthRad: 5.25,
    elevationSlope: -0.05,
    currentAu: 60,
    speedKmPerSec: 13.7,
    colorHex: '#cd9745',
    destinationId: 'deep-space',
    artifactId: 'new-horizons-probe',
    summary: 'Revealed Pluto’s nitrogen-ice heart and explored primordial Kuiper Belt object Arrokoth.',
  },
];

// Reference J2000-aligned epoch (Jan 1, 2025 UTC) for deterministic orbit layout
export const SIM_EPOCH_MS = Date.UTC(2025, 0, 1, 0, 0, 0);

/**
 * Advances simulation time smoothly according to the NASA Eyes rate multiplier.
 */
export function advanceSimTime(
  simTimeMs: number,
  dtSeconds: number,
  rateSecondsPerSec: number,
  paused: boolean
): number {
  if (paused || !Number.isFinite(dtSeconds) || dtSeconds <= 0) {
    return simTimeMs;
  }
  return simTimeMs + dtSeconds * rateSecondsPerSec * 1000;
}

/**
 * Computes Keplerian orbital angle (radians) for a planet or moon given simulation time.
 */
export function computeOrbitAngle(
  orbitalPeriodDays: number,
  initialAngleRad: number,
  simTimeMs: number
): number {
  const safePeriodDays = Math.max(orbitalPeriodDays, 0.01);
  const elapsedDays = (simTimeMs - SIM_EPOCH_MS) / 86400000;
  const revolutions = elapsedDays / safePeriodDays;
  return initialAngleRad + revolutions * Math.PI * 2;
}

/**
 * Computes 3D heliocentric position [x, y, z] for a solar system body (resolving Earth for the Moon).
 */
export function computeBodyPosition3D(
  body: SolarBodySpec,
  simTimeMs: number,
  parentPos: [number, number, number] = [0, 0, 0]
): [number, number, number] {
  if (body.id === 'sun') {
    return [0, 0, 0];
  }
  const angle = computeOrbitAngle(body.orbitalPeriodDays, body.initialAngleRad, simTimeMs);
  const a = body.orbitRadiusUnits;
  const b = a * Math.sqrt(Math.max(0.1, 1 - body.eccentricity * body.eccentricity));
  const incRad = (body.inclinationDeg * Math.PI) / 180;

  const localX = Math.cos(angle) * a;
  const rawZ = Math.sin(angle) * b;
  const localY = Math.sin(angle) * a * Math.sin(incRad);
  const localZ = rawZ * Math.cos(incRad);

  return [parentPos[0] + localX, parentPos[1] + localY, parentPos[2] + localZ];
}

/**
 * Generates curved outbound hyperbolic trajectory points from inner Earth orbit into deep space.
 */
export function computeSpacecraftTrajectoryPoints(
  probe: DeepSpaceProbeSpec,
  steps = 48
): [number, number, number][] {
  const points: [number, number, number][] = [];
  const startR = 18.6; // Earth orbit
  const endR = 88 + (probe.currentAu - 60) * 0.22; // Visually staged past Neptune's 76.5 orbit

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const r = startR + (endR - startR) * Math.pow(t, 1.08);
    // Gentle slingshot curve that straightens into hyperbolic asymptote
    const slingshotTwist = (1 - t) * 0.72;
    const angle = probe.launchAzimuthRad - slingshotTwist;
    const x = Math.cos(angle) * r;
    const z = Math.sin(angle) * r;
    const y = Math.pow(t, 1.35) * (r - startR) * probe.elevationSlope;
    points.push([x, y, z]);
  }
  return points;
}

/**
 * Computes current marker position near the tip of the probe's trajectory (breathing slightly with simTimeMs).
 */
export function computeSpacecraftPosition(
  probe: DeepSpaceProbeSpec,
  simTimeMs: number
): [number, number, number] {
  const pts = computeSpacecraftTrajectoryPoints(probe, 40);
  const baseTip = pts[pts.length - 1];
  const yearsOffset = (simTimeMs - SIM_EPOCH_MS) / (86400000 * 365.25);
  const drift = Math.max(-6, Math.min(8, yearsOffset * 0.35));
  const len = Math.hypot(baseTip[0], baseTip[1], baseTip[2]) || 1;
  return [
    baseTip[0] + (baseTip[0] / len) * drift,
    baseTip[1] + (baseTip[1] / len) * drift,
    baseTip[2] + (baseTip[2] / len) * drift,
  ];
}

const MONTHS_SHORT = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

export function formatNasaEyesDateTime(simTimeMs: number): { dateStr: string; timeStr: string } {
  const d = new Date(simTimeMs);
  const month = MONTHS_SHORT[d.getUTCMonth()];
  const day = d.getUTCDate();
  const year = d.getUTCFullYear();
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mm = String(d.getUTCMinutes()).padStart(2, '0');
  const ss = String(d.getUTCSeconds()).padStart(2, '0');
  return {
    dateStr: `${month} ${day}, ${year}`,
    timeStr: `${hh}:${mm}:${ss} UTC`,
  };
}

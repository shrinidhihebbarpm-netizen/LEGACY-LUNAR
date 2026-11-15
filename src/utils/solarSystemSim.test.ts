import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  DEEP_SPACE_PROBES,
  REAL_RATE_INDEX,
  SIM_EPOCH_MS,
  SOLAR_BODIES,
  TIME_RATE_PRESETS,
  advanceSimTime,
  computeBodyPosition3D,
  computeOrbitAngle,
  computeSpacecraftPosition,
  computeSpacecraftTrajectoryPoints,
  formatNasaEyesDateTime,
} from './solarSystemSim';

test('all 6 NASA equirectangular planet textures exist on disk in public/textures/planets and Saturn and Moon use GLB models', () => {
  const expectedFiles = ['mercury.webp', 'venus.webp', 'earth.webp', 'jupiter.webp', 'uranus.webp', 'neptune.webp'];
  for (const file of expectedFiles) {
    const fullPath = path.resolve(process.cwd(), 'public', 'textures', 'planets', file);
    assert.ok(fs.existsSync(fullPath), `Missing planet texture: ${fullPath}`);
    const stat = fs.statSync(fullPath);
    assert.ok(stat.size > 2000, `Texture file unexpectedly small: ${fullPath}`);
  }
  const saturn = SOLAR_BODIES.find((b) => b.id === 'saturn');
  assert.ok(saturn, 'Saturn body spec must exist');
  assert.equal(saturn.modelGlbUrl, '/models/saturn.glb');
  assert.equal(saturn.proceduralTextureKind, undefined);
  assert.ok(fs.existsSync(path.resolve(process.cwd(), 'public', 'models', 'saturn.glb')));

  const moon = SOLAR_BODIES.find((b) => b.id === 'moon');
  assert.ok(moon, 'Moon body spec must exist');
  assert.equal(moon.modelGlbUrl, '/models/moon.glb');
  assert.equal(moon.proceduralTextureKind, undefined);
  assert.ok(fs.existsSync(path.resolve(process.cwd(), 'public', 'models', 'moon.glb')));
});

test('Keplerian orbital speed preserves physical inner-vs-outer planet ratios', () => {
  const mercury = SOLAR_BODIES.find((b) => b.id === 'mercury')!;
  const earth = SOLAR_BODIES.find((b) => b.id === 'earth')!;
  const neptune = SOLAR_BODIES.find((b) => b.id === 'neptune')!;

  const tenDaysMs = SIM_EPOCH_MS + 10 * 86400000;
  const dMercury = computeOrbitAngle(mercury.orbitalPeriodDays, 0, tenDaysMs);
  const dEarth = computeOrbitAngle(earth.orbitalPeriodDays, 0, tenDaysMs);
  const dNeptune = computeOrbitAngle(neptune.orbitalPeriodDays, 0, tenDaysMs);

  assert.ok(dMercury > dEarth * 4.0, 'Mercury should sweep >4x more radians per day than Earth');
  assert.ok(dEarth > dNeptune * 100, 'Earth should sweep >100x more radians per day than Neptune');
});

test('computeBodyPosition3D produces finite coordinates and resolves Moon relative to Earth', () => {
  const earth = SOLAR_BODIES.find((b) => b.id === 'earth')!;
  const moon = SOLAR_BODIES.find((b) => b.id === 'moon')!;

  const earthPos = computeBodyPosition3D(earth, SIM_EPOCH_MS);
  const moonPos = computeBodyPosition3D(moon, SIM_EPOCH_MS, earthPos);

  const dist = Math.hypot(
    moonPos[0] - earthPos[0],
    moonPos[1] - earthPos[1],
    moonPos[2] - earthPos[2]
  );
  assert.ok(Math.abs(dist - moon.orbitRadiusUnits) < 0.2, `Moon distance ${dist} expected near ${moon.orbitRadiusUnits}`);
});

test('deep-space probes produce monotonically expanding outbound trajectories', () => {
  for (const probe of DEEP_SPACE_PROBES) {
    const pts = computeSpacecraftTrajectoryPoints(probe, 20);
    assert.equal(pts.length, 21);
    let prevR = 0;
    for (const [x, y, z] of pts) {
      const r = Math.hypot(x, y, z);
      assert.ok(r > prevR, `Probe ${probe.id} trajectory must strictly expand outward`);
      prevR = r;
    }
    const marker = computeSpacecraftPosition(probe, SIM_EPOCH_MS);
    assert.ok(Number.isFinite(marker[0]) && Number.isFinite(marker[1]) && Number.isFinite(marker[2]));
  }
});

test('advanceSimTime and formatNasaEyesDateTime handle pause, reverse rate, and live formatting', () => {
  assert.equal(TIME_RATE_PRESETS[REAL_RATE_INDEX].secondsPerSecond, 1);

  const paused = advanceSimTime(SIM_EPOCH_MS, 0.5, 86400, true);
  assert.equal(paused, SIM_EPOCH_MS);

  const forwardOneDay = advanceSimTime(SIM_EPOCH_MS, 1, 86400, false);
  assert.equal(forwardOneDay, SIM_EPOCH_MS + 86400 * 1000);

  const backwardOneDay = advanceSimTime(SIM_EPOCH_MS, 1, -86400, false);
  assert.equal(backwardOneDay, SIM_EPOCH_MS - 86400 * 1000);

  const formatted = formatNasaEyesDateTime(SIM_EPOCH_MS);
  assert.equal(formatted.dateStr, 'JAN 1, 2025');
  assert.equal(formatted.timeStr, '00:00:00 UTC');
});

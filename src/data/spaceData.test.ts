import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  ARTIFACTS,
  NASA_3D_MODELS,
  STRICT_REFUSAL_MESSAGE,
  buildLocalExplorerGuideAnswer,
  filterArtifacts,
  getChronologicalTimeline,
  getModelIdForSolarTarget,
  isSpaceTopicQuery,
} from './spaceData';

test('all 23 official NASA and observatory GLB paths exist on disk in public/models', () => {
  const glbModels = NASA_3D_MODELS.filter((m) => Boolean(m.glbUrl));
  assert.equal(glbModels.length, 23);

  for (const model of glbModels) {
    const relPath = model.glbUrl!.replace(/^\//, '');
    const fullPath = path.resolve(process.cwd(), 'public', relPath);
    assert.ok(fs.existsSync(fullPath), `Missing GLB file: ${fullPath}`);
    const stat = fs.statSync(fullPath);
    assert.ok(stat.size > 1000, `GLB file too small: ${fullPath}`);
  }

  // Verify Moon, Apollo LRV, Surveyor 3, Saturn, Hubble, and JWST point to uploaded GLBs
  const moonEntry = NASA_3D_MODELS.find((m) => m.id === 'moon-3d');
  assert.equal(moonEntry?.glbUrl, '/models/moon.glb');
  assert.equal(moonEntry?.proceduralArchetype, undefined);
  assert.equal(NASA_3D_MODELS.find((m) => m.id === 'apollo-lrv-3d')?.glbUrl, '/models/apollo-lrv.glb');
  assert.equal(NASA_3D_MODELS.find((m) => m.id === 'surveyor-3-3d')?.glbUrl, '/models/surveyor-3.glb');
  assert.equal(NASA_3D_MODELS.find((m) => m.id === 'saturn-3d')?.glbUrl, '/models/saturn.glb');
  assert.equal(NASA_3D_MODELS.find((m) => m.id === 'hubble-3d')?.glbUrl, '/models/hubble-1.glb');
  assert.equal(NASA_3D_MODELS.find((m) => m.id === 'jwst-3d')?.glbUrl, '/models/jwst.glb');
  assert.equal(fs.existsSync(path.resolve(process.cwd(), 'public', 'models', 'hubble.glb')), false);
});

test('local Draco decoder binaries exist in public/draco/gltf', () => {
  for (const fileName of ['draco_decoder.js', 'draco_decoder.wasm', 'draco_wasm_wrapper.js']) {
    const fullPath = path.resolve(process.cwd(), 'public', 'draco', 'gltf', fileName);
    assert.ok(fs.existsSync(fullPath), `Missing Draco decoder asset: ${fullPath}`);
  }
});

test('every artifact references a valid NASA_3D_MODELS entry and exact Moon hardware IDs', () => {
  const modelIds = new Set(NASA_3D_MODELS.map((m) => m.id));
  for (const artifact of ARTIFACTS) {
    assert.ok(
      modelIds.has(artifact.model3dId),
      `Artifact ${artifact.id} points to missing model3dId ${artifact.model3dId}`
    );
  }
  assert.equal(ARTIFACTS.find((a) => a.id === 'apollo-lunar-rover-lrv')?.model3dId, 'apollo-lrv-3d');
  assert.equal(ARTIFACTS.find((a) => a.id === 'surveyor-3-lander')?.model3dId, 'surveyor-3-3d');
});

test('getModelIdForSolarTarget maps clickable solar objects directly to their 3D model', () => {
  assert.equal(getModelIdForSolarTarget('saturn'), 'saturn-3d');
  assert.equal(getModelIdForSolarTarget('jupiter'), 'jupiter-3d');
  assert.equal(getModelIdForSolarTarget('mars'), 'mars-3d');
  assert.equal(getModelIdForSolarTarget('earth'), 'earth-3d');
  assert.equal(getModelIdForSolarTarget('moon'), 'moon-3d');
  assert.equal(getModelIdForSolarTarget('apollo-lrv'), 'apollo-lrv-3d');
  assert.equal(getModelIdForSolarTarget('surveyor-3'), 'surveyor-3-3d');
  assert.equal(getModelIdForSolarTarget('mercury'), 'mercury-3d');
  assert.equal(getModelIdForSolarTarget('venus'), 'venus-3d');
  assert.equal(getModelIdForSolarTarget('uranus'), 'uranus-3d');
  assert.equal(getModelIdForSolarTarget('neptune'), 'neptune-3d');
  assert.equal(getModelIdForSolarTarget('voyager-1'), 'voyager-3d');
  assert.equal(getModelIdForSolarTarget('hubble'), 'hubble-3d');
  assert.equal(getModelIdForSolarTarget('jwst'), 'jwst-3d');
  assert.equal(getModelIdForSolarTarget('sun'), null);
});

test('filterArtifacts and getChronologicalTimeline work deterministically', () => {
  const marsArtifacts = filterArtifacts(ARTIFACTS, { destinationId: 'mars' });
  assert.ok(marsArtifacts.length >= 4);
  assert.ok(marsArtifacts.every((a) => a.destinationId === 'mars'));

  const traveling = filterArtifacts(ARTIFACTS, { statusFilter: 'traveling' });
  assert.ok(traveling.length >= 3);
  assert.ok(traveling.every((a) => a.status === 'Still Traveling'));

  const timeline = getChronologicalTimeline(ARTIFACTS);
  for (let i = 1; i < timeline.length; i++) {
    assert.ok(timeline[i].year >= timeline[i - 1].year);
  }
});

test('Space Explorer AI answers astronomy questions, supports follow-up detail, and declines non-space topics', () => {
  assert.equal(isSpaceTopicQuery('Why was Eagle left on the Moon?'), true);
  assert.equal(isSpaceTopicQuery('What is a black hole?'), true);
  assert.equal(isSpaceTopicQuery('Bake chocolate chip cookies'), false);
  assert.equal(isSpaceTopicQuery('Write python code for a sorting algorithm'), false);

  const refusal = buildLocalExplorerGuideAnswer('Bake chocolate chip cookies');
  assert.equal(refusal.isRefusal, true);
  assert.equal(refusal.reply, STRICT_REFUSAL_MESSAGE);

  const saturnAns = buildLocalExplorerGuideAnswer('Tell me about Saturn’s rings.');
  assert.equal(saturnAns.isRefusal, false);
  assert.match(saturnAns.reply, /ice/i);

  const jwstAns = buildLocalExplorerGuideAnswer('What is the James Webb Space Telescope?');
  assert.equal(jwstAns.isRefusal, false);
  assert.match(jwstAns.reply, /infrared|6\.5/i);

  const hubbleAns = buildLocalExplorerGuideAnswer('How does the Hubble Telescope work?');
  assert.equal(hubbleAns.isRefusal, false);
  assert.match(hubbleAns.reply, /2\.4-meter|mirror/i);

  const blackHoleAns = buildLocalExplorerGuideAnswer('What is a black hole?');
  assert.equal(blackHoleAns.isRefusal, false);
  assert.match(blackHoleAns.reply, /event horizon|gravity/i);

  const marsDistAns = buildLocalExplorerGuideAnswer('How far is Mars from Earth?');
  assert.equal(marsDistAns.isRefusal, false);
  assert.match(marsDistAns.reply, /225 million|54\.6 million/i);

  const nebulaAns = buildLocalExplorerGuideAnswer('What is a nebula?');
  assert.equal(nebulaAns.isRefusal, false);
  assert.match(nebulaAns.reply, /gas|dust/i);

  const followUp = buildLocalExplorerGuideAnswer('Tell me more detail', {
    lastTopicText: 'What is a black hole?',
  });
  assert.equal(followUp.isRefusal, false);
  assert.match(followUp.reply, /supermassive|stellar-mass/i);
});

test('getGhostMissions includes Opportunity rover and Pioneer probes with Dormant/Retired status', async () => {
  const { getGhostMissions } = await import('./spaceData');
  const allGhosts = getGhostMissions(ARTIFACTS, 'all');
  assert.ok(allGhosts.length >= 6);
  assert.ok(allGhosts.some((g) => g.artifact.id === 'opportunity-rover' && g.ghostStatus === 'Dormant'));
  assert.ok(allGhosts.some((g) => g.artifact.id === 'pioneer-10-11' && g.ghostStatus === 'Dormant'));
  assert.ok(allGhosts.some((g) => g.artifact.id === 'apollo-11-eagle-descent' && g.ghostStatus === 'Retired'));

  const dormantOnly = getGhostMissions(ARTIFACTS, 'Dormant');
  assert.ok(dormantOnly.every((g) => g.ghostStatus === 'Dormant'));

  const retiredOnly = getGhostMissions(ARTIFACTS, 'Retired');
  assert.ok(retiredOnly.every((g) => g.ghostStatus === 'Retired'));
});

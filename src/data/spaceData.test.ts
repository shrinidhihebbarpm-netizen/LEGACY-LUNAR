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
  isSpaceTopicQuery,
} from './spaceData';

test('all 18 official NASA GLB paths exist on disk in public/models', () => {
  const glbModels = NASA_3D_MODELS.filter((m) => Boolean(m.glbUrl));
  assert.equal(glbModels.length, 18);

  for (const model of glbModels) {
    const relPath = model.glbUrl!.replace(/^\//, '');
    const fullPath = path.resolve(process.cwd(), 'public', relPath);
    assert.ok(fs.existsSync(fullPath), `Missing GLB file: ${fullPath}`);
    const stat = fs.statSync(fullPath);
    assert.ok(stat.size > 1000, `GLB file too small: ${fullPath}`);
  }
});

test('local Draco decoder binaries exist in public/draco/gltf', () => {
  for (const fileName of ['draco_decoder.js', 'draco_decoder.wasm', 'draco_wasm_wrapper.js']) {
    const fullPath = path.resolve(process.cwd(), 'public', 'draco', 'gltf', fileName);
    assert.ok(fs.existsSync(fullPath), `Missing Draco decoder asset: ${fullPath}`);
  }
});

test('every artifact references a valid NASA_3D_MODELS entry', () => {
  const modelIds = new Set(NASA_3D_MODELS.map((m) => m.id));
  for (const artifact of ARTIFACTS) {
    assert.ok(
      modelIds.has(artifact.model3dId),
      `Artifact ${artifact.id} points to missing model3dId ${artifact.model3dId}`
    );
  }
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

test('isSpaceTopicQuery and buildLocalExplorerGuideAnswer enforce topic boundaries', () => {
  assert.equal(isSpaceTopicQuery('Why was Eagle left on the Moon?'), true);
  assert.equal(isSpaceTopicQuery('Write python code for a sorting algorithm'), false);

  const refusal = buildLocalExplorerGuideAnswer('Write an essay about crypto');
  assert.equal(refusal.isRefusal, true);
  assert.equal(refusal.reply, STRICT_REFUSAL_MESSAGE);

  const voyagerAns = buildLocalExplorerGuideAnswer('Where is Voyager 1 now?');
  assert.equal(voyagerAns.isRefusal, false);
  assert.ok(voyagerAns.sources.length > 0);
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


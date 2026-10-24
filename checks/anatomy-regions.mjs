import assert from 'node:assert/strict';
import { Group, Mesh, BoxGeometry, MeshStandardMaterial } from 'three';
import { createLowPolyStegosaurus } from './stegosaurus-source.mjs';
import { validateSpecimenConfig, validateViewerInputs } from '../src/lib/specimens/specimen-config.ts';
import { resolveAnatomyRegions, regionBounds } from '../src/lib/viewer/anatomy-regions.ts';
import { stegosaurusConfig as config, stegosaurusText as text } from './specimen-config-fixtures.mjs';

// A subtree-only implementation would lose the neck/tail plates; a broad armor
// match would incorrectly admit flank scales. Expectations are asset counts.
validateSpecimenConfig(config);
validateViewerInputs(config, text, { kind: 'none' });
const model = createLowPolyStegosaurus();
const regions = resolveAnatomyRegions(model, config.regions);
const [head, plates, spikes] = regions;
assert.equal(plates.pickMeshes.length, 19);
assert.equal(spikes.pickMeshes.length, 4);
assert.deepEqual(new Set(plates.pickMeshes.map(m => m.parent.name)), new Set(['armorGroup', 'headGroup', 'tailGroup']));
assert(plates.pickMeshes.every(m => m.name.startsWith('dorsalPlate_')));
assert(spikes.highlightMeshes.every(m => m.name.startsWith('thagomizer_')));
assert(head.highlightMeshes.every(m => !m.name.startsWith('dorsalPlate_')));
assert(!plates.pickMeshes.includes(model.getObjectByName('bodyMesh')));
const before = regionBounds(plates);
plates.boundsMeshes[0].position.y += 20;
assert(regionBounds(plates).max.y > before.max.y + 10, 'child transforms invalidate bounds independently of anchor parent');
const duplicate = { ...config.regions[1], pick: [...config.regions[1].pick, ...config.regions[1].pick] };
assert.equal(resolveAnatomyRegions(model, [duplicate])[0].pickMeshes.length, 19, 'selectors deduplicate membership');
assert.equal(resolveAnatomyRegions(new Group(), config.regions)[0].available, false);
assert.equal(resolveAnatomyRegions(model, [{ ...config.regions[0], anchor: { node: 'absent', point: [0, 0, 0] } }])[0].available, false);
assert.throws(() => resolveAnatomyRegions(model, [config.regions[0], { ...config.regions[0], id: 'otherHead' }]), /ambiguous/i);

for (const lengthMetres of [0, -1, NaN, Infinity]) {
  assert.throws(() => validateSpecimenConfig({ ...config, scale: { lengthMetres } }), /scale/i);
}
for (const regions of [
  [], [config.regions[0], config.regions[0]], [{ ...config.regions[0], id: '' }],
  [{ ...config.regions[0], pick: [] }],
  [{ ...config.regions[0], pick: [{ kind: 'prefix', prefix: '' }] }],
  [{ ...config.regions[0], anchor: { node: 'headGroup', point: [NaN, 0, 0] } }],
  [{ ...config.regions[0], upperSurface: { mesh: 'bodyMesh', minHeightRatio: 2 } }]
]) assert.throws(() => validateSpecimenConfig({ ...config, regions }), /region|selector|anchor|surface/i);
assert.throws(() => validateViewerInputs(config, { ...text, anatomy: {} }, { kind: 'none' }), /text/i);
assert.throws(() => validateViewerInputs(config, { ...text, anatomy: { ...text.anatomy, extra: text.anatomy.head } }, { kind: 'none' }), /text/i);
assert.throws(() => validateViewerInputs(config, text, { kind: 'guided' }), /capability/i);
assert.throws(() => validateSpecimenConfig({ ...config, study: { kind: 'guided', targets: {
  armor: { regionId: 'absent', emphasis: [{ kind: 'mesh', name: 'bodyMesh' }] },
  tailClub: { regionId: 'spikes', emphasis: [{ kind: 'prefix', prefix: 'thagomizer_' }] }
} } }), /study/i);
// Three separate memberships must stay independent, even with shared materials.
const small = new Group();
for (const name of ['pick', 'highlight', 'bounds']) {
  const mesh = new Mesh(new BoxGeometry(1, 1, 1), new MeshStandardMaterial());
  mesh.name = name; small.add(mesh);
}
const [separate] = resolveAnatomyRegions(small, [{ id: 'separate',
  ...Object.fromEntries(['pick', 'highlight', 'bounds'].map(key => [key, [{ kind: 'mesh', name: key }]])),
  anchor: { node: 'pick', point: [0, 0, 0] }
}]);
assert.equal(separate.pickMeshes[0].name, 'pick');
assert.equal(separate.highlightMeshes[0].name, 'highlight');
assert.equal(separate.boundsMeshes[0].name, 'bounds');
for (const root of [model, small]) root.traverse(o => { if (o.isMesh) { o.geometry.dispose(); o.material.dispose(); } });
console.log('Configured anatomy membership, transforms, availability, ambiguity, and validation assertions passed.');

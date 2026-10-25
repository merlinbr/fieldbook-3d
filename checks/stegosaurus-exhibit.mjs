import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Box3, Sphere, Vector3, OrthographicCamera } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { createStegosaurusConfig } from '../src/lib/specimens/stegosaurus-config.ts';
import { validateSpecimenConfig } from '../src/lib/specimens/specimen-config.ts';
import { resolveAnatomyRegions, regionBounds } from '../src/lib/viewer/anatomy-regions.ts';
import { createAnatomyInspection } from '../src/lib/viewer/anatomy-inspection.ts';
import { createScaleComparison } from '../src/lib/viewer/scale-comparison.ts';
import { orthographicHalfHeight } from '../src/lib/viewer/camera-fit.ts';

const config = createStegosaurusConfig('https://media.example/stegosaurus.glb');
validateSpecimenConfig(config);
assert.equal(config.id, 'stegosaurus');
assert.deepEqual(config.regions.map(r => r.id), ['head', 'plates', 'spikes']);
assert.deepEqual(config.scale, { lengthMetres: 9 });
assert.deepEqual(config.study, { kind: 'none' });
const directory = await mkdtemp(join(tmpdir(), 'fieldbook-stegosaurus-exhibit-'));
const previousWindow = globalThis.window;
const previousDocument = globalThis.document;
let model, inspection, comparison;
try {
  const output = join(directory, 'stegosaurus.glb');
  const result = spawnSync(process.execPath, [fileURLToPath(new URL('../tools/export-stegosaurus.mjs', import.meta.url)), output], {
    cwd: directory, encoding: 'utf8'
  });
  assert.equal(result.status, 0, result.stderr);
  const bytes = await readFile(output);
  ({ scene: model } = await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), ''));
  const meshes = [];
  model.traverse(o => { if (o.isMesh) meshes.push(o); });
  assert.equal(meshes.reduce((n, m) => n + (m.geometry.index?.count ?? m.geometry.getAttribute('position').count) / 3, 0), 2976);
  const regions = resolveAnatomyRegions(model, config.regions);
  assert(regions.every(r => r.available && !regionBounds(r).isEmpty()));
  const [head, plates, spikes] = regions;
  for (const property of ['pickMeshes', 'highlightMeshes', 'boundsMeshes']) {
    assert.equal(plates[property].length, 19);
    assert(plates[property].every(m => m.name.startsWith('dorsalPlate_')));
    assert.equal(spikes[property].length, 4);
    assert(spikes[property].every(m => m.name.startsWith('thagomizer_')));
    assert(head[property].every(m => !m.name.startsWith('dorsalPlate_')));
  }
  assert.deepEqual(new Set(plates.pickMeshes.map(m => m.parent.name)), new Set(['armorGroup', 'headGroup', 'tailGroup']));
  const bounds = new Box3().setFromObject(model, true);
  comparison = createScaleComparison(bounds, meshes, config.scale, () => {});
  assert.equal(comparison.factor, 9 / bounds.getSize(new Vector3()).x);
  const guide = comparison.root.getObjectByName('length-guide').geometry.getAttribute('position');
  assert(Math.abs(guide.getX(1) - guide.getX(0) - 9) < 1e-6);
  const human = new Box3().setFromObject(comparison.root.getObjectByName('human-reference'), true);
  assert(Math.abs(human.max.y - human.min.y - 1.7) < 1e-6);
  const calibrated = bounds.clone();
  for (const point of [calibrated.min, calibrated.max]) point.sub(comparison.origin).multiplyScalar(comparison.factor).add(comparison.origin);
  assert(comparison.bounds.containsBox(calibrated));
  const radius = comparison.bounds.getBoundingSphere(new Sphere()).radius;
  for (const aspect of [1440 / 900, 390 / 844]) {
    const height = orthographicHalfHeight(radius, radius, aspect);
    assert(height >= radius && height * aspect >= radius);
  }

  // Only the DOM adapter is simulated; selection and material ownership use the real GLB.
  const canvas = new EventTarget();
  canvas.style = { cursor: '', removeProperty(name) { delete this[name]; } };
  canvas.getBoundingClientRect = () => ({ left: 0, top: 0, width: 800, height: 800 });
  globalThis.window = new EventTarget();
  globalThis.document = Object.assign(new EventTarget(), { hidden: false, elementFromPoint: () => canvas });
  const camera = new OrthographicCamera(-8, 8, 8, -8, 0.1, 100);
  camera.position.set(0, 4, 15); camera.lookAt(0, 2, 0);
  const originals = new Map(meshes.map(m => [m, m.material]));
  inspection = createAnatomyInspection(model, regions, camera, canvas, () => {});
  inspection.update(800, 800);
  for (const [id, expected] of [['plates', plates.highlightMeshes], ['spikes', spikes.highlightMeshes], ['head', head.highlightMeshes]]) {
    inspection.select(id);
    assert.deepEqual(new Set(meshes.filter(m => m.material !== originals.get(m))), new Set(expected));
    inspection.select(null);
    assert(meshes.every(m => m.material === originals.get(m)));
  }
  console.log('Exported Stegosaurus anatomy, material restoration, 9 m calibration, human and framing assertions passed.');
} finally {
  inspection?.dispose(); comparison?.dispose();
  const resources = new Set();
  model?.traverse(o => { if (o.isMesh) { resources.add(o.geometry); for (const m of Array.isArray(o.material) ? o.material : [o.material]) resources.add(m); } });
  for (const resource of resources) resource.dispose();
  if (previousWindow === undefined) delete globalThis.window; else globalThis.window = previousWindow;
  if (previousDocument === undefined) delete globalThis.document; else globalThis.document = previousDocument;
  await rm(directory, { recursive: true, force: true });
}

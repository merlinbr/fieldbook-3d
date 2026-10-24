import assert from 'node:assert/strict';
import { Box3, BoxGeometry, Mesh, MeshStandardMaterial, Vector3 } from 'three';
import { createScaleComparison } from '../src/lib/viewer/scale-comparison.ts';

const mesh = new Mesh(new BoxGeometry(2, 1, 1), new MeshStandardMaterial());
const bounds = new Box3(new Vector3(-1, 0, -0.5), new Vector3(1, 1, 0.5));
for (const [lengthMetres, factor] of [[10, 5], [8, 4]]) {
  const comparison = createScaleComparison(bounds, [mesh], { lengthMetres }, () => {});
  assert.equal(comparison.factor, factor, 'scale factor must consume the explicit specimen length');
  const guide = comparison.root.getObjectByName('length-guide').geometry.getAttribute('position');
  assert(Math.abs(guide.getX(1) - guide.getX(0) - lengthMetres) < 1e-6);
  const human = new Box3().setFromObject(comparison.root.getObjectByName('human-reference'), true);
  assert(Math.abs(human.max.y - human.min.y - 1.7) < 1e-6);
  assert(comparison.bounds.min.x <= -lengthMetres / 2 && comparison.bounds.max.x >= lengthMetres / 2);
  let sourceDisposals = 0;
  const onDispose = () => { sourceDisposals++; };
  mesh.geometry.addEventListener('dispose', onDispose);
  mesh.material.addEventListener('dispose', onDispose);
  const owned = new Map();
  comparison.root.traverse(o => {
    for (const resource of [o.geometry, o.material]) if (resource && !owned.has(resource)) {
      owned.set(resource, 0); resource.addEventListener('dispose', () => owned.set(resource, owned.get(resource) + 1));
    }
  });
  comparison.setVisible(true); comparison.setVisible(false); comparison.setVisible(true);
  comparison.dispose(); comparison.dispose();
  assert([...owned.values()].every(count => count === 1), 'owned resources disposed exactly once');
  assert.equal(sourceDisposals, 0, 'comparison does not own specimen resources');
  mesh.geometry.removeEventListener('dispose', onDispose);
  mesh.material.removeEventListener('dispose', onDispose);
}
for (const lengthMetres of [0, -1, NaN, Infinity]) {
  assert.throws(() => createScaleComparison(bounds, [mesh], { lengthMetres }, () => {}), RangeError);
}
assert.throws(() => createScaleComparison(bounds, [mesh], null, () => {}), RangeError);
assert.throws(() => createScaleComparison(new Box3(), [mesh], { lengthMetres: 8 }, () => {}), RangeError);
mesh.geometry.dispose(); mesh.material.dispose();
console.log('Explicit scale, human reference, guide, bounds, and resource ownership assertions passed.');

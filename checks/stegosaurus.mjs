import assert from 'node:assert/strict';
import { Box3, Vector3 } from 'three';
import { createLowPolyStegosaurus } from '../example project/low-poly/stegosaurus.js';
import { createWalkCycle } from '../example project/low-poly/walk-cycle.js';

const model = createLowPolyStegosaurus();
let triangles = 0;
const plates = [], spikes = [];
model.traverse(part => {
  if (!part.isMesh) return;
  if (part.name.startsWith('dorsalPlate_')) plates.push(part);
  if (part.name.startsWith('thagomizer_')) spikes.push(part);
  assert(part.castShadow && part.receiveShadow, part.name);
  assert(part.material.isMeshStandardMaterial && part.material.flatShading, part.name);
  const positions = part.geometry.attributes.position;
  const indices = part.geometry.index;
  const count = indices?.count ?? positions.count;
  triangles += count / 3;
  for (let i = 0; i < positions.count; i++) {
    assert([positions.getX(i), positions.getY(i), positions.getZ(i)].every(Number.isFinite), part.name);
  }
  const a = new Vector3(), b = new Vector3(), c = new Vector3();
  const point = (i, target) => target.fromBufferAttribute(positions, indices ? indices.getX(i) : i);
  for (let i = 0; i < count; i += 3) {
    point(i, a); point(i + 1, b); point(i + 2, c);
    assert(b.sub(a).cross(c.sub(a)).lengthSq() > 1e-14, `Degenerate triangle: ${part.name}`);
  }
});
assert(triangles <= 3000, `Triangle budget exceeded: ${triangles}`);
assert.equal(triangles, model.userData.triangles);
assert.equal(plates.length, 19, 'Nineteen dorsal plates');
assert.equal(spikes.length, 4, 'Four tail spikes');
model.updateMatrixWorld(true);
plates.sort((a, b) => a.getWorldPosition(new Vector3()).x - b.getWorldPosition(new Vector3()).x);
for (let i = 1; i < plates.length; i++) {
  assert(plates[i].getWorldPosition(new Vector3()).z * plates[i - 1].getWorldPosition(new Vector3()).z < 0, 'Plates alternate rows');
}
const plateBounds = new Box3();
for (const plate of plates) plateBounds.union(new Box3().setFromObject(plate, true));
assert(plateBounds.max.y > new Box3().setFromObject(model.getObjectByName('bodyMesh'), true).max.y + 0.8, 'Plates rise above the back');
const bounds = new Box3().setFromObject(model, true);
assert(bounds.min.y >= -0.01 && bounds.min.y <= 0.1, 'Resting feet meet the ground');

// Neck plates and tail spikes must stay attached when their pivots turn.
for (const [pivotName, part] of [['headGroup', plates[0]], ['tailGroup', spikes[0]]]) {
  const pivot = model.getObjectByName(pivotName);
  const before = part.getWorldPosition(new Vector3());
  const local = part.position.clone();
  pivot.rotation.y = 0.4;
  model.updateMatrixWorld(true);
  assert(part.getWorldPosition(new Vector3()).distanceTo(before) > 0.1, `${part.name} follows ${pivotName}`);
  assert(part.position.equals(local), 'Pivot movement does not change local anatomy');
  pivot.rotation.y = 0;
}
const legs = model.getObjectByName('legsGroup').children;
assert.equal(legs.length, 4);
const updateWalk = createWalkCycle(model);
const box = new Box3();
model.updateMatrixWorld(true);
const floors = legs.map(leg => box.setFromObject(leg, true).min.y);
const heights = legs.map(leg => leg.position.y);
for (const strength of [0, 0.5, 1]) {
  for (let frame = 0; frame < 120; frame++) {
    updateWalk(frame * 2.8 / 120, strength);
    model.updateMatrixWorld(true);
    let planted = 0;
    for (let i = 0; i < legs.length; i++) {
      const lift = box.setFromObject(legs[i], true).min.y - floors[i];
      assert(lift >= -1e-8 && lift <= 0.09 * strength + 1e-8, `Foot clearance: ${lift}`);
      if (Math.abs(lift) < 1e-8) planted++;
    }
    assert(planted >= 3, 'Walk retains three supporting feet');
  }
}
updateWalk(123, 0);
for (let i = 0; i < legs.length; i++) {
  assert(legs[i].rotation.z === 0, 'Leg returns to its resting angle');
  assert(Math.abs(legs[i].position.y - heights[i]) < 1e-12);
}
assert(model.position.y === 0, 'Body returns to ground level');
assert(model.getObjectByName('headGroup').rotation.y === 0, 'Head returns to rest');
assert(model.getObjectByName('tailGroup').rotation.y === 0, 'Tail returns to rest');
console.log(`PASS Stegosaurus: ${triangles} triangles; 19 alternating plates, four spikes, attached anatomy, valid geometry and grounded gait.`);

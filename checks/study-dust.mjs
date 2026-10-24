import assert from 'node:assert/strict';
import { Group, SpotLight, Vector3 } from 'three';
import { createStudyDust } from '../src/lib/viewer/study-dust.ts';

const spotlight = new SpotLight('#fff1ce', 3.4, 0, Math.PI / 5, 0.8, 0);
spotlight.position.set(-2.8, 8.8, 6);
spotlight.target.position.set(0, 0, 0);
const dust = createStudyDust(spotlight);
const wrapper = new Group();
wrapper.add(dust.root);
const positions = dust.root.geometry.getAttribute('position');
assert.ok(positions.count > 0 && positions.count <= 64, 'one bounded point cloud keeps the draw budget small');
assert.equal(dust.root.visible, false, 'ordinary Explore has no dust');
assert.equal(dust.root.material.depthTest, true, 'nearer anatomy occludes the dust');
assert.equal(dust.root.material.depthWrite, false, 'transparent dust never masks specimen surfaces');

dust.update(0, 1, false);
assert.equal(dust.root.visible, true);
assert.ok(dust.root.material.opacity > 0 && dust.root.material.opacity <= 0.3);
const initial = positions.array.slice();
dust.update(16, 1, false);
assert.notDeepEqual(positions.array, initial, 'active dust drifts between animation frames');

// Visible drift over a short glance, while remaining gentle at specimen scale.
for (let time = 32; time <= 2016; time += 16) dust.update(time, 1, false);
let totalTravel = 0;
for (let index = 0; index < positions.count; index++) {
  totalTravel += new Vector3().fromBufferAttribute(positions, index)
    .distanceTo(new Vector3().fromArray(initial, index * 3));
}
const meanTravel = totalTravel / positions.count;
assert.ok(meanTravel > 0.12 && meanTravel < 1, `two seconds of dust drift should be noticeable but restrained (${meanTravel})`);

// Escaping the cone would make bright particles float in the unlit background.
const axis = spotlight.target.position.clone().sub(spotlight.position).normalize();
const offset = new Vector3();
for (let time = 3000; time <= 60000; time += 1000) {
  dust.update(time, 1, false);
  for (let index = 0; index < positions.count; index++) {
    offset.fromBufferAttribute(positions, index).sub(spotlight.position);
    const depth = offset.dot(axis);
    assert.ok(depth > 0);
    assert.ok(offset.clone().addScaledVector(axis, -depth).length() < depth * Math.tan(spotlight.angle));
  }
}
const fullOpacity = dust.root.material.opacity;
dust.update(60016, 0.5, false);
assert.ok(dust.root.material.opacity > 0 && dust.root.material.opacity < fullOpacity, 'Pause/Exit fade with the lighting');
dust.update(60032, 0, false);
assert.equal(dust.root.visible, false);
const hidden = positions.array.slice();
dust.update(120000, 0, false);
assert.deepEqual(positions.array, hidden, 'hidden dust does no position updates');
dust.update(120016, 1, true);
assert.equal(dust.root.visible, false, 'reduced motion hides dust even during cinema playback');
assert.equal(dust.root.material.opacity, 0);
assert.deepEqual(positions.array, hidden, 'reduced motion stops particle motion');
dust.update(180000, 1, false);
for (let index = 0; index < positions.array.length; index++) {
  assert.ok(Math.abs(positions.array[index] - hidden[index]) < 0.05, 'returning after a hidden interval has no large jump');
}

const resources = [dust.root.geometry, dust.root.material, dust.root.material.map];
const disposals = resources.map(() => 0);
resources.forEach((resource, index) => resource.addEventListener('dispose', () => ++disposals[index]));
dust.dispose();
dust.dispose();
dust.update(180016, 1, false);
assert.equal(dust.root.parent, null);
assert.equal(dust.root.visible, false);
assert.deepEqual(disposals, [1, 1, 1], 'owned geometry, material, and sprite are disposed exactly once');
console.log('Study dust motion, spotlight containment, fade, reduced motion, and disposal assertions passed.');

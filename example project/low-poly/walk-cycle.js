import * as THREE from 'three';

/** Walk in place; seconds are simulation time, strength is 0 (rest) to 1 (walk). */
export function createWalkCycle(model) {
  const rootY = model.position.y;
  const head = model.getObjectByName('headGroup');
  const tail = model.getObjectByName('tailGroup');
  const headY = head.rotation.y, headZ = head.rotation.z, tailY = tail.rotation.y;
  const phases = [0, Math.PI, Math.PI * 1.5, Math.PI * 0.5];
  const point = new THREE.Vector3();
  const legs = model.getObjectByName('legsGroup').children.map((leg, index) => {
    const sole = [];
    for (const part of leg.children) {
      if (part.name !== 'foot' && !part.name.startsWith('toe_')) continue;
      part.updateMatrix();
      const positions = part.geometry.attributes.position;
      for (let i = 0; i < positions.count; i++) {
        point.fromBufferAttribute(positions, i).applyMatrix4(part.matrix);
        sole.push(point.x, point.y);
      }
    }
    let lowest = Infinity;
    for (let i = 1; i < sole.length; i += 2) lowest = Math.min(lowest, sole[i]);
    return { leg, sole, y: leg.position.y, lowest, phase: phases[index] };
  });

  return function updateWalk(seconds, strength = 1) {
    const phase = seconds * Math.PI * 2 / 2.8;
    const bob = 0.012 * (1 - Math.cos(phase * 4)) * strength;
    model.position.y = rootY + bob;
    head.rotation.y = headY + Math.sin(phase * 0.5) * 0.025 * strength;
    head.rotation.z = headZ + Math.sin(phase + 0.4) * 0.018 * strength;
    tail.rotation.y = tailY + Math.sin(phase - 0.7) * 0.045 * strength;
    for (const { leg, sole, y, lowest, phase: offset } of legs) {
      const step = ((phase + offset) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
      const angle = Math.cos(step) * 0.1 * strength;
      leg.rotation.z = angle;
      const sine = Math.sin(angle), cosine = Math.cos(angle);
      let posedLowest = Infinity;
      for (let i = 0; i < sole.length; i += 2) {
        posedLowest = Math.min(posedLowest, sole[i] * sine + sole[i + 1] * cosine);
      }
      // One foot swings at a time; the other three retain their resting ground clearance.
      const lift = step < Math.PI / 2 ? Math.sin(step * 2) * 0.09 * strength : 0;
      leg.position.y = y + lowest - posedLowest - bob + lift;
    }
  };
}

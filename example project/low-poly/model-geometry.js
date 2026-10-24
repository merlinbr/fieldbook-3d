import * as THREE from 'three';

const pyramid = new THREE.ConeGeometry(1, 1, 4, 1);

export function mesh(parent, name, geometry, material, position = [0, 0, 0], scale = [1, 1, 1]) {
  const part = new THREE.Mesh(geometry, material);
  part.name = name;
  part.position.set(...position);
  part.scale.set(...scale);
  part.castShadow = part.receiveShadow = true;
  parent.add(part);
  return part;
}

export function group(parent, name, position) {
  const part = new THREE.Group();
  part.name = name;
  part.position.set(...position);
  parent.add(part);
  return part;
}

// Closed triangulated longitudinal rings: [x, centreY, centreZ, radiusY, radiusZ].
export function loft(rings, sides = 10, section = null) {
  const vertices = [], indices = [];
  for (const [x, y, z, ry, rz] of rings) {
    for (let j = 0; j < sides; j++) {
      const a = j * Math.PI * 2 / sides;
      const [sy, sz] = section ? section[j] : [Math.cos(a), Math.sin(a)];
      vertices.push(x, y + sy * ry, z + sz * rz);
    }
  }
  for (let i = 0; i < rings.length - 1; i++) {
    for (let j = 0; j < sides; j++) {
      const a = i * sides + j, b = i * sides + (j + 1) % sides;
      const c = b + sides, d = a + sides;
      indices.push(a, b, d, b, c, d);
    }
  }
  for (const end of [0, rings.length - 1]) {
    const centre = vertices.length / 3;
    vertices.push(...rings[end].slice(0, 3));
    for (let j = 0; j < sides; j++) {
      const a = end * sides + j, b = end * sides + (j + 1) % sides;
      indices.push(...(end === 0 ? [centre, b, a] : [centre, a, b]));
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

export function spike(parent, name, base, tip, radius, material) {
  const start = new THREE.Vector3(...base), end = new THREE.Vector3(...tip);
  const delta = end.clone().sub(start);
  const part = mesh(parent, name, pyramid, material, start.clone().add(end).multiplyScalar(0.5).toArray(), [radius, delta.length(), radius]);
  part.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize());
  return part;
}

export function segment(parent, name, a, b, ra, rb, material) {
  const start = new THREE.Vector3(...a), end = new THREE.Vector3(...b);
  const delta = end.clone().sub(start);
  const geometry = new THREE.CylinderGeometry(rb, ra, 1, 5, 1);
  const part = mesh(parent, name, geometry, material, start.add(end).multiplyScalar(0.5).toArray(), [1, delta.length(), 1]);
  part.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize());
}

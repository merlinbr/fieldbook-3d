import * as THREE from 'three';
import { mesh, group, loft, spike, segment } from './model-geometry.js';

/** +Y up, head toward -X. Same head/tail/leg pivot convention as Ankylosaurus. */
export function createLowPolyStegosaurus() {
  const root = new THREE.Group();
  root.name = 'stegosaurus';
  const material = color => new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 0.87, metalness: 0.1 });
  const hide = material('#65734e'), belly = material('#cfc5a7');
  const armor = material('#b5aa81'), beak = material('#77745c'), eye = material('#171d16');
  const plateShades = [armor, material('#a99b72'), material('#c0b48b')];
  const scaleShades = [material('#76815a'), material('#586747')];
  const pebble = new THREE.IcosahedronGeometry(1, 0);

  const body = mesh(root, 'bodyMesh', loft([
    [-1.85, 1.45, 0, 0.39, 0.4], [-1.45, 1.56, 0, 0.64, 0.66],
    [-0.95, 1.67, 0, 0.93, 0.9], [-0.3, 1.75, 0, 1.12, 1.08],
    [0.45, 1.81, 0, 1.16, 1.12], [1.12, 1.81, 0, 1.02, 0.98],
    [1.57, 1.69, 0, 0.73, 0.71], [1.9, 1.57, 0, 0.43, 0.46],
  ], 12), hide);
  mesh(root, 'underbelly', loft([
    [-1.5, 1.18, 0, 0.3, 0.47], [-1.0, 1.12, 0, 0.43, 0.72],
    [-0.3, 1.1, 0, 0.52, 0.88], [0.45, 1.12, 0, 0.52, 0.91],
    [1.05, 1.21, 0, 0.43, 0.76], [1.5, 1.35, 0, 0.27, 0.51],
  ], 12), belly);

  // Shallow skin relief follows the actual faceted surface, not an enclosing ellipsoid.
  const scales = [
    [-1.2, 1.97, 0.11], [-0.96, 2.16, 0.14], [-0.65, 2.32, 0.12],
    [-0.31, 2.42, 0.16], [0.07, 2.46, 0.12], [0.42, 2.48, 0.15],
    [0.77, 2.36, 0.13], [1.07, 2.15, 0.12],
    [-0.76, 1.88, 0.12], [-0.43, 2.04, 0.16], [-0.07, 2.1, 0.13],
    [0.28, 2.16, 0.17], [0.64, 2.06, 0.12], [0.94, 1.85, 0.1],
    [-0.44, 1.64, 0.1], [-0.12, 1.76, 0.13], [0.23, 1.77, 0.11],
    [0.55, 1.65, 0.09],
  ];
  const surfaceRay = new THREE.Raycaster();
  const outward = new THREE.Vector3(0, 0, 1);
  body.updateMatrixWorld(true);
  for (const side of [-1, 1]) scales.forEach(([x, y, radius], i) => {
    surfaceRay.ray.origin.set(x, y, side * 2);
    surfaceRay.ray.direction.set(0, 0, -side);
    const [surface] = surfaceRay.intersectObject(body, false);
    const patch = mesh(root, `skinScale_${side}_${i}`, pebble, scaleShades[i % 3 === 0 ? 1 : 0],
      surface.point.toArray(), [radius, radius * 0.7, 0.035]);
    patch.quaternion.setFromUnitVectors(outward, surface.face.normal);
  });

  const head = group(root, 'headGroup', [-1.73, 1.46, 0]);
  mesh(head, 'neck', loft([
    [-0.94, -0.04, 0, 0.19, 0.22], [-0.65, -0.1, 0, 0.22, 0.25],
    [-0.32, -0.07, 0, 0.28, 0.33], [0.05, 0.02, 0, 0.38, 0.43],
    [0.34, 0.09, 0, 0.46, 0.51],
  ], 8), hide);
  mesh(head, 'skull', loft([
    [-1.54, -0.1, 0, 0.1, 0.14], [-1.3, 0, 0, 0.2, 0.23],
    [-1.02, 0.05, 0, 0.25, 0.28], [-0.71, -0.02, 0, 0.17, 0.2],
  ], 8), hide);
  mesh(head, 'lowerJaw', pebble, belly, [-1.17, -0.14, 0], [0.4, 0.1, 0.22]);
  mesh(head, 'beak', loft([[-1.67, -0.12, 0, 0.075, 0.12], [-1.44, -0.09, 0, 0.11, 0.16]], 6), beak);
  for (const side of [-1, 1]) {
    mesh(head, `eyeSocket_${side}`, pebble, beak, [-1.08, 0.08, side * 0.24], [0.12, 0.09, 0.04]);
    mesh(head, `eye_${side}`, pebble, eye, [-1.1, 0.085, side * 0.275], [0.052, 0.048, 0.023]);
    mesh(head, `brow_${side}`, pebble, hide, [-1.08, 0.15, side * 0.25], [0.14, 0.045, 0.055]);
    mesh(head, `nostril_${side}`, pebble, beak, [-1.43, -0.02, side * 0.151], [0.035, 0.025, 0.012]);
  }

  const legs = group(root, 'legsGroup', [0, 0, 0]);
  for (const x of [-1.12, 1.08]) for (const side of [-1, 1]) {
    const rear = x > 0;
    const hipY = rear ? 1.74 : 1.4;
    const leg = group(legs, `${rear ? 'hind' : 'front'}Leg_${side}`, [x, hipY, side * 0.72]);
    const knee = [rear ? -0.24 : 0.13, -hipY + 0.72, side * 0.09];
    const ankle = [rear ? 0.04 : -0.04, -hipY + 0.25, side * 0.14];
    // Longitudinal loft rotated upright: broad embedded hip/shoulder, tapered knee.
    const upper = mesh(leg, 'upperLeg', loft([
      [knee[1] - 0.08, -knee[0], knee[2], 0.27, 0.26],
      [knee[1] * 0.64, -knee[0] * 0.75, side * 0.07, rear ? 0.39 : 0.31, rear ? 0.36 : 0.29],
      [-0.2, 0.03, 0, rear ? 0.49 : 0.36, rear ? 0.43 : 0.34],
      [0.17, 0.04, -side * 0.05, rear ? 0.36 : 0.27, rear ? 0.31 : 0.25],
    ], 8), hide);
    upper.rotation.z = Math.PI / 2;
    mesh(leg, 'knee', pebble, hide, knee, [0.28, 0.29, 0.27]);
    segment(leg, 'lowerLeg', knee, ankle, 0.24, 0.2, hide);
    mesh(leg, 'foot', loft([
      [ankle[0] - 0.34, -hipY + 0.13, ankle[2], 0.09, 0.2],
      [ankle[0] - 0.19, -hipY + 0.16, ankle[2], 0.16, 0.29],
      [ankle[0] + 0.12, -hipY + 0.16, ankle[2], 0.15, 0.25],
      [ankle[0] + 0.23, -hipY + 0.15, ankle[2], 0.1, 0.15],
    ], 8), hide);
    for (let toe = -1; toe <= 1; toe++) {
      mesh(leg, `toe_${toe}`, pebble, belly, [ankle[0] - 0.32, -hipY + 0.1, ankle[2] + toe * 0.15], [0.09, 0.065, 0.075]);
    }
  }

  const tail = group(root, 'tailGroup', [1.65, 1.57, 0]);
  mesh(tail, 'tailMesh', loft([
    [0, 0, 0, 0.42, 0.46], [0.65, -0.15, 0, 0.31, 0.34],
    [1.45, -0.3, 0.03, 0.21, 0.22], [2.35, -0.41, 0.09, 0.14, 0.14],
    [3.15, -0.44, 0.13, 0.095, 0.1], [4.05, -0.39, 0.14, 0.045, 0.055],
  ], 8), hide);
  for (const side of [-1, 1]) for (let i = 0; i < 2; i++) {
    const x = 3.05 + i * 0.52;
    spike(tail, `thagomizer_${side}_${i}`, [x, -0.39, 0.13 + side * 0.08], [x + 0.36, 0.22 - i * 0.04, 0.13 + side * 0.66], 0.12, armor);
  }

  // Narrow roots and tapered crowns leave readable notches between overlapping plates.
  const outline = [[-0.3, 0], [0.29, 0.01], [0.48, 0.34], [0.38, 0.68],
    [0.1, 1], [-0.2, 0.86], [-0.44, 0.4]];
  const vertices = [], indices = [];
  for (const side of [1, -1]) {
    for (const [x, y] of outline) vertices.push(x, y, side * 0.018);
    vertices.push(0.03, 0.46, side * 0.045);
  }
  const rimCount = outline.length;
  const back = rimCount + 1;
  for (let i = 0; i < rimCount; i++) {
    const next = (i + 1) % rimCount;
    indices.push(rimCount, i, next, back + rimCount, next + back, i + back);
    indices.push(i, i + back, next, next, i + back, next + back);
  }
  const plateGeometry = new THREE.BufferGeometry();
  plateGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  plateGeometry.setIndex(indices);
  plateGeometry.computeVertexNormals();
  const plates = group(root, 'armorGroup', [0, 0, 0]);
  // Nineteen alternating plates, using the NHM's S. stenops specimen as a count reference.
  // Width and lean vary along the neck, high hips, and tapering tail.
  const stations = [
    [-2.55, 1.6, 0.14, 0.18, -0.22], [-2.29, 1.62, 0.2, 0.24, -0.18],
    [-2.02, 1.7, 0.29, 0.32, -0.14], [-1.73, 1.92, 0.4, 0.4, -0.12],
    [-1.4, 2.18, 0.57, 0.44, -0.12], [-1.03, 2.48, 0.78, 0.51, 0.04],
    [-0.6, 2.72, 0.88, 0.61, -0.09], [-0.13, 2.85, 1.12, 0.69, 0.08],
    [0.38, 2.88, 1.12, 0.76, -0.04], [0.9, 2.79, 1.18, 0.74, 0.16],
    [1.35, 2.54, 0.91, 0.63, 0.03], [1.7, 2.19, 0.79, 0.55, 0.23],
    [2.02, 1.84, 0.6, 0.58, 0.2], [2.35, 1.7, 0.47, 0.47, 0.22],
    [2.69, 1.58, 0.36, 0.37, 0.24], [3.03, 1.48, 0.28, 0.3, 0.26],
    [3.36, 1.4, 0.22, 0.25, 0.28], [3.68, 1.34, 0.16, 0.2, 0.3],
    [3.98, 1.29, 0.12, 0.16, 0.32],
  ];
  stations.forEach(([x, y, height, width, lean], i) => {
    const side = i % 2 ? 1 : -1;
    const parent = x > 1.9 ? tail : x < -1.85 ? head : plates;
    const z = side * (height > 0.5 ? 0.19 : 0.085);
    const position = [x - parent.position.x, y - parent.position.y, z];
    const plate = mesh(parent, `dorsalPlate_${i}`, plateGeometry, plateShades[i % plateShades.length],
      position, [width, height, Math.max(0.55, height)]);
    plate.rotation.x = side * 0.12;
    plate.rotation.y = side * (0.08 + (i % 3) * 0.04);
    plate.rotation.z = -lean;
  });
  let triangles = 0;
  root.traverse(part => {
    if (part.isMesh) triangles += (part.geometry.index?.count ?? part.geometry.attributes.position.count) / 3;
  });
  root.userData.triangles = triangles;
  return root;
}

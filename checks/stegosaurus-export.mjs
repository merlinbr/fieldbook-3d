import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Box3, Vector3 } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { createLowPolyStegosaurus } from '../example project/low-poly/stegosaurus.js';

// Catches missing export, smooth normals, lost anatomy/transforms/materials,
// duplicated shared geometry, or accidental environment/animation export.
const directory = await mkdtemp(join(tmpdir(), 'fieldbook-stegosaurus-'));
try {
  const output = join(directory, 'stegosaurus.glb');
  const exporter = fileURLToPath(new URL('../tools/export-stegosaurus.mjs', import.meta.url));
  function regenerate() {
    const result = spawnSync(process.execPath, [exporter, output], { cwd: directory, encoding: 'utf8' });
    assert.equal(result.status, 0, `Export succeeds outside the checkout working directory:\n${result.stderr}`);
  }
  regenerate();
  const bytes = await readFile(output);
  regenerate();
  assert.deepEqual(await readFile(output), bytes, 'Fresh exports have reproducible bytes');
  assert.equal(bytes.toString('utf8', 0, 4), 'glTF');
  assert.equal(bytes.readUInt32LE(4), 2);
  assert.equal(bytes.readUInt32LE(8), bytes.length);
  const json = JSON.parse(bytes.toString('utf8', 20, 20 + bytes.readUInt32LE(12)));
  for (const field of ['animations', 'cameras', 'textures', 'images', 'skins']) {
    assert.equal(json[field]?.length ?? 0, 0, `No ${field}`);
  }
  assert(!json.extensionsUsed?.includes('KHR_lights_punctual'), 'No lights');
  assert(json.buffers.every(buffer => !buffer.uri), 'No external or embedded data URI media');
  const gltf = await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '');
  assert.equal(gltf.animations.length, 0);
  const loaded = gltf.scene.getObjectByName('stegosaurus');
  assert(loaded, 'Named specimen root');
  const source = createLowPolyStegosaurus();
  source.updateMatrixWorld(true);
  loaded.updateMatrixWorld(true);
  const sourceNames = [];
  source.traverse(part => sourceNames.push(part.name));
  assert.deepEqual(json.nodes.map(node => node.name).sort(), sourceNames.sort(), 'All original node names in GLB');
  const geometries = new Map();
  let triangles = 0, meshes = 0, plates = 0, spikes = 0, scales = 0;
  const a = new Vector3(), b = new Vector3(), c = new Vector3(), normal = new Vector3();
  function close(actual, expected, message, tolerance = 0.00001) {
    assert.equal(actual.length, expected.length, message);
    actual.forEach((value, i) => assert(Number.isFinite(value) && Math.abs(value - expected[i]) <= tolerance, `${message}: ${value} vs ${expected[i]}`));
  }
  function compare(original, exported) {
    close(exported.matrixWorld.elements, original.matrixWorld.elements, `Transform: ${original.name}`);
    assert.equal(exported.children.length, original.children.length, `Children: ${original.name}`);
    if (original.isMesh) {
      assert(exported.isMesh);
      meshes++;
      if (original.name.startsWith('dorsalPlate_')) {
        plates++;
        assert.equal(exported.name, original.name);
        assert.equal(exported.parent.name, original.parent.name, 'Plate retains its head/armor/tail parent');
      }
      if (original.name.startsWith('thagomizer_')) { spikes++; assert.equal(exported.name, original.name); }
      if (original.name.startsWith('skinScale_')) scales++;
      const geometry = exported.geometry;
      assert.equal(geometry.index, null, 'Explicit non-indexed face vertices');
      if (geometries.has(original.geometry)) assert.equal(geometry, geometries.get(original.geometry), 'Shared geometry reused');
      else geometries.set(original.geometry, geometry);
      const positions = geometry.attributes.position, normals = geometry.attributes.normal;
      const originalPositions = original.geometry.attributes.position;
      const indices = original.geometry.index;
      const count = indices?.count ?? originalPositions.count;
      assert.equal(positions.count, count);
      assert.equal(normals.count, count);
      triangles += count / 3;
      for (let i = 0; i < count; i++) {
        close(new Vector3().fromBufferAttribute(positions, i).toArray(),
          new Vector3().fromBufferAttribute(originalPositions, indices ? indices.getX(i) : i).toArray(), `Position: ${original.name}`);
      }
      for (let i = 0; i < count; i += 3) {
        a.fromBufferAttribute(positions, i); b.fromBufferAttribute(positions, i + 1); c.fromBufferAttribute(positions, i + 2);
        normal.subVectors(b, a).cross(c.sub(a));
        assert(normal.lengthSq() > 1e-14, `Nondegenerate triangle: ${original.name}`);
        normal.normalize();
        for (let j = 0; j < 3; j++) close(new Vector3().fromBufferAttribute(normals, i + j).toArray(), normal.toArray(), `Face normal: ${original.name}`);
      }
      close(exported.material.color.toArray(), original.material.color.toArray(), `Color: ${original.name}`);
      for (const key of ['roughness', 'metalness', 'opacity', 'transparent', 'side']) assert.equal(exported.material[key], original.material[key], `${key}: ${original.name}`);
    }
    original.children.forEach((child, i) => compare(child, exported.children[i]));
  }
  compare(source, loaded);
  assert.equal(triangles, 2976);
  assert.equal(plates, 19);
  assert.equal(spikes, 4);
  assert.equal(scales, 36);
  const sourceBounds = new Box3().setFromObject(source, true);
  const bounds = new Box3().setFromObject(loaded, true);
  close(bounds.min.toArray(), sourceBounds.min.toArray(), 'Minimum bounds', 0.001);
  close(bounds.max.toArray(), sourceBounds.max.toArray(), 'Maximum bounds', 0.001);
  console.log(`PASS Stegosaurus GLB: ${triangles} triangles; ${meshes} meshes; ${plates} plates; ${spikes} spikes; ${scales} scales; deterministic bytes, hierarchy, materials, shared geometry and per-face normals.`);
  console.log(JSON.stringify({ bytes: bytes.length, min: bounds.min.toArray(), max: bounds.max.toArray() }));
} finally {
  await rm(directory, { recursive: true, force: true });
}

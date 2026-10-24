import { mkdir, writeFile } from 'node:fs/promises';
import { registerHooks } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';

// The ignored example may have its own older node_modules. Match the preview's
// Three.js deduplication without changing the canonical generator or local files.
const three = import.meta.resolve('three');
const sourceDirectory = new URL('../example project/low-poly/', import.meta.url).href;
const hook = registerHooks({
  resolve(specifier, context, nextResolve) {
    return nextResolve(specifier === 'three' && context.parentURL?.startsWith(sourceDirectory) ? three : specifier, context);
  }
});
let createLowPolyStegosaurus;
try {
  ({ createLowPolyStegosaurus } = await import('../example project/low-poly/stegosaurus.js'));
} finally {
  hook.deregister();
}

// GLTFExporter uses the browser FileReader API for binary Blob buffers.
// This texture-free Node export only needs readAsArrayBuffer.
globalThis.FileReader ??= class {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then(result => {
      this.result = result;
      this.onloadend?.();
    });
  }
};

const output = process.argv[2]
  ? resolve(process.argv[2])
  : fileURLToPath(new URL('../media-dev/stegosaurus.glb', import.meta.url));
const model = createLowPolyStegosaurus();
const geometries = new Map();
model.traverse(part => {
  if (!part.isMesh) return;
  const original = part.geometry;
  if (!geometries.has(original)) {
    const geometry = original.index ? original.toNonIndexed() : original.clone();
    geometry.computeVertexNormals();
    geometries.set(original, geometry);
  }
  part.geometry = geometries.get(original);
});
const bytes = await new GLTFExporter().parseAsync(model, { binary: true });
await mkdir(dirname(output), { recursive: true });
await writeFile(output, Buffer.from(bytes));
console.log(`Exported resting Stegosaurus: ${model.userData.triangles} triangles, ${bytes.byteLength} bytes -> ${output}`);

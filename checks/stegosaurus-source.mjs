import { registerHooks } from 'node:module';

// Match export/preview deduplication even when ignored example dependencies exist.
const three = import.meta.resolve('three');
const source = new URL('../example project/low-poly/', import.meta.url).href;
const hook = registerHooks({ resolve(specifier, context, nextResolve) {
  return nextResolve(specifier === 'three' && context.parentURL?.startsWith(source) ? three : specifier, context);
} });
let createLowPolyStegosaurus;
try { ({ createLowPolyStegosaurus } = await import('../example project/low-poly/stegosaurus.js')); }
finally { hook.deregister(); }
export { createLowPolyStegosaurus };

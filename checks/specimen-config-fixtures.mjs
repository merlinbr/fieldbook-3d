// Check-only anatomy, not exhibit content or a claim about represented size.
/** @param {string} name @param {readonly string[]} [excludePrefixes] @returns {import('../src/lib/specimens/specimen-config.ts').MeshSelector} */
const subtree = (name, excludePrefixes) => ({ kind: 'subtree', name, ...(excludePrefixes ? { excludePrefixes } : {}) });
/** @param {string} prefix @returns {import('../src/lib/specimens/specimen-config.ts').MeshSelector} */
const prefix = (prefix) => ({ kind: 'prefix', prefix });
/** @param {string} id @param {readonly import('../src/lib/specimens/specimen-config.ts').MeshSelector[]} selectors @param {string} node @param {readonly [number,number,number]} point @returns {import('../src/lib/specimens/specimen-config.ts').AnatomyRegionConfig} */
const region = (id, selectors, node, point) => ({ id, pick: selectors, highlight: selectors, bounds: selectors, anchor: { node, point } });
/** @type {import('../src/lib/specimens/specimen-config.ts').SpecimenViewerConfig} */
export const stegosaurusConfig = {
  id: 'stegosaurus', modelUrl: 'http://127.0.0.1:5194/stegosaurus.glb',
  regions: [
    region('head', [subtree('headGroup', ['dorsalPlate_'])], 'headGroup', [-1.25, 0.14, 0.19]),
    region('plates', [prefix('dorsalPlate_')], 'dorsalPlate_8', [0, 0.7, 0.046]),
    region('spikes', [prefix('thagomizer_')], 'tailGroup', [3.6, 0.1, 0.7])
  ],
  scale: null, study: { kind: 'none' }
};
export const stegosaurusText = {
  viewerLabel: 'Stegosaurus test specimen',
  anatomy: Object.fromEntries(['head', 'plates', 'spikes'].map(id => [id, { label: id, heading: id, body: `Check-only ${id} note.` }]))
};

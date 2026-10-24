// Check-only anatomy, not exhibit content or a claim about represented size.
const subtree = (name, excludePrefixes) => ({ kind: 'subtree', name, ...(excludePrefixes ? { excludePrefixes } : {}) });
const prefix = (prefix) => ({ kind: 'prefix', prefix });
const region = (id, selectors, node, point) => ({ id, pick: selectors, highlight: selectors, bounds: selectors, anchor: { node, point } });
export const stegosaurusConfig = {
  id: 'stegosaurus', modelUrl: 'http://127.0.0.1:5194/stegosaurus.glb',
  regions: [
    region('head', [subtree('headGroup', ['dorsalPlate_'])], 'headGroup', [-1.25, 0.14, 0.19]),
    region('plates', [prefix('dorsalPlate_')], 'dorsalPlate_8', [0, 0.7, 0.03]),
    region('spikes', [prefix('thagomizer_')], 'tailGroup', [3.6, 0.1, 0.7])
  ],
  scale: null, study: { kind: 'none' }
};
export const stegosaurusText = {
  viewerLabel: 'Stegosaurus test specimen',
  anatomy: Object.fromEntries(['head', 'plates', 'spikes'].map(id => [id, { label: id, heading: id, body: `Check-only ${id} note.` }]))
};

import { createStegosaurusConfig } from '../src/lib/specimens/stegosaurus-config.ts';

// Deliberately unconfigured scale for checks of that capability; anatomy is production data.
/** @type {import('../src/lib/specimens/specimen-config.ts').SpecimenViewerConfig} */
export const stegosaurusConfig = {
  ...createStegosaurusConfig('http://127.0.0.1:5194/stegosaurus.glb'), scale: null
};
export const stegosaurusText = {
  viewerLabel: 'Stegosaurus test specimen',
  anatomy: Object.fromEntries(['head', 'plates', 'spikes'].map(id => [id, { label: id, heading: id, body: `Check-only ${id} note.` }]))
};

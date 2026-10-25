import type { AnatomyRegionConfig, MeshSelector, SpecimenViewerConfig } from './specimen-config.ts';

function region(id: string, selectors: readonly MeshSelector[], node: string, point: readonly [number, number, number]): AnatomyRegionConfig {
  return { id, pick: selectors, highlight: selectors, bounds: selectors, anchor: { node, point } };
}

export function createStegosaurusConfig(modelUrl: string): SpecimenViewerConfig {
  return {
    id: 'stegosaurus', modelUrl,
    regions: [
      region('head', [{ kind: 'subtree', name: 'headGroup', excludePrefixes: ['dorsalPlate_'] }], 'headGroup', [-1.25, 0.14, 0.19]),
      region('plates', [{ kind: 'prefix', prefix: 'dorsalPlate_' }], 'dorsalPlate_8', [0, 0.7, 0.046]),
      region('spikes', [{ kind: 'prefix', prefix: 'thagomizer_' }], 'tailGroup', [3.6, 0.1, 0.7])
    ],
    // Illustrative large-Stegosaurus length (NHM/AMNH), not raw model units or Sophie.
    // Evidence and interpretation: docs/assets/stegosaurus.md.
    scale: { lengthMetres: 9 },
    study: { kind: 'none' }
  };
}

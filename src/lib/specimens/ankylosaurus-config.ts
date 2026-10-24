import type { AnatomyRegionConfig, MeshSelector, SpecimenViewerConfig } from './specimen-config.ts';

const subtree = (name: string): readonly MeshSelector[] => [{ kind: 'subtree', name }];
function region(id: string, node: string, point: readonly [number, number, number]): AnatomyRegionConfig {
  const meshes = subtree(node);
  return { id, pick: meshes, highlight: meshes, bounds: meshes, anchor: { node, point } };
}

// Kept free of environment/localization imports so checks exercise the actual
// exhibit geometry contract, including the published guided-study target IDs.
export function createAnkylosaurusConfig(modelUrl: string): SpecimenViewerConfig {
  return {
    id: 'ankylosaurus', modelUrl,
    regions: [
      { ...region('armor', 'armorGroup', [-0.01633135, 2.58094070, 0]),
        upperSurface: { mesh: 'bodyMesh', minHeightRatio: 0.5 } },
      region('head', 'headGroup', [-0.62353848, 0.16785683, 0.51888366]),
      region('tailClub', 'clubMesh', [0, 0, 0.56])
    ],
    scale: { lengthMetres: 8 },
    study: { kind: 'guided', targets: {
      armor: { regionId: 'armor', emphasis: [...subtree('armorGroup'), { kind: 'mesh', name: 'bodyMesh' }] },
      tailClub: { regionId: 'tailClub', emphasis: subtree('clubMesh') }
    } }
  };
}

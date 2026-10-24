import { Box3, Mesh, Vector3 } from 'three';
import type { Object3D } from 'three';
import { validateAnatomyRegions, validateMeshSelectors } from '../specimens/specimen-config.ts';
import type { AnatomyId, AnatomyRegionConfig, MeshSelector } from '../specimens/specimen-config.ts';

export type ResolvedAnatomyRegion = Readonly<{
  id: AnatomyId; pickMeshes: readonly Mesh[]; highlightMeshes: readonly Mesh[]; boundsMeshes: readonly Mesh[];
  anchorNode: Object3D | undefined; anchorPoint: Vector3; available: boolean;
  upperSurface?: Readonly<{ mesh: Mesh; minHeightRatio: number }>;
}>;

export function resolveMeshes(model: Object3D, selectors: readonly MeshSelector[]): readonly Mesh[] {
  validateMeshSelectors(selectors);
  const meshes = new Set<Mesh>();
  for (const selector of selectors) {
    if (selector.kind === 'prefix') {
      model.traverse(object => { if (object instanceof Mesh && object.name.startsWith(selector.prefix)) meshes.add(object); });
    } else {
      const node = model.getObjectByName(selector.name);
      if (selector.kind === 'mesh') {
        if (node instanceof Mesh) meshes.add(node);
      } else node?.traverse(object => {
        if (object instanceof Mesh && !selector.excludePrefixes?.some(prefix => object.name.startsWith(prefix))) meshes.add(object);
      });
    }
  }
  return [...meshes];
}

export function resolveAnatomyRegions(model: Object3D, configs: readonly AnatomyRegionConfig[]): readonly ResolvedAnatomyRegion[] {
  validateAnatomyRegions(configs);
  const owners = new Map<Mesh, AnatomyId>();
  return configs.map(config => {
    const pickMeshes = resolveMeshes(model, config.pick);
    const highlightMeshes = resolveMeshes(model, config.highlight);
    const boundsMeshes = resolveMeshes(model, config.bounds);
    const anchorNode = model.getObjectByName(config.anchor.node);
    const available = !!anchorNode && !!pickMeshes.length && !!highlightMeshes.length && !!boundsMeshes.length;
    const surface = config.upperSurface && model.getObjectByName(config.upperSurface.mesh);
    const upperSurface = surface instanceof Mesh && config.upperSurface
      ? { mesh: surface, minHeightRatio: config.upperSurface.minHeightRatio } : undefined;
    // An unavailable region must not claim a body fallback or hide valid regions.
    if (available) for (const mesh of [...pickMeshes, ...(upperSurface ? [upperSurface.mesh] : [])]) {
      const owner = owners.get(mesh);
      if (owner && owner !== config.id) throw new TypeError(`Ambiguous anatomy picking for ${mesh.name}: ${owner}, ${config.id}`);
      owners.set(mesh, config.id);
    }
    return { id: config.id, pickMeshes, highlightMeshes, boundsMeshes, anchorNode,
      anchorPoint: new Vector3(...config.anchor.point), available, upperSurface };
  });
}

export function regionBounds(region: ResolvedAnatomyRegion): Box3 {
  const bounds = new Box3().makeEmpty();
  for (const mesh of region.boundsMeshes) {
    mesh.updateWorldMatrix(true, false);
    // Mesh membership is explicit: do not recursively include unconfigured children.
    if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
    if (mesh.geometry.boundingBox) bounds.union(mesh.geometry.boundingBox.clone().applyMatrix4(mesh.matrixWorld));
  }
  return bounds;
}

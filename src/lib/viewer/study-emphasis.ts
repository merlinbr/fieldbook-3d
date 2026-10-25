import { Color, Mesh } from 'three';
import type { Material, Object3D } from 'three';

export type StudyEmphasis = {
  apply(region: 'armor' | 'tailClub'): void;
  clear(): void;
  dispose(): void;
};

type MeshMaterials = {
  mesh: Mesh;
  original: Material | Material[];
  emphasized: Material | Material[];
  dimmed: Material | Material[];
};

const AMBER = new Color('#d9a54d');
const DIM = new Color('#26241f');

export function createStudyEmphasis(model: Object3D, targets: Readonly<Record<'armor' | 'tailClub', readonly Mesh[]>>): StudyEmphasis {
  const armor = new Set(targets.armor);
  const tailClub = new Set(targets.tailClub);
  const emphasisTargets = new Set([...armor, ...tailClub]);
  const meshes: MeshMaterials[] = [];
  const ownedClones: Material[] = [];
  model.traverse((object) => {
    if (!(object instanceof Mesh)) return;
    const original = object.material;
    const cloneTreatment = (material: Material, color: Color, amount: number): Material => {
      const clone = material.clone();
      ownedClones.push(clone);
      const materialColor = (clone as Material & { color?: unknown }).color;
      if (materialColor instanceof Color) materialColor.lerp(color, amount);
      return clone;
    };
    const mapMaterials = (tint: Color, amount: number): Material | Material[] => Array.isArray(original)
      ? original.map((material) => cloneTreatment(material, tint, amount))
      : cloneTreatment(original, tint, amount);
    meshes.push({
      mesh: object,
      original,
      emphasized: emphasisTargets.has(object) ? mapMaterials(AMBER, 0.35) : original,
      dimmed: mapMaterials(DIM, 0.45)
    });
  });


  let activeRegion: 'armor' | 'tailClub' | null = null;
  let disposed = false;

  const clear = (): void => {
    if (activeRegion === null) return;
    for (const entry of meshes) entry.mesh.material = entry.original;
    activeRegion = null;
  };

  return {
    apply(region): void {
      if (disposed || activeRegion === region) return;
      const targets = region === 'armor' ? armor : tailClub;
      for (const entry of meshes) entry.mesh.material = targets.has(entry.mesh) ? entry.emphasized : entry.dimmed;
      activeRegion = region;
    },
    clear,
    dispose(): void {
      if (disposed) return;
      clear();
      disposed = true;
      for (const material of ownedClones) material.dispose();
      ownedClones.length = 0;
    }
  };
}

import { Box3, Color, Matrix4, Mesh, MeshStandardMaterial, Raycaster, Vector2, Vector3 } from 'three';
import type { Intersection, Material, Object3D, OrthographicCamera } from 'three';
import { ANATOMY_IDS, createAnatomyInput } from './anatomy-input.ts';
import type { AnatomyId } from './anatomy-input.ts';

export type AnatomyProjection = { id: AnatomyId; available: boolean; visible: boolean; x: number; y: number };
export type InspectionSnapshot = { selected: AnatomyId | null; width: number; height: number; regions: readonly AnatomyProjection[] };
export type AnatomyInspection = { select(id: AnatomyId | null): void; update(width: number, height: number): void; dispose(): void };
const TARGETS = {
  armor: { node: 'armorGroup', anchor: [-0.01633135, 2.58094070, 0] },
  head: { node: 'headGroup', anchor: [-0.62353848, 0.16785683, 0.51888366] },
  tailClub: { node: 'clubMesh', anchor: [0, 0, 0.56] }
} as const;

export function createAnatomyInspection(model: Object3D, camera: OrthographicCamera, canvas: HTMLCanvasElement, onChange: (snapshot: InspectionSnapshot) => void): AnatomyInspection {
  const input = createAnatomyInput();
  const modelMeshes: Mesh[] = [];
  const meshRegion = new Map<Object3D, AnatomyId>();
  model.updateWorldMatrix(true, true);
  model.traverse((object) => { if (object instanceof Mesh) modelMeshes.push(object); });
  const targets = ANATOMY_IDS.map((id) => {
    const node = model.getObjectByName(TARGETS[id].node);
    const meshes: Mesh[] = [];
    node?.traverse((object) => {
      if (object instanceof Mesh) { meshes.push(object); meshRegion.set(object, id); }
    });
    return { id, node, meshes, local: new Vector3(...TARGETS[id].anchor), world: new Vector3(), matrix: new Matrix4(), available: meshes.length > 0 };
  });
  const regions = targets.map(({ id, available }) => ({ id, available, visible: false, x: 0, y: 0 }));
  const epsilon = new Box3().setFromObject(model).getSize(new Vector3()).length() * 1e-5;
  const raycaster = new Raycaster();
  const pointer = new Vector2();
  const ndc = new Vector3();
  const delta = new Vector3();
  const hits: Intersection[] = [];
  const cameraWorld = new Matrix4();
  const cameraProjection = new Matrix4();
  const originals = new Map<Mesh, Material | Material[]>();
  const clones = new Map<Material, Material>();
  const amber = new Color('#d9a54d');
  let width = -1;
  let height = -1;
  let initialized = false;
  let disposed = false;
  let published: InspectionSnapshot | undefined;

  function publish(): void {
    if (disposed) return;
    if (published && published.selected === input.selected && published.width === width && published.height === height && regions.every((p, i) => {
      const old = published!.regions[i];
      return p.available === old.available && p.visible === old.visible && p.x === old.x && p.y === old.y;
    })) return;
    published = { selected: input.selected, width, height, regions: regions.map((p) => ({ ...p })) };
    onChange(published);
  }
  function restore(): void {
    for (const [mesh, material] of originals) mesh.material = material;
    originals.clear();
    for (const material of clones.values()) material.dispose();
    clones.clear();
  }
  function highlightMaterial(original: Material): Material {
    let copy = clones.get(original);
    if (!copy) {
      copy = original.clone();
      if (copy instanceof MeshStandardMaterial) copy.color.lerp(amber, 0.35);
      clones.set(original, copy);
    }
    return copy;
  }
  function select(id: AnatomyId | null): void {
    if (disposed || (id !== null && !targets.find((t) => t.id === id)?.available) || !input.select(id)) return;
    restore();
    if (id) for (const mesh of targets.find((t) => t.id === id)!.meshes) {
      originals.set(mesh, mesh.material);
      mesh.material = Array.isArray(mesh.material) ? mesh.material.map(highlightMaterial) : highlightMaterial(mesh.material);
    }
    publish();
  }
  function update(nextWidth: number, nextHeight: number): void {
    if (disposed) return;
    for (const target of targets) target.node?.updateWorldMatrix(true, false);
    camera.updateMatrixWorld();
    const changed = !initialized || width !== nextWidth || height !== nextHeight || !cameraWorld.equals(camera.matrixWorld) || !cameraProjection.equals(camera.projectionMatrix) || targets.some((t) => t.node && !t.matrix.equals(t.node.matrixWorld));
    if (!changed) return;
    model.updateWorldMatrix(true, true);
    initialized = true;
    width = nextWidth;
    height = nextHeight;
    cameraWorld.copy(camera.matrixWorld);
    cameraProjection.copy(camera.projectionMatrix);
    targets.forEach((target, i) => {
      const region = regions[i];
      region.visible = false;
      if (!target.available || !target.node) return;
      target.matrix.copy(target.node.matrixWorld);
      target.world.copy(target.local).applyMatrix4(target.matrix);
      if (width <= 0 || height <= 0) return;
      ndc.copy(target.world).project(camera);
      if (!Number.isFinite(ndc.x) || !Number.isFinite(ndc.y) || !Number.isFinite(ndc.z)) return;
      region.x = (ndc.x + 1) * width / 2;
      region.y = (1 - ndc.y) * height / 2;
      if (Math.abs(ndc.x) > 1 || Math.abs(ndc.y) > 1 || Math.abs(ndc.z) > 1) return;
      raycaster.setFromCamera(pointer.set(ndc.x, ndc.y), camera);
      const distance = delta.copy(target.world).sub(raycaster.ray.origin).dot(raycaster.ray.direction);
      hits.length = 0;
      raycaster.intersectObjects(modelMeshes, false, hits);
      region.visible = !hits.length || hits[0].distance >= distance - epsilon;
    });
    publish();
  }
  function down(event: PointerEvent): void {
    if (event.button !== 0 || (event.target !== canvas && !input.active)) return;
    input.down(event.pointerId, event.clientX, event.clientY);
  }
  function move(event: PointerEvent): void { input.move(event.pointerId, event.clientX, event.clientY); }
  function up(event: PointerEvent): void {
    const rect = canvas.getBoundingClientRect();
    const inside = event.clientX >= rect.left && event.clientX < rect.right && event.clientY >= rect.top && event.clientY < rect.bottom && document.elementFromPoint(event.clientX, event.clientY) === canvas;
    if (!input.up(event.pointerId, event.clientX, event.clientY, inside)) return;
    update(rect.width, rect.height);
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    for (let i = regions.length - 1; i >= 0; i--) {
      const region = regions[i];
      if (region.visible && Math.abs(x - region.x) <= 22 && Math.abs(y - region.y) <= 22) { select(region.id); return; }
    }
    raycaster.setFromCamera(pointer.set(x / rect.width * 2 - 1, 1 - y / rect.height * 2), camera);
    hits.length = 0;
    raycaster.intersectObjects(modelMeshes, false, hits);
    const hit = hits[0] ? meshRegion.get(hits[0].object) : null;
    if (hit !== undefined) select(hit);
  }
  function cancel(event: PointerEvent): void { input.cancel(event.pointerId); }
  function resetGesture(): void { input.resetGesture(); }
  function visibility(): void { if (document.hidden) input.resetGesture(); }
  window.addEventListener('pointerdown', down, true);
  window.addEventListener('pointermove', move, true);
  window.addEventListener('pointerup', up, true);
  window.addEventListener('pointercancel', cancel, true);
  window.addEventListener('blur', resetGesture);
  document.addEventListener('visibilitychange', visibility);
  return {
    select, update,
    dispose(): void {
      if (disposed) return;
      disposed = true;
      window.removeEventListener('pointerdown', down, true);
      window.removeEventListener('pointermove', move, true);
      window.removeEventListener('pointerup', up, true);
      window.removeEventListener('pointercancel', cancel, true);
      window.removeEventListener('blur', resetGesture);
      document.removeEventListener('visibilitychange', visibility);
      input.resetGesture();
      restore();
    }
  };
}

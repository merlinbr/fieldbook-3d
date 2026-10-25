import {
  Box3,
  BoxGeometry,
  BufferGeometry,
  CylinderGeometry,
  Float32BufferAttribute,
  Group,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshStandardMaterial,
  OrthographicCamera,
  Raycaster,
  Sphere,
  SphereGeometry,
  Vector2,
  Vector3
} from 'three';
import type { Intersection, Material } from 'three';
import type { SpecimenScale } from '../specimens/specimen-config.ts';

export type ScaleAnchor = { visible: boolean; x: number; y: number };
export type ScaleProjection = { visible: boolean; length: ScaleAnchor; human: ScaleAnchor };
export type ScaleComparison = {
  factor: number;
  origin: Vector3;
  root: Group;
  bounds: Box3;
  setVisible(visible: boolean): void;
  update(camera: OrthographicCamera, width: number, height: number): void;
  dispose(): void;
};

const HUMAN_HEIGHT = 1.7;
const HUMAN_CLEARANCE = 0.6;
const GUIDE_CLEARANCE = 0.35;
const GUIDE_HEIGHT = 0.03;
const GUIDE_TICK_HEIGHT = 0.13;
const PLINTH_COLOR = '#7c806a';
// Numbered badges sit 16 px right/up of the anchor and grow with root text; keep them inside the stage.
const MARKER_OFFSET_MARGIN = 48;

function finiteBounds(bounds: Box3): boolean {
  return !bounds.isEmpty() && [
    bounds.min.x, bounds.min.y, bounds.min.z,
    bounds.max.x, bounds.max.y, bounds.max.z
  ].every(Number.isFinite);
}

export function createScaleComparison(
  sourceBounds: Box3,
  specimenMeshes: readonly Mesh[],
  scale: SpecimenScale,
  onProjection: (snapshot: ScaleProjection) => void
): ScaleComparison {
  if (!scale || !Number.isFinite(scale.lengthMetres) || scale.lengthMetres <= 0) {
    throw new RangeError('Scale comparison requires a finite positive specimen length');
  }
  if (!finiteBounds(sourceBounds) || sourceBounds.max.x <= sourceBounds.min.x || specimenMeshes.length === 0) {
    throw new RangeError('Scale comparison requires finite specimen bounds with a positive X extent');
  }

  const sourceSize = sourceBounds.getSize(new Vector3());
  const sourceCenter = sourceBounds.getCenter(new Vector3());
  const origin = new Vector3(sourceCenter.x, sourceBounds.min.y, sourceCenter.z);
  const factor = scale.lengthMetres / sourceSize.x;
  if (!Number.isFinite(factor) || factor <= 0) {
    throw new RangeError('Scale comparison calibration is not finite and positive');
  }

  const calibratedBounds = sourceBounds.clone();
  calibratedBounds.min.sub(origin).multiplyScalar(factor).add(origin);
  calibratedBounds.max.sub(origin).multiplyScalar(factor).add(origin);
  const sourceSphere = sourceBounds.getBoundingSphere(new Sphere());
  const ground = origin.y;
  const plinthThickness = sourceSphere.radius * 0.08 * factor;
  const plinthHalfX = (sourceSize.x + sourceSphere.radius * 0.3) * factor / 2;
  const plinthHalfZ = (sourceSize.z + sourceSphere.radius * 0.3) * factor / 2;
  const plinthMaxZ = origin.z + plinthHalfZ;

  const root = new Group();
  root.name = 'scale-comparison';
  root.visible = false;
  const bounds = calibratedBounds.clone().union(new Box3(
    new Vector3(origin.x - plinthHalfX, ground - plinthThickness, origin.z - plinthHalfZ),
    new Vector3(origin.x + plinthHalfX, ground, origin.z + plinthHalfZ)
  ));
  const ownedGeometries = new Set<BufferGeometry>();
  const ownedMaterials = new Set<Material>();

  const human = new Group();
  human.name = 'human-reference';
  human.position.set(origin.x, ground, 0);
  root.add(human);
  const humanMaterial = new MeshStandardMaterial({ color: '#c9c2ae', roughness: 0.95 });
  ownedMaterials.add(humanMaterial);
  const unitBone = new CylinderGeometry(1, 1, 1, 8, 1, false);
  ownedGeometries.add(unitBone);
  const unitY = new Vector3(0, 1, 0);

  function addHumanMesh(name: string, geometry: BufferGeometry, x: number, y: number, z: number): Mesh {
    ownedGeometries.add(geometry);
    const mesh = new Mesh(geometry, humanMaterial);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    human.add(mesh);
    return mesh;
  }

  function addBone(name: string, x1: number, y1: number, x2: number, y2: number, radius: number): void {
    const mesh = addHumanMesh(name, unitBone, (x1 + x2) / 2, (y1 + y2) / 2, 0);
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.hypot(dx, dy);
    mesh.scale.set(radius, length, radius);
    mesh.quaternion.setFromUnitVectors(unitY, new Vector3(dx / length, dy / length, 0));
  }

  addHumanMesh('human-torso', new BoxGeometry(0.34, 0.58, 0.18), 0, 1.1, 0);
  addHumanMesh('human-pelvis', new BoxGeometry(0.34, 0.25, 0.2), 0, 0.79, 0);
  addHumanMesh('human-neck', new CylinderGeometry(0.05, 0.045, 0.12, 8, 1), 0, 1.44, 0);
  addHumanMesh('human-head', new SphereGeometry(0.105, 12, 8), 0, 1.595, 0);
  for (const side of [-1, 1]) {
    addBone('human-upper-arm', side * 0.19, 1.35, side * 0.31, 1.04, 0.04);
    addBone('human-forearm', side * 0.31, 1.04, side * 0.34, 0.79, 0.032);
    addHumanMesh('human-hand', new SphereGeometry(0.05, 8, 6), side * 0.34, 0.74, 0);
    addBone('human-thigh', side * 0.105, 0.7, side * 0.13, 0.38, 0.07);
    addBone('human-shin', side * 0.13, 0.38, side * 0.14, 0.08, 0.05);
    addHumanMesh('human-foot', new BoxGeometry(0.13, 0.08, 0.24), side * 0.14, 0.04, 0.03);
  }
  const unplacedHumanBounds = new Box3().setFromObject(human, true);
  human.position.z += calibratedBounds.max.z + HUMAN_CLEARANCE - unplacedHumanBounds.min.z;
  human.updateWorldMatrix(true, true);
  const humanBounds = new Box3().setFromObject(human, true);
  bounds.union(humanBounds);

  const guideZ = humanBounds.max.z + GUIDE_CLEARANCE;
  const guideY = ground + GUIDE_HEIGHT;
  const guideGeometry = new BufferGeometry();
  guideGeometry.setAttribute('position', new Float32BufferAttribute([
    calibratedBounds.min.x, guideY, guideZ,
    calibratedBounds.max.x, guideY, guideZ,
    calibratedBounds.min.x, guideY, guideZ,
    calibratedBounds.min.x, guideY + GUIDE_TICK_HEIGHT, guideZ,
    calibratedBounds.max.x, guideY, guideZ,
    calibratedBounds.max.x, guideY + GUIDE_TICK_HEIGHT, guideZ
  ], 3));
  guideGeometry.computeBoundingBox();
  ownedGeometries.add(guideGeometry);
  const guideMaterial = new LineBasicMaterial({ color: '#e8dfc9' });
  ownedMaterials.add(guideMaterial);
  const guide = new LineSegments(guideGeometry, guideMaterial);
  guide.name = 'length-guide';
  root.add(guide);
  bounds.union(guideGeometry.boundingBox!.clone());

  const supportEndZ = guideZ + 0.12;
  const supportDepth = supportEndZ - plinthMaxZ;
  if (supportDepth > 1e-4) {
    const supportGeometry = new BoxGeometry(plinthHalfX * 2, plinthThickness, supportDepth);
    ownedGeometries.add(supportGeometry);
    const supportMaterial = new MeshStandardMaterial({ color: PLINTH_COLOR, roughness: 0.95 });
    ownedMaterials.add(supportMaterial);
    const support = new Mesh(supportGeometry, supportMaterial);
    support.name = 'study-plinth-extension';
    support.position.set(origin.x, ground - plinthThickness / 2, plinthMaxZ + supportDepth / 2);
    support.receiveShadow = true;
    root.add(support);
    bounds.union(new Box3().setFromObject(support, true));
  }

  const lengthAnchor = new Vector3(origin.x, guideY, guideZ);
  const humanAnchor = new Vector3(origin.x, ground + HUMAN_HEIGHT, human.position.z + 0.105);
  const raycaster = new Raycaster();
  const pointer = new Vector2();
  const ndc = new Vector3();
  const delta = new Vector3();
  const hits: Intersection[] = [];
  const raycastMeshes = specimenMeshes.slice();
  const epsilon = calibratedBounds.getSize(new Vector3()).length() * 1e-5;
  const scratchLength: ScaleAnchor = { visible: false, x: 0, y: 0 };
  const scratchHuman: ScaleAnchor = { visible: false, x: 0, y: 0 };
  let published: ScaleProjection | undefined;
  let disposed = false;

  function publish(visible: boolean, length: ScaleAnchor, humanAnchorSnapshot: ScaleAnchor): void {
    if (published && published.visible === visible &&
      published.length.visible === length.visible && published.length.x === length.x && published.length.y === length.y &&
      published.human.visible === humanAnchorSnapshot.visible &&
      published.human.x === humanAnchorSnapshot.x && published.human.y === humanAnchorSnapshot.y) return;
    published = {
      visible,
      length: { visible: length.visible, x: length.x, y: length.y },
      human: { visible: humanAnchorSnapshot.visible, x: humanAnchorSnapshot.x, y: humanAnchorSnapshot.y }
    };
    onProjection(published);
  }

  function hideProjection(): void {
    scratchLength.visible = false;
    scratchLength.x = 0;
    scratchLength.y = 0;
    scratchHuman.visible = false;
    scratchHuman.x = 0;
    scratchHuman.y = 0;
    publish(false, scratchLength, scratchHuman);
  }

  function projectAnchor(world: Vector3, width: number, height: number, anchor: ScaleAnchor, camera: OrthographicCamera): void {
    ndc.copy(world).project(camera);
    anchor.x = Number.isFinite(ndc.x) ? (ndc.x + 1) * width / 2 : 0;
    anchor.y = Number.isFinite(ndc.y) ? (1 - ndc.y) * height / 2 : 0;
    anchor.visible = Number.isFinite(ndc.x) && Number.isFinite(ndc.y) && Number.isFinite(ndc.z) &&
      Math.abs(ndc.x) <= 1 && Math.abs(ndc.y) <= 1 && Math.abs(ndc.z) <= 1 &&
      anchor.x <= width - MARKER_OFFSET_MARGIN && anchor.y >= MARKER_OFFSET_MARGIN;
    if (!anchor.visible) return;
    raycaster.setFromCamera(pointer.set(ndc.x, ndc.y), camera);
    const anchorDepth = delta.copy(world).sub(raycaster.ray.origin).dot(raycaster.ray.direction);
    hits.length = 0;
    raycaster.intersectObjects(raycastMeshes, false, hits);
    anchor.visible = !hits.length || hits[0].distance >= anchorDepth - epsilon;
  }

  return {
    factor,
    origin,
    root,
    bounds,
    setVisible(visible): void {
      if (disposed) return;
      root.visible = visible;
      if (!visible) hideProjection();
    },
    update(camera, width, height): void {
      if (disposed || !root.visible || width <= 0 || height <= 0) return;
      camera.updateMatrixWorld();
      projectAnchor(lengthAnchor, width, height, scratchLength, camera);
      projectAnchor(humanAnchor, width, height, scratchHuman, camera);
      publish(true, scratchLength, scratchHuman);
    },
    dispose(): void {
      if (disposed) return;
      hideProjection();
      disposed = true;
      root.removeFromParent();
      for (const geometry of ownedGeometries) geometry.dispose();
      for (const material of ownedMaterials) material.dispose();
      ownedGeometries.clear();
      ownedMaterials.clear();
    }
  };
}


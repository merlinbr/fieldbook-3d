import {
  ACESFilmicToneMapping,
  Box3,
  BoxGeometry,
  BufferGeometry,
  Color,
  DirectionalLight,
  Group,
  HemisphereLight,
  Material,
  MathUtils,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  OrthographicCamera,
  PCFShadowMap,
  Quaternion,
  Scene,
  Sphere,
  Texture,
  Vector3,
  WebGLRenderer
} from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { orthographicHalfHeight } from './camera-fit.ts';
import { anatomyRegionBounds, createAnatomyInspection } from './anatomy-inspection.ts';
import type { AnatomyInspection, InspectionSnapshot } from './anatomy-inspection.ts';
import type { AnatomyId } from './anatomy-input.ts';
import { createStudyEmphasis } from './study-emphasis.ts';
import type { StudyEmphasis } from './study-emphasis.ts';
import type { StudyFrame, StudyView } from './field-study.ts';
import { createScaleComparison } from './scale-comparison.ts';
import type { ScaleComparison, ScaleProjection } from './scale-comparison.ts';
export type ViewerState = 'loading' | 'ready' | 'error' | 'unavailable';
export type OrbitDirection = 'left' | 'right' | 'up' | 'down';
export type ViewerHandle = {
  calibrationReady: boolean;
  reset(): void;
  zoom(factor: number): void;
  orbit(direction: OrbitDirection): void;
  selectAnatomy(id: AnatomyId | null): void;
  study: StudyView;
  dispose(): void;
};

const MIN_ZOOM = 0.6;
const MAX_ZOOM = 2.5;
const ORBIT_STEP = Math.PI / 12;



function disposeResources(roots: readonly Object3D[]): void {
  const geometries = new Set<BufferGeometry>();
  const materials = new Set<Material>();
  const textures = new Set<Texture>();
  const images = new Set<ImageBitmap>();

  for (const root of roots) {
    root.traverse((object) => {
      if (!(object instanceof Mesh)) return;
      geometries.add(object.geometry);
      for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
        materials.add(material);
      }
    });
  }
  for (const material of materials) {
    for (const value of Object.values(material)) {
      if (value instanceof Texture) textures.add(value);
    }
  }
  for (const texture of textures) {
    const image = texture.image;
    if (typeof ImageBitmap !== 'undefined' && image instanceof ImageBitmap) images.add(image);
    texture.dispose();
  }
  for (const image of images) image.close();
  for (const material of materials) material.dispose();
  for (const geometry of geometries) geometry.dispose();
}

export function createSpecimenViewer(
  container: HTMLElement,
  modelUrl: string,
  onState: (state: ViewerState) => void,
  onInspection: (snapshot: InspectionSnapshot) => void,
  onScale: (snapshot: ScaleProjection) => void
): ViewerHandle {
  const scene = new Scene();
  scene.background = new Color('#22251f');
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0.01, 20);
  const hemisphere = new HemisphereLight('#fffae7', '#626851', 2);
  const key = new DirectionalLight('#fff7df', 2.8);
  const fill = new DirectionalLight('#e9f0dc', 0.8);
  scene.add(hemisphere, key, key.target, fill, fill.target);

  let renderer: WebGLRenderer | undefined;
  let controls: OrbitControls<OrthographicCamera> | undefined;
  let observer: ResizeObserver | undefined;
  let motionPreference: MediaQueryList | undefined;
  let inspection: AnatomyInspection | undefined;
  let emphasis: StudyEmphasis | undefined;
  let model: Object3D | undefined;
  let modelScenes: Object3D[] = [];
  const scaleTarget = new Vector3();
  const scalePosition = new Vector3();
  const scaleDirection = new Vector3();
  const scaleCorner = new Vector3();
  const scaleSphere = new Sphere();
  const armorBounds = new Box3();
  const tailClubBounds = new Box3();
  const armorTarget = new Vector3();
  const armorPosition = new Vector3();
  const tailClubTarget = new Vector3();
  const tailClubPosition = new Vector3();
  const posePosition = new Vector3();
  const poseTarget = new Vector3();
  const regionCorner = new Vector3();
  const transitionPosition = new Vector3();
  const transitionTarget = new Vector3();
  const compositionPosition = new Vector3();
  const compositionTarget = new Vector3();
  const fitSavedPosition = new Vector3();
  const fitSavedTarget = new Vector3();
  let fitSavedZoom = 1;
  let specimenWrapper: Group | undefined;
  let comparison: ScaleComparison | undefined;
  let specimenMeshes: Mesh[] = [];
  let state: ViewerState = 'loading';
  let disposed = false;
  let radius = 1;
  let horizontalRadius = 1;
  let verticalRadius = 1;
  let scaleHorizontalRadius = 1;
  let scaleVerticalRadius = 1;
  let width = 0;
  let height = 0;
  let hasSize = false;
  let manual = true;
  let studyTargetsReady = false;
  let calibrationReady = false;
  let studyActive = false;
  let studyFrame: (() => void) | null = null;
  let currentStudyFrame: Readonly<StudyFrame> | null = null;
  const heroPosition = new Vector3();
  const heroTarget = new Vector3();
  const guidedHeroPosition = new Vector3();
  const guidedHeroTarget = new Vector3();
  const savedPosition = new Vector3();
  const savedTarget = new Vector3();
  const savedWrapperPosition = new Vector3();
  const savedWrapperScale = new Vector3(1, 1, 1);
  const savedWrapperQuaternion = new Quaternion();
  const savedKeyPosition = new Vector3();
  const savedKeyTarget = new Vector3();
  const savedFillPosition = new Vector3();
  const savedFillTarget = new Vector3();
  let armorZoom = 1;
  let tailClubZoom = 1;
  let compositionZoom = 1;
  let savedZoom = 1;
  let savedHorizontalRadius = 1;
  let savedVerticalRadius = 1;
  let savedCameraNear = 0.01;
  let savedCameraFar = 20;
  let savedShadowLeft = 0;
  let savedShadowRight = 0;
  let savedShadowTop = 0;
  let savedShadowBottom = 0;
  let savedShadowNear = 0;
  let savedShadowFar = 0;
  let savedShadowNormalBias = 0;
  let savedShadowBias = 0;
  let savedHemisphereIntensity = hemisphere.intensity;
  let savedKeyIntensity = key.intensity;
  let savedFillIntensity = fill.intensity;
  let transitionZoom = 1;
  let transitionStart = 0;
  let compositionBlend = 0;
  let composition: ((completed: boolean) => void) | null = null;
  let handle: ViewerHandle;
  function cancelComposition(): void {
    const resolve = composition;
    composition = null;
    resolve?.(false);
  }

  function ownCamera(explore: boolean): void {
    if (!controls) return;
    controls.enableDamping = false;
    controls.update();
    if (manual !== explore) {
      if (explore) controls.connect(renderer!.domElement);
      else controls.disconnect();
    }
    manual = explore;
    controls.enabled = explore;
    controls.enableDamping = explore && !motionPreference?.matches;
    inspection?.setEnabled(explore);
    hemisphere.intensity = explore ? savedHemisphereIntensity : 1.1;
    key.intensity = explore ? savedKeyIntensity : 3.5;
    fill.intensity = explore ? savedFillIntensity : 0.35;
  }

  function transformStudyPoint(point: Vector3): void {
    const origin = comparison!.origin;
    point.sub(origin).multiplyScalar(comparison!.factor).add(origin);
  }

  function smoothstep(progress: number): number {
    const value = MathUtils.clamp(progress, 0, 1);
    return value * value * (3 - 2 * value);
  }

  function guidedBlend(frame: Readonly<StudyFrame>): number {
    if (frame.chapter !== 'scale') return 0;
    return motionPreference?.matches ? 1 : smoothstep(frame.scaleProgress);
  }

  function studyZoom(): number {
    const aspect = width > 0 && height > 0 ? width / height : 1;
    const heroHalfHeight = orthographicHalfHeight(horizontalRadius, verticalRadius, aspect);
    const comparisonHalfHeight = orthographicHalfHeight(scaleHorizontalRadius, scaleVerticalRadius, aspect);
    return heroHalfHeight / comparisonHalfHeight;
  }

  function fitRegion(bounds: Box3, target: Vector3, position: Vector3): number {
    if (!controls) throw new RangeError('Camera controls are unavailable');
    bounds.getCenter(target);
    const heroDistance = guidedHeroPosition.distanceTo(guidedHeroTarget);
    position.copy(target).addScaledVector(scaleDirection, heroDistance);
    camera.position.copy(position);
    controls.target.copy(target);
    camera.zoom = 1;
    controls.update();
    camera.updateMatrixWorld();
    let horizontal = 0;
    let vertical = 0;
    for (let xIndex = 0; xIndex < 2; ++xIndex) {
      for (let yIndex = 0; yIndex < 2; ++yIndex) {
        for (let zIndex = 0; zIndex < 2; ++zIndex) {
          regionCorner.set(
            xIndex ? bounds.max.x : bounds.min.x,
            yIndex ? bounds.max.y : bounds.min.y,
            zIndex ? bounds.max.z : bounds.min.z
          ).applyMatrix4(camera.matrixWorldInverse);
          horizontal = Math.max(horizontal, Math.abs(regionCorner.x));
          vertical = Math.max(vertical, Math.abs(regionCorner.y));
        }
      }
    }
    const aspect = width > 0 && height > 0 ? width / height : 1;
    return orthographicHalfHeight(horizontalRadius, verticalRadius, aspect) /
      orthographicHalfHeight(horizontal, vertical, aspect);
  }

  function calculateRegionFits(): void {
    if (!model || !controls) throw new RangeError('Specimen model is unavailable');
    armorBounds.copy(anatomyRegionBounds(model, 'armor'));
    tailClubBounds.copy(anatomyRegionBounds(model, 'tailClub'));
    if (armorBounds.isEmpty() || tailClubBounds.isEmpty()) throw new RangeError('Study region bounds are unavailable');
    fitSavedPosition.copy(camera.position);
    fitSavedTarget.copy(controls.target);
    fitSavedZoom = camera.zoom;
    armorZoom = fitRegion(armorBounds, armorTarget, armorPosition);
    tailClubZoom = fitRegion(tailClubBounds, tailClubTarget, tailClubPosition);
    camera.position.copy(fitSavedPosition);
    controls.target.copy(fitSavedTarget);
    camera.zoom = fitSavedZoom;
    controls.update();
    camera.updateProjectionMatrix();
  }

  function guidedPose(frame: Readonly<StudyFrame>): void {
    if (!controls) return;
    if (motionPreference?.matches && frame.chapter === 'armor') {
      posePosition.copy(frame.regionProgress > 0 ? tailClubPosition : armorPosition);
      poseTarget.copy(frame.regionProgress > 0 ? tailClubTarget : armorTarget);
      compositionZoom = frame.regionProgress > 0 ? tailClubZoom : armorZoom;
      return;
    }
    if (frame.chapter === 'armor') {
      posePosition.copy(scalePosition);
      poseTarget.copy(scaleTarget);
      let zoom = studyZoom();
      const armorBlend = smoothstep(frame.armorProgress);
      posePosition.lerp(armorPosition, armorBlend);
      poseTarget.lerp(armorTarget, armorBlend);
      zoom = MathUtils.lerp(zoom, armorZoom, armorBlend);
      const regionBlend = smoothstep(frame.regionProgress);
      posePosition.lerp(tailClubPosition, regionBlend);
      poseTarget.lerp(tailClubTarget, regionBlend);
      compositionZoom = MathUtils.lerp(zoom, tailClubZoom, regionBlend);
      return;
    }
    const scaleBlend = guidedBlend(frame);
    posePosition.lerpVectors(guidedHeroPosition, scalePosition, scaleBlend);
    poseTarget.lerpVectors(guidedHeroTarget, scaleTarget, scaleBlend);
    compositionZoom = MathUtils.lerp(1, studyZoom(), scaleBlend);
  }

  function applyGuidedPose(frame: Readonly<StudyFrame>): void {
    if (!controls) return;
    guidedPose(frame);
    camera.position.copy(posePosition);
    controls.target.copy(poseTarget);
    camera.zoom = compositionZoom;
    controls.update();
    camera.updateProjectionMatrix();
    key.target.position.copy(poseTarget);
    fill.target.position.copy(poseTarget);
  }

  function calculateScaleFit(): void {
    if (!controls || !comparison) throw new RangeError('Scale comparison is unavailable');
    comparison.bounds.getCenter(scaleTarget);
    scaleDirection.copy(guidedHeroPosition).sub(guidedHeroTarget).normalize();
    const heroDistance = guidedHeroPosition.distanceTo(guidedHeroTarget);
    camera.position.copy(scaleTarget).addScaledVector(scaleDirection, heroDistance);
    controls.target.copy(scaleTarget);
    camera.zoom = 1;
    controls.update();
    camera.updateMatrixWorld();
    scaleHorizontalRadius = 0;
    scaleVerticalRadius = 0;
    for (let xIndex = 0; xIndex < 2; ++xIndex) {
      for (let yIndex = 0; yIndex < 2; ++yIndex) {
        for (let zIndex = 0; zIndex < 2; ++zIndex) {
          scaleCorner.set(
            xIndex ? comparison.bounds.max.x : comparison.bounds.min.x,
            yIndex ? comparison.bounds.max.y : comparison.bounds.min.y,
            zIndex ? comparison.bounds.max.z : comparison.bounds.min.z
          ).applyMatrix4(camera.matrixWorldInverse);
          scaleHorizontalRadius = Math.max(scaleHorizontalRadius, Math.abs(scaleCorner.x));
          scaleVerticalRadius = Math.max(scaleVerticalRadius, Math.abs(scaleCorner.y));
        }
      }
    }
    comparison.bounds.getBoundingSphere(scaleSphere);
    scalePosition.copy(scaleTarget).addScaledVector(scaleDirection, Math.max(heroDistance, scaleSphere.radius * 4));
  }

  function beginStudy(): boolean {
    if (disposed || state !== 'ready' || !controls || !specimenWrapper || !comparison ||
      !studyTargetsReady || !calibrationReady || studyActive) return false;
    savedHemisphereIntensity = hemisphere.intensity;
    savedKeyIntensity = key.intensity;
    savedFillIntensity = fill.intensity;
    ownCamera(false);
    savedPosition.copy(camera.position);
    savedTarget.copy(controls.target);
    savedZoom = camera.zoom;
    savedHorizontalRadius = horizontalRadius;
    savedVerticalRadius = verticalRadius;
    savedCameraNear = camera.near;
    savedCameraFar = camera.far;
    savedWrapperPosition.copy(specimenWrapper.position);
    savedWrapperScale.copy(specimenWrapper.scale);
    savedWrapperQuaternion.copy(specimenWrapper.quaternion);
    savedKeyPosition.copy(key.position);
    savedKeyTarget.copy(key.target.position);
    savedFillPosition.copy(fill.position);
    savedFillTarget.copy(fill.target.position);
    savedShadowLeft = key.shadow.camera.left;
    savedShadowRight = key.shadow.camera.right;
    savedShadowTop = key.shadow.camera.top;
    savedShadowBottom = key.shadow.camera.bottom;
    savedShadowNear = key.shadow.camera.near;
    savedShadowFar = key.shadow.camera.far;
    savedShadowNormalBias = key.shadow.normalBias;
    savedShadowBias = key.shadow.bias;

    const factor = comparison.factor;
    specimenWrapper.position.copy(savedWrapperPosition).sub(comparison.origin).multiplyScalar(factor).add(comparison.origin);
    specimenWrapper.scale.copy(savedWrapperScale).multiplyScalar(factor);
    specimenWrapper.quaternion.copy(savedWrapperQuaternion);
    specimenWrapper.updateWorldMatrix(true, true);
    guidedHeroPosition.copy(heroPosition);
    transformStudyPoint(guidedHeroPosition);
    guidedHeroTarget.copy(heroTarget);
    transformStudyPoint(guidedHeroTarget);
    horizontalRadius = savedHorizontalRadius * factor;
    verticalRadius = savedVerticalRadius * factor;
    camera.near = savedCameraNear * factor;
    camera.far = savedCameraFar * factor;
    camera.position.copy(savedPosition);
    transformStudyPoint(camera.position);
    controls.target.copy(savedTarget);
    transformStudyPoint(controls.target);
    camera.zoom = savedZoom;
    key.position.copy(savedKeyPosition);
    transformStudyPoint(key.position);
    key.target.position.copy(savedKeyTarget);
    transformStudyPoint(key.target.position);
    fill.position.copy(savedFillPosition);
    transformStudyPoint(fill.position);
    fill.target.position.copy(savedFillTarget);
    transformStudyPoint(fill.target.position);
    key.shadow.camera.left = savedShadowLeft * factor;
    key.shadow.camera.right = savedShadowRight * factor;
    key.shadow.camera.top = savedShadowTop * factor;
    key.shadow.camera.bottom = savedShadowBottom * factor;
    key.shadow.camera.near = savedShadowNear * factor;
    key.shadow.camera.far = savedShadowFar * factor;
    key.shadow.normalBias = savedShadowNormalBias * factor;
    key.shadow.bias = savedShadowBias;
    updateFrustum();
    key.shadow.camera.updateProjectionMatrix();
    controls.update();
    studyActive = true;
    try {
      calculateScaleFit();
      calculateRegionFits();
      const shadowExtent = scaleSphere.radius * 1.6;
      key.target.position.copy(scaleTarget);
      fill.target.position.copy(scaleTarget);
      key.shadow.camera.left = -shadowExtent;
      key.shadow.camera.right = shadowExtent;
      key.shadow.camera.top = shadowExtent;
      key.shadow.camera.bottom = -shadowExtent;
      key.shadow.camera.near = Math.max(0.01, scaleSphere.radius * 0.1);
      key.shadow.camera.far = scaleSphere.radius * 8;
      key.shadow.camera.updateProjectionMatrix();
      camera.far = Math.max(camera.far, scalePosition.distanceTo(scaleTarget) + scaleSphere.radius * 2);

      camera.position.copy(savedPosition);
      transformStudyPoint(camera.position);
      controls.target.copy(savedTarget);
      transformStudyPoint(controls.target);
      camera.zoom = savedZoom;
      updateFrustum();
      controls.update();
      camera.updateMatrixWorld();
      comparison.setVisible(false);
      return true;
    } catch {
      calibrationReady = false;
      handle.calibrationReady = false;
      restoreStudy();
      return false;
    }
  }

  function restoreStudy(): void {
    if (!studyActive || !controls || !specimenWrapper || !comparison) return;
    cancelComposition();
    emphasis?.clear();
    ownCamera(false);
    specimenWrapper.position.copy(savedWrapperPosition);
    specimenWrapper.scale.copy(savedWrapperScale);
    specimenWrapper.quaternion.copy(savedWrapperQuaternion);
    specimenWrapper.updateWorldMatrix(true, true);
    camera.near = savedCameraNear;
    camera.far = savedCameraFar;
    horizontalRadius = savedHorizontalRadius;
    verticalRadius = savedVerticalRadius;
    key.position.copy(savedKeyPosition);
    key.target.position.copy(savedKeyTarget);
    fill.position.copy(savedFillPosition);
    fill.target.position.copy(savedFillTarget);
    key.shadow.camera.left = savedShadowLeft;
    key.shadow.camera.right = savedShadowRight;
    key.shadow.camera.top = savedShadowTop;
    key.shadow.camera.bottom = savedShadowBottom;
    key.shadow.camera.near = savedShadowNear;
    key.shadow.camera.far = savedShadowFar;
    key.shadow.normalBias = savedShadowNormalBias;
    key.shadow.bias = savedShadowBias;
    key.shadow.camera.updateProjectionMatrix();
    camera.position.copy(savedPosition);
    controls.target.copy(savedTarget);
    camera.zoom = savedZoom;
    updateFrustum();
    controls.update();
    camera.updateMatrixWorld();
    studyActive = false;
    currentStudyFrame = null;
    ownCamera(true);
  }

  const study: StudyView = {
    begin: beginStudy,
    compose(frame) {
      cancelComposition();
      if (disposed || !studyActive || !controls || !comparison) return Promise.resolve(false);
      ownCamera(false);
      currentStudyFrame = frame;
      comparison.setVisible(frame.chapter === 'scale');
      if (frame.chapter === 'armor') emphasis?.apply(frame.region);
      else emphasis?.clear();
      guidedPose(frame);
      compositionPosition.copy(posePosition);
      compositionTarget.copy(poseTarget);
      if (motionPreference?.matches) {
        applyGuidedPose(frame);
        return Promise.resolve(true);
      }
      transitionPosition.copy(camera.position);
      transitionTarget.copy(controls.target);
      transitionZoom = camera.zoom;
      transitionStart = performance.now();
      return new Promise<boolean>((resolve) => { composition = resolve; });
    },
    present(frame) {
      if (disposed || !studyActive || manual || !controls || !comparison) return;
      currentStudyFrame = frame;
      comparison.setVisible(frame.chapter === 'scale');
      if (frame.chapter === 'armor') emphasis?.apply(frame.region);
      else emphasis?.clear();
      applyGuidedPose(frame);
    },
    freeze() {
      cancelComposition();
      if (!disposed && studyActive) ownCamera(false);
    },
    pause(frame) {
      cancelComposition();
      if (disposed || !studyActive || !comparison) return;
      currentStudyFrame = frame;
      comparison.setVisible(frame.chapter === 'scale');
      emphasis?.clear();
      ownCamera(true);
    },
    exit() {
      studyFrame = null;
      restoreStudy();
    },
    setFrame(callback) { studyFrame = disposed ? null : callback; }
  };

  function notify(nextState: ViewerState): void {
    if (disposed) return;
    state = nextState;
    onState(nextState);
  }

  function updateFrustum(): void {
    const aspect = width > 0 && height > 0 ? width / height : 1;
    const halfHeight = orthographicHalfHeight(horizontalRadius, verticalRadius, aspect);
    camera.left = -halfHeight * aspect;
    camera.right = halfHeight * aspect;
    camera.top = halfHeight;
    camera.bottom = -halfHeight;
    camera.updateProjectionMatrix();
  }

  function resize(): void {
    if (disposed || !renderer) return;
    const nextWidth = container.clientWidth;
    const nextHeight = container.clientHeight;
    hasSize = nextWidth > 0 && nextHeight > 0;
    if (!hasSize) {
      inspection?.update(nextWidth, nextHeight);
      return;
    }
    if (nextWidth === width && nextHeight === height) return;
    width = nextWidth;
    height = nextHeight;
    renderer.setSize(width, height, false);
    updateFrustum();
    if (studyActive) {
      calculateRegionFits();
      if (!manual && currentStudyFrame) {
        guidedPose(currentStudyFrame);
        if (composition) {
          compositionPosition.copy(posePosition);
          compositionTarget.copy(poseTarget);
        } else {
          applyGuidedPose(currentStudyFrame);
        }
      }
    }
  }

  function updateMotionPreference(): void {
    if (disposed || !controls || !motionPreference) return;
    controls.enableDamping = false;
    controls.update();
    controls.enableDamping = manual && !motionPreference.matches;
  }

  function render(): void {
    if (disposed || !renderer || !controls) return;
    studyFrame?.();
    if (composition) {
      const progress = motionPreference?.matches ? 1 : Math.min(1, (performance.now() - transitionStart) / 350);
      const eased = progress * progress * (3 - 2 * progress);
      camera.position.lerpVectors(transitionPosition, compositionPosition, eased);
      controls.target.lerpVectors(transitionTarget, compositionTarget, eased);
      camera.zoom = MathUtils.lerp(transitionZoom, compositionZoom, eased);
      key.target.position.copy(controls.target);
      fill.target.position.copy(controls.target);
      camera.updateProjectionMatrix();
      if (progress === 1) {
        const resolve = composition;
        composition = null;
        resolve(true);
      }
    }
    controls.update();
    if (!hasSize) return;
    camera.updateMatrixWorld();
    inspection?.update(width, height);
    comparison?.update(camera, width, height);
    renderer.render(scene, camera);
  }

  function reset(): void {
    if (disposed || !manual || state !== 'ready' || !controls) return;
    const damping = controls.enableDamping;
    controls.enableDamping = false;
    controls.update();
    if (studyActive) {
      camera.position.copy(scalePosition);
      controls.target.copy(scaleTarget);
      camera.zoom = studyZoom();
      camera.updateProjectionMatrix();
      controls.update();
      controls.enableDamping = damping;
      return;
    }
    controls.reset();
    controls.enableDamping = damping;
  }

  function zoom(factor: number): void {
    if (disposed || !manual || state !== 'ready' || !Number.isFinite(factor) || factor <= 0) return;
    camera.zoom = MathUtils.clamp(camera.zoom * factor, MIN_ZOOM, MAX_ZOOM);
    camera.updateProjectionMatrix();
  }

  function orbit(direction: OrbitDirection): void {
    if (disposed || !manual || state !== 'ready' || !controls) return;
    const damping = controls.enableDamping;
    controls.enableDamping = false;
    controls.update();
    switch (direction) {
      case 'left':
        controls.rotateLeft(ORBIT_STEP);
        break;
      case 'right':
        controls.rotateLeft(-ORBIT_STEP);
        break;
      case 'up':
        controls.rotateUp(ORBIT_STEP);
        break;
      case 'down':
        controls.rotateUp(-ORBIT_STEP);
        break;
    }
    controls.enableDamping = damping;
  }

  function dispose(): void {
    if (disposed) return;
    if (studyActive) restoreStudy();
    disposed = true;
    calibrationReady = false;
    handle.calibrationReady = false;
    cancelComposition();
    studyFrame = null;
    renderer?.setAnimationLoop(null);
    observer?.disconnect();
    motionPreference?.removeEventListener('change', updateMotionPreference);
    renderer?.domElement.removeEventListener('webglcontextlost', handleContextLoss);
    inspection?.dispose();
    inspection = undefined;
    emphasis?.dispose();
    emphasis = undefined;
    model = undefined;
    controls?.dispose();
    comparison?.dispose();
    comparison = undefined;
    disposeResources([scene, ...modelScenes]);
    key.shadow.dispose();
    scene.clear();
    modelScenes = [];
    specimenMeshes = [];
    specimenWrapper = undefined;
    renderer?.dispose();
    renderer?.domElement.remove();
    controls = undefined;
    observer = undefined;
    motionPreference = undefined;
    renderer = undefined;
  }

  function fail(nextState: 'error' | 'unavailable'): void {
    if (disposed) return;
    notify(nextState);
    dispose();
  }

  function handleContextLoss(event: Event): void {
    event.preventDefault();
    fail('unavailable');
  }

  handle = {
    calibrationReady: false,
    reset, zoom, orbit, dispose, study,
    selectAnatomy(id) {
      if (!disposed && manual && state === 'ready') inspection?.select(id);
    }
  };
  notify('loading');
  try {
    renderer = new WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = PCFShadowMap;
    renderer.toneMapping = ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.domElement.addEventListener('webglcontextlost', handleContextLoss);
    container.appendChild(renderer.domElement);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enabled = false;
    controls.enablePan = false;
    controls.minZoom = MIN_ZOOM;
    controls.maxZoom = MAX_ZOOM;
    controls.minPolarAngle = 0.1;
    controls.maxPolarAngle = Math.PI / 2 - 0.025;
    controls.dampingFactor = 0.08;
    motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
    updateMotionPreference();
    motionPreference.addEventListener('change', updateMotionPreference);

    observer = new ResizeObserver(resize);
    observer.observe(container);
    resize();
  } catch {
    fail('unavailable');
    return handle;
  }

  try {
    new GLTFLoader().load(
      modelUrl,
      (gltf) => {
        if (disposed) {
          disposeResources(gltf.scenes);
          return;
        }
        modelScenes = gltf.scenes;
        try {
          model = gltf.scene;
          emphasis = createStudyEmphasis(model);
          const wrapper = new Group();
          specimenWrapper = wrapper;
          scene.add(wrapper);
          wrapper.add(model);
          const bounds = new Box3().setFromObject(model, true);
          const sphere = bounds.getBoundingSphere(new Sphere());
          radius = sphere.radius;
          if (
            !Number.isFinite(sphere.center.x) ||
            !Number.isFinite(sphere.center.y) ||
            !Number.isFinite(sphere.center.z) ||
            !Number.isFinite(radius * 20) ||
            radius * 0.01 <= 0
          ) {
            throw new RangeError('Model bounds cannot define a finite camera');
          }
          model.traverse((object) => {
            if (!(object instanceof Mesh)) return;
            object.castShadow = true;
            object.receiveShadow = true;
            specimenMeshes.push(object);
          });

          const size = bounds.getSize(new Vector3());
          const thickness = radius * 0.08;
          const plinth = new Mesh(
            new BoxGeometry(size.x + radius * 0.3, thickness, size.z + radius * 0.3),
            new MeshStandardMaterial({ color: '#7c806a', roughness: 0.95 })
          );
          plinth.position.set(sphere.center.x, bounds.min.y - thickness / 2, sphere.center.z);
          plinth.receiveShadow = true;
          wrapper.add(plinth);
          try {
            comparison = createScaleComparison(bounds, specimenMeshes, onScale);
            scene.add(comparison.root);
            calibrationReady = true;
            handle.calibrationReady = true;
          } catch {
            calibrationReady = false;
            handle.calibrationReady = false;
            onScale({
              visible: false,
              length: { visible: false, x: 0, y: 0 },
              human: { visible: false, x: 0, y: 0 }
            });
          }
          key.position.copy(sphere.center).add(new Vector3(-2, 4, 3).multiplyScalar(radius));
          key.target.position.copy(sphere.center);
          key.castShadow = true;
          key.shadow.mapSize.set(2048, 2048);
          key.shadow.camera.left = -radius * 1.6;
          key.shadow.camera.right = radius * 1.6;
          key.shadow.camera.top = radius * 1.6;
          key.shadow.camera.bottom = -radius * 1.6;
          key.shadow.camera.near = radius * 0.1;
          key.shadow.camera.far = radius * 8;
          key.shadow.camera.updateProjectionMatrix();
          key.shadow.normalBias = radius * 0.005;
          key.shadow.bias = -0.00015;
          fill.position.copy(sphere.center).add(new Vector3(1.5, 1, -2).multiplyScalar(radius));
          fill.target.position.copy(sphere.center);

          camera.near = radius * 0.01;
          camera.far = radius * 20;
          camera.zoom = 1;
          camera.position.copy(sphere.center).addScaledVector(new Vector3(-0.4, 0.3, 1).normalize(), radius * 4);
          camera.updateProjectionMatrix();
          controls!.enableDamping = false;
          controls!.target.copy(sphere.center);
          controls!.update();
          camera.updateMatrixWorld();
          // Fit the reset view, not an enclosing sphere that wastes the wide exhibit.
          const displayBounds = bounds.clone().union(new Box3().setFromObject(plinth));
          const corner = new Vector3();
          horizontalRadius = 0;
          verticalRadius = 0;
          for (const x of [displayBounds.min.x, displayBounds.max.x]) {
            for (const y of [displayBounds.min.y, displayBounds.max.y]) {
              for (const z of [displayBounds.min.z, displayBounds.max.z]) {
                corner.set(x, y, z).applyMatrix4(camera.matrixWorldInverse);
                horizontalRadius = Math.max(horizontalRadius, Math.abs(corner.x));
                verticalRadius = Math.max(verticalRadius, Math.abs(corner.y));
              }
            }
          }
          updateFrustum();
          heroPosition.copy(camera.position);
          heroTarget.copy(controls!.target);
          controls!.saveState();
          controls!.enableDamping = !motionPreference!.matches;
          controls!.enabled = true;
          inspection = createAnatomyInspection(model, camera, renderer!.domElement, (snapshot) => {
            studyTargetsReady = snapshot.regions.some((region) => region.id === 'armor' && region.available) &&
              snapshot.regions.some((region) => region.id === 'tailClub' && region.available);
            onInspection(snapshot);
          });
          renderer!.setAnimationLoop(render);
          notify('ready');
        } catch {
          fail('error');
        }
      },
      undefined,
      () => fail('error')
    );
  } catch {
    fail('error');
  }
  return handle;
}

import {
  ACESFilmicToneMapping,
  Box3,
  BoxGeometry,
  BufferGeometry,
  Color,
  DirectionalLight,
  HemisphereLight,
  Material,
  MathUtils,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  OrthographicCamera,
  PCFShadowMap,
  Scene,
  Sphere,
  Texture,
  Vector3,
  WebGLRenderer
} from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { orthographicHalfHeight } from './camera-fit.ts';
import { createAnatomyInspection } from './anatomy-inspection.ts';
import type { AnatomyInspection, InspectionSnapshot } from './anatomy-inspection.ts';
import type { AnatomyId } from './anatomy-input.ts';
import type { StudyView } from './field-study.ts';

export type ViewerState = 'loading' | 'ready' | 'error' | 'unavailable';
export type OrbitDirection = 'left' | 'right' | 'up' | 'down';
export type ViewerHandle = {
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
  onInspection: (snapshot: InspectionSnapshot) => void
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
  let modelScenes: Object3D[] = [];
  let state: ViewerState = 'loading';
  let disposed = false;
  let radius = 1;
  let horizontalRadius = 1;
  let verticalRadius = 1;
  let width = 0;
  let height = 0;
  let hasSize = false;
  let manual = true;
  let studyTargetsReady = false;
  let studyActive = false;
  let studyFrame: (() => void) | null = null;
  const heroPosition = new Vector3();
  const heroTarget = new Vector3();
  const savedPosition = new Vector3();
  const savedTarget = new Vector3();
  const transitionPosition = new Vector3();
  const transitionTarget = new Vector3();
  let savedZoom = 1;
  let transitionZoom = 1;
  let transitionStart = 0;
  let composition: ((completed: boolean) => void) | null = null;

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
    hemisphere.intensity = explore ? 2 : 1.1;
    key.intensity = explore ? 2.8 : 3.5;
    fill.intensity = explore ? 0.8 : 0.35;
  }

  function applyHero(): void {
    if (!controls) return;
    camera.position.copy(heroPosition);
    controls.target.copy(heroTarget);
    camera.zoom = 1;
    controls.update();
    camera.updateProjectionMatrix();
  }

  const study: StudyView = {
    begin() {
      if (disposed || state !== 'ready' || !controls || !studyTargetsReady || studyActive) return false;
      ownCamera(false);
      savedPosition.copy(camera.position);
      savedTarget.copy(controls.target);
      savedZoom = camera.zoom;
      studyActive = true;
      return true;
    },
    compose() {
      cancelComposition();
      if (disposed || !studyActive || !controls) return Promise.resolve(false);
      ownCamera(false);
      if (motionPreference?.matches) {
        applyHero();
        return Promise.resolve(true);
      }
      transitionPosition.copy(camera.position);
      transitionTarget.copy(controls.target);
      transitionZoom = camera.zoom;
      transitionStart = performance.now();
      return new Promise<boolean>((resolve) => { composition = resolve; });
    },
    pause() {
      cancelComposition();
      if (!disposed && studyActive) ownCamera(true);
    },
    exit() {
      cancelComposition();
      studyFrame = null;
      if (disposed || !studyActive || !controls) return;
      ownCamera(false);
      camera.position.copy(savedPosition);
      controls.target.copy(savedTarget);
      camera.zoom = savedZoom;
      controls.update();
      updateFrustum();
      studyActive = false;
      ownCamera(true);
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
      camera.position.lerpVectors(transitionPosition, heroPosition, eased);
      controls.target.lerpVectors(transitionTarget, heroTarget, eased);
      camera.zoom = MathUtils.lerp(transitionZoom, 1, eased);
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
    renderer.render(scene, camera);
  }

  function reset(): void {
    if (disposed || !manual || state !== 'ready' || !controls) return;
    const damping = controls.enableDamping;
    controls.enableDamping = false;
    controls.update();
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
    disposed = true;
    cancelComposition();
    studyFrame = null;
    renderer?.setAnimationLoop(null);
    observer?.disconnect();
    motionPreference?.removeEventListener('change', updateMotionPreference);
    renderer?.domElement.removeEventListener('webglcontextlost', handleContextLoss);
    inspection?.dispose();
    inspection = undefined;
    controls?.dispose();
    disposeResources([scene, ...modelScenes]);
    key.shadow.dispose();
    scene.clear();
    modelScenes = [];
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

  const handle: ViewerHandle = {
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
          const model = gltf.scene;
          scene.add(model);
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
          });

          const size = bounds.getSize(new Vector3());
          const thickness = radius * 0.08;
          const plinth = new Mesh(
            new BoxGeometry(size.x + radius * 0.3, thickness, size.z + radius * 0.3),
            new MeshStandardMaterial({ color: '#7c806a', roughness: 0.95 })
          );
          plinth.position.set(sphere.center.x, bounds.min.y - thickness / 2, sphere.center.z);
          plinth.receiveShadow = true;
          scene.add(plinth);

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

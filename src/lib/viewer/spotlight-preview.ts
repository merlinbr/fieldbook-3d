import {
  ACESFilmicToneMapping,
  Box3,
  BoxGeometry,
  Color,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  OrthographicCamera,
  PCFShadowMap,
  Scene,
  Vector3,
  WebGLRenderer
} from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { disposeViewerResources } from './rendering-resources.ts';
import { createWarmExhibitLighting } from './rendering-stage.ts';
import { orthographicHalfHeight } from './camera-fit.ts';

export type PreviewState = 'loading' | 'ready' | 'error' | 'unavailable';
export type SpotlightPreviewHandle = {
  orbit(direction: 'left' | 'right' | 'up' | 'down'): void;
  reset(): void;
  dispose(): void;
};

const ORBIT_STEP = Math.PI / 12;

export function createSpotlightPreview(
  container: HTMLElement,
  modelUrl: string,
  onState: (state: PreviewState) => void
): SpotlightPreviewHandle {
  const scene = new Scene();
  scene.background = new Color('#22251f');
  const { hemisphere, key, fill } = createWarmExhibitLighting();
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0.01, 20);
  scene.add(hemisphere, key, key.target, fill, fill.target);
  const abort = new AbortController();
  let renderer: WebGLRenderer | undefined;
  let controls: OrbitControls<OrthographicCamera> | undefined;
  let observer: ResizeObserver | undefined;
  let model: Object3D | undefined;
  let plinth: Mesh | undefined;
  let displayBounds: Box3 | undefined;
  let horizontalRadius = 1;
  let verticalRadius = 1;
  let disposed = false;
  let released = false;
  let failed = false;
  let ready = false;
  let frameId: number | null = null;
  let halfHeight = 1;
  let modelScenes: Object3D[] = [];
  const corner = new Vector3();

  const notify = (state: PreviewState) => { if (!disposed) onState(state); };
  const render = () => {
    frameId = null;
    if (!disposed && !failed && ready && renderer && renderer.domElement.isConnected) renderer.render(scene, camera);
  };
  const requestRender = () => {
    if (disposed || failed || !ready || frameId !== null) return;
    frameId = requestAnimationFrame(render);
  };
  const fitView = () => {
    if (!displayBounds || !controls) return;
    camera.updateMatrixWorld();
    horizontalRadius = 0;
    verticalRadius = 0;
    for (let x = 0; x < 2; ++x) {
      for (let y = 0; y < 2; ++y) {
        for (let z = 0; z < 2; ++z) {
          corner.set(
            x ? displayBounds.max.x : displayBounds.min.x,
            y ? displayBounds.max.y : displayBounds.min.y,
            z ? displayBounds.max.z : displayBounds.min.z
          ).applyMatrix4(camera.matrixWorldInverse);
          horizontalRadius = Math.max(horizontalRadius, Math.abs(corner.x));
          verticalRadius = Math.max(verticalRadius, Math.abs(corner.y));
        }
      }
    }
    const width = container.clientWidth;
    const height = container.clientHeight;
    if (width <= 0 || height <= 0) return;
    const aspect = width / height;
    halfHeight = orthographicHalfHeight(horizontalRadius, verticalRadius, aspect);
    camera.left = -halfHeight * aspect;
    camera.right = halfHeight * aspect;
    camera.top = halfHeight;
    camera.bottom = -halfHeight;
    camera.updateProjectionMatrix();
  };
  const onControlsChange = () => { fitView(); requestRender(); };
  const resize = () => {
    if (disposed || !renderer) return;
    const width = container.clientWidth;
    const height = container.clientHeight;
    if (width <= 0 || height <= 0) return;
    renderer.setSize(width, height, false);
    fitView();
    requestRender();
  };
  function teardown(state?: 'error' | 'unavailable'): void {
    if (released) return;
    released = true;
    ready = false;
    if (state) failed = true;
    abort.abort();
    if (frameId !== null) cancelAnimationFrame(frameId);
    frameId = null;
    observer?.disconnect();
    observer = undefined;
    if (controls) {
      controls.removeEventListener('change', onControlsChange);
      controls.dispose();
      controls = undefined;
    }
    disposeViewerResources([...modelScenes, ...(plinth ? [plinth] : [])]);
    modelScenes = [];
    model = undefined;
    plinth = undefined;
    displayBounds = undefined;
    key.shadow.dispose();
    if (renderer) {
      renderer.domElement.removeEventListener('webglcontextlost', loseContext);
      renderer.domElement.remove();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer = undefined;
    }
    scene.clear();
    if (state) notify(state);
  }
  const loseContext = (event: Event) => {
    event.preventDefault();
    fail('unavailable');
  };
  const fail = (state: 'error' | 'unavailable') => {
    if (disposed || failed) return;
    teardown(state);
  };
  const handle: SpotlightPreviewHandle = {
    orbit(direction) {
      if (disposed || failed || !controls) return;
      if (direction === 'left') controls.rotateLeft(ORBIT_STEP);
      else if (direction === 'right') controls.rotateLeft(-ORBIT_STEP);
      else if (direction === 'up') controls.rotateUp(ORBIT_STEP);
      else controls.rotateUp(-ORBIT_STEP);
      controls.update();
      requestRender();
    },
    reset() {
      if (disposed || failed || !controls) return;
      controls.reset();
      requestRender();
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      teardown();
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
    renderer.domElement.addEventListener('webglcontextlost', loseContext);
    container.appendChild(renderer.domElement);
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.enableDamping = false;
    controls.minPolarAngle = 0.1;
    controls.maxPolarAngle = Math.PI / 2 - 0.05;
    controls.enableZoom = false;
    // OrbitControls sets `none`; allow native vertical panning while retaining horizontal drag.
    renderer.domElement.style.touchAction = 'pan-y';
    controls.addEventListener('change', onControlsChange);
    observer = new ResizeObserver(resize);
    observer.observe(container);
  } catch {
    fail('unavailable');
    return handle;
  }

  void (async () => {
    try {
      const response = await fetch(modelUrl, { signal: abort.signal });
      if (!response.ok) throw new Error(`Model request failed (${response.status})`);
      const data = await response.arrayBuffer();
      if (disposed || failed || abort.signal.aborted) return;
      const basePath = new URL('.', new URL(modelUrl, document.baseURI)).href;
      const gltf = await new GLTFLoader().parseAsync(data, basePath);
      if (disposed || failed || abort.signal.aborted) {
        disposeViewerResources(gltf.scenes);
        return;
      }
      modelScenes = gltf.scenes;
      model = gltf.scene;
      const bounds = new Box3().setFromObject(model, true);
      if (bounds.isEmpty()) throw new Error('Model has no renderable bounds');
      const center = bounds.getCenter(new Vector3());
      const size = bounds.getSize(new Vector3());
      const radius = size.length() / 2;
      if (!Number.isFinite(radius) || radius <= 0) throw new Error('Invalid model bounds');
      key.position.copy(center).add(new Vector3(-2, 4, 3).multiplyScalar(radius));
      key.target.position.copy(center);
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
      fill.position.copy(center).add(new Vector3(1.5, 1, -2).multiplyScalar(radius));
      fill.target.position.copy(center);
      model.traverse((object) => { if (object instanceof Mesh) { object.castShadow = true; object.receiveShadow = true; } });
      scene.add(model);
      const thickness = radius * 0.08;
      plinth = new Mesh(new BoxGeometry(size.x + radius * 0.3, thickness, size.z + radius * 0.3),
        new MeshStandardMaterial({ color: '#7c806a', roughness: 0.95 }));
      plinth.position.set(center.x, bounds.min.y - thickness / 2, center.z);
      plinth.receiveShadow = true;
      scene.add(plinth);
      displayBounds = bounds.clone().union(new Box3().setFromObject(plinth));
      camera.near = radius * 0.01;
      camera.far = radius * 20;
      camera.position.copy(center).addScaledVector(new Vector3(-0.4, 0.3, 1).normalize(), radius * 4);
      controls!.target.copy(center);
      controls!.update();
      controls!.saveState();
      ready = true;
      resize();
      notify('ready');
    } catch {
      if (!abort.signal.aborted && !disposed && !failed) fail('error');
    }
  })();
  return handle;
}

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { orthographicHalfHeight } from '../../src/lib/viewer/camera-fit.ts';

const assets = [
  { name: 'ankylosaurus', label: 'Ankylosaurus', url: 'http://127.0.0.1:5194/ankylosaurus.glb' },
  { name: 'stegosaurus', label: 'Stegosaurus', url: 'http://127.0.0.1:5194/stegosaurus.glb' }
];
const width = 1200;
const height = 750;
const status = document.querySelector('#status');
const previews = document.querySelector('#previews');
const loader = new GLTFLoader();

function renderPoster(model) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#22251f');
  scene.add(model);
  model.updateMatrixWorld(true);

  const bounds = new THREE.Box3().setFromObject(model, true);
  const center = bounds.getCenter(new THREE.Vector3());
  const radius = bounds.getBoundingSphere(new THREE.Sphere()).radius;
  if (!Number.isFinite(radius) || radius <= 0) throw new Error('The loaded model has no renderable bounds.');

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setSize(width, height, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  scene.add(new THREE.HemisphereLight(0xffffff, 0x77736a, 2.0));
  const key = new THREE.DirectionalLight(0xffffff, 3.0);
  key.position.set(-1, 2, 3);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xffffff, 1.2);
  fill.position.set(2, 1, -2);
  scene.add(fill);

  const viewDirection = new THREE.Vector3(1, 0.43, 1).normalize();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, Math.max(radius / 1000, 0.001), radius * 10);
  camera.position.copy(center).addScaledVector(viewDirection, radius * 4);
  camera.lookAt(center);
  camera.updateMatrixWorld(true);

  const projected = new THREE.Vector3();
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  model.traverse(part => {
    if (!part.isMesh) return;
    const positions = part.geometry.getAttribute('position');
    for (let index = 0; index < positions.count; index++) {
      projected.fromBufferAttribute(positions, index)
        .applyMatrix4(part.matrixWorld)
        .applyMatrix4(camera.matrixWorldInverse);
      minX = Math.min(minX, projected.x);
      maxX = Math.max(maxX, projected.x);
      minY = Math.min(minY, projected.y);
      maxY = Math.max(maxY, projected.y);
    }
  });
  if (![minX, maxX, minY, maxY].every(Number.isFinite)) throw new Error('The loaded model has no renderable vertices.');

  const horizontalRadius = (maxX - minX) / 2;
  const verticalRadius = (maxY - minY) / 2;
  const aspect = width / height;
  const halfHeight = orthographicHalfHeight(horizontalRadius, verticalRadius, aspect);
  const shiftX = (minX + maxX) / 2;
  const shiftY = (minY + maxY) / 2;
  const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
  const up = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);
  const shift = right.multiplyScalar(shiftX).addScaledVector(up, shiftY);
  camera.position.add(shift);
  camera.left = -halfHeight * aspect;
  camera.right = halfHeight * aspect;
  camera.top = halfHeight;
  camera.bottom = -halfHeight;
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld(true);
  renderer.render(scene, camera);
  return renderer;

}

for (const asset of assets) {
  const figure = document.createElement('figure');
  const caption = document.createElement('figcaption');
  caption.textContent = asset.label;
  figure.append(caption);
  previews.append(figure);

  try {
    const { scene } = await loader.loadAsync(asset.url);
    const renderer = renderPoster(scene);
    figure.append(renderer.domElement);
    const download = document.createElement('button');
    download.type = 'button';
    download.textContent = `Download ${asset.label} PNG`;
    download.addEventListener('click', () => renderer.domElement.toBlob(blob => {
      if (!blob) {
        status.textContent = `Could not encode ${asset.label} poster.`;
        return;
      }
      const href = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = href;
      link.download = `${asset.name}-poster.png`;
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(href), 1000);
      status.textContent = `Downloaded ${asset.name}-poster.png. Move it to media-dev/ for local poster serving.`;
    }, 'image/png'));
    figure.append(download);
  } catch (error) {
    status.textContent = `Could not load ${asset.label}: ${error.message}. Start npm run media:dev and confirm its ignored GLB exists.`;
  }
}

if (previews.querySelectorAll('canvas').length === assets.length) {
  status.textContent = 'Both source models are rendered. Download each PNG into media-dev/. No model, audio, or WebGL is used by the Overview page.';
}

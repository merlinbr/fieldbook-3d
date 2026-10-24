import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { createLowPolyStegosaurus } from '../../example project/low-poly/stegosaurus.js';

const viewport = document.querySelector('#viewport');
const status = document.querySelector('#status');
try {
  const source = createLowPolyStegosaurus();
  const port = new URLSearchParams(location.search).get('mediaPort') || '5194';
  if (!/^\d{1,5}$/.test(port) || Number(port) < 1 || Number(port) > 65535) throw new Error('Invalid loopback mediaPort');
  const { scene: exported } = await new GLTFLoader().loadAsync(`http://127.0.0.1:${port}/stegosaurus.glb`);
  exported.traverse(part => {
    // Shadow participation is renderer configuration, not a glTF property.
    if (part.isMesh) part.castShadow = part.receiveShadow = true;
  });
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.domElement.setAttribute('aria-label', 'Procedural source on the left; reloaded Stegosaurus GLB on the right.');
  viewport.append(renderer.domElement);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#e8e9df');
  scene.add(source, exported);
  scene.add(new THREE.HemisphereLight('#fffae7', '#626851', 2));
  const sun = new THREE.DirectionalLight('#fff7df', 2.8);
  sun.position.set(-3, 9, 5);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -9, right: 9, top: 7, bottom: -7, near: 0.5, far: 30 });
  sun.shadow.normalBias = 0.025;
  sun.shadow.bias = -0.00015;
  scene.add(sun);
  const fill = new THREE.DirectionalLight('#e9f0dc', 0.8);
  fill.position.set(2, 4, -6);
  scene.add(fill);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), new THREE.MeshStandardMaterial({ color: '#e8e9df', roughness: 0.9 }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.02;
  ground.receiveShadow = true;
  scene.add(ground);
  const bounds = new THREE.Box3().setFromObject(source, true);
  const target = bounds.getCenter(new THREE.Vector3());
  const radius = bounds.getSize(new THREE.Vector3()).length() / 2;
  const camera = new THREE.OrthographicCamera(-7, 7, 5, -5, 0.1, 100);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.copy(target);
  controls.enablePan = false;
  controls.minZoom = 0.6;
  controls.maxZoom = 2.5;
  controls.maxPolarAngle = Math.PI / 2;
  let width = 1, height = 1;
  function render() {
    renderer.setScissorTest(true);
    for (let i = 0; i < 2; i++) {
      source.visible = i === 0;
      exported.visible = i === 1;
      renderer.setViewport(i * width / 2, 0, width / 2, height);
      renderer.setScissor(i * width / 2, 0, width / 2, height);
      renderer.render(scene, camera);
    }
    renderer.setScissorTest(false);
  }
  const views = { threeQuarter: [-0.45, 0.3, 1], side: [0, 0, 1], opposite: [0, 0, -1] };
  function setView(name) {
    camera.position.fromArray(views[name]).normalize().multiplyScalar(radius * 3).add(target);
    camera.zoom = 1;
    camera.updateProjectionMatrix();
    controls.update();
    render();
  }
  for (const button of document.querySelectorAll('[data-view]')) button.addEventListener('click', () => setView(button.dataset.view));
  controls.addEventListener('change', render);
  const resize = new ResizeObserver(() => {
    ({ width, height } = viewport.getBoundingClientRect());
    const aspect = width / 2 / height;
    const halfHeight = Math.max(2.7, radius / aspect) * 1.15;
    Object.assign(camera, { left: -halfHeight * aspect, right: halfHeight * aspect, top: halfHeight, bottom: -halfHeight });
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    render();
  });
  resize.observe(viewport);
  setView('threeQuarter');
  status.textContent = 'Ready — 2,976 triangles · 19 plates · four spikes · GLB loaded over HTTP';
} catch (error) {
  status.textContent = `Comparison unavailable: ${error.message}. Run npm run export:stegosaurus and npm run media:dev, then reload.`;
  console.error(error);
}

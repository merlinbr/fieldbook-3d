import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createLowPolyStegosaurus } from '../../example project/low-poly/stegosaurus.js';
import { createWalkCycle } from '../../example project/low-poly/walk-cycle.js';

const viewport = document.querySelector('#viewport');
const status = document.querySelector('#status');
try {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.domElement.setAttribute('aria-label', 'Low-poly Stegosaurus; use the view buttons or drag to orbit.');
  viewport.append(renderer.domElement);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#e8e9df');
  const model = createLowPolyStegosaurus();
  scene.add(model);
  const updateWalk = createWalkCycle(model);
  const bounds = new THREE.Box3().setFromObject(model);
  const target = bounds.getCenter(new THREE.Vector3());
  const radius = bounds.getSize(new THREE.Vector3()).length() / 2;
  const camera = new THREE.OrthographicCamera(-7, 7, 5, -5, 0.1, 100);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enablePan = false;
  controls.minZoom = 0.6;
  controls.maxZoom = 2.5;
  controls.maxPolarAngle = Math.PI / 2;
  controls.target.copy(target);
  const views = {
    threeQuarter: new THREE.Vector3(-0.45, 0.3, 1),
    side: new THREE.Vector3(0, 0, 1),
    opposite: new THREE.Vector3(0, 0, -1),
    top: new THREE.Vector3(0, 1, 0.001)
  };
  function setView(name) {
    camera.position.copy(views[name]).normalize().multiplyScalar(radius * 3).add(target);
    camera.zoom = 1;
    controls.update();
    camera.updateProjectionMatrix();
  }
  for (const button of document.querySelectorAll('[data-view]')) {
    button.addEventListener('click', () => setView(button.dataset.view));
  }
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
  let walking = false;
  let time = 0;
  let previous;
  const walk = document.querySelector('#walk');
  function setWalking(value) {
    walking = value;
    walk.setAttribute('aria-pressed', String(value));
    walk.textContent = value ? 'Pause' : 'Walk';
  }
  walk.addEventListener('click', () => setWalking(!walking));
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  motion.addEventListener('change', () => { if (motion.matches) setWalking(false); });
  const resize = new ResizeObserver(() => {
    const { width, height } = viewport.getBoundingClientRect();
    const aspect = width / height;
    const halfHeight = Math.max(2.7, radius / aspect) * 1.15;
    camera.left = -halfHeight * aspect;
    camera.right = halfHeight * aspect;
    camera.top = halfHeight;
    camera.bottom = -halfHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  });
  resize.observe(viewport);
  setView('threeQuarter');
  renderer.setAnimationLoop(now => {
    const delta = previous === undefined ? 0 : Math.min((now - previous) / 1000, 0.05);
    previous = now;
    if (walking) time += delta;
    updateWalk(time, walking ? 1 : 0);
    renderer.render(scene, camera);
  });
  status.textContent = `${model.userData.triangles.toLocaleString('en')} / 3,000 triangles · 19 plates · four tail spikes`;
} catch (error) {
  status.textContent = `Preview unavailable: ${error.message}`;
  console.error(error);
}

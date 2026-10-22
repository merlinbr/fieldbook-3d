import {
  BufferGeometry, Color, DataTexture, DynamicDrawUsage, Float32BufferAttribute,
  LinearFilter, MathUtils, Points, PointsMaterial, Sphere, Vector3
} from 'three';
import type { SpotLight } from 'three';

const COUNT = 48;

// Source-space geometry sits beside the spotlight under the calibrated specimen wrapper.
export function createStudyDust(spotlight: SpotLight) {
  const axis = spotlight.target.position.clone().sub(spotlight.position);
  const distance = axis.length();
  axis.normalize();
  const reference = new Vector3(0, 1, 0);
  if (Math.abs(axis.y) > 0.95) reference.set(1, 0, 0);
  const across = new Vector3().crossVectors(axis, reference).normalize();
  const up = new Vector3().crossVectors(across, axis).normalize();
  const spread = Math.tan(spotlight.angle) * 0.5;
  const positions = new Float32BufferAttribute(new Float32Array(COUNT * 3), 3).setUsage(DynamicDrawUsage);
  const colors = new Float32BufferAttribute(new Float32Array(COUNT * 3), 3);
  const seeds = Array.from({ length: COUNT }, (_, index) => {
    const random = (salt: number) => {
      const value = Math.sin((index + 1) * 127.1 + salt * 311.7) * 43758.5453;
      return value - Math.floor(value);
    };
    const brightness = 0.45 + random(1) * 0.55;
    colors.setXYZ(index, brightness, brightness, brightness);
    return {
      angle: random(2) * Math.PI * 2, depth: 0.55 + random(3) * 0.45,
      radial: 0.12 + random(4) * 0.65, speed: 0.012 + random(5) * 0.008
    };
  });
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', positions);
  geometry.setAttribute('color', colors);
  geometry.boundingSphere = new Sphere(spotlight.target.position.clone(), distance);

  // A tiny generated soft sprite needs no media request or additional asset.
  const pixels = new Uint8Array(16 * 16 * 4);
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const radiusSquared = ((x - 7.5) / 7.5) ** 2 + ((y - 7.5) / 7.5) ** 2;
      const offset = (y * 16 + x) * 4;
      pixels.set([255, 255, 255, Math.round(255 * Math.max(0, 1 - radiusSquared) ** 2)], offset);
    }
  }
  const sprite = new DataTexture(pixels, 16, 16);
  sprite.minFilter = sprite.magFilter = LinearFilter;
  sprite.needsUpdate = true;
  const material = new PointsMaterial({
    color: new Color('#efd7a7'), map: sprite, size: 3, sizeAttenuation: false,
    transparent: true, opacity: 0, vertexColors: true, depthTest: true, depthWrite: false
  });
  const root = new Points(geometry, material);
  root.name = 'study-dust';
  root.visible = false;
  let disposed = false;
  let lastTime: number | null = null;
  let elapsed = 0;

  function move(): void {
    seeds.forEach((seed, index) => {
      const angle = seed.angle + elapsed * seed.speed;
      const depth = distance * (seed.depth + 0.035 * Math.sin(seed.angle + elapsed * 0.12));
      const radius = depth * spread * seed.radial;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      positions.setXYZ(index,
        spotlight.position.x + axis.x * depth + across.x * x + up.x * y,
        spotlight.position.y + axis.y * depth + across.y * x + up.y * y,
        spotlight.position.z + axis.z * depth + across.z * x + up.z * y
      );
    });
    positions.needsUpdate = true;
  }
  move();

  function update(now: number, amount: number, reducedMotion: boolean): void {
    if (disposed) return;
    material.opacity = reducedMotion ? 0 : MathUtils.clamp(amount, 0, 1) * 0.26;
    root.visible = material.opacity > 0;
    const delta = lastTime === null ? 0 : MathUtils.clamp(now - lastTime, 0, 64) / 1000;
    lastTime = now;
    if (!root.visible) return;
    elapsed += delta;
    move();
  }

  function dispose(): void {
    if (disposed) return;
    disposed = true;
    root.visible = false;
    root.removeFromParent();
    geometry.dispose();
    material.dispose();
    sprite.dispose();
  }

  return { root, update, dispose };
}

export type StudyDust = ReturnType<typeof createStudyDust>;

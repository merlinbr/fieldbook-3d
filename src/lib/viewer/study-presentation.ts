import { Color, MathUtils } from 'three';
import type { DirectionalLight, HemisphereLight, MeshStandardMaterial, SpotLight } from 'three';
import type { StudyDust } from './study-dust.ts';

type PresentationScene = {
  background: Color;
  hemisphere: HemisphereLight;
  key: DirectionalLight;
  fill: DirectionalLight;
  spotlight: SpotLight;
  plinths: readonly MeshStandardMaterial[];
  dust?: StudyDust;
};

// Shares the viewer's existing animation loop; it never takes ownership of playback or camera controls.
export function createStudyPresentation({ background, hemisphere, key, fill, spotlight, plinths, dust }: PresentationScene) {
  const exploreBackground = background.clone();
  const explorePlinths = plinths.map((material) => material.color.clone());
  const exploreLights = [hemisphere.intensity, key.intensity, fill.intensity];
  const cinemaBackground = new Color('#0d100e');
  const cinemaPlinth = new Color('#34392f');
  let active = false;
  let amount = 0;
  let from = 0;
  let started = 0;

  function apply(): void {
    background.copy(exploreBackground).lerp(cinemaBackground, amount);
    plinths.forEach((material, index) => material.color.copy(explorePlinths[index]).lerp(cinemaPlinth, amount));
    hemisphere.intensity = MathUtils.lerp(exploreLights[0], 0.5, amount);
    key.intensity = MathUtils.lerp(exploreLights[1], 1.8, amount);
    fill.intensity = MathUtils.lerp(exploreLights[2], 0.25, amount);
    spotlight.intensity = 3.4 * amount;
    spotlight.visible = amount > 0;
  }

  function update(now: number, reducedMotion: boolean): void {
    const target = active ? 1 : 0;
    if (amount !== target) {
      const progress = reducedMotion ? 1 : MathUtils.clamp((now - started) / 350, 0, 1);
      const eased = progress * progress * (3 - 2 * progress);
      amount = MathUtils.lerp(from, target, eased);
      apply();
    }
    dust?.update(now, amount, reducedMotion);
  }

  function setActive(next: boolean, now: number, reducedMotion: boolean): void {
    update(now, reducedMotion);
    if (next !== active) {
      active = next;
      from = amount;
      started = now;
    }
    update(now, reducedMotion);
  }

  function reset(): void {
    active = false;
    amount = from = 0;
    apply();
    dust?.update(0, 0, true);
  }

  reset();
  return { setActive, update, reset };
}

import { DirectionalLight, HemisphereLight } from 'three';

export function createWarmExhibitLighting() {
  return {
    hemisphere: new HemisphereLight('#fffae7', '#626851', 2),
    key: new DirectionalLight('#fff7df', 2.8),
    fill: new DirectionalLight('#e9f0dc', 0.8)
  };
}

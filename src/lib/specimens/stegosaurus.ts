import { PUBLIC_STEGOSAURUS_MODEL_URL } from '$app/env/public';
import { stegosaurusScientificName } from './content.ts';
import { createStegosaurusConfig } from './stegosaurus-config.ts';
import { resolveModelUrl } from './model-url.ts';

export const stegosaurus = {
  id: 'stegosaurus',
  scientificName: stegosaurusScientificName,
  config: createStegosaurusConfig(resolveModelUrl(PUBLIC_STEGOSAURUS_MODEL_URL, {
    development: import.meta.env.MODE === 'development',
    environmentVariable: 'PUBLIC_STEGOSAURUS_MODEL_URL',
    developmentUrl: 'http://127.0.0.1:5194/stegosaurus.glb'
  }))
} as const;

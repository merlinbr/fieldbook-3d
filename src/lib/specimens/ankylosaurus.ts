import { PUBLIC_ANKYLOSAURUS_MODEL_URL, PUBLIC_ANKYLOSAURUS_STUDY_VERSION, PUBLIC_ANKYLOSAURUS_STUDY_VERSION_DE } from '$app/env/public';
import { ankylosaurusScientificName } from './content.ts';
import { createAnkylosaurusConfig } from './ankylosaurus-config.ts';
import { resolveModelUrl } from './model-url.ts';
import { resolveStudyVersion } from '../viewer/study-data.ts';

const development = import.meta.env.MODE === 'development';

const study = {
  en: resolveStudyVersion('en', PUBLIC_ANKYLOSAURUS_STUDY_VERSION, PUBLIC_ANKYLOSAURUS_STUDY_VERSION_DE),
  de: resolveStudyVersion('de', PUBLIC_ANKYLOSAURUS_STUDY_VERSION, PUBLIC_ANKYLOSAURUS_STUDY_VERSION_DE)
};

export const ankylosaurus = {
  id: 'ankylosaurus',
  scientificName: ankylosaurusScientificName,
  config: createAnkylosaurusConfig(resolveModelUrl(PUBLIC_ANKYLOSAURUS_MODEL_URL, {
    development, environmentVariable: 'PUBLIC_ANKYLOSAURUS_MODEL_URL',
    developmentUrl: 'http://127.0.0.1:5194/ankylosaurus.glb'
  })),
  study,
  versions: Object.values(study).map((recording) => recording.version).filter((version) => version !== null)
} as const;

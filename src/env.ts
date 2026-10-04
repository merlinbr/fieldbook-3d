import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
  PUBLIC_ANKYLOSAURUS_MODEL_URL: {
    public: true,
    static: true,
    schema: (value: string | undefined) => value
  },
  PUBLIC_ANKYLOSAURUS_STUDY_VERSION: {
    public: true,
    static: true,
    schema: (value: string | undefined) => value
  }
});

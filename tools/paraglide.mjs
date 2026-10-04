import { compile } from '@inlang/paraglide-js';

/** @type {Parameters<typeof compile>[0]} */
export const options = {
  project: './project.inlang',
  outdir: './src/lib/paraglide',
  emitTsDeclarations: true,
  strategy: ['url', 'baseLocale'],
  urlPatterns: [{
    pattern: '/:path(.*)?',
    localized: [['en', '/en/:path(.*)?'], ['de', '/de/:path(.*)?']]
  }]
};

if (import.meta.main) await compile(options);

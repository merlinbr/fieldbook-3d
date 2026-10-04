import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { paraglideVitePlugin } from '@inlang/paraglide-js';
import { defineConfig } from 'vite';
import { options as paraglideOptions } from './tools/paraglide.mjs';

export default defineConfig({
  plugins: [
    paraglideVitePlugin(paraglideOptions),
    sveltekit({
      compilerOptions: {
        runes: ({ filename }) => filename.split(/[/\\]/).includes('node_modules') ? undefined : true
      },
      adapter: adapter({ strict: true }),
      prerender: { entries: ['/', '/en/specimens/ankylosaurus/', '/de/specimens/ankylosaurus/'] }
    })
  ]
});

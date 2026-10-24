import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const root = fileURLToPath(new URL('.', import.meta.url));
const repository = fileURLToPath(new URL('../../', import.meta.url));

export default defineConfig({
  root,
  resolve: { dedupe: ['three'] },
  server: { host: '127.0.0.1', fs: { allow: [repository] } },
  build: {
    outDir: '../../dist/stegosaurus-preview', emptyOutDir: true,
    rolldownOptions: { input: { preview: `${root}index.html`, compare: `${root}compare.html` } }
  }
});

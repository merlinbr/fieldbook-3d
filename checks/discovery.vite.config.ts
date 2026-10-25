import { defineConfig, mergeConfig, normalizePath } from 'vite';
import base from '../vite.config.ts';

// This configuration is used only by dev:discovery-fixtures, never by the static build.
export default mergeConfig(base, defineConfig({
  plugins: [{
    name: 'discovery-verification-catalog',
    enforce: 'pre',
    transform(_code, id) {
      if (normalizePath(id).endsWith('/src/routes/overview/+page.svelte')) return {
        code: `<script lang="ts">
          import Overview from '#lib/overview/Overview.svelte';
          import { discoveryFixtures } from '../../../checks/fixtures/discovery-catalog.ts';
          import { specimens } from '#lib/specimens/catalog.ts';
          let entries = $state(discoveryFixtures);
        </script>
        <aside aria-label="Verification fixture controls">
          <p>52-entry verification catalog — fifty explicitly labeled layout samples; not production content.</p>
          <button onclick={() => entries = specimens}>Shrink to real specimens</button>
          <button onclick={() => entries = discoveryFixtures}>Restore 52 entries</button>
        </aside>
        <Overview {entries} />`,
        map: null
      };
    }
  }]
}));

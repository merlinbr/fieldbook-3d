<script lang="ts">
  import { onMount } from 'svelte';
  import { m } from '#lib/paraglide/messages.js';
  import type { ViewerHandle, ViewerState } from './specimen-viewer.ts';

  let { modelUrl }: { modelUrl: string } = $props();
  const id = $props.id();
  const instructionsId = `${id}-instructions`;
  let container: HTMLDivElement | undefined;
  let viewer: ViewerHandle | undefined;
  let state = $state<ViewerState>('loading');

  onMount(() => {
    let disposed = false;

    async function mountViewer() {
      try {
        const { createSpecimenViewer } = await import('./specimen-viewer.ts');
        if (disposed || !container) return;
        viewer = createSpecimenViewer(container, modelUrl, (nextState) => {
          if (!disposed) state = nextState;
        });
        const canvas = container.querySelector('canvas');
        if (canvas) {
          canvas.setAttribute('role', 'img');
          canvas.setAttribute('aria-label', m.viewerLabel());
          canvas.setAttribute('aria-describedby', instructionsId);
        }
      } catch {
        if (!disposed) state = 'unavailable';
        viewer?.dispose();
      }
    }

    void mountViewer();
    return () => {
      disposed = true;
      viewer?.dispose();
      viewer = undefined;
    };
  });
</script>

<section class="specimen-viewer" aria-label={m.viewerLabel()}>
  <div class="viewer-stage" bind:this={container} aria-busy={state === 'loading'}></div>
  <p class="viewer-status" aria-live="polite" aria-atomic="true">
    {#if state === 'loading'}
      {m.loading()}
    {:else if state === 'ready'}
      {m.ready()}
    {:else}
      {state === 'error' ? m.error() : m.webglUnavailable()}
      <button type="button" onclick={() => window.location.reload()}>{m.reload()}</button>
    {/if}
  </p>
  <div class="viewer-controls">
    <button type="button" disabled={state !== 'ready'} onclick={() => viewer?.zoom(1.2)}>{m.zoomIn()}</button>
    <button type="button" disabled={state !== 'ready'} onclick={() => viewer?.zoom(1 / 1.2)}>{m.zoomOut()}</button>
    <button type="button" disabled={state !== 'ready'} onclick={() => viewer?.reset()}>{m.reset()}</button>
    <button type="button" disabled={state !== 'ready'} onclick={() => viewer?.orbit('left')}>{m.rotateLeft()}</button>
    <button type="button" disabled={state !== 'ready'} onclick={() => viewer?.orbit('right')}>{m.rotateRight()}</button>
    <button type="button" disabled={state !== 'ready'} onclick={() => viewer?.orbit('up')}>{m.rotateUp()}</button>
    <button type="button" disabled={state !== 'ready'} onclick={() => viewer?.orbit('down')}>{m.rotateDown()}</button>
  </div>
  <p class="viewer-instructions" id={instructionsId}>{m.instructions()}</p>
</section>

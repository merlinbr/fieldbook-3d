<script lang="ts">
  import { onMount } from 'svelte';
  import { m } from '#lib/paraglide/messages.js';
  import type { SpecimenId } from '#lib/specimens/catalog.ts';
  import type { SpotlightPreviewHandle, PreviewState } from '#lib/viewer/spotlight-preview.ts';
  import Poster from './Poster.svelte';

  let { specimen, poster, alt, name, visible }: {
    specimen: SpecimenId; poster: string | null; alt: string; name: string; visible: boolean;
  } = $props();
  const id = $props.id();
  let root: HTMLDivElement;
  let stage: HTMLDivElement;
  let startButton: HTMLButtonElement;
  let viewer: SpotlightPreviewHandle | undefined;
  let previewState = $state<PreviewState | 'poster'>('poster');
  let requested = $state(false);
  let alive = false;
  let generation = 0;
  const busy = $derived(previewState === 'loading' || previewState === 'ready');

  function close(restoreFocus = false): void {
    ++generation;
    viewer?.dispose();
    viewer = undefined;
    requested = false;
    previewState = 'poster';
    if (restoreFocus) startButton?.focus({ preventScroll: true });
  }

  async function activate(): Promise<void> {
    if (!alive || !visible || document.hidden || busy) return;
    close();
    const current = ++generation;
    requested = true;
    previewState = 'loading';
    // Retry's transient button disappears; keep focus on the persistent action.
    startButton.focus({ preventScroll: true });
    const isCurrent = () => alive && current === generation && visible && !document.hidden;
    try {
      const [{ createSpotlightPreview }, entry] = await Promise.all([
        import('#lib/viewer/spotlight-preview.ts'),
        specimen === 'ankylosaurus' ? import('#lib/specimens/ankylosaurus.ts').then(({ ankylosaurus }) => ankylosaurus) :
          import('#lib/specimens/stegosaurus.ts').then(({ stegosaurus }) => stegosaurus)
      ]);
      if (!isCurrent()) return;
      const created = createSpotlightPreview(stage, entry.config.modelUrl, (next) => {
        if (!isCurrent()) return;
        if ((next === 'error' || next === 'unavailable') &&
          (stage.contains(document.activeElement) || root.querySelector('.preview-controls')?.contains(document.activeElement))) {
          startButton.focus({ preventScroll: true });
        }
        previewState = next;
      });
      if (!isCurrent()) created.dispose();
      else viewer = created;
    } catch {
      if (isCurrent()) previewState = 'error';
    }
  }


  $effect(() => { if (!visible) close(); });
  onMount(() => {
    alive = true;
    const hide = () => close(root.contains(document.activeElement));
    const visibility = () => { if (document.hidden) hide(); };
    document.addEventListener('visibilitychange', visibility);
    window.addEventListener('pagehide', hide);
    return () => {
      alive = false;
      close();
      document.removeEventListener('visibilitychange', visibility);
      window.removeEventListener('pagehide', hide);
    };
  });
</script>

<div class="spotlight-preview" bind:this={root}>
  <div class="preview-image">
    <div aria-hidden={previewState === 'ready'}><Poster src={poster} {alt} /></div>
    <div id={`${id}-stage`} class="preview-stage" class:ready={previewState === 'ready'} bind:this={stage}
      role="img" aria-label={m.previewLabel({ name })} aria-describedby={`${id}-instructions`}></div>
  </div>
  <div class="preview-actions">
    <button class="preview-start" bind:this={startButton} onclick={activate} aria-expanded={requested}
      aria-controls={`${id}-stage`} aria-disabled={busy}>{m.viewIn3D()}</button>
    {#if requested}<button class="preview-close" onclick={() => close(true)}>{m.closePreview()}</button>{/if}
  </div>
  <p class="preview-status" role="status" aria-live="polite">
    {previewState === 'loading' ? m.loading() : previewState === 'ready' ? m.ready() : previewState === 'error' ? m.previewError() : previewState === 'unavailable' ? m.previewUnavailable() : ''}
  </p>
  {#if previewState === 'error' || previewState === 'unavailable'}
    <button class="preview-retry" onclick={activate}>{m.retryPreview()}</button>
  {/if}
  <p id={`${id}-instructions`} class="preview-instructions" hidden={previewState !== 'ready'}>{m.previewInstructions()}</p>
  {#if previewState === 'ready'}
    <div class="preview-controls" role="group" aria-label={m.previewControls()}>
      <button onclick={() => viewer?.orbit('left')}>{m.rotateLeft()}</button>
      <button onclick={() => viewer?.orbit('right')}>{m.rotateRight()}</button>
      <button onclick={() => viewer?.orbit('up')}>{m.rotateUp()}</button>
      <button onclick={() => viewer?.orbit('down')}>{m.rotateDown()}</button>
      <button onclick={() => viewer?.reset()}>{m.reset()}</button>
    </div>
  {/if}
</div>

<style>
  .preview-image { position: relative; }
  .preview-stage { position: absolute; inset: 0; visibility: hidden; overflow: hidden; }
  .preview-stage.ready { visibility: visible; }
  .preview-stage :global(canvas) { display: block; width: 100%; height: 100%; cursor: grab; }
  .preview-stage :global(canvas:active) { cursor: grabbing; }
  .preview-actions, .preview-controls { display: flex; flex-wrap: wrap; gap: 0.5rem; }
  .preview-actions { margin-block: 0.5rem; }
  button { min-height: 44px; padding: 0.6rem 0.9rem; }
  .preview-start { color: var(--charcoal); background: var(--amber); }
  .preview-start[aria-disabled='true'] { opacity: 0.7; cursor: default; }
  .preview-status, .preview-instructions { color: var(--stone); font-size: 1rem; }
  .preview-status:empty { display: none; }
  .preview-instructions { margin-block: 0.75rem; }
  .preview-controls { margin-bottom: 0.75rem; }
</style>

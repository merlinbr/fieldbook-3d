<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { m } from '#lib/paraglide/messages.js';
  import type { AnatomyText } from '#lib/specimens/ankylosaurus.ts';
  import { ANATOMY_IDS } from './anatomy-input.ts';
  import type { AnatomyId } from './anatomy-input.ts';
  import type { InspectionSnapshot } from './anatomy-inspection.ts';
  import type { ViewerHandle, ViewerState } from './specimen-viewer.ts';

  let { modelUrl, anatomy }: { modelUrl: string; anatomy: AnatomyText } = $props();
  const id = $props.id();
  const instructionsId = `${id}-instructions`;
  let container: HTMLDivElement | undefined;
  let frame: HTMLDivElement | undefined;
  let section: HTMLElement | undefined;
  let note = $state<HTMLElement>();
  let observedNote: HTMLElement | undefined;
  const buttons: Partial<Record<AnatomyId, HTMLButtonElement>> = {};
  let viewer: ViewerHandle | undefined;
  let observer: ResizeObserver | undefined;
  let alive = false;
  let measureGeneration = 0;
  let viewerState = $state<ViewerState>('loading');
  let inspection = $state<InspectionSnapshot | null>(null);
  const selected = $derived(inspection?.selected ?? null);
  const announcement = $derived(selected ? `${anatomy[selected].heading}. ${anatomy[selected].body}` : '');
  let placement = $state({ x: 12, y: 12, docked: true });
  let leader = $state<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
  let placedId: AnatomyId | null = null;
  let hasPosition = false;

  function restoreFocus(region: AnatomyId | null, ready: boolean): void {
    if (!region || !note?.contains(document.activeElement)) return;
    const button = buttons[region];
    if (ready && button && !button.disabled) button.focus({ preventScroll: true });
    else section?.focus({ preventScroll: true });
  }
  function dismiss(): void {
    restoreFocus(selected, viewerState === 'ready');
    viewer?.selectAnatomy(null);
  }
  function keydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && selected) { event.preventDefault(); dismiss(); }
  }
  function measure(): void {
    if (!alive || !selected || !note || !container || !frame) { leader = null; return; }
    const stageWidth = container.clientWidth;
    const stageHeight = container.clientHeight;
    const noteWidth = note.offsetWidth;
    const noteHeight = note.offsetHeight;
    const anchor = inspection?.regions.find((p) => p.id === selected);
    if (placedId !== selected) { placedId = selected; hasPosition = false; }
    const docked = window.matchMedia('(max-width: 48rem)').matches || noteWidth + 24 > stageWidth || noteHeight + 24 > stageHeight;
    let x = placement.x;
    let y = placement.y;
    if (!docked) {
      if (anchor?.visible) {
        x = anchor.x < stageWidth / 2 ? anchor.x + 20 : anchor.x - noteWidth - 20;
        y = anchor.y - noteHeight / 2;
        hasPosition = true;
      } else if (!hasPosition) { x = 12; y = stageHeight - noteHeight - 12; }
      x = Math.max(12, Math.min(x, stageWidth - noteWidth - 12));
      y = Math.max(12, Math.min(y, stageHeight - noteHeight - 12));
    }
    if (placement.x !== x || placement.y !== y || placement.docked !== docked) placement = { x, y, docked };
    // Read the docked rectangle after the DOM adopts a changed layout.
    if (note.classList.contains('docked') !== docked) { void scheduleMeasure(); return; }
    if (!anchor?.visible) { leader = null; return; }
    const rect = note.getBoundingClientRect();
    const origin = frame.getBoundingClientRect();
    const left = docked ? rect.left - origin.left : x;
    const top = docked ? rect.top - origin.top : y;
    const x2 = Math.max(left, Math.min(anchor.x, left + rect.width));
    const y2 = Math.max(top, Math.min(anchor.y, top + rect.height));
    leader = x2 === anchor.x && y2 === anchor.y ? null : { x1: anchor.x, y1: anchor.y, x2, y2 };
  }
  async function scheduleMeasure(): Promise<void> {
    const generation = ++measureGeneration;
    await tick();
    if (!alive || generation !== measureGeneration) return;
    if (observedNote !== note) {
      if (observedNote) observer?.unobserve(observedNote);
      observedNote = note;
      if (note) observer?.observe(note);
    }
    measure();
  }
  $effect(() => {
    inspection;
    selected;
    if (alive) void scheduleMeasure();
  });

  onMount(() => {
    alive = true;
    let disposed = false;
    observer = new ResizeObserver(measure);
    if (container) observer.observe(container);
    if (frame) observer.observe(frame);
    function focusCanvas(event: PointerEvent): void {
      if (event.target instanceof HTMLCanvasElement) section?.focus({ preventScroll: true });
    }
    section?.addEventListener('keydown', keydown);
    section?.addEventListener('pointerdown', focusCanvas);
    async function mountViewer() {
      try {
        const { createSpecimenViewer } = await import('./specimen-viewer.ts');
        if (disposed || !container) return;
        viewer = createSpecimenViewer(container, modelUrl, (nextState) => {
          if (disposed) return;
          if (nextState !== 'ready') {
            restoreFocus(inspection?.selected ?? null, false);
            inspection = null;
          }
          viewerState = nextState;
        }, (snapshot) => {
          if (disposed) return;
          if (inspection?.selected && inspection.selected !== snapshot.selected) restoreFocus(inspection.selected, viewerState === 'ready');
          inspection = snapshot;
        });
        const canvas = container.querySelector('canvas');
        if (canvas) {
          canvas.setAttribute('role', 'img');
          canvas.setAttribute('aria-label', m.viewerLabel());
          canvas.setAttribute('aria-describedby', instructionsId);
        }
      } catch {
        if (!disposed) { restoreFocus(selected, false); viewerState = 'unavailable'; inspection = null; }
        viewer?.dispose();
      }
    }
    void mountViewer();
    return () => {
      disposed = true;
      alive = false;
      measureGeneration++;
      observer?.disconnect();
      section?.removeEventListener('keydown', keydown);
      section?.removeEventListener('pointerdown', focusCanvas);
      viewer?.dispose();
      viewer = undefined;
      inspection = null;
    };
  });
</script>

<section class="specimen-viewer" aria-label={m.viewerLabel()} tabindex="-1" bind:this={section}>
  <div class="inspection-frame" bind:this={frame}>
    <div class="viewer-stage" bind:this={container} aria-busy={viewerState === 'loading'}>
      {#each inspection?.regions ?? [] as region (region.id)}
        {#if region.visible}
          <span class="anatomy-marker" class:selected={selected === region.id} data-region={region.id} style:left={`${region.x}px`} style:top={`${region.y}px`} aria-hidden="true"><span></span></span>
        {/if}
      {/each}
    </div>
    {#if selected}
      {#if leader}
        <svg class="anatomy-leader" aria-hidden="true"><line x1={leader.x1} y1={leader.y1} x2={leader.x2} y2={leader.y2} /></svg>
      {/if}
      {#key selected}
        <aside class="anatomy-note" class:docked={placement.docked} style:left={placement.docked ? undefined : `${placement.x}px`} style:top={placement.docked ? undefined : `${placement.y}px`} bind:this={note} aria-labelledby={`${id}-note-heading`}>
          <h2 id={`${id}-note-heading`}>{anatomy[selected].heading}</h2>
          <p>{anatomy[selected].body}</p>
          <button type="button" onclick={dismiss}>{m.closeNote()}</button>
        </aside>
      {/key}
    {/if}
  </div>
  <span class="visually-hidden anatomy-announcement" aria-live="polite" aria-atomic="true">{announcement}</span>
  <p class="viewer-status" aria-live="polite" aria-atomic="true">
    {#if viewerState === 'loading'}
      {m.loading()}
    {:else if viewerState === 'ready'}
      {m.ready()}
      {#each inspection?.regions ?? [] as region}
        {#if !region.available}<span>{m.anatomyUnavailable({ region: anatomy[region.id].label })}</span>{/if}
      {/each}
    {:else}
      {viewerState === 'error' ? m.error() : m.webglUnavailable()}
      <button type="button" onclick={() => window.location.reload()}>{m.reload()}</button>
    {/if}
  </p>
  <div class="anatomy-controls" role="group" aria-label={m.inspectAnatomy()}>
    {#each ANATOMY_IDS as region}
      <button type="button" bind:this={buttons[region]} disabled={viewerState !== 'ready' || !inspection?.regions.find((p) => p.id === region)?.available} aria-pressed={selected === region} onclick={() => viewer?.selectAnatomy(region)}>{anatomy[region].label}</button>
    {/each}
  </div>
  <div class="viewer-controls">
    <button type="button" disabled={viewerState !== 'ready'} onclick={() => viewer?.zoom(1.2)}>{m.zoomIn()}</button>
    <button type="button" disabled={viewerState !== 'ready'} onclick={() => viewer?.zoom(1 / 1.2)}>{m.zoomOut()}</button>
    <button type="button" disabled={viewerState !== 'ready'} onclick={() => viewer?.reset()}>{m.reset()}</button>
    <button type="button" disabled={viewerState !== 'ready'} onclick={() => viewer?.orbit('left')}>{m.rotateLeft()}</button>
    <button type="button" disabled={viewerState !== 'ready'} onclick={() => viewer?.orbit('right')}>{m.rotateRight()}</button>
    <button type="button" disabled={viewerState !== 'ready'} onclick={() => viewer?.orbit('up')}>{m.rotateUp()}</button>
    <button type="button" disabled={viewerState !== 'ready'} onclick={() => viewer?.orbit('down')}>{m.rotateDown()}</button>
  </div>
  <p class="viewer-instructions" id={instructionsId}>{m.instructions()}</p>
</section>

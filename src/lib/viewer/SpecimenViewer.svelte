<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { m } from '#lib/paraglide/messages.js';
  import type { AnatomyText } from '#lib/specimens/ankylosaurus.ts';
  import { ANATOMY_IDS } from './anatomy-input.ts';
  import type { AnatomyId } from './anatomy-input.ts';
  import type { InspectionSnapshot } from './anatomy-inspection.ts';
  import type { ViewerHandle, ViewerState } from './specimen-viewer.ts';
  import { createFieldStudy } from './field-study.ts';
  import type { StudyHandle, StudySnapshot } from './field-study.ts';
  import type { StudyVersion } from './study-data.ts';

  let { modelUrl, anatomy, recording }: {
    modelUrl: string;
    anatomy: AnatomyText;
    recording: { version: StudyVersion | null; error: 'missing' | 'data' | null };
  } = $props();
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
  let study: StudyHandle | undefined;
  let studyState = $state<StudySnapshot | null>(null);
  let startButton = $state<HTMLButtonElement>();
  let playButton = $state<HTMLButtonElement>();
  let retryButton = $state<HTMLButtonElement>();
  let studyPanel = $state<HTMLDivElement>();
  let exploreControls: HTMLDivElement | undefined;
  let focusGeneration = 0;
  const studying = $derived(studyState?.active ?? false);
  const canInspect = $derived(!studying || studyState?.phase === 'paused');
  const targetsReady = $derived(['armor', 'tailClub'].every((id) => inspection?.regions.find((region) => region.id === id)?.available));
  const canStart = $derived(viewerState === 'ready' && targetsReady && !!recording.version);
  const readiness = $derived(
    viewerState !== 'ready' ? (viewerState === 'loading' ? m.loading() : viewerState === 'error' ? m.error() : m.webglUnavailable()) :
    !targetsReady ? m.studyTargets() : recording.error === 'data' ? m.studyData() :
    !recording.version ? m.studyMissing() : m.studyReady()
  );
  const studyStatus = $derived.by(() => {
    if (!studyState?.active) return '';
    if (studyState.error === 'blocked') return m.studyBlocked();
    if (studyState.error === 'media') return m.studyMediaError();
    if (studyState.error === 'data') return m.studyTimingError();
    switch (studyState.phase) {
      case 'loading': return m.studyLoading();
      case 'restoring': return m.studyRestoring();
      case 'playing': return m.studyPlaying();
      case 'buffering': return m.studyBuffering();
      case 'seeking': return m.studySeeking();
      default: return m.studyPaused();
    }
  });

  async function focusStudyControl(): Promise<void> {
    const generation = ++focusGeneration;
    await tick();
    if (alive && generation === focusGeneration && studyState?.active) {
      (studyState.phase === 'error' ? retryButton : playButton)?.focus({ preventScroll: true });
    }
  }
  function startStudy(): void {
    if (!canStart || !study) return;
    study.start();
    void focusStudyControl();
  }
  function togglePlayback(): void {
    if (studyState?.requestedPlaying) study?.pause();
    else {
      const focused = document.activeElement;
      const moveFocus = !!focused && (!!note?.contains(focused) || !!exploreControls?.contains(focused));
      study?.play();
      if (moveFocus) void focusStudyControl();
    }
  }
  function retryStudy(): void {
    const moveFocus = document.activeElement === retryButton;
    study?.retry();
    if (moveFocus) void focusStudyControl();
  }
  function receiveStudy(next: StudySnapshot): void {
    const returnFocus = !!studyState?.active && !next.active && !!studyPanel?.contains(document.activeElement);
    const focused = document.activeElement;
    const moveErrorFocus = next.phase === 'error' && !!focused &&
      (focused === playButton || !!note?.contains(focused) || !!exploreControls?.contains(focused));
    studyState = next;
    if (moveErrorFocus) void focusStudyControl();
    if (returnFocus) {
      const generation = ++focusGeneration;
      void tick().then(() => {
        if (alive && generation === focusGeneration && !studyState?.active) startButton?.focus({ preventScroll: true });
      });
    }
  }

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
    const docked = window.matchMedia('(max-width: 48rem)').matches || noteWidth + 48 > stageWidth || noteHeight + 48 > stageHeight;
    const x = Math.max(12, stageWidth - noteWidth - 24);
    const y = 24;
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
            if (studyPanel?.contains(document.activeElement)) section?.focus({ preventScroll: true });
            study?.dispose();
            studyState = null;
            focusGeneration++;
            restoreFocus(inspection?.selected ?? null, false);
            inspection = null;
          }
          viewerState = nextState;
        }, (snapshot) => {
          if (disposed) return;
          if (inspection?.selected && inspection.selected !== snapshot.selected) restoreFocus(inspection.selected, viewerState === 'ready');
          inspection = snapshot;
        });
        if (recording.version && viewerState !== 'error' && viewerState !== 'unavailable') {
          study = createFieldStudy(recording.version, viewer.study, receiveStudy);
        }
        const canvas = container.querySelector('canvas');
        if (canvas) {
          canvas.setAttribute('role', 'img');
          canvas.setAttribute('aria-label', m.viewerLabel());
          canvas.setAttribute('aria-describedby', instructionsId);
        }
      } catch {
        if (!disposed) { restoreFocus(selected, false); viewerState = 'unavailable'; inspection = null; }
        study?.dispose();
        studyState = null;
        viewer?.dispose();
      }
    }
    void mountViewer();
    return () => {
      disposed = true;
      alive = false;
      measureGeneration++;
      focusGeneration++;
      study?.dispose();
      study = undefined;
      studyState = null;
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
          <span class="anatomy-marker" class:selected={selected === region.id} class:hovered={inspection?.hovered === region.id} data-region={region.id} style:left={`${region.x}px`} style:top={`${region.y}px`} aria-hidden="true">
            <span class="anatomy-marker-dot"></span>
            {#if inspection?.hovered === region.id}<span class="anatomy-marker-label">{anatomy[region.id].label}</span>{/if}
          </span>
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
      {#if canInspect}{m.ready()}{/if}
      {#each inspection?.regions ?? [] as region}
        {#if !region.available}<span>{m.anatomyUnavailable({ region: anatomy[region.id].label })}</span>{/if}
      {/each}
    {:else}
      {viewerState === 'error' ? m.error() : m.webglUnavailable()}
      <button type="button" onclick={() => window.location.reload()}>{m.reload()}</button>
    {/if}
  </p>
  {#if studying && studyState}
    <div class="study-ui" bind:this={studyPanel}>
      <div class="study-heading">
        <h2>{m.studyTitle()}</h2>
        <p>{m.studyEnglish()}</p>
      </div>
      <p class="study-status" aria-live="polite" aria-atomic="true">{studyStatus}</p>
      {#if studyState.captionsEnabled}
        <p class="study-caption" lang="en">{studyState.caption}</p>
      {/if}
      <div class="study-controls" role="group" aria-label={m.studyControls()}>
        <button type="button" bind:this={playButton} onclick={togglePlayback} disabled={studyState.phase === 'error'}>
          {studyState.requestedPlaying ? m.studyPause() : m.studyPlay()}
        </button>
        {#if studyState.phase === 'error'}
          <button type="button" bind:this={retryButton} onclick={retryStudy}>{m.studyRetry()}</button>
        {/if}
        <button type="button" aria-pressed={studyState.captionsEnabled} onclick={() => study?.setCaptions(!studyState?.captionsEnabled)}>{m.studyCaptions()}</button>
        <button type="button" onclick={() => study?.exit()}>{m.studyExit()}</button>
      </div>
    </div>
  {:else}
    <div class="study-entry">
      <button type="button" bind:this={startButton} disabled={!canStart} aria-describedby={`${id}-study-readiness`} onclick={startStudy}>{m.startStudy()}</button>
      <p id={`${id}-study-readiness`} aria-live="polite" aria-atomic="true">{readiness}</p>
      {#if recording.version}<p>{m.studyEnglish()}</p>{/if}
    </div>
  {/if}
  <div bind:this={exploreControls}>
  <div class="anatomy-controls" role="group" aria-label={m.inspectAnatomy()}>
    {#each ANATOMY_IDS as region}
      <button type="button" bind:this={buttons[region]} disabled={!canInspect || viewerState !== 'ready' || !inspection?.regions.find((p) => p.id === region)?.available} aria-pressed={selected === region} onclick={() => viewer?.selectAnatomy(region)}>{anatomy[region].label}</button>
    {/each}
  </div>
  <div class="viewer-controls">
    <button type="button" disabled={!canInspect || viewerState !== 'ready'} onclick={() => viewer?.zoom(1.2)}>{m.zoomIn()}</button>
    <button type="button" disabled={!canInspect || viewerState !== 'ready'} onclick={() => viewer?.zoom(1 / 1.2)}>{m.zoomOut()}</button>
    <button type="button" disabled={!canInspect || viewerState !== 'ready'} onclick={() => viewer?.reset()}>{m.reset()}</button>
    <button type="button" disabled={!canInspect || viewerState !== 'ready'} onclick={() => viewer?.orbit('left')}>{m.rotateLeft()}</button>
    <button type="button" disabled={!canInspect || viewerState !== 'ready'} onclick={() => viewer?.orbit('right')}>{m.rotateRight()}</button>
    <button type="button" disabled={!canInspect || viewerState !== 'ready'} onclick={() => viewer?.orbit('up')}>{m.rotateUp()}</button>
    <button type="button" disabled={!canInspect || viewerState !== 'ready'} onclick={() => viewer?.orbit('down')}>{m.rotateDown()}</button>
  </div>
  </div>
  <p class="viewer-instructions" id={instructionsId} hidden={!canInspect}>{m.instructions()}</p>
</section>

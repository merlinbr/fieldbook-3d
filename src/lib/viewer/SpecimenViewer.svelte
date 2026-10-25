<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { m } from '#lib/paraglide/messages.js';
  import { getLocale } from '#lib/paraglide/runtime.js';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import type { AnatomyId, SpecimenViewerConfig, SpecimenViewerText, ViewerStudy } from '../specimens/specimen-config.ts';
  import { validateViewerInputs } from '../specimens/specimen-config.ts';
  import type { InspectionSnapshot } from './anatomy-inspection.ts';
  import type { ScaleProjection } from './scale-comparison.ts';
  import type { ViewerHandle, ViewerState } from './specimen-viewer.ts';
  import { createFieldStudy } from './field-study.ts';
  import type { StudyHandle, StudySnapshot } from './field-study.ts';
  import { encodeStudyHandoff, STUDY_QUERY } from './study-handoff.ts';
  import { resolveStudyContext } from './viewer-study.ts';
  import type { StudyHandoff } from './study-handoff.ts';

  let { config, text, study: studyInput }: {
    config: SpecimenViewerConfig;
    text: SpecimenViewerText;
    study: ViewerStudy;
  } = $props();
  const anatomy = $derived(text.anatomy);
  const regionIds = $derived(config.regions.map(region => region.id));
  const recording = $derived(studyInput.kind === 'guided' ? studyInput.recording : { version: null, error: null });
  const guided = $derived(config.study.kind === 'guided' && studyInput.kind === 'guided');
  const id = $props.id();
  const instructionsId = `${id}-instructions`;
  let container: HTMLDivElement | undefined;
  let frame: HTMLDivElement | undefined;
  let section: HTMLElement | undefined;
  let note = $state<HTMLElement>();
  let observedNote: HTMLElement | undefined;
  const buttons = $state<Partial<Record<AnatomyId, HTMLButtonElement>>>({});
  let viewer: ViewerHandle | undefined;
  let observer: ResizeObserver | undefined;
  let alive = false;
  let measureGeneration = 0;
  let viewerState = $state<ViewerState>('loading');
  let scaleReady = $state(false);
  let scaleProjection = $state<ScaleProjection>({
    visible: false,
    length: { visible: false, x: 0, y: 0 },
    human: { visible: false, x: 0, y: 0 }
  });
  let inspection = $state<InspectionSnapshot | null>(null);
  const selected = $derived(inspection?.selected ?? null);
  const announcement = $derived(selected ? `${anatomy[selected].heading}. ${anatomy[selected].body}` : '');
  let placement = $state({ x: 12, y: 12, docked: true });
  let leader = $state<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
  let fieldStudy: StudyHandle | undefined;
  let studyState = $state<StudySnapshot | null>(null);
  let startButton = $state<HTMLButtonElement>();
  let playButton = $state<HTMLButtonElement>();
  let retryButton = $state<HTMLButtonElement>();
  let studyPanel = $state<HTMLDivElement>();
  let transportPanel = $state<HTMLDivElement>();
  let exploreControls: HTMLDivElement | undefined;
  let focusGeneration = 0;
  let incoming = $state<StudyHandoff | null>(null);
  let handoffFailed = $state(false);
  const studying = $derived(studyState?.active ?? false);
  const standaloneScale = $derived(!studying && scaleProjection.visible);
  const scaleLength = $derived(config.scale ? new Intl.NumberFormat(getLocale()).format(config.scale.lengthMetres) : '');
  const scaleLabel = $derived(text.scaleLabel?.(scaleLength) ?? m.studyScaleSpecimen({ length: scaleLength }));
  const leaving = $derived(studyState?.phase === 'leaving');
  const cinema = $derived(studying && !!studyState?.requestedPlaying && !studyState?.error && !leaving);
  const narrationLanguage = $derived(recording.version?.language === 'de' ? m.studyGerman() : m.studyEnglish());
  const canInspect = $derived(!studying || studyState?.phase === 'paused');
  const targetsReady = $derived(viewerState === 'ready' && !!inspection && !!viewer?.studyTargetsReady);
  const canStart = $derived(guided && viewerState === 'ready' && scaleReady && targetsReady && !!recording.version);
  const readiness = $derived(
    !guided ? '' : viewerState !== 'ready' ? (viewerState === 'loading' ? m.loading() : viewerState === 'error' ? m.error() : m.webglUnavailable()) :
    !targetsReady ? m.studyTargets() : !scaleReady ? (config.scale ? m.studyCalibration({ length: scaleLength }) : m.studyScaleUnavailable()) : recording.error === 'data' ? m.studyData() :
    !recording.version ? m.studyMissing() : incoming ? m.studyHandoffLoading() : handoffFailed ? m.studyHandoffInvalid() : m.studyReady()
  );
  const studyStatus = $derived.by(() => {
    if (!studyState?.active) return '';
    if (studyState.error === 'blocked') return m.studyBlocked();
    if (studyState.error === 'media') return m.studyMediaError();
    if (studyState.error === 'data') return m.studyTimingError();
    switch (studyState.phase) {
      case 'leaving': return m.studyLeaving();
      case 'loading': return m.studyLoading();
      case 'restoring': return m.studyRestoring();
      case 'playing': return m.studyPlaying();
      case 'buffering': return m.studyBuffering();
      case 'seeking': return m.studySeeking();
      default: return m.studyPaused();
    }
  });
  const chapterStatus = $derived(
    studyState?.chapter === 'meet' ? m.studyChapterMeet() :
    studyState?.chapter === 'scale' ? m.studyChapterScale() :
    studyState?.chapter === 'armor' ? m.studyChapterArmor() :
    studyState?.chapter === 'world' ? m.studyChapterWorld() : ''
  );
  const chapters = $derived(recording.version?.chapters ?? []);
  const chapterLabels = $derived({
    meet: m.studyChapterMeet(), scale: m.studyChapterScale(),
    armor: m.studyChapterArmor(), world: m.studyChapterWorld()
  });
  function clock(time: number): string {
    const seconds = Math.max(0, Math.floor(time));
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  }

  async function focusStudyControl(): Promise<void> {
    const generation = ++focusGeneration;
    await tick();
    if (alive && generation === focusGeneration && studyState?.active) {
      (studyState.phase === 'error' ? retryButton : playButton)?.focus({ preventScroll: true });
    }
  }
  function startStudy(): void {
    if (!canStart || !fieldStudy) return;
    incoming = null;
    handoffFailed = false;
    fieldStudy.start();
    void focusStudyControl();
  }

  export function prepareLanguageLink(link: HTMLAnchorElement): void {
    const destination = new URL(link.href);
    destination.searchParams.delete(STUDY_QUERY);
    if (guided && config.id === 'ankylosaurus' && studyState?.active && recording.version) {
      const view = viewer?.savedExploration();
      const position = fieldStudy?.transfer();
      if (view && position) destination.searchParams.set(STUDY_QUERY, encodeStudyHandoff({
        specimen: 'ankylosaurus', version: recording.version.id, ...position, view
      }));
    }
    link.href = destination.href;
  }

  $effect(() => {
    if (!incoming) return;
    if (viewerState === 'error' || viewerState === 'unavailable') {
      incoming = null;
      handoffFailed = true;
      return;
    }
    if (!canStart || !viewer || !fieldStudy) return;
    const context = incoming;
    incoming = null;
    if (viewer.restoreExploration(context.view) && fieldStudy.restore(context)) void focusStudyControl();
    else handoffFailed = true;
  });
  function togglePlayback(): void {
    if (studyState?.requestedPlaying) fieldStudy?.pause();
    else {
      const focused = document.activeElement;
      const moveFocus = !!focused && (!!note?.contains(focused) || !!exploreControls?.contains(focused));
      fieldStudy?.play();
      if (moveFocus) void focusStudyControl();
    }
  }
  function retryStudy(): void {
    const moveFocus = document.activeElement === retryButton;
    fieldStudy?.retry();
    if (moveFocus) void focusStudyControl();
  }
  function receiveStudy(next: StudySnapshot): void {
    const returnFocus = !!studyState?.active && !next.active &&
      (!!studyPanel?.contains(document.activeElement) || !!transportPanel?.contains(document.activeElement));
    const focused = document.activeElement;
    const moveErrorFocus = next.phase === 'error' && !!focused &&
      (!!transportPanel?.contains(focused) || !!note?.contains(focused) || !!exploreControls?.contains(focused));
    studyState = next;
    viewer?.setCinema(cinema);
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
    const url = new URL(window.location.href);
    const contexts = url.searchParams.getAll(STUDY_QUERY);
    if (contexts.length) {
      ({ incoming, handoffFailed } = resolveStudyContext(config, studyInput, contexts));
      url.searchParams.delete(STUDY_QUERY);
      void goto(url, { state: page.state, shallow: true, replace: true });
    }
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
      try { validateViewerInputs(config, text, studyInput); }
      catch { viewerState = 'error'; return; }
      try {
        const { createSpecimenViewer } = await import('./specimen-viewer.ts');
        if (disposed || !container) return;
        viewer = createSpecimenViewer(container, config, (nextState) => {
          if (disposed) return;
          if (nextState !== 'ready') {
            if (studyPanel?.contains(document.activeElement) || transportPanel?.contains(document.activeElement)) section?.focus({ preventScroll: true });
            fieldStudy?.dispose();
            studyState = null;
            focusGeneration++;
            restoreFocus(inspection?.selected ?? null, false);
            inspection = null;
          }
          viewerState = nextState;
          scaleReady = nextState === 'ready' && !!viewer?.calibrationReady;
        }, (snapshot) => {
          if (disposed) return;
          if (inspection?.selected && inspection.selected !== snapshot.selected) restoreFocus(inspection.selected, viewerState === 'ready');
          inspection = snapshot;
        }, (snapshot) => {
          if (disposed) return;
          scaleProjection = snapshot;
          if (viewerState === 'ready') scaleReady = !!viewer?.calibrationReady;
        });
        if (guided && recording.version && viewerState !== 'error' && viewerState !== 'unavailable') {
          fieldStudy = createFieldStudy(recording.version, viewer.study, receiveStudy);
        }
        const canvas = container.querySelector('canvas');
        if (canvas) {
          canvas.setAttribute('role', 'img');
          canvas.setAttribute('aria-label', text.viewerLabel);
          canvas.setAttribute('aria-describedby', instructionsId);
        }
      } catch {
        if (!disposed) { restoreFocus(selected, false); viewerState = 'unavailable'; inspection = null; }
        fieldStudy?.dispose();
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
      fieldStudy?.dispose();
      fieldStudy = undefined;
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

<section class="specimen-viewer" class:cinema aria-label={text.viewerLabel} tabindex="-1" bind:this={section}>
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
      {#if scaleProjection.visible}
        <svg class="scale-leaders" aria-hidden="true">
          {#if scaleProjection.length.visible}
            <line x1={scaleProjection.length.x} y1={scaleProjection.length.y} x2={scaleProjection.length.x + 16} y2={scaleProjection.length.y - 16} />
          {/if}
          {#if scaleProjection.human.visible}
            <line x1={scaleProjection.human.x} y1={scaleProjection.human.y} x2={scaleProjection.human.x + 16} y2={scaleProjection.human.y - 16} />
          {/if}
        </svg>
        {#if scaleProjection.length.visible}
          <span class="scale-marker" style:left={`${scaleProjection.length.x + 16}px`} style:top={`${scaleProjection.length.y - 16}px`} aria-hidden="true">1</span>
        {/if}
        {#if scaleProjection.human.visible}
          <span class="scale-marker" style:left={`${scaleProjection.human.x + 16}px`} style:top={`${scaleProjection.human.y - 16}px`} aria-hidden="true">2</span>
        {/if}
      {/if}
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
  {#if studying && studyState}
    <div class="study-transport" bind:this={transportPanel}>
      <div class="study-playback" role="group" aria-label={m.studyControls()}>
        <button type="button" disabled={!!studyState.error || leaving} onclick={() => fieldStudy?.skip(-5)}>{m.studyBackFive()}</button>
        <button type="button" class="study-play" bind:this={playButton} onclick={togglePlayback} disabled={studyState.phase === 'error' || leaving}>
          {studyState.requestedPlaying ? m.studyPause() : m.studyPlay()}
        </button>
        <button type="button" disabled={!!studyState.error || leaving} onclick={() => fieldStudy?.skip(5)}>{m.studyForwardFive()}</button>
      </div>
      <div class="study-controls">
        {#if studyState.phase === 'error'}
          <button type="button" bind:this={retryButton} onclick={retryStudy}>{m.studyRetry()}</button>
        {/if}
        <button type="button" disabled={leaving} aria-pressed={studyState.captionsEnabled} onclick={() => fieldStudy?.setCaptions(!studyState?.captionsEnabled)}>{m.studyCaptions()}</button>
        <button type="button" onclick={() => fieldStudy?.exit()}>{m.studyExit()}</button>
      </div>
    </div>
  {/if}
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
        <p>{narrationLanguage}</p>
      </div>
      <p class="study-status" aria-live="polite" aria-atomic="true">{studyStatus}{chapterStatus ? ` — ${chapterStatus}` : ''}</p>
      {#if studyState.chapter === 'scale'}
        <div class="scale-legend" role="group" aria-label={m.studyScaleLegend()}>
          <p><span aria-hidden="true">1</span>{scaleLabel}</p>
          <p><span aria-hidden="true">2</span>{m.studyScaleHuman()}</p>
        </div>
      {/if}
      {#if studyState.chapter === 'world'}
        <div class="world-context" role="group" aria-label={m.studyChapterWorld()}>
          <p>{m.studyWorldLocation()}</p>
          <div class="world-time">
            <p>{m.studyWorldPeriod()}</p>
            <div class="world-time-band" aria-hidden="true"><span>68</span><span>66</span></div>
            <p>{m.studyWorldAge()}</p>
          </div>
        </div>
      {/if}
      {#if studyState.captionsEnabled}
        <p class="study-caption" lang={recording.version?.language}>{studyState.caption}</p>
      {/if}
      <div class="study-timeline">
        <label for={`${id}-study-seek`}>{m.studySeek()}</label>
        <span class="study-time">{clock(studyState.time)} / {clock(studyState.duration)}</span>
        <input id={`${id}-study-seek`} type="range" min="0" max={studyState.duration} step="any"
          value={studyState.time} aria-valuetext={m.studySeekValue({ time: clock(studyState.time), duration: clock(studyState.duration) })}
          disabled={!!studyState.error || leaving} oninput={(event) => fieldStudy?.seek(event.currentTarget.valueAsNumber)} />
      </div>
      <div class="study-chapters" role="group" aria-label={m.studyChapters()}>
        {#each chapters as chapter}
          <button type="button" aria-current={studyState.chapter === chapter.id ? 'step' : undefined}
            disabled={!!studyState.error || leaving} onclick={() => fieldStudy?.seek(chapter.start)}>{chapterLabels[chapter.id]}</button>
        {/each}
      </div>
    </div>
  {:else if guided}
    <div class="study-entry">
      <button type="button" bind:this={startButton} disabled={!canStart} aria-describedby={`${id}-study-readiness`} onclick={startStudy}>{m.startStudy()}</button>
      <p id={`${id}-study-readiness`} aria-live="polite" aria-atomic="true">{readiness}</p>
      {#if recording.version}<p>{narrationLanguage}</p>{/if}
    </div>
  {/if}
  {#if standaloneScale}
    <div class="scale-legend" role="group" aria-label={m.studyScaleLegend()}>
      <p><span aria-hidden="true">1</span>{scaleLabel}</p>
      <p><span aria-hidden="true">2</span>{m.studyScaleHuman()}</p>
    </div>
  {/if}
  <div bind:this={exploreControls}>
  <div class="anatomy-controls" role="group" aria-label={m.inspectAnatomy()}>
    {#each regionIds as region}
      <button type="button" bind:this={buttons[region]} disabled={!canInspect || viewerState !== 'ready' || !inspection?.regions.find((p) => p.id === region)?.available} aria-pressed={selected === region} onclick={() => viewer?.selectAnatomy(region)}>{anatomy[region].label}</button>
    {/each}
  </div>
  <div class="viewer-controls">
    {#if config.scale}
      <button type="button" disabled={studying || viewerState !== 'ready' || !scaleReady} aria-pressed={standaloneScale} onclick={() => viewer?.setScaleVisible(!standaloneScale)}>{m.studyScaleLegend()}</button>
    {/if}
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

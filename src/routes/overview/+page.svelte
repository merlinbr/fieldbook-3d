<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { pushState, replaceState } from '$app/navigation';
  import { PUBLIC_ANKYLOSAURUS_POSTER_URL, PUBLIC_STEGOSAURUS_POSTER_URL } from '$app/env/public';
  import { m } from '#lib/paraglide/messages.js';
  import { getLocale, localizeHref } from '#lib/paraglide/runtime.js';
  import { getSpecimen, specimens, type SpecimenId } from '#lib/specimens/catalog.ts';
  import { resolvePosterUrl } from '#lib/specimens/poster-url.ts';
  import { exhibitOverviewHash, overviewHash, readOverviewState, type OverviewState } from '#lib/specimens/overview-state.ts';
  import Poster from '#lib/overview/Poster.svelte';
  import SpotlightPreview from '#lib/overview/SpotlightPreview.svelte';

  const locale = getLocale();
  const development = import.meta.env.MODE === 'development';
  const posters = {
    ankylosaurus: resolvePosterUrl(PUBLIC_ANKYLOSAURUS_POSTER_URL, { development, environmentVariable: 'PUBLIC_ANKYLOSAURUS_POSTER_URL', developmentUrl: 'http://127.0.0.1:5194/ankylosaurus-poster.png' }),
    stegosaurus: resolvePosterUrl(PUBLIC_STEGOSAURUS_POSTER_URL, { development, environmentVariable: 'PUBLIC_STEGOSAURUS_POSTER_URL', developmentUrl: 'http://127.0.0.1:5194/stegosaurus-poster.png' })
  };
  let selection = $state<OverviewState>({ specimen: 'ankylosaurus', view: 'results', index: 0 });
  let enhanced = $state(false);
  let narrow = $state(false);
  let heading: HTMLHeadingElement;
  const selected = $derived(getSpecimen(selection.specimen));
  const text = $derived(selected.text[locale]);
  const period = (value: string) => value === 'late-cretaceous' ? m.lateCretaceous() : m.lateJurassic();
  const ordinaryClick = (event: MouseEvent) => !event.defaultPrevented && event.button === 0 && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey;

  async function restoreFocus(): Promise<void> {
    await tick();
    if (!matchMedia('(max-width: 760px)').matches) return;
    if (selection.view === 'spotlight') {
      heading?.focus({ preventScroll: true });
      window.scrollTo(0, 0);
    } else {
      document.getElementById(`row-${selection.specimen}`)?.focus({ preventScroll: true });
      window.scrollTo(0, selection.index);
    }
  }

  function select(event: MouseEvent, specimen: SpecimenId): void {
    if (!ordinaryClick(event)) return;
    event.preventDefault();
    // Store the results position on the current history entry before opening a preview.
    selection = { ...selection, specimen: selection.view === 'results' ? specimen : selection.specimen, index: window.scrollY };
    replaceState(overviewHash(selection), {});
    selection = { ...selection, specimen, view: 'spotlight' };
    pushState(overviewHash(selection), {});
    void restoreFocus();
  }

  function back(): void {
    selection = { ...selection, view: 'results' };
    pushState(overviewHash(selection), {});
    void restoreFocus();
  }

  function preservePosition(event: MouseEvent): void {
    if (selection.view === 'results') selection = { ...selection, index: window.scrollY };
    (event.currentTarget as HTMLAnchorElement).hash = overviewHash(selection);
  }

  onMount(() => {
    selection = readOverviewState(location.hash);
    enhanced = true;
    const breakpoint = matchMedia('(max-width: 760px)');
    const resize = () => {
      narrow = breakpoint.matches;
      if (narrow && selection.view === 'results' && document.getElementById('spotlight')?.contains(document.activeElement)) {
        void restoreFocus();
      }
    };
    resize();
    breakpoint.addEventListener('change', resize);
    const restore = () => { selection = readOverviewState(location.hash); void restoreFocus(); };
    window.addEventListener('popstate', restore);
    window.addEventListener('hashchange', restore);
    if (selection.view === 'results' && selection.index) void restoreFocus();
    return () => {
      breakpoint.removeEventListener('change', resize);
      window.removeEventListener('popstate', restore);
      window.removeEventListener('hashchange', restore);
    };
  });
</script>

<svelte:head>
  <title>{m.overviewTitle()} | Fieldbook 3D</title>
  <meta name="description" content={m.overviewDescription()} />
</svelte:head>

<div class="fieldbook overview-shell">
  <header class="site-header">
    <a class="brand" href={localizeHref('/overview/') + (enhanced ? overviewHash(selection) : '')} onclick={preservePosition} data-sveltekit-reload>Fieldbook 3D</a>
    <nav class="language-nav" aria-label={m.languages()}>
      {#each ['en', 'de'] as language}
        <a href={localizeHref('/overview/', { locale: language as 'en' | 'de' }) + (enhanced ? overviewHash(selection) : '')} onclick={preservePosition} lang={language} hreflang={language} aria-current={locale === language ? 'page' : undefined} data-sveltekit-reload>{language === 'en' ? 'English' : 'Deutsch'}</a>
      {/each}
    </nav>
  </header>

  <main class="overview" class:enhanced class:show-spotlight={selection.view === 'spotlight'}>
    <section class="field-guide" aria-labelledby="guide-title">
      <div class="guide-intro">
        <p class="eyebrow">{m.overview()}</p>
        <h1 id="guide-title">{m.fieldGuide()}</h1>
        <p class="guide-deck">{m.collectionIntro()}</p>
      </div>
      <div class="collection-heading">
        <p>{m.collectionCount()}</p>
        <p>{m.chooseSpecimen()}</p>
      </div>
      <ul class="specimen-index" aria-label={m.specimens()}>
        {#each specimens as specimen}
          <li>
            <a id={`row-${specimen.id}`} class="specimen-row" href={localizeHref(specimen.exhibitPath)} aria-current={selected.id === specimen.id ? 'true' : undefined} aria-controls={enhanced ? 'spotlight' : undefined} onclick={(event) => select(event, specimen.id)} data-sveltekit-reload>
              <Poster src={posters[specimen.id]} alt="" compact />
              <span class="row-copy">
                <strong>{specimen.text[locale].name}</strong>
                <i>{specimen.scientificName}</i>
                <span class="row-facts">{m.herbivore()} · {period(specimen.period)}</span>
                {#if selected.id === specimen.id}<span class="selection-label">{m.selectedSpecimen()}</span>{/if}
              </span>
              <span class="row-arrow" aria-hidden="true">↗</span>
            </a>
          </li>
        {/each}
      </ul>
    </section>

    <section id="spotlight" class="spotlight" aria-labelledby="spotlight-name">
      <button class="back-results" onclick={back}>← {m.backToResults()}</button>
      <p class="eyebrow">{m.spotlight()}</p>
      <div class="spotlight-title">
        <h2 id="spotlight-name" tabindex="-1" bind:this={heading}>{text.name}</h2>
        <p class="scientific-name"><i>{selected.scientificName}</i></p>
      </div>
      <figure>
        {#if enhanced}
          {#key selected.id}
            <SpotlightPreview specimen={selected.id} poster={posters[selected.id]} alt={text.posterAlt} name={text.name} visible={!narrow || selection.view === 'spotlight'} />
          {/key}
        {:else}
          <Poster src={posters[selected.id]} alt={text.posterAlt} />
        {/if}
        <figcaption>{m.posterCaption()}</figcaption>
      </figure>
      <div class="spotlight-details">
        <p class="specimen-description">{text.description}</p>
        <dl class="specimen-facts">
          <div><dt>{m.diet()}</dt><dd>{m.herbivore()}</dd></div>
          <div><dt>{m.geologicalPeriod()}</dt><dd>{period(selected.period)}<span>{text.age}</span></dd></div>
        </dl>
        <p class="reconstruction-note">{text.reconstruction}</p>
        <a class="source-link" href={selected.source}>{m.specimenSource()} ↗</a>
        <div class="explore-block">
          <p class="capability">{selected.studyCapability === 'guided' ? m.guidedCapability() : m.explorationCapability()}</p>
          <a class="explore-link" href={localizeHref(selected.exhibitPath) + (enhanced ? exhibitOverviewHash(selection) : '')} data-sveltekit-reload>{m.exploreSpecimen()} <span aria-hidden="true">→</span></a>
        </div>
      </div>
    </section>
  </main>
  <footer class="overview-footer">{m.overviewFooter()}</footer>
</div>

<style>
  .brand { display: inline-flex; align-items: center; min-height: 44px; text-decoration: none; }
  .overview { display: grid; grid-template-columns: minmax(0, 36fr) minmax(0, 64fr); margin-top: 1.5rem; border: 1px solid #51564a; overflow-wrap: anywhere; }
  .field-guide { min-width: 0; color: var(--charcoal); background: var(--bone); padding: clamp(1rem, 2.4vw, 2.5rem); }
  .eyebrow { font-size: 0.875rem; font-weight: 600; letter-spacing: 0.13em; text-transform: uppercase; }
  .guide-intro h1 { margin-block: 0.75rem; font-size: clamp(2.5rem, 4vw, 4rem); }
  .guide-deck { max-width: 24rem; font-size: 1.125rem; color: var(--olive); }
  .collection-heading { margin-top: 2.5rem; padding-bottom: 1rem; border-bottom: 1px solid #b7b6a2; }
  .collection-heading p:first-child { font-weight: 600; }
  .collection-heading p + p { margin-top: 0.3rem; }
  .specimen-index { list-style: none; padding: 0; margin: 0 -0.75rem; }
  .specimen-index li { border-bottom: 1px solid #b7b6a2; }
  .specimen-row { display: flex; align-items: center; gap: 0.75rem; min-height: 8.5rem; padding: 1rem 0.75rem; color: var(--charcoal); text-decoration: none; border-left: 3px solid transparent; }
  .specimen-row[aria-current] { background: #dfb56d26; border-left-color: var(--olive); }
  .specimen-row:hover { background: #39433212; }
  .specimen-row:focus-visible { outline-color: var(--olive); outline-offset: -3px; }
  .row-copy { display: grid; gap: 0.2rem; min-width: 0; overflow-wrap: anywhere; }
  .row-copy strong { font-size: 1.125rem; }
  .row-copy i { font-family: 'Newsreader', Georgia, serif; font-size: 1.125rem; }
  .row-facts { color: var(--olive); }
  .selection-label { font-size: 0.875rem; font-weight: 600; }
  .row-arrow { margin-left: auto; }
  .spotlight { min-width: 0; padding: clamp(1rem, 3vw, 3rem); }
  .spotlight > .eyebrow { color: var(--amber); }
  .spotlight-title { margin-top: 1rem; }
  h2 { margin: 0; font-family: 'Newsreader', Georgia, serif; font-weight: 400; font-size: clamp(2.5rem, 4.5vw, 4.75rem); line-height: 1.1; overflow-wrap: anywhere; }
  figure { margin: 1rem 0 1.5rem; }
  figcaption { color: var(--stone); font-size: 0.875rem; }
  .specimen-description { font-size: 1.25rem; max-width: 36rem; }
  .specimen-facts { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 2fr); gap: 1rem; margin-block: 1.5rem; padding-block: 1rem; border-block: 1px solid #51564a; }
  dt { color: var(--stone); font-size: 0.875rem; }
  dd { margin: 0.35rem 0 0; font-size: 1.125rem; }
  dd span { display: block; font-size: 1rem; color: var(--stone); }
  .source-link { display: inline-flex; align-items: center; min-height: 44px; font-size: 0.875rem; color: var(--stone); }
  .explore-block { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 1rem; margin-top: 1.5rem; }
  .capability { color: var(--amber); max-width: 20rem; }
  .explore-link { display: inline-flex; align-items: center; justify-content: space-between; gap: 2rem; min-height: 48px; padding: 0.75rem 1.25rem; background: var(--amber); color: var(--charcoal); text-decoration: none; font-weight: 600; }
  .back-results { display: none; }
  .overview-footer { color: var(--stone); padding-block: 1.5rem; font-size: 0.875rem; }
  @media (max-width: 1100px) { .specimen-row { flex-wrap: wrap; } .row-copy { flex: 1 1 10rem; } .row-arrow { display: none; } }
  @media (max-width: 760px) {
    .overview { display: block; margin-top: 1rem; }
    .field-guide, .spotlight { padding: 1.25rem; }
    .enhanced:not(.show-spotlight) .spotlight, .enhanced.show-spotlight .field-guide { display: none; }
    .enhanced .back-results { display: inline-flex; align-items: center; gap: 0.5rem; margin-bottom: 1.5rem; background: transparent; }
    .specimen-facts { grid-template-columns: minmax(0, 1fr); }
    .collection-heading { margin-top: 2rem; }
    .specimen-row { flex-wrap: nowrap; }
    .row-copy { flex-basis: auto; }
    .explore-block, .explore-link { width: 100%; }
    .explore-link { gap: 0.5rem; padding-inline: 0.75rem; overflow-wrap: anywhere; }
  }
</style>

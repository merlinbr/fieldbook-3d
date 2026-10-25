<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { pushState, replaceState } from '$app/navigation';
  import { PUBLIC_ANKYLOSAURUS_POSTER_URL, PUBLIC_STEGOSAURUS_POSTER_URL } from '$app/env/public';
  import { m } from '#lib/paraglide/messages.js';
  import { getLocale, localizeHref } from '#lib/paraglide/runtime.js';
  import { specimens, type Specimen, type DietId, type PeriodId } from '#lib/specimens/catalog.ts';
  import { defaultOverviewState, discoverSpecimens, type OverviewState } from '#lib/specimens/catalog-query.ts';
  import { resolvePosterUrl } from '#lib/specimens/poster-url.ts';
  import { exhibitOverviewHash, overviewHash, readOverviewState } from '#lib/specimens/overview-state.ts';
  import Poster from '#lib/overview/Poster.svelte';
  import SpotlightPreview from '#lib/overview/SpotlightPreview.svelte';

  const locale = getLocale();
  let { entries = specimens }: { entries?: readonly Specimen[] } = $props();
  const development = import.meta.env.MODE === 'development';
  const posters = {
    'ankylosaurus-poster.png': resolvePosterUrl(PUBLIC_ANKYLOSAURUS_POSTER_URL, { development, environmentVariable: 'PUBLIC_ANKYLOSAURUS_POSTER_URL', developmentUrl: 'http://127.0.0.1:5194/ankylosaurus-poster.png' }),
    'stegosaurus-poster.png': resolvePosterUrl(PUBLIC_STEGOSAURUS_POSTER_URL, { development, environmentVariable: 'PUBLIC_STEGOSAURUS_POSTER_URL', developmentUrl: 'http://127.0.0.1:5194/stegosaurus-poster.png' })
  };
  let selection = $state<OverviewState>(defaultOverviewState);
  let searchDraft = $state('');
  let enhanced = $state(false);
  let narrow = $state(false);
  let filtersOpen = $state(false);
  let heading: HTMLHeadingElement;
  const results = $derived(discoverSpecimens(entries, selection, locale));
  const selected = $derived(results.selected);
  const text = $derived(selected?.text[locale]);
  const previewId = $derived(specimens.find(entry => entry.id === selected?.id)?.id);
  const poster = (entry: Specimen) => entry.poster ? posters[entry.poster] : null;
  const dietLabel = (value: DietId | null) => value === 'herbivore' ? m.dietPlants() : value === 'carnivore' ? m.dietMeat() : value === 'omnivore' ? m.dietMixed() : m.metadataUnspecified();
  const periodLabel = (value: PeriodId) => value === 'triassic' ? m.triassic() : value === 'jurassic' ? m.jurassic() : m.cretaceous();
  const period = (entry: Specimen) => entry.period === 'late-cretaceous' ? m.lateCretaceous() : entry.period === 'late-jurassic' ? m.lateJurassic() : entry.periods.map(periodLabel).join(' / ') || m.metadataUnspecified();

  // Also normalize if an injected catalog shrinks while the page is mounted.
  $effect(() => {
    if (enhanced && overviewHash(selection) !== overviewHash(results.state)) {
      selection = results.state;
      replaceState(overviewHash(selection), {});
    }
  });
  const ordinaryClick = (event: MouseEvent) => !event.defaultPrevented && event.button === 0 && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey;

  async function restoreFocus(): Promise<void> {
    await tick();
    if (!matchMedia('(max-width: 760px)').matches) return;
    if (selection.view === 'spotlight') {
      heading?.focus({ preventScroll: true });
      window.scrollTo(0, 0);
    } else {
      (document.getElementById(`row-${selection.specimen}`) ?? document.getElementById('guide-title'))?.focus({ preventScroll: true });
      window.scrollTo(0, selection.index);
    }
  }

  function select(event: MouseEvent, specimen: string): void {
    if (!ordinaryClick(event)) return;
    event.preventDefault();
    // Store the results position on the current history entry before opening a preview.
    selection = { ...results.state, specimen, index: narrow && selection.view === 'spotlight' ? selection.index : window.scrollY };
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

  function preservePosition(event: MouseEvent, exhibit = false): void {
    if (!narrow || selection.view === 'results') selection = { ...results.state, index: window.scrollY };
    replaceState(overviewHash(selection), {});
    (event.currentTarget as HTMLAnchorElement).hash = exhibit ? exhibitOverviewHash(selection) : overviewHash(selection);
  }

  function update(changes: Partial<OverviewState>, replace = false): void {
    // Keep the prior history entry's scroll position before changing its result set.
    if (!narrow || selection.view === 'results') {
      selection = { ...results.state, index: window.scrollY };
      replaceState(overviewHash(selection), {});
    }
    selection = discoverSpecimens(entries, { ...selection, ...changes, page: changes.page ?? 1, index: 0 }, locale).state;
    if (replace) replaceState(overviewHash(selection), {});
    else pushState(overviewHash(selection), {});
  }

  function toggleFilters(): void {
    if (filtersOpen && document.getElementById('discovery-panel')?.contains(document.activeElement)) {
      document.getElementById('discovery-filters')?.focus();
    }
    filtersOpen = !filtersOpen;
  }

  async function clearConstraint(key: 'query' | 'diet' | 'period'): Promise<void> {
    if (key === 'query') searchDraft = '';
    update({ [key]: key === 'query' ? '' : null });
    await tick();
    const target = key === 'query' ? 'discovery-query' : !filtersOpen ? 'discovery-filters' : key === 'diet' ? 'discovery-diet-all' : 'discovery-period';
    document.getElementById(target)?.focus();
  }

  async function clearAll(): Promise<void> {
    searchDraft = '';
    update({ query: '', diet: null, period: null, view: 'results' });
    await tick();
    document.getElementById('discovery-query')?.focus();
  }

  async function changePage(page: number): Promise<void> {
    update({ page });
    await tick();
    document.getElementById(`row-${results.pageEntries[0]?.id}`)?.focus();
  }

  onMount(() => {
    selection = readOverviewState(location.hash, entries, locale);
    searchDraft = selection.query;
    enhanced = true;
    replaceState(overviewHash(selection), {});
    const breakpoint = matchMedia('(max-width: 760px)');
    const resize = () => {
      narrow = breakpoint.matches;
      if (narrow && selection.view === 'results' && document.getElementById('spotlight')?.contains(document.activeElement)) {
        void restoreFocus();
      }
    };
    resize();
    breakpoint.addEventListener('change', resize);
    const restore = () => {
      selection = readOverviewState(location.hash, entries, locale);
      searchDraft = selection.query;
      replaceState(overviewHash(selection), {});
      void restoreFocus();
    };
    window.addEventListener('popstate', restore);
    window.addEventListener('hashchange', restore);
    if (selection.view === 'spotlight' || selection.index) void restoreFocus();
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
    <a class="brand" href={localizeHref('/overview/') + (enhanced ? overviewHash(selection) : '')} onclick={(event) => preservePosition(event)} data-sveltekit-reload>Fieldbook 3D</a>
    <nav class="language-nav" aria-label={m.languages()}>
      {#each ['en', 'de'] as language}
        <a href={localizeHref('/overview/', { locale: language as 'en' | 'de' }) + (enhanced ? overviewHash(selection) : '')} onclick={(event) => preservePosition(event)} lang={language} hreflang={language} aria-current={locale === language ? 'page' : undefined} data-sveltekit-reload>{language === 'en' ? 'English' : 'Deutsch'}</a>
      {/each}
    </nav>
  </header>

  <main class="overview" class:enhanced class:show-spotlight={selection.view === 'spotlight'}>
    <section class="field-guide" aria-labelledby="guide-title">
      <div class="guide-intro">
        <p class="eyebrow">{m.overview()}</p>
        <h1 id="guide-title" tabindex="-1">{m.fieldGuide()}</h1>
        <p class="guide-deck">{m.collectionIntro()}</p>
      </div>
      {#if enhanced}
        <form class="discovery-controls" role="search" onsubmit={(event) => event.preventDefault()}>
          <div class="search-row">
            <div class="name-search">
              <label for="discovery-query">{m.searchNames()}</label>
              <input id="discovery-query" type="search" value={searchDraft} oninput={(event) => { searchDraft = event.currentTarget.value; update({ query: searchDraft }, true); }} />
            </div>
            <button id="discovery-filters" type="button" aria-expanded={filtersOpen} aria-controls="discovery-panel" onclick={toggleFilters}>
              <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 7h16M7 12h10M10 17h4" /></svg>
              {m.filters()}
              <span aria-hidden="true">{filtersOpen ? '−' : '+'}</span>
            </button>
          </div>
          <div id="discovery-panel" hidden={!filtersOpen}>
            <fieldset id="discovery-diet">
              <legend>{m.diet()}</legend>
              <div class="diet-options">
                <button id="discovery-diet-all" type="button" data-diet="" aria-pressed={selection.diet === null} onclick={() => update({ diet: null })}>{m.allDiets()}</button>
                {#each ['herbivore', 'carnivore', 'omnivore'] as diet}
                  <button type="button" data-diet={diet} aria-pressed={selection.diet === diet} onclick={() => update({ diet: diet as DietId })}>{dietLabel(diet as DietId)}</button>
                {/each}
              </div>
            </fieldset>
            <div class="period-filter">
              <label for="discovery-period">{m.whenTheyLived()}</label>
              <select id="discovery-period" value={selection.period ?? ''} onchange={(event) => update({ period: event.currentTarget.value as PeriodId || null })}>
                <option value="">{m.allPeriods()}</option>
                <option value="triassic">{m.triassic()}</option>
                <option value="jurassic">{m.jurassic()}</option>
                <option value="cretaceous">{m.cretaceous()}</option>
              </select>
            </div>
          </div>
        </form>
        {#if selection.query || selection.diet || selection.period}
          <div class="active-constraints" role="group" aria-label={m.activeConstraints()}>
            {#if selection.query}<button onclick={() => clearConstraint('query')} aria-label={m.removeConstraint({ constraint: `${m.searchNames()}: ${selection.query}` })}>{m.searchNames()}: {selection.query} ×</button>{/if}
            {#if selection.diet}<button onclick={() => clearConstraint('diet')} aria-label={m.removeConstraint({ constraint: `${m.diet()}: ${dietLabel(selection.diet)}` })}>{dietLabel(selection.diet)} ×</button>{/if}
            {#if selection.period}<button onclick={() => clearConstraint('period')} aria-label={m.removeConstraint({ constraint: `${m.whenTheyLived()}: ${periodLabel(selection.period)}` })}>{periodLabel(selection.period)} ×</button>{/if}
            <button class="clear-all" onclick={clearAll}>{m.clearAll()}</button>
          </div>
        {/if}
      {/if}
      <div class="collection-heading">
        <p id="result-count" role="status" aria-live="polite" aria-atomic="true">{m.discoveryCount({ count: enhanced ? results.count : entries.length, total: entries.length })}{#if enhanced && results.pages > 1} · {m.pageOf({ page: selection.page, pages: results.pages })}{/if}</p>
        <p>{m.chooseSpecimen()}</p>
      </div>
      <ul class="specimen-index" aria-label={m.specimens()}>
        {#each (enhanced ? results.pageEntries : entries) as specimen (specimen.id)}
          <li>
            <a id={`row-${specimen.id}`} class="specimen-row" href={specimen.exhibitPath ? localizeHref(specimen.exhibitPath) + (enhanced ? exhibitOverviewHash({ ...selection, specimen: specimen.id, view: 'spotlight' }) : '') : overviewHash({ ...selection, specimen: specimen.id, view: 'spotlight' })} aria-current={selected?.id === specimen.id ? 'true' : undefined} aria-controls={enhanced ? 'spotlight' : undefined} onclick={(event) => select(event, specimen.id)} data-sveltekit-reload>
              {#if specimen.poster}<Poster src={poster(specimen)} alt="" compact />{/if}
              <span class="row-copy">
                <strong>{specimen.text[locale].name}</strong>
                <i>{specimen.scientificName}</i>
                <span class="row-facts">{dietLabel(specimen.diet)} · {period(specimen)}</span>
                {#if selected?.id === specimen.id}<span class="selection-label">{m.selectedSpecimen()}</span>{/if}
              </span>
              <span class="row-arrow" aria-hidden="true">↗</span>
            </a>
          </li>
        {/each}
      </ul>
      {#if enhanced && !results.count}
        <div class="empty-results">
          <p>{m.noMatches()}</p>
          <p>{m.tryDiscoveryAgain()}</p>
          <button onclick={clearAll}>{m.clearAll()}</button>
        </div>
      {/if}
      {#if enhanced && results.pages > 1}
        <nav class="pagination" aria-label={m.resultPages()}>
          <button disabled={selection.page === 1} onclick={() => changePage(selection.page - 1)}>{m.previousPage()}</button>
          <span>{m.pageOf({ page: selection.page, pages: results.pages })}</span>
          <button disabled={selection.page === results.pages} onclick={() => changePage(selection.page + 1)}>{m.nextPage()}</button>
        </nav>
      {/if}
    </section>

    <section id="spotlight" class="spotlight" aria-labelledby="spotlight-name">
      <button class="back-results" onclick={back}>← {m.backToResults()}</button>
      <p class="eyebrow">{m.spotlight()}</p>
      <div class="spotlight-title">
        <h2 id="spotlight-name" tabindex="-1" bind:this={heading}>{text?.name ?? m.noSelection()}</h2>
        {#if selected}<p class="scientific-name"><i>{selected.scientificName}</i></p>{/if}
      </div>
      {#if selected && text}
        {#if selected.poster}
          <figure>
            {#if enhanced && previewId}
              {#key selected.id}
                <SpotlightPreview specimen={previewId} poster={poster(selected)} alt={text.posterAlt} name={text.name} visible={!narrow || selection.view === 'spotlight'} />
              {/key}
            {:else}
              <Poster src={poster(selected)} alt={text.posterAlt} />
            {/if}
            <figcaption>{m.posterCaption()}</figcaption>
          </figure>
        {/if}
      <div class="spotlight-details">
        <p class="specimen-description">{text.description}</p>
        <dl class="specimen-facts">
          <div><dt>{m.diet()}</dt><dd>{dietLabel(selected.diet)}</dd></div>
          <div><dt>{m.geologicalPeriod()}</dt><dd>{period(selected)}<span>{text.age}</span></dd></div>
        </dl>
        <p class="reconstruction-note">{text.reconstruction}</p>
        {#if selected.source}<a class="source-link" href={selected.source}>{m.specimenSource()} ↗</a>{/if}
        <div class="explore-block">
          {#if selected.studyCapability}<p class="capability">{selected.studyCapability === 'guided' ? m.guidedCapability() : m.explorationCapability()}</p>{/if}
          {#if selected.exhibitPath}
            <a class="explore-link" href={localizeHref(selected.exhibitPath) + (enhanced ? exhibitOverviewHash(selection) : '')} onclick={(event) => preservePosition(event, true)} data-sveltekit-reload>{m.exploreSpecimen()} <span aria-hidden="true">→</span></a>
          {/if}
        </div>
      </div>
      {:else}
        <div class="empty-spotlight">
          <p>{m.tryDiscoveryAgain()}</p>
          <button onclick={clearAll}>{m.clearAll()}</button>
        </div>
      {/if}
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
  .discovery-controls { margin-top: 1.5rem; }
  .search-row { display: flex; flex-wrap: wrap; align-items: end; gap: 0.5rem; }
  .name-search { display: grid; flex: 1 1 8rem; min-width: 0; gap: 0.5rem; }
  .discovery-controls :is(label, legend) { font-weight: 600; }
  #discovery-filters { display: inline-flex; align-items: center; justify-content: center; gap: 0.4rem; }
  #discovery-filters svg { width: 1.125rem; height: 1.125rem; flex: none; }
  #discovery-panel:not([hidden]) { display: grid; gap: 1rem; margin-top: 1rem; }
  #discovery-diet { min-width: 0; margin: 0; padding: 0; border: 0; }
  #discovery-diet legend { padding: 0; margin-bottom: 0.5rem; }
  .diet-options { display: flex; flex-wrap: wrap; gap: 0.5rem; }
  .field-guide .diet-options button { border-color: var(--stone); }
  .field-guide .diet-options button[aria-pressed="true"] { color: var(--bone); background: var(--olive); border-color: var(--olive); }
  .period-filter { display: grid; gap: 0.5rem; }
  .discovery-controls input, .discovery-controls select { width: 100%; min-width: 0; min-height: 44px; box-sizing: border-box; border: 1px solid var(--olive); border-radius: 0; padding: 0.6rem; color: var(--charcoal); background: var(--bone); font: inherit; }
  .field-guide button { color: var(--charcoal); background: transparent; border: 1px solid var(--olive); }
  .field-guide :is(button, input, select):focus-visible { outline: 3px solid var(--olive); outline-offset: 3px; }
  button { min-height: 44px; max-width: 100%; padding: 0.6rem 0.75rem; font: inherit; overflow-wrap: anywhere; }
  .active-constraints { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 1rem; }
  .active-constraints button { text-align: left; }
  .clear-all { font-weight: 600; }
  .pagination { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 0.75rem; margin-top: 1.5rem; }
  .pagination button:disabled { opacity: 0.55; cursor: default; }
  .empty-results, .empty-spotlight { display: grid; justify-items: start; gap: 1rem; padding-block: 1.5rem; }
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
    .overview-shell { padding-inline: clamp(12px, 3vw, 24px); }
    .overview { display: block; margin-top: 1rem; }
    .field-guide, .spotlight { padding: clamp(12px, 3vw, 20px); }
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

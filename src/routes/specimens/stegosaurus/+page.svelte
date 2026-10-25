<script lang="ts">
  import { onMount } from 'svelte';
  import { m } from '#lib/paraglide/messages.js';
  import { getLocale, localizeHref } from '#lib/paraglide/runtime.js';
  import { stegosaurus } from '#lib/specimens/stegosaurus.ts';
  import { stegosaurusText } from '#lib/specimens/content.ts';
  import { returnToOverview } from '#lib/specimens/overview-state.ts';
  import SpecimenViewer from '#lib/viewer/SpecimenViewer.svelte';

  const locale = getLocale();
  const text = stegosaurusText[locale];
  const length = stegosaurus.config.scale;
  let overviewContext = $state('');
  onMount(() => { overviewContext = returnToOverview('stegosaurus', location.hash, locale); });
  function changeLanguage(event: MouseEvent): void {
    if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    if (location.hash.startsWith('#overview=')) (event.currentTarget as HTMLAnchorElement).hash = location.hash;
  }
</script>

<svelte:head>
  <title>{text.name} | Fieldbook 3D</title>
  <meta name="description" content={text.description} />
</svelte:head>

<div class="fieldbook">
  <header class="site-header">
    <a class="brand" href={localizeHref('/overview/') + overviewContext} data-sveltekit-reload>Fieldbook 3D</a>
    <nav class="language-nav" aria-label={m.languages()}>
      <a href={localizeHref('/specimens/stegosaurus/', { locale: 'en' })} lang="en" hreflang="en" aria-current={locale === 'en' ? 'page' : undefined} onclick={changeLanguage} data-sveltekit-reload>English</a>
      <a href={localizeHref('/specimens/stegosaurus/', { locale: 'de' })} lang="de" hreflang="de" aria-current={locale === 'de' ? 'page' : undefined} onclick={changeLanguage} data-sveltekit-reload>Deutsch</a>
    </nav>
  </header>

  <main class="exhibit">
    <div class="exhibit-heading">
      <div class="specimen-title">
        <h1>{text.name}</h1>
        <p class="scientific-name"><i>{stegosaurus.scientificName}</i></p>
      </div>
      <div class="specimen-context">
        <p>{text.description}</p>
        <p class="reconstruction-note">{text.reconstruction}</p>
        {#if length}<p class="reconstruction-note">{text.scaleNote(new Intl.NumberFormat(locale).format(length.lengthMetres))}</p>{/if}
      </div>
    </div>
    <nav class="specimen-navigation" aria-label={m.specimens()}>
      <a href={localizeHref('/overview/') + overviewContext} data-sveltekit-reload>{m.overview()}</a>
      <a href={localizeHref('/specimens/ankylosaurus/')} data-sveltekit-reload>{m.exploreAnkylosaurus()}</a>
    </nav>
    <SpecimenViewer config={stegosaurus.config} {text} study={{ kind: 'none' }} />
  </main>
</div>

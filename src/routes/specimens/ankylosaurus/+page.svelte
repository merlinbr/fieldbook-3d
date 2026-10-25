<script lang="ts">
  import { onMount } from 'svelte';
  import { m } from '#lib/paraglide/messages.js';
  import { getLocale, localizeHref } from '#lib/paraglide/runtime.js';
  import { ankylosaurus } from '#lib/specimens/ankylosaurus.ts';
  import { ankylosaurusText } from '#lib/specimens/content.ts';
  import { returnToOverview } from '#lib/specimens/overview-state.ts';
  import SpecimenViewer from '#lib/viewer/SpecimenViewer.svelte';

  const locale = getLocale();
  const text = ankylosaurusText[locale];
  let specimenViewer: SpecimenViewer | undefined;
  let overviewContext = $state('');
  onMount(() => { overviewContext = returnToOverview('ankylosaurus', location.hash); });

  function changeLanguage(event: MouseEvent): void {
    // Native modified clicks open a separate document without interrupting this one.
    if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const link = event.currentTarget as HTMLAnchorElement;
    if (link.getAttribute('aria-current') === 'page') return;
    if (location.hash.startsWith('#overview=')) link.hash = location.hash;
    specimenViewer?.prepareLanguageLink(link);
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
      <a
        href={localizeHref('/specimens/ankylosaurus/', { locale: 'en' })}
        lang="en"
        hreflang="en"
        aria-current={locale === 'en' ? 'page' : undefined}
        data-sveltekit-reload
        onclick={changeLanguage}
      >English</a>
      <a
        href={localizeHref('/specimens/ankylosaurus/', { locale: 'de' })}
        lang="de"
        hreflang="de"
        aria-current={locale === 'de' ? 'page' : undefined}
        data-sveltekit-reload
        onclick={changeLanguage}
      >Deutsch</a>
    </nav>
  </header>

  <main class="exhibit">
    <div class="exhibit-heading">
      <div class="specimen-title">
        <h1>{text.name}</h1>
        <p class="scientific-name"><i>{ankylosaurus.scientificName}</i></p>
      </div>
      <div class="specimen-context">
        <p>{text.description}</p>
        <p class="reconstruction-note">{text.reconstruction}</p>
      </div>
    </div>
    <nav class="specimen-navigation" aria-label={m.specimens()}>
      <a href={localizeHref('/overview/') + overviewContext} data-sveltekit-reload>{m.overview()}</a>
      <a href={localizeHref('/specimens/stegosaurus/')} data-sveltekit-reload>{m.exploreStegosaurus()}</a>
    </nav>
    <SpecimenViewer bind:this={specimenViewer} config={ankylosaurus.config} {text} study={{ kind: 'guided', recording: ankylosaurus.study[locale], versions: ankylosaurus.versions }} />
  </main>
</div>

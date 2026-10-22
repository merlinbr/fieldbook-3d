<script lang="ts">
  import { m } from '#lib/paraglide/messages.js';
  import { getLocale, localizeHref } from '#lib/paraglide/runtime.js';
  import { ankylosaurus, ankylosaurusText } from '#lib/specimens/ankylosaurus.ts';
  import SpecimenViewer from '#lib/viewer/SpecimenViewer.svelte';

  const locale = getLocale();
  const text = ankylosaurusText[locale];
  let specimenViewer: SpecimenViewer | undefined;

  function changeLanguage(event: MouseEvent): void {
    // Native modified clicks open a separate document without interrupting this one.
    if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const link = event.currentTarget as HTMLAnchorElement;
    if (link.getAttribute('aria-current') === 'page') return;
    specimenViewer?.prepareLanguageLink(link);
  }
</script>

<svelte:head>
  <title>{text.name} | Fieldbook 3D</title>
  <meta name="description" content={text.description} />
</svelte:head>

<div class="fieldbook">
  <header class="site-header">
    <span class="brand">Fieldbook 3D</span>
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
    <SpecimenViewer bind:this={specimenViewer} modelUrl={ankylosaurus.modelUrl} anatomy={text.anatomy} recording={ankylosaurus.study[locale]} versions={ankylosaurus.versions} />
  </main>
</div>

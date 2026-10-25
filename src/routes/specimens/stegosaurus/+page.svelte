<script lang="ts">
  import { m } from '#lib/paraglide/messages.js';
  import { getLocale, localizeHref } from '#lib/paraglide/runtime.js';
  import { stegosaurus, stegosaurusText } from '#lib/specimens/stegosaurus.ts';
  import SpecimenViewer from '#lib/viewer/SpecimenViewer.svelte';

  const locale = getLocale();
  const text = stegosaurusText[locale];
  const length = stegosaurus.config.scale;
</script>

<svelte:head>
  <title>{text.name} | Fieldbook 3D</title>
  <meta name="description" content={text.description} />
</svelte:head>

<div class="fieldbook">
  <header class="site-header">
    <span class="brand">Fieldbook 3D</span>
    <nav class="language-nav" aria-label={m.languages()}>
      <a href={localizeHref('/specimens/stegosaurus/', { locale: 'en' })} lang="en" hreflang="en" aria-current={locale === 'en' ? 'page' : undefined} data-sveltekit-reload>English</a>
      <a href={localizeHref('/specimens/stegosaurus/', { locale: 'de' })} lang="de" hreflang="de" aria-current={locale === 'de' ? 'page' : undefined} data-sveltekit-reload>Deutsch</a>
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
    <SpecimenViewer config={stegosaurus.config} {text} study={{ kind: 'none' }} />
  </main>
</div>

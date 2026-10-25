<script lang="ts">
  import { m } from '#lib/paraglide/messages.js';
  let { src, alt, compact = false }: { src: string | null; alt: string; compact?: boolean } = $props();
  let failed = $state(false);
  $effect(() => { src; failed = false; });
</script>

<div class:compact class="specimen-poster">
  {#if src && !failed}
    <img {src} alt={compact ? '' : alt} width="1200" height="750" onerror={() => failed = true} />
  {:else if !compact}
    <p class="poster-fallback">{m.posterUnavailable()}</p>
  {:else}
    <span aria-hidden="true">—</span>
  {/if}
</div>

<style>
  .specimen-poster { display: grid; place-items: center; min-width: 0; aspect-ratio: 8 / 5; }
  img { display: block; width: 100%; height: 100%; min-height: 0; object-fit: contain; }
  .poster-fallback { max-width: 28rem; padding: 1.5rem; color: var(--stone); text-align: center; }
  .compact { width: 5.25rem; background: var(--charcoal); border-radius: 0.2rem; color: var(--stone); }
</style>

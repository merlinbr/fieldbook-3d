import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

// Run after a static build. Runtime controls are verified in the browser separately.
for (const locale of ['en', 'de']) {
  for (const species of ['ankylosaurus', 'stegosaurus']) {
    const html = await readFile(new URL(`../build/${locale}/specimens/${species}/index.html`, import.meta.url), 'utf8');
    const name = species === 'stegosaurus' ? 'Stegosaurus' : 'Ankylosaurus';
    assert(html.includes(`<title>${name} | Fieldbook 3D</title>`));
    assert(html.includes(species === 'stegosaurus' ? 'Stegosaurus stenops' : 'Ankylosaurus magniventris'));
    assert.match(html, /<meta name="description" content="[^"]+"/);
    const anchors = html.match(/<a\b[^>]*>/g) ?? [];
    const other = species === 'stegosaurus' ? 'ankylosaurus' : 'stegosaurus';
    const specimenLink = anchors.find(a => a.includes(`href="/${locale}/specimens/${other}/"`));
    assert(specimenLink?.includes('data-sveltekit-reload'), 'Reciprocal species link reloads without query/hash');
    for (const language of ['en', 'de']) {
      const link = anchors.find(a => a.includes(`href="/${language}/specimens/${species}/"`));
      assert(link?.includes(`lang="${language}"`) && link.includes(`hreflang="${language}"`));
      assert(link.includes('data-sveltekit-reload'));
      assert.equal(link.includes('aria-current="page"'), language === locale);
    }
    if (species === 'stegosaurus') {
      const label = locale === 'en' ? 'Interactive 3D Stegosaurus specimen' : 'Interaktives 3D-Exemplar eines Stegosaurus';
      assert(html.includes(`aria-label="${label}"`));
      assert(html.includes(locale === 'en' ? 'A stylized reconstruction.' : 'Eine stilisierte Rekonstruktion.'));
      assert(html.includes(locale === 'en' ? 'represented length of 9 m' : 'dargestellten Länge von 9 m'));
      // Exclude a reciprocal navigation label; the exhibit itself cannot describe the other species.
      const content = html.replace(/<nav class="specimen-navigation"[\s\S]*?<\/nav>/g, '');
      assert(!content.includes('Ankylosaurus'));
      assert(!html.includes('study-entry') && !html.includes('study-transport') && !html.includes('study-captions'));
    }
  }
}
for (const locale of ['en', 'de']) {
  const html = await readFile(new URL(`../build/${locale}/overview/index.html`, import.meta.url), 'utf8');
  assert.match(html, new RegExp(`<html[^>]*lang="${locale}"`));
  assert.match(html, /<title>[^<]+ \| Fieldbook 3D<\/title>/);
  assert.match(html, /<meta name="description" content="[^"]+"/);
  for (const species of ['ankylosaurus', 'stegosaurus']) {
    assert(html.includes(`href="/${locale}/specimens/${species}/"`), 'Native specimen link available before hydration');
  }
  for (const language of ['en', 'de']) {
    assert(html.includes(`href="/${language}/overview/"`), 'Localized static Overview link');
  }
  assert(!html.includes('<canvas') && !html.includes('<audio'), 'Still-image Overview has no renderer or narration');
}
const root = await readFile(new URL('../build/index.html', import.meta.url), 'utf8');
assert(root.includes('url=/en/overview/'));
console.log('Four localized static exhibit pages, metadata, accessibility, locale links and Overview entry passed.');

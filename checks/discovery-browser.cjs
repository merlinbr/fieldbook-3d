const { chromium } = require(process.env.FIELDBOOK_PLAYWRIGHT || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const base = process.env.FIELDBOOK_PREVIEW_URL || 'http://127.0.0.1:4173';
const fixtures = process.env.FIELDBOOK_FIXTURE_URL || 'http://127.0.0.1:5175';
const evidence = 'media-dev/issue26-verification';
const results = [];
const rows = page => page.locator('.specimen-row');
const ids = page => rows(page).evaluateAll(nodes => nodes.map(node => node.id.replace('row-', '')));
const state = page => new URLSearchParams(new URL(page.url()).hash.slice(1));
const media = url => /\.(?:glb|mp3)(?:[?#]|$)/i.test(url);
async function open(page, host, locale = 'en', hash = '') {
  await page.goto(`${host}/${locale}/overview/${hash}`);
  await page.locator('#discovery-query').waitFor();
}
async function count(page, n, total) {
  await page.waitForFunction((text) => document.querySelector('#result-count')?.textContent.startsWith(text), `${n} ${new URL(page.url()).pathname.startsWith('/de/') ? 'von' : 'of'} ${total}`);
}
async function screenshot(page, name) {
  await page.screenshot({ path: `${evidence}/${name}.png`, fullPage: true });
}
async function layout(page) {
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'No horizontal page overflow');
  const small = await page.locator('.overview :is(button,input,select,a)').evaluateAll(nodes => nodes.filter(node => {
    const box = node.getBoundingClientRect();
    return box.width && box.height && box.height < 44;
  }).map(node => `${node.tagName}: ${node.textContent}`));
  assert.deepEqual(small, [], 'Visible controls have at least 44px touch height');
}
(async () => {
  await fs.mkdir(evidence, { recursive: true });
  const browser = await chromium.launch({ headless: true, executablePath: process.env.FIELDBOOK_BROWSER_EXECUTABLE || undefined, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  try {
    const context = await browser.newContext({ viewport: { width: 1360, height: 1000 } });
    const page = await context.newPage();
    const errors = [], requests = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => requests.push(request.url()));
    results.push(`Chromium ${browser.version()}; static ${base}; isolated fixtures ${fixtures}`);
    for (const locale of ['en', 'de']) {
      await open(page, base, locale);
      await count(page, 2, 2);
      assert.deepEqual(await ids(page), ['ankylosaurus', 'stegosaurus']);
      assert.equal(await page.locator('.pagination').count(), 0);
      for (const [query, selected] of [['  MAGNIVENTRIS ', 'ankylosaurus'], [' sTeNoPs ', 'stegosaurus'], [' ANKYLOSAURUS ', 'ankylosaurus']]) {
        await page.locator('#discovery-query').fill(query);
        await count(page, 1, 2);
        assert.deepEqual(await ids(page), [selected]);
        assert.equal(state(page).get('specimen'), selected);
        assert.match(await page.locator('.explore-link').getAttribute('href'), new RegExp(`/${selected}/#overview=`));
      }
      await page.locator('#discovery-query').fill(' \t ');
      await count(page, 2, 2);
      await page.locator('#discovery-diet').selectOption('herbivore');
      await page.locator('#discovery-period').selectOption('jurassic');
      await count(page, 1, 2);
      assert.deepEqual(await ids(page), ['stegosaurus']);
      await page.locator('#discovery-sort').selectOption('name-desc');
      await screenshot(page, `${locale}-production-combined`);
      await page.locator('#discovery-diet').selectOption('carnivore');
      await count(page, 0, 2);
      assert.equal(await page.locator('.explore-link').count(), 0);
      assert.equal(await page.locator('.spotlight-preview').count(), 0);
      assert.equal(await page.locator('.empty-spotlight').count(), 1);
      await screenshot(page, `${locale}-empty`);
      await page.locator('.active-constraints button').first().click();
      await count(page, 1, 2);
      assert.equal(state(page).get('specimen'), 'stegosaurus');
      await page.locator('#discovery-period').selectOption('triassic');
      await count(page, 0, 2);
      await page.locator('.empty-spotlight button').click();
      await count(page, 2, 2);
      assert.equal(await page.locator('#discovery-query').inputValue(), '');
      assert.equal(await page.locator('#discovery-diet').inputValue(), '');
      assert.equal(await page.locator('#discovery-period').inputValue(), '');
    }
    await open(page, base);
    await page.locator('#discovery-query').focus();
    await page.keyboard.type('stenops');
    await count(page, 1, 2);
    await page.keyboard.press('Tab');
    assert.equal(await page.locator('#discovery-diet').evaluate(node => document.activeElement === node), true);
    await page.keyboard.press('ArrowDown');
    assert.equal(await page.locator('#discovery-diet').inputValue(), 'herbivore');
    await page.keyboard.press('Tab');
    assert.equal(await page.locator('#discovery-period').evaluate(node => document.activeElement === node), true);
    await page.keyboard.press('End');
    await count(page, 0, 2);
    await page.keyboard.press('ArrowUp');
    await count(page, 1, 2);
    assert(await page.locator('#discovery-period').evaluate(node => node.matches(':focus-visible') && getComputedStyle(node).outlineStyle !== 'none'));
    await screenshot(page, 'keyboard-native-controls');
    assert.equal(requests.filter(media).length, 0, 'Discovery did not preload any models or narration');
    results.push('Production EN/DE: case/whitespace common and scientific names, combined controls, selected real destinations, zero results, clear-one/clear-all and physical keyboard/native select controls with visible focus passed; no model/audio preload.');

    await open(page, fixtures);
    await count(page, 52, 52);
    assert.equal(await rows(page).count(), 8);
    const seen = [];
    for (let n = 1; n <= 7; ++n) {
      seen.push(...await ids(page));
      assert.equal(await rows(page).count(), n === 7 ? 4 : 8);
      assert.equal(await page.locator('.pagination button').first().isDisabled(), n === 1);
      assert.equal(await page.locator('.pagination button').last().isDisabled(), n === 7);
      if (n < 7) {
        await page.locator('.pagination button').last().click();
        await page.waitForFunction(n => new URLSearchParams(location.hash.slice(1)).get('page') === String(n), n + 1);
      }
    }
    assert.equal(new Set(seen).size, 52, 'Every entry appears once across all seven pages');
    assert.equal(seen[0], 'ankylosaurus');
    assert.equal(seen.at(-1), 'stegosaurus');
    await screenshot(page, 'fixtures-last-page');
    await page.locator('#discovery-sort').selectOption('name-desc');
    assert.equal(state(page).get('page'), null, 'Sorting resets to first page');
    assert.equal((await ids(page))[0], 'stegosaurus');
    await page.locator('#discovery-query').fill('sample');
    await page.locator('#discovery-diet').selectOption('carnivore');
    await page.locator('#discovery-period').selectOption('triassic');
    await count(page, 3, 52);
    assert.deepEqual(await ids(page), ['layout-sample-46', 'layout-sample-26', 'layout-sample-06']);
    assert.equal(await page.locator('.explore-link').count(), 0, 'Layout sample has no real or invented exhibit link');
    assert.equal(await page.locator('.pagination').count(), 0);
    await screenshot(page, 'fixtures-combined');
    await page.reload(); await page.locator('#discovery-query').waitFor();
    assert.equal(await page.locator('#discovery-query').inputValue(), 'sample');
    assert.equal(await page.locator('#discovery-diet').inputValue(), 'carnivore');
    await page.getByRole('link', { name: 'Deutsch', exact: true }).click();
    await page.waitForURL('**/de/overview/**'); await page.locator('#discovery-query').waitFor();
    await count(page, 3, 52);
    assert.equal(await page.locator('#discovery-period').inputValue(), 'triassic');
    assert.deepEqual(await ids(page), ['layout-sample-46', 'layout-sample-26', 'layout-sample-06']);
    await page.goBack(); await page.locator('#discovery-query').waitFor();
    await count(page, 3, 52);
    await page.goForward(); await page.locator('#discovery-query').waitFor();
    await count(page, 3, 52);

    await open(page, fixtures, 'en', '#specimen=layout-sample-50&page=999&index=-5');
    assert.equal(state(page).get('page'), '7');
    assert.equal(state(page).get('index'), null);
    await page.getByRole('button', { name: 'Shrink to real specimens', exact: true }).click();
    await count(page, 2, 2);
    assert.equal(state(page).get('page'), null);
    assert.equal(state(page).get('specimen'), 'ankylosaurus');
    assert.equal(await page.locator('.pagination').count(), 0);
    await page.getByRole('button', { name: 'Restore 52 entries', exact: true }).click();
    await count(page, 52, 52);
    await open(page, fixtures, 'en', '#query=sample&diet=carnivore&period=triassic');
    await count(page, 3, 52);
    await page.getByRole('button', { name: 'Shrink to real specimens', exact: true }).click();
    await count(page, 0, 2);
    assert.equal(await page.locator('.explore-link').count(), 0);
    await page.locator('.empty-results button').click(); await count(page, 2, 2);
    results.push('52-entry fixtures: seven pages (8/8/8/8/8/8/4), reverse sort/reset, query AND diet AND period, no fixture exhibit links, reload/locale/back/forward, invalid bounds and dataset shrink/empty recovery passed.');

    for (const width of [1360, 1024, 390, 320]) {
      for (const zoom of [100, 200]) {
        await page.setViewportSize({ width, height: 1000 });
        await open(page, fixtures, 'de', '#query=Layoutbeispiel+50');
        await count(page, 1, 52);
        await page.evaluate(zoom => document.documentElement.style.fontSize = `${zoom}%`, zoom);
        await layout(page);
        await screenshot(page, `de-${width}-${zoom}-results`);
        if (width < 760) {
          await rows(page).first().click();
          await page.locator('#spotlight-name').waitFor({ state: 'visible' });
          await layout(page);
          await screenshot(page, `de-${width}-${zoom}-spotlight`);
          await page.locator('.back-results').click();
          await page.locator('#discovery-query').waitFor({ state: 'visible' });
          assert.equal(await page.locator('#discovery-query').inputValue(), 'Layoutbeispiel 50');
        }
      }
    }
    await page.evaluate(() => document.documentElement.style.fontSize = '100%');
    await page.setViewportSize({ width: 390, height: 844 });
    await open(page, fixtures, 'de', '#query=Layoutbeispiel&sort=name-desc&page=2');
    const chosen = (await ids(page))[3];
    await page.locator(`#row-${chosen}`).scrollIntoViewIfNeeded();
    await page.locator(`#row-${chosen}`).click();
    await page.waitForFunction(() => document.activeElement?.id === 'spotlight-name');
    const before = state(page);
    assert.equal(before.get('page'), '2');
    const position = Number(before.get('index'));
    assert(position > 0);
    await screenshot(page, 'mobile-preview');
    await page.locator('.back-results').click();
    await page.waitForFunction(id => document.activeElement?.id === `row-${id}`, chosen);
    assert.equal(state(page).get('page'), '2');
    assert.equal(state(page).get('query'), 'Layoutbeispiel');
    assert.equal(state(page).get('sort'), 'name-desc');
    assert(Math.abs(await page.evaluate(() => scrollY) - position) <= 2, 'Mobile return restores index position');
    await screenshot(page, 'mobile-return');
    await page.goBack();
    await page.waitForFunction(() => document.activeElement?.id === 'spotlight-name');
    await page.goForward();
    await page.waitForFunction(id => document.activeElement?.id === `row-${id}`, chosen);

    await open(page, base, 'en', '#query=stenops&diet=herbivore&period=jurassic&sort=name-desc');
    await rows(page).first().click();
    await page.locator('.explore-link').click();
    await page.waitForURL('**/en/specimens/stegosaurus/**');
    await page.getByRole('link', { name: 'Overview', exact: true }).click();
    await page.locator('#discovery-query').waitFor({ state: 'attached' });
    assert.equal(state(page).get('query'), 'stenops');
    assert.equal(state(page).get('period'), 'jurassic');
    assert.equal(state(page).get('specimen'), 'stegosaurus');
    await page.locator('.back-results').click();
    assert.equal(await page.locator('#discovery-query').inputValue(), 'stenops');
    results.push('German 1360/1024/390/320px at 100% and 200% text: long-name wrapping, native controls and >=44px touch heights passed. Mobile preview/back restored query, sort, page, selected row focus and scroll; history and real exhibit return passed.');

    // Use the existing real preview, not a renderer mock: unchanged selection retains the canvas.
    await page.setViewportSize({ width: 1360, height: 1000 });
    await open(page, base);
    await page.locator('.preview-start').click();
    await page.waitForFunction(() => document.querySelector('.preview-stage.ready canvas'), null, { timeout: 60000 });
    const canvas = await page.locator('.preview-stage canvas').elementHandle();
    const beforeModels = requests.filter(media).length;
    await page.locator('#discovery-query').fill('anky');
    await count(page, 1, 2);
    assert(await canvas.evaluate(node => node === document.querySelector('.preview-stage canvas')));
    assert.equal(requests.filter(media).length, beforeModels, 'Unchanged selection does not reload preview');
    await page.locator('#discovery-period').selectOption('jurassic');
    await count(page, 0, 2);
    assert.equal(await canvas.evaluate(node => node.isConnected), false, 'Filtered selection disposes its canvas');
    assert.equal(await page.locator('.preview-stage canvas').count(), 0);
    assert.equal(await page.locator('.explore-link').count(), 0);
    await page.locator('.empty-spotlight button').click(); await count(page, 2, 2);
    results.push('Real on-demand preview: matching keystrokes retain the same canvas/model request; removing selection tears it down and removes Explore; reset recovers.');
    assert.deepEqual(errors, []);
    await context.close();
    const noJs = await browser.newContext({ javaScriptEnabled: false });
    const native = await noJs.newPage(); await native.goto(`${base}/de/overview/`);
    assert.deepEqual(await ids(native), ['ankylosaurus', 'stegosaurus']);
    assert.equal(await native.locator('#discovery-query').count(), 0);
    await native.locator('#row-stegosaurus').click();
    assert.equal(new URL(native.url()).pathname, '/de/specimens/stegosaurus/');
    await noJs.close();
    results.push('No JavaScript: real catalog links remain usable; unavailable enhancement controls are not shown. No application page errors.');
  } finally {
    await fs.writeFile(`${evidence}/browser-results.txt`, results.join('\n') + '\n');
    await browser.close();
    console.log(results.join('\n'));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });

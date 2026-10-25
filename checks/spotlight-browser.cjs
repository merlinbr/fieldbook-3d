const { chromium } = require(process.env.FIELDBOOK_PLAYWRIGHT || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const base = process.env.FIELDBOOK_PREVIEW_URL || 'http://127.0.0.1:4173';
const evidence = 'media-dev/issue25-verification';
const species = ['ankylosaurus', 'stegosaurus'];
const translations = {
  en: { start: 'View in 3D', close: 'Close 3D preview', retry: 'Retry 3D', left: 'Rotate left', right: 'Rotate right', up: 'Rotate up', down: 'Rotate down', reset: 'Reset view', german: 'Deutsch', english: 'English' },
  de: { start: 'In 3D ansehen', close: '3D-Vorschau schließen', retry: '3D erneut versuchen', left: 'Nach links drehen', right: 'Nach rechts drehen', up: 'Nach oben drehen', down: 'Nach unten drehen', reset: 'Ansicht zurücksetzen', german: 'Deutsch', english: 'English' }
};
const results = [];
const button = (page, name) => page.getByRole('button', { name, exact: true });
const glb = url => /\/(?:ankylosaurus|stegosaurus)\.glb(?:\?|$)/i.test(url);
const audio = url => /\.mp3(?:\?|$)/i.test(url);
async function openOverview(page, locale) {
  const response = await page.goto(`${base}/${locale}/overview/`, { waitUntil: 'domcontentloaded' });
  assert.equal(response.status(), 200);
  await page.locator('.specimen-index').waitFor();
  await page.locator('.preview-start').waitFor({ state: 'attached' });
}
async function select(page, id) {
  await page.locator(`#row-${id}`).click();
  await page.locator('.spotlight-preview').waitFor();
  await button(page, translations[new URL(page.url()).pathname.split('/')[1]].start).waitFor();
}
async function swipe(page, from, to) {
  const cdp = await page.context().newCDPSession(page);
  try {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [from] });
    for (let step = 1; step <= 8; ++step) {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{
        x: from.x + (to.x - from.x) * step / 8, y: from.y + (to.y - from.y) * step / 8
      }] });
      await page.waitForTimeout(25);
    }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  } finally { await cdp.detach(); }
}
async function noOverflow(page) {
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'No horizontal overflow');
}
async function snapshot(page, name) {
  await page.screenshot({ path: `${evidence}/${name}.png`, fullPage: true });
}

(async () => {
  await fs.mkdir(evidence, { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.FIELDBOOK_BROWSER_EXECUTABLE || undefined, headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  try {
    results.push(`Chromium ${browser.version()}, static preview ${base}; posters expected from media-dev on 5196 and real HTTP GLBs on 5194`);
    for (const locale of ['en', 'de']) {
      const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const page = await context.newPage();
      const errors = [];
      const requests = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('request', request => requests.push(request.url()));
      for (const id of species) {
        await openOverview(page, locale);
        const before = requests.length;
        await select(page, id);
        assert.equal(requests.slice(before).filter(url => glb(url) || audio(url)).length, 0, `${locale}/${id}: poster-first does not request model or audio`);
        assert.equal(await page.locator('.preview-stage canvas').count(), 0, 'No WebGL canvas before activation');
        assert.equal(await page.locator('.preview-start').count(), 1, 'Start stays mounted exactly once');
        await button(page, translations[locale].start).focus();
        await page.keyboard.press('Enter');
        await page.locator('.preview-stage canvas').waitFor();
        await page.waitForFunction(() => /ready|loaded|bereit|geladen/i.test(document.querySelector('.preview-status')?.textContent || ''), null, { timeout: 60000 });
        await button(page, translations[locale].start).click({ force: true });
        await page.waitForTimeout(100);
        assert.equal(await page.locator('.preview-stage canvas').count(), 1, 'Repeated start activation does not create a second renderer');
        const modelRequests = requests.slice(before).filter(url => glb(url));
        assert.equal(modelRequests.length, 1, `${locale}/${id}: exactly one model request after activation`);
        assert.match(modelRequests[0], new RegExp(`/${id}\\.glb(?:[?#]|$)`));
        assert.equal(requests.slice(before).filter(audio).length, 0, 'Preview never requests narration');
        const initialView = await page.locator('.preview-stage canvas').screenshot();
        await button(page, translations[locale].right).focus(); await page.keyboard.press('Enter');
        assert(!initialView.equals(await page.locator('.preview-stage canvas').screenshot()), 'Keyboard rotation changes the rendered model');
        await button(page, translations[locale].up).focus(); await page.keyboard.press('Space');
        await button(page, translations[locale].left).click();
        await button(page, translations[locale].down).click();
        await button(page, translations[locale].reset).click();
        assert(initialView.equals(await page.locator('.preview-stage canvas').screenshot()), 'Reset restores the initial model view');
        const canvas = page.locator('.preview-stage canvas');
        const bounds = await canvas.boundingBox(); assert(bounds);
        await page.mouse.move(bounds.x + bounds.width * 0.55, bounds.y + bounds.height * 0.55);
        await page.mouse.down(); await page.mouse.move(bounds.x + bounds.width * 0.72, bounds.y + bounds.height * 0.58); await page.mouse.up();
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await page.setViewportSize({ width: 900, height: 700 }); await noOverflow(page);
        await page.setViewportSize({ width: 390, height: 844 }); await noOverflow(page);
        await snapshot(page, `${locale}-${id}-mobile-ready`);
        await button(page, translations[locale].close).click();
        assert.equal(await page.locator('.preview-stage canvas').count(), 0, 'Close tears down the canvas');
        assert(await button(page, translations[locale].start).evaluate(el => document.activeElement === el), 'Close restores focus to persistent start action');
        assert.equal(await page.locator('.preview-start').count(), 1);
        await button(page, translations[locale].start).click();
        await page.locator('.preview-stage canvas').waitFor();
        await page.locator('.explore-link').click();
        await page.waitForURL(url => url.pathname === `/${locale}/specimens/${id}/`);
        await page.goBack();
        await page.locator('.spotlight-preview').waitFor();
        assert.equal(await page.locator('.preview-stage canvas').count(), 0, 'Exhibit navigation tears down spotlight renderer');
        assert.equal(errors.length, 0, errors.join('\n'));
        results.push(`${locale}/${id}: poster-first, one activation/model, no audio, keyboard and pointer rotation/reset, reduced motion, 900px and 390px resize, canvas teardown and focus restoration passed`);
      }
      // Selection changes while pending must cancel the old renderer, and only the latest species may load.
      await page.setViewportSize({ width: 1440, height: 900 });
      await openOverview(page, locale);
      const t = translations[locale];
      let release;
      const gate = new Promise(resolve => { release = resolve; });
      await page.route('**/ankylosaurus.glb', async route => {
        await gate;
        try { await route.continue(); }
        catch { /* The preview may abort the pending browser request on selection change. */ }
      });
      await select(page, 'ankylosaurus');
      const pendingModel = page.waitForRequest(request => request.url().includes('ankylosaurus.glb'));
      await button(page, t.start).click();
      await pendingModel;
      await page.locator('#row-stegosaurus').click();
      await page.locator('.spotlight-preview').waitFor();
      release(); await page.unroute('**/ankylosaurus.glb');
      await button(page, t.start).click();
      await page.waitForFunction(() => /ready|loaded|bereit|geladen/i.test(document.querySelector('.preview-status')?.textContent || ''), null, { timeout: 60000 });
      assert.equal(await page.locator('.preview-stage canvas').count(), 1);
      assert(requests.some(url => url.includes('stegosaurus.glb')));
      await page.waitForTimeout(1000);
      assert.equal(await page.locator('.preview-stage canvas').count(), 1, 'Late abandoned-species response cannot revive a renderer');
      assert.match(await page.locator('.preview-status').innerText(), /ready|loaded|bereit|geladen/i, 'Abandoned response cannot replace selected preview state');
      await button(page, t.close).click();
      await page.locator('#row-ankylosaurus').click();
      await page.setViewportSize({ width: 390, height: 844 });
      await button(page, t.start).click(); await page.locator('.preview-stage canvas').waitFor();
      await page.locator('.back-results').click();
      assert.equal(await page.locator('.spotlight-preview').isVisible(), false, 'Back to results hides the poster and disposes the preview');
      assert.equal(await page.locator('.preview-stage canvas').count(), 0);
      await context.close();
    }

    // Repeated activation, route navigation, mobile back/selection reset, and live resource teardown.
    {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
      const page = await context.newPage();
      const errors = []; page.on('pageerror', error => errors.push(error.message));
      await page.addInitScript(() => {
        window.__spotlightResourceCounts = { contexts: 0, glContexts: new Set(), raf: 0, activeRaf: new Set(), listeners: new Set() };
        const add = EventTarget.prototype.addEventListener;
        const remove = EventTarget.prototype.removeEventListener;
        EventTarget.prototype.addEventListener = function(type, callback, options) {
          // Playwright installs its own persistent hit-target listeners; count application ownership only.
          if (callback && new Error().stack?.includes('/_app/') && (this === window || this === document || this instanceof HTMLCanvasElement)) {
            const capture = typeof options === 'boolean' ? options : !!options?.capture;
            const listeners = window.__spotlightResourceCounts.listeners;
            if (![...listeners].some(listener => listener.target === this && listener.type === type && listener.callback === callback && listener.capture === capture)) {
              listeners.add({ target: this, type, callback, capture });
            }
          }
          return add.call(this, type, callback, options);
        };
        EventTarget.prototype.removeEventListener = function(type, callback, options) {
          if (callback) {
            const capture = typeof options === 'boolean' ? options : !!options?.capture;
            for (const listener of window.__spotlightResourceCounts.listeners) {
              if (listener.target === this && listener.type === type && listener.callback === callback && listener.capture === capture) {
                window.__spotlightResourceCounts.listeners.delete(listener);
              }
            }
          }
          return remove.call(this, type, callback, options);
        };
        const original = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function(type, ...args) {
          const context = original.call(this, type, ...args);
          if (/^webgl/i.test(type) && context) {
            window.__spotlightResourceCounts.contexts++;
            window.__spotlightResourceCounts.glContexts.add(context);
          }
          return context;
        };
        const request = window.requestAnimationFrame.bind(window);
        window.requestAnimationFrame = callback => {
          const counts = window.__spotlightResourceCounts;
          counts.raf++;
          let id;
          id = request(time => { counts.activeRaf.delete(id); callback(time); });
          counts.activeRaf.add(id);
          return id;
        };
        const cancel = window.cancelAnimationFrame.bind(window);
        window.cancelAnimationFrame = id => { window.__spotlightResourceCounts.activeRaf.delete(id); return cancel(id); };
      });
      await openOverview(page, 'en'); await select(page, 'stegosaurus');
      const listenersBefore = await page.evaluate(() => window.__spotlightResourceCounts.listeners.size);
      const t = translations.en;
      await button(page, t.start).click(); await page.locator('.preview-stage canvas').waitFor();
      await page.waitForFunction(() => /ready|loaded|bereit|geladen/i.test(document.querySelector('.preview-status')?.textContent || ''), null, { timeout: 60000 });
      const touchCanvas = page.locator('.preview-stage canvas');
      await touchCanvas.scrollIntoViewIfNeeded();
      const initialTouchView = await touchCanvas.screenshot();
      let touchBounds = await touchCanvas.boundingBox();
      await swipe(page, { x: touchBounds.x + touchBounds.width * .3, y: touchBounds.y + touchBounds.height * .55 },
        { x: touchBounds.x + touchBounds.width * .65, y: touchBounds.y + touchBounds.height * .55 });
      assert(!initialTouchView.equals(await touchCanvas.screenshot()), 'Horizontal touch drag rotates the model');
      const scrollBefore = await page.evaluate(() => scrollY);
      touchBounds = await touchCanvas.boundingBox();
      await swipe(page, { x: touchBounds.x + touchBounds.width * .5, y: touchBounds.y + touchBounds.height * .8 },
        { x: touchBounds.x + touchBounds.width * .5, y: touchBounds.y + touchBounds.height * .2 });
      await page.waitForFunction(previous => scrollY > previous, scrollBefore);
      await touchCanvas.screenshot();
      const stableFrames = await page.evaluate(() => window.__spotlightResourceCounts.raf);
      await page.waitForTimeout(500);
      assert.equal(await page.evaluate(() => window.__spotlightResourceCounts.raf), stableFrames, 'Ready preview does not run an idle render loop');
      assert.equal(await page.locator('.preview-stage canvas').count(), 1);
      await button(page, t.close).click();
      await button(page, t.start).click(); await page.locator('.preview-stage canvas').waitFor();
      await page.waitForFunction(() => /ready|loaded|bereit|geladen/i.test(document.querySelector('.preview-status')?.textContent || ''), null, { timeout: 60000 });
      const created = await page.evaluate(() => window.__spotlightResourceCounts.contexts);
      assert.equal(created, 2, 'Each activation owns one WebGL context');
      await button(page, t.close).click();
      await page.waitForFunction(() => [...window.__spotlightResourceCounts.glContexts].every(context => context.isContextLost()));
      await page.waitForTimeout(1000);
      const quiet = await page.evaluate(() => ({ canvases: document.querySelectorAll('.preview-stage canvas').length, pendingFrames: window.__spotlightResourceCounts.activeRaf.size, listeners: window.__spotlightResourceCounts.listeners.size }));
      assert.equal(quiet.canvases, 0, 'No renderer canvas remains after teardown');
      assert(quiet.pendingFrames <= 1, `No continuing renderer RAF after teardown (pending=${quiet.pendingFrames})`);
      assert.equal(quiet.listeners, listenersBefore, 'Spotlight removes window/document/canvas listeners after teardown');
      await button(page, t.start).click();
      await page.locator('.preview-stage canvas').waitFor();
      await page.waitForFunction(() => /ready|loaded|bereit|geladen/i.test(document.querySelector('.preview-status')?.textContent || ''), null, { timeout: 60000 });
      await page.goBack();
      await page.locator('.spotlight-preview').waitFor({ state: 'hidden' });
      assert.equal(await page.locator('#row-stegosaurus').getAttribute('aria-current'), 'true', 'Mobile back returns to results with the chosen species restored');
      assert.equal(await page.locator('.preview-stage canvas').count(), 0);
      await page.getByRole('link', { name: 'Deutsch', exact: true }).click();
      await page.waitForURL('**/de/overview/**');
      assert.equal(await page.locator('.spotlight-preview').isVisible(), false, 'Locale navigation retains the results panel');
      assert.equal(errors.length, 0, errors.join('\n'));
      await snapshot(page, 'mobile-back-selection-reset');
      results.push('Mobile horizontal touch rotation and vertical page scrolling, repeated context disposal, no idle RAF or application listener growth, active-preview back, selection and locale navigation passed');
      await context.close();
    }

    // Recoverable fetch/decode/WebGL failures and retry of the same species.
    {
      const context = await browser.newContext();
      const page = await context.newPage();
      await openOverview(page, 'en'); await select(page, 'stegosaurus'); const t = translations.en;
      let attempts = 0;
      await page.route('**/stegosaurus.glb', route => { attempts++; return attempts === 1 ? route.abort('failed') : route.continue(); });
      await button(page, t.start).click();
      await button(page, t.retry).waitFor(); await button(page, t.retry).click();
      await page.waitForFunction(() => /ready|loaded|bereit|geladen/i.test(document.querySelector('.preview-status')?.textContent || ''), null, { timeout: 60000 });
      assert.equal(attempts, 2, 'Fetch retry reloads the same selected GLB');
      await page.unroute('**/stegosaurus.glb');
      await button(page, t.close).click();
      await page.route('**/stegosaurus.glb', async route => {
        const response = await route.fetch();
        await route.fulfill({ response, headers: { ...response.headers(), 'access-control-allow-origin': 'https://disallowed.example' } });
      });
      await button(page, t.start).click();
      await button(page, t.retry).waitFor();
      assert(await page.locator('#spotlight img').isVisible(), 'CORS failure retains the real poster');
      assert(await page.locator('.explore-link').isVisible(), 'CORS failure retains exhibit navigation');
      await page.unroute('**/stegosaurus.glb');
      await button(page, t.retry).click();
      await page.locator('.preview-controls').waitFor();
      await button(page, t.close).click();
      await select(page, 'ankylosaurus');
      let decodeAttempts = 0;
      await page.route('**/ankylosaurus.glb', route => { decodeAttempts++; return decodeAttempts === 1 ? route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: 'not a glb' }) : route.continue(); });
      await button(page, t.start).click(); await button(page, t.retry).waitFor();
      await button(page, t.retry).click();
      await page.waitForFunction(() => /ready|loaded|bereit|geladen/i.test(document.querySelector('.preview-status')?.textContent || ''), null, { timeout: 60000 });
      assert.equal(decodeAttempts, 2, 'Decode retry reloads same selected GLB');
      await page.unroute('**/ankylosaurus.glb');
      await page.locator('.preview-stage canvas').evaluate(canvas => canvas.getContext('webgl2').getExtension('WEBGL_lose_context').loseContext());
      await button(page, t.retry).waitFor();
      await button(page, t.retry).click();
      await page.waitForFunction(() => /ready|loaded|bereit|geladen/i.test(document.querySelector('.preview-status')?.textContent || ''), null, { timeout: 60000 });
      assert.equal(await page.locator('.preview-stage canvas').count(), 1, 'Context-loss Retry restores the selected specimen');
      await button(page, t.close).click(); await context.close();
      results.push('Failed fetch, mismatched CORS headers, invalid-GLB decode and actual WebGL context loss each retain fallback/navigation and recover through same-species Retry');
    }

    // A browser without WebGL gets a localized recoverable state; Retry succeeds if WebGL later returns.
    {
      const context = await browser.newContext();
      await context.addInitScript(() => {
        const original = HTMLCanvasElement.prototype.getContext;
        window.__spotlightWebglAvailable = false;
        HTMLCanvasElement.prototype.getContext = function(type, ...args) {
          if (/^webgl/i.test(type) && !window.__spotlightWebglAvailable) return null;
          return original.call(this, type, ...args);
        };
      });
      const page = await context.newPage(); await openOverview(page, 'de'); await select(page, 'stegosaurus');
      await button(page, translations.de.start).click(); await button(page, translations.de.retry).waitFor();
      assert.match(await page.locator('.preview-status').innerText(), /nicht verfügbar|Grafikkontext ging verloren/i, 'German WebGL failure is localized');
      await page.evaluate(() => { window.__spotlightWebglAvailable = true; });
      await button(page, translations.de.retry).click();
      await page.waitForFunction(() => /ready|loaded|bereit|geladen/i.test(document.querySelector('.preview-status')?.textContent || ''), null, { timeout: 60000 });
      assert.equal(await page.locator('.preview-stage canvas').count(), 1);
      await snapshot(page, 'de-webgl-retry');
      await button(page, translations.de.close).click(); await context.close();
      results.push('German no-WebGL unavailable state and same-species Retry after WebGL becomes available passed');
    }
    results.push('All spotlight browser assertions passed. Production-host CORS and physical-device GPU behavior are not exercised by this local static/SwiftShader run.');
  } finally {
    await fs.writeFile(`${evidence}/browser-results.txt`, results.join('\n') + '\n');
    await browser.close();
    console.log(results.join('\n'));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });

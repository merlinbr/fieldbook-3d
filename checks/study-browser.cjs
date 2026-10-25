const { chromium } = require(process.env.FIELDBOOK_PLAYWRIGHT || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const base = process.env.FIELDBOOK_PREVIEW_URL || 'http://127.0.0.1:4173';
const evidence = 'media-dev/issue32-verification';
const locales = ['en', 'de'];
const results = [];
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
const toggle = page => page.locator('.study-chapter-toggle');
const chapters = page => page.locator('.study-chapters button');
const mediaState = page => page.evaluate(() => window.__studyAudio.map(a => ({ currentTime: a.currentTime, paused: a.paused, duration: a.duration })));
async function ready(page) {
  await page.waitForFunction(() => !!document.querySelector('.viewer-stage canvas') && !document.querySelector('.study-entry button')?.disabled);
}
async function open(page, locale) {
  const response = await page.goto(`${base}/${locale}/specimens/ankylosaurus/`, { waitUntil: 'domcontentloaded' });
  assert.equal(response.status(), 200);
  await ready(page);
}
async function start(page) {
  await page.locator('.study-entry button').click();
  await page.waitForFunction(() => window.__studyAudio.some(a => !a.paused && a.currentTime > 0.2));
}
async function waitForChapterAudio(page, start, paused) {
  await page.waitForFunction(({ start, paused }) => {
    const audio = window.__studyAudio[0];
    return audio && audio.paused === paused && Math.abs(audio.currentTime - start) < 0.75;
  }, { start, paused }, { timeout: 10000 });
}
async function snap(page, name) {
  await page.screenshot({ path: `${evidence}/${name}.png`, fullPage: true });
}
async function assertNoOverflow(page) {
  const dimensions = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, viewport: innerWidth }));
  assert(dimensions.width <= dimensions.viewport, `horizontal overflow: ${dimensions.width}px > ${dimensions.viewport}px`);
}
async function assertStudyLayout(page) {
  const invalidTargets = await page.locator('.study-ui button:visible, .study-transport button:visible, .study-timeline input:visible').evaluateAll(nodes => nodes.map(node => {
    const r = node.getBoundingClientRect();
    return { name: node.getAttribute('aria-label') || node.textContent.trim(), width: r.width, height: r.height };
  }).filter(target => target.width < 44 || target.height < 44));
  assert.deepEqual(invalidTargets, [], `visible study targets under 44px: ${JSON.stringify(invalidTargets)}`);
  const collisions = await page.evaluate(() => {
    const nodes = [...document.querySelectorAll('.study-ui > *, .study-transport > *, .study-playback > *, .study-controls > *')]
      .filter(node => node.getClientRects().length && getComputedStyle(node).visibility !== 'hidden' && getComputedStyle(node).clipPath === 'none');
    const result = [];
    for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) {
      if (nodes[i].contains(nodes[j]) || nodes[j].contains(nodes[i])) continue;
      const a = nodes[i].getBoundingClientRect(), b = nodes[j].getBoundingClientRect();
      if (a.width && a.height && b.width && b.height && a.left < b.right - 1 && a.right > b.left + 1 && a.top < b.bottom - 1 && a.bottom > b.top + 1) result.push(`${nodes[i].className || nodes[i].tagName}/${nodes[j].className || nodes[j].tagName}`);
    }
    return result;
  });
  assert.deepEqual(collisions, [], `study content overlaps: ${collisions.join(', ')}`);
  const clipped = await page.evaluate(() => [...document.querySelectorAll('.study-ui *')].filter(node => node.getClientRects().length && getComputedStyle(node).clipPath === 'none').flatMap(node => {
    const r = node.getBoundingClientRect();
    for (let parent = node.parentElement; parent && parent.closest('.study-ui'); parent = parent.parentElement) {
      const style = getComputedStyle(parent), p = parent.getBoundingClientRect();
      const clipsX = ['hidden', 'clip', 'auto', 'scroll'].includes(style.overflowX);
      const clipsY = ['hidden', 'clip', 'auto', 'scroll'].includes(style.overflowY);
      if ((clipsX && (r.left < p.left - 1 || r.right > p.right + 1)) || (clipsY && (r.top < p.top - 1 || r.bottom > p.bottom + 1))) return [node.className || node.tagName];
    }
    return [];
  }));
  assert.deepEqual(clipped, [], `study content clipped by overflow: ${clipped.join(', ')}`);
}

(async () => {
  await fs.mkdir(evidence, { recursive: true });
  const chapterStarts = {};
  for (const locale of locales) {
    const data = JSON.parse(await fs.readFile(`docs/assets/ankylosaurus-narration.${locale}.json`, 'utf8'));
    chapterStarts[locale] = data.chapters.map(chapter => chapter.start);
  }
  const browser = await chromium.launch({ executablePath: process.env.FIELDBOOK_BROWSER_EXECUTABLE || undefined, headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  try {
    results.push(`Chromium ${browser.version()}, preview ${base}, authored Ankylosaurus narration`);
    for (const locale of locales) {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
      // Instrument native Audio before navigation; the viewer constructs its controller during page load.
      await context.addInitScript(() => {
        const NativeAudio = window.Audio;
        window.__studyAudio = [];
        window.__studyEvents = [];
        window.Audio = class extends NativeAudio {
          constructor(...args) {
            super(...args);
            window.__studyAudio.push(this);
            for (const name of ['waiting', 'canplay', 'playing']) this.addEventListener(name, () => window.__studyEvents.push(name));
          }
        };
      });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await open(page, locale);
      await page.locator('.viewer-controls button').filter({ hasText: locale === 'en' ? 'Rotate left' : 'Nach links drehen' }).click();
      await page.locator('.viewer-controls button').filter({ hasText: locale === 'en' ? 'Zoom in' : 'Vergrößern' }).click();
      await page.waitForTimeout(200);
      const explorationPixels = await page.locator('.viewer-stage canvas').screenshot();
      await start(page);
      assert.equal(await chapters(page).count(), 4);
      const chapterToggle = toggle(page);
      const chapterList = page.locator('.study-chapters');
      assert.equal(await chapterToggle.getAttribute('aria-expanded'), 'false');
      assert.equal(await chapterList.getAttribute('id'), await chapterToggle.getAttribute('aria-controls'));
      assert.equal(await chapterList.isVisible(), false, 'mobile chapters start collapsed');
      assert.equal(await chapterList.getAttribute('hidden'), '', 'collapsed chapter group is excluded from accessibility tree');
      assert.equal(await chapters(page).evaluateAll(nodes => nodes.every(node => node.getClientRects().length === 0)), true, 'collapsed chapter buttons have no rendered/tab stops');
      const playingBeforeToggle = (await mediaState(page))[0];
      await chapterToggle.click();
      assert.equal(await chapterToggle.getAttribute('aria-expanded'), 'true');
      await page.keyboard.press('Escape');
      assert.equal(await chapterToggle.getAttribute('aria-expanded'), 'false');
      assert.equal(await page.evaluate(() => document.activeElement === document.querySelector('.study-chapter-toggle')), true, 'Escape returns focus to toggle');
      await chapterToggle.focus();
      await page.keyboard.press('Tab');
      assert.equal(await chapters(page).evaluateAll(nodes => nodes.includes(document.activeElement)), false, 'collapsed choices are excluded from keyboard navigation');
      await pause(200);
      const playingAfterToggle = (await mediaState(page))[0];
      assert.equal(playingAfterToggle.paused, false, 'toggle preserves playback');
      assert(Math.abs(playingAfterToggle.currentTime - playingBeforeToggle.currentTime) < 1, 'toggle does not seek');

      await chapterToggle.click();
      for (let index = 0; index < 4; index++) {
        const choice = chapters(page).nth(index);
        await choice.click();
        await page.waitForFunction(i => document.querySelectorAll('.study-chapters button')[i]?.getAttribute('aria-current') === 'step', index);
        await waitForChapterAudio(page, chapterStarts[locale][index], false);
        assert.equal(await chapterToggle.getAttribute('aria-expanded'), 'false', 'selecting a chapter collapses choices');
        assert.equal(await page.evaluate(() => document.activeElement === document.querySelector('.study-chapter-toggle')), true, 'chapter selection returns focus');
        assert.equal((await mediaState(page))[0].paused, false, `chapter ${index + 1} starts playing`);
        if (index < 3) await chapterToggle.click();
      }
      await page.locator('.study-play').click();
      await page.waitForFunction(() => window.__studyAudio.every(audio => audio.paused));
      for (let index = 0; index < 4; index++) {
        await chapterToggle.click();
        await chapters(page).nth(index).click();
        await page.waitForFunction(i => document.querySelectorAll('.study-chapters button')[i]?.getAttribute('aria-current') === 'step', index);
        await waitForChapterAudio(page, chapterStarts[locale][index], true);
        assert.equal((await mediaState(page))[0].paused, true, `chapter ${index + 1} starts paused`);
      }
      await chapterToggle.click();
      const pausedBeforeToggle = (await mediaState(page))[0];
      await chapterToggle.click();
      const pausedAfterToggle = (await mediaState(page))[0];
      assert.equal(pausedAfterToggle.paused, true, 'toggle preserves paused state');
      assert.equal(pausedAfterToggle.currentTime, pausedBeforeToggle.currentTime, 'toggle does not seek while paused');

      await page.locator('.study-play').click();
      await page.waitForFunction(() => window.__studyAudio.some(audio => !audio.paused));
      const range = page.locator('.study-timeline input');
      await range.focus();
      await range.press('ArrowRight');
      await pause(100);
      const beforeSkip = (await mediaState(page))[0].currentTime;
      assert(beforeSkip > 0, 'native timeline range seeks in real audio');
      await page.locator('.study-playback button').first().click();
      await page.waitForFunction(target => Math.abs(window.__studyAudio[0].currentTime - target) < 0.75, beforeSkip - 5);
      const afterBack = (await mediaState(page))[0].currentTime;
      assert(Math.abs(afterBack - (beforeSkip - 5)) < 0.75, 'Back seeks by five seconds');
      await page.locator('.study-playback button').last().click();
      await page.waitForFunction(target => Math.abs(window.__studyAudio[0].currentTime - target) < 0.75, beforeSkip);
      assert(Math.abs((await mediaState(page))[0].currentTime - beforeSkip) < 0.75, 'Forward restores the position after a five-second round trip');
      const captions = page.locator('.study-controls button[aria-pressed]');
      const caption = page.locator('.study-caption');
      const captionsWereEnabled = await captions.getAttribute('aria-pressed') === 'true';
      await captions.click();
      assert.equal(await captions.getAttribute('aria-pressed'), String(!captionsWereEnabled));
      assert.equal(await caption.count(), captionsWereEnabled ? 0 : 1);
      await captions.click();
      assert.equal(await captions.getAttribute('aria-pressed'), String(captionsWereEnabled));
      await page.waitForFunction(() => !!document.querySelector('.study-caption')?.textContent.trim());
      assert.equal(await caption.getAttribute('lang'), locale);

      await page.locator('.study-play').click();
      await page.waitForFunction(() => window.__studyAudio.every(audio => audio.paused));
      const explore = page.locator('.explore-controls');
      assert(await explore.isVisible(), 'paused narration exposes Explore controls');
      const inspectionBefore = await page.locator('.viewer-stage canvas').screenshot();
      const anatomy = page.locator('.anatomy-controls button:not([disabled])').first();
      await anatomy.click();
      assert.equal(await anatomy.getAttribute('aria-pressed'), 'true', 'paused inspection selects anatomy');
      await page.locator('.viewer-controls button').filter({ hasText: locale === 'en' ? 'Rotate left' : 'Nach links drehen' }).click();
      await page.locator('.viewer-controls button').filter({ hasText: locale === 'en' ? 'Zoom in' : 'Vergrößern' }).click();
      assert(!inspectionBefore.equals(await page.locator('.viewer-stage canvas').screenshot()), 'paused orbit and zoom change the rendered specimen');
      await page.screenshot({ path: `${evidence}/${locale}-paused-mobile.png`, fullPage: true });
      await page.locator('.study-play').focus();
      await page.locator('.study-play').click();
      await page.waitForFunction(() => window.__studyAudio.some(audio => !audio.paused));
      assert(await explore.isHidden(), 'resume hides exploration controls');
      assert.equal(await explore.locator(':focus').count(), 0, 'resume moves focus out of hidden controls');

      // Keep the layout/focus matrix independent of the recording's natural endpoint.
      await page.locator('.study-play').click();
      await page.waitForFunction(() => window.__studyAudio.every(audio => audio.paused) && !document.querySelector('.anatomy-controls button')?.disabled);
      for (const [name, viewport, fontSize, reducedMotion] of [
        ['portrait', { width: 390, height: 844 }, '100%', 'reduce'],
        ['landscape-mobile', { width: 740, height: 390 }, '100%', 'reduce'],
        ['landscape-wide', { width: 844, height: 390 }, '100%', 'reduce'],
        ['portrait-large-text', { width: 390, height: 844 }, '200%', 'reduce'],
        ['landscape-large-text', { width: 740, height: 390 }, '200%', 'reduce'],
        ['narrow-large-text', { width: 320, height: 720 }, '200%', 'reduce']
      ]) {
        await page.setViewportSize(viewport);
        await page.emulateMedia({ reducedMotion });
        await page.evaluate(size => { document.documentElement.style.fontSize = size; }, fontSize);
        await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        const visibleChapterChoices = viewport.width > 768 ? 4 : 0;
        await page.waitForFunction(expected => [...document.querySelectorAll('.study-chapters button')].filter(node => node.getClientRects().length).length === expected, visibleChapterChoices);
        await assertNoOverflow(page);
        await assertStudyLayout(page);
        assert.equal(await chapters(page).evaluateAll(nodes => nodes.filter(node => node.getClientRects().length).length), viewport.width > 768 ? 4 : 0, 'chapter choices follow the desktop/mobile breakpoint');
        await snap(page, `${locale}-${name}`);
      }
      await page.setViewportSize({ width: 844, height: 390 });
      const activeChapter = page.locator('.study-chapters button[aria-current="step"]');
      await page.waitForFunction(() => [...document.querySelectorAll('.study-chapters button')].filter(node => node.getClientRects().length).length === 4);
      await activeChapter.focus();
      assert.equal(await activeChapter.evaluate(node => node === document.activeElement), true);
      await page.setViewportSize({ width: 390, height: 844 });
      await page.waitForFunction(() => [...document.querySelectorAll('.study-chapters button')].every(node => node.getClientRects().length === 0));
      await page.waitForFunction(() => document.activeElement === document.querySelector('.study-chapter-toggle'));
      assert.equal(await page.evaluate(() => document.activeElement === document.querySelector('.study-chapter-toggle')), true, 'desktop chapter focus returns to mobile toggle');
      await page.locator('.study-chapter-toggle').focus();
      await page.setViewportSize({ width: 844, height: 390 });
      await page.waitForFunction(() => [...document.querySelectorAll('.study-chapters button')].filter(node => node.getClientRects().length).length === 4);
      await page.waitForFunction(() => {
        const active = document.querySelector('.study-chapters button[aria-current="step"]');
        return active === document.activeElement;
      });
      await page.setViewportSize({ width: 390, height: 844 });
      await page.waitForFunction(() => [...document.querySelectorAll('.study-chapters button')].every(node => node.getClientRects().length === 0));
      await page.waitForFunction(() => document.activeElement === document.querySelector('.study-chapter-toggle'));
      await page.evaluate(() => { document.documentElement.style.fontSize = '100%'; });
      await pause(200);

      // Exit restores the pre-study exploration view from actual canvas pixels.
      await page.locator('.study-controls button').last().click();
      await page.waitForFunction(() => !document.querySelector('.study-ui'));
      await pause(500);
      assert(explorationPixels.equals(await page.locator('.viewer-stage canvas').screenshot()), 'Exit restores the saved exploration camera/view');

      // The public locale link transfers study state, pauses narration and restores the real rendered view.
      await start(page);
      await page.locator('.study-play').click();
      await page.waitForFunction(() => window.__studyAudio.every(audio => audio.paused));
      const pausedPixels = await page.locator('.viewer-stage canvas').screenshot();
      const targetLocale = locale === 'en' ? 'de' : 'en';
      await page.locator('.language-nav a').filter({ hasText: targetLocale === 'de' ? 'Deutsch' : 'English' }).click();
      await ready(page);
      await page.waitForSelector('.study-ui');
      assert.equal(new URL(page.url()).pathname, `/${targetLocale}/specimens/ankylosaurus/`);
      assert.equal(new URL(page.url()).searchParams.has('study'), false, 'handoff query is consumed by the destination');
      await pause(500);
      assert(pausedPixels.equals(await page.locator('.viewer-stage canvas').screenshot()), 'canvas view is restored after locale handoff');
      await context.close();

      // Delay an actual audio response to observe native buffering, then allow the real media to play.
      const loadingContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
      await loadingContext.addInitScript(() => {
        const NativeAudio = window.Audio;
        const nativeReadyState = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'readyState').get;
        window.__studyAudio = []; window.__studyEvents = []; window.__forceStudyBuffering = false;
        window.Audio = class extends NativeAudio {
          constructor(...args) {
            super(...args);
            window.__studyAudio.push(this);
            Object.defineProperty(this, 'readyState', {
              configurable: true,
              get() { return window.__forceStudyBuffering ? 2 : nativeReadyState.call(this); }
            });
            for (const name of ['waiting', 'canplay', 'playing']) this.addEventListener(name, () => window.__studyEvents.push(name));
          }
        };
      });
      let releaseAudio;
      const audioGate = new Promise(resolve => { releaseAudio = resolve; });
      await loadingContext.route(/\.mp3(?:\?|$)/, async route => { await audioGate; await route.continue(); });
      const loadingPage = await loadingContext.newPage();
      await open(loadingPage, locale);
      await loadingPage.locator('.study-entry button').click();
      await loadingPage.waitForFunction(() => !!document.querySelector('.study-status')?.textContent.trim());
      assert.match(await loadingPage.locator('.study-status').textContent(), locale === 'en' ? /loading/i : /wird geladen/i, 'delayed media shows loading status');
      assert.equal((await mediaState(loadingPage))[0].paused, true, 'real narration waits for its delayed response');
      const loadingTime = (await mediaState(loadingPage))[0].currentTime;
      await pause(250);
      assert.equal((await mediaState(loadingPage))[0].currentTime, loadingTime, 'loading holds the narration clock');
      await snap(loadingPage, `${locale}-loading-mobile`);
      releaseAudio();
      await loadingPage.waitForFunction(() => window.__studyEvents.includes('playing'), null, { timeout: 15000 });
      assert(await loadingPage.evaluate(() => window.__studyEvents.includes('canplay')), 'real canplay event arrives when the delayed response loads');
      const stallStarted = Date.now();
      await loadingPage.evaluate(() => {
        window.__forceStudyBuffering = true;
        window.__studyAudio[0].dispatchEvent(new Event('waiting'));
      });
      await loadingPage.waitForFunction(locale => new RegExp(locale === 'en' ? 'buffering' : 'gepuffert', 'i').test(document.querySelector('.study-status')?.textContent ?? ''), locale, { timeout: 3000 });
      const bufferedStatus = (await loadingPage.locator('.study-time').textContent()).trim();
      await pause(250);
      assert.equal((await loadingPage.locator('.study-time').textContent()).trim(), bufferedStatus, 'controller timeline remains frozen during injected buffering');
      assert(Date.now() - stallStarted < 1000, 'synthetic waiting event is bounded and recorded separately from real-media playback');
      await snap(loadingPage, `${locale}-buffering-mobile`);
      await loadingPage.evaluate(() => {
        window.__forceStudyBuffering = false;
        window.__studyAudio[0].dispatchEvent(new Event('canplay'));
      });
      await loadingPage.waitForFunction(locale => new RegExp(locale === 'en' ? 'playing' : 'läuft', 'i').test(document.querySelector('.study-status')?.textContent ?? ''), locale, { timeout: 3000 });
      assert.equal((await mediaState(loadingPage))[0].paused, false, 'real playback continues after injected canplay recovery');
      await loadingContext.close();

      // A native error event while focus is inside the paused anatomy note must move focus to Retry.
      const noteErrorContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
      await noteErrorContext.addInitScript(() => {
        const NativeAudio = window.Audio; window.__studyAudio = [];
        window.Audio = class extends NativeAudio { constructor(...args) { super(...args); window.__studyAudio.push(this); } };
      });
      const noteErrorPage = await noteErrorContext.newPage();
      await open(noteErrorPage, locale);
      await start(noteErrorPage);
      await noteErrorPage.locator('.study-play').click();
      await noteErrorPage.waitForFunction(() => window.__studyAudio.every(audio => audio.paused));
      await noteErrorPage.locator('.anatomy-controls button:not([disabled])').first().click();
      const noteClose = noteErrorPage.locator('.anatomy-note button');
      await noteClose.focus();
      await noteErrorPage.evaluate(() => window.__studyAudio[0].dispatchEvent(new Event('error')));
      const retryName = locale === 'en' ? 'Retry narration' : 'Erzählung erneut versuchen';
      const noteRetry = noteErrorPage.getByRole('button', { name: retryName, exact: true });
      await noteRetry.waitFor({ state: 'visible', timeout: 10000 });
      await noteErrorPage.waitForFunction(name => document.activeElement?.textContent.trim() === name, retryName, { timeout: 10000 });
      assert.equal(await noteRetry.evaluate(node => node === document.activeElement), true, 'focused note error transfers focus to Retry');
      assert.equal(await noteErrorPage.locator('.explore-controls').isVisible(), false, 'error hides the focused exploration region');
      await noteErrorPage.locator('.study-chapter-toggle').focus();
      await noteErrorPage.setViewportSize({ width: 844, height: 390 });
      await noteErrorPage.waitForFunction(() => !document.querySelector('.study-chapter-toggle'));
      await noteErrorPage.waitForFunction(name => document.activeElement?.textContent.trim() === name, retryName);
      await noteErrorPage.setViewportSize({ width: 390, height: 844 });
      await noteErrorPage.waitForSelector('.study-chapter-toggle');
      await noteRetry.click();
      await noteRetry.waitFor({ state: 'hidden', timeout: 10000 });
      assert.equal((await mediaState(noteErrorPage))[0].paused, true, 'Retry after note error remains paused');
      await noteErrorPage.locator('.study-play').click();
      await noteErrorPage.waitForFunction(() => window.__studyAudio.some(audio => !audio.paused && audio.currentTime > 0.2));
      await noteErrorPage.locator('.study-controls button').last().click();
      await noteErrorPage.waitForFunction(() => !document.querySelector('.study-ui'));
      await noteErrorContext.close();

      // A one-shot real-media network failure exercises error focus, paused Retry, explicit Play and Exit.
      const faultContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
      await faultContext.addInitScript(() => {
        const NativeAudio = window.Audio; window.__studyAudio = [];
        window.Audio = class extends NativeAudio { constructor(...args) { super(...args); window.__studyAudio.push(this); } };
      });
      let failed = false;
      await faultContext.route(/\.mp3(?:\?|$)/, route => {
        if (!failed) { failed = true; return route.abort(); }
        return route.continue();
      });
      const errorPage = await faultContext.newPage();
      await open(errorPage, locale);
      await errorPage.locator('.study-entry button').click();
      const retry = errorPage.getByRole('button', { name: retryName, exact: true });
      await retry.waitFor({ state: 'visible', timeout: 10000 });
      assert.equal(failed, true, 'error came from an intercepted real recording request');
      await errorPage.waitForFunction(name => document.activeElement?.textContent.trim() === name, retryName, { timeout: 10000 });
      assert.equal(await retry.evaluate(node => node === document.activeElement), true, 'error recovery focuses Retry');
      assert.equal(await errorPage.locator('.explore-controls').isVisible(), false, 'error hides Explore controls');
      assert.equal(await errorPage.evaluate(() => document.querySelector('.explore-controls')?.contains(document.activeElement)), false, 'error focus is outside hidden Explore controls');
      await snap(errorPage, `${locale}-error-mobile`);
      await faultContext.unroute(/\.mp3(?:\?|$)/);
      await retry.click();
      await retry.waitFor({ state: 'hidden', timeout: 10000 });
      assert.equal((await mediaState(errorPage))[0].paused, true, 'Retry loads narration without auto-playing');
      await errorPage.locator('.study-play').click();
      await errorPage.waitForFunction(() => window.__studyAudio.some(audio => !audio.paused && audio.currentTime > 0.2));
      await errorPage.locator('.study-controls button').last().click();
      await errorPage.waitForFunction(() => !document.querySelector('.study-ui'));
      assert(await errorPage.locator('.study-entry button').isVisible(), 'Exit returns to study entry');
      await faultContext.close();

      // Normal completion is driven by the real media element and controller end event.
      const completionContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
      await completionContext.addInitScript(() => {
        const NativeAudio = window.Audio; window.__studyAudio = [];
        window.Audio = class extends NativeAudio { constructor(...args) { super(...args); window.__studyAudio.push(this); } };
      });
      const completionPage = await completionContext.newPage();
      await open(completionPage, locale);
      await completionPage.waitForTimeout(500);
      const completionPixels = await completionPage.locator('.viewer-stage canvas').screenshot();
      await start(completionPage);
      await completionPage.evaluate(() => { const audio = window.__studyAudio.find(item => !item.paused); if (audio?.duration) audio.currentTime = audio.duration - 0.15; });
      await completionPage.waitForFunction(() => !document.querySelector('.study-ui'), null, { timeout: 10000 });
      assert(await completionPage.locator('.study-entry button').isVisible(), 'natural completion returns to study entry');
      await pause(500);
      assert(completionPixels.equals(await completionPage.locator('.viewer-stage canvas').screenshot()), 'natural completion restores saved exploration view');
      await completionContext.close();
      assert.equal(errors.length, 0, errors.join('\n'));
      results.push(`${locale}: real-media loading/buffering, chapters and authored starts, keyboard/focus, seek/skip/captions, paused inspection/resume, responsive layouts, saved-view and locale restoration, error/Retry/Exit, natural completion passed`);
    }
  } finally {
    await fs.writeFile(`${evidence}/study-browser-results.txt`, results.join('\n') + '\n');
    await browser.close();
    console.log(results.join('\n'));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });

const { chromium } = require(process.env.FIELDBOOK_PLAYWRIGHT || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const base = process.env.FIELDBOOK_PREVIEW_URL || 'http://127.0.0.1:4173';
const evidence = 'media-dev/issue16-verification';
const texts = {
  en: { head:'Head', plates:'Dorsal plates', spikes:'Tail spikes', close:'Close note', scale:'Scale comparison', reset:'Reset view', left:'Rotate left', right:'Rotate right', start:'Start field study', play:'Play', exit:'Exit to Explore', other:'Explore Stegosaurus', pause:'Pause' },
  de: { head:'Kopf', plates:'Rückenplatten', spikes:'Schwanzstacheln', close:'Notiz schließen', scale:'Größenvergleich', reset:'Ansicht zurücksetzen', left:'Nach links drehen', right:'Nach rechts drehen', start:'Feldstudie starten', play:'Abspielen', exit:'Zurück zum Erkunden', other:'Stegosaurus erkunden', pause:'Pause' }
};
const results = [];
async function snap(page,name) { await page.screenshot({path:`${evidence}/${name}.png`,fullPage:true}); }
async function ready(page) { await page.waitForFunction(() => !!document.querySelector('.viewer-stage canvas') && !document.querySelector('.anatomy-controls button')?.disabled); }
async function go(page,path) { const r=await page.goto(base+path,{waitUntil:'domcontentloaded'}); assert.equal(r.status(),200); await ready(page); }
function button(page,name) { return page.getByRole('button',{name,exact:true}); }
async function noOverflow(page) { assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth), 'No horizontal overflow'); }

(async()=>{
  await fs.mkdir(evidence,{recursive:true});
  const browser=await chromium.launch({executablePath:process.env.FIELDBOOK_BROWSER_EXECUTABLE || undefined,headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  try {
    results.push(`Chromium ${browser.version()}, static preview ${base}, real HTTP GLBs on 5194`);
    for (const locale of ['en','de']) {
      const context=await browser.newContext({viewport:{width:1440,height:900}});
      const page=await context.newPage(); const errors=[]; const requests=[];
      page.on('pageerror',e=>errors.push(e.message)); page.on('request',r=>requests.push(r.url()));
      const t=texts[locale];
      for(const species of ['ankylosaurus','stegosaurus']) {
        await go(page,`/${locale}/specimens/${species}/`); await page.reload({waitUntil:'domcontentloaded'}); await ready(page);
        assert.match(await page.title(),new RegExp(species,'i')); await noOverflow(page);
        if(species==='ankylosaurus') {
          const anatomy=page.locator('.anatomy-controls button').first();await anatomy.focus();await page.keyboard.press('Enter');
          await page.locator('.anatomy-note').waitFor();await button(page,t.close).focus();await page.keyboard.press('Escape');
          assert(await anatomy.evaluate(el=>document.activeElement===el));
          await button(page,t.scale).click();const label=await page.locator('.scale-legend').innerText();assert.match(label,/8 m/);assert(!/Represented length|Dargestellte Länge/.test(label));
          await page.setViewportSize({width:390,height:844});await page.emulateMedia({reducedMotion:'reduce'});await noOverflow(page);await snap(page,`${locale}-ankylosaurus-mobile-scale`);
          await page.setViewportSize({width:1440,height:900});await page.emulateMedia({reducedMotion:'no-preference'});await button(page,t.reset).click();
        }
      }
      assert.equal(await page.locator('.study-entry,.study-ui,.study-transport').count(),0);
      assert.equal(await page.locator('.viewer-stage canvas').getAttribute('aria-label'),locale==='en'?'Interactive 3D Stegosaurus specimen':'Interaktives 3D-Exemplar eines Stegosaurus');
      const beforeAudio=requests.filter(u=>/\.mp3/.test(u)).length;
      // Keyboard-only selection and Escape return focus to the native region button.
      for(const region of ['head','plates','spikes']) {
        const control=button(page,t[region]); await control.focus(); await page.keyboard.press(region==='plates'?'Space':'Enter');
        await page.locator('.anatomy-note').waitFor(); assert.equal(await control.getAttribute('aria-pressed'),'true');
        await button(page,t.close).focus(); await page.keyboard.press('Escape');
        assert.equal(await control.evaluate(el=>document.activeElement===el),true);
        assert.equal(await page.locator('.anatomy-note').count(),0);
      }
      // Visible model markers use the real canvas pointer picking path.
      for(const region of ['head','plates','spikes']) {
        const marker=page.locator(`.anatomy-marker[data-region="${region}"]`); const box=await marker.boundingBox();
        assert(box,`${region} initial surface marker visible`); await page.mouse.click(box.x+box.width/2,box.y+box.height/2);
        await page.waitForFunction(id=>document.querySelector(`.anatomy-controls button[aria-pressed="true"]`)?.textContent===id,t[region]);
        await button(page,t.close).click();
      }
      await snap(page,`${locale}-three-quarter`);
      for(let i=0;i<3;i++)await button(page,t.right).click();
      await snap(page,`${locale}-side`);
      for(let i=0;i<12;i++)await button(page,t.left).click();
      await snap(page,`${locale}-opposite-side`);
      await button(page,t.reset).click();
      await button(page,t.scale).click();
      assert.match(await page.locator('.scale-legend').innerText(),locale==='en'?/Represented length: 9 m/:/Dargestellte Länge: 9 m/);
      assert.match(await page.locator('.scale-legend').innerText(),locale==='en'?/1\.7 m/:/1,7 m/);
      await button(page,t.plates).click(); await snap(page,`${locale}-scale-plates`);
      await button(page,t.reset).click(); assert.equal(await button(page,t.scale).getAttribute('aria-pressed'),'false');
      assert.equal(await button(page,t.plates).getAttribute('aria-pressed'),'true'); await button(page,t.close).click();
      await page.setViewportSize({width:390,height:844}); await page.emulateMedia({reducedMotion:'reduce'});
      for(const region of ['head','plates','spikes']) {
        await button(page,t[region]).click(); await page.waitForFunction(()=>document.querySelector('.anatomy-note')?.classList.contains('docked'));
        await noOverflow(page); await button(page,t.close).click();
      }
      await button(page,t.scale).click(); await snap(page,`${locale}-mobile-scale`); await noOverflow(page);
      await page.setViewportSize({width:844,height:390}); await noOverflow(page);
      await page.setViewportSize({width:390,height:844}); await button(page,t.reset).click();
      await page.locator('.language-nav a').filter({hasText:locale==='en'?'Deutsch':'English'}).click(); await ready(page);
      assert.match(page.url(),new RegExp(`/${locale==='en'?'de':'en'}/specimens/stegosaurus/`));
      assert.equal(requests.filter(u=>/\.mp3/.test(u)).length,beforeAudio);
      assert.equal(errors.length,0,errors.join('\n'));
      results.push(`${locale}: both species direct+refresh, Stegosaurus keyboard/pointer regions/focus, locale, scale/reset, 390x844 reduced-motion docking and resize passed`);
      await context.close();
    }
    // Touch emulation uses actual CDP touchStart/touchMove/touchEnd, not synthetic DOM pointer events.
    {
      const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
      const page=await context.newPage(); await go(page,'/en/specimens/stegosaurus/');
      await page.locator('.viewer-stage').scrollIntoViewIfNeeded();
      const marker=await page.locator('.anatomy-marker[data-region="plates"]').boundingBox(); assert(marker);
      await page.touchscreen.tap(marker.x+marker.width/2,marker.y+marker.height/2); await page.locator('.anatomy-note').waitFor();
      await button(page,'Close note').tap();
      const cdp=await context.newCDPSession(page); const stage=await page.locator('.viewer-stage').boundingBox();
      const x=stage.x+stage.width/2,y=stage.y+stage.height/2;
      await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:1}]});
      await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+80,y:y+10,id:1}]});
      await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
      assert.equal(await page.locator('.anatomy-note').count(),0);
      await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:x-35,y,id:1},{x:x+35,y,id:2}]});
      await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x-65,y,id:1},{x:x+65,y,id:2}]});
      await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
      assert.equal(await page.locator('.anatomy-note').count(),0); await noOverflow(page); await snap(page,'touch-after-drag-pinch');
      results.push('Touch emulation: real canvas marker tap, orbit drag and two-finger pinch without accidental selection passed');
      await context.close();
    }
    // Incoming handoffs must not create Audio or transfer any study into Stegosaurus.
    {
      const context=await browser.newContext(); const page=await context.newPage(); const audio=[];
      await context.addInitScript(()=>{const Audio=window.Audio;window.__audios=[];window.Audio=class extends Audio{constructor(...args){super(...args);window.__audios.push(this);}};});
      page.on('request',r=>{if(/\.mp3/.test(r.url()))audio.push(r.url());});
      const en=JSON.parse(await fs.readFile('docs/assets/ankylosaurus-narration.en.json','utf8'));
      const raw=JSON.stringify({specimen:'ankylosaurus',version:en.id,time:0,chapter:'meet',captions:true,view:{azimuth:0,polar:1,zoom:1}});
      for(const values of [[raw],['malformed'],[raw,raw]]) {
        const params=new URLSearchParams({keep:'1'});for(const value of values)params.append('study',value);
        await go(page,`/en/specimens/stegosaurus/?${params}`);
        await page.waitForFunction(()=>!new URL(location.href).searchParams.has('study'));
        assert.equal(new URL(page.url()).searchParams.get('keep'),'1');
        assert.equal(await page.evaluate(()=>window.__audios.length),0);assert.equal(await page.locator('.study-entry,.study-ui').count(),0);
      }
      assert.equal(audio.length,0);results.push('Valid/malformed/repeated incoming study queries consumed, keep=1 retained, zero Audio objects and narration requests');
      await context.close();
    }
    // Loading, failed fetch, retry and unavailable WebGL use fresh real browser documents.
    {
      const context=await browser.newContext();const page=await context.newPage();
      let release;const gate=new Promise(r=>release=r);
      await page.route('**/stegosaurus.glb',async route=>{await gate;await route.continue();});
      await page.goto(base+'/en/specimens/stegosaurus/',{waitUntil:'domcontentloaded'});
      await page.waitForFunction(()=>!!document.querySelector('canvas'));
      assert.match(await page.locator('.viewer-status').innerText(),/Loading/);release();await ready(page);await page.unroute('**/stegosaurus.glb');
      await page.route('**/stegosaurus.glb',route=>route.abort('failed'));
      await page.reload({waitUntil:'domcontentloaded'});await page.getByText('The specimen could not be loaded.',{exact:false}).waitFor();await snap(page,'fetch-error');
      await page.unroute('**/stegosaurus.glb');await button(page,'Reload page').click();await ready(page);
      await context.close();
      const unavailable=await browser.newContext();await unavailable.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return /webgl/i.test(type)?null:original.call(this,type,...args);};});
      const p=await unavailable.newPage();await p.goto(base+'/de/specimens/stegosaurus/',{waitUntil:'domcontentloaded'});
      await p.getByText('Die 3D-Ansicht ist in diesem Browser nicht verfügbar.',{exact:false}).waitFor();
      assert.equal(await p.locator('.specimen-navigation a').count(),1);await snap(p,'webgl-unavailable-de');await unavailable.close();
      results.push('Delayed HTTP loading, intercepted failed fetch, recovered reload and WebGL-unavailable context passed; real external CORS not tested');
    }
    // Ankylosaurus real recordings, chapter navigation, locale handoff and document teardown.
    for(const locale of ['en','de']) {
      const context=await browser.newContext({viewport:{width:1440,height:900}});
      await context.addInitScript(()=>{const Audio=window.Audio;window.__audios=[];window.Audio=class extends Audio{constructor(...args){super(...args);window.__audios.push(this);}};});
      const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
      await go(page,`/${locale}/specimens/ankylosaurus/`);const t=texts[locale];
      await page.waitForFunction(()=>!document.querySelector('.study-entry button')?.disabled);
      await button(page,t.start).click();await page.waitForFunction(()=>window.__audios.some(a=>!a.paused&&a.currentTime>0));
      await snap(page,`${locale}-ankylosaurus-study`);
      const chapters=page.locator('.study-chapters button');assert.equal(await chapters.count(),4);
      for(let i=0;i<4;i++){await chapters.nth(i).click();await page.waitForFunction(n=>document.querySelectorAll('.study-chapters button')[n]?.getAttribute('aria-current')==='step',i);}
      assert(await page.locator('.study-ui').innerText());
      await page.locator('.language-nav a').filter({hasText:locale==='en'?'Deutsch':'English'}).click();await ready(page);
      await page.waitForFunction(()=>!!document.querySelector('.study-transport'));
      assert.equal(await page.evaluate(()=>window.__audios.every(a=>a.paused)),true);
      const target=locale==='en'?'de':'en';
      assert.match(page.url(),new RegExp(`/${target}/specimens/ankylosaurus/`));
      assert(!new URL(page.url()).searchParams.has('study'));
      // Resume through the actual native control, then species-link away during playback.
      await page.locator('.study-play').click();await page.waitForFunction(()=>window.__audios.some(a=>!a.paused));
      await page.locator('.specimen-navigation a').click();await ready(page);
      assert.equal(new URL(page.url()).pathname,`/${target}/specimens/stegosaurus/`);assert.equal(new URL(page.url()).search,'');
      assert.equal(await page.evaluate(()=>window.__audios.length),0);assert.equal(await page.locator('.study-transport').count(),0);
      await page.locator('.specimen-navigation a').click();await ready(page);assert.equal(await page.locator('.study-transport').count(),0);
      const link=page.locator('.specimen-navigation a');const popupPromise=context.waitForEvent('page');await link.click({button:'middle'});const popup=await popupPromise;await popup.waitForLoadState('domcontentloaded');await ready(popup);await popup.close();
      assert.equal(errors.length,0,errors.join('\n'));results.push(`${locale}: real recording playback, four chapters, paused locale handoff, resume/species teardown/return and modified-click new tab passed`);
      await context.close();
    }
    const root=await browser.newPage();await root.goto(base+'/',{waitUntil:'domcontentloaded'});await root.waitForURL('**/en/specimens/ankylosaurus/');await ready(root);await root.close();
    results.push('Root redirect preserved. All browser acceptance assertions passed.');
  } finally {await fs.writeFile(`${evidence}/browser-results.txt`,results.join('\n')+'\n');await browser.close();console.log(results.join('\n'));}
})().catch(e=>{console.error(e);process.exitCode=1;});

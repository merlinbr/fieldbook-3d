# Fieldbook 3D

The English/German **Field Guide + Spotlight Overview** at `/en/overview/` and `/de/overview/` is the collection entry point. `/` leads to English Overview. It lists only the two real specimens, uses still images without WebGL or narration, and links to the existing detailed exhibits. On narrow screens, selecting a row opens the Spotlight; **Back to results** restores selection, results position and focus.

Two explorable, resting exhibits, **Ankylosaurus** and **Stegosaurus**: prerendered English/German content, a shared browser-only Three.js GLB viewer, warm lighting and a simple plinth. Ankylosaurus Start plays Meet → Scale → Armor → World through a complete English or German recording, with matching captions and chapter navigation. Scale shows a calibrated 8 m animal, a generated 1.7 m human reference, and a head-to-tail length guide. World returns to a wider specimen view with localized present-day North America wording and a Late Cretaceous time band marking 68–66 million years ago. Language changes restore a paused study and preserve its original return-to-Explore view. Cinema presentation adds focused warm lighting and restrained drifting dust; reduced motion retains the lighting without particles.

Stegosaurus is exploration-only, with head, dorsal-plate and tail-spike inspection. Its comparison represents a **9 m** animal alongside the same 1.7 m human, explicitly qualified as an illustrative scale for a stylized reconstruction. It has no narration, captions or field-study controls. Reciprocal exhibit links retain the language and leave study playback behind. The [asset notes](docs/assets/stegosaurus.md#represented-scale-and-anatomy-sources) document the scale choice and anatomy sources.

## Issue #1 delivery gate — 2026-10-04

Historical milestone: [Issue #1](https://github.com/merlinbr/fieldbook-3d/issues/1) has no comments or native blocking issues at the prerequisite review. It delivered Meet playback only, not the later four-chapter navigation/visual acceptance. [Issue #2](https://github.com/merlinbr/fieldbook-3d/issues/2) extends the same controller through Scale and ends at the Armor boundary; the acceptance below supersedes the Meet-only playback endpoint without rewriting the earlier observations.

The user explicitly approved the full four-section English script unchanged before production recording and approved all four regenerated segments after listening again. The selected voice is ElevenLabs **Rowan — Gentle, Soft-Spoken & Warm**, ID `kLhAstPcnnPxqzk6gS5i`; the owner confirmed generation on **2026-10-04 after Starter activation**. The selected full track is `media-dev/ankylosaurus-en.mp3` (**51.643938 seconds**); prior Inworld and free-plan ElevenLabs alternatives remain preserved but unselected. The source-controlled [complete approved version](docs/assets/ankylosaurus-narration.en.json) contains recording-derived chapters, 16 captions, visual cues, and non-secret provenance.

The recording intake and **real narrated Meet static-exhibit acceptance are complete locally**. [Recording documentation](docs/assets/ankylosaurus-narration.md) records the owner's audition, generation/paid-plan evidence reference, applicable ElevenLabs terms/restrictions, voluntary attribution, exact media hash, and alignment method. Billing evidence, credentials, model, and audio remain outside Git/application output; there is no runtime ElevenLabs integration.

The viewer integrates native audio, composed framing, focused lighting, pause-to-inspect, resume, default captions, explicit Retry/Exit, and saved-view restoration. At that milestone only Meet played, ending at `scale.start = 13.635918367` seconds. The current build plays all four chapters to the recording endpoint at 51.643938 seconds. Missing complete metadata still disables Start with a localized explanation. German UI visibly labels English narration and uses matching English captions. Chapter navigation and a German recording remain undelivered; production hosting/model publication rights and physical-device testing remain separate limits.

## Run locally

Requires Node 24 LTS and npm.

```sh
npm install
npm run media:dev
```

In a second terminal:

```sh
npm run dev
```

Open `/en/overview/` or `/de/overview/` to choose a specimen, or visit `/en/specimens/ankylosaurus/`, `/de/specimens/ankylosaurus/`, `/en/specimens/stegosaurus/` or `/de/specimens/stegosaurus/` directly. `/` redirects to English Overview and contains a fallback link. Locale links reload the same page in the chosen language. During an Ankylosaurus study, a validated destination-link query transfers paused context and is consumed without another reload. Species links reload the destination exhibit without copying study context; navigating back starts ordinary exploration. No saved preferences, cookies, or language detection are required.

### Shared specimen viewer

`SpecimenViewer.svelte` accepts `config`, localized `text`, and an explicit `study` input. Shared contracts and validation live in `src/lib/specimens/specimen-config.ts`; `ankylosaurus-config.ts` is the existing exhibit's geometry/scale configuration without environment imports. A configuration supplies stable region IDs, separate picking/highlight/bounds selectors, surface anchors, and an optional scale. Named subtrees can exclude mesh prefixes; whole-model prefixes can collect anatomy split across parents. Invalid configuration fails explicitly, while missing model regions remain unavailable.

For exploration-only specimens, set both configuration capability and viewer study input to `{ kind: 'none' }`. The viewer then omits all study controls/warnings, never constructs a narration controller, and consumes incoming study-query context without restoring a recording. Guided Ankylosaurus retains its published `armor`/`tailClub` cues, recording diagnostics, and English/German paused handoff.

The exploration **Scale comparison** toggle uses `scale.lengthMetres` for model calibration, guide, framing, and localized labels, alongside the existing 1.7 m human. A null scale omits comparison and metre labels; no default length is inferred. Ankylosaurus explicitly supplies 8 m. Reset leaves standalone comparison while preserving selected anatomy. Starting a guided study first restores ordinary exploration, and the study owns comparison until Exit, including while paused.

Run `npm run check`, `npm run check:exhibits`, `npm run check:camera`, `npm run check:anatomy`, and `npm run check:study` after changing configuration or viewer behavior. Anatomy checks exercise production Stegosaurus selectors, including all 19 plates across parent groups and the four spikes. `check:exhibits` also regenerates an isolated GLB and checks actual loaded membership, material restoration and represented scale. Run `npm run check:exhibit-pages` after building to verify all four localized pages, metadata and navigation. The issue #15 temporary route is gone; the permanent Stegosaurus exhibit now uses its own configuration and content.

The ignored `media-dev/ankylosaurus.glb` is a real export of the supplied example, not a generated substitute in the application. It is present in this local workspace but deliberately absent from Git. A fresh checkout needs that asset regenerated or a rights-cleared externally hosted model URL. See [asset provenance and regeneration](docs/assets/ankylosaurus.md). Preserve the supplied Ankylosaurus source and example dependencies. The approved [Stegosaurus model](#stegosaurus-model-preview) is tracked separately from the rest of the local example and does not change the Ankylosaurus export. Its exported GLB is loaded by the localized Stegosaurus exhibit routes.

`npm run media:dev` serves the fixed model and optional `media-dev/ankylosaurus-en.mp3` / `media-dev/ankylosaurus-de.mp3` endpoints on `http://127.0.0.1:5194`, with GET/HEAD, byte ranges, and CORS. Missing audio returns 404. It does not serve application files or expose a directory listing. This workspace's ignored `.env` is configured with both complete versions. For a fresh checkout, set `PUBLIC_ANKYLOSAURUS_STUDY_VERSION` to the [complete English JSON](docs/assets/ankylosaurus-narration.en.json), not just its URL; see [English configuration](docs/assets/ankylosaurus-narration.md#configure-the-approved-recording). Optionally set `PUBLIC_ANKYLOSAURUS_STUDY_VERSION_DE` to the [complete German JSON](docs/assets/ankylosaurus-narration.de.json); see [German intake and configuration](docs/assets/ankylosaurus-narration.de.md). Absent German configuration uses visibly labeled English narration with English captions in the German interface. Invalid configured data or a recording error stays explicit. No default or fabricated timings are used. Keep the media process running; restart an older responder to load both audio routes.

### Compact mobile study — issue #32

At the existing **48rem** breakpoint, both Ankylosaurus exhibits group the current chapter, narration language, caption, timeline and transport into one player below the model. Mobile transport uses concise visible labels with full accessible names. Loading, paused and error information remains visible; routine playing status stays available to assistive technology without repeating it visually. Scale's numbered length/human legend and World's location/time band remain in normal flow with their chapter.

**Chapters / Kapitel** starts collapsed. Its inline list marks the current chapter; choosing one seeks to its authored beginning, preserves the playing/paused request, closes the list and returns focus to the disclosure button. Escape or the button closes it without seeking. Hidden choices leave keyboard navigation and the accessibility tree. Desktop retains the four visible chapter choices.

Mobile exploration controls disappear while guided playback owns the scene and return when paused. Resume clears inspection and transfers focus away from disappearing notes/controls. Retry and Exit remain accessible on errors. The viewer, native-audio clock, recordings, saved-view restoration and language handoff are unchanged; Stegosaurus remains exploration-only.

Matched local captures at **390×844**, paused at Meet's beginning with the model stage aligned to the viewport top, retain the same **438.875px** stage height. The vertical extent needed to include the model, caption, timeline and primary transport is:

| Interface | Before (CSS px) | After (CSS px) |
|---|---:|---:|
| English | 900 | 721 |
| German | 979 | 745 |

Before/after captures and geometry are under ignored `media-dev/issue32-verification/`. Playing captures also show model, captions and Pause together; the shorter document can clamp scrolling before the stage reaches the viewport top, recorded separately in `after.json`. Enlarged text is allowed to wrap and scroll rather than clipping content or shrinking controls.

Run `npm run check:study-browser` against a fresh local static preview and the real-media host, with the same external Playwright/browser/preview overrides as `check:browser`. It exercises EN/DE authored chapter starts, disclosure and breakpoint focus, transport/captions, paused inspection, loading, error recovery, completion, language handoff and rendered saved-view restoration. Its portrait/landscape matrix includes 200% root text, reduced motion, overflow/clipping checks and at least 44×44px study targets. Delayed loading uses actual HTTP media; the bounded buffering probe uses synthetic `waiting`/`canplay` events and a test-only readiness override on the real Audio element, not a certified physical network stall.

Observed on 2026-10-25: type checking (zero errors/warnings), camera/anatomy/study regressions, the local static build, localized static-page checks, the focused study browser suite and the existing exhibit browser suite passed. Final browser checks include mobile/desktop chapter-focus transfer, focused-note error recovery, EN/DE saved-view restoration, and Stegosaurus touch/exploration compatibility. Existing large-chunk and terminal-color build warnings remain unsuppressed.

Evidence limits: desktop Chromium, local HTTP GLB/MP3 delivery, software rendering and browser/device emulation. No physical phone, Safari/iOS, actual screen reader, production-host delivery or subjective narration audition is certified by these checks.

## Stegosaurus model preview

The approved low-poly `Stegosaurus stenops` source is narrowly tracked under `example project/low-poly/`: `stegosaurus.js`, `model-geometry.js`, and `walk-cycle.js`. The rest of that local example collection remains ignored. The standalone check below carries the Stegosaurus geometry/anatomy/gait assertions from the local collection check; it does not require the other dinosaur or environment sources.

From a fresh checkout, using Node 24 and the root lockfile:

```sh
npm ci
npm run check:stegosaurus
npm run preview:stegosaurus
```

Open the URL printed by Vite. Use the side, opposite-side, three-quarter, and top buttons, drag to orbit, scroll to zoom, or toggle Walk. The preview starts at rest, uses a neutral ground without obstructing scenery, and needs no `.env`, media server, GLB, or nested example installation. `npm run build:stegosaurus` builds this standalone preview to ignored `dist/stegosaurus-preview/`; it is not part of the application build.

The model uses **2,976 of 3,000 triangles**: a fuller torso and neck transition, substantial hips and planted feet, nineteen thin staggered dorsal plates, four tail spikes, thirty-six shallow flank scales, brows, and nostrils. Narrow plate roots, tapered crowns, varied lean, and related tan shades keep overlapping plates distinct. Materials retain the olive/cream/tan palette and flat shading. Neck and tail plates follow their respective pivots; the check covers finite/nondegenerate geometry, alternating plates, ground clearance, three supporting feet during a full gait, and return to rest.

The nineteen-plate/four-spike count references the Natural History Museum's [S. stenops specimen, Sophie](https://www.nhm.ac.uk/press-office/press-releases/world_s-most-complete-stegosaurus-goes-on-show.html). Proportions, colors, skin-scale placement, and other soft tissue are artistic choices, not a validated anatomical restoration. The standalone model preview has no narration or scientific scale calibration. The localized application exhibit consumes the exported GLB with a separately documented 9 m represented length; it does not claim to reconstruct Sophie.

## Stegosaurus GLB — issue #14

The tracked generator also reproduces the resting GLB with the root lockfile:

```sh
npm run export:stegosaurus
npm run check:stegosaurus-export
npm run check:media
```

The export is ignored `media-dev/stegosaurus.glb`. Restart `npm run media:dev` to serve its fixed `http://127.0.0.1:5194/stegosaurus.glb` endpoint with GET/HEAD, ranges, CORS, and an explicit missing-model response. Existing Ankylosaurus media uses the same responder. No directory access or asset binary is added to the application.

For visual verification, run `npm run preview:stegosaurus` and open `/compare.html` on the printed preview URL. It loads the real GLB from the separate media host and renders it beside the canonical source under identical lighting and camera settings. The side, opposite-side, and three-quarter controls affect both views. See [source provenance, exact regeneration, measured bounds, and verification](docs/assets/stegosaurus.md).

`PUBLIC_STEGOSAURUS_MODEL_URL` is declared and illustrated in `.env.example` and is consumed by both localized Stegosaurus routes. Stegosaurus publication authorization and production hosting/URL are **unconfirmed**. The shared model-URL policy requires an absolute external HTTP(S) URL without credentials or loopback in production, and the asset host must allow CORS from the application origin. Local export/preview is not production deployment.

## Overview — issues #24, #25, #26 and #30

The desktop Overview uses a light Field Guide index (36%) beside a dark Spotlight (64%). At **760 CSS px and below**, it switches between results and Spotlight rather than squeezing both panes together. The existing palette, Newsreader and Source Sans 3 apply in both languages. Local name search, compact diet/period filters and pagination support larger collections; the production catalog still contains only Ankylosaurus and Stegosaurus.

`src/lib/specimens/catalog.ts` is the renderer-independent collection. Stable specimen IDs, exhibit paths, poster references, diet/period categories, separate localized age wording, NHM sources and guided/exploration capabilities live there. `content.ts` supplies the same authoritative names, descriptions, reconstruction notes and anatomy copy to both catalog and exhibits. Importing the catalog does not import a model renderer or recording configuration. Ankylosaurus offers its existing guided study; Stegosaurus is exploration-only.

All six localized documents are prerendered; the four existing specimen URLs remain valid. Index rows are native exhibit links without JavaScript. With JavaScript, ordinary row activation updates only the Spotlight; modified clicks keep native link behavior. Brand and Overview links on either exhibit return to the localized collection. Locale navigation uses full documents.

Browsing state is transient URL/history state, not a saved preference: `#view=spotlight&specimen=stegosaurus&index=312&query=stenops&diet=herbivore&period=jurassic` records selection, mobile panel, results scroll position and discovery context (`page` is included above page one). Unknown specimen IDs select the first matching result; unknown categories and invalid page values normalize safely. Legacy `sort` parameters are discarded without losing the remaining valid context; names always appear alphabetically. Selection, filters, pagination and Back update history; typing replaces the current entry rather than adding one entry per keystroke. Back to results restores selected-row focus and saved results position, falling back to the index heading if the selected row is on another page. Locale links retain the fragment. Explore carries only this browsing context inside an `#overview=…` fragment so exhibit Overview links can restore it; study/playback queries are never transferred. No accounts, cookies, local/session storage or new backend are involved.

Posters are reproducible stills of the actual existing GLBs, not substitute artwork. Run `npm run prepare:posters` alongside `npm run media:dev`, download the two PNGs to ignored `media-dev/`, then use the external PNG endpoints. See [poster preparation, URL configuration and publication boundaries](docs/assets/overview-posters.md). Development defaults to the local media host. Production poster URLs are optional: unset URLs render text-only, failed images show a localized fallback, and names/descriptions/Explore remain usable. Configured poster URLs follow the existing HTTP(S), credential and non-loopback production policy. No generated media is copied into Git or application output, and no media publication or hosting authorization is implied.

Run `npm run check:overview` for catalog/category/capability, malformed-state/return-isolation and poster URL-policy checks. After a static build, `npm run check:exhibit-pages` covers Overview and all four exhibit documents, metadata and native links. The base Overview browser acceptance covered both locales at 1360/1024/390/320px, 200% text enlargement, keyboard selection and visible focus, mobile focus/scroll/history restoration, locale/exhibit returns, missing posters, no-JavaScript links, no model/audio/WebGL before activation, and the existing anatomy/scale/guided-study smoke. Generated screenshots stay in ignored `media-dev/`.

### Compact collection discovery — issues #26 and #30

`src/lib/overview/Overview.svelte` owns the shared production/verification surface. `catalog-query.ts` combines trimmed, case-insensitive common/scientific-name substring search **AND** diet **AND** period membership. Diet IDs are `herbivore`, `carnivore`, `omnivore`; native labels are Plants/Meat/Mixed (Pflanzen/Fleisch/Gemischt). Period IDs are `triassic`, `jurassic`, `cretaceous`, separate from localized late-period and approximate-age wording. A null diet or empty period list stays unspecified and appears only with that dimension unconstrained. Multiple period memberships match any selected member; age strings are never parsed.

Search stays visible beside the labeled **Filters / Filter** button. Its inline Diet/Period panel starts collapsed on each document load, exposes its relationship and expanded state, and excludes hidden controls from keyboard navigation. Diet uses mutually exclusive native toggle buttons: **All / Plants / Meat / Mixed** (**Alle / Pflanzen / Fleisch / Gemischt**). All clears only diet; Period remains a labeled dropdown. Changes apply immediately without closing the panel. Active constraints stay removable when collapsed; removing a diet/period chip then focuses Filters, not a hidden control. Clear all focuses search. Selected diet buttons use olive/light contrast, a separate keyboard outline, wrapping and at least 44px touch targets. Panel expansion is local UI state, not URL context.

Names always use locale-aware A–Z order with a stable ID tie-breaker; there is no sort control. Pages contain eight entries; changed search/filter resets page one, invalid/stale pages clamp, and single-page pagination disappears. A selected specimen survives while it still matches, even when it is off the current page; otherwise the first remaining result is selected. Zero matches clear selection, unmount any preview and remove Explore. Index and Spotlight have reset actions; active constraints are individually removable. Counts/page status announce results politely. Filtering that retains the selected specimen does not recreate its live preview.

`checks/fixtures/discovery-catalog.ts` contains the two real specimens plus fifty explicitly labeled layout samples spanning the three diets, three periods, multi-period/unknown metadata and long EN/DE names. Samples have no media or exhibit destinations. They are imported only by checks and the isolated `checks/discovery.vite.config.ts`, not by production routes; there is no deployed demo toggle. Start `npm run dev:discovery-fixtures` for this separate verification application on port 5175. Its fixture-only controls also exercise dataset shrink.

After `npm run build -- --mode development`, start `npm run preview -- --host 127.0.0.1 --port 4173` and `npm run media:dev`; run `npm run check:discovery-browser` with the fixture server alongside them. The external Playwright/browser overrides described below apply; `FIELDBOOK_FIXTURE_URL` overrides port 5175. Evidence is saved locally under ignored `media-dev/issue30-verification/`; no model data or derived renders are uploaded.

Observed on 2026-10-25 for #30: type checking, Overview/query/state checks, the local static build, static-page checks and the discovery, Spotlight and detailed-exhibit Chromium suites passed. Discovery covered keyboard expansion/collapse and visible focus, mutually exclusive diet buttons, All retaining search/period, collapsed-chip removal, combined filtering, all seven fixture pages, alphabetical ordering, legacy-sort normalization, dataset shrink, reload/history/locale and exhibit-return context. German 1360/1024/390/320px layouts at 100%/200% text had no horizontal overflow; visible compact controls met 44px width/height targets. Matched EN/DE captures at 1360×768 moved the first specimen from y=783 to y=495, fully inside the first screen. At 390×844 it moved from y=731 to y=443 in English and y=755 to y=467 in German. Captures and measurements stay in `media-dev/issue30-verification/`. These are local Chromium/touch-emulation checks, not production-host or physical-device certification.


### On-demand 3D Spotlight — issue #25

**View in 3D / In 3D ansehen** imports the lightweight preview renderer and the selected exhibit's validated model configuration only when requested. Initial Overview and row browsing create no renderer and request no GLB or narration. The preview uses the same actual HTTP GLBs, original materials, warm exhibit lights and camera-fit margin as the detailed exhibits; resource disposal and light creation are shared helpers. It does not mount anatomy, scale comparison, field study, audio, animation or automatic rotation.

Drag to rotate, or use the four native rotation buttons and Reset with pointer, touch or keyboard. Zoom and panning are disabled in this focused preview. Each orbit and resize refits projected model/plinth bounds, preserving the complete tail and plates. The canvas allows vertical touch scrolling (`touch-action: pan-y`), with horizontal gestures rotating the specimen. There is no continuous idle render loop, damping or reduced-motion autoplay.

Closing preserves selection and returns focus to the persistent activation button. Species changes, mobile Back/results, a hidden document, page exit and component destruction cancel pending fetch/render work and release controls, observers, scene resources and the WebGL context. A late decode releases its own resources without restoring an abandoned preview. Every new species starts at its poster. Loading, fetch/CORS/decode failures and unavailable/lost WebGL have localized status and same-species Retry; poster, text, index and Explore remain usable throughout.

With the static preview and real media server running, `npm run check:spotlight-browser` exercises EN/DE and both species, keyboard/pointer/touch rotation, pixel-identical reset, responsive resizing, canceled selection, repeated activation/cleanup, mobile Back, focus, navigation and recovery. It uses the same `FIELDBOOK_PLAYWRIGHT`, `FIELDBOOK_BROWSER_EXECUTABLE` and `FIELDBOOK_PREVIEW_URL` overrides as `check:browser`; no browser dependency is added to the application. Evidence goes to ignored `media-dev/issue25-verification/`.

Observed on 2026-10-25: the built static site rendered both real GLBs in EN/DE at desktop, 900px and 390px; manual inspection also confirmed complete silhouettes at 1360px and mobile. A 320px/200% root-text/reduced-motion check for both species and languages had no horizontal overflow and all controls at least 44px high. Horizontal touch drag changed the rendered view; vertical touch swipe scrolled the page. Repeated close/reopen released all tracked WebGL contexts, restored application listener counts and left no continuing renderer RAF. Fault-injected fetch/decode and mismatched CORS headers, actual `WEBGL_lose_context`, and blocked context creation all recovered through Retry. Existing four-exhibit anatomy/scale and both narrated-study locale checks passed. Limits: Chromium/SwiftShader and emulated touch, not physical devices or a screen-reader session; local HTTP media and intercepted failure responses, not production CDN validation or media publication.


## Check and build

```sh
npm run check
npm run check:exhibits
npm run check:camera
npm run check:anatomy
npm run check:study
npm run check:stegosaurus
npm run check:stegosaurus-export
npm run check:media
npm run build -- --mode development
npm run check:exhibit-pages
npm run preview
```

`npm run check` first generates the ignored Paraglide runtime, so it works before a dev server or build has been run. `tools/paraglide.mjs` supplies the same compiler options to checks and the Vite plugin.

Optional `npm run check:browser` runs the actual Chromium acceptance matrix against an already built and freshly started static preview, with the separate media server and both approved Ankylosaurus recordings configured. It requires an externally provided Playwright installation and browser; it adds no application dependency. Set `FIELDBOOK_PLAYWRIGHT` to that package's absolute path if it is not available through normal Node resolution, `FIELDBOOK_BROWSER_EXECUTABLE` to an installed Chromium executable if needed, and `FIELDBOOK_PREVIEW_URL` if the preview is not `http://127.0.0.1:4173`. It writes ignored screenshots and an observation log under `media-dev/issue16-verification/`. Restart the preview after rebuilding so it serves the current manifest. The matrix includes touch emulation, not physical-device certification, and intercepted fetch failure, not production-origin CORS verification.

Development mode defaults to the separate loopback model URL. These commands exercise **local static media delivery**, not a production CDN deployment. The static site is written to `build/`; use a static host that maps directory URLs to `index.html`. No application server or locale middleware is required after prerendering.

Production prerenders both exhibits and requires explicit externally hosted URLs for both models, supplied through the environment or a local ignored `.env` file. The following hosts are placeholders, not deployed media:

```sh
PUBLIC_ANKYLOSAURUS_MODEL_URL=https://your-asset-host.example/ankylosaurus.glb PUBLIC_STEGOSAURUS_MODEL_URL=https://your-asset-host.example/stegosaurus.glb npm run build
```

The example above uses POSIX shell syntax. In PowerShell:

```powershell
$env:PUBLIC_ANKYLOSAURUS_MODEL_URL = 'https://your-asset-host.example/ankylosaurus.glb'
$env:PUBLIC_STEGOSAURUS_MODEL_URL = 'https://your-asset-host.example/stegosaurus.glb'
npm run build
```

These public, **build-time** values must be absolute HTTP(S) URLs without credentials. Production rejects missing/loopback URLs. The shared resolver in `src/lib/specimens/model-url.ts` enforces the same policy for both species. The asset host must allow CORS from the application's origin. No production asset host/CDN was provisioned here. Ankylosaurus publication authorization is recorded in its [provenance document](docs/assets/ankylosaurus.md); Stegosaurus authorization remains unconfirmed. Configure the deployment's actual URLs; do not ship the loopback defaults or put GLB files in `static/`.

## Viewer behavior

Drag to orbit; wheel/pinch to zoom. Native buttons provide zoom, four orbit directions, and reset. Panning and automatic motion are disabled. Zoom is bounded to 0.6–2.5; vertical orbit excludes the underside. Resize retains orbit and zoom. Reset frames projected model/plinth bounds with a 15% margin, rather than the proposed enclosing-sphere fit that made the desktop specimen too small. The sphere still determines camera distance, depth planes, and lighting scale.

Start plays the complete narrated Meet, Scale, Armor, and World study. The seek range, labeled chapter buttons, and Previous/Next navigate the recording while preserving the requested playing/paused state. Entering the study applies one uniform calibration that makes the loaded head-to-tail extent about 8 m and keeps a generated 1.7 m human silhouette and length guide on the same ground; Scale reframes the union of both. Armor follows the plates and tail club; World shows the time/location context. Pause preserves the chapter graphics, removes guided emphasis, restores normal lighting, and enables the existing anatomy inspection, orbit, zoom, and a calibrated Reset. Resume clears inspection, composes the current frame, then advances narration. Projected numbered anchors and leaders hide when offscreen or behind the specimen; the readable legend stays in normal flow. Exit, completion, navigation, and context loss remove study graphics and restore the saved Explore transform and framing. Reduced motion selects the fully composed chapter views and transitions immediately.

Loading, ready, asset error, and unavailable-WebGL states are localized. Failures retain specimen content and language navigation and offer reload. Context loss releases the scene and shows the unavailable state. Cleanup is idempotent; a GLB arriving after disposal releases its own resources without a new canvas or state update. Reduced motion disables damping and reset is immediate.

Select a visible anatomical surface, projected marker, or native Armor / Head / Tail club button to open one English/German note. Selection adds restrained amber emphasis without moving the camera. Selecting the same region keeps the note open; another region replaces it. Close, scoped Escape, background, or plinth dismiss; non-target body surfaces and camera controls preserve selection. Drag/pinch/canceled/outside releases never pick.

Armor's interaction region includes the visible upper half of `bodyMesh` between the separate plates, measured against the body's local geometry midline. Hover and click use the same region, so crossing a plate gap does not alternate pointer/grab or expose a misleading clickable cursor. Lower torso, legs, and underbelly remain non-target surfaces; the nearest hit still blocks hidden anatomy. This extra torso mapping exists only when the real armor target is available. Selection tint remains on the armor plates.

Markers and leader lines hide behind the specimen or outside the camera view; an open note remains readable. Named buttons can select hidden regions. Narrow layouts dock the same note below the stage, with controls below it. Close/Escape from the note restores focus to its anatomy button; viewer failure restores focus to the section. Educational wording and scientific limits are in the [approved anatomy specification](docs/superpowers/specs/2026-10-03-anatomy-inspection-design.md).

Desktop anatomy notes use a stable top-right position, 24 CSS pixels from the stage edges, rather than following the selected point across the animal. Narrow screens, or stages that cannot fit the note with its margins, dock it below the viewer. The leader still follows the visible anatomy anchor. Larger 16px marker dots retain their 44px hitboxes; hovering a visible marker or clickable surface shows a pointer cursor, amber marker ring, and localized region label. Empty space uses a grab cursor; an active drag uses grabbing and suppresses hover. Guided playback disables this feedback; Pause restores inspection. Hover does not select, announce a note, or recolor specimen materials, and reduced motion removes the hover transition.

## Observed inspection refinement — 2026-10-05

- Running Vite exhibit: all three English markers and anatomical surfaces outside the marker hitboxes showed pointer/hover feedback and opened the correct note. All three notes settled at the top-right inset. German markers showed localized labels.
- The owner's follow-up clip exposed cursor flicker over gaps between individual plates. Real nearest-hit tracing alternated armor meshes and `bodyMesh` with an unchanged camera. After mapping the visible upper torso to Armor, four 61-point native-pointer sweeps dropped from 6/11/12/3 cursor transitions to one exit transition each; a zoomed 41-point sweep and German tablet 31-point sweep stayed pointer throughout. Former gap clicks opened Armor, including during actual paused narration; Head/Tail club and orbit dragging remained usable.
- The real Three.js geometry/controller regression failed before the fix and passed after it: plate-gap hover/click continuity, upper/lower boundary, local-space transforms, nearer-body occlusion, missing armor, and playback ownership. It runs in `npm run check:anatomy` alongside the existing gesture check; only the DOM event adapter is simulated.
- Actual mouse orbit changed the rendered canvas while preserving the selected Head note; grabbing appeared during the gesture and hover cleared. Keyboard selection and Escape returned focus to the persistent Head control.
- Actual native Meet audio advanced, disabled markers/pointer feedback, and restored hover while paused. Resume cleared the note/hover and continued audio; Exit removed the audio source and restored the grab cursor.
- EN/DE at 1365, 1024, and 390 CSS pixels wide, with 100% and 200% root text size: all three notes remained readable with no horizontal overflow; phone notes docked below the stage and Close stayed at least 44×44. Actual reduced-motion emulation removed note animation and marker transitions.
- Added `1rem` inner padding to the viewer section, preserving its keyboard-focus outline. Actual English 1568px desktop and German 390px phone checks measured 16px insets on all four sides, growing to 32px with 200% root text size, without horizontal overflow. Notes retained desktop placement/phone docking, marker picking worked with the new inset, and keyboard focus retained the 3px outline with 4px offset.
- `npm run check`: zero errors/warnings. Existing anatomy, study, and camera checks passed. These checks used desktop Chromium viewport/text-size emulation, not physical devices or an actual screen reader. Fixed-corner placement reduces the reported overlap; it does not guarantee an unobstructed specimen at every orbit/zoom.

## Observed verification — 2026-10-03

- `npm run check`: zero errors/warnings, including generation from a removed/clean Paraglide output directory; `npm run check:camera`: passed; strict static `npm run build -- --mode development`: passed.
- Export/reload: 2,972 triangles, no animations; named head/armor/club nodes, finite positions, matching bounds within 0.001 m, colors and faceted normals. Side-by-side browser rendering matched the source resting appearance.
- Independent static HTTP server: direct English/German load and refresh, root entry, full-document locale switching, and correct initial HTML `lang`. With JavaScript disabled, the root still opened English SSR content with both language links and no renderer.
- Chromium visual inspection at **1365×768**, **1024×768**, **390×844**: complete animal at reset, readable controls, no horizontal overflow. Buttons were at least 44×44 CSS pixels with 16px text.
- Mouse drag/wheel, native keyboard activation/focus, four-direction orbit, zoom/polar limits, resize preservation, and reset exercised. A temporary instrumented viewer confirmed reset positions and projected geometry stayed inside the viewport.
- Chromium touch drag/pinch emulation exercised in the actual static phone layout and instrumented viewer. **No physical phone/tablet testing** was performed.
- Blocked GLB requests produced localized errors; English/German navigation remained usable. Disabled WebGL and actual `WEBGL_lose_context` produced unavailable UI with reload. Reload restored the viewer after context loss.
- Navigation during delayed model transfer passed. Explicit disposal before transfer completion left no canvas or late state update; arriving GLB resources were disposed. Normal double-disposal released all 17 unique scene geometries and six materials exactly once, removed controls/canvas, and stopped rendering.
- Reduced motion disabled damping and showed no continued camera movement after pointer release. Blocked external fonts plus denied local/session storage and cookies retained readable fallback typography and working controls.
- Build output contained only application documents/code/styles: no GLB, font binary, media directory, procedural generator, or recording. Generated localization code, dependencies, and media are ignored; the supplied example is excluded from the implementation commit.
- Production build smoke rejected missing URLs, loopback media, embedded credentials, and non-HTTP(S) URLs with the configured actionable error. The local development-mode build was restored afterward; production hosting was not exercised.
- Pre-commit development smoke corrected the HTML preload flag from unsupported `off` to native `false`. The rendered exhibit reached ready state and hovering the locale link produced no console warnings or page errors.

The build reports the size of the lazily loaded Three.js chunk (>500 kB) and a workstation `NO_COLOR`/`FORCE_COLOR` environment warning. Neither was suppressed. No extra compression/chunking dependency was added for this one-specimen milestone.

## Observed anatomy verification — 2026-10-04

The matrix below was exercised in Chromium against `build/` served by an independent static HTTP server, with the separate loopback GLB endpoint. Temporary Vite-served instrumentation exercised the real viewer/controller for geometry, camera/material ownership, and explicit disposal; it was not substituted for static UI checks.

| Matrix scenario | Observed result |
| --- | --- |
| Integrated commands | `npm run check`: zero errors/warnings; `check:camera` and `check:anatomy`: exit 0; `npm run build -- --mode development`: passed and generated both localized documents. The existing chunk-size and color-environment warnings remain unsuppressed. |
| Routes and locale | Direct English/German loads and refreshes worked with matching HTML `lang`. Full-document locale navigation cleared selection. |
| Actual anatomy paths | All three named buttons, visible markers, and visible surfaces selected the corresponding EN/DE note. Surface samples included grouped armor `dorsalSpine_0_4`, grouped head `upperHorn_-1`, and `clubMesh`. Initial rendered markers sat on dorsal armor, head skin, and the club; all normal-asset targets were available. |
| Same ID, switching, highlights | Same-ID activation retained the mounted note. Switching/clearing restored original material references. Instrumentation found only the selected region changed: 106 armor meshes/one clone, 22 head meshes/five clones, one club mesh/one clone. Clones were disposed once on clear; camera world/projection matrices stayed unchanged on selection. |
| Occlusion and nearest-hit picking | A full orbit hid and restored all three markers. Hidden-region button selection retained its note without a leader. An actual ray at `bodyMesh` had armor intersections behind it; clicking that nearer body preserved the existing Head selection rather than selecting through it. |
| Offscreen and resizing | Zooming the club anchor offscreen retained the note and removed its leader; reset reconnected it. Resizing that hidden note to phone width retained selection and docked the note without restoring a misleading line. |
| Empty/body/UI distinction | Background and exposed, geometry-confirmed plinth clicks cleared selection. Body, note text, and all seven zoom/reset/orbit buttons preserved it. |
| Gestures | Real mouse out-and-back drag, outside release, release over the note, and cancellation during an active pointer preserved selection. CDP touch drag and pinch with staggered releases also preserved it; a subsequent deliberate touch tap cleared it normally. |
| Keyboard and focus | Tab/Shift+Tab/Enter selected all three named targets and reached/activated Close. Close/Escape restored the selected anatomy button, pressed states and a 3px visible focus outline were observed, and markers introduced no tab stops. Escape on a locale link did not clear the note. Context loss while Close was focused moved focus to the viewer section. |
| Accessibility announcements | Accessibility-tree inspection exposed named controls, pressed state, and the readable note. A live-region mutation observer recorded one heading/body change for a new selection and zero additional changes for same-ID activation or orbit. |
| Layout | Visually inspected 1365×768, 1024×768, and 390×844 in both languages. Floating/docked notes, Close, and controls remained readable with no horizontal overflow. Open-note resizing worked. At 200% root text enlargement, both languages were checked at all three widths: no overflow or covered controls; the phone note grew in normal flow. |
| Motion and leader placement | Normal entry used the 140ms fade/lift without remounting on repeated selection. Reduced motion removed note animation and disabled control damping. A smoke check caught floating leader endpoint lag; after correction, sampled endpoint errors were below 0.015 CSS pixels during orbit. |
| Asset and WebGL failures | Blocked GLB requests and separately disabled/lost WebGL produced localized EN/DE errors, disabled anatomy controls, and removed inspection overlays. Actual context loss removed the canvas; navigation remained usable. |
| Missing target | Changed only the in-memory GLB response's `headGroup` name. Only Head/Kopf disabled, localized status named that region, and armor/club still opened notes in both languages. The original model was untouched. |
| Lifetime and resource cleanup | Delayed-transfer document navigation left one ready German canvas and no stale note. Explicit disposal before delayed completion emitted only loading and no snapshots; the arriving GLB's 16 geometries/five materials were each disposed once. Three mount/dispose cycles removed their pointer listeners. Final-controller double-disposal restored materials, disposed all 17 scene geometries/six original materials/five head-highlight clones once, and removed all seven tracked window/document listeners. Context loss also released five selected head clones exactly once. |
| Repository/media boundary | Static output contained only application HTML/JS/CSS/JSON; no model, fonts, recordings, or supplied example. Temporary instrumentation was removed; generated localization and local media remain ignored. |

Limits of that anatomy milestone: touch was Chromium/CDP emulation, not a physical phone/tablet. Accessibility-tree and live-region inspection were performed, not an actual screen-reader session. Text enlargement used a 200% root font-size override, not every browser's text-zoom implementation. This was development-mode static smoke with local media, not production CDN deployment. Model publication rights/scientific accuracy remain unresolved. Field Study, narration, and playback were not added at that milestone.

## Observed Meet integration verification — 2026-10-04

The initial checks below are historical **code/readiness/failure-path evidence**, not successful narrated acceptance, and predate receipt of the four audio segments. That initial static build had no complete recording configuration and disabled Start. A temporary, explicitly fault-only metadata build exercised a missing MP3 against the real local host; its test timestamps/provenance were never production data. Current real-recording acceptance is recorded below.

| Scenario | Observed result |
| --- | --- |
| Integrated checks | `npm run check:camera` and `check:anatomy` passed. `check:study` passed its metadata, audio-authority, caption-boundary, buffering, retained retry, cancellation, and cached-page state checks. After correcting conditional focus references and review findings, `npm run check` reported zero errors/warnings and the covering study check passed. |
| Static build | `npm run build -- --mode development` passed. The existing Three.js chunk-size and `NO_COLOR`/`FORCE_COLOR` environment warnings remain unsuppressed. Final `build/` contains only application HTML/JS/CSS/JSON; no recording, GLB, fonts, or temporary harness. |
| Final missing-recording surface | Direct EN/DE static loads showed localized missing-recording text, disabled Start, working exploration/anatomy, and no MP3 request. Head/Kopf selection plus keyboard Escape returned focus to its named button. |
| Real viewer camera ownership | Temporary source instrumentation used the actual exported model/viewer: native zoom/orbit/reset/anatomy commands could not change the composed guided view; Pause restored normal lighting and all three notes; Resume cleared inspection; Exit restored saved position/target/zoom and ordinary lighting after resizing, with no later damping drift. Canceled composition did not overwrite paused inspection. Reduced-motion composition completed immediately. |
| Actual static media failure | The fault-only build made zero audio requests before Start and received a real MP3 404 after Start. It cleared inspection, locked exploration, retained the hero view, displayed localized error plus Retry/Exit, and made no automatic retry. Explicit Retry made another request; Exit restored enabled exploration and returned focus to Start. |
| Keyboard/focus/navigation | Keyboard entry/error focused Retry; retry/error retained an available Retry control. Captions choice survived retry and reset on a new start. Tab exposed a 3px focus outline. Exit preserved focus on an external language link. Full-document language navigation followed by Back produced an actual persisted back-forward-cache restore; Start remained usable afterward. |
| Required targets and WebGL loss | Renamed armor/club targets only in an in-memory GLB response: Start disabled with the German required-target reason; Head inspection remained usable and no audio was requested. Actual `WEBGL_lose_context` during the static fault study removed canvas/study/note overlays while retaining localized failure, specimen text, and language links. |
| Layout | EN/DE final unavailable and static fault/error surfaces exercised at 1365×768, 1024×768, and 390×844 with 100%/200% root text size. Text measured at least 16 CSS pixels and buttons at least 44×44. Controls/captions remained in normal flow without covering anatomy. A transient annotation overflow during resize was fixed by clipping stage overlays; final German resize checks with closed/open notes had no horizontal overflow at all three sizes and both text scales. |
| Separate local HTTP media | Isolated new responder on port 5195 (the existing 5194 process was left untouched): real 99,436-byte GLB GET/HEAD, closed/open/suffix ranges returned exact bytes with 206, invalid range returned 416, and arbitrary paths returned 404. Missing MP3 returned 404; its CORS OPTIONS returned 204 and range/length headers were exposed. MP3 decoding/playback/seek were not exercised in this initial check; see the supplied-recording follow-up below. |
| Cleanup/review | Both read-only lifecycle/UI reviews passed after correcting cached-page reuse, complete chapter cue/caption coverage, signed-URL credential validation, and disabled-control focus. Temporary source/fault-build harnesses were removed; final static output was rebuilt without their metadata. Verification tabs and services started for this work were stopped. |

Limits of that initial phase: desktop Chromium with viewport emulation and a root-font-size override, not physical phone/tablet or actual screen-reader testing. At that point real Field Study playback, recording audition/alignment, and nonzero-position recovery had not been exercised. The supplied-recording and real narrated acceptance sections below supersede that gate; they do not claim later-ticket or production-CDN acceptance.

### Initial Inworld follow-up — 2026-10-04

The initial four Inworld segments were joined losslessly into ignored `media-dev/ankylosaurus-en.mp3`: **48.672 seconds**, 778,797 bytes. That full track is now preserved as `media-dev/ankylosaurus-en-inworld.mp3`, not selected for delivery. Its historical chapter starts were Meet `0`, Scale `12.552`, Armor `22.056`, World `36.744`; do not reuse them for ElevenLabs. FFmpeg decoding passed; actual MP3 GET/HEAD, content type, exact byte ranges, invalid-range handling, and CORS passed against the existing responder on isolated port 5195.

On the built static English page, a temporary native audio element proved on-demand cross-origin playback, pause, seek to World, resume, and the initial full duration with no media error. It did **not** bypass or exercise the gated Field Study controller; Start remained disabled. No voice/provenance or caption timestamps were invented. The temporary browser surface and hosts were removed/stopped.

### Regenerated ElevenLabs follow-up — received 2026-10-04

The four new originals in `media-dev/en/` were combined without re-encoding and selected at the existing `media-dev/ankylosaurus-en.mp3` path. The prior full Inworld track is preserved separately; originals and earlier alternatives remain untouched. Current track: **51.643938 seconds**, 826,348 bytes. All **1,977 compressed audio packets** match the ordered source packets exactly. Fresh chapter starts: Meet `0`, Scale `13.635918367`, Armor `23.666938776`, World `39.053061224`.

FFmpeg decoding, actual MP3 HTTP bytes/content type/HEAD/ranges/CORS, and on-demand cross-origin native Chromium playback/pause/seeks to all three later boundaries/resume passed. This preliminary standalone native-audio check preceded Field Study configuration and was **not Field Study acceptance**. Temporary list/tab/hosts were removed/stopped. The following integrated acceptance uses the approved regenerated version, not that separate playback surface.

## Observed real narrated Meet acceptance

Verification: **2026-10-04–05**. Built static `build/` served independently, with the real regenerated MP3 and GLB on a fresh isolated responder at port **5195**. The existing user-owned **5194** process was not stopped; its MP3 endpoint still returned 404, so restart that older media process before using the normal 5194 configuration. Final local configuration/build use the normal documented endpoint, not a test fault provider.

| Scenario | Observed result |
| --- | --- |
| Recording and alignment | Owner re-auditioned and approved all four segments. Duration 51.643938 s; all 1,977 compressed packets retained. All four approved scripts are preserved exactly across 16 captions. Chapter starts come from packet boundaries; caption onsets and the 31.44 s tail-club cue come from local speech alignment, not character-count timing. |
| Real Meet, captions, completion | No MP3 request before Start; real cross-origin MP3 returned 206 and decoded at the authored duration. Hero view showed the whole animal, focused lighting, name, and default captions. Observed caption starts were 0, 2.321168, 6.643816, 9.366706, 12.246155 s. Natural completion paused at **13.641848 s**, removed audio/overlays, returned focus to Start, and restored the changed pre-study canvas **pixel-for-pixel**. No later chapter UI was delivered. |
| Pause, inspection, resume, Exit | Pause held the native position unchanged while all three anatomy notes, orbit and zoom worked. Resume cleared the note and locked controls while holding time during composition. Native drag/wheel could not change the guided canvas. Caption choice survived resume and a real seek to 9.5 s. Exit after viewport resize restored the original canvas exactly and re-enabled exploration. |
| Actual transport failure and Retry | Deliberately truncated real MP3 delivery followed by HTTP 503 produced native `MEDIA_ERR_NETWORK` at **1.959184 s**, locked exploration, and focused Retry. Retry requested the same version, retained **exactly 1.959184 s**, stayed paused, and required explicit Play; recovered real playback advanced past 2.42 s. |
| Bug found by the real outage | Native `pause()` finalized the clock about 54 ms beyond its pre-pause error sample. Capture now occurs **after** native pause in both Pause and failure paths. The regression failed before the fix (`1.95 !== 2.05`), then passed; the rebuilt real outage/Retry also retained the exact stopped position. |
| Data and blocked-play faults | Serving the archived 48.672 s recording against the 51.643938 s version produced a readable timing error without stretching cues. A one-shot `NotAllowedError` injection exposed paused inspection and explicit Play/Exit; explicit Play then used real audio. This is fault-injected blocked-play handling, not a claim that browser policy naturally denied autoplay. |
| Lifecycle | A visibility-change fault paused native audio, enabled inspection, and did not resume on visible. Actual full-document EN→DE navigation stopped/reset study audio. Back produced **persisted pagehide/pageshow** and allowed a fresh start from zero. Actual `WEBGL_lose_context` during real playback removed canvas/study/note overlays, stopped/unloaded audio, focused the viewer section, and retained text/language links. |
| EN/DE layout and keyboard | Real captions/playback/Pause/Head/Exit exercised at **1365×768, 1024×768, 390×844**, both languages, **100%/200% root text size**. No horizontal overflow; captions stayed below anatomy; text ≥16 px, controls ≥44×44 px. German visibly said “Erzählung auf Englisch” with `lang="en"` captions. Keyboard Enter started Meet; reduced motion was exercised in the enlarged-text matrix. |
| Checks | After the native-clock fix: `npm run check` reported **zero errors/warnings**; `check:camera`, `check:anatomy`, `check:study` and the development-mode static build passed. The existing large Three.js chunk warning remains unsuppressed. Final natural-playback page had no unexpected JavaScript page errors. |
| Boundaries and cleanup | One native audio instance per viewer; no second scene/renderer clock, added application dependencies, runtime generation, later chapter implementation, or persistent preferences. Audio/model binaries remain outside source/static output. Temporary transport/alignment/browser probes and owned verification hosts were removed/stopped. |

Limits: viewport/text-size emulation, not physical phone/tablet or a screen-reader session. Natural tab backgrounding could not be reliably represented by the managed browser; the visibility handler was exercised by fault injection and the existing regression. Local speech alignment does not substitute for the owner's audition. No production CDN deployment or model publication-rights verification; account-only voice restrictions were not independently inspected. These are not acceptance of the later complete four-chapter study.

## Observed narrated scale comparison acceptance — 2026-10-20

Verification: **2026-10-20**. Development-mode static `build/` served by `vite preview` on port 4173, with the real regenerated MP3 and GLB on the documented loopback responder at port 5194. Chromium viewport/text-size emulation at 1365×768, 1024×768, and 390×844. WebGL evidence uses `readPixels` framebuffer captures; DOM measurements cover text, controls, overflow, and anchors.

| Scenario | Observed result |
| --- | --- |
| Timeline and completion | Start remains disabled until calibration, armor, tail-club, and recording readiness agree. Real playback crossed Meet→Scale at **13.636 s**; status showed `Chapter 2 — Scale`, the legend, and both numbered anchors. Natural playback completed at the Armor boundary, removed the study UI/comparison, returned focus to Start, and restored the pre-study canvas **pixel-for-pixel**. |
| Calibration and comparison | The built scene showed the approximately 8 m calibrated animal, a generated 1.7 m human silhouette on the same ground, and the length guide with end ticks. The regression asserts transformed X span and guide endpoints at 8 m within `1e-6`, human bounds at 1.7 m, shared ground, finite calibration, real projection/occlusion, and idempotent comparison disposal. No downloaded human asset or new dependency was added. |
| Audio authority | One native audio instance per viewer; no MP3 request before Start. Authored duration was **51.643938 s**. Pause froze the clock at **15.369 s** for 1.2 s. Resume held 15.369 s through 150 ms and advanced by 400 ms, matching the short compose hold; a second Start reused the same audio instance. |
| Pause, inspection, Resume | Pause kept the comparison, legend, and both anchors, enabled all anatomy/zoom/orbit/reset controls, and opened the Head note at the stable 24 px top-right inset. Orbit moved both anchors and their leaders; Reset returned the calibrated whole-comparison fit. Resume cleared the note and locked exploration while captions continued. Caption choice survived pause/resume; a new Start re-enabled captions. |
| Seeks and chapters | Temporary native-media seeks backward to 7 s removed the comparison and returned to Meet; 16 s restored Scale, legend, and anchors; 23.7 s completed the study and returned focus to Start. No stale composition or second chapter presentation appeared. |
| Exit, resize, restore | Exit during Scale playback and during resume composition restored Explore, removed the comparison, re-enabled controls, and focused Start. Resizing 1365→1024→390→1365 during a paused Scale study and then exiting produced a canvas **pixel-identical** to the pre-study 1365 view. Delayed-load EN→DE navigation produced the German ready exhibit with no old canvas overlay, study UI, or audio. |
| Failure and Retry | A real aborted MP3 request (cache disabled, request interception) produced the localized media error, disabled Play, focused Retry, and kept exploration usable. Retry stayed paused at 0 s and explicit Play used real audio into Scale. A fault-injected media `error` at **13.744 s within Scale** retained that exact position, kept the legend/anchors, focused Retry; Retry remained paused at 13.744 s and Play advanced to 14.56 s. |
| Reduced motion | `prefers-reduced-motion: reduce` was emulated. An initial build still traveled the Scale framing over about one second after the chapter boundary. The blend now selects the composed Scale view immediately; after the fix, anchor coordinates stayed constant from the boundary through 1 s. |
| EN/DE layout | Legend text was `Estimated adult length: 8 m` / `Human reference: 1.7 m` and `Geschätzte Länge eines erwachsenen Tiers: 8 m` / `Mensch als Vergleich: 1,7 m`. German status/chapter text was localized while captions remained English with `lang="en"` and the “Erzählung auf Englisch” notice. At 1365, 1024, and 390 CSS pixels, both languages, 100% and 200% root text size: no horizontal overflow, status/legend text ≥16 px, captions 18 px (36 px at 200%), controls ≥44×44 CSS pixels (≈79 px at 200%), and visible anchors stayed inside the stage. |
| Lifetime and resources | Three start/exit cycles kept one canvas and did not grow created WebGL buffers after the first comparison render (46 at ready, 87 after the first Scale render, 87 after all cycles); no deletes occurred while the viewer stayed alive, matching reuse across starts. Actual `WEBGL_lose_context` during Scale removed canvas/study/audio overlays, deleted all 87 created geometry buffers once, and showed the localized unavailable state. |
| Checks and build | `npm run check`: zero errors/warnings. `check:camera`, `check:anatomy`, and `check:study` passed. `npm run build -- --mode development` wrote the static site; the existing Three.js chunk-size and `NO_COLOR`/`FORCE_COLOR` warnings remain unsuppressed. |

Limits: headless Chromium with viewport emulation, not physical devices or an actual screen-reader session. The immediate Scale failure was fault-injected with a media `error` event after the earlier real request-abort path; it exercises the controller’s retained-position Retry, not a second natural network outage. Exit was exercised during playback, paused inspection, resume composition, and resize, not during buffering or an active Retry. Layout checks used a 200% root font-size override. This milestone does not deliver Armor/World presentations, chapter picker, seek UI, German audio, production CDN hosting, or verified model publication rights.

## Observed narrated armor chapter acceptance — 2026-10-21

Verification: **2026-10-21**. Development-mode static build served by `npm run preview`, with the real GLB and approved MP3 served by `npm run media:dev`. Headless Chromium at 1365×768 unless noted; reduced-motion and root-text-size settings were emulated.

| Scenario | Observed result |
| --- | --- |
| Timeline and completion | Continuous real playback showed Chapter 1 through 13.6 s, Chapter 2 from 13.6–23.7 s, and Chapter 3 from 23.7 s. Natural completion restored Explore, removed study chrome, and made Start field study available. |
| Armor and tail-club framing | At 23.7 s the armor plates filled the frame width with calibrated camera framing. After the 31.44 s cue, the tail-club filled roughly half the frame width with the tail entering from the left. Camera travel completed within the cue ramp. |
| Guided emphasis and pause | During playback, armor plates were amber-lit and the rest of the specimen dimmed. Pausing showed normal specimen colors and lighting, visible markers, enabled anatomy controls, retained caption, and status “Narration paused. Explore or inspect, then resume. — Chapter 3 — Built-in armor”. |
| Paused inspection and resume | All three anatomy note controls opened notes; switching Head → Tail club replaced the note. Exit from paused inspection returned to Explore with the note removed. Resume cleared the note and restored guided armor framing/emphasis before narration advanced. |
| Exit and restoration | Exit during Armor playback from a rotated/zoomed Explore view restored the pre-study orbit and zoom; before/after screenshots matched. |
| Reduced motion | With `prefers-reduced-motion: reduce` emulated, the composed armor view appeared at the chapter boundary and the composed tail-club view at the cue switch, without camera travel. |
| German and narrow layout | At 1024×768, the German route showed “Kapitel 3 — Eingebauter Panzer” and “Erzählung auf Englisch”, with English captions and no horizontal overflow. At 390×844, the chapter label was present with no horizontal overflow at 100% or with root text set to 200%. |
| Checks and build | `npm run check`, `npm run check:camera`, `npm run check:anatomy`, `npm run check:study`, and `npm run build -- --mode development` passed. The build retains its existing large-chunk and `NO_COLOR`/`FORCE_COLOR` warnings. |
| Repeat Start | Multiple Start runs from the same page each began at Meet; no World-chapter presentation appeared. The study ended at the World boundary back in Explore. |
| Framing correction | Acceptance found that OrbitControls’ Explore zoom cap clamped guided region framing, initially leaving the tail-club shot framed on the whole tail. Guided framings now use the study’s own bound, and Explore bounds are restored on Exit. |

Limits: headless Chromium viewport and text-size emulation, not physical-device or screen-reader testing. Exit during buffering or active Retry was not exercised. Pause exactly at the armor→tail-club cue boundary was not exercised; pause was tested inside Armor and during paused inspection. Pointer picking, nearest-hit occlusion, and keyboard/Escape focus behavior were not re-exercised during paused Armor inspection; the named Armor/Head/Tail club buttons were used, and delivered picking behavior is covered by `npm run check:anatomy` and the 2026-10-05 acceptance. Layout was observed in English at 1365×768, German at 1024×768, and English phone at 390×844 (100% and 200% root text); the full three-width × two-language × two-text-size matrix was not repeated. Dimming versus guided lighting was not isolated pixel-by-pixel; the playing/paused comparison showed the combined guided treatment and its removal. No production hosting or model publication-rights verification was performed.


## Observed ancient-world chapter acceptance — 2026-10-21

Issue #4 extends the existing study through World (39.053061224489795 s) to the recording endpoint (51.643938 s). The recording-derived World cue drives a 0.75-second pullback from the tail-club pose to the whole-animal hero composition at 0.9 zoom. Reduced motion selects that composed view immediately. The localized context graphic sits in normal document flow below the canvas: present-day North America wording, Late Cretaceous, and a 68–66 million-year time band. Scientific wording was checked against the [Natural History Museum](https://www.nhm.ac.uk/discover/dino-directory/ankylosaurus.html).

Observed against the development-mode static build on loopback port 4173 and the existing real MP3/GLB on port 5194, using installed headless Chromium:
- Continuous real native-audio playback reached World; Pause held exactly 40.027413 s while Head inspection worked. Resume held that time through the first 100 ms of composition, then advanced. Natural recording completion removed study UI and unloaded audio.
- English and German at 1365×768, 1024×768, and 390×844, each at 100% and 200% root text size: no horizontal document overflow, context below the canvas, matching English captions, and control heights at least 44 px. Enlarged-text runs emulated reduced motion. Desktop and enlarged German phone screenshots were visually inspected; content wraps vertically without covering specimen anatomy.
- Native-media backward seeks from World to Armor removed context; returning to World restored it. Exit removed context in every matrix case. Full-document English-to-German navigation during World removed the old presentation; no page errors occurred.
- Keyboard Enter started playback and focused Play/Pause. Exit restored Start focus. During paused World, Armor and Tail-club inspection worked; Exit cleared the note. After a rotated/zoomed pre-study view, Exit restored the canvas pixel-for-pixel.
- Reduced-motion World entry and resume worked with real audio. Caption choice survived resume. The existing framework-free regression now covers World boundary/progress, paused time, resume composition, and recording-end cleanup.
- Type check: zero errors/warnings. Camera, anatomy, and study regression checks passed. Static build passed with existing large-chunk and color-environment warnings.

Limits: browser viewport/text-size and reduced-motion emulation, not physical-device or screen-reader testing; no new narration audition, production-host verification, or model-rights verification. Chapter navigation and language handoff remain issues #5/#6. Temporary acceptance probes were removed; media binaries remain outside source/static output.

## Observed complete-study navigation acceptance — 2026-10-22

Issue #5 adds a native narration-position range, four labeled chapter buttons, Previous/Next, and elapsed/total time. English and German interface labels follow the document language; the existing English recording and its matching captions remain the baseline. Previous/Next select the adjacent chapter's start. Paused seeks reconstruct the target once, then permit manual exploration and inspection. Seeking to the recording endpoint while paused keeps the final World view; Play there returns to Explore.

Observed with installed headless Chromium against the development-mode static build on loopback port 4173 and the existing real MP3/GLB on port 5194:

- The final build played the complete 51.643938-second recording through Meet, Scale, Armor, and World, then unloaded audio, removed study graphics, and returned focus to Start. Repeated starts began at Meet with captions enabled.
- All **39 distinct chapter, visual-cue, caption, and recording boundaries** were exercised through the native range, including just-before chapter starts and backward jumps. Chapter, caption, scale-legend, and World-context visibility agreed with the resolved recording. Browser checks exposed both native media microsecond rounding and range-value digit truncation; regression coverage now protects exact recording-derived boundaries.
- A continuous-playback pause during the Armor transition at **24.019521 s** and a subsequent direct seek back to that timestamp produced pixel-identical canvas images. Paused manual rotation stayed pixel-stable across later frames with audio time held. Head inspection worked, and seeking removed its note. Resume held narration while composing; Pause and Exit during that composition prevented late playback. Rapid seeks selected the last requested position.
- Keyboard Enter started playback and focused Play/Pause. Native range Home/ArrowRight worked; Previous/Next selected adjacent chapters. Escape from a paused inspection note returned focus to Head. Exit after a rotated/zoomed Explore view and a 1365→1024 resize restored the saved projection pixel-for-pixel.
- All **12 viewport/language/text-size combinations** passed: 1365×768, 1024×768, 390×844; English/German; 100%/200% root text size. No horizontal document overflow; study controls were at least 44 px high and study text at least 16 px. Captions had English language tagging and no live-region ancestor. Enlarged-text cases used reduced motion. Desktop English and enlarged German phone screenshots were visually inspected; study content wraps below the specimen. Emulated touch also exercised Start, Pause, an Armor chapter seek, and Exit with reduced motion.
- Delayed real MP3 loading honored Pause followed by a World seek, Exit, and full-document English→German navigation. Navigation unloaded the old native audio. A real MP3 HTTP stream stalled at about **3.97 s**; Pause and Exit remained operable. An aborted media request exposed usable Retry/Exit controls. Renaming the tail-club target only in an in-memory model response disabled Start with its explanation. Denying WebGL context creation retained static exhibit text and disabled Start. No unexpected page errors occurred in the completed probes.
- `npm run check`, camera/anatomy/study checks, and the static build passed. Review identified native completion event ordering and near-boundary seek errors; both were reproduced with failing checks before correction. The existing single framework-free study check also covers cancellation, latest commands, paused inspection, and precision boundaries. The build retains its existing large-chunk and color-environment warnings.
- English and German static exhibit documents were present. Model, recording, and font binaries were absent from application output; no media was staged. Temporary browser probes were removed and only services started for this verification were stopped.

Limits: Chromium viewport, root-text-size, reduced-motion, and touch emulation; no physical-device, other-browser, actual screen-reader session, or new narration audition. Native-media decoding/playback was exercised in a muted headless browser. Canvas pointer-picking, occlusion, and every anatomy gesture were not manually re-exercised; the existing camera/anatomy checks passed, alongside the paused-inspection/return checks above. The media-error check exercised the error UI and Exit, not successful network recovery through Retry. WebGL context creation failure was exercised, not a new mid-playback context-loss test. No production CDN or model publication-rights verification. Language handoff and cinema/particles remain issues #6/#7.

## Observed language-handoff acceptance — 2026-10-22

Issue #6 resolves English/German recordings as complete versions and transfers study context through the existing full-document language links. The destination consumes a small validated `study` query without reloading again, restores paused after viewer/media readiness, and preserves caption choice plus the original pre-study Explore orbit/zoom. Different recording identities select the corresponding stable chapter's beginning; the same English fallback retains exact time. Query data supplies no media URLs. There is no persistent progress/preference store or runtime voice service.

The user approved the German script and Rowan access before generation, heard the first full German track, requested a World pronunciation correction, and selected the revised World **Generation 2** as “almost fine now.” The [German intake](docs/assets/ankylosaurus-narration.de.md) preserves that qualified assessment, selected bytes, independent alignment, date/voice/terms and non-secret Starter-plan observation. English remains the previously auditioned 2026-10-04 baseline. The agent's browser checks below used real decoded audio in muted headless Chromium; they are not an independent audible pronunciation assessment.

Observed against the built static exhibit on port 4173 and actual separately served MP3/GLB files on port 5194:

- **Absent-German baseline:** before configuring German, English→German from paused Armor inspection retained **28.125 s**, captions off, and the English narration label. The anatomy note and manual paused-study camera were discarded. The query disappeared, Play/Pause received focus, audio remained paused, and Exit restored the original rotated/zoomed Explore canvas pixel-for-pixel. All 12 viewport/language/text-size combinations also preserved a 42 s fallback handoff. An invalid query was consumed into ordinary Explore without loading audio.
- **Two independent real versions:** English duration **51.643938 s**, German **52.4015 s**. English World at 42 s mapped to German World at **40.51591836734694 s**; a second language change mapped to English World at **39.053061224489795 s**. Caption choice survived, the German playback label was visible, the language link worked with keyboard Enter, and Exit after manual paused-study rotation restored the original Explore canvas exactly through both handoffs.
- **Complete recordings and layout:** each actual recording played continuously through all four chapters to natural completion, unloaded audio and returned focus to Start. Both document languages at **1365×768 / 1024×768 / 390×844**, each at **100% / 200% root text**, passed with matching caption language, controls at least 44×44 px, study text at least 16 px, and no horizontal document overflow. Enlarged-text cases emulated reduced motion. Final German desktop and enlarged-phone screenshots were visually inspected; content wraps below the specimen. Captions remain outside live regions; chapter/status messages provide meaningful announcements.
- **Failures and readiness:** a configured real German recording returning HTTP 503 produced explicit Retry/Exit without switching to English. Holding destination-document navigation verified that old-page real audio had already stopped and unloaded; a 204 navigation response left the original localized document readable and Exit usable. Navigation while the English MP3 was held before metadata preserved the latest requested World position and restored paused with actual German audio. Holding the destination GLB verified early query consumption, readable static content and no premature audio request; releasing it restored the correct paused German chapter. No unexpected page errors occurred in the final probes.
- **Verification:** `npm run check` reported zero errors/warnings; camera, anatomy and the single framework-free study regression check passed. The development-mode static build passed with the existing large-chunk and color-environment warnings. Real German media decoded successfully; its served HEAD response reported the matching 838,469-byte MP3. No recording/model/font binaries were present in application output. Temporary probes were removed; only the existing regression check and source metadata/docs remain.

Limits: desktop Chromium viewport, text-size and reduced-motion emulation; no physical-device, other-browser or actual screen-reader session. Emulated touch and every anatomy gesture were not re-exercised for this ticket. Successful Retry recovery and a new mid-playback WebGL context-loss test were not repeated. Provider account screenshots/billing details remain private, and no production CDN or model publication-rights verification was performed. Cinema/particles remain issue #7.

## Cinema presentation — issue #7

Requested playback now fades the stage and surrounding surfaces to a darker warm-charcoal treatment, darkens both the specimen plinth and Scale support, and adds a soft warm spotlight over the specimen. Captions, chapter graphics, language links, and playback controls retain their readable colors and focus indicators. The existing key light supplies shadows; the spotlight adds no shadow pass or second animation loop.

One 64-point cloud adds faint warm dust within the spotlight. A tiny in-memory soft sprite needs no media request. Dust uses the existing render loop, a single additional draw call, normal depth testing against nearer anatomy, and no depth writes or shadows. Positions drift at varied speeds with gentle depth and radial movement within the beam and follow specimen calibration. The cloud fades with the cinema lighting and stops updating positions when hidden. Reduced motion hides it immediately, including preference changes during playback. Its geometry, material, and texture are disposed together.

Presentation follows playback intent independently of camera ownership: loading, buffering, and playing seeks retain cinema mode; Pause, media errors, Exit, and completion restore Explore appearance. Paused seeks and incoming language handoffs retain normal lighting. Entry/return fades take 350 ms and can reverse without a jump. Reduced motion settles immediately, including when the preference changes during a fade.

Observed on the built static preview with the actual model and English/German MP3s in muted headless Chromium:

- Start, Pause, paused Armor seek and anatomy inspection, Resume, Scale, and Exit passed. Exit restored the original rotated/zoomed Explore canvas pixel-for-pixel after the fade.
- English→German navigation restored paused with normal lighting and native audio stopped. Reduced motion, German phone layout at 390×844 with 200% root text, and native completion returned the normal presentation without horizontal overflow or page errors. Desktop Meet/Scale/Armor/World and enlarged German phone screenshots were inspected. A native-media error event injected during World restored normal presentation and exposed Retry/Exit.
- Svelte checks, camera/anatomy/study regressions, and the development-mode static build passed. The presentation/dust regressions cover interruption, repeated requests, exact restoration, motion inside the spotlight, hidden/reduced-motion updates, preference changes, and cleanup. Browser draw-call instrumentation confirmed the 48-point cloud during normal playback, with no particle draws in Explore, paused inspection, or reduced-motion playback. Browser checks cover Chromium emulation; physical devices and other browsers were not exercised.

## Playback refinement — issue #11, 2026-10-24

Back 5 seconds, Play/Pause, and Forward 5 seconds now sit directly beneath the specimen, above captions and the timeline. Named chapter buttons remain below the timeline. Relative skips use the existing seek controller, preserve playback intent, clamp to the recording bounds, and accumulate rapid requests even before metadata arrives. Playing through the endpoint completes the study; a paused endpoint stays available for inspection.

The control group stacks when its width is small relative to text size. Browser review covered desktop and 390×844 phone layouts, English/German labels, keyboard skips, paused language handoff, Exit focus, and both languages at 200% root text without horizontal overflow or clipped controls. The enlarged-text fixture was applied only to temporary build output and then removed. Dust increased from 48 to 64 motes with more visible, varied motion; its existing fade, reduced-motion, depth-testing, and disposal behavior remains covered by the study checks.

Svelte, camera, anatomy, and study checks passed, along with the development-mode static build. Production mode still requires externally hosted media rather than this workspace's loopback URLs. Browser review used desktop Chromium with phone viewport emulation; physical devices and an actual screen-reader session were not tested.

## Licensing and media boundary

The root MIT license applies to application code and project-owned text, **not separately hosted media or the supplied model by implication**. Ankylosaurus-specific publication authorization is recorded in its [provenance document](docs/assets/ankylosaurus.md) and does not extend to Stegosaurus. Stegosaurus publication authorization and hosting remain unconfirmed; see its [asset record](docs/assets/stegosaurus.md). Scientific accuracy has not been independently validated. GLB, textures, recordings, font binaries, and source media remain outside Git and application static output; the narrowly tracked procedural Stegosaurus source is the documented exception for reproducible generation. Ignore rules do not protect already tracked files; inspect staged paths before publishing changes.

Typography is loaded externally through Google Fonts, with Georgia/system sans fallbacks. Both families use SIL Open Font License 1.1:

- [Newsreader — copyright 2020 The Newsreader Project Authors](https://github.com/google/fonts/blob/main/ofl/newsreader/OFL.txt).
- [Source Sans 3 — copyright 2010–2020 Adobe; Reserved Font Name “Source”](https://github.com/google/fonts/blob/main/ofl/sourcesans3/OFL.txt).

No font binaries are bundled. External font requests are optional for functionality; apply any additional privacy/hosting policy at deployment.

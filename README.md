# Fieldbook 3D

One explorable, resting **Ankylosaurus** exhibit: prerendered English/German content, a browser-only Three.js GLB viewer, warm lighting and a simple plinth. Armor, head, and tail-club inspection and narrated Meet playback are delivered locally. The full English recording is configured, but Start field study deliberately plays only Meet; later guided chapters remain outside issue #1.

## Issue #1 delivery gate — 2026-10-04

[Issue #1](https://github.com/merlinbr/fieldbook-3d/issues/1) has no comments or native blocking issues at the prerequisite review. It delivers Meet playback only, not the later four-chapter navigation/visual acceptance.

The user explicitly approved the full four-section English script unchanged before production recording and approved all four regenerated segments after listening again. The selected voice is ElevenLabs **Rowan — Gentle, Soft-Spoken & Warm**, ID `kLhAstPcnnPxqzk6gS5i`; the owner confirmed generation on **2026-10-04 after Starter activation**. The selected full track is `media-dev/ankylosaurus-en.mp3` (**51.643938 seconds**); prior Inworld and free-plan ElevenLabs alternatives remain preserved but unselected. The source-controlled [complete approved version](docs/assets/ankylosaurus-narration.en.json) contains recording-derived chapters, 16 captions, visual cues, and non-secret provenance.

The recording intake and **real narrated Meet static-exhibit acceptance are complete locally**. [Recording documentation](docs/assets/ankylosaurus-narration.md) records the owner's audition, generation/paid-plan evidence reference, applicable ElevenLabs terms/restrictions, voluntary attribution, exact media hash, and alignment method. Billing evidence, credentials, model, and audio remain outside Git/application output; there is no runtime ElevenLabs integration.

The existing viewer integrates native audio, composed hero framing, focused lighting, pause-to-inspect, resume, default captions, explicit Retry/Exit, and saved-view restoration. Only Meet plays, ending at `scale.start = 13.635918367` seconds. Missing complete metadata still disables Start with a localized explanation. German UI visibly labels English narration and uses matching English captions. No later chapter navigation/visuals or German recording were added; production hosting/model publication rights and physical-device testing remain separate limits.

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

Open `/en/specimens/ankylosaurus/` or `/de/specimens/ankylosaurus/`. `/` redirects to the English exhibit and contains a fallback link. Locale links reload the document; no saved preferences, cookies, or language detection are required.

The ignored `media-dev/ankylosaurus.glb` is a real export of the supplied example, not a generated substitute in the application. It is present in this local workspace but deliberately absent from Git. A fresh checkout needs that asset regenerated or a rights-cleared externally hosted model URL. See [asset provenance and regeneration](docs/assets/ankylosaurus.md). Keep the supplied `example project/low-poly/` and its dependencies unchanged.

`npm run media:dev` serves the fixed model and optional `media-dev/ankylosaurus-en.mp3` endpoints on `http://127.0.0.1:5194`, with GET/HEAD, byte ranges, and CORS. Missing audio returns 404. It does not serve application files or expose a directory listing. This workspace's ignored `.env` is configured with the approved full version. For a fresh checkout, set `PUBLIC_ANKYLOSAURUS_STUDY_VERSION` to the [complete JSON version](docs/assets/ankylosaurus-narration.en.json), not just its URL; see [configuration instructions](docs/assets/ankylosaurus-narration.md#configure-the-approved-recording). No default or fabricated timings are used. Keep the media process running; restart an older GLB-only responder to load the new audio route.

## Check and build

```sh
npm run check
npm run check:camera
npm run check:anatomy
npm run check:study
npm run build -- --mode development
npm run preview
```

`npm run check` first generates the ignored Paraglide runtime, so it works before a dev server or build has been run. `tools/paraglide.mjs` supplies the same compiler options to checks and the Vite plugin.

Development mode defaults to the separate loopback model URL. These commands exercise **local static media delivery**, not a production CDN deployment. The static site is written to `build/`; use a static host that maps directory URLs to `index.html`. No application server or locale middleware is required after prerendering.

Production requires an explicit externally hosted model URL, supplied through the environment or a local ignored `.env` file:

```sh
PUBLIC_ANKYLOSAURUS_MODEL_URL=https://your-asset-host.example/ankylosaurus.glb npm run build
```

The example above uses POSIX shell syntax. In PowerShell, use `$env:PUBLIC_ANKYLOSAURUS_MODEL_URL = 'https://your-asset-host.example/ankylosaurus.glb'`, then `npm run build`.

This public, **build-time** value must be an absolute HTTP(S) URL without credentials. Production rejects missing/loopback URLs. The asset host must allow CORS from the application's origin. No asset host/CDN was provisioned and no model publication rights were verified. Configure the deployment's actual URL; do not ship the loopback default or put GLB files in `static/`.

## Viewer behavior

Drag to orbit; wheel/pinch to zoom. Native buttons provide zoom, four orbit directions, and reset. Panning and automatic motion are disabled. Zoom is bounded to 0.6–2.5; vertical orbit excludes the underside. Resize retains orbit and zoom. Reset frames projected model/plinth bounds with a 15% margin, rather than the proposed enclosing-sphere fit that made the desktop specimen too small. The sphere still determines camera distance, depth planes, and lighting scale.

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

## Licensing and media boundary

The root MIT license applies to application code and project-owned text, **not separately hosted media or the supplied model by implication**. Model reuse/publication rights and scientific accuracy remain unresolved; verify them before public media publication. The GLB, textures, recordings, font binaries, and source media must remain outside Git and application static output. Ignore rules do not protect already tracked files; inspect staged paths before publishing changes.

Typography is loaded externally through Google Fonts, with Georgia/system sans fallbacks. Both families use SIL Open Font License 1.1:

- [Newsreader — copyright 2020 The Newsreader Project Authors](https://github.com/google/fonts/blob/main/ofl/newsreader/OFL.txt).
- [Source Sans 3 — copyright 2010–2020 Adobe; Reserved Font Name “Source”](https://github.com/google/fonts/blob/main/ofl/sourcesans3/OFL.txt).

No font binaries are bundled. External font requests are optional for functionality; apply any additional privacy/hosting policy at deployment.

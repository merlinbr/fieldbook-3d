# Fieldbook 3D

One explorable, resting **Ankylosaurus** exhibit: prerendered English/German content, a browser-only Three.js GLB viewer, warm lighting and a simple plinth. Armor, head, and tail-club inspection is delivered. Guided Field Study remains pending.

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

`npm run media:dev` serves only `GET /ankylosaurus.glb` on `http://127.0.0.1:5194`, with CORS enabled. Other paths/methods return 404. Keep this process running while using the development app or local static output. It does not serve application files or expose a general directory listing.

## Check and build

```sh
npm run check
npm run check:camera
npm run check:anatomy
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

Markers and leader lines hide behind the specimen or outside the camera view; an open note remains readable. Named buttons can select hidden regions. Narrow layouts dock the same note below the stage, with controls below it. Close/Escape from the note restores focus to its anatomy button; viewer failure restores focus to the section. Educational wording and scientific limits are in the [approved anatomy specification](docs/superpowers/specs/2026-10-03-anatomy-inspection-design.md).

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

Limits: touch was Chromium/CDP emulation, not a physical phone/tablet. Accessibility-tree and live-region inspection were performed, not an actual screen-reader session. Text enlargement used a 200% root font-size override, not every browser's text-zoom implementation. This was development-mode static smoke with local media, not production CDN deployment. Model publication rights/scientific accuracy remain unresolved. Field Study, narration, and playback were not added.

## Licensing and media boundary

The root MIT license applies to application code and project-owned text, **not separately hosted media or the supplied model by implication**. Model reuse/publication rights and scientific accuracy remain unresolved; verify them before public media publication. The GLB, textures, recordings, font binaries, and source media must remain outside Git and application static output. Ignore rules do not protect already tracked files; inspect staged paths before publishing changes.

Typography is loaded externally through Google Fonts, with Georgia/system sans fallbacks. Both families use SIL Open Font License 1.1:

- [Newsreader — copyright 2020 The Newsreader Project Authors](https://github.com/google/fonts/blob/main/ofl/newsreader/OFL.txt).
- [Source Sans 3 — copyright 2010–2020 Adobe; Reserved Font Name “Source”](https://github.com/google/fonts/blob/main/ofl/sourcesans3/OFL.txt).

No font binaries are bundled. External font requests are optional for functionality; apply any additional privacy/hosting policy at deployment.

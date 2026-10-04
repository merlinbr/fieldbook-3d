# Fieldbook 3D

One explorable, resting **Ankylosaurus** exhibit: prerendered English/German content, a browser-only Three.js GLB viewer, warm lighting and a simple plinth. Anatomy annotations and guided Field Study are not implemented by this milestone.

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

## Licensing and media boundary

The root MIT license applies to application code and project-owned text, **not separately hosted media or the supplied model by implication**. Model reuse/publication rights and scientific accuracy remain unresolved; verify them before public media publication. The GLB, textures, recordings, font binaries, and source media must remain outside Git and application static output. Ignore rules do not protect already tracked files; inspect staged paths before publishing changes.

Typography is loaded externally through Google Fonts, with Georgia/system sans fallbacks. Both families use SIL Open Font License 1.1:

- [Newsreader — copyright 2020 The Newsreader Project Authors](https://github.com/google/fonts/blob/main/ofl/newsreader/OFL.txt).
- [Source Sans 3 — copyright 2010–2020 Adobe; Reserved Font Name “Source”](https://github.com/google/fonts/blob/main/ofl/sourcesans3/OFL.txt).

No font binaries are bundled. External font requests are optional for functionality; apply any additional privacy/hosting policy at deployment.

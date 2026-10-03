# First Exhibit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development when execution has genuinely independent slices; otherwise implement inline. Steps use checkbox (`- [ ]`) syntax for tracking. Read the approved milestone spec before implementation; this document is not approval to start coding.

**Goal:** Deliver a statically generated English/German Ankylosaurus exhibit loading the exported example model, with usable mouse, touch, and keyboard exploration.

**Architecture:** Svelte owns localized content, controls, status, and browser lifetime. One browser-only Three.js module owns the specimen scene and GLB loading. Local media is served by a separate loopback server; deployment references externally hosted media.

**Tech Stack:** SvelteKit, Svelte, TypeScript, Vite, adapter-static, Three.js, Paraglide JS, native HTML/CSS, Node.js and npm.

## Global constraints

- Spec: `docs/superpowers/specs/2026-10-03-first-exhibit-design.md`; complete prototype direction: `fieldbook-3d-context.md`.
- No app/model changes until user reviews this spec and plan.
- One Ankylosaurus, static resting pose, one simple ground plinth. No guided-study scaffolding or disabled Start button.
- English/German URLs: `/en/specimens/ankylosaurus/`, `/de/specimens/ankylosaurus/`. URL wins; locale changes reload the document.
- Browser-only Three.js; preserve SSR/prerendering for content. No SPA fallback or application backend.
- Newsreader headings, Source Sans 3 controls/body, externally served fonts with fallbacks. No font binaries in Git.
- Essential text at least 16 CSS pixels; native control targets at least 44 by 44 CSS pixels.
- Local model: ignored `media-dev/ankylosaurus.glb`; public configuration: `PUBLIC_ANKYLOSAURUS_MODEL_URL`.
- Preserve the supplied example and existing license/context files. Never stage unrelated example files or dependencies.
- No exported GLB, texture, audio, font, or source-media binaries in Git or static app output.
- Run integrated checks/build after edits, not repeatedly between incomplete tasks. Each task has an observable smoke scenario; the final task runs the full verification matrix.
- Installed runtime observed during planning: Node v24.17.0 and npm 12.0.2. Use Node 24 LTS for native TypeScript assertion checks.
- Registry observations during planning: SvelteKit 3.0.0, adapter-static 4.0.0, Paraglide 2.25.4, Three.js 0.186.1. Use these compatible versions and lock dependencies. Keep the example's existing dependency versions unchanged.
- SvelteKit 3 configuration belongs in `vite.config.ts`; do not copy legacy `svelte.config.js` from older integration examples.

## Proposed file map

| Path | Responsibility |
| --- | --- |
| `.gitignore`, `.env.example` | Ignore dependencies/generated/media/secrets; document model URL |
| `package.json`, `package-lock.json`, `tsconfig.json`, `vite.config.ts`, `src/app.d.ts` | Minimal CLI-generated app setup and scripts |
| `src/app.html`, `src/hooks.ts`, `src/hooks.server.ts` | Document language and Paraglide routing/prerender integration |
| `project.inlang/settings.json`, `messages/en.json`, `messages/de.json` | Interface translation sources |
| `src/lib/paraglide/` | Generated, ignored translation runtime |
| `src/routes/+layout.ts`, `src/routes/+layout.svelte` | Prerender options and global CSS |
| `src/routes/+page.svelte` | Root English entry with prerendered redirect and fallback link |
| `src/routes/specimens/ankylosaurus/+page.svelte` | One localized exhibit, metadata, language navigation |
| `src/lib/specimens/ankylosaurus.ts` | Stable specimen ID, model URL, project-owned EN/DE description |
| `src/lib/viewer/SpecimenViewer.svelte` | Mount, native controls, localized status |
| `src/lib/viewer/specimen-viewer.ts` | Renderer/camera/GLB/controls/lifetime |
| `src/lib/viewer/camera-fit.ts` | Small pure orthographic-fit calculation |
| `src/app.css` | Exhibit layout, fonts, palette, responsive styles |
| `tools/serve-dev-media.mjs` | Serve only the ignored local model on loopback |
| `checks/camera-fit.mjs` | One framework-free geometry/framing regression check |
| `README.md`, `docs/assets/ankylosaurus.md` | Run/build instructions, media boundaries, provenance and observed verification |

The application imports no example source at runtime. Export uses the example in a temporary browser operation; no procedural asset generator or export page is shipped with the application. No separate terminal component until its content actually needs one.

## Task 1: Prepare and verify the real specimen asset

**Files:** Create `.gitignore`, `tools/serve-dev-media.mjs`, `docs/assets/ankylosaurus.md`; write ignored `media-dev/ankylosaurus.glb`. Read, do not modify, `example project/low-poly/ankylosaurus.js` and `model-geometry.js`.

**Produces:** GLB whose scene contains `headGroup`, `armorGroup`, `clubMesh`; asset URL `http://127.0.0.1:5194/ankylosaurus.glb`.

- [ ] Add ignore rules before exporting. Include `node_modules/`, `.svelte-kit/`, `build/`, `dist/`, `.env`, `.env.*`, exception `!.env.example`, `src/lib/paraglide/`, `media-dev/`, and media extensions `*.glb`, `*.gltf`, `*.bin`, `*.blend`, `*.fbx`, `*.obj`, `*.png`, `*.jpg`, `*.jpeg`, `*.webp`, `*.wav`, `*.mp3`, `*.mp4`, `*.woff`, `*.woff2`. Do not untrack or delete existing user files automatically. Text SVG artwork can remain tracked.
- [ ] Run the supplied example with its existing dependencies: `npm run dev -- --host 127.0.0.1 --port 5193` from `example project/low-poly/`. Open it and pause walking for a source reference screenshot.
- [ ] In a throwaway browser operation on that origin, construct a fresh resting model and export explicit faceted geometry. Reuse conversions for shared geometries; do not mutate the example's displayed animal. Core export operation:

```js
const THREE = await import('three'); // resolve through the example's Vite module graph
const { createLowPolyAnkylosaurus } = await import('/ankylosaurus.js');
const { GLTFExporter } = await import('three/addons/exporters/GLTFExporter.js');
const model = createLowPolyAnkylosaurus();
const faceted = new Map();
model.traverse((part) => {
  if (!part.isMesh) return;
  const original = part.geometry;
  if (!faceted.has(original)) {
    const geometry = original.index ? original.toNonIndexed() : original.clone();
    geometry.computeVertexNormals();
    faceted.set(original, geometry);
  }
  part.geometry = faceted.get(original);
});
const scene = new THREE.Scene();
scene.add(model);
const binary = await new GLTFExporter().parseAsync(scene, { binary: true });
if (!(binary instanceof ArrayBuffer)) throw new Error('Expected binary GLB');
```

Use a temporary Vite-served module for bare package imports if page evaluation cannot resolve them. Transfer the exported bytes using browser download or tool return to `media-dev/ankylosaurus.glb`. Remove the temporary module. Do not commit export pages, generated media, or screenshot files.

- [ ] Reload bytes with GLTFLoader in the browser. Compare source and loaded object bounds (tolerance 0.001 metres), finite vertex positions, resting ground clearance, named target existence, materials/colors, and visually inspect faceted normals. If appearance differs, correct the export geometry, not the app lighting to conceal it. No model compression.
- [ ] Implement the development server as a fixed-file endpoint, not a general file server:

```js
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
const file = new URL('../media-dev/ankylosaurus.glb', import.meta.url);
createServer(async (request, response) => {
  response.setHeader('Access-Control-Allow-Origin', '*');
  if (request.url !== '/ankylosaurus.glb' || request.method !== 'GET') {
    response.writeHead(404).end();
    return;
  }
  try {
    const bytes = await readFile(file);
    response.writeHead(200, {
      'Content-Type': 'model/gltf-binary',
      'Content-Length': bytes.length,
      'Cache-Control': 'no-store'
    });
    response.end(bytes);
  } catch {
    response.writeHead(404, { 'Content-Type': 'text/plain' });
    response.end('Local specimen asset is unavailable.');
  }
}).listen(5194, '127.0.0.1');
```

- [ ] Run `node tools/serve-dev-media.mjs`, fetch the GLB in the browser, and confirm a missing endpoint returns 404. Record provenance: supplied example path, export date, geometry transformations, no textures/animation, and rights unverified pending owner confirmation. Local use does not grant publication/reuse rights.

## Task 2: Deliver a localized static exhibit document

**Files:** Create root application configuration, translation sources, hooks, root layouts/pages, specimen content, `.env.example`; start `README.md`. Preserve existing root files.

**Consumes:** Task 1 model URL. **Produces:** Two prerendered localized documents and stable specimen content.

- [ ] Generate the minimal TypeScript app in an empty temporary directory, avoiding overwriting this nonempty repository:

```sh
npx sv create .fieldbook-scaffold --template minimal --types ts --no-add-ons --no-install
```

Transfer only scaffold application/config files into the repository using file tools, then remove the temporary scaffold. Omit default demo copy/artwork. Install selected SvelteKit 3/adapter-static 4 and Three.js/Paraglide versions; use the scaffold's compatible Svelte/Vite/TypeScript dependencies. Keep a root npm lockfile. Add `dev`, `build`, `preview`, `check`, `check:camera`, and `media:dev` scripts; the last two execute `node checks/camera-fit.mjs` and `node tools/serve-dev-media.mjs`. Do not add a test framework or UI library.

- [ ] Add static adapter to the SvelteKit plugin in `vite.config.ts`, preserving generated compiler configuration. Enable strict static output and specify entries for `/`, `/en/specimens/ankylosaurus/`, `/de/specimens/ankylosaurus/`. Root `+layout.ts`:

```ts
export const prerender = true;
export const trailingSlash = 'always';
```

Do not set `ssr = false`. No static adapter fallback file.

- [ ] Initialize Paraglide with English base locale and `['en', 'de']`. Use URL-only strategy with base fallback and explicit prefixes for BOTH locales:

```ts
paraglideVitePlugin({
  project: './project.inlang',
  outdir: './src/lib/paraglide',
  emitTsDeclarations: true,
  strategy: ['url', 'baseLocale'],
  urlPatterns: [{
    pattern: '/:path(.*)?',
    localized: [
      ['en', '/en/:path(.*)?'],
      ['de', '/de/:path(.*)?']
    ]
  }]
});
```

Use the documented `paraglideMiddleware` in `hooks.server.ts` to replace `%lang%`/`%dir%` in `src/app.html`; export the `deLocalizeUrl` reroute from `src/hooks.ts`. Middleware runs at build time, not as a required deployment service. Do not add cookie/localStorage strategy.

- [ ] Add interface translations for loading, asset failure, unavailable WebGL, reload, viewer label, instruction text, zoom in/out, reset, four orbit buttons, and language-navigation label. Use concrete paired copy, for example `Loading specimen…` / `Exemplar wird geladen…`, `The specimen could not be loaded.` / `Das Exemplar konnte nicht geladen werden.`, `3D viewing is unavailable in this browser.` / `Die 3D-Ansicht ist in diesem Browser nicht verfügbar.`. Keep specimen descriptions in a separate `ankylosaurus.ts` object:

```ts
export const ankylosaurusText = {
  en: { description: 'An armored dinosaur with a distinctive tail club.', reconstruction: 'A stylized reconstruction.' },
  de: { description: 'Ein gepanzerter Dinosaurier mit einer markanten Schwanzkeule.', reconstruction: 'Eine stilisierte Rekonstruktion.' }
} as const;
```

Scientific name: `Ankylosaurus magniventris`; no unverified age/size data. Select text via generated `getLocale()` inside component execution, not a module-level shared locale variable.

- [ ] `.env.example` documents `PUBLIC_ANKYLOSAURUS_MODEL_URL=http://127.0.0.1:5194/ankylosaurus.glb` for local static smoke. Resolve it from build-time public env, falling back to loopback only in development mode. Validate absolute HTTP(S) URLs; reject credentials. Default production builds reject absent/loopback URLs with an actionable build error. Local static smoke builds explicitly use `--mode development`; deployment requires a real externally hosted URL. Document CORS and no secret keys.
- [ ] Root `+page.svelte` emits an English exhibit link and a meta-refresh to the English URL. The specimen page provides heading, description, reconstruction note, title metadata, and locale links with `data-sveltekit-reload`. Use `localizeHref`/SvelteKit path resolution; do not manually synchronize a language store. An exhibit without initialized 3D still displays meaningful text.
- [ ] Launch the app and directly open both locale paths. Observe correct initial document `lang`, headings, localized text, and locale-link navigation. This smoke is document/routing verification; final static output verification is Task 4.

## Task 3: Integrate the actual explorable scene

**Files:** Create `SpecimenViewer.svelte`, `specimen-viewer.ts`, `camera-fit.ts`, `checks/camera-fit.mjs`, `src/app.css`; modify specimen page and global layout.

**Consumes:** Absolute model URL, localized messages and specimen text. **Produces:** Mounted scene with controls and owned disposal.

**Viewer interface (defined in `specimen-viewer.ts`):**

```ts
export type ViewerState = 'loading' | 'ready' | 'error' | 'unavailable';
export type OrbitDirection = 'left' | 'right' | 'up' | 'down';
export type ViewerHandle = {
  reset(): void;
  zoom(factor: number): void;
  orbit(direction: OrbitDirection): void;
  dispose(): void;
};
export function createSpecimenViewer(
  container: HTMLElement,
  modelUrl: string,
  onState: (state: ViewerState) => void
): ViewerHandle;
```

No public scene mutation API, selection engine, store, or asset cache for one specimen.

- [ ] Implement the pure camera fitting seam and one permanent assertion check. The radius is the loaded model's bounding-sphere radius, aspect is the measured container width/height, padding is 15%. Reject nonfinite/nonpositive input rather than returning an unusable projection:

```ts
export function orthographicHalfHeight(radius: number, aspect: number): number {
  if (!Number.isFinite(radius) || radius <= 0 || !Number.isFinite(aspect) || aspect <= 0) {
    throw new RangeError('Camera fit requires positive finite radius and aspect');
  }
  return radius * 1.15 * Math.max(1, 1 / aspect);
}
```

`checks/camera-fit.mjs` imports the TypeScript module using Node 24 native type stripping. Its assertions:

```js
import assert from 'node:assert/strict';
import { orthographicHalfHeight } from '../src/lib/viewer/camera-fit.ts';
for (const aspect of [1365 / 768, 1024 / 768, 390 / 844]) {
  const radius = 5;
  const halfHeight = orthographicHalfHeight(radius, aspect);
  assert.ok(halfHeight + 1e-9 >= radius * 1.15);
  assert.ok(halfHeight * aspect + 1e-9 >= radius * 1.15);
}
for (const [radius, aspect] of [[0, 1], [-1, 1], [1, 0], [1, NaN], [Infinity, 1]]) {
  assert.throws(() => orthographicHalfHeight(radius, aspect), RangeError);
}
```

Use this calculation in the actual viewer, not a duplicated fit expression. Run this check during final integrated verification.

- [ ] Implement the scene with `WebGLRenderer`, `OrthographicCamera`, `OrbitControls`, and `GLTFLoader`. Catch renderer initialization failure and emit `unavailable`; model loading/parsing or invalid bounds emits `error`. No substitute geometry. Apply shadows explicitly to imported meshes; imported files do not preserve Three.js shadow flags. Set ACES filmic tone mapping, capped pixel ratio `Math.min(devicePixelRatio, 2)`, warm hemisphere/key/fill lights, and a simple neutral plinth under the loaded bounds. Shadows are a visual setting, not embedded asset content.
- [ ] Compute Box3 bounds and a bounding sphere after load. Put controls target at the sphere center and choose a normalized three-quarter direction like `(-0.4, 0.3, 1)` at distance `radius * 4`; keep model transforms/orientation intact. Near plane `radius * 0.01`, far plane `radius * 20`. Set half-width to half-height times aspect. Fit resets zoom to 1, bounded within `[0.6, 2.5]`; panning is disabled and polar angle excludes the underside. Size the plinth from actual horizontal bounds so feet do not sink into it.
- [ ] Observe the container with ResizeObserver. Skip zero-size frames, update frustum and renderer only on size changes, preserving orbit and zoom. Preallocate vectors used repeatedly; no per-frame Box3 calculation. Render with `setAnimationLoop`, update controls, and avoid automatic specimen movement. Use reduced-motion media-query state to disable damping. Dispose its listener on unmount.
- [ ] `zoom(factor)` clamps zoom to `[0.6, 2.5]` and updates the projection; buttons use factors 1.2 and 1/1.2. `orbit(direction)` changes spherical azimuth/polar angle by 15 degrees and clamps the polar angle; it never moves the target. Reset restores initial direction/target/zoom and clears damping momentum before restoring damping. Native buttons expose the same controls without requiring pointer gestures.
- [ ] Define one idempotent disposal owner. Stop the animation loop, disconnect ResizeObserver, remove media-query/context-loss listeners, dispose OrbitControls, dispose unique scene geometries/materials/textures using Sets, dispose renderer, remove its canvas. On delayed GLB completion after disposal, dispose the incoming GLB and return without state notification. Context loss stops rendering and emits `unavailable` with reload UI; do not implement speculative recovery/retry machinery.
- [ ] Mount through Svelte `onMount` with dynamic import. Use an explicit mounted/disposed flag around the import so navigation during import cannot construct a stale viewer. `onMount` itself remains synchronous and returns cleanup; asynchronous work is nested. Store the handle only after creation and dispose on teardown. Status UI is a live region; errors include native localized reload action. Controls stay unavailable until ready. Give the canvas a localized accessible name and associate orbit/zoom instructions.
- [ ] Integrate the viewer into the specimen page. Global CSS supplies warm charcoal/olive/stone/bone colors and amber focus/active accents; externally load Newsreader/Source Sans 3 with serif/sans-serif fallbacks. Keep text at edges, model dominant, no cards obscuring the silhouette. Scope `touch-action` to the canvas; ensure document scrolling remains usable outside it. Stack controls/text at narrow widths. No fixed desktop height that collapses phone interaction area.
- [ ] Smoke the actual scene on desktop: reset framing, orbit, zoom bounds, keyboard rotation, and resize. Capture the rendered model, not only DOM text. Confirm the exported model retains head/armor/club visibility and the plinth meets its feet. Detailed acceptance matrix follows in Task 4.

## Task 4: Verify the static app and document the delivered milestone

**Files:** Update `README.md`, provenance, and `fieldbook-3d-context.md` current-priorities section after implementation succeeds. No new test framework or permanent browser suite.

**Consumes:** Integrated app and separate local model server. **Produces:** Observed acceptance evidence, clean media boundary, usable run instructions.

- [ ] Run integrated checks once after all code changes:

```sh
npm run check
npm run check:camera
npm run build -- --mode development
```

Expected: type checks/assertions succeed, strict static build produces `/en/specimens/ankylosaurus/index.html`, `/de/specimens/ankylosaurus/index.html`, and a root entry. These are expectations, not results already observed. After a failure, fix the cause and rerun only the failed check until integration needs rechecking.

- [ ] Serve `build/` with a throwaway static HTTP server that maps directory requests to `index.html`; do not rely exclusively on Vite dev rendering. Keep the separate `media:dev` process running. Verify both exhibit pages by direct load and refresh, root navigation, HTML language before hydration, font fallbacks, and no console/page errors. No application server or locale middleware should be required at runtime.
- [ ] At 1365x768, 1024x768, and 390x844, inspect screenshots and assert document scroll width does not exceed viewport width. Confirm the whole animal at reset and readable nonoverlapping controls. Exercise drag and wheel; emulate touch drag and pinch using Chromium input APIs. Exercise native controls with keyboard focus/activation. State explicitly that touch emulation is not physical-device proof.
- [ ] Orbit/zoom then resize and reset. Verify resize retains the user's orientation/zoom and reset restores full-animal framing. Hit zoom/polar limits using both pointer and buttons. Test reduced motion: no automatic movement, no damped continuation after releasing the controls.
- [ ] Block the GLB request: assert localized error replaces loading and text/language links remain usable. Reload with WebGL unavailable: assert localized unavailable state. Delay model fetch and navigate/reload before completion: observe no late canvas or uncaught errors. Use a throwaway harness to mount/dispose the viewer during delayed loading if normal navigation terminates the request before exercising its late-load branch. Remove the harness afterward.
- [ ] Switch English/German while ready and while failure UI is visible. Confirm URL, initial `lang`, descriptions, instructions, controls, and errors agree. Deny font requests and storage access; confirm readable fallback typography and intact interaction.
- [ ] Inspect static output using file tools: no GLB, procedural asset generator, recording, font binary, or `media-dev/` copied to `build/`. Before any implementation commit, inspect staged paths for forbidden media; ignore rules do not cover already tracked files. Do not stage the supplied example accidentally.
- [ ] Document exact local commands (`npm install`, `npm run media:dev`, `npm run dev`), local-static verification mode, production model URL/CORS requirement, media-rights gate, and font licenses. Update the context priorities to reflect only what was actually delivered; anatomy notes and guided study remain pending. Record observed browser/check results and physical-device limits. Remove all temporary export/static-server/browser harness files and stop inspection services.

## Coverage and execution order

Task 1 covers GLB fidelity, named anatomy parts, media isolation and provenance. Task 2 covers static URLs, SSR, root entry, interface localization, separate specimen text and model configuration. Task 3 covers the real scene, interaction, responsive presentation, keyboard access, status states and lifecycle. Task 4 exercises every acceptance criterion against static output and updates documentation.

Default execution is inline: this small milestone has a shared asset/setup prerequisite, and dividing it into many agents would add coordination without independent deliverables. After setup, localization/page work and the viewer can be separate slices only if that division is useful; parent owns their integration and final verification. No agent runs checks/build/formatting while sibling edits are in flight.

## Planning review

The scope deliberately excludes notes/playback without changing the complete prototype requirements. Every exposed viewer action is defined above; statuses are consistent between module and Svelte wrapper. Faceted normals, imported shadow flags, late-load disposal, URL-driven prerendering, and local media exclusion are explicit rather than assumed. Production asset rights/hosting are deployment prerequisites, not reasons to invent a model or silently bundle media. No GLB export or application implementation has been performed by writing this plan.

References: [SvelteKit static adapter](https://svelte.dev/docs/kit/adapter-static), [CLI creation](https://svelte.dev/docs/cli/sv-create), [Paraglide SvelteKit](https://paraglidejs.com/sveltekit), [URL strategy](https://paraglidejs.com/strategy), [GLTFExporter](https://threejs.org/docs/pages/GLTFExporter.html).

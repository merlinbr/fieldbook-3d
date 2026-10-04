# Archived implementation handoff — first Ankylosaurus exhibit

## Assignment and approval boundary

The user subsequently approved implementation with “go and implement it”. The first exhibit has now been implemented and locally verified; `README.md` records the delivered behavior, checks, browser scenarios, and remaining production/device limits.

This handoff's sequence and planning evidence are retained below as historical context, not a new instruction to recreate the application. Anatomy annotations and guided Field Study remain pending. Model reuse/publication rights and scientific accuracy remain unverified.

Read in order:

1. `fieldbook-3d-context.md` — source of truth for the complete app/prototype.
2. `docs/superpowers/specs/2026-10-03-first-exhibit-design.md` — this milestone's scope and acceptance criteria.
3. `docs/superpowers/plans/2026-10-03-first-exhibit.md` — exact proposed files, interfaces, implementation order, and verification scenarios.

The approved plan was executed. Implementation adjustments: SvelteKit 3 native `#lib` imports, native static public environment declarations and hook types; current Three.js `PCFShadowMap`; projected model/plinth reset framing instead of the overly conservative sphere fit. Current code and README take precedence over the original plan examples.

## Planning-time state and evidence (historical)

- No root SvelteKit application exists yet. Planning documents were committed as `f61164a` (`docs: plan first explorable Ankylosaurus exhibit`).
- The user supplied `example project/low-poly/`. Preserve it and its dependency configuration; do not stage or delete it incidentally.
- The example was launched with its existing dependencies on loopback port 5193 and inspected in Chromium. The Ankylosaurus rendered; the captured page-error list was empty. The browser tab and inspection server were closed afterward.
- The model is procedural Three.js geometry, not an existing GLB. `createLowPolyAnkylosaurus()` in `ankylosaurus.js` returns a `THREE.Group`.
- Browser inspection reported 2,972 triangles and these available targets: `headGroup` (Group), `armorGroup` (Group), `clubMesh` (Mesh).
- `model-geometry.js` supplies geometry helpers. `main.js` demonstrates orthographic framing, OrbitControls, warm lighting, resizing, and shadows. `environments.js` provides procedural dioramas. Do not copy the entire showcase into the app.
- Scientific accuracy and model reuse/publication rights have not been verified. Rendering success is not evidence of either.
- Root/example ignore files were absent during planning. Add ignores before exporting or generating media.
- Installed runtime observed: Node v24.17.0, npm 12.0.2. Registry versions observed: SvelteKit 3.0.0, adapter-static 4.0.0, Paraglide 2.25.4, Three.js 0.186.1. These observations are not proof that the new dependency combination has been installed or built.
- No application type check, build, camera assertion check, GLB round-trip check, or physical-device verification has been performed. The plan's commands and expected outcomes are instructions, not passing results.

## Deliverable

One explorable, resting Ankylosaurus in a museum-fieldbook exhibit:

- English/German prerendered specimen URLs, URL-driven language and visible locale links.
- SSR content with browser-only Three.js initialization.
- Actual exported GLB loaded via a configurable URL.
- Warm lighting and a simple ground plinth; whole-model reset framing at desktop/tablet/phone aspect ratios.
- Mouse/touch orbit and zoom, plus native keyboard-accessible zoom/orbit/reset buttons.
- Readable loading, asset-error, and WebGL-unavailable states.
- Correct disposal, including navigation during delayed model loading.
- Newsreader/Source Sans 3, restrained palette, accessible text/controls, responsive layout.

The existing spec and plan contain the full acceptance matrix; this list is not a substitute for it.

## Implementation sequence

1. **Asset:** Add ignores; export a fresh resting example model into ignored `media-dev/ankylosaurus.glb`; verify its GLB round trip and provenance. Preserve explicit faceted normals and named anatomy nodes.
2. **Static localized document:** Set up the minimal SvelteKit/TypeScript app, adapter-static, Paraglide and both language URLs. Preserve existing root license/context files.
3. **Viewer:** Implement the small Svelte/Three.js boundary defined in the plan, real model loading, bounds-based camera fit, controls, status UI, ground, lighting, and disposal.
4. **Verification/delivery:** Run integrated checks/build, exercise the actual static app, check media exclusion, update documentation/context to reflect delivered behavior, and remove temporary export/smoke scaffolds.

Default to inline execution. Delegate only genuinely independent slices after shared asset/setup prerequisites exist. One owner integrates page/viewer contracts; no concurrent agents run build/checks/formatters while edits are in flight.

## Important implementation traps

- `flatShading` is not a portable glTF material flag. Export explicit faceted geometry normals and compare the reloaded appearance with the example.
- Imported GLB meshes need shadow flags applied by the viewer; Three.js shadow settings are not a glTF asset contract.
- Preserve the model's metre-scale coordinate system (+Y up, head toward -X). Frame actual bounds rather than copying fixed camera coordinates.
- SvelteKit 3 uses Vite configuration. The Paraglide integration examples may show legacy SvelteKit configuration; adapt them rather than creating a second configuration convention.
- Explicitly prefix BOTH English and German URLs. Do not let default base-language URL patterns remove `/en/`.
- Three.js initialization must not run during prerendering. Keep Svelte mount cleanup synchronous around nested async imports/loading.
- A load completing after disposal must release its incoming resources without notifying detached UI or attaching a canvas.
- Local media must be served separately, not from application `static/`, and must not be copied into static build output. The plan defines the small loopback media server.
- Production builds require an explicit external model URL. Local static smoke uses `--mode development`; do not misrepresent that as production CDN deployment.
- Maintain source/media licensing separation. Record unresolved model rights honestly; do not claim MIT reuse rights for media. Fonts are external with documented licenses and fallbacks.

## Scope exclusions

Do not implement anatomy notes/selection, Field Study, narration/captions/timeline, measurements, walking, auto-rotation, environment/specimen selectors, a collection screen, backend, accounts, offline support, saved preferences, compression, or a generic engine. These remain future prototype work, not canceled requirements.

Do not create empty `FieldStudyMode`, `NarrationTimeline`, or `SpecimenTerminal` modules or a disabled Start field study control. Do not install a UI kit or test framework for this milestone.

## Verification and reporting

Follow Task 4 of the implementation plan. In particular:

- Run `npm run check`, `npm run check:camera`, and `npm run build -- --mode development` after integration.
- Serve the static output independently of the SvelteKit dev server; directly load and refresh both locale pages and the root entry.
- Observe actual rendered output at 1365x768, 1024x768 and 390x844. Exercise orbit/zoom/reset, keyboard controls, resizing and touch emulation.
- Exercise failed model loading, unavailable WebGL, delayed-load disposal, reduced motion, font blocking and storage denial.
- Keep one small permanent camera-fit assertion check; use throwaway browser checks/harnesses for export and UI verification, then remove them.
- Inspect build output and staged paths for forbidden media; `.gitignore` cannot protect already tracked files. Preserve unrelated user changes.
- Report only observed passing checks and actual browser scenarios. Distinguish touch emulation from physical-device testing and local media smoke from production hosting.

Before yielding, update affected docs/callsites, stop inspection services, remove temporary files and give a brief implementation/verification report. Do not claim the complete Field Study prototype is finished when only this exhibit milestone is delivered.

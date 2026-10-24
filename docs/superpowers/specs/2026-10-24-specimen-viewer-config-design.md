# Specimen-configurable viewer

Status: design and plan approved by the user on 2026-10-24; implemented on `codex/issue-15-viewer-config`. Verification evidence is recorded in the implementation plan.

Source: [issue #15](https://github.com/merlinbr/fieldbook-3d/issues/15). Inspected against main `e3debb4` on 2026-10-24. #14 is merged; #16 owns the localized Stegosaurus exhibit and its represented length.

## Intent and scope

Let the existing viewer explore different specimens with anatomically honest regions, an explicitly supplied scale, and an explicit choice between guided study and exploration only. Preserve the existing Ankylosaurus exhibit, published study JSON, and English/German paused language handoff. Keep one viewer and migrate all affected callers without compatibility aliases.

The issue supplies the requirements. The approved design adds a minimal localized scale-comparison toggle in exploration, because the former comparison was accessible only through a guided study. It permits checking scale for a specimen with no recording without adding study controls or a new presentation layout.

No new exhibit route, production Stegosaurus content, represented Stegosaurus length, recording, dependency, model redesign, or production upload belongs here. Temporary browser fixtures are removed before delivery.

## Approach and alternatives

Use a small data configuration and one mesh resolver shared by inspection, bounds, and study emphasis. Exact mesh names, named subtrees, and name prefixes cover the delivered assets without callbacks or a general plugin system.

A second viewer would duplicate gesture, camera, resize, and disposal behavior. Inferring species from model names would retain hidden assumptions and could silently apply Ankylosaurus behavior to another model. Both alternatives are rejected.

## Shared contracts and ownership

Create `src/lib/specimens/specimen-config.ts` for shared readonly data types and pure validation. It must not import a species data module, browser API, or Three.js runtime. Use these contracts:

- `AnatomyId = string`; each specimen declares stable IDs, and validation enforces unique nonempty IDs. Arbitrary incoming selection IDs are accepted only when present and available in the resolved configuration.
- `AnatomyNote = { label: string; heading: string; body: string }` and `AnatomyText = Readonly<Record<AnatomyId, AnatomyNote>>` move here from `ankylosaurus.ts`.
- `MeshSelector` is a discriminated union: `{ kind: 'mesh'; name: string }`, `{ kind: 'subtree'; name: string }`, or `{ kind: 'prefix'; prefix: string }`. A mesh selector matches only meshes; subtree matches descendant meshes; prefix scans all specimen meshes. Results are deduplicated.
- `AnatomyRegionConfig` contains `id`, separate `pick`, `highlight`, and `bounds` selector arrays, and `anchor: { node: string; point: readonly [number, number, number] }`. Subtree selectors may have `excludePrefixes` so a head subtree can omit dorsal plates. An optional `upperSurface: { mesh: string; minHeightRatio: number }` supplements picking only.
- `SpecimenScale = { lengthMetres: number }`; `scale` is `SpecimenScale | null`, with no default. A configured length must be finite and positive. The human reference remains 1.7 m.
- `StudyCapability` is `{ kind: 'none' }` or `{ kind: 'guided'; targets: { armor: StudyTarget; tailClub: StudyTarget } }`, where `StudyTarget = { regionId: AnatomyId; emphasis: readonly MeshSelector[] }`. These two target keys are existing guided-study vocabulary, not generic anatomy IDs. They are never attached to exploration-only specimens.
- `SpecimenViewerConfig = { id: string; modelUrl: string; regions: readonly AnatomyRegionConfig[]; scale: SpecimenScale | null; study: StudyCapability }`.
- `SpecimenViewerText = { viewerLabel: string; anatomy: AnatomyText }` supplies current-locale display content. Configured regions must have nonempty localized notes. Extra notes are rejected to catch misspelled IDs.
- `StudyRecording = { version: StudyVersion | null; error: 'missing' | 'data' | null }`. `ViewerStudy` is `{ kind: 'none' }` or `{ kind: 'guided'; recording: StudyRecording; versions: readonly StudyVersion[] }`. This locale-specific input must agree with the configuration capability.

Ankylosaurus data owns its regions, existing anchors, 8 m length, localized viewer label, and guided capability. The route passes `config`, `text`, and `study` to `SpecimenViewer.svelte`. A configured guided specimen with missing or invalid recording still displays its existing real diagnostic. It must not be converted into exploration-only mode because a recording is absent.

Create `src/lib/viewer/anatomy-regions.ts` to resolve the model/configuration once. Export `resolveAnatomyRegions(model, configs)` and `regionBounds(region)`. A resolved region retains its mesh sets, anchor node/point, and optional local-height pick surface. Availability requires at least one mesh in each of its pick/highlight/bounds sets and an existing anchor node. Missing geometry yields an unavailable region rather than fabricated nodes or a body substitute. Invalid configuration produces an explicit configuration error, not a successful empty inspection. Geometry-count expectations specific to an asset are verified in checks, rather than built into the generic configuration.

## Anatomy and interaction

Inspection consumes resolved regions rather than global IDs or target names. Callout anchors are transformed from their specified node's local coordinates. Bounds union only configured bounds meshes. Track relevant world transforms for every mesh/anchor, including membership spanning multiple subtrees; changes must invalidate projection even when only a child changes.

Surface picking raycasts all specimen meshes, then classifies only the nearest intersection. A nonselectable nearer surface blocks a region behind it. Visible marker hitboxes retain the existing occlusion check and 44px target. Missing/occluded markers never become invisible pick-through targets.

Ankylosaurus keeps `armor`, `head`, and `tailClub`. Armor pick/highlight/bounds use `armorGroup`; only its configured upper-surface rule additionally picks `bodyMesh` at or above the local Y midline. It is enabled only when the actual armor meshes exist. Inspection still highlights only armor meshes. Guided armor emphasis additionally includes `bodyMesh`, preserving current study behavior.

A temporary Stegosaurus configuration demonstrates `head`, `plates`, and `spikes`: all `dorsalPlate_*` meshes across the entire model belong to plates, only `thagomizer_*` meshes belong to spikes, and head membership excludes dorsal plates beneath `headGroup`. Neither `skinScale_*` meshes nor the torso activate plates. This fixture supplies explicit surface anchors; verify them visually rather than using bounding-box centers.

Preserve current selection semantics, 6 CSS pixel gesture threshold, multi-pointer cancellation, empty-space dismissal, Escape/close behavior, focus restoration, named keyboard controls, reduced motion, note docking, resize behavior, and resource cleanup. Reset continues to preserve an anatomy selection while restoring the exploration camera.

## Explicit study capability

For `kind: 'none'`, never construct `createFieldStudy`, request narration, parse/restore a study handoff, or construct guided-only emphasis/presentation/dust. Omit study entry, transport, captions, readiness warnings, and chapter UI entirely. An incoming `study` query is removed while preserving other query parameters, without a missing-recording or invalid-handoff message. Outgoing locale links remove study context.

For guided Ankylosaurus, retain existing study validation and JSON cue vocabulary: `hero`, `scale`, `armor`, `tailClub`, and `world`, including chapter IDs and recording version semantics. Resolve `armor` and `tailClub` to configured study targets for readiness, camera bounds, and emphasis. Shared exploration anatomy is no longer a closed species union; the published study schema remains closed and unchanged.

The existing handoff protocol stays Ankylosaurus-specific. Gate it on guided capability and specimen identity; no new species is silently admitted into that protocol. Missing study meshes, unavailable calibration, malformed recording data, audio failures, captions, reduced motion, and paused English/German handoff retain their current behavior.

## Scale comparison and camera ownership

`createScaleComparison` takes the configured positive length explicitly. The model transform, guide endpoints, calibrated bounds, human clearance, camera fit, and localized numeric label consume that same value. Parameterize the current hardcoded English/German measurement and calibration messages; keep localized 1.7/1,7 m human wording.

With `scale: null`, ordinary exploration remains usable, scale comparison is absent, and no metre label is shown. An invalid configured length is an explicit configuration/calibration failure and never falls back to 8 m.

Add a native `aria-pressed` scale toggle beside exploration controls when a valid scale is available. It uses the existing comparison and legend. Extract scale calibration entry/restoration from the guided-study path so standalone comparison does not require armor/tail-club study targets. Entry saves the camera, wrapper transform, lights/shadows, and zoom limits; exit restores them. Fit the combined calibrated specimen, guide, plinth, and human on entry and resize. Anatomy anchors and picking continue to follow the calibrated model.

Guided playback owns scale visibility while active. Starting a study from standalone comparison first restores the ordinary exploration state; study exit restores that exploration state with standalone comparison off. Reset leaves standalone comparison, restores the normal reset camera, and preserves selected anatomy. The scale button cannot interfere during active study playback, including a paused study. Cleanup restores/disposes owned resources exactly once.

## Verification and delivery

Extend behavior checks with real Three.js geometry and the canonical Stegosaurus generator; retain existing Ankylosaurus cases. Prove 19 plate members across three parent groups, four spike members, head exclusion, no flank/torso activation, nearest-surface occlusion, distinct pick/highlight/bounds, transform invalidation, and shared-material restoration.

Exercise scale with 8 m and a distinct synthetic 10 m input, as well as null/zero/negative/NaN/Infinity. The synthetic value is a test input, not a scientific Stegosaurus claim. Check guide/model/bounds ratios, 1.7 m human reference, exploration camera restoration, resize, reset, and disposal.

Use a temporary development-only route to mount the actual `SpecimenViewer.svelte` with exploration-only Stegosaurus configuration. Prefer the local GLB delivered by #14; the approved generator is a fallback only for preliminary smoke. Never bundle the generator into production or persist invented scientific text/scale. Browser network inspection must prove no study/audio request, including with an incoming valid Ankylosaurus query. Exercise pointer, keyboard, touch-style drag/pinch, narrow layout, resize, reset, and teardown.

Run `npm run check`, `npm run check:camera`, `npm run check:anatomy`, and `npm run check:study`; build a development-mode static preview. Browser-smoke the real Ankylosaurus exhibit in English/German, study chapters/captions, reduced motion, paused language handoff, and both scale paths. Remove the temporary route and scaffolding, repeat affected checks/build, and inspect output for fixture/generator leakage. Run `rtk graphify update .` after product code changes.

Record actual commands and browser observations; report unavailable audio/media/browser prerequisites explicitly. #16 completes final localized Stegosaurus exhibit acceptance with its chosen evidence-based scale. No tests or browser verification are claimed by this planning document.

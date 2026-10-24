# Specimen-configurable Viewer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Configure the existing viewer for honest specimen anatomy, explicit scale, and exploration-only operation while preserving Ankylosaurus guided study.

**Architecture:** Shared data contracts feed one model-region resolver, one inspection controller, and one renderer/Svelte viewer. Guided study remains an explicit capability with its existing published cue contract; standalone scale reuses the renderer's calibration lifecycle.

**Tech Stack:** Existing Svelte 5, TypeScript, Three.js 0.186.1, Node 24+, native Node assertion checks, Paraglide, and Vite. No new dependencies.

**Spec:** [2026-10-24-specimen-viewer-config-design.md](../specs/2026-10-24-specimen-viewer-config-design.md), proposed for review alongside this plan.

## Global Constraints

- Keep one viewer and migrate all affected callers without compatibility aliases.
- Ankylosaurus keeps `armor`, `head`, and `tailClub`; its published study JSON and handoff protocol stay valid.
- Ankylosaurus length remains 8 m; the human reference remains 1.7 m. No implicit scale default.
- No new exhibit route, production Stegosaurus content, represented Stegosaurus length, recording, dependency, model redesign, or production upload belongs here.
- Preserve current selection semantics, 6 CSS pixel gesture threshold, multi-pointer cancellation, focus restoration, reduced motion, note docking, resize behavior, and resource cleanup.
- Temporary browser fixtures are removed before delivery.

## Review Focus

- A child mesh changes transform while its anchor parent is unchanged: membership and bounds/projections must stay correct (Task 1/2).
- A valid Ankylosaurus study query reaches an exploration-only viewer: zero narration fetches, no startup, and no misleading warning (Task 3/5).
- A missing/invalid guided recording still reports the original diagnostic rather than becoming exploration-only (Task 3/5).
- A configured comparison is entered before guided study or reset: transforms, camera ownership, selection, and cleanup remain coherent (Task 4/5).
- A head subtree contains plates and shared materials: only configured meshes highlight and every original material is restored (Task 1/2).

---

### Task 1: Define configuration and resolve anatomy membership

**Files:** Create `src/lib/specimens/specimen-config.ts`, `src/lib/viewer/anatomy-regions.ts`, `checks/anatomy-regions.mjs`; update `package.json` so `check:anatomy` includes the new check. Read the spec's exact shared contracts before implementing.

**Interfaces:** Export the spec's `AnatomyId`, `AnatomyNote`, `AnatomyText`, `MeshSelector`, `AnatomyRegionConfig`, `SpecimenScale`, `StudyTarget`, `StudyCapability`, `SpecimenViewerConfig`, `SpecimenViewerText`, `StudyRecording`, and `ViewerStudy`. Export `validateSpecimenConfig(config: SpecimenViewerConfig): void`, `validateViewerInputs(config: SpecimenViewerConfig, text: SpecimenViewerText, study: ViewerStudy): void`. Export `resolveAnatomyRegions(model: Object3D, configs: readonly AnatomyRegionConfig[]): readonly ResolvedAnatomyRegion[]` and `regionBounds(region: ResolvedAnatomyRegion): Box3`; resolved regions expose `id`, `pickMeshes`, `highlightMeshes`, `boundsMeshes`, `anchorNode`, `anchorPoint`, optional resolved `upperSurface`, and `available`.

- [x] Add failing assertions using the canonical `createLowPolyStegosaurus()`: plate membership is exactly 19, spans `armorGroup`/`headGroup`/`tailGroup`, and contains no `skinScale_*`; spike membership is exactly four; head subtree excludes plates. Selectors deduplicate meshes, subtree exclusions apply, and missing configured geometry is unavailable.
- [x] Add failure cases for duplicate/empty region IDs, empty selectors/prefixes, invalid anchor tuples/height ratios, invalid positive-length inputs, missing/extraneous localized text, unknown study target IDs, and mismatched capability/input modes. Assert null scale is accepted.
- [x] Run `rtk proxy node checks/anatomy-regions.mjs`; confirm failures name missing functionality or unmet assertions before implementing.
- [x] Implement pure configuration validation and the single mesh resolver. Use actual `Mesh` instances, whole-model prefix lookup, independent sets, and finite world-space bounds. Validate nonempty selector arrays and reject ambiguous pick ownership across regions; overlapping bounds membership is allowed. Update world matrices before computing bounds.
- [x] Assert moving a member beneath a different subtree changes its computed bounds; missing anchors disable only their region. Run the new check; expect all assertions to pass. Commit this independently testable contract/resolver change.

### Task 2: Migrate inspection and Ankylosaurus anatomy

**Files:** Modify `src/lib/viewer/anatomy-input.ts`, `src/lib/viewer/anatomy-inspection.ts`, `src/lib/specimens/ankylosaurus.ts`, `src/lib/viewer/SpecimenViewer.svelte`, `src/routes/specimens/ankylosaurus/+page.svelte`, `checks/anatomy-input.mjs`, `checks/anatomy-inspection.mjs`; migrate renderer/study helper/check call sites as described below. Add `checks/specimen-config-fixtures.mjs` for reusable check-only configuration data.

**Interfaces:** `createAnatomyInput(ids: readonly AnatomyId[])` validates selection against configured IDs while retaining gesture API. `createAnatomyInspection(model: Object3D, regions: readonly ResolvedAnatomyRegion[], camera: OrthographicCamera, canvas: HTMLCanvasElement, onChange: (snapshot: InspectionSnapshot) => void): AnatomyInspection` keeps current handle methods. Remove `ANATOMY_IDS`, `TARGETS`, and species-dependent mesh helper exports after migrating callers. Export `ankylosaurus.config` and per-locale `SpecimenViewerText`; preserve existing specimen metadata.

- [x] Extend input assertions with `head`/`plates`/`spikes` selection and unknown-ID rejection, retaining every drag/multi-pointer/cancel case. Extend inspection checks for nearest-body occlusion, no torso/flank plate activation, configured upper-torso picking only, separate highlighted/bounds sets, missing targets, and material restoration after switch/clear/dispose.
- [x] Run the affected checks and confirm the new cases fail before implementation.
- [x] Replace global anatomy targets with resolved data. Anchor visibility still raycasts all model meshes. Track member/anchor world transforms so child movement invalidates hover and projection; retain unchanged-snapshot suppression. Test transformed models and changed children separately.
- [x] Put current Ankylosaurus anchors and selectors into its config, with armor upper-surface `bodyMesh` ratio `0.5`, length `8`, and explicit guided study targets. Move shared text types; remove old type exports rather than aliasing them. Put Stegosaurus test config in check-only fixtures with `head`, `plates`, `spikes`, explicit anchors, `study: { kind: 'none' }`, and normally null scale.
- [x] Update all inspection callers in renderer/checks to resolve config once. Migrate study-emphasis and bounds consumers to the resolver interfaces to keep commits runnable. Migrate Svelte/route to Task 3's final `config`, `text`, and `study` props now, derive anatomy button IDs from `config.regions`, and rename the local controller variable to `fieldStudy` to avoid shadowing the study prop. The route supplies guided Ankylosaurus input; no-study branching is completed in Task 3. Run `rtk npm run check`, `rtk npm run check:anatomy`, and existing study checks; expect passing assertions. Commit the migration only after these callers compile together.

### Task 3: Make guided study explicit throughout viewer and UI

**Files:** Modify `src/lib/viewer/specimen-viewer.ts`, `src/lib/viewer/SpecimenViewer.svelte`, `src/lib/viewer/study-emphasis.ts`, `src/lib/specimens/ankylosaurus.ts`, `src/routes/specimens/ankylosaurus/+page.svelte`, `checks/field-study.mjs`; create `src/lib/viewer/viewer-study.ts` and `checks/viewer-study.mjs` for the pure capability/query boundary. Add the new check to `check:study`. The existing `study-handoff.ts` parser/encoding contract stays unchanged.

**Interfaces:** `SpecimenViewer.svelte` takes `{ config: SpecimenViewerConfig; text: SpecimenViewerText; study: ViewerStudy }`. `createSpecimenViewer(container: HTMLElement, config: SpecimenViewerConfig, onState, onInspection, onScale): ViewerHandle` retains callback types and existing handle methods. `createStudyEmphasis(model: Object3D, targets: Readonly<Record<'armor' | 'tailClub', readonly Mesh[]>>): StudyEmphasis` consumes resolved emphasis memberships. `resolveStudyContext(config: SpecimenViewerConfig, study: ViewerStudy, contexts: readonly string[]): { incoming: StudyHandoff | null; handoffFailed: boolean }` returns null/false for no-study and for absent query context. Only guided Ankylosaurus invokes the existing parser; duplicate or invalid supplied contexts yield null/true. DOM code removes query parameters independently.

- [x] Add failing checks: no-study capability ignores even a valid known Ankylosaurus handoff; absent context does not fail; duplicate/malformed guided context does fail; configured target membership drives bounds/emphasis. Keep real English/German narration JSON validation, cue evaluation, and existing handoff assertions unchanged in meaning. Task 5 verifies missing/malformed guided recording readiness in the rendered UI.
- [x] Confirm new checks fail. Complete capability branching for readiness, mount/retry, cleanup, and language-link behavior using the props migrated in Task 2. Instantiate the field-study controller only for guided capability with a valid recording. Gate all study UI and handoff work on capability, not recording presence. No-study query removal preserves unrelated query parameters and emits no failure message.
- [x] Resolve guided camera targets from config rather than literal exploration IDs. Keep the published study views and timeline logic unchanged. Gate guided-only emphasis/presentation/dust construction; ordinary exploration must not depend on study target availability. Preserve real failure reporting for guided specimens.
- [x] Migrate the Ankylosaurus route and every check caller to the new props/signatures; remove all species-module type imports from shared viewer files. Run `rtk npm run check`, `rtk npm run check:anatomy`, and `rtk npm run check:study`; expect zero type/Svelte errors and passing behavioral assertions. Commit the explicit-capability change.

### Task 4: Share scale values and support standalone comparison

**Files:** Modify `src/lib/viewer/scale-comparison.ts`, `src/lib/viewer/specimen-viewer.ts`, `src/lib/viewer/SpecimenViewer.svelte`, `messages/en.json`, `messages/de.json`, `checks/field-study.mjs`, `checks/camera-fit.mjs`; create `checks/scale-comparison.mjs` and include it in `check:camera`. Keep calibration lifecycle ownership in the existing renderer, extracting named internal functions for entry/restoration.

**Interfaces:** `createScaleComparison(sourceBounds: Box3, specimenMeshes: readonly Mesh[], scale: SpecimenScale, onProjection: (snapshot: ScaleProjection) => void): ScaleComparison`. Extend `ViewerHandle` with `setScaleVisible(visible: boolean): boolean` and read-only `scaleVisible: boolean`. Return false for unavailable scale or active guided study. Parameterize `studyScaleSpecimen({ length })` and `studyCalibration({ length })`; format configured metres with the current locale. Add localized scale-toggle text using the existing UI message system.

- [x] Add failing geometry assertions for lengths `8` and synthetic `10`: `factor = length / sourceSize.x`, guide extent equals length, calibrated specimen bounds agree, and the human remains 1.7 m. Reject `0`, negative, `NaN`, and `Infinity`; never supply a default. Assert invalid/empty bounds remain errors.
- [x] Run `rtk proxy node checks/scale-comparison.mjs`; confirm the new explicit-scale cases fail before implementation. Add geometry/resource assertions for independent instances, repeated visibility changes, disposal, and material/geometry ownership. Full renderer lifecycle is verified through the actual browser in Task 5 rather than simulated by a second renderer implementation.
- [x] Pass explicit scale through geometry, fit, and message paths. Extract reusable calibration entry/restoration from `beginStudy`/`restoreStudy`, keeping guided target fitting conditional on guided entry. Standalone comparison must work with no armor/tail-club targets. Null scale hides the toggle/measurements and leaves unscaled exploration usable.
- [x] Add the localized native toggle and reuse comparison overlays/legend outside study. Fit the whole comparison on entry/resize. Keep current appearance and study ownership; hide or disable the toggle during all active study phases. Verify anatomy follows the calibrated transforms.
- [x] Run `rtk npm run check`, `rtk npm run check:camera`, `rtk npm run check:anatomy`, and `rtk npm run check:study`; expect all to pass. Commit the scale change.

### Task 5: Browser verification, cleanup, and delivery evidence

**Files:** Temporary development-only viewer route and fixture, removed before commit; update `README.md` with shared viewer usage/development verification and this plan with actual results. Update Graphify outputs locally after product changes; do not stage the unrelated untracked directory.

**Interfaces:** Mount the actual shared Svelte viewer with check-only Stegosaurus configuration and the local exported GLB. A synthetic 10 m value is only a scale-path test; use null scale for the no-interpretation smoke. Do not add a production Stegosaurus route or import its generator into application source.

- [x] Inspect available local media and environment variable names without printing secrets. If needed, reproduce the ignored Stegosaurus GLB with `rtk npm run export:stegosaurus`. Start the existing local media responder and Vite server, preserving already-running services. Record actual URLs/ports.
- [x] Browser-smoke Stegosaurus with the real shared viewer: three regions, plate/spike highlight membership, head exclusion, torso/flank nonselection, occlusion, orbit/zoom, click versus drag, keyboard selection/Escape/close, touch-style multi-pointer cancellation, reset, resize, narrow layout, and cleanup/remount. Test null scale and synthetic configured scale. Inspect network requests to prove no narration/study fetches, including a valid incoming Ankylosaurus query; verify query cleanup and absent study warnings/controls.
- [x] Browser-smoke Ankylosaurus in English/German: inspection including armor gaps, standalone scale, all study chapters and captions, pause/resume/seek/exit, reset, reduced motion, resize, and paused language handoff. Test real missing/invalid recording configurations separately from no-study mode. Record any unavailable media/physical-device limitation instead of claiming coverage.
- [x] Remove all temporary route/fixture scaffolding. Run the four required check commands again, then `rtk npm run build -- --mode development`; expect successful static output. Serve the static preview and verify the existing localized Ankylosaurus URLs after direct load/refresh. Inspect build output for temporary routes, binary media, and procedural generator leakage.
- [ ] Run `rtk graphify update .`, review the final diff/status, and record actual verification evidence plus the remaining #16 integration boundary. Commit only issue #15 changes. Perform the required final code review before declaring implementation complete; do not publish comments or open a PR without the user's requested handoff scope.

## Execution recommendation

The user approved the design/plan and inline implementation on 2026-10-24. The implementation follows the five tasks above; the final branch receives one independent review.

## Observed verification, 2026-10-24

- `npm run check`: zero errors and warnings after removing the temporary route. `check:camera`, `check:anatomy`, and `check:study` passed, including new membership/validation, explicit-scale, and capability/handoff checks. The 10 m factor test failed against the former 8 m default before implementation; unknown region selection also failed before migration.
- `npm run build -- --mode development`: static build succeeded. Output inspection found no temporary route, procedural generator, GLTFExporter, or binary media. Existing advisories concern the large Three.js chunk and conflicting color-output environment flags.
- Actual shared Svelte viewer, in-app Chromium: local #14 Stegosaurus GLB loaded from `127.0.0.1:5196`; the temporary route ran on Vite port 5176. Plate and spike highlights, visible anchors, body nonselection, orbit drag, keyboard selection/Escape and focus restoration, comparison/reset with selection retained, 390×844 note docking/scale fit, and unmount/remount were exercised. The canvas count became zero on unmount.
- A temporary DOM-visible PerformanceObserver captured only `stegosaurus.glb` in the exploration-only path, including with a valid known Ankylosaurus study query. The query was removed while an unrelated `keep=yes` parameter remained; there were no study controls or missing-recording warnings. Null scale showed no scale control; synthetic 10 m scale showed the matching guide/human/label. It is not a represented Stegosaurus length.
- Real English/German Ankylosaurus recordings played. Start from standalone scale, scale/armor/world chapter navigation, captions, pause/resume, study exit, and paused English→German scale handoff passed. Static preview on port 4176 loaded/refreshed both localized routes and also restored a paused German→English study.
- Missing and invalid guided recording configurations separately displayed the original disabled-Start diagnostics. Reduced-motion playback/armor seek/pause was exercised using a temporary `matchMedia` preference override before viewer mounting. Synthetic touch-pointer drag, multi-pointer, and cancellation events were delivered to the actual inspection adapter; selection stayed intact. These are desktop browser checks, not physical touchscreen or OS preference tests.
- Browser smoke exposed nonreactive button binding and SvelteKit history warnings. Region button bindings now use Svelte state; query consumption uses the installed SvelteKit 3 shallow `goto` API. Final static handoff passed with that API.
- Temporary routes, request capture, media-preference overrides, and gesture scaffolding were removed. Check fixtures remain solely under `checks/`. Ignored screenshots are in `media-dev/issue15-verification/` (`stegosaurus-scale.png`, `stegosaurus-mobile.png`, `ankylosaurus-static-scale.png`).

Implementation rulings: extract the geometry-only Ankylosaurus configuration factory into `ankylosaurus-config.ts` so checks use production configuration without environment imports; retain the existing approved feature branch/current checkout; adapt Bash-only bookkeeping to native tools after sandbox denial. No production Stegosaurus route, length interpretation, narration, publication, or hosting change is included; #16 remains the integration boundary.

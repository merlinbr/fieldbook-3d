# Narrated Scale Comparison Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver issue #2 as real Meet → Scale playback, with an approximately 8 m Ankylosaurus, a 1.7 m human reference, and a calibrated length guide, then restore Explore before Armor begins.

**Architecture:** Extend the existing native-audio controller and Three.js viewer; one authoritative study state, scene, renderer, and animation loop. Add one specimen-specific comparison module for calibration, generated geometry, and projected anchor visibility. The viewer owns temporary exhibit transforms/camera restoration; Svelte owns localized readable labels, not meshes or a second presentation clock.

**Tech Stack:** Existing Node >=24, Svelte 5/SvelteKit static output, Three.js 0.186.1, Paraglide, native browser audio, and framework-free Node checks; no new dependencies.

**Spec:** [Issue #2](https://github.com/merlinbr/fieldbook-3d/issues/2), [guided Field Study design](../specs/2026-10-04-guided-field-study-design.md), especially Scale representation, playback ownership, and verification. The issue's approved ticket breakdown and later recording approval/delivery supersede the design document's historical awaiting-approval notices. This document is a plan for review, not implementation approval or evidence of delivered Scale playback.

## Global Constraints

- Illustrative adult length: **approximately 8 m**. Labels: **Estimated adult length** / **Geschätzte Länge eines erwachsenen Tiers**. Not every individual's length, a complete-skeleton measurement, or validation of model proportions.
- Reference height: **1.7 m**, labeled **Human reference: 1.7 m** / **Mensch als Vergleich: 1,7 m**. This is a chosen reference, not average human height. Generate silhouette and guide in code; no downloaded asset.
- Stable chapter IDs: `meet`, `scale`, `armor`, `world`; anatomy IDs: `armor`, `head`, `tailClub`. Retain the stylized-reconstruction notice and existing scientific qualifications.
- English is the playable baseline. German UI visibly identifies English narration and uses matching English captions/timings. No German recording or language handoff in #2.
- Actual narration position is authoritative. Full authored/loaded duration must agree within **0.25 seconds**; never stretch cues. Load only the resolved recording, on demand.
- Captions start enabled; retain choice through pause/resume/retry. Resume is approximately **350 ms**, holding audio still; reduced motion makes transitions immediate and uses composed chapter views without dropping content.
- Pause preserves comparison graphics but restores normal exploration lighting and existing inspection. Playing/restoring/seeking cannot concurrently own the camera or highlight with inspection.
- Readable text at least **16 CSS pixels**, controls at least **44 by 44 CSS pixels**, visible focus. Observe **1365×768**, **1024×768**, **390×844**, both languages, and **200% text enlargement**.
- Stop audio/cancel stale work on Exit, navigation, disposal, and viewer failure. Keep binaries/private evidence outside Git and application output. No backend, runtime voice generation, persistent preferences/progress, generic presentation engine, or new dependencies.
- Full seek UI/chapter navigation and Armor/World presentations remain #3–#5. Cinema-mode redesign/particles remain #7. Do not add them here.

## Existing Evidence and Cutover

- #1 is closed as completed. `field-study.ts` currently clamps to `version.chapters[1].start` and exits there; `StudyView.compose()` always targets the hero view. Scale cannot work by adding geometry alone.
- The approved full recording and version metadata already exist. Canonical Scale interval is **[13.635918367346939, 23.666938775510204)** seconds; derive boundaries from the resolved version, never hard-code these values in playback code. Scale cue and English captions are present in `docs/assets/ankylosaurus-narration.en.json`.
- Start continues from Meet into Scale and completes at `armor.start`. Start again begins at Meet. No new chapter picker, developer-only mode, or synthetic audio. Keep full recording duration validation, independent of this delivered playback endpoint.
- The supplied model is +Y up, head toward -X. Documented X extent is approximately 9.05 source units. Measure the loaded geometry, not these historical bounds; use its X head-to-tail extent and uniformly scale to 8 m for the entire active study.
- Keep canonical recording JSON/identity unchanged: this is a presentation change, not changed audio or recording metadata.

## File Responsibilities

| File | Responsibility |
|---|---|
| `src/lib/viewer/field-study.ts` | Audio lifecycle, Meet/Scale timeline evaluation, chapter snapshot, delivered endpoint, current presentation handoff |
| New `src/lib/viewer/scale-comparison.ts` | Specimen-specific calibration, silhouette/guide geometry, comparison bounds, projected/occluded anchors, owned-resource disposal |
| `src/lib/viewer/specimen-viewer.ts` | Calibrated exhibit wrapper, guided camera/lighting, reset/resize, per-frame comparison update, saved Explore restoration |
| `src/lib/viewer/SpecimenViewer.svelte` | Projected label leaders, readable label legend, current chapter/status, unchanged playback/inspection controls |
| `messages/en.json`, `messages/de.json` | Interface chapter names, scale labels, calibration-unavailable status, accurate two-chapter readiness copy |
| `src/app.css` | Label/leader/legend layout, responsive and enlarged-text behavior |
| `checks/field-study.mjs` | Extend the one study regression check with timeline/state boundaries and real Three.js comparison invariants |
| `README.md` | Observed Scale delivery, exact playback scope and verification limits, only after real smoke proof |

No edits to supplied `example project/`, anatomy picking semantics, narration files, media host, or build configuration are planned. Existing inspection already tracks world transforms; prove that it still works under the uniform wrapper.

## Review Focus

1. A wrong model-axis/scale or ground origin can make the numbers look plausible while the comparison is false: assert actual transformed extents, guide endpoints, reference height, and common ground.
2. Pause near a boundary, pending seek, or delayed play completion must not resume audio or overwrite manually altered paused framing: extend controller cancellation/boundary scenarios.
3. Exit after calibration, zoom/orbit/reset, and resize must restore the original Explore transforms and normalized framing, not the calibrated reset view: observe the real viewer before/after and compare camera/render state.
4. Paused orbit can place an anchor behind the animal or offscreen: exercise real Three.js projection/nearest-hit occlusion and visually confirm no misleading leader; readable labels remain in normal flow.
5. Repeated Start/Exit, media failure, and context loss must not leak or double-dispose model/comparison resources: count real resource disposal in a temporary viewer probe and exercise actual failure/navigation paths.

---

### Task 1: Meet → Scale timeline and controller contract

**Files:** Modify `src/lib/viewer/field-study.ts`, `src/lib/viewer/specimen-viewer.ts`, `checks/field-study.mjs`. Update all `StudyView` consumers atomically; no legacy overload/shim.

**Interfaces:**

```ts
export type StudyFrame = { chapter: 'meet' | 'scale'; scaleProgress: number };
export function evaluateStudyFrame(version: StudyVersion, time: number, out: StudyFrame): void;
// Updated StudyView:
// begin(): boolean;
// compose(frame: Readonly<StudyFrame>): Promise<boolean>;
// present(frame: Readonly<StudyFrame>): void;
// pause(frame: Readonly<StudyFrame>): void;
// exit(): void;
// setFrame(callback: (() => void) | null): void;
// Add chapter: 'meet' | 'scale' | null to StudySnapshot.
```

- [x] Add failing consumer-visible cases to the existing study check: with its current 0/10/20/30 boundary recording, playback remains active at 10, switches to Scale exactly at 10, and restores Explore at 20. Check before/at the boundary, backward native seeking, caption boundaries, pause/resume within Scale, and delayed composition/play completions after Pause/Exit. Remove the old assertion that completing Meet exits; do not retain an implementation-default test or assert method-call forwarding as proof of presentation.
- [ ] Run `npm run check:study`; record the new behavioral failure before implementation.
- [x] Implement `evaluateStudyFrame` by finding the resolved Scale cue inside its chapter. Meet has progress 0; Scale uses `clamp((time - scaleCue.start) / min(0.75, scaleCue.end - scaleCue.start), 0, 1)` with smoothstep applied by the viewer. Chapter intervals are start-inclusive/end-exclusive. Exit at `armor.start` before evaluating unsupported chapters. Evaluation mutates the caller's reusable object, with no frame allocation.
- [x] Replace every Meet-only endpoint branch with the delivered endpoint derived from the Armor chapter. Retain full native recording duration in validation/snapshot; the playback endpoint is not a shortened recording. Publish chapter changes even when the caption or tenth-second bucket is unchanged.
- [x] Deliver current frames to `present` only during confirmed advancing playback. `present` is synchronous and does not take input ownership or start wall-clock animation. Start/Resume/Retry/failure composition receives a copied target frame captured from the frozen native position. The viewer copies its scalar fields immediately rather than retaining a mutable shared object.
- [x] Fix native seeking orchestration: cancel/freeze at seeking entry, then read the resolved native position and compose that timestamp after seek settlement; generation tokens make newest command win. Paused seeks compose once, return to normal lighting/inspection, and subsequent frames leave manual framing alone. No public Seek API or UI is added here. Retry retains Scale position/version and stays paused until explicit Play.
- [x] `pause(frame)` updates comparison visibility for the finalized paused timestamp without moving the camera, then cancels pending composition and enables inspection. A pause at/after the delivered endpoint completes instead. On error, lock inspection and compose the retained chapter, not always Meet. Preserve existing cached-page, visibility, buffering, data-error, and explicit-retry behavior.
- [x] Migrate viewer signatures and the existing check harness in the same change. Implement actual Scale camera/comparison behavior in Task 2 before treating this as a shippable deliverable. Re-run the specific study check after the coordinated changes; do not perform full-suite/build passes between tasks.

### Task 2: Calibrated comparison and viewer ownership

**Files:** Create `src/lib/viewer/scale-comparison.ts`; modify `src/lib/viewer/specimen-viewer.ts`, `checks/field-study.mjs`.

**Interfaces:** Use Three.js `Box3`, `Group`, `Object3D`, `OrthographicCamera`, `Vector3`, `Mesh` types; exported comparison API:

```ts
export type ScaleAnchor = { visible: boolean; x: number; y: number };
export type ScaleProjection = { visible: boolean; length: ScaleAnchor; human: ScaleAnchor };
export type ScaleComparison = {
  factor: number; origin: Vector3; root: Group; bounds: Box3;
  setVisible(visible: boolean): void;
  update(camera: OrthographicCamera, width: number, height: number): void;
  dispose(): void;
};
export function createScaleComparison(
  sourceBounds: Box3,
  specimenMeshes: readonly Mesh[],
  onProjection: (snapshot: ScaleProjection) => void
): ScaleComparison;
// createSpecimenViewer gains final parameter:
// onScale: (snapshot: ScaleProjection) => void
```

- [x] Extend the existing study check with real Three.js geometry assertions, not source-text checks: transformed head-to-tail span and guide endpoints equal 8 m within `1e-6`; silhouette bounds are 1.7 m high; feet and specimen ground coincide. Check a nonzero ground/center input, finite/positive X span, projected anchors outside the frustum and behind a nearer blocking mesh, and idempotent owned-resource disposal. Run `npm run check:study` to observe these new cases fail before implementing the module.
- [x] Compute `factor = 8 / (sourceBounds.max.x - sourceBounds.min.x)` and `origin = (centerX, minY, centerZ)`. Treat all calibrated world units as metres. Transform source points by `origin + factor * (point - origin)`; never modify GLB vertex buffers or child-local anatomy transforms. Refuse invalid calibration without breaking Explore: disable study via a separate localized calibration-readiness flag, not a fabricated measurement or whole-viewer failure.
- [x] Generate an unanimated neutral silhouette with simple existing Three.js geometry and a plain bone/stone material; exact vertical bounds 0–1.7 m above ground. Place it on the near +Z side of the animal with **0.6 m clearance beyond the calibrated specimen Z bound**, centered along X. Extend the study-only plinth coverage to support that position, retaining the same ground plane. Generate the X-length line **0.35 m farther +Z**, with endpoints at calibrated X min/max and **0.03 m above ground**; short upright end ticks identify its endpoints. No new scientific claims or figure animation.
- [x] In the viewer, put model and original plinth under a neutral `Group` wrapper. At `begin`, save the original wrapper transform, original camera/target/zoom, projection-fit extents, clip/light/shadow setup, and disable input/clear damping before calibration. Apply the origin-preserving uniform scale once for the entire study, including Meet. Recompute calibrated hero framing and light/clip bounds; adapt the original hero position/target by the same transform so entry does not arbitrarily change the familiar composition. Keep comparison geometry in calibrated scene coordinates, not beneath a second scaled parent.
- [x] Compute Scale framing from the union of calibrated specimen/plinth, silhouette, guide/ticks, and support surface bounds at the existing hero viewing direction. Fit projected corners using the existing `orthographicHalfHeight` 15% margin. During Scale, interpolate hero target/zoom to the comparison fit using smoothstep of `scaleProgress`; camera remains at a valid distance/clipping range. Reduced motion selects the complete composed Scale view immediately. Recompute aspect-dependent fits on resize without changing the authoritative timeline or paused camera orbit/zoom.
- [x] Generalize the existing 350 ms `compose` target away from hard-coded hero vectors. Start/Resume composes the current frame before audio advances; cancellation resolves false. `present` applies the timestamp-derived guided pose only while controller-owned. Pause restores normal lighting but leaves calibrated transforms and chapter graphics. During paused Reset use the calibrated whole-exhibit fit, not OrbitControls' saved pre-study reset state; outside the study keep existing Reset unchanged.
- [x] Projection uses the same world-space ray-depth convention as inspection against real specimen meshes: hide behind-animal/offscreen anchors and their leaders. Publish snapshots only when visibility/coordinates change; cache scratch vectors/raycaster/intersection storage, and skip hidden geometry work. Recompute after controls/matrix updates in the existing render loop, including while paused. `setVisible(false)` immediately publishes a hidden snapshot.
- [x] On Exit, hide comparison/extra support, restore wrapper and light/clip/fit state, then saved Explore camera/target/zoom using the current viewport; clear residual damping before releasing ownership. The original OrbitControls reset state must remain unchanged. Remove graphics on backward transition to Meet, completion, navigation, and context loss. Reuse comparison resources across starts; dispose owned geometry/materials exactly once through the existing viewer lifetime (remove comparison root before scene-wide disposal). Never dispose specimen resources from the comparison module.
- [x] Add/execute geometry, calibration, and projection assertions in `npm run check:study`. Prove the real viewer's saved-view and ownership behavior with the temporary browser probe in Task 3, not a view mock.

### Task 3: Localized labels and built-exhibit acceptance

**Files:** Modify `src/lib/viewer/SpecimenViewer.svelte`, `src/app.css`, `messages/en.json`, `messages/de.json`, `README.md`.

**Interfaces:** Consume `ScaleProjection` through the viewer's new callback. Add `calibrationReady: boolean` to `ViewerHandle`, initially false, set before notifying ready; combine it with existing recording/required-target readiness in Svelte. Do not overload the meaning of missing armor/tail targets. Add a localized calibration-unavailable reason. `StudySnapshot.chapter` supplies chapter identity, not geometry visibility.

- [x] Add localized current chapter and honest readiness text describing introduction plus scale, not a full four-chapter study. Include chapter in the polite status only on meaningful status/chapter changes; no per-frame announcements. Keep current Play/Pause, captions, Retry, Exit, English-narration indication, focus handling, and SSR behavior.
- [x] During a visible comparison, put the two exact localized labels in a normal-flow legend **below the stage/anatomy-note frame and above study captions/controls**, so wrapping/200% text cannot obscure anatomy. Use small numbered anchor badges (1 length, 2 human) and matching legend entries; screen-reader-readable label text lives in the legend. Badges/leaders are decorative, pointer-events none, and hidden when their anchors are occluded/offscreen. Labels remain readable during paused orbit even if an anchor disappears. No floating paragraphs or hover-only information. Preserve existing anatomy marker/note layout and 1rem section padding.
- [x] Run integrated commands once after implementation: `npm run check`, `npm run check:camera`, `npm run check:anatomy`, `npm run check:study`, `npm run build -- --mode development`. Record actual results; do not suppress existing Three.js chunk/color-environment warnings. Generated localization must use the existing commands, not checked-in generated files.
- [x] Start separate local media and static hosting processes only if needed; inspect existing endpoints before choosing unused ports. Do not stop user-owned services. With the real approved MP3 and GLB, open the **built static exhibit** and hear/observe continuous Meet → Scale → Explore. Verify transitions at the actual chapter boundaries, captions, visible 8 m/1.7 m comparison, whole-scene framing, common ground, and removal of comparison on completion. Repeat Start from zero; there must be no Armor/World presentation.
- [ ] Pause within Scale: verify frozen native time, all three anatomy notes, surface/marker picking, manual orbit/zoom/Reset, label following and hiding, normal lighting. Resume clears inspection and holds audio during the ~350 ms reframe before continuing. Disable captions, pause/resume, and confirm choice persists; new Start enables captions. Use a temporary native-media hook for backward/forward seeks across Meet/Scale and direct Scale time; no permanent debug interface.
- [ ] From a rotated/zoomed Explore view, capture camera and rendered state. Exit during Scale playback, paused inspection, loading/buffering, Retry, and resume composition; resize while active. Confirm original model/plinth transform, current-aspect saved framing, lights, controls, and no later camera drift. Exercise Pause/Exit during pending media/seek/composition to catch stale callbacks.
- [x] Observe both localized routes at 1365×768, 1024×768, and 390×844, at 100% and 200% root text size; keyboard/focus, >=16px text, >=44px controls, no horizontal overflow or essential anatomy covered. Use reduced-motion emulation to confirm complete comparison with immediate composed views; distinguish emulation from physical-device testing.
- [x] Exercise actual missing/failed media and explicit retained-position Retry during Scale, WebGL context loss, and delayed-load document navigation. Verify no old-page audio/overlays and readable localized failure states. A temporary viewer probe counts comparison geometry/material disposal, originals restored, and no double-disposal after repeated starts/exits and final teardown. Remove probe files/tabs and stop only owned services afterward.
- [x] After smoke proof, update README's top-level delivered scope, superseded Meet-only cutoff statements, and append actual Scale acceptance/limits. Preserve October 4–5 Meet-only evidence explicitly as historical; do not rewrite old observations as if they covered Scale. Inspect actual build/staged paths to ensure no GLB/MP3/private evidence/scaffolding entered output or source. Post observed evidence to #2; only close when all acceptance criteria are demonstrated. Do not claim production hosting, model publication rights, German audio, physical-device, or screen-reader verification.
- [x] Commit scoped code/check/docs changes with an accurate #2 reference after acceptance. No commits or tracker mutations are required merely to review this plan.

## Acceptance Coverage

| #2 criterion | Owning work |
|---|---|
| Real narration cues pullback, silhouette, guide | Tasks 1–2 timeline/camera; Task 3 built playback |
| Approximately 8 m calibration and qualified labels | Task 2 transformed geometry; Task 3 exact bilingual legend |
| Generated 1.7 m human without dependency | Task 2 geometry/bounds; Task 3 visual comparison |
| Consistent scale, common ground, responsive framing | Task 2 full-study wrapper/fit; Task 3 layout matrix |
| Paused inspection with camera-following/hidden anchors | Task 1 ownership; Task 2 projection; Task 3 actual paused interaction |
| Removal/restoration/resize/resource lifetime | Task 2 lifecycle; Task 3 failure, saved-view, disposal probes |
| Real audio, EN/DE, reduced motion, enlarged text | Task 3 complete built-exhibit matrix |

## Execution Handoff

Recommend **native execution in one session, followed by one independent whole-change review**. Controller, renderer, and UI changes share evolving contracts; parallel implementation would add coordination risk for this slice. Task 1 and Task 2 are coordinated implementation steps, not separately accepted partial features. No product implementation begins until the user reviews this plan and selects execution.

## Execution note — 2026-10-20

Implemented and accepted in the built static exhibit; observed evidence and limits are recorded in `README.md` under “Observed narrated scale comparison acceptance — 2026-10-20”. Three plan-specific probes remain unchecked rather than claimed:

- The pre-implementation failing run was not preserved as a separate artifact; the current regression covers the same behavioral cases and passes.
- Paused inspection was exercised with the Head note and all inspection/orbit/zoom/Reset controls, seeking was exercised through a temporary media hook, and captions were toggled across pause/resume/Start; the full three-note pixel matrix during Scale was not repeated because the anatomy regression and the previous Meet acceptance cover those paths.
- Exit was exercised during Scale playback, paused inspection, resume composition, and resize; exit during buffering or an active Retry was not exercised.

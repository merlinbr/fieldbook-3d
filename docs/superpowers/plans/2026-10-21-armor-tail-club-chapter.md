# Narrated Armor and Tail-Club Chapter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver issue #3 as real Meet → Scale → Armor playback: narration-driven armor framing/emphasis, then tail-club framing/emphasis at the recorded cue, ending at the World boundary with the delivered pause-to-inspect ownership.

**Architecture:** Extend the existing `field-study.ts` timeline from the Armor boundary to the World boundary and add one specimen-specific emphasis module for guided region emphasis/dimming. The viewer generalizes its guided camera fit to per-region framings computed from calibrated geometry; Svelte gains only the localized Armor chapter label. One specimen, scene, render loop, and authoritative study state; no second selection system.

**Tech Stack:** Existing Node >=24, Svelte 5/SvelteKit static output, Three.js 0.186.1, Paraglide, native browser audio, framework-free Node checks; no new dependencies.

**Spec:** [Issue #3](https://github.com/merlinbr/fieldbook-3d/issues/3), [guided Field Study design](../specs/2026-10-04-guided-field-study-design.md) (Chapters table, Pause-to-inspect ownership, Playback and state transitions, verification items 1–12). The approved ticket breakdown and delivered recording supersede the design document's awaiting-approval notices. This document is a plan for review, not implementation approval or evidence of delivered Armor playback.

## Global Constraints

- Actual narration timings drive both transitions; canonical Armor interval is **[23.666938775510204, 39.053061224489795)** seconds, with the armor → tail-club cue switch at **31.44** seconds. Derive all boundaries from the resolved version; never hard-code these values in playback code.
- Guided emphasis affects only the intended region; modest dimming of other specimen surfaces; no tint of unrelated shared materials, no x-ray, pulsing glow, attack animation, or extra anatomy region.
- Retain the reconstruction notice and qualified wording: plates formed in the skin and probably helped protect; inferred club use is not certain or its only possible function; no Zuul evidence transfer; no claim the model validates armor arrangement. Captions already carry the approved wording — do not edit narration files.
- Pause freezes the timestamp, removes guided emphasis/dimming, restores normal lighting, and enables the existing inspection unchanged. Clearing/switching a paused inspection restores normal appearance; resume removes inspection material changes and restores guided framing/emphasis at the frozen timestamp before audio advances.
- Repeated selection changes, pause/resume, clearing, Exit, and disposal leave no residual tint, leaked clones, duplicate handlers, or camera drift. Missing required armor/tail targets must keep the existing graceful Start-disabled explanation.
- Stable chapter IDs `meet`, `scale`, `armor`, `world`; anatomy IDs `armor`, `head`, `tailClub`. Reuse one specimen, scene, render loop, and resource lifetime. No generic presentation engine, new dependencies, backend, persistent preferences, or new selection/note implementation.
- Resume reframe approximately **350 ms**, narration held; reduced motion makes transitions immediate with composed views and identical content. Chapter/caption/cue intervals are start-inclusive and end-exclusive; scene state is a pure function of timestamp plus resolved version.
- Readable text ≥ **16 CSS pixels**, controls ≥ **44×44 CSS pixels**, visible focus; observe **1365×768**, **1024×768**, **390×844**, both languages, **200%** text enlargement.
- Full seek UI/chapter navigation and the World chapter remain #4/#5; language handoff remains #6; cinema mode/particles remain #7. Do not add them here.

## Existing Evidence and Cutover

- #1 and #2 are closed. `field-study.ts` currently throws past `version.chapters[2].start` (`assignStudyFrame`), and `StudyFrame` is `{ chapter: 'meet' | 'scale'; scaleProgress: number }`. Armor cannot work by adding emphasis alone; the delivered endpoint moves to `version.chapters[3].start`.
- The recorded cue bundle already contains `view: 'armor'` (23.667–31.44) and `view: 'tailClub'` (31.44–39.053) cues, and `study-data.ts` already validates that every chapter has its required cues (`requiredViews` includes `['armor', 'tailClub']` for the Armor chapter). No `study-data.ts` change is required.
- The viewer already hides Scale comparison graphics for non-Scale chapters (`comparison.setVisible(frame.chapter === 'scale')` in `compose`/`present`/`pause`) and applies one uniform calibration for the entire study, so Armor framings are computed in calibrated coordinates.
- Start gating already requires armor and tail-club targets (`targetsReady` in `SpecimenViewer.svelte`) with the localized unavailable reason (`m.studyTargets()`).
- `anatomy-inspection.ts` owns its selection highlight through `originals`/`clones` maps keyed by mesh/material with an amber `#d9a54d` lerp at 0.35; anatomy targets resolve nodes `armorGroup`, `headGroup`, `clubMesh`, with the armor upper-torso `bodyMesh` region mapping. Guided emphasis must sequence with, not run concurrently to, that system.
- Keep canonical recording JSON/identity unchanged; this is a presentation change, not changed audio or recording metadata.

## File Responsibilities

| File | Responsibility |
|---|---|
| `src/lib/viewer/field-study.ts` | Timeline extension through Armor, region/cue evaluation, delivered endpoint at `world.start`, chapter snapshot |
| New `src/lib/viewer/study-emphasis.ts` | Specimen-specific guided region emphasis and dimming with owned clone lifetime |
| `src/lib/viewer/anatomy-inspection.ts` | Export the shared region-mesh collection used by both inspection and guided emphasis |
| `src/lib/viewer/specimen-viewer.ts` | Region framings from calibrated bounds, boundary/region camera blends, guided lighting, pause/resume emphasis ownership ordering |
| `src/lib/viewer/SpecimenViewer.svelte` | Localized Armor chapter label/status only; no new overlay UI |
| `messages/en.json`, `messages/de.json` | `studyChapterArmor` label |
| `checks/field-study.mjs` | Timeline/controller Armor cases; real Three.js emphasis/dimming/ownership invariants |
| `README.md` | Observed Armor delivery and limits, only after real smoke proof |

No edits to `study-data.ts`, narration/caption files, the media host, anatomy picking semantics, or build configuration are planned.

## Review Focus

1. Cue boundaries are start-inclusive and end-exclusive: time exactly 31.44 must present the tail-club region, and exactly `world.start` completes the study; a half-open off-by-one looks correct except at the exact boundary. Pinned by Task 1's boundary assertions.
2. Guided emphasis and inspection both clone materials on the same meshes: applying guided emphasis while a paused inspection highlight is active, or the reverse, must leave zero residual tint. Pinned by Task 2's sequencing assertions and Task 4's built-exhibit probe.
3. A material shared between a region mesh and a non-region mesh must not tint the unrelated mesh ("without tinting unrelated shared materials"). Pinned by Task 2's shared-material assertions.
4. Backward seek or direct entry into Armor must reconstruct framing/emphasis purely from the timestamp with obsolete Scale graphics and prior region emphasis removed. Pinned by Task 1's backward-seek controller cases.
5. Repeated Start/Exit cycles through Armor must not leak clones or double-dispose specimen materials, and Exit must restore the saved Explore view even after Armor zoom/resize. Pinned by Task 4's built-exhibit disposal/saved-view probe.

---

### Task 1: Timeline extension through Armor

**Files:** Modify `src/lib/viewer/field-study.ts`, `checks/field-study.mjs`.

**Interfaces:**

```ts
export type StudyFrame = {
  chapter: 'meet' | 'scale' | 'armor';
  scaleProgress: number;
  region: 'armor' | 'tailClub';   // ignored by the viewer outside chapter 'armor'
  regionProgress: number;         // 0 = armor framing, 1 = tail-club framing
};
// evaluateStudyFrame(version, time, out) — signature unchanged; now valid through world.start.
// StudySnapshot.chapter extends to StudyFrame['chapter'] | null.
```

- Frame values are a pure function of `(version, time)`: chapters `meet`/`scale` keep `region: 'armor'`, `regionProgress: 0`. In chapter `armor`, `regionProgress` smoothsteps 0→1 over `ramp = min(0.75, tailClubCue.end - tailClubCue.start)` seconds beginning at the tail-club cue's start, then holds 1 (same ramp rule as `scaleProgress`).
- Internal: replace `findScaleCue`/`requireScaleCue` with `requireCue(version, view)` selecting the cue whose `view` matches and which overlaps its own chapter (`hero`→`meet`, `scale`→`scale`, `armor`/`tailClub`→`armor`, `world`→`world`); `deliveredEnd` becomes `version.chapters[3].start`; `frameCopy()` and `compose()`'s `targetFrame` copy all four fields.

- [ ] Extend `checks/field-study.mjs` first: boundary assertions at exactly `armor.start` (chapter `armor`, region `armor`, both progresses 0), at exactly 31.44-equivalent (`region: 'tailClub'`, `regionProgress: 0`), mid-ramp (~0.5), ramp end (1, held to chapter end), a throw past `world.start`; backward-seek and direct-seek controller cases reconstruct identical frames; pause/resume/retry/Exit cancellation cases still hold at Armor timestamps; the existing Scale/Meet assertions remain unchanged and passing. Run `npm run check:study` and observe the new cases fail.
- [ ] Implement the timeline change above. Keep one authoritative state machine; do not add armor-specific phases, timers, or event replay.
- [ ] Run `npm run check:study`. Expected: PASS including prior cases. Full `npm run check` is deferred to Task 3 (the viewer still reads only `chapter`/`scaleProgress`, so it compiles, but shows its pre-Armor behavior until Task 3).

### Task 2: Guided emphasis module and shared region meshes

**Files:** Create `src/lib/viewer/study-emphasis.ts`; Modify `src/lib/viewer/anatomy-inspection.ts`, `checks/field-study.mjs`.

**Interfaces:**

```ts
// anatomy-inspection.ts — new export, and the constructor refactored to use it:
export function anatomyRegionMeshes(model: Object3D, id: AnatomyId): readonly Mesh[];
// armor: meshes under `armorGroup` plus the same upper-half `bodyMesh` torso mapping
// (available only when armorGroup meshes exist); head: `headGroup`; tailClub: `clubMesh`.

// study-emphasis.ts
export type StudyEmphasis = {
  apply(region: 'armor' | 'tailClub'): void; // idempotent; re-apply with a new region restores first
  clear(): void;                              // idempotent; restores every original material
  dispose(): void;                            // clear + release owned clones exactly once
};
export function createStudyEmphasis(model: Object3D): StudyEmphasis;
```

- Emphasis treatment, pinned values: region meshes lerp their cloned material `color` 0.35 toward amber `#d9a54d` (matching the delivered inspection highlight); all other specimen meshes under `model` dim by lerping `color` 0.45 toward `#26241f`. Plinth, silhouette, guide, lights, and environment are never touched.
- Clone per mesh, never per shared material: two meshes sharing one material with different treatments each get their own clone, so an unrelated mesh sharing the material stays untinted. Clones are the only study-owned materials here; never mutate or dispose original specimen materials.

- [ ] Extend `checks/field-study.mjs` with real Three.js geometry first: a scene with armor-plate meshes, a shared-material leg mesh, `bodyMesh`, head, and club meshes; assert `anatomyRegionMeshes` returns exactly the delivered region membership (including the upper-torso mapping and its armor-availability condition); `apply('armor')` tints region meshes, dims non-region meshes, leaves the shared-material leg untinted; `apply('tailClub')` swaps without residue; `clear()` restores original material references byte-identically; repeated apply/clear/dispose cycles create no duplicate clones and dispose each clone exactly once. Run `npm run check:study` and observe the new cases fail.
- [ ] Implement `anatomyRegionMeshes` (extracting the constructor's existing traversal/mapping) and `createStudyEmphasis`. No allocation per frame: apply/clear are event-driven, and scratch objects are module-local.
- [ ] Run `npm run check:study`. Expected: PASS.

### Task 3: Region framings and ownership sequencing in the viewer

**Files:** Modify `src/lib/viewer/specimen-viewer.ts`.

**Interfaces:** Consumes Task 1's `StudyFrame` and Task 2's `StudyEmphasis`. `StudyView` signatures are unchanged; `compose`/`present`/`pause` interpret the new fields.

- At `begin` (after calibration), compute Armor-region and Tail-club framings from the union of each region's calibrated world-space mesh bounds, viewed along the existing guided hero direction, fitted with the existing `orthographicHalfHeight` 15% margin — the same fit path Scale uses. Recompute aspect-dependent fits on resize without changing the authoritative timeline.
- Camera state is a pure function of the frame: chapter `armor` blends from the Scale end-state view to the armor framing over `ramp = min(0.75, armorCue.end - armorCue.start)` from `armor.start` (smoothstep, same constant as Scale), then `regionProgress` blends armor → tail-club framing. Guided lighting follows the active framing's target, as Scale does today.
- `present` applies guided emphasis for `frame.region` (only while controller-owned; comparison graphics already hide outside Scale). `pause` clears guided emphasis before enabling inspection, preserving today's pause behavior otherwise. Resume/`compose` clears any inspection selection (restoring its materials) before applying guided emphasis for the frame's region. No path applies both systems' material changes concurrently.
- Reduced motion: chapter entry and the region switch select the complete composed framing immediately, skipping both blends without dropping emphasis, captions, or content.
- Exit/completion/navigation/context loss clears emphasis, restores wrapper/lights/saved Explore view exactly as today, and disposes emphasis clones through the existing viewer lifetime exactly once; repeated Start cycles reuse the emphasis module without leak.

- [ ] Implement the viewer integration above. Update the transient pre-Armor placeholder behavior from Task 1 (armor chapter currently showing the hero pose) as part of this change.
- [ ] Run `npm run check` (0 errors/warnings), `npm run check:camera`, `npm run check:anatomy`, `npm run check:study`, and `npm run build -- --mode development`. Record actual results; do not suppress existing Three.js chunk/color-environment warnings.

### Task 4: Localized label, built-exhibit acceptance, and delivery

**Files:** Modify `src/lib/viewer/SpecimenViewer.svelte`, `messages/en.json`, `messages/de.json`, `README.md`.

**Interfaces:** Consumes Task 1's `StudySnapshot.chapter` value `'armor'`; no new props, stores, or overlay components. The chapter label derives from the existing `studyChapterMeet`/`studyChapterScale` pattern: add `studyChapterArmor` = **"Built-in armor"** / **"Ein eingebauter Panzer"**, used in the polite chapter/status announcement and status line exactly where the other chapter labels are.

- [ ] Add the localized label and regenerate Paraglide with the existing commands (`npm run check`); no checked-in generated runtime.
- [ ] Start the local media host (`npm run media:dev`) and dev/static hosting only on unused ports if needed; with the real approved MP3 and GLB, open the built static exhibit and observe continuous Meet → Scale → Armor: the armor framing/emphasis at 23.667 s, dimming scope on the real model, the switch to tail-club framing/emphasis at 31.44 s, captions matching, and completion restoring the saved Explore view with no study graphics. Repeat Start from zero; there must be no World presentation.
- [ ] Pause within Armor: verify frozen timestamp, all three anatomy notes with the original gesture/occlusion/focus behavior, clearing and switching notes restores normal appearance (not the guided highlight), orbit/zoom/Reset work, emphasis is absent while paused. Resume restores the guided framing/emphasis at the frozen timestamp before audio advances; focus moves to Play/Pause when a removed note/disablement requires it. Exercise the armor→tail-club boundary from both sides, including pause exactly at the cue switch.
- [ ] From a rotated/zoomed Explore view: Exit during Armor playback, paused inspection, resume composition, and resize-while-active; confirm the original saved framing, lights, and no later camera drift. A temporary viewer probe counts emphasis clone creation/disposal across at least three Start/Pause-inspect/Resume/Exit cycles: zero residual tint, no leaked clones, no double-disposal of specimen materials. Remove probe files/tabs and stop only owned services afterward.
- [ ] Observe both localized routes at 1365×768, 1024×768, and 390×844 at 100% and 200% root text size, keyboard/focus paths, and reduced-motion emulation (immediate composed armor and tail-club views). Distinguish emulation from physical-device testing.
- [ ] After smoke proof, update README's delivered scope (Armor chapter now plays; World and full navigation remain tickets #4/#5) and append the observed acceptance with explicit limits. Post observed evidence to #3 and close it only when every acceptance criterion is demonstrated. Do not claim physical-device, screen-reader, production-hosting, or model-rights verification.
- [ ] Commit scoped code/check/docs changes with an accurate #3 reference after acceptance.

## Acceptance Coverage

| #3 criterion | Owning work |
|---|---|
| Narration timings drive armor → tail-club framing/emphasis; whole chapter in the exhibit | Task 1 timeline; Task 3 viewer blends; Task 4 built playback |
| Emphasis only on the intended region; modest dimming; no unrelated shared-material tint | Task 2 emphasis module + checks; Task 4 visual confirmation |
| Reconstruction notice and qualified wording retained | Global Constraints; Task 4 README/evidence (captions unchanged) |
| Pause freezes timestamp, removes emphasis, enables existing inspection | Task 3 ownership ordering; Task 4 paused-inspection observation |
| Clear/switch inspection restores normal appearance; resume restores guided state | Task 3 ordering; Task 2 restore assertions; Task 4 cycles |
| No residual tint/leaks/duplicate handlers/drift; missing targets stay graceful | Task 2 disposal checks; Task 3 lifetime reuse; Task 4 probe (Start gate pre-existing) |
| Both languages, desktop/narrow, reduced motion observed | Task 4 viewport matrix |

## Execution Handoff

Recommend **native execution in one session, followed by one independent whole-change review**. Tasks 1–3 share one evolving `StudyFrame` contract and the viewer's camera/emphasis state; parallel implementation would add coordination risk for this slice, and Task 2 is a prerequisite seam for Task 3. No product implementation begins until the user reviews this plan and selects execution.

# Task 3 implementation report

## Implementation

- Added `anatomyRegionBounds(model, id)` in `src/lib/viewer/anatomy-inspection.ts`. It unions world-space bounds from the target node meshes only, avoiding the supplemental torso mesh used by armor emphasis.
- Integrated guided study emphasis into `specimen-viewer.ts`; compose disables inspection before applying guided emphasis, pause clears emphasis before enabling inspection, and restore/disposal clear and release the emphasis clones.
- Added calibrated Armor and tail-club framings fitted from their world-space region bounds along the guided hero direction. The fit uses the existing orthographic 15% margin and recomputes on resize without modifying the study timestamp.
- Implemented timestamp-derived camera pose blending from the Scale endpoint into Armor and then tail-club. Reduced-motion resolves directly to the current Armor or club framing. Composition eases position, target, and zoom to the computed pose; key/fill targets follow that pose. The calibrated hero camera distance is maintained for region framings, and the guided shadow ranges remain established at study start.
- Kept paused manual camera interaction independent from guided pose updates; exit restores the saved Explore camera, wrapper, and lighting state.

## Verification

Commands run after the final code change:

- `npm run check` — passed; Paraglide/Svelte check reported `1325 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`.
- `npm run check:camera` — passed (exit 0; `node checks/camera-fit.mjs`).
- `npm run check:anatomy` — passed; anatomy selection/gesture and plate-gap/body-boundary/transform/ownership assertions passed.
- `npm run check:study` — passed; timeline/calibrated geometry/projection/lifetime and metadata/audio/retry/cancellation assertions passed.
- `npm run build -- --mode development` — passed; static site output written to `build`.

The development build emitted its existing warning that a client chunk exceeds 500 kB after minification, plus Node's `NO_COLOR`/`FORCE_COLOR` warning. These warnings were not suppressed.

## Files changed

- `src/lib/viewer/anatomy-inspection.ts`
- `src/lib/viewer/specimen-viewer.ts`
- `.superpowers/sdd/2026-10-21-armor-tail-club-chapter/task-3-report.md`

## Self-review findings

- Region bounds are collected from target-node meshes (not the armor emphasis supplement), and both framings use the same camera projection fitting strategy as the Scale fit.
- Emphasis and inspection material ownership are sequenced; clones are cleared on pause/restore and disposed once by the viewer lifetime.
- Resize recalculates aspect-dependent region zooms; paused/manual camera state is restored after fit calculations and not overwritten.
- No changes were made to `study-data.ts`, narration, caption, or message files.

## Concerns / limits

- The requested automated checks and development build passed. A real exhibit playback/reduced-motion/paused-inspection visual smoke test was not performed as part of this Task 3 implementation; the plan assigns built-exhibit acceptance to Task 4.
- The build's existing large-chunk and color-environment warnings remain visible, as requested.

## Review fixes

- Corrected `anatomyRegionBounds` to traverse the configured target node directly, excluding the supplemental armor `bodyMesh`.
- `restoreStudy` now marks `studyActive = false` before returning control to Explore, allowing a subsequent Start cycle.
- `dispose` now calls `inspection.dispose()` and clears its reference, in addition to disposing guided emphasis.

### Review-fix verification

Ran `npm run check && npm run check:anatomy && npm run check:study && npm run build -- --mode development`.

- `check`: passed with `1325 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`.
- `check:anatomy`: passed; anatomy selection/gesture and plate-gap/body-boundary/transform/ownership assertions passed.
- `check:study`: passed; timeline/calibrated geometry/projection/lifetime and metadata/audio/retry/cancellation assertions passed.
- Development build: passed; static site written to `build`. Existing >500 kB chunk warning and Node `NO_COLOR`/`FORCE_COLOR` warning were emitted and not suppressed.

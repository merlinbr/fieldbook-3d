# Implementation agent handoff — Ankylosaurus anatomy inspection

## Assignment and approval boundary

Implement the anatomy inspection milestone described by the approved specification and implementation plan below. The user approved the written specification, requested the plan, confirmed the first exhibit is delivered, and requested this handoff for the implementing agent.

Read in order:

1. `fieldbook-3d-context.md` — overall experience and remaining prototype requirements.
2. `docs/superpowers/specs/2026-10-03-anatomy-inspection-design.md` — approved behavior, English/German copy, and acceptance criteria.
3. `docs/superpowers/plans/2026-10-04-anatomy-inspection.md` — concrete file map, types, implementation steps, regression check, and browser verification matrix.
4. `README.md` and `docs/assets/ankylosaurus.md` — current setup, delivered behavior, verification history, and asset limitations.

Proceed with that design when assigned implementation; do not repeat the architecture or interaction approval discussion. The documents' statements that implementation was not requested in the planning session distinguish planning from execution; they are not an outstanding requirement to reapprove the agreed design. Report materially conflicting requirements rather than silently reducing scope.

This handoff itself implements no application code.

## Confirmed starting point

- First exhibit delivered in `0a641c6` (`feat: add first explorable Ankylosaurus exhibit`). The last fetch showed local `main` and `origin/main` at that commit.
- Anatomy specification was committed in `2c91090`; the implementation plan and recorded specification approval were committed in `f92116f`.
- The anatomy plan was written against the actual first-exhibit working-tree implementation before its commit. After delivery, the Three.js viewer and Svelte wrapper were checked again and matched those inspected versions. No implementation-plan redesign was needed.
- The prerequisite to wait for the first-exhibit delivery is now satisfied. Re-read current files before editing and preserve any subsequent unrelated work; do not reset to these commits or overwrite another active agent's changes.
- `src/lib/viewer/specimen-viewer.ts` owns the scene, orthographic camera, existing animation loop, GLB load, controls, failure states, and disposal. Its current factory is `createSpecimenViewer(container, modelUrl, onState)`; the plan extends it with a required inspection callback and adds `selectAnatomy` to the handle.
- `src/lib/viewer/SpecimenViewer.svelte` is the only application caller. The specimen page supplies localized content. Existing import aliases are `#lib/...`; preserve current configuration rather than recreating the app from an older planning example.
- Svelte owns readable DOM/UI and component lifetime; Three.js remains browser-only. Preserve prerendering and full-document English/German locale links.
- The local ignored `media-dev/ankylosaurus.glb` was present during planning. JSON inspection and parsing with the project Node/Three.js runtime confirmed `armorGroup`, `headGroup`, and `clubMesh`. The plan's local surface anchors came from actual ray/triangle intersections. Their visual placement still needs browser verification.
- The plan's selection/gesture implementation and assertion snippets were executed together in memory and passed. This is not proof that the feature has been implemented or that its UI works.
- The existing README records first-exhibit check/build and browser results. Those are prior delivery evidence, not new anatomy verification.
- The last status showed untracked `example project/`. Preserve it and its dependencies; do not stage, delete, or clean it incidentally.

## Deliverable

Three inspectable regions on the existing resting Ankylosaurus: **armor, head, tail club**.

- Visible anatomical surfaces and projected markers both select. Permanent native named buttons provide equivalent keyboard and assistive-technology access, including selection of a hidden region.
- One selected region and one English/German note. Use the approved copy; do not replace it with temporary text. Same-region selection keeps the note open; another region replaces it.
- Selection does not move the camera. Apply restrained amber emphasis only to the selected region; retain normal lighting and the other materials.
- Markers hide when their anchors are occluded or outside the camera view. Surface picking cannot select anatomy through a nearer body surface.
- An already-open note stays readable when its anchor is hidden/offscreen; only the leader line hides. Restore the line when the anchor becomes visible.
- Empty viewer space or plinth, Close, and scoped Escape dismiss. Non-target body surfaces and unrelated UI controls preserve selection.
- Orbit drags, pinch, canceled pointers, and releases outside the picking surface never select or dismiss.
- Notes remain within the usable viewer area, with a docked edge layout on narrow screens, readable text, accessible Close, and no covered essential controls.
- Preserve loading/error/WebGL states and correct disposal, including late GLB completion.

This summary does not replace the specification or the plan's full acceptance matrix.

## Implementation sequence

1. **Input rules:** Add the small browser-independent anatomy state/gesture module and the one Node assertion check from Task 1. Add `check:anatomy`; no test framework.
2. **Three.js integration:** Add the fixed target mapping and anchors, nearest-hit picking, marker hit testing, projection/occlusion, selected-material handling, and pointer lifetime. Integrate into the existing viewer render/disposal path and migrate its single caller.
3. **Localized UI:** Extend existing specimen content and Paraglide messages. Add native anatomy controls, pointer-transparent projected marker visuals, one measured note/leader, focus restoration, and selection-only announcements. Keep selection authoritative in the inspection controller.
4. **Verify and deliver:** Run integrated checks, exercise the actual static exhibit against the complete matrix, update README/context with observed results, remove temporary harnesses, and commit only feature-owned files.

Default to inline execution. These tasks share contracts and the same viewer files; do not split them into simultaneous competing edits. Delegate only genuinely independent work after shared interfaces exist. One integration owner runs checks/build after integration, not concurrently with edits.

## Important implementation traps

- **Raycast the whole specimen first.** Picking only the three selectable targets would select hidden anatomy through the body. A nearer non-target mesh means preserve selection, not clear or fall through to another hit. No specimen hit means empty space/plinth.
- **Use orthographic occlusion rays.** `Raycaster.setFromCamera()` through the projected anchor is correct; a perspective-style ray from the camera position toward the anchor is not. Use a small numerical surface tolerance, never a broad exception for the selected region.
- **Surface points, not group centers.** The plan provides node-local coordinates derived from the current GLB. Apply parent transforms correctly and visually check all three. Do not hide a self-occlusion problem by disabling occlusion for a whole group.
- **One gesture path for markers and surfaces.** Marker visuals are pointer-transparent and excluded from the tab order/accessibility tree. Canvas picking tests their visible 44px areas in the same stacking order as the DOM. Named native buttons are the stable accessible path.
- **Sticky gesture cancellation.** More than 6 CSS pixels at any point cancels selection, even if the pointer returns to its start. Multi-pointer cancellation lasts until every tracked pointer ends. Do not add competing pointer capture or break OrbitControls.
- **No duplicated selection state.** The controller owns selection; Svelte derives content and pressed states from its snapshots. Projection updates must not repeatedly announce text or restart entry motion.
- **Shared materials require isolation.** Clone selected material references, restore originals on switch/clear, and dispose owned clones before the viewer's original-resource traversal. Do not dispose shared textures with a highlight clone or tint non-selected anatomy.
- **Keep the existing animation loop.** Update projections after controls/camera matrices, including damping, keyboard orbit/zoom, reset, and resize. Cache scratch objects and skip unchanged notifications; do not add another renderer or frame loop.
- **Focus must survive dismissal.** Close/Escape from inside the note returns focus to its named anatomy button. Failure that disables those buttons uses the viewer section instead. No global Escape listener, modal focus trap, or automatic focus jump into the note.
- **Preserve lifetime guards.** Clear inspection UI on failure; remove pointer/resize listeners and highlight resources during disposal. Late loads and pending DOM measurements cannot revive detached UI.
- **Missing targets degrade without pretending success.** Disable only the missing target and identify it in localized status while preserving ordinary exploration. All three targets must be available with the normal asset for acceptance.

## Local assets and repository boundaries

Use the existing `PUBLIC_ANKYLOSAURUS_MODEL_URL` configuration. Local development serves the ignored model separately with `npm run media:dev` on loopback port 5194; do not copy it into application static output.

A fresh checkout does not contain the GLB. Obtain the existing local asset or follow `docs/assets/ankylosaurus.md` to regenerate the supplied source when available. Do not fabricate a substitute or assume production media rights. Model publication/reuse rights and scientific accuracy remain unresolved; the repository MIT license does not license this media by implication.

Keep the existing dependencies, lockfile conventions, camera-fit behavior, and source/media separation. Do not commit GLB, screenshots, fonts, recordings, generated Paraglide output, or the supplied example.

## Verification and reporting

After integration:

```sh
npm run check
npm run check:camera
npm run check:anatomy
npm run build -- --mode development
```

Serve `build/` independently of the SvelteKit dev server and keep the separate media endpoint available. Run Task 4's full matrix, including:

- Both language routes, direct refresh, locale navigation, every selection path, same-ID selection, switching and material restoration.
- Occluded/offscreen markers and anchors, hidden-region selection via named controls, and no through-body picking.
- Drag out-and-back, pinch with staggered releases, cancel, release outside/over UI, then a deliberate tap.
- Close/Escape/empty-space behavior, keyboard focus and pressed states, and no repeated accessibility announcements during movement.
- Actual rendered output at 1365x768, 1024x768, 390x844, both languages, 200% text enlargement, open-note resize, and reduced motion.
- Missing-target injection in temporary in-memory GLB data, blocked loading, WebGL loss/unavailability, delayed-load disposal, and highlight/listener cleanup. Do not modify the normal asset for fault injection.

Report only checks/scenarios actually exercised. Distinguish touch emulation from physical-device testing, accessibility-tree/live-region inspection from actual screen-reader use, and development-mode static smoke from production CDN deployment. Tests of the input module alone do not prove appearance, picking, note placement, or disposal.

After smoke proof, update `README.md` and the project context to record delivered anatomy while preserving the later Field Study scope. Remove temporary harnesses/instrumentation, close inspection tabs, and stop only services started for this work. Check staged paths before committing so unrelated files/media are excluded.

Do not declare completion if a normal-asset target is unavailable, gestures change selection, picking reaches through the body, a hidden anchor removes the note, or controls become obscured.

## Out of scope

No guided Field Study, audio/captions/timeline, pause/resume integration, measurements, camera assistance, new regions, walking/auto-rotation, model redesign, specimen collection, saved preferences, backend, hosting changes, dependency additions, generic annotation engine, or empty future modules. Deliver anatomy inspection, not a claim that the complete narrated prototype is finished.

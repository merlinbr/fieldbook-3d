# Anatomy Inspection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add accessible, localized armor/head/tail-club inspection to the existing Ankylosaurus exhibit, with visible-surface selection, occlusion-aware markers, restrained highlighting, and one anchored note.

**Architecture:** Keep the existing Svelte/Three.js boundary. A small Three.js inspection module owns targets, selected-region state, picking, projection, highlighting, and pointer lifetime; the existing viewer calls it within its current render loop. Svelte renders projected markers, permanent native anatomy controls, and a single localized note from viewer notifications.

**Tech Stack:** Existing Svelte 5 / SvelteKit 3, TypeScript, Three.js 0.186.1, Paraglide JS, native DOM/CSS, Node 24 LTS assertions. No new dependencies.

## Global Constraints

- Approved spec: `docs/superpowers/specs/2026-10-03-anatomy-inspection-design.md`. The user approved the written spec and requested this plan; that is not a request to begin application implementation in this planning session.
- `fieldbook-3d-context.md` remains the source of truth for the complete prototype.
- Exactly three stable region IDs: `armor`, `head`, `tailClub`.
- Only one note; same-region selection stays open. No camera movement on selection, no x-ray highlight, no dimming of unselected anatomy.
- Visible markers AND anatomical surfaces select; hidden surfaces must not be picked through a nearer body surface.
- A maximum displacement over 6 CSS pixels from pointer-down cancels click selection; any multi-pointer gesture cancels selection until all its pointers end.
- Hidden/offscreen anchors hide markers and leader lines, never an already-open note.
- Essential text at least 16 CSS pixels; interactive targets at least 44 by 44 CSS pixels. Respect reduced motion and preserve keyboard focus.
- Preserve English/German prerendered URLs, full-document locale switching, SSR content, browser-only Three.js initialization, existing camera behavior, and error/disposal handling.
- No Field Study, narration, timeline, measurements, camera assistance, new regions, saved selection, generic annotation engine, model redesign, or dependency changes.
- Media remains external/ignored; do not put the GLB in Git, `static/`, or the application build. Preserve the supplied example and unresolved media-rights notices.
- No edits/builds/formatters against another agent's unfinished viewer. Confirm the first-exhibit owner has handed it off before implementation; re-read changed files first. One owner integrates this feature. Tasks below are dependent and should normally run inline, not as competing edits to the viewer.
- Run integrated checks once after all feature edits. The permanent regression check must exercise real selection/gesture behavior, not copied text, mock forwarding, or implementation strings.

---

## Planning evidence and integration baseline

Inspected on 2026-10-04; these are observations, not new runtime acceptance claims:

- `src/lib/viewer/specimen-viewer.ts` has a single `createSpecimenViewer(container, modelUrl, onState)` factory, `ViewerHandle` with reset/zoom/orbit/dispose, a render loop at `render()`, guarded async GLB completion, and centralized `fail()`/`dispose()`.
- `src/lib/viewer/SpecimenViewer.svelte` is its only application caller. `src/routes/specimens/ankylosaurus/+page.svelte` supplies its sole `modelUrl` prop and selects localized specimen content using `getLocale()`.
- Existing imports use `#lib/...`, not the old plan's `$lib` examples. Preserve actual configuration and package versions.
- `src/app.css` places the current controls/status below `.viewer-stage`. Keep controls outside the inspection overlay instead of solving arbitrary panel collisions.
- `README.md` records prior first-exhibit checks, browser scenarios, and disposal results. Those results are attributed to that delivery; they were not rerun during planning.
- Read the ignored GLB JSON and parsed it using the project's Node/Three.js runtime. All three named nodes exist. Rays against their actual triangles produced the local surface anchors in Task 2, exit code 0. This proves geometry intersections, not good visual placement at every angle.
- Language-server references were unavailable; literal reference search found the one Svelte caller and page above. Repeat reference lookup before changing exported contracts if a language server becomes available.
- Executed the Task 1 TypeScript state snippet and its assertion snippet together in memory using Node's `stripTypeScriptTypes`: all assertions passed, exit code 0. Node emitted its experimental API warning. This checks the plan's sample logic only; no application code was installed or feature browser checks run.

## File map

| Path | Action and responsibility |
| --- | --- |
| `src/lib/viewer/anatomy-input.ts` | New: stable IDs, selected-region and pointer-gesture rules; browser/Three.js-free so the real behavior is directly assertable |
| `src/lib/viewer/anatomy-inspection.ts` | New: asset-specific target mapping/anchors, Three.js raycasting/highlights/projections, pointer listeners, public inspection snapshot |
| `src/lib/viewer/specimen-viewer.ts` | Modify: own one inspection instance, expose selection action and snapshot callback, update/dispose it in existing lifetime |
| `src/lib/viewer/SpecimenViewer.svelte` | Modify: anatomy controls, markers, note/leader, measured placement, focus and announcements |
| `src/lib/specimens/ankylosaurus.ts` | Modify: EN/DE anatomy labels/headings/text next to current specimen content |
| `src/routes/specimens/ankylosaurus/+page.svelte` | Modify: pass current locale's anatomy content to viewer |
| `messages/en.json`, `messages/de.json` | Modify: shared inspection UI messages/instructions only |
| `src/app.css` | Modify: anatomy controls/markers/note/leader, docked layout, motion/focus styles |
| `checks/anatomy-input.mjs`, `package.json` | Add one Node assertion check and `check:anatomy` script |
| `README.md`, `fieldbook-3d-context.md` | Update after verification: delivered scope and observed evidence, not future promises |

No additional Svelte component is required for one small note. No `SpecimenTerminal`, global store, or generic annotation adapter.

## Task 1: Implement selection and gesture rules with one regression check

**Files:** Create `src/lib/viewer/anatomy-input.ts`, `checks/anatomy-input.mjs`; modify `package.json:scripts`.

**Consumes:** Pointer IDs, client coordinates in CSS pixels, release eligibility, and classified pick results supplied by Task 2.

**Produces:** `AnatomyId`, `ANATOMY_IDS`, `AnatomyHit`, and `createAnatomyInput()` with the exact API below. Selection is owned here and nowhere else; the Three.js inspection module owns this instance. Svelte only observes snapshots.

- [ ] Implement the following browser-independent state. Track the maximum excursion by making cancellation sticky, not by comparing only the final displacement. `undefined` means a non-selectable specimen surface, while `null` means empty space/plinth or explicit dismissal.

```ts
export const ANATOMY_IDS = ['armor', 'head', 'tailClub'] as const;
export type AnatomyId = (typeof ANATOMY_IDS)[number];
export type AnatomyHit = AnatomyId | null | undefined;

export function createAnatomyInput() {
  let selected: AnatomyId | null = null;
  const pointers = new Map<number, { x: number; y: number }>();
  let blocked = false;

  function select(hit: AnatomyHit): boolean {
    if (hit === undefined || hit === selected) return false;
    selected = hit;
    return true;
  }

  function move(id: number, x: number, y: number): void {
    const start = pointers.get(id);
    if (start && (x - start.x) ** 2 + (y - start.y) ** 2 > 36) blocked = true;
  }

  return {
    get selected() { return selected; },
    get active() { return pointers.size > 0; },
    select,
    down(id: number, x: number, y: number): void {
      if (pointers.size === 0) blocked = false;
      pointers.set(id, { x, y });
      if (pointers.size > 1) blocked = true;
    },
    move,
    up(id: number, x: number, y: number, inside: boolean): boolean {
      if (!pointers.has(id)) return false;
      move(id, x, y);
      const activate = !blocked && pointers.size === 1 && inside;
      pointers.delete(id);
      if (pointers.size === 0) blocked = false;
      return activate;
    },
    cancel(id: number): void {
      if (!pointers.has(id)) return;
      pointers.delete(id);
      blocked = pointers.size > 0;
    },
    resetGesture(): void {
      pointers.clear();
      blocked = false;
    }
  };
}
```

- [ ] Add the runnable check below. Keep all cases in this one file; it tests the same object that the production controller uses. It catches consumers losing their note during navigation gestures as well as accidental selection.

```js
import assert from 'node:assert/strict';
import { createAnatomyInput } from '../src/lib/viewer/anatomy-input.ts';

const input = createAnatomyInput();
function release(id, x, y, inside, hit) {
  if (input.up(id, x, y, inside)) input.select(hit);
}
assert.equal(input.select('head'), true);
assert.equal(input.select('head'), false);
assert.equal(input.select(undefined), false);
assert.equal(input.selected, 'head');

input.down(1, 0, 0);
input.move(1, 7, 0);
input.move(1, 0, 0);
release(1, 0, 0, true, null);
assert.equal(input.selected, 'head'); // out-and-back drag must not dismiss

input.down(1, 0, 0);
input.down(2, 10, 0);
release(1, 0, 0, true, 'armor');
release(2, 10, 0, true, null);
assert.equal(input.selected, 'head'); // remaining finger must stay blocked

input.down(1, 0, 0);
input.down(2, 10, 0);
input.cancel(1);
release(2, 10, 0, true, 'armor');
assert.equal(input.selected, 'head');

input.down(1, 0, 0);
input.cancel(1);
release(1, 0, 0, true, 'armor');
assert.equal(input.selected, 'head');

input.down(1, 0, 0);
release(1, 0, 0, false, null);
assert.equal(input.selected, 'head'); // release outside

input.down(1, 0, 0);
release(1, 7, 0, true, 'armor');
assert.equal(input.selected, 'head'); // final move need not arrive separately

input.down(1, 0, 0);
release(1, 6, 0, true, 'tailClub');
assert.equal(input.selected, 'tailClub'); // threshold is over 6, not at 6

input.down(1, 0, 0);
input.resetGesture();
release(1, 0, 0, true, null);
assert.equal(input.selected, 'tailClub');

input.down(1, 0, 0);
release(1, 0, 0, true, 'armor');
assert.equal(input.selected, 'armor'); // next deliberate activation recovers
assert.equal(input.select(null), true);
assert.equal(input.selected, null);
assert.equal(input.select(null), false);
```

- [ ] Add the script without changing other package settings or dependencies:

```json
"check:anatomy": "node checks/anatomy-input.mjs"
```

**Verification:** The final integrated check in Task 4 runs this assertion file. For a requested test-first execution, run it before/after the implementation in this task, but do not repeatedly run the whole project suite while integration is incomplete.

## Task 2: Integrate actual anatomy into the existing Three.js viewer

**Files:** Create `src/lib/viewer/anatomy-inspection.ts`; modify `src/lib/viewer/specimen-viewer.ts` and its single caller in `SpecimenViewer.svelte`.

**Consumes:** `createAnatomyInput`, the loaded `gltf.scene`, current orthographic camera, actual canvas, and viewport size.

**Produces:** The following contracts; define snapshot/controller types in `anatomy-inspection.ts`, import `AnatomyId` from `anatomy-input.ts` without re-export aliases. Add a required fourth factory argument, migrating the single caller in this task; no optional compatibility shim.

```ts
export type AnatomyProjection = {
  id: AnatomyId;
  available: boolean;
  visible: boolean;
  x: number; // CSS pixels relative to the canvas/stage top-left
  y: number;
};
export type InspectionSnapshot = {
  selected: AnatomyId | null;
  width: number;
  height: number;
  regions: readonly AnatomyProjection[]; // fixed ANATOMY_IDS order
};
export type AnatomyInspection = {
  select(id: AnatomyId | null): void;
  update(width: number, height: number): void;
  dispose(): void;
};
export function createAnatomyInspection(
  model: Object3D,
  camera: OrthographicCamera,
  canvas: HTMLCanvasElement,
  onChange: (snapshot: InspectionSnapshot) => void
): AnatomyInspection;

// Extend the existing handle with:
// selectAnatomy(id: AnatomyId | null): void;
// Existing reset/zoom/orbit/dispose signatures stay unchanged.
// Extend the existing factory with:
// onInspection: (snapshot: InspectionSnapshot) => void
// as the fourth required parameter.
```

The function declaration above is a contract, not a stub to commit. Implement it with the concrete rules below.

- [ ] Define the fixed asset mapping and local surface anchors. These coordinates were derived from ray/triangle intersections on the current ignored GLB, not guessed from group centers. Keep them attached to their named node so ancestor transforms are applied correctly.

```ts
const TARGETS = {
  armor: { node: 'armorGroup', anchor: [-0.01633135, 2.58094070, 0] },
  head: { node: 'headGroup', anchor: [-0.62353848, 0.16785683, 0.51888366] },
  tailClub: { node: 'clubMesh', anchor: [0, 0, 0.56000000] }
} as const;
```

Use `model.getObjectByName()` and traverse each found target's descendants, mapping each `Mesh` to its `AnatomyId`. Flatten all model meshes once for picking/occlusion; do not include the plinth. A missing/meshless target is unavailable, not a viewer-wide error. The planned GLB has all three, so unavailable targets fail final acceptance even though runtime degrades gracefully. If the first-exhibit asset changes, derive replacement local anchors with the same geometry procedure (bounds-center ray from +Y for armor; +Z for head/club, then `target.worldToLocal(hit.point)`) and visually verify before accepting; never substitute body centers when a ray misses.

- [ ] Implement one `Raycaster` and reusable vector/intersection buffers. For picking, normalize pointer coordinates using `canvas.getBoundingClientRect()` and call `setFromCamera()`; inspect the nearest hit against ALL model meshes first:

```ts
hits.length = 0;
raycaster.setFromCamera(pointerNdc, camera);
raycaster.intersectObjects(modelMeshes, false, hits);
const hit = hits[0];
const picked: AnatomyHit = hit ? meshRegion.get(hit.object) : null;
// meshRegion.get() is undefined for a visible non-selectable body surface.
// Only input.select(picked) returning true changes highlight/selection.
```

Do not raycast just the three targets: that selects through intervening body geometry. Compute current projections before marker hit testing, then test visible 44px square marker hit areas in reverse DOM stacking order (`tailClub`, `head`, `armor`). A visible marker wins over surface picking; otherwise use the snippet above. Hidden markers have no hit area. Marker visuals use this identical order in Task 3.

- [ ] Implement pointer handling without fighting OrbitControls. Markers will be pointer-transparent, so marker gestures reach the same canvas as surface gestures. Listen on `window` in capture phase for pointer down/move/up/cancel, but start tracking only primary-button canvas gestures or additional pointers while an inspection gesture is already active. Restrict a click activation to a sequence started on the canvas. Use `input.down/move/up/cancel`, do not call `preventDefault`, and do not add a competing pointer capture. On release, require coordinates within the canvas AND `document.elementFromPoint()` to resolve to the canvas; a note/UI overlay or release outside must not select. `window` blur and hidden document visibility reset the gesture. Remove every listener on disposal. Secondary mouse buttons cannot activate picking. Track all fingers until the multi-pointer sequence ends, even if one finger begins over nearby UI.

- [ ] Project node-local surface anchors after matrix updates. Cache the three world anchors for this resting model; update them if model transforms change. For each projected point, check finite coordinates and clip-space x/y/z in [-1, 1]. Hide points behind/outside the camera instead of clamping a marker to the edge. Occlusion must use an orthographic ray through the projected point, not a perspective ray from `camera.position` toward the point:

```ts
ndc.copy(worldAnchor).project(camera);
raycaster.setFromCamera(pointerNdc.set(ndc.x, ndc.y), camera);
const anchorDistance = delta.copy(worldAnchor).sub(raycaster.ray.origin)
  .dot(raycaster.ray.direction);
hits.length = 0;
raycaster.intersectObjects(modelMeshes, false, hits);
const occluded = hits.length > 0 && hits[0].distance < anchorDistance - epsilon;
const x = (ndc.x + 1) * width / 2;
const y = (1 - ndc.y) * height / 2;
```

Use `epsilon = modelBounds.getSize(sizeVector).length() * 1e-5` as a numeric surface tolerance, not a gap large enough to see through armor. `available` is independent of `visible`. Keep hidden projection coordinates finite; leader rendering must require `visible`. A zero-size viewport publishes hidden regions and performs no raycasts.

- [ ] Keep projection work within the existing render loop. The inspection controller compares cached `camera.matrixWorld`, `camera.projectionMatrix`, model transform, and viewport dimensions and skips recomputation when unchanged. `select()` forces a snapshot when selection changes. Publish fresh snapshot objects only when primitive values actually change; never mutate previously published snapshots behind Svelte's back. Reuse ray/vector arrays on unchanged frames. Update the camera matrix before projecting, because keyboard actions and damping must be reflected in the same frame.

- [ ] Implement highlighting by cloning only the selected meshes' material(s), retaining their exact original material references. For this GLB's standard materials, blend base color toward amber, rather than replacing geometry, changing lights, or adding glow:

```ts
const copy = original.clone();
if (copy instanceof MeshStandardMaterial) {
  copy.color.lerp(amberColor, 0.35);
}
```

Handle material arrays as well as a single material. Reuse cloned highlight materials for shared originals within the currently selected region. On switch/clear restore every original mesh material reference, dispose the unique owned clones, and clear the clone cache. Do not dispose shared textures when disposing a cloned material. Same-ID selection is a no-op. Before viewer-wide resource disposal, restore originals and release clones so existing `disposeResources()` sees all original model resources and no detached replacements are leaked.

- [ ] Integrate in `specimen-viewer.ts`: hold `let inspection: AnatomyInspection | undefined`, create it only after the GLB bounds validation and scene setup succeed, then emit ready. `selectAnatomy` guards `disposed` and `state === 'ready'`; the controller also rejects unavailable IDs. Call inspection update after `controls.update()`/camera matrix update in `render()`. Keep zoom/orbit/reset independent of selected state. Call update on zero-sized resize to hide projections even when the render function returns early.

- [ ] Update `ViewerHandle`, its object initializer, and the single Svelte factory call together. In Svelte add `let inspection = $state<InspectionSnapshot | null>(null)` and use a guarded fourth callback to assign it. Reset that snapshot whenever state is not ready; do not change existing async mount guards. On fail, the existing state callback clears UI BEFORE scene disposal. On ordinary unmount, Svelte clears its own UI and controller disposal sends no callbacks. Dispose inspection BEFORE `controls.dispose()` and `disposeResources()`; clear its instance. Late GLB completion retains the existing early-return disposal path and never constructs inspection.

**Observable deliverable:** The loaded viewer exposes all three available regions and consistent projection/selection snapshots without changing camera, initial framing, or failure cleanup. The actual UI and integrated smoke in Tasks 3–4 prove the controller in the real scene; no permanent synthetic rendering harness.

## Task 3: Deliver localized, accessible anatomy UI

**Files:** Modify `src/lib/specimens/ankylosaurus.ts`, `messages/en.json`, `messages/de.json`, `src/routes/specimens/ankylosaurus/+page.svelte`, `src/lib/viewer/SpecimenViewer.svelte`, `src/app.css`.

**Consumes:** `InspectionSnapshot`, `ViewerHandle.selectAnatomy`, `ANATOMY_IDS`, and the approved EN/DE copy.

**Produces:** A visible, complete end-user inspection feature; no new exported application services.

- [ ] Define `AnatomyNote = { label: string; heading: string; body: string }` and `AnatomyText = Record<AnatomyId, AnatomyNote>` in the existing specimen content file using a type-only import of `AnatomyId`. Add `anatomy` to both current language objects with these values; leave existing URL validation/description fields intact:

```ts
// English anatomy
{
  armor: {
    label: 'Armor', heading: 'Bone-built armor',
    body: 'Bony plates called osteoderms formed within the skin. They probably helped protect Ankylosaurus like a suit of armor.'
  },
  head: {
    label: 'Head', heading: 'Built for eating plants',
    body: 'Ankylosaurus had a beak at the front of its mouth and small teeth behind it. Despite its tough appearance, it was a plant-eater.'
  },
  tailClub: {
    label: 'Tail club', heading: 'A powerful defense',
    body: 'A large bony knob formed the end of the tail. Scientists think Ankylosaurus could swing it to strike an attacker.'
  }
} satisfies AnatomyText
// German anatomy
{
  armor: {
    label: 'Panzerung', heading: 'Ein Panzer aus Knochen',
    body: 'Knochenplatten, die Osteoderme heißen, bildeten sich in der Haut. Sie schützten Ankylosaurus vermutlich wie eine Rüstung.'
  },
  head: {
    label: 'Kopf', heading: 'Für Pflanzenkost gebaut',
    body: 'Ankylosaurus hatte vorne am Maul einen Schnabel und dahinter kleine Zähne. Trotz seines wehrhaften Aussehens war er ein Pflanzenfresser.'
  },
  tailClub: {
    label: 'Schwanzkeule', heading: 'Eine starke Verteidigung',
    body: 'Am Schwanzende saß eine große Verdickung aus Knochen. Forschende vermuten, dass Ankylosaurus sie schwingen konnte, um einen Angreifer zu treffen.'
  }
} satisfies AnatomyText
```

Pass `anatomy={text.anatomy}` from the existing page to `SpecimenViewer`; add the corresponding required prop using a type-only `AnatomyText` import. Do not import the environment-reading specimen module as runtime code into the viewer merely for this type.

- [ ] Add these interface translations using the existing Paraglide source convention, not hand-written generated output:

| Key | English | German |
| --- | --- | --- |
| `inspectAnatomy` | Inspect anatomy | Körperteile erkunden |
| `closeNote` | Close note | Notiz schließen |
| `anatomyUnavailable` | Inspection unavailable: {region}. | Untersuchung nicht verfügbar: {region}. |
| `instructions` (replace) | Drag to rotate. Scroll or pinch to zoom. Select a marker, an anatomical part, or a named anatomy button to learn more. Press Escape in the viewer to close a note. | Ziehen zum Drehen. Scrollen oder mit zwei Fingern zoomen. Wähle eine Markierung, einen Körperteil oder die entsprechende Schaltfläche, um mehr zu erfahren. Mit Escape in der Ansicht schließt du eine Notiz. |

For each ready-but-unavailable projection, call `m.anatomyUnavailable({ region: anatomy[region.id].label })` in readable status text. All anatomy buttons remain disabled while loading/error/unavailable; a missing target disables only its own button. Do not claim absence of nodes during initial loading.

- [ ] Keep the note and all controls outside the canvas picking surface. Wrap `.viewer-stage` and the single note in a positioned `.inspection-frame`. Markers live in the stage with `pointer-events: none` and `aria-hidden="true"`; do not make them focusable buttons with invisible keyboard stops. The canvas handles their pixel hit testing in Task 2. Render only `visible` markers, with exactly the same 44px square size and stacking order as picking. A small dot inside that area supplies the visible marker. Add selected styling without changing target geometry.

- [ ] Add the stable named control group and expose pressed state. Use the existing viewer controls' native-button style; keep button references keyed by ID for focus restoration:

```svelte
<div class="anatomy-controls" role="group" aria-label={m.inspectAnatomy()}>
  {#each ANATOMY_IDS as region}
    <button
      type="button"
      disabled={state !== 'ready' || !inspection?.regions.find((p) => p.id === region)?.available}
      aria-pressed={inspection?.selected === region}
      onclick={() => viewer?.selectAnatomy(region)}
    >{anatomy[region].label}</button>
  {/each}
</div>
```

Add DOM refs to these same three buttons; do not query by translated text. Keep all existing zoom/orbit/reset buttons and language behavior unchanged.

- [ ] Render one non-modal note only when the snapshot has a selected ID. Derive text from `anatomy[selected]`; do not maintain a second selected state. Include a heading, body, and visible localized Close button. Use one persistent visually hidden `aria-live="polite" aria-atomic="true"` text region outside the moving note; its string is only the selected heading plus body, empty after dismissal. Do not put position/visibility or the entire viewer inside a live region. Same-ID snapshots must not change the announcement text or restart the note transition.

- [ ] Implement note dismissal/focus and scoped Escape. A section-level `keydown` handler processes Escape only when a note exists; a focusable viewer section (`tabindex="-1"`) also allows canvas pointer interaction to set focus inside the viewer using `focus({ preventScroll: true })`, without adding a tab stop or stealing focus after keyboard selection. When focus is inside the disappearing note, focus its corresponding persistent anatomy button before clearing. Otherwise preserve focus. Close/empty-space/Escape share the same clear action; pointer selection inside the controller notifies Svelte, which must also restore focus if a focused note is removed. Never trap focus, focus the note automatically, or install a document-wide Escape handler.

- [ ] Measure the note, frame, and stage with one component-owned `ResizeObserver` and Svelte DOM-update scheduling (`tick`) after a selected-ID change. No second animation loop. Keep remembered note placement as UI-only coordinates, not anatomy selection state. In wide layouts, choose the side of the anchor with more room, offset by 20px and clamp to a 12px inset:

```ts
const clamp = (value: number, low: number, high: number) =>
  Math.max(low, Math.min(value, high));
const right = anchorX < stageWidth / 2;
const x = clamp(right ? anchorX + 20 : anchorX - noteWidth - 20,
  12, stageWidth - noteWidth - 12);
const y = clamp(anchorY - noteHeight / 2, 12, stageHeight - noteHeight - 12);
```

Only use this branch when the measured note fits inside the stage with its insets. When the selected anchor is hidden, preserve the last valid position for that selected ID; if none exists, use the bottom edge position (`x = 12`, `y = stageHeight - noteHeight - 12`). Re-clamp on resize even while hidden. On selecting a different region, reset its remembered placement rather than reusing another region's anchor. If viewport width is at most `48rem`, or the measured note cannot fit, dock this SAME note below the stage in normal flow inside `.inspection-frame`. This creates the reserved edge area and allows text enlargement to increase total exhibit height; controls/status stay below the frame and cannot be covered. Return to floating only when there is sufficient room. Do not duplicate the note for mobile.

- [ ] Draw one pointer-transparent SVG leader in `.inspection-frame`, above the canvas but below the note, only when the selected region's projection is visible. The frame includes a docked note's normal-flow height, so a leader can reach its edge without crossing controls. Both endpoints must be in frame-relative CSS pixels; do not mix device pixels or page coordinates. End the line at the nearest point on the note rectangle, using coordinate clamping; suppress a zero-length line if the anchor falls underneath the note. Projection changes move the line/note, not the text live region. Hide the line immediately when the anchor is occluded/offscreen.

- [ ] Add focused CSS in `src/app.css`, continuing existing variables. Override the global Newsreader heading rule if necessary so note headings remain Source Sans 3. Use wrapping controls, a note max-width around `20rem`, a width no greater than `calc(100% - 24px)`, and no fixed text height. Keep a minimum 44px Close target, `overflow-wrap: anywhere`, visible focus outlines, and non-color selection via button border/pressed semantics. `.inspection-frame { position: relative; }`, marker/SVG layers use `pointer-events: none`, and the note uses normal pointer events. Give floating notes a 140ms opacity/4px lift entry; reduced motion disables it. Animate only a newly mounted note, not every snapshot or position update. Ensure `.viewer-stage canvas` remains the real hit target even under marker/SVG pixels.

- [ ] Disconnect the note observer and cancel/guard pending `tick` work on unmount. Keep the existing synchronous `onMount` cleanup around asynchronous viewer imports. Clear note, announcements, and projected overlays when state ceases to be ready; no lifecycle callback may revive them afterward.

If a failure removes a focused note while anatomy buttons become disabled, move focus to the viewer section instead of a disabled button. Normal Close/Escape still restores the corresponding anatomy button. Apply the same reduced-motion-aware entry treatment to a docked note; changing layout or projection must not remount it.

**Observable deliverable:** Both localized static exhibit pages offer complete marker/surface/keyboard inspection, with one readable, dismissible note and no change to ordinary camera exploration.

## Task 4: Verify the complete feature and document observed behavior

**Files:** Verify all files above. After smoke proof update `README.md` and `fieldbook-3d-context.md`; remove any temporary smoke/fault-injection helpers. No extra permanent test framework or screenshots/media in Git.

**Consumes:** Integrated feature, ignored local model, existing media server and static build.

**Produces:** Observed checks/browser evidence and a clear handoff distinguishing this milestone from Field Study.

- [ ] After integration run these existing/new commands once, in order. Correct actual failures and rerun only affected checks. Expected results below are acceptance targets, not results observed during planning.

```sh
npm run check
npm run check:camera
npm run check:anatomy
npm run build -- --mode development
```

Expected: zero Svelte/type errors, existing camera assertions pass, anatomy gesture/selection assertions pass, and both localized specimen documents are generated. Do not pin incidental message text or suppress warnings. Development-mode output is local-media smoke, not production deployment.

- [ ] Start `npm run media:dev` if its owner has not already provided a usable service. Serve `build/` with an independent static HTTP server (for example `python -m http.server 5195 --bind 127.0.0.1 --directory build` when Python is available), not only the SvelteKit dev server. Use a free port if the other agent owns that one; never stop another agent's service. Open the real static pages in Chromium and capture visual evidence for these scenarios:

| Scenario | Action and required observation |
| --- | --- |
| Routes/locale | Directly load and refresh `/en/specimens/ankylosaurus/` and `/de/specimens/ankylosaurus/`; verify names, notes, errors, controls, `lang`, and full-document locale switch clearing selection |
| Three actual regions | For each ID, select the visible surface, marker, and named button; ensure grouped head/armor descendants map correctly and selected material changes do not tint unrelated meshes |
| Same ID/switch | Select same ID twice (no close, camera motion, repeated entry animation, or text announcement); switch across all three; clear and inspect restored original materials |
| Occlusion | Orbit each anchor behind the model and back; marker/leader hide/restore; clicking nearer unselectable body cannot select the far-side target |
| Hidden selection | Select a hidden region via its native button; camera stays fixed, note remains readable, leader stays absent, and no through-body highlight appears |
| Offscreen anchor | Open note then zoom/orbit until its anchor leaves the camera view; note remains within viewer, leader hides; bring it back and verify reconnection |
| Empty vs body/UI | Click background and plinth to clear; click non-target body to preserve; zoom/orbit/reset and note text interaction preserve selection |
| Gestures | Real pointer drag past 6px then back, pinch with staggered releases, canceled pointer, release outside/over note, and subsequent deliberate tap; inspect that no stale gesture clears/selects |
| Keyboard/focus | Tab through named buttons and Close, inspect pressed/focus states, dismiss with Escape from viewer/note, keep focus after Close, and verify Escape elsewhere is not intercepted |
| Announcements | Accessibility inspection or screen reader: one selected heading/body announcement, no repeated live text changes while orbiting, no hidden-marker tab stops |
| Layout | Observe 1365x768, 1024x768, 390x844 in both languages, plus 200% text enlargement and resize with note open; no horizontal overflow, clipped Close target, or obscured controls |
| Motion | Emulate reduced motion; no note fade/lift or existing control damping; normal mode has entry motion only, no bobbing |
| Failure | Block model request and separately lose/disable WebGL; all anatomy UI clears/disables, existing localized status and navigation remain usable |
| Missing target | Use temporary browser-loaded GLB bytes with one node name changed; only its button disables and localized region-specific message appears; other two still inspect normally |
| Lifetime | Navigate away during delayed GLB loading; no late canvas/markers/handlers. Repeated mount/dispose and context loss release highlight clones exactly once and restore originals before original-material disposal |

When injecting missing-target data, modify the in-memory GLB response only; do not overwrite the production/local asset. For gesture cancellation use a temporary browser harness that dispatches the cancel to a genuinely active interaction; for WebGL loss use `WEBGL_lose_context` where available. For delayed load/disposal, exercise both page navigation and an instrumented mount/dispose before completion so page teardown alone does not conceal a leak. Remove instrumentation afterward.

- [ ] Verify the geometry-derived anchors visually: head dot on visible head skin, armor dot on a visible dorsal plate, club dot on the club. If a marker self-occludes when its actual anchor is visible, correct its local point or numerical tolerance and repeat the occlusion scenario; do not exempt the entire region from occlusion. A rear surface of the same region can legitimately hide its anchor.

- [ ] Inspect static output/staged paths for forbidden media and unrelated first-agent changes. Keep generated Paraglide output ignored, preserve media licenses/provenance, and do not claim physical-device testing from emulation. The permanent Node check does not prove raycasting, appearance, focus, or disposal; record the real browser observations separately.

- [ ] Update README delivered scope (currently says anatomy is not implemented), anatomy interaction instructions, `check:anatomy`, and a dated section with only exercised results/limits. Update context current priorities/status to reflect delivered anatomy while preserving the full later guided-study requirements. Keep scientific citations in the approved spec and link it rather than inventing a new research-content system. Document unavailable physical-device/screen-reader checks honestly if not performed.

- [ ] Remove temporary harnesses, close inspection tabs, and stop only services started for this work. Commit only this feature's application/check/doc changes after successful verification; never include the GLB, supplied example, generated files, or unrelated agent work.

## Coverage and completion gate

| Approved spec area | Implemented/verified by |
| --- | --- |
| Selection, idempotence, empty/body distinction, 6px/multi-pointer/cancellation | Task 1; Task 2 pointer/picking integration; Task 4 gesture matrix |
| Occlusion, surface anchors, nearest-hit picking | Task 2 actual asset/rays; Task 4 visual occlusion checks |
| Highlight restoration, hidden/offscreen selected note | Tasks 2–3; Task 4 material and hidden-selection checks |
| EN/DE copy, SSR/browser boundary, URL reload | Task 3 content/UI; Task 4 routes |
| Focus, named controls, announcements, readable targets | Task 3 accessibility; Task 4 keyboard/accessibility checks |
| Narrow layout, resize, reduced motion | Task 3 measured/docked placement; Task 4 viewport/text/motion matrix |
| Missing target, load/context failure, late disposal | Task 2 controller/viewer lifetime; Task 3 status; Task 4 fault injection |
| Small permanent regression, no framework/media, truthful docs | Tasks 1 and 4 |

Do not call this milestone complete if any normal-asset target is unavailable, picking selects through the body, a gesture clears the note, UI covers controls, or a hidden anchor removes the note. Do not call the complete Field Study prototype finished. Execution should begin only after the first-exhibit owner releases the shared viewer files; this plan itself changes no application behavior.

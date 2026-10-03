# Ankylosaurus anatomy inspection

Status: interaction direction and copy length/tone approved in discussion; completed specification proposed for user review. This document does not authorize implementation. Write the implementation plan only after review.

## Goal and milestone boundary

Add three inspectable regions to the first explorable Ankylosaurus exhibit: armor, head, and tail club. Connect the visible anatomy to one memorable educational idea without moving the camera or obscuring the specimen with a large information panel.

`fieldbook-3d-context.md` remains the source of truth for the complete prototype. This milestone follows the first exhibit; it does not implement the guided study or cancel later requirements.

Planning can proceed while the first-exhibit agent works. Do not modify that agent's application, asset, configuration, or documentation files during this design task. Integrate only after its viewer and exported asset are delivered. Reconcile exact interfaces against the delivered code before writing the implementation plan, rather than requiring the first agent to implement a speculative API.

### Evidence and dependencies

- The first-exhibit spec defines Svelte ownership of DOM/localized UI and a browser-only Three.js module owning the scene, camera, controls, loading, and disposal.
- Its export contract preserves `armorGroup`, `headGroup`, and `clubMesh`. These are expected asset nodes, not proof that the currently exported GLB has been inspected for this milestone.
- The current `src/lib/specimens/ankylosaurus.ts` already separates English/German specimen text from interface messages. Extend that content rather than creating a second content system.
- The handoff's initial absence of an application is historical. This design does not claim the concurrently implemented viewer is complete or verified.
- Model accuracy and media publication rights remain subject to the first exhibit's provenance requirements. Anatomy notes are not validation of the reconstruction.

## Agreed interaction

### Selection and gestures

1. A visible marker or visible anatomical surface selects its region. Equivalent named native controls select Armor, Head, or Tail club without requiring a pointer or a particular viewing angle.
2. Only one region is selected at a time. Selecting another replaces the note and highlight. Selecting the same region leaves its existing note open; it does not toggle or replay the opening animation.
3. Selection never moves the camera, changes zoom, or interrupts exploration.
4. Clicking/tapping empty viewer space dismisses selection. The ground plinth counts as empty space for this purpose. Clicking non-selectable specimen surfaces leaves selection unchanged.
5. Close and Escape dismiss the note. Escape applies within the viewer's controls/note/interaction area, not as a document-wide shortcut that intercepts unrelated UI.
6. Orbit drags, pinch gestures, canceled pointers, and releases outside the viewer never select or dismiss. Classify the entire gesture, not only its release position. A maximum displacement over 6 CSS pixels from pointer-down cancels click selection; any multi-pointer gesture cancels selection until all its pointers end. A drag returning to its start is still a drag.
7. Buttons, the note, and other UI are excluded from scene picking. Zoom, orbit, and reset controls preserve selection. Language links retain the first milestone's full document navigation and begin the new page with no selection; no persistence is added.

### Occlusion and surface picking

- Hide a marker when the specimen blocks its anatomy anchor. Also hide it when its anchor is outside the camera view or behind the camera.
- Hidden markers are not interactive. Do not enlarge invisible targets through the specimen.
- Surface picking considers the nearest visible specimen intersection across the whole animal. Map that hit to one of the three regions only if it belongs to that region. A nearer non-selectable body surface blocks a hidden selectable region.
- Markers represent a chosen surface point on each region, not its volume center. Verify anchors against the delivered GLB so a region does not incorrectly occlude its own marker. A small surface tolerance must not reveal genuinely hidden targets.
- Permanent named anatomy controls remain available when a marker is hidden, allowing keyboard and other users to select any available region without camera assistance.

### Selected region and note

- Apply restrained amber emphasis to the selected region only. Keep other specimen materials and exhibit lighting unchanged; no dimming, pulsing, glow effect, or x-ray rendering.
- Restore original appearance when switching or clearing selection. Shared source materials must not tint unselected meshes, and highlight-owned resources must be released on disposal.
- Show one compact note containing the localized heading, explanation, and a clearly named close button. Use a thin leader line from the anatomy anchor toward the note.
- The anchor follows the specimen through orbit, zoom, reset, and resize. Text stays screen-facing and readable; the note remains within the viewer's usable area and avoids essential controls.
- If the selected anchor becomes occluded or leaves the camera view, keep the note and selection but hide the leader line. Restore the line when the anchor becomes visible again. Never draw a misleading line through the body or toward an offscreen point.
- Keep the note in its last valid position while its anchor is hidden. If first selected from a named control while hidden, use the same edge position used for the narrow-screen note. Resize still clamps/repositions it.
- Use a short fade and slight lift on opening, not continuous bobbing. Reduced motion removes this animation. Camera updates must not replay it.

## Presentation and accessibility

Continue the existing museum-fieldbook palette, typography, and layout. No new visual theme or component library.

- Use Source Sans 3 for labels and notes, readable text of at least 16 CSS pixels, visible focus, and interactive targets at least 44 by 44 CSS pixels. The marker's visible dot may be smaller than its hit area.
- Provide a compact, visibly labeled set of native anatomy buttons near the existing peripheral controls: Armor / Head / Tail club. Use `aria-pressed` to expose selection without relying on color.
- Keep these named buttons as the stable keyboard and assistive-technology path. Projected markers are pointer equivalents, excluded from the tab order and accessibility tree to avoid duplicate controls and focus disappearing with occlusion.
- Announce a newly selected note's heading and text politely once, not on projection updates. The note is non-modal; do not trap focus or automatically move it after selection. Its close button remains keyboard-accessible.
- When closing from inside the note, return focus to the corresponding persistent anatomy button. If dismissal removes no focused element, do not move focus unnecessarily.
- On narrow screens, place the compact note in a reserved edge area of the viewer rather than letting a freely floating box cover essential controls. Allow the exhibit to grow vertically for wrapped German text and browser text enlargement; no horizontal overflow or clipped close button. This remains the same single note, not a separate content panel or mobile mode.
- If marker hit areas overlap, only the visually topmost marker receives the action. The named buttons provide an unambiguous alternative for every region.
- Keep the existing stylized-reconstruction notice. Do not add claims that the teeth, plate arrangement, or inferred behavior are proven by this particular model.

## Localized educational content

Stable region IDs: `armor`, `head`, `tailClub`. IDs do not change with language. Anatomy headings and prose belong with specimen content; shared interface messages such as Close note belong in the existing interface translation sources.

The discussion approved the short, two-sentence tone. Source review led to two small wording adjustments: qualify the protective role of armor, and remove the unnecessary broad-beak/cropping detail. The final proposed copy is below.

### Armor / Panzerung

**English heading:** Bone-built armor

Bony plates called osteoderms formed within the skin. They probably helped protect Ankylosaurus like a suit of armor.

**German heading:** Ein Panzer aus Knochen

Knochenplatten, die Osteoderme heißen, bildeten sich in der Haut. Sie schützten Ankylosaurus vermutlich wie eine Rüstung.

### Head / Kopf

**English heading:** Built for eating plants

Ankylosaurus had a beak at the front of its mouth and small teeth behind it. Despite its tough appearance, it was a plant-eater.

**German heading:** Für Pflanzenkost gebaut

Ankylosaurus hatte vorne am Maul einen Schnabel und dahinter kleine Zähne. Trotz seines wehrhaften Aussehens war er ein Pflanzenfresser.

### Tail club / Schwanzkeule

**English heading:** A powerful defense

A large bony knob formed the end of the tail. Scientists think Ankylosaurus could swing it to strike an attacker.

**German heading:** Eine starke Verteidigung

Am Schwanzende saß eine große Verdickung aus Knochen. Forschende vermuten, dass Ankylosaurus sie schwingen konnte, um einen Angreifer zu treffen.

### Evidence and limits

Sources consulted on 2026-10-03:

1. [Natural History Museum: Ankylosaurus](https://www.nhm.ac.uk/discover/dino-directory/Ankylosaurus.html). Supports plant diet, a front beak with teeth, bony body plates, a heavy tail club, and probable defensive side-to-side swinging. Also explicitly notes that no complete skeleton is known and the back armor arrangement is uncertain.
2. [Natural History Museum: Ankylosaurs — the dinosaurs with built-in armour](https://www.nhm.ac.uk/discover/ankylosaurs-the-dinosaurs-with-built-in-armour.html). Includes direct explanation from museum researcher Susannah Maidment: armor consists of bone generally embedded in skin, small teeth are characteristic of the group, and protection is a probable rather than exclusive function. Identifies osteoderms and discusses evidence from Zuul for combat between individuals.

The notes use paraphrased project-owned text, not copied source prose. Armor protection and tail use are qualified in both languages. The tail note describes a possible defensive use, not the only function or a directly observed behavior. Do not transfer evidence of fighting between Zuul individuals into a claim that this has been demonstrated specifically for Ankylosaurus. No bite forces, measurements, exact armor placement, or certainty about behavior are asserted.

## Minimal implementation direction

This defines responsibilities, not a new mandatory exported API. Confirm concrete signatures and paths against the first agent's delivered code when writing the implementation plan.

- Extend the existing Three.js viewer with target lookup, visible-surface picking, projection/occlusion, region highlighting, and the selected-region state. Use its existing controls and render/update lifetime, not a second scene or animation loop.
- Extend the existing Svelte viewer boundary with the three named controls, marker overlay, and one localized note. Forward user selection/clear actions to the viewer; derive displayed selection from viewer notifications rather than maintaining two independent selection states.
- Publish the small projection/visibility data needed by the DOM; do not expose meshes or materials to Svelte. Recompute for camera, model, or viewport changes, including control damping. Avoid unchanged DOM-state notifications and per-frame allocation where existing reusable vectors/results suffice.
- Keep a fixed mapping from three stable IDs to the delivered anatomy nodes and calibrated local anchors. For picking, include descendants of grouped targets. Do not infer anatomical regions from colors or arbitrary node-name substrings.
- Use native Three.js raycasting and ordinary DOM/CSS placement. Three regions do not need a picking dependency, spatial indexing package, annotation engine, global store, specimen registry, or plugin system.
- If the actual asset cannot identify one of these regions reliably, correct the asset mapping/export before accepting the milestone; do not silently substitute an unrelated surface.
- Reuse the existing localized specimen content and Paraglide message conventions. Preserve SSR text, browser-only Three.js initialization, static routes, and externally hosted media policy.

## Loading, failure, and lifetime

- Before model readiness, show no markers or note; named anatomy controls are disabled. Existing viewer status remains authoritative.
- If an expected anatomy node is missing, preserve ordinary exploration, disable that region's button, and show a localized message identifying the unavailable region. Available regions still work. This is graceful error handling, not acceptance of an incomplete three-region deliverable.
- Model failure or unavailable/lost WebGL clears inspection and disables its controls while retaining the existing localized status and readable specimen content.
- Unmount/navigation removes inspection handlers and any observers, clears UI notifications, restores/releases owned highlight resources, and reuses the viewer's existing disposal path. Late model completion must not register new inspection listeners or update detached UI.
- Do not add automatic retry, stored inspection state, or a fallback fake model.

## Acceptance and verification

Implementation must exercise the real static app after integration; this design task has not run these scenarios.

1. On both English and German routes, all three visible surfaces and all three markers select the correct note and region. Descendant meshes of grouped anatomy work. Non-selected regions keep their original appearance; switching and clearing leave no residual tint.
2. Orbit each anchor behind the specimen and back: its marker hides/restores, and a click on the nearer non-selectable body does not select through it. Verify actual rendered output, not just projected coordinates.
3. Open a note, then hide its anchor by orbit and by moving it outside the camera view through zoom: text remains readable, leader hides/restores, selection persists. Select a hidden region from its named control and confirm no camera movement or x-ray highlight.
4. Confirm same-region selection stays open; another selection replaces it; empty space and plinth dismiss; non-selectable body and UI controls do not. Escape and Close behave as specified.
5. Exercise mouse drag, touch drag, drag returning near its starting point, pinch, pointer cancellation, and release outside the viewer: none triggers selection/dismissal. A deliberate click/tap still works afterward.
6. Use keyboard-only navigation to select all three targets, reach/activate Close, dismiss with Escape, and continue exploring. Check visible focus, pressed state, return focus, and that hidden markers introduce no focus stops. Inspect accessibility announcements to ensure movement does not repeatedly announce note text.
7. Observe desktop 1365x768, tablet 1024x768, and phone 390x844, both languages, and 200% text enlargement. Notes stay readable with no horizontal overflow, clipped close button, or blocked essential controls. Exercise resize while a note is open and reduced motion.
8. Exercise missing-target data, failed model loading, WebGL loss/unavailability, and navigation during delayed loading. Confirm readable errors, correct disabled controls, and no late overlay/listener attachment or uncaught exception. Use temporary fault-injection harnesses, not altered production assets.
9. Run the delivered project's existing type, camera, and static-build checks once after integration. Add one small framework-free regression check for the consumer-visible selection/gesture transitions: canceled/multi-pointer/drag gestures cannot select or clear; a subsequent deliberate activation can; same-target selection is idempotent. Do not add a test framework or tests of copied message text or internal forwarding.
10. Record only observed checks and browser scenarios in the implementation delivery documentation. Distinguish touch emulation from physical-device testing. Remove temporary fault-injection/smoke scaffolds; preserve the small permanent behavior check.

## Explicit exclusions

No Field Study, narration, captions, playback timeline, pause/resume integration, measurements, camera assistance, anatomical cutaways, animation, additional regions, quizzes, collection, saved selection, asset hosting changes, model redesign, or generic annotation/presentation engine. Later paused-study inspection should reuse this interaction, but no study scaffolding is justified now.

## Review gate and next step

Review this specification, including the proposed accessibility, gesture, error-handling details and the small source-driven wording changes. After approval and once the first exhibit's actual viewer contract is available, write a separate implementation plan against that code. Do not start anatomy implementation from this document alone.

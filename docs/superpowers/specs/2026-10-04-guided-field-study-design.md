# Meet Ankylosaurus — guided Field Study

Status: the user approved the chapter outline, playback behavior, and integration/media direction, then requested this specification on 2026-10-04. The written specification and narration scripts await user review. This is not implementation approval or evidence of a working study.

## Goal and milestone boundary

Give a curious visitor a complete, roughly 50–60 second introduction to Ankylosaurus inside the existing exhibit. The memorable takeaway is a large plant-eater with remarkable bony armor, not a hunting dinosaur. Use calm museum narration, composed camera views, a human-scale comparison, anatomy highlights, and a concise time/location graphic.

The working audience is ages 9–12 without making the experience childish or excluding adults. Explain scientific terms through their meaning; distinguish evidence, estimates, and reconstruction. No quiz, rewards, mascot, or compulsory viewing.

`fieldbook-3d-context.md` remains the source of truth for the full prototype. This milestone delivers its first hard-coded narrated study, including scale and geological/geographic context; it does not stop at a playback scaffold. Explore and Field Study share one specimen, scene, and page.

### Current evidence and dependencies

- The first exhibit is delivered. The project context now also records anatomy inspection as delivered on 2026-10-04. Those are prior delivery reports, not verification performed by this design task.
- Existing `specimen-viewer.ts` owns Three.js and exposes exploration and anatomy actions. `ankylosaurus.ts` contains English/German specimen prose and the fixed `armor`, `head`, and `tailClub` identities. Reuse those responsibilities and identities.
- During this discussion, the local `media-dev/` listing contained `ankylosaurus.glb`, but no narration recordings. Recordings, voice rights/provenance, and recording-derived timings are implementation acceptance prerequisites.
- The stylized model's scientific accuracy and publication rights remain unresolved. A successful rendered study does not resolve them.
- Do not modify another agent's application, asset, configuration, or delivery-documentation files during this specification task. Reconcile concrete viewer interfaces against the delivered anatomy code when writing the implementation plan. Do not require a speculative interface from that agent.

## Approved experience

The study is titled **Meet Ankylosaurus** / **Ankylosaurus kennenlernen**. It opens from a visible, localized Start field study action in the exhibit and returns to exploration on completion or Exit.

Use one polished, specimen-specific sequence. Keep the existing warm-charcoal, olive, stone, bone-text, and restrained amber palette, Newsreader headings, and Source Sans 3 controls/captions. Playing is more focused and cinematic than exploration, not a glowing science-fiction HUD.

### Chapters and visual treatment

Stable chapter IDs are `meet`, `scale`, `armor`, and `world`. Labels are localized. The durations below are pacing targets, not production timestamps. Each final recording must fit the agreed 30–60 second prototype range; aim near its upper end rather than rushing the narration.

| Chapter | Target | Learning point | Presentation |
|---|---|---|---|
| Meet Ankylosaurus / Ankylosaurus kennenlernen | about 10 s | A formidable-looking plant-eater | Settle into a three-quarter hero view. Show the name; frame the whole animal. |
| A sense of scale / Ein Gefühl für die Größe | about 12 s | Adult length is an estimate, roughly 8 m | Pull back to frame the animal and a neutral human silhouette. Show a head-to-tail length guide labeled as estimated. |
| Built-in armor / Ein eingebauter Panzer | about 20 s | Bone in the skin and a tail club probably helped protect it | Frame the armor, then the tail club. Apply restrained region emphasis and modest dimming of other specimen surfaces. |
| Its ancient world / Seine Welt vor langer Zeit | about 12 s | North America, Late Cretaceous, around 68–66 million years ago | Return to a wider view. Show localized North America and Late Cretaceous labels with a small time band marking 68–66 million years ago. Finish and restore exploration. |

Each change serves the narration. No constant model rotation, walking cycle, attack animation, anatomy cutaway, or background music. Labels support the explanation; they do not duplicate full paragraphs over the specimen. Captions carry the spoken text.

The world chapter is the prototype's concise geological/geographic context scene in the same exhibit. The time band and location label are required, not a promise of a later scene. No speculative habitat reconstruction or modern map presented as ancient geography.

### Scale representation

Use **approximately 8 m** as the illustrative adult length, explicitly labeled **Estimated adult length** / **Geschätzte Länge eines erwachsenen Tiers**. This is a sourced estimate, not a measurement of a particular complete skeleton or a claim that every individual had that length.

Use a neutral silhouette labeled **Human reference: 1.7 m** / **Mensch als Vergleich: 1,7 m**. Its height is a chosen reference value, not an assertion about average human height. Generate the simple silhouette and measurement geometry in code; do not introduce a downloaded human asset or dependency.

Calibrate the specimen and reference in consistent scene units against the loaded head-to-tail extent. The displayed length guide must agree with the calibrated model and its endpoints; do not place an 8 m label beside an uncalibrated asset. This is an illustrative uniform scale adjustment, not scientific validation of the model's proportions. Keep it consistent through the study and restore any study-owned transform when leaving. Capture return framing in a way that remains correct across this adjustment and viewport resizing.

Keep the animal, silhouette, length endpoints, and readable label inside the view on narrow screens. On pause, scale/context graphics remain at the paused timestamp, while the visitor can inspect the specimen; geometry-anchored labels follow the current camera. Offscreen labels must not produce misleading leaders through the specimen.

## Narration scripts for written-spec review

These are project-owned paraphrases for approval with this specification, not recordings already produced. Use a warm, clear museum-guide delivery with deliberate pauses between ideas. Record and check pronunciation of Ankylosaurus in each language. Do not generate production recordings until the user has approved the written scripts.

### English

#### `meet` — Meet Ankylosaurus

Meet Ankylosaurus. With its broad body, bony armor, and heavy tail club, this dinosaur looks formidable. But it did not hunt other dinosaurs. It ate plants.

#### `scale` — A sense of scale

An adult could reach roughly eight metres long. The person beside it gives you a sense of that size. This length is an estimate from fossils.

#### `armor` — Built-in armor

Bony plates called osteoderms formed within its skin. They probably helped protect it like a suit of armor. At the end of its tail was a heavy bony club. Scientists think Ankylosaurus could swing it to strike an attacker.

#### `world` — Its ancient world

Ankylosaurus lived in what is now North America, around sixty-eight to sixty-six million years ago, near the end of the Cretaceous Period. Now take a closer look for yourself.

### German

#### `meet` — Ankylosaurus kennenlernen

Das ist Ankylosaurus. Mit seinem breiten Körper, dem Knochenpanzer und der schweren Schwanzkeule wirkt dieser Dinosaurier wehrhaft. Doch er jagte keine anderen Dinosaurier. Er fraß Pflanzen.

#### `scale` — Ein Gefühl für die Größe

Ein erwachsenes Tier konnte ungefähr acht Meter lang werden. Der Mensch daneben zeigt dir, wie groß das ist. Diese Länge wurde anhand von Fossilien geschätzt.

#### `armor` — Ein eingebauter Panzer

Knochenplatten, die Osteoderme heißen, bildeten sich in seiner Haut. Sie schützten ihn vermutlich wie eine Rüstung. Am Schwanzende saß eine schwere Keule aus Knochen. Forschende vermuten, dass Ankylosaurus sie schwingen konnte, um einen Angreifer zu treffen.

#### `world` — Seine Welt vor langer Zeit

Ankylosaurus lebte im Gebiet des heutigen Nordamerikas, vor ungefähr achtundsechzig bis sechsundsechzig Millionen Jahren, gegen Ende der Kreidezeit. Schau ihn dir jetzt selbst genauer an.

### Scientific support and limits

Sources read during this planning discussion on 2026-10-04:

1. [Natural History Museum: Ankylosaurus](https://www.nhm.ac.uk/discover/dino-directory/Ankylosaurus.html). Supports the plant diet, 8 m length reference, bony plates, tail club, North America, Late Cretaceous, and 68–66 million year range. Describes defensive use as probable and notes that no complete skeleton is known and the exact back-armor arrangement is uncertain.
2. [Natural History Museum: Ankylosaurs — the dinosaurs with built-in armour](https://www.nhm.ac.uk/discover/ankylosaurs-the-dinosaurs-with-built-in-armour.html). Includes museum researcher Susannah Maidment's explanation of bone embedded in skin, osteoderms, and probable, potentially multifunctional protection.

Keep the existing stylized-reconstruction notice available. Both scripts qualify armor protection and inferred tail use. No claim that protection was their only function, no certainty about behavior, no model-specific proof of armor placement, and no transfer of evidence for combat in Zuul to Ankylosaurus. Do not add body mass, speed, bite forces, exact habitat, or predator encounters.

## Playback and state transitions

The visitor's requested playing/paused state is distinct from temporary loading, seeking, buffering, and restoring states. There is one authoritative study state; controls, captions, and scene presentation derive from it rather than keeping separate conflicting modes.

| Action/state | Required behavior |
|---|---|
| Explore | Normal orbit, zoom, reset, and anatomy inspection are available. No study audio or study graphics. |
| Start | Capture the pre-study exploration camera/target/zoom, close any anatomy note, enter the study, and compose its initial view before narration advances. Captions start enabled. |
| Playing | Narration position drives camera choreography, lighting, captions, highlights, measurement, and context. Disable manual orbit/zoom/reset and anatomy selection, including native buttons and scene picking. Playback and Exit remain available. |
| Pause | Stop audio and choreography. Preserve the timestamp and chapter graphics. Clear guided region emphasis/dimming and restore exploration lighting. Enable the existing orbit, zoom, reset, and anatomy inspection without advancing the study. |
| Resume | Clear the inspection note and its highlight. Lock manual exploration, restore the complete guided scene at the paused timestamp, and only then advance audio. |
| Seek | Clear inspection and reconstruct the entire target presentation. Paused seeking remains paused; playing seeking resumes only when the requested audio position and presentation are ready. |
| End or Exit | Stop audio, cancel pending operations, clear study graphics and all selection, restore exploration lighting/transforms and the saved camera view, and re-enable exploration. Starting again begins at `meet`; no watched-state storage. |

The saved view means the visitor's pre-study orbit and zoom, not an unconditional reset. Adapt its projection to the current viewport; do not restore stale pixel dimensions after a resize. On exit from loading, buffering, error, or resume restoration, the same cleanup/restoration rule applies. Clear any residual OrbitControls damping before guided camera ownership or final restoration so it cannot move the restored camera afterward.

### Pause-to-inspect and ownership

Paused anatomy inspection is the delivered exploration interaction, with its existing nearest-visible-surface picking, gesture cancellation, occlusion, one-note rule, localized text, and focus behavior. Do not create a second picking system or note implementation.

Playing/restoring/seeking and paused inspection never concurrently own a highlight or camera. On pause, remove guided dimming before enabling inspection. Clearing a paused inspection restores normal specimen appearance, not the guided highlight. On resume, remove inspection-owned material changes before applying guided emphasis. Repeated transitions must leave no residual tint, leaked material clones, or duplicate event handlers.

Use about 350 ms for a normal resume reframe; hold narration still throughout it. Starting and ending may use similarly short framing/lighting transitions. Reduced motion makes these transitions immediate and substitutes composed chapter views for continuous camera travel. It does not omit narration, captions, measurements, or context.

### Seeking, chapter navigation, and buffering

- Native seeking is bounded to the resolved recording's duration. Previous/Next moves to the previous/next chapter's start relative to the current chapter; disable Previous in the first chapter and Next in the last. Repeated navigation does not first restart the current chapter.
- Treat chapter/caption/cue intervals as start-inclusive and end-exclusive. Exact chapter boundaries select the new chapter; a paused seek to the duration shows the final chapter's end state and stays paused. Natural playback completion returns to exploration. Play at that paused endpoint completes/returns rather than trapping the visitor in a zero-length loop.
- Compute scene state directly from timestamp and resolved recording version, including in-between camera positions and all overlay visibility. Do not rely on replaying earlier events. Backward seeking removes obsolete graphics and restores the right materials.
- On a paused seek, compose the requested guided view once, then leave manual inspection available with normal lighting and no guided emphasis, as for any paused moment. Buffering or repeated rendering must not continually overwrite a visitor's paused camera changes.
- Browser audio playback position is the authoritative clock. The existing viewer render loop samples it while playing; wall-clock timers must not independently advance chapter state.
- Freeze visual progression when audio is seeking or stalled. Keep Exit and Pause available. A visitor pause during loading/seeking/buffering changes the requested state, so later media events cannot unexpectedly resume playback.
- The latest requested seek wins. Media completions and reframe callbacks after a newer command, Exit, language navigation, or disposal cannot restart audio or update a detached viewer.

## Controls, captions, layout, and accessibility

Provide localized Play/Pause, Previous chapter, Next chapter, a native seekable range with four labeled chapter markers, captions on/off, and Exit to exploration. Show current time and duration, plus the current chapter name. Chapter markers are accessible buttons that seek to chapter starts, not only decorative marks.

- Captions start on for each newly started study. Preserve that choice during seeks, pause/resume, and an in-study language switch; do not add persistent preferences.
- Caption wording follows the approved recording. Split into short readable cues with recording-derived start/end times; do not synthesize timings by equally dividing text. Never use German timings with English audio.
- Use captions as visible text, not a live region announcing every cue over narration. Announce meaningful chapter/loading/error changes politely without repeating frame updates or every scrub position.
- Use readable text of at least 16 CSS pixels, controls at least 44 by 44 CSS pixels, visible keyboard focus, and native names/states. No hover-only controls or keyboard-only trap.
- Controls and Exit remain readable/operable in every study state. On phones, dock controls and captions into reserved areas and allow vertical growth; do not cover the specimen with a large panel or introduce horizontal overflow. Accommodate German wrapping and 200% text enlargement.
- On entry, move focus to the available Play/Pause control after it is mounted. On Resume, if focus is in a removed inspection note or newly disabled exploration control, move it to Play/Pause. On Exit or natural completion, return focus to Start field study if focus was inside the removed study UI; do not steal focus from a user elsewhere on the page. Retain the anatomy note's established close/focus-return behavior during paused inspection.
- Dim secondary exhibit content visually, not essential controls or status. Do not leave hidden exploration controls focusable while playing. Language navigation remains available.

## Localized recordings and language changes

Prepare English and German scripts and version-specific study data. A resolved study version is a complete bundle of audio URL, duration, chapter starts, visual cues, captions, language, and version identity. Use the actual loaded recording duration for playback bounds; authored duration must agree within 0.25 seconds, and all cues must be ordered and bounded by that recording. A mismatch is a readable study-data error requiring corrected media/timing data, not silently stretched cues. Stable chapter/anatomy IDs do not depend on language.

Fetch only the resolved recording on study demand, not both language tracks when opening the exhibit. Missing German version metadata resolves to a complete English version without changing German interface language. Clearly show **Narration in English** / **Erzählung auf Englisch** before Start and retain a language indication in playback. Use English captions and English timing with that fallback. A network error for a configured recording is an explicit error, not a silent switch to another version midway through a study.

Language links retain the existing localized static document navigation. During a study, pause before navigation and pass a small, validated handoff in the destination link's query: source recording identity/time, stable chapter, caption choice, and normalized saved exploration orbit/zoom. No global store, backend, persistent preference, or watched-state system.

On the destination page, resolve its complete study version and enter paused after the viewer/media are ready. For a different recording, go to the same chapter's start in that version. For the same fallback recording, retain the paused time. Carry the saved exploration view forward so Exit still honors it. Preserve neither an open anatomy note nor a manually changed paused-study camera.

Consume the handoff and restore the canonical localized URL without reloading; it is an immediate navigation handoff, not a bookmarkable progress feature. Validate finite/bounded times, valid IDs, caption state, and bounded camera values against the specimen/version. Invalid or incompatible handoff data opens ordinary exploration, not autoplay or broken camera coordinates. Navigating or closing during a pending handoff cannot leave audio from the old page playing. A normal language switch outside a study remains unchanged.

## Minimal implementation direction

These are responsibilities, not final exported interfaces or a required file proliferation. Reconcile exact signatures and placement during implementation planning against the delivered anatomy viewer.

- Extend the existing Three.js viewer to capture/restore exploration framing, change control ownership, evaluate the guided pose, manage focused lighting and region emphasis, and show/remove the simple silhouette and length guide. Reuse its render, resize, resource ownership, and disposal paths; no second scene or animation loop.
- Add one small specimen-specific study module that owns the audio lifetime and study transitions and evaluates presentation/caption/chapter state from the resolved version and timestamp. Its caller issues Start, Pause/Resume, Seek, and Exit and observes a coherent status. Keep media seeking/buffering/error details inside this module rather than scattering them across button handlers.
- Extend the existing Svelte viewer/exhibit UI with the controls, captions, context graphic, narration-language indication, and readable status. Do not expose meshes/materials to Svelte or maintain a second independent selection state.
- Keep specimen prose, narration, chapters, and cue data with specimen-owned content, separate from shared Paraglide interface messages. Use a small fixed data structure for these four chapters, not a plugin registry, event bus, configuration language, or presentation editor.
- Use native browser audio, range/buttons, existing Three.js geometry/material tools, and custom CSS. No new playback/animation/annotation dependency. Reuse vectors/materials/results and avoid allocation or unchanged UI notifications in the frame loop.
- Preserve SSR specimen text, prerendered English/German URLs, browser-only Three.js/audio initialization, and externally hosted media. The page must remain readable without a working study.

## Media production and configuration

The implementation requires real, approved narration, not a placeholder oscillator, silent track, browser speech synthesis, mocked audio clock, or text-only timer presented as the completed feature.

1. Approve the scripts in this document before production recording.
2. Generate/export ElevenLabs narration ahead of time. Pick and document suitable voice pronunciation and calm delivery in each language. No runtime ElevenLabs integration or API keys in the app/repository.
3. Listen to the complete recording and check wording, pronunciation, clarity, and 30–60 second duration. If pacing does not fit, adjust delivery or obtain approval for wording changes; do not speed up unintelligibly or silently drop a chapter.
4. Align caption segments, chapter starts, and visual cues to the actual recording. In `armor`, switch from armor framing/emphasis to tail-club framing/emphasis when the narration introduces the club. Cue the silhouette/length guide with the scale explanation and the context graphic with the world explanation. English and German have independent cue tables.
5. Keep local recordings in the existing ignored media directory and serve them from the separate local media host. Production uses configurable, credential-free HTTP(S) asset URLs outside the application build. Confirm audio content types, seek support, and any needed CORS behavior against the actual host rather than assuming GLB delivery proves audio delivery.
6. Commit only project-owned scripts/captions/timing data, URL configuration examples, code, and provenance. No recordings, source audio, GLB, textures, or voice credentials in Git or application static output.
7. Record voice identity, generation date, paid-plan evidence, relevant terms/restrictions, and any required attribution in asset provenance. Keep private billing evidence outside the public repo; record a non-secret reference to it. MIT source-code licensing does not grant reuse rights to recordings or the model.

English is the required playable baseline. German must be supported as a complete independent recording version; if its recording has not been supplied, the approved visibly labeled English fallback is allowed and must be exercised. Do not claim German narration was delivered or verified when only German interface/scripts exist. Availability of a real English recording and its rights/provenance is a prerequisite to end-to-end narrated acceptance.

## Readiness, failures, and lifetime

- Starting requires a ready specimen, the study's required armor/tail targets, and a configured complete narration version. Otherwise retain exploration, disable Start, and explain the localized unavailable/loading reason. Missing targets are graceful error handling, not acceptance of the normal-asset study.
- Load recording data on demand and expose honest loading/seeking/buffering states. No fabricated percentages, automatic retries, or premature timer-driven presentation.
- If browser playback is denied, retain a paused study with a readable message and an explicit Play action, plus Exit. Only confirmed media playback advances the study.
- On media/network/decode failure, stop progression, clear inspection, retain the current composed scene, and offer an explicit Retry and Exit. Retry reloads the same resolved version, restores the retained position, and remains paused until explicit Play. A late completion cannot override a later Exit or seek.
- On viewer/model failure or WebGL loss, stop audio, cancel study operations, remove DOM study/inspection overlays, and use the viewer's existing localized unavailable/error state. Retain readable specimen content and language links; do not keep presenting audio without the specimen.
- Navigation/unmount removes media/document listeners, callbacks, pending transitions, and handoff work. Stop/unload audio and release study-owned geometry/material resources through the existing viewer lifetime. Restore/remove temporary material changes without disposing original shared specimen materials twice.

## Acceptance and verification

This design task has not run the study. Implementation must run the actual built static exhibit and observe the changed surface, not merely pass tests or render a nonempty canvas.

1. Run Meet Ankylosaurus from beginning to natural completion using a real recording. Hear intelligible narration and observe all four composed chapters, synchronized armor-to-tail emphasis, scale comparison/guide, context time band, and captions. End in the saved exploration view with working controls and no study graphics/audio.
2. Check both localized routes. Exercise independent English/German durations and cue tables with real recordings when available; exercise visibly labeled English fallback from German with English captions/timing. Record exactly which recordings were supplied and heard.
3. Start from a rotated/zoomed view; Exit during playing, loading/buffering, paused inspection, seeking, and resume reframe. Confirm saved orbit/zoom and ordinary lighting return, including after resizing. Start again at the introduction.
4. Pause within each chapter, orbit/zoom/reset, select all three anatomy regions, and clear/switch notes. The audio timestamp remains fixed. Resume clears inspection and restores the correct guided framing/highlight before audio advances. Repeat to detect residual tint or competing camera ownership.
5. Seek forward/backward across every chapter and the armor-to-tail cue, including while paused. Direct seek and continuous playback at the same timestamp produce the same guided state before paused manual changes. Old graphics disappear, captions match, chapter boundaries are correct, and paused seeking remains paused. Exercise start, exact chapter starts, duration, rapid successive seeks, and Previous/Next endpoints.
6. Delay/interrupt audio loading and seeking, then issue Pause/Exit/new seeks before completion. Verify no visual advancement ahead of audio or stale completion restarting playback.
7. Observe the scale scene: silhouette height, illustrative specimen length, guide endpoints, and labels agree. Check full framing at desktop 1365x768, tablet 1024x768, and phone 390x844, including resize, both languages, and 200% text enlargement. Caption/control areas do not obscure essential anatomy or overflow horizontally.
8. Keyboard-only interaction reaches chapter markers, seek, captions, Play/Pause, Exit, and paused anatomy controls with visible focus and correct disabled states. Check focus return and accessible status behavior without announcing every frame/caption. Exercise reduced motion and verify composed chapter views with the full learning content.
9. Switch language during playing and paused inspection. A different recording opens paused at the corresponding chapter start; the same fallback retains paused time. Exit preserves the original exploration orbit/zoom. Normal navigation and invalid handoff data open ordinary exploration without accidental playback.
10. Inject audio denial/network/decode errors, missing study targets, WebGL loss/unavailability, and navigation during delayed loading. Confirm clear localized status, manual retry/exit where usable, continued readable page content, no continued old-page audio, and no late scene/DOM mutation. Use temporary harnesses, not permanent corrupted media or production shortcuts.
11. Keep one small framework-free runnable regression check for consumer-visible timeline/state invariants: direct/backward seek state, chapter/cue boundaries, paused inspection without time advancement, and cancellation/latest-command behavior preventing unwanted playback after Pause/Exit. Do not add a test framework, copied-script wording tests, forwarding/mock-echo tests, or a per-feature fixture hierarchy.
12. Run existing type, camera, anatomy, and static-build checks once after integration. Exercise the built app, verify model/audio binaries did not enter build/staged source output, and record only observed results in delivery documentation. Physical-device, actual screen-reader, and production-host checks must be explicitly distinguished from desktop browser/emulated-touch evidence. Remove temporary harnesses and stop only services started for this work.

## Explicit exclusions

No generic presentation engine, timeline editor, new specimen, collection/catalog, accounts, backend, offline mode, saved progress/preferences, runtime voice generation, autoplay on page entry, background music, quizzes, walking/attack animation, cutaways, additional anatomy regions, model redesign, elaborate habitat, production-host provisioning, media compression work, or unverified scientific additions. Do not create empty future modules or widen the delivered anatomy interaction beyond study integration.

## Review gate and next step

Review this written specification, especially the English/German scripts, scale explanation, paused-inspection ownership, language handoff, and real-media prerequisites. Conversational approval permitted writing this document; it did not approve these newly written scripts or authorize implementation.

After the user approves the written specification, create a concrete implementation plan against the delivered viewer. Preserve the recording-production and provenance prerequisites in that plan. Review/select execution separately; do not start product implementation from this specification alone.

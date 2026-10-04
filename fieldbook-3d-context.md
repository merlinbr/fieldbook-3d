# Fieldbook 3D — Project Context

## Project identity

- **Project name:** Fieldbook 3D
- **Repository / folder name:** `fieldbook-3d`
- **Purpose:** An interactive 3D natural-history learning experience built around explorable specimens, narrated guided presentations, and visually integrated educational information.
- **Initial subject area:** Dinosaurs / paleontology.
- **Long-term direction:** The architecture should be general enough to support other natural-history or educational domains later.

A useful one-line description:

> **Fieldbook 3D — an immersive narrated 3D field guide.**

The project is inspired by the idea of a futuristic educational "filmbook": a specimen is presented in 3D while narration, camera movement, measurements, highlights, and contextual information appear in sync.

This is an inspiration for the interaction model only. The UI should have its own visual identity rather than directly copying Dune or another existing work.

This document is the source of truth for the project direction and agreed prototype scope. The discussion decisions below replace the original T. rex starting point with **Ankylosaurus**. The first-exhibit milestone was delivered on 2026-10-03 and anatomy inspection on 2026-10-04. Guided Field Study remains pending.

---

## Core experience

Fieldbook 3D should have two complementary ways to experience a specimen.

### 1. Free exploration

The user can inspect a dinosaur or other specimen interactively:

- orbit / rotate
- zoom
- inspect the model from multiple angles
- view basic information
- see the specimen in a small stylized environment or diorama
- start a guided presentation
- select anatomical parts to reveal anchored floating notes

The specimen should remain the visual focus. The UI should feel like a digital natural-history field guide rather than a conventional dashboard.

### 2. Guided field study

A cinematic, narrated sequence temporarily takes control of the experience.

Example flow:

1. Normal UI fades or becomes less prominent.
2. Camera moves into a composed hero view.
3. Species name, era, and age appear.
4. Narration begins.
5. Camera moves to relevant anatomical features.
6. Specific regions can be highlighted while the rest of the model dims.
7. Measurements or comparison objects can appear in 3D.
8. Geographic / environmental context can appear.
9. The sequence ends and control returns to the user.

The first implementation should be intentionally small and polished rather than generic and over-engineered.

### Shared scene

Explore and Field Study use the same specimen and scene, not separate pages. Starting a study transitions the existing exhibit into a narrated presentation; ending or exiting returns it to free exploration.

---

## Audience and tone

The primary audience is curious children learning about dinosaurs, while older children and adults should also find the experience interesting.

- Use roughly ages **9–12** as a working baseline for narration, not an age restriction.
- Aim for a grown-up museum experience, not a playful children's app.
- Use clear, concrete explanations without talking down to the audience.
- Introduce scientific terms through their meaning.
- Communicate one memorable idea per chapter.
- Distinguish scientific evidence from estimates and reconstruction.
- Avoid mascots, reward systems, cartoon controls, and compulsory quizzes.

Deeper optional notes are a possible later extension, not a separate prototype content system.

## Agreed experience and visual direction

The direction is a **museum fieldbook with a cinematic study mode**. Borrow the filmbook's relationship between narration, specimen, and synchronized explanation, not its literal interface.

### Collection — future multi-specimen entry point

- A warmer, slightly brighter collection of dinosaur previews and names.
- Curated and museum-like, not a game character-selection screen or dashboard.
- Deferred until multiple specimens exist; no empty catalog or locked placeholders in the prototype.

### Explore — prototype entry point

- Open directly into the Ankylosaurus exhibit.
- Give the specimen most of the screen within a small stylized diorama.
- Support orbit, zoom, anatomical selection, and basic information.
- Provide a clear **Start field study** action.
- Keep names and contextual information near the edges rather than in large cards.
- Use warmer, slightly brighter lighting than Field Study; this does not require a white background.

### Field Study — focused presentation

- Dim surrounding navigation and secondary information.
- Make the habitat less prominent while keeping the specimen visually central.
- Use focused lighting, deliberate camera choreography, and synchronized anatomical highlights.
- Prefer purposeful camera movements over constant model rotation.
- Show labels, measurements, and context only when relevant.
- Keep playback controls, captions, and the exit action readable and available.

### Palette and model reference

- Working palette: warm charcoal, muted olive, stone, and bone-colored text.
- Use a restrained amber accent for active controls and highlights.
- Avoid a busy sci-fi HUD, excessive glow, and decorative interface chrome.
- The shared Ankylosaurus screenshot is a reference for faceted geometry, earthy colors, a small diorama, and editorial typography—not a layout to copy.
- Preserve anatomical readability; the model should feel like a curated reconstruction rather than a toy or rendering demo.
- Avoid the reference's faint, tiny interface text.
- Keep production details such as triangle counts and procedural-generation language out of the learning interface.

### Typography — selected museum field guide style

- Selected the **Museum field guide** heading treatment (left-hand typography preview).
- Use **Newsreader** for specimen headings and italic scientific names.
- Use **Source Sans 3** for interface controls, floating notes, facts, captions, and timeline labels.
- Keep serif typography selective; it supplies editorial character without making the interface decorative.
- Avoid thin text weights and tiny, widely spaced uppercase text for essential information.
- The typography preview validates this font pairing, not its card layout as the final exhibit design.

## Prototype anatomy interaction

Provide three selectable targets: **armor, head, and tail club**.

- A subtle marker identifies each selectable feature.
- Clicking or tapping a target highlights the region and opens a compact floating note.
- Anchor the note to the anatomy with a thin leader line.
- The anchor follows the model during orbit; the text stays screen-facing and readable.
- Keep notes within the viewport.
- Use a short fade and slight lift for depth, not continuous bobbing.
- Show only one inspection note at a time; selecting another replaces it.
- Provide a close button; clicking empty space also dismisses the note.
- Do not depend on hover for essential information.
- Do not move the camera when a part is selected.

Evaluate slight camera assistance only after trying the implemented interaction.

## Prototype playback and pause behavior

Controls include **play/pause, a seekable timeline with chapter markers, previous/next chapter, captions, and exit to exploration**.

| State | Behavior |
|---|---|
| Explore | Orbit, zoom, and anatomical selection are available. |
| Study playing | Narration controls camera choreography and presentation highlights. |
| Study paused | Narration and choreography freeze; orbit, zoom, and anatomical selection become available. |
| Study resumed | Dismiss the inspection note and smoothly restore the guided framing and highlight at the paused timestamp before narration advances. |
| Study ended or exited | Clear guided overlays and restore exploration lighting and controls. |

Seeking updates the **whole presentation**, including camera framing, lighting, labels, measurements, captions, and highlights—not just the audio. Seeking while paused shows the selected moment and remains paused.

Paused study annotations use the same interaction as exploration. Inspection must not advance the narration timeline.

---

## Internal naming

Use these names for the main application concepts:

### `SpecimenViewer`

Responsible for the normal interactive 3D specimen view.

Potential responsibilities:

- load and display the GLB / GLTF specimen
- manage scene, camera, lighting, and controls
- orbit / zoom interaction
- specimen positioning and scaling
- environment / diorama
- selection or targeting of important model parts
- transition between normal viewing and guided presentation

### `FieldStudyMode`

Responsible for entering and leaving the narrated guided experience.

Potential responsibilities:

- disable or modify normal user controls
- fade / hide normal UI
- switch lighting / scene presentation
- start a guided sequence
- restore the normal `SpecimenViewer` state afterwards

### `NarrationTimeline`

Responsible for synchronizing narration and visual events.

Examples of timeline events:

- camera movement
- title / text appearance
- mesh highlight
- measurement visualization
- human scale reference
- environment change
- map / geological period visualization
- narration cue
- return to normal view

Eventually this should be data-driven, but the first prototype can be partially hard-coded.

Example future structure:

```ts
const ankylosaurusStudy = [
  {
    time: 0,
    camera: "hero",
    overlay: "intro"
  },
  {
    time: 8,
    camera: "fullBody",
    action: "showHumanScale"
  },
  {
    time: 17,
    camera: "head",
    highlight: "head"
  },
  {
    time: 30,
    camera: "wide",
    action: "showHabitatContext"
  }
];
```

### `SpecimenTerminal`

The UI / presentation layer surrounding the specimen.

This is where scientific and contextual information can appear, for example:

- species name
- scientific name
- geological period
- age range
- specimen number / study number
- measurements
- field notes
- anatomy labels
- controls for exploration
- button to start `FieldStudyMode`

The name deliberately has a slightly futuristic museum-terminal feel.

---

## Visual direction

The preferred direction is **stylized low-poly natural history**, not photorealism.

The current experiments use:

- faceted low-poly animals
- simplified low-poly environments
- muted natural colors
- scientific typography
- Latin names
- subtle measurement marks
- small labels and field-note style information
- generous whitespace
- minimal interface chrome

The low-poly style should remain anatomically recognizable and reasonably accurate. Avoid pushing it so far into blocky or toy-like geometry that important anatomical features are lost.

The design should feel intentional and curated, not like a technical Three.js demo.

### Suggested visual contrast

**Explore mode**

- warm
- natural
- museum / field-guide feeling
- relaxed
- tactile
- specimen within a small habitat / diorama

**Field Study mode**

- darker or more focused
- cinematic
- minimal
- specimen isolated visually
- subtle projection / scan / scientific-instrument feeling
- integrated 3D measurements and labels

The guided mode can be "holographic-inspired", but the project should not describe itself as actual holographic technology. It is still a 3D scene displayed on a normal screen.

---

## First prototype

Start with **one dinosaur only**.

First specimen:

> **Ankylosaurus**

The first guided presentation should be around **30–60 seconds** and contain only a few strong moments.

The prototype includes the shared Explore / Field Study scene, three anatomy annotations, and the playback behavior defined above. It does not include a multi-specimen collection or a generic presentation engine.

### Prototype sequence

This is a proposed chapter outline, not a finalized narration script. Adapt the original four-moment structure to Ankylosaurus; factual claims, measurements, and reconstruction details must be checked before narration is finalized.

#### Scene 1 — Introduction

- camera transitions to a hero three-quarter view
- display:
  - `ANKYLOSAURUS`
  - `Late Cretaceous`
  - `68–66 million years ago`
- short narration introduces the animal

#### Scene 2 — Scale

- camera pulls back
- show a human silhouette for scale
- optionally show a simple length measurement
- communicate one memorable size fact

#### Scene 3 — Anatomy

- camera frames a relevant anatomical feature
- rest of the animal dims slightly
- the narrated region remains illuminated or highlighted
- explain one memorable idea about armor or the tail club
- choose the final emphasis when developing the narration and model

#### Scene 4 — World

- camera returns to a wider view
- show simple contextual information:
  - western North America
  - Late Cretaceous
  - habitat / environment
- finish narration

#### End

- guided presentation UI fades out
- lighting returns to normal
- normal controls return
- user can continue exploring the specimen

---

## Important implementation principle

Do **not** build a fully generic presentation engine first.

For the first prototype:

- hard-code one polished sequence
- validate the visual language
- validate camera motion
- validate narration timing
- validate highlighting
- validate whether the low-poly style works in guided mode

Only after the prototype feels good should the implementation be generalized into reusable data-driven presentations.

---

## Model considerations

`.glb` is preferred.

Useful model structure:

```text
Ankylosaurus
├── Body
├── Armor
├── Head
├── Jaw
├── Legs
├── Tail
├── TailClub
└── Eyes
```

The model does not need to be split into dozens of parts, but separating important anatomical regions can make educational highlighting much easier.

For the prototype, armor, head, and tail club must be identifiable for selection and highlighting. The hierarchy above is a useful asset structure, not a requirement to use those exact node names.

Useful separations can include:

- body
- head
- jaw
- arms
- tail
- major horns
- frill
- plates
- armor
- eyes

If the model is a single mesh, it is still usable, but targeted highlighting may require shaders, masks, duplicate meshes, vertex groups, or changes to the source model.

---

## Interaction principles

- Keep the dinosaur / specimen as the visual hero.
- Avoid large conventional cards covering the 3D scene.
- Prefer information that appears to belong to the 3D presentation.
- Use thin measurement lines, labels, subtle markers, and floating contextual elements.
- Avoid excessive text during narration.
- Each chapter should communicate one memorable idea.
- Camera movement should be slow and deliberate.
- Transitions should feel cinematic rather than game-like.
- The user should always be able to return to normal exploration after the guided sequence.

---

## Agreed technical stack

- **SvelteKit + TypeScript**, with Vite as the build tooling.
- **`adapter-static`** for pre-generated pages and static hosting; no application backend or database is required for the agreed experience.
- **Three.js** owns the specimen scene, camera, lighting, picking, and continuous animation; initialize the viewer only in the browser.
- **Svelte** owns the collection, information UI, floating annotations, language selection, and playback controls.
- **Custom CSS and native HTML controls where suitable**, using the museum field-guide identity rather than a full Material component theme.
- **Paraglide JS** for interface internationalization.
- **Browser audio playback** supplies the study's authoritative playback time.
- **`localStorage`** can hold small preferences and watched-state markers when those features are added; storage failure must not prevent exploration or playback.
- Consider the official **Svelte AI tools** for development-time documentation access and Svelte static analysis. These are optional assistant tooling, not application features or browser runtime dependencies; setup is deferred until implementation and must match the coding client's supported integrations.

Pre-generate specimen pages while keeping the interactive 3D viewer browser-only. Do not disable rendering for the whole site merely because Three.js needs browser APIs.

### Asset delivery

- Load lightweight collection metadata and appropriately sized thumbnails first; load visible thumbnails as needed.
- Fetch the selected specimen's model and environment on demand.
- Fetch the required narration language rather than every available recording.
- Serve production media from separate asset hosting/CDN, outside the public source repository.
- Do not include all specimen models or recordings in the initial application bundle.
- Release previous scene resources when changing specimens.
- Choose model compression after measuring the actual assets.
- Repository MIT licensing does not automatically cover third-party models, fonts, or recordings; track their licenses separately.

### Public repository and media policy

- Keep the public repository for **MIT-licensed application code and project-owned text content**: narration scripts, translations, caption/timing files, and asset URL metadata.
- **Do not commit production media files** to the public repository: narration recordings, GLB/GLTF models, textures, environment assets, thumbnails, or source-media files.
- Reference externally hosted media through configurable asset URLs; do not embed the media in the application bundle.
- If local media is needed during development, place it in a designated ignored directory or outside the repository. When setting up the application, add the ignore rules before downloading or generating media.
- Before publishing changes, check staged files for media that belongs outside the repository; `.gitignore` does not protect files already tracked by Git.
- Generate/export ElevenLabs narration ahead of time and host the recordings as assets. Playback does not require an ElevenLabs API integration; never commit API keys or credentials.
- Clearly document that the source-code MIT license does **not** grant reuse rights to separately hosted media.
- Track asset provenance, applicable licenses/restrictions, and required attribution. For generated narration, retain the voice identity, generation date, paid-plan evidence, and applicable terms.
- Commercial-use permission is not automatically permission to grant unrestricted redistribution rights. Verify the selected voice's terms before offering media reuse rights.
- Separate hosting is a licensing/distribution boundary, not copy protection: media delivered to a public browser remains downloadable.

### Internationalization and localized studies

- **English is the primary language; German is the second included language.**
- Keep interface messages separate from localized specimen descriptions, anatomy notes, narration, and captions.
- Keep stable specimen IDs, anatomy targets, and chapter identities independent of language.
- Use localized specimen URLs, such as `/en/specimens/ankylosaurus` and `/de/specimens/ankylosaurus`; the URL language takes precedence over a saved preference.
- The interface language selects the preferred narration language.
- If that specimen's narration is unavailable in the selected language, **fall back to English** without changing the interface language.
- Clearly identify the fallback before playback, for example: “Narration in English.”
- Resolve narration as a complete study version: recording, chapter/cue timings, and captions must agree. Never combine English audio with timings from a German recording.
- Keep fallback simple: English narration uses its English captions and timings. Cross-language captions for fallback audio are out of scope; detailed fallback implementation can be decided later.
- Each localized recording may have its own durations, caption timings, and visual cue timings.
- When a language change selects a different study recording, pause and seek to the beginning of the corresponding chapter in that version; remain paused until the user resumes.
- If both interface languages resolve to the same fallback recording, retain the current paused study position rather than unnecessarily restarting the chapter.
- Translation and narration availability are tracked per specimen; translated UI does not imply that every recording exists.

### Supported devices

- **Desktop and tablets are the primary experience.**
- Keep phones usable from the start with responsive layouts, touch selection, readable annotations, and accessible playback controls.
- Do not depend on hover or mouse-only interaction.

### Deliberately deferred

No accounts, cross-device synchronization, custom backend, offline mode, or generic presentation engine for the prototype. Exact hosting provider and asset-compression choices can wait until deployment and asset measurements.

Technical references:

- [SvelteKit static adapter](https://svelte.dev/docs/kit/adapter-static)
- [Paraglide SvelteKit integration and static generation](https://paraglidejs.com/sveltekit)
- [Svelte CLI AI tooling](https://svelte.dev/docs/cli/ai-tools)
- [Svelte AI tools overview](https://svelte.dev/docs/ai/overview)

---

## Possible future architecture

Once the prototype is validated, a specimen could eventually be represented by data such as:

```ts
interface SpecimenDefinition {
  id: string;
  commonName: string;
  scientificName: string;
  period: string;
  ageRange: string;
  modelUrl: string;
  environmentId?: string;
  presentation?: NarrationTimelineDefinition;
}
```

A reusable guided presentation could then contain chapters:

```ts
interface FieldStudyChapter {
  id: string;
  startTime: number;
  duration: number;

  cameraTarget?: string;
  cameraPreset?: string;

  narration?: string;
  overlay?: string;

  highlightTarget?: string;
  action?: string;
}
```

This is a future direction, not a requirement for the first prototype.

---

## Potential long-term expansion

The name **Fieldbook 3D** is intentionally broad enough to support additional modules beyond dinosaurs.

Possible future subject modules could include:

- paleontology
- marine life
- prehistoric mammals
- human anatomy
- geology
- astronomy
- archaeology

The core pattern stays the same:

> **explore a 3D subject → start a narrated field study → learn through synchronized visual explanation**

---

## Current priorities

Delivered first milestone (2026-10-03): the root SvelteKit/TypeScript static app, English/German specimen documents, and browser-only `SpecimenViewer` load the exported resting Ankylosaurus GLB from separate media hosting. Mouse/touch/keyboard exploration, reset framing, responsive layout, localized failures, reduced motion, and delayed-load disposal were exercised. See `README.md` for exact evidence and limits, and `docs/assets/ankylosaurus.md` for provenance. Model reuse rights and scientific accuracy remain unverified; no production media hosting or physical-device verification has been completed.

Delivered anatomy milestone (2026-10-04): armor, head, and tail-club surfaces/markers/native buttons select one approved English/German note with isolated amber emphasis and no camera movement. Occluded/offscreen markers and leaders hide without removing the note; narrow/enlarged-text layouts reserve a docked edge area. Static Chromium smoke exercised bilingual selection, nearest-body blocking, mouse/touch-emulated gesture cancellation, keyboard/focus/live-region behavior, responsive layouts, missing-target/loading/WebGL failures, and delayed-load/highlight/listener disposal. The integrated type/camera/anatomy/static-build checks passed. `README.md` records the complete observed matrix and exact limits: no physical-device testing, actual screen-reader session, or production CDN deployment. The [approved anatomy specification](docs/superpowers/specs/2026-10-03-anatomy-inspection-design.md) retains the scientific sources and qualifications.

Delivered narrated Meet milestone (2026-10-04–05, issue #1): the existing viewer owns composed hero framing, focused lighting, input locking, pause-to-inspect/resume, and saved-view restoration. The owner approved the unchanged script before generation, confirmed ElevenLabs Rowan generation on 2026-10-04 after Starter activation, then re-auditioned/approved all four regenerated segments. The selected full track is 51.643938 s with all 1,977 source packets preserved; complete measured chapter/caption/cue/provenance metadata is source-controlled in `docs/assets/ankylosaurus-narration.en.json` and configured locally. Real Meet playback/default captions, all paused anatomy/manual controls, composed resume, real seeking, pixel-exact saved-view restoration after resized Exit/natural completion, actual nonzero network failure and exact paused-position Retry, duration mismatch, EN/DE viewport/text-size matrix, real navigation/BFCache, and context loss passed in the built static exhibit. Native pause finalized its clock beyond a pre-pause error sample; pause/failure now capture the stopped clock, with failing-before/passing-after regression and real outage proof. README records evidence and limits: no physical-device/screen-reader/CDN/model-publication-rights verification; natural tab hiding was not reliably representable, so visibility pause/no-auto-resume used fault injection. Only Meet plays. No later chapter visuals/navigation or German recording was delivered.

Remaining prototype priorities:

1. Refine the model / environment experiments and verify factual claims and asset rights.
2. Refine the delivered anatomy inspection as the exhibit is evaluated; introduce `SpecimenTerminal` only when its content needs a separate component.
3. Evaluate the delivered real Meet introduction; restart any older local media responder to load its MP3 route, and verify rights-cleared external hosting before publication.
4. Deliver later four-chapter playback/navigation using the existing native-audio study state; do not add a second scene, clock, or presentation engine.
5. Add the later chapters' narration-aligned camera choreography/anatomical emphasis and verify pause-to-inspect/resume throughout the full study.
6. Add the later scale comparison and geological/geographic context scene.
7. Evaluate the complete experience before generalizing the architecture.

---

## Main design goal

Fieldbook 3D should not feel like:

> "a webpage that happens to contain a 3D model."

It should feel like:

> **a digital natural-history exhibit where the specimen itself becomes the interface for learning.**

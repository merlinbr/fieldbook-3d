# Meet Introduction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement issue #1's real-audio Meet chapter, pause-to-inspect, and return to the saved Explore view without implementing later tickets.

**Architecture:** Native audio and one specimen-specific controller own study state. Extend the existing viewer/render loop for camera ownership, focused lighting, cancellation, and saved-view restoration. Missing complete recording metadata disables Start; do not invent recording-derived timings.

**Tech Stack:** Existing Svelte 5, Three.js, Paraglide, native HTMLAudioElement, Node 24; no new dependencies.

**Spec:** GitHub issue https://github.com/merlinbr/fieldbook-3d/issues/1 (full requirements read with comments and native blockers), and docs/superpowers/specs/2026-10-04-guided-field-study-design.md, restricted to this ticket.

**Delivery status:** Real narrated Meet acceptance is complete locally; see README.md for the observed matrix and limits. The selected full ElevenLabs track is 51.643938 s with its 1,977 source audio packets preserved. The owner confirmed generation on 2026-10-04 after Starter activation and re-auditioned/approved all four segments. Applicable standard output/voice terms, voluntary attribution, and non-secret paid-plan evidence are documented; the complete source-controlled recording version contains speech-aligned captions/visual cues and all chapter starts. The built static exhibit exercised actual Meet playback, pause/inspection/resume, exact saved-view restoration, natural completion, genuine nonzero network failure/retained paused Retry, data mismatch, navigation/BFCache, WebGL loss, and the bilingual layout matrix. A real outage exposed native pause clock finalization; both pause/failure paths now capture after pausing, with failing-before/passing-after regression and real recovery proof. This does not claim later-ticket, physical-device, or production-host acceptance; natural tab hiding remains a managed-browser verification limit.

## Global Constraints

- Only Meet playback is delivered here; record the full approved English script for meet, scale, armor, world. No later chapter navigation, scale/reference geometry, world graphics, or language-progress handoff.
- One specimen, scene, render loop, resource lifetime, and authoritative study state. Stable anatomy IDs: armor, head, tailClub.
- English script explicitly approved unchanged before generation; owner approved all regenerated segments after listening again. Current ElevenLabs Rowan segments were generated on 2026-10-04 after Starter activation. Initial Inworld and earlier free-plan alternatives remain preserved but unselected. Applicable standard terms/attribution, aligned metadata, and real Meet acceptance are recorded in the delivery docs; private billing evidence stays private.
- No recording/model binaries or secrets in source/static output; configurable credential-free HTTP(S) media URLs. Complete version comprises identity, language, URL, actual-compatible authored duration, all chapter starts, visual cues, captions, and voice provenance.
- Audio position is authoritative. Actual duration must match authored duration within 0.25 seconds; ordered/bounded cues. No generated cue timings, silent/mock completed playback, automatic retries, or fallback on configured-media failure.
- Captions on at each start; preserve choice within study. Compose before playback; approximately 350 ms resume, immediate reduced motion.
- Start requires viewer readiness, armor/tail targets, and complete recording metadata. Pause restores manual controls and all existing notes; playing/restoring/seeking locks every input path.
- EN/DE static SSR, localized interface, visibly labeled English narration/captions in German. Text >=16 CSS pixels, controls >=44x44, visible focus.

## Review Focus

- Late play promises/media events after Pause/Exit/disposal cannot restart playback.
- OrbitControls damping and active pointer gestures cannot alter guided/restored camera state.
- Resize during paused inspection or restoring must retain the saved orbit/zoom with current projection.
- Data mismatch/media failure must preserve composed paused view and require explicit Retry/Play.
- Viewer/context loss removes study overlays and audio without losing readable specimen/language content.

---

### Task 1: Version validation and audio lifecycle

**Files:** Create src/lib/viewer/study-data.ts, src/lib/viewer/field-study.ts, checks/field-study.mjs. Parent updates package.json and public-env wiring.

**Interfaces:** createFieldStudy(version, view, onChange) returns start(), pause(), play(), retry(), exit(), setCaptions(boolean), dispose(). StudyView exposes begin(): boolean, compose(): Promise<boolean>, pause(): void, exit(): void, setFrame(callback: (() => void) | null): void. Snapshots expose phase, active, requestedPlaying, time, duration, caption, captionsEnabled, and error kind. Full version parsing/validation is separate and safe for SSR; absent data yields unavailable rather than a fake version.

- [x] Implement validation for full recording metadata and immutable resolved identity; English only for this slice, with all four chapter starts and ordered captions/cues.
- [x] Implement native-media loading/play/pause/buffering/seeking/error/retry and generation cancellation. End the slice at the scale chapter start and restore Explore. Retry retains time and stays paused until Play.
- [x] Add one framework-free runnable regression check for consumer-visible data boundaries and cancellation/state behavior. No recording fixtures or permanent synthetic audio.

### Task 2: Separate local audio delivery

**Files:** Modify tools/serve-dev-media.mjs; document recording intake in docs/assets/ankylosaurus-narration.md and .env.example.

- [x] Preserve the GLB endpoint, add one fixed optional ignored narration export endpoint with correct audio content type, HEAD, Range/206/416, and required CORS headers. Never expose arbitrary paths or directories.
- [x] Document exact export filename, unchanged approved script, pronunciation/pacing audition, real timing derivation, complete metadata schema, and non-secret provenance. Explicitly mark recording/audition/rights as unverified until supplied.

### Task 3: Viewer and accessible study UI integration

**Files:** Modify specimen-viewer.ts, anatomy-inspection.ts, SpecimenViewer.svelte, ankylosaurus.ts, src/env.ts, messages/en.json, messages/de.json, src/app.css, package.json, README.md.

- [x] Add anatomy input ownership switch; cancel gestures and clear highlight before guided ownership. Guard native and scene input.
- [x] Capture camera/target/zoom once, reuse existing hero framing, focus lighting, compose using the existing animation loop; restore view without stale damping or projection dimensions. Cancel pending composition on Pause/Exit/failure/disposal.
- [x] Wire complete build-time recording metadata, localized unavailable reasons, Play/Pause/Retry/Exit/captions, English-caption language, focus restoration, and navigation cleanup. No audio request before Start.
- [x] Run npm run check, check:camera, check:anatomy, check:study, and development static build after integration. Initial unavailable/fault-only checks did not replace narrated acceptance. After the approved recording arrived, configure its complete measured version and exercise actual built static Meet playback, all paused inspection, resume, real seeking/default captions, saved-view Exit/completion, nonzero actual HTTP/network error plus exact retained Retry, duration mismatch, EN/DE layout/keyboard/reduced motion, real navigation/BFCache/context loss, and visibility fault injection. Record physical-device/CDN/natural-tab-hiding limits.
- [x] Review lifecycle/data/camera ownership after integration, fix observed issues, update delivery evidence and remove temporary harnesses. Do not close issue #1 until real audio acceptance is observed.

# Stegosaurus Exhibit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Execution method is selected by the user before implementation.

**Goal:** Deliver the approved Stegosaurus as an English/German, exploration-only exhibit with accurate anatomy membership, an explicitly interpreted scale, and usable navigation from Ankylosaurus.

**Architecture:** Add specimen configuration and content to the existing `SpecimenViewer.svelte` contract. Reuse a single model-URL policy across both specimens, add one localized Svelte route and reciprocal specimen links, and keep the existing Ankylosaurus study protocol intact. Verify the actual exported GLB and prerendered pages as well as the existing geometry/controller checks.

**Tech Stack:** Node >=24, TypeScript, Svelte 5, SvelteKit 3, adapter-static, Paraglide, Three.js 0.186.1, Vite, existing Node assertion checks. No new runtime or test dependency is planned.

**Spec:** [Issue #16: approved scope and acceptance criteria](https://github.com/merlinbr/fieldbook-3d/issues/16). Supporting contracts: [shared-viewer design](../specs/2026-10-24-specimen-viewer-config-design.md) and [asset provenance](../../assets/stegosaurus.md). The issue is the approved feature spec; the implementation choices below are proposed for review, not an authorization to implement.

## Planning baseline and intent

Prepared on 2026-10-25 against `main` at `4633c58` (merged #15). GitHub reports #14 and #15 closed; #16 is open with no discussion comments. The intended outcome is a second discoverable specimen exhibit using the existing presentation, rather than another model preview or a new collection interface.

Graphify was queried before source exploration. Source inspection confirmed that shared region selectors, explicit study capability, specimen scale, localized numeric labels, and standalone comparison already exist. `checks/specimen-config-fixtures.mjs` demonstrates Stegosaurus membership, but is deliberately check-only with `scale: null`; it is not production exhibit data. `vite.config.ts` explicitly enumerates prerender routes, so adding the page alone is insufficient. `src/env.ts` already declares the Stegosaurus public variable; the responder and export tools already support its GLB.

The local workspace contains both GLBs and English/German Ankylosaurus audio. Availability is not verification: implementation must check that media loads and recordings are configured. `graphify-out/` is pre-existing untracked work; preserve it and exclude it from product commits. This plan does not claim any new build, interaction, or production-host verification.

## Global Constraints

- Expose `/en/specimens/stegosaurus/` and `/de/specimens/stegosaurus/` with the existing localization/static-routing conventions, title/meta description, scientific name `Stegosaurus stenops`, and a clear stylized-reconstruction note.
- Load the approved 2,976-triangle GLB from `PUBLIC_STEGOSAURUS_MODEL_URL`; use the separate local media endpoint only in development.
- No generated substitute or asset binary bundled in the app.
- Include all 19 plates even when parented beneath the head/tail, without highlighting flank scales as armor.
- Describe plate function as uncertain, not proven defense or heat regulation.
- Language links stay on the same specimen. Species navigation must not carry Ankylosaurus study playback context into Stegosaurus.
- Stegosaurus is exploration-only: no borrowed Ankylosaurus audio/captions, invented narration/cues, or misleading missing-recording error.
- Preserve the current root landing behavior rather than adding a new collection UI.
- Ankylosaurus field study remains unchanged. Its 8 m calibration, 1.7 m human reference, published cue IDs, and paused language handoff remain valid.
- No model redesign, walking animation in the exhibit, additional species, new hosting service, or recording work.
- Local export and integration can proceed. Production publication authorization, host/URL, and application-origin CORS remain unconfirmed in `docs/assets/stegosaurus.md`; local acceptance cannot establish public-release readiness.

## Decisions and evidence

### Represented length: 9 m

Configure `scale: { lengthMetres: 9 }`. This is an illustrative large-Stegosaurus length selected for comparison, not a measurement inferred from procedural coordinates, a typical-size claim, or a reconstruction of a named individual. The [NHM expert Q&A](https://www.nhm.ac.uk/discover/stegosaurus-interview-dinosaur-expert.html) reports that other Stegosaurus specimens reached up to nine metres, while Sophie was smaller and had not reached full adulthood. [AMNH's exhibit reference](https://www.amnh.org/exhibitions/dinosaurs-ancient-fossils/display-or-defense/colorful-display) also lists nine metres. Sources checked on 2026-10-25.

Use the existing calibration `factor = 9 / sourceBounds.size.x`. The documented GLB X extent is approximately 9.100000148 **model units**, not metres. Apply uniform calibration through the existing comparison; do not edit the asset or stretch individual axes. Keep the 1.7 m human. The same configured 9 must drive guide length, model calibration, combined framing, and measurement labels.

Add a visible localized scale note below the reconstruction note. English meaning: “Shown at a represented length of 9 m for comparison; this stylized model is not a measured reconstruction of a particular individual.” German must communicate the same qualification. Render the number from `stegosaurus.config.scale.lengthMetres` using the active locale rather than storing another numerical constant in prose. Existing viewer measurement messages already accept a length parameter.

### Anatomy and copy

Use stable region IDs `head`, `plates`, and `spikes`, in that order. Production selectors and initial surface anchors follow the proven fixture:

| Region | Pick, highlight, and bounds membership | Anchor node | Local anchor point |
| --- | --- | --- | --- |
| `head` | `headGroup` subtree excluding prefix `dorsalPlate_` | `headGroup` | `[-1.25, 0.14, 0.19]` |
| `plates` | Whole-model mesh prefix `dorsalPlate_` | `dorsalPlate_8` | `[0, 0.7, 0.046]` |
| `spikes` | Whole-model mesh prefix `thagomizer_` | `tailGroup` | `[3.6, 0.1, 0.7]` |

Use these as initial anchors and adjust only if browser evidence on the real GLB shows an unsuitable surface location. Keep all three selector sets explicit; no `upperSurface` rule or `tailClub` alias belongs to Stegosaurus. Head selection excludes neck plates, plates exclude torso and `skinScale_*`, and spikes include exactly four meshes. Existing nearest-surface occlusion applies.

Localize name, description, reconstruction/scale note, canvas label, and all anatomy notes in `stegosaurus.ts`, following `ankylosaurusText`. Labels: Head / Kopf; Dorsal plates / Rückenplatten; Tail spikes / Schwanzstacheln. Explain the small plant-eating head without making claims about unverified chewing mechanics. Describe bony plates with uncertain function; display and temperature regulation are hypotheses. Describe the four spikes collectively as the thagomizer, which may have helped in defense.

Support head/plate wording with the [NHM expert Q&A](https://www.nhm.ac.uk/discover/stegosaurus-interview-dinosaur-expert.html). Support the model's count reference with the [NHM Sophie release](https://www.nhm.ac.uk/press-office/press-releases/world_s-most-complete-stegosaurus-goes-on-show.html), and tentative spike-defense wording with [AMNH](https://www.amnh.org/exhibitions/dinosaurs-ancient-fossils/display-or-defense/colorful-display). Record this claim-to-source mapping in the asset document. Artistic proportions, skin details, and colors remain qualified; the count reference does not identify the model as Sophie.

### Integration approach

Use a small Stegosaurus route following the existing Ankylosaurus page. Add a compact reciprocal link below each exhibit heading, with localized “Explore Stegosaurus” / “Stegosaurus erkunden” and “Explore Ankylosaurus” / “Ankylosaurus erkunden” labels. Use `localizeHref` with literal destination paths, no copied query/hash, and `data-sveltekit-reload`. Full document navigation matches existing locale links and reliably tears down the previous viewer/audio. Keep Ankylosaurus's `changeLanguage` handler exclusively on its language links; Stegosaurus language links point directly to the same species in the chosen locale.

A shared page shell or specimen registry would add an unnecessary abstraction for two pages and risks disturbing the study-specific language handler. A second viewer would duplicate functionality already delivered in #15. Neither is planned. Existing viewer defects discovered by the acceptance matrix should receive targeted fixes and behavioral coverage, not a viewer redesign.

## File responsibilities

| File | Responsibility/change |
| --- | --- |
| New `src/lib/specimens/model-url.ts` | Pure shared implementation of the existing model-URL validation policy. |
| Modify `src/lib/specimens/ankylosaurus.ts` | Call the shared resolver; preserve all specimen/study content and behavior. |
| New `src/lib/specimens/stegosaurus-config.ts` | Environment-free `createStegosaurusConfig`, actual anatomy selectors, explicit 9 m scale, study capability `none`. |
| New `src/lib/specimens/stegosaurus.ts` | Public environment consumption, specimen metadata/config, English/German text. |
| New `src/routes/specimens/stegosaurus/+page.svelte` | Metadata, heading/context/scale qualification, locale links, shared viewer with study `none`. |
| Modify Ankylosaurus route, `src/app.css`, `messages/{en,de}.json` | Reciprocal specimen links and minimal existing-style layout/localized labels. |
| Modify `vite.config.ts` | Add the two Stegosaurus prerender entries; retain current entries. |
| New `checks/model-url.mjs`, `checks/stegosaurus-exhibit.mjs`, `checks/exhibit-pages.mjs` | URL policy, production config with regenerated GLB, and generated HTML/navigation checks. |
| Modify config fixtures, camera/scale/anatomy/study checks, `package.json` | Exercise production Stegosaurus config without duplicating its membership; retain intentionally synthetic cases. |
| Modify `.env.example`, `README.md`, `docs/assets/stegosaurus.md` | Runtime setup, four route examples, source/scale rationale, truthful hosting status and recorded verification. |

`src/env.ts`, the media responder, export tooling, generated Paraglide files, and the shared viewer need no planned feature changes. Only modify these if a demonstrated integration failure requires it.

## Review Focus

- Nonstandard loopback spelling or credentials in a configured production URL: reject consistently for either species; never replace invalid input with the development fallback (Task 1).
- Plates parented under the head/tail or sharing materials: all 19 highlight, only four spikes highlight, head excludes plates, and deselection restores original materials on the loaded GLB (Tasks 2 and 5).
- A fresh static route load or locale/species navigation during an active Ankylosaurus study: correct specimen/locale, no transferred study query or surviving audio, root unchanged (Tasks 3–5).
- A valid, repeated, or malformed incoming `study` query on Stegosaurus: consume only study context, retain unrelated query parameters, fetch no narration, show no recording warning (Tasks 3 and 5).
- Tall plates and long tail at narrow aspect ratios, after comparison/reset or reduced-motion resize: entire specimen/comparison remains framed and controls/callouts stay usable (Tasks 2 and 5).

## Task 1: Reuse the model-URL policy

**Files:** Create `src/lib/specimens/model-url.ts`, `checks/model-url.mjs`; modify `src/lib/specimens/ankylosaurus.ts`, `package.json`.

**Interfaces:** Export `resolveModelUrl(configuredUrl: string | undefined, options: Readonly<{ development: boolean; environmentVariable: string; developmentUrl: string }>): string`. It returns a normalized absolute URL or throws a diagnostic naming `environmentVariable`. Do not import environment variables in the helper.

- [ ] Add assertions covering undefined config in development versus production; explicit valid HTTP/HTTPS; malformed, relative, empty, unsupported-protocol, and credential-bearing URLs; localhost/subdomains/trailing dot, 127/8, IPv6 loopback and the mapped-loopback forms rejected by the existing policy. Include URL-normalized decimal/hex IPv4 loopback spellings. Explicit invalid values never trigger fallback. Run the same table with both species' variable names and local endpoints.
- [ ] Run `rtk proxy node checks/model-url.mjs`; expect failure because the resolver does not exist.
- [ ] Extract the current implementation from `ankylosaurus.ts` into the pure resolver without weakening its policy. Migrate Ankylosaurus to pass its existing variable, development-mode test, and local URL. Keep the production diagnostic's external-media and development-mode guidance. New Stegosaurus data will use the same resolver with `PUBLIC_STEGOSAURUS_MODEL_URL` and `http://127.0.0.1:5194/stegosaurus.glb`.
- [ ] Run the new assertions and `rtk npm run check`; expect success and zero Svelte errors/warnings. Add `check:exhibits` to run `node checks/model-url.mjs` initially; extend it in Task 2. Commit the shared policy and its check.

## Task 2: Define the production Stegosaurus anatomy and represented scale

**Files:** Create `src/lib/specimens/stegosaurus-config.ts`, `checks/stegosaurus-exhibit.mjs`; modify `checks/specimen-config-fixtures.mjs`, `checks/anatomy-regions.mjs`, `checks/scale-comparison.mjs`, `checks/viewer-study.mjs`, `package.json`. Read existing source/export helpers and camera checks before extending them.

**Interfaces:** Export `createStegosaurusConfig(modelUrl: string): SpecimenViewerConfig`. Return `id: 'stegosaurus'`, the supplied URL, the three regions specified above, `scale: { lengthMetres: 9 }`, and `study: { kind: 'none' }`. Consume existing `resolveAnatomyRegions`, `createScaleComparison`, `validateSpecimenConfig`, `resolveStudyContext`, and GLB export CLI; change none of their signatures.

- [ ] Add failing assertions for exact region IDs, explicit 9 m scale, no study targets, and valid configuration. Use the real export CLI to regenerate into a unique temporary directory, load bytes with `GLTFLoader.parseAsync`, and clean up only that directory in `finally`, following `checks/stegosaurus-export.mjs`. Do not depend on or overwrite ignored workspace media.
- [ ] Assert the loaded GLB resolves 19 plate meshes across `armorGroup`, `headGroup`, and `tailGroup`, four spike meshes, and an available head excluding plates. For pick/highlight/bounds sets, reject `skinScale_*` and torso membership in plates; require finite region bounds and existing anchors. Check 2,976 triangles as an integration invariant, leaving exhaustive export validation to the existing export check.
- [ ] Run `rtk proxy node checks/stegosaurus-exhibit.mjs`; expect the missing factory/contract assertions to fail. Implement the factory using the exact selectors/initial anchors above.
- [ ] Change the existing check-only fixture to derive from `createStegosaurusConfig(localUrl)`, explicitly overriding `scale: null` where testing unconfigured scale. Preserve check-only text and synthetic guided-target cases. Existing checks must no longer own a competing definition of Stegosaurus membership.
- [ ] Extend actual-GLB assertions with `createScaleComparison`: factor equals `9 / sourceXExtent`, guide endpoint separation is 9 within floating-point tolerance, human height is 1.7, combined bounds contain the calibrated full specimen. Fit those combined bounds with the existing camera-fit helper for desktop and portrait aspects and assert containment. Retain synthetic 8/10 m and invalid/null scale cases; do not rename synthetic 10 m tests as scientific Stegosaurus evidence.
- [ ] Exercise valid encoded Ankylosaurus, repeated, and malformed study contexts against the production Stegosaurus factory: `incoming === null`, `handoffFailed === false`. Extend `check:exhibits` to run the URL and actual-GLB checks. Run `rtk npm run check:exhibits`, `rtk npm run check:anatomy`, `rtk npm run check:camera`, and `rtk npm run check:study`; expect all assertions to pass. Commit the config and integration checks.

## Task 3: Add both localized static exhibit pages

**Files:** Create `src/lib/specimens/stegosaurus.ts`, `src/routes/specimens/stegosaurus/+page.svelte`, `checks/exhibit-pages.mjs`; modify `vite.config.ts`, `package.json`.

**Interfaces:** `stegosaurus` exports `id`, `scientificName: 'Stegosaurus stenops'`, and `config: SpecimenViewerConfig`. Export `stegosaurusText` with `en`/`de` records containing `viewerLabel`, `name`, `description`, `reconstruction`, a `scaleNote(length: string): string` formatter, and `anatomy` satisfying `AnatomyText`. The route passes `config={stegosaurus.config}`, locale `text`, and `study={{ kind: 'none' }}` to the existing viewer. Do not resolve or import Ankylosaurus recording data from Stegosaurus content.

- [ ] Add `checks/exhibit-pages.mjs` to inspect real `build/{en,de}/specimens/{ankylosaurus,stegosaurus}/index.html` and `build/index.html`. Initially assert Stegosaurus files exist; correct title, scientific name, localized description/reconstruction/scale qualification, viewer accessible name, language hrefs and `lang`/`hreflang`; no Ankylosaurus content or study/missing-recording UI in its own exhibit content. The legitimate reciprocal species link added in Task 4 is allowed. Check root's current Ankylosaurus destination.
- [ ] Run `rtk npm run build -- --mode development`, then `rtk proxy node checks/exhibit-pages.mjs`; expect failure for the absent Stegosaurus output. Write the data module and route following the decisions above. Use the shared URL resolver, `getLocale`, `localizeHref`, and existing heading/context classes. Add both explicit Stegosaurus entries to `vite.config.ts` while retaining `/` and both Ankylosaurus entries.
- [ ] Give Stegosaurus direct reload locale links to its own path. Keep the current page indication and visible keyboard focus. Render the scale note from the config's value; use generic existing localized loading/error/retry/WebGL messages and the species-specific canvas label.
- [ ] Add script `check:exhibit-pages` as `node checks/exhibit-pages.mjs`, explicitly documented to run after a build. Run `rtk npm run check`, the development-mode static build, and `rtk npm run check:exhibit-pages`; expect zero Svelte errors/warnings and passing file/content checks. Runtime-generated anatomy controls and measurement overlays must be checked in Task 5, not falsely inferred from prerendered HTML. Commit the localized pages and static checks.

## Task 4: Connect the two exhibits without transferring study state

**Files:** Modify both specimen routes, `messages/en.json`, `messages/de.json`, `src/app.css`, and `checks/exhibit-pages.mjs`.

**Interfaces:** Add message keys `exploreStegosaurus` and `exploreAnkylosaurus` with the labels specified above. Each route renders one reciprocal anchor using `localizeHref('/specimens/<other-species>/')`, `data-sveltekit-reload`, and a small `specimen-navigation` wrapper below its heading. No new registry, navigation controller, or shared study API.

- [ ] Extend built-page assertions: each species/locale has the exact reciprocal destination in that locale, the species link has no query/hash, and it is marked for document reload. Locale hrefs retain the current species; root's destination remains unchanged. Run the page check against Task 3 output and confirm the missing links fail.
- [ ] Add links and localized labels. Apply minimal spacing/wrapping styles using the existing palette, typography, and focus styles; preserve practical touch target size. Do not attach `changeLanguage` or `prepareLanguageLink` to species links, and do not clone the current location's query parameters. Keep Ankylosaurus's existing locale handler intact.
- [ ] Run `rtk npm run check`, the development-mode static build, and `rtk npm run check:exhibit-pages`; expect passing assertions. Task 5 verifies teardown, audio, actual navigation and focus in the browser. Commit the discovery links.

## Task 5: Verify the real GLB and browser behavior

**Files:** Existing viewer/interaction/scale files and their matching checks only if a reproduced failure requires a fix; ignored evidence under `media-dev/issue16-verification/`. Summarize actual outcomes in Task 6's asset document.

**Interfaces:** Use the existing viewer controls and public routes. Browser acceptance adds no permanent debug route, procedural fallback, fake study recording, or runtime test hook.

- [ ] Regenerate the local GLB with `rtk npm run export:stegosaurus`; run `rtk npm run check:stegosaurus`, `rtk npm run check:stegosaurus-export`, and `rtk npm run check:media`. Preserve existing Ankylosaurus media/configuration and verify approved recording metadata is available for its study smoke.
- [ ] Start the separate responder with `rtk npm run media:dev`, build with `rtk npm run build -- --mode development`, and serve the actual static build using `rtk npm run preview -- --host 127.0.0.1`. Use the printed port. Keep server lifetimes managed and reuse appropriate existing processes rather than terminating unrelated ones.
- [ ] Directly load and refresh all four localized specimen URLs plus `/`. Inspect document metadata and browser accessibility state; verify all Stegosaurus runtime status, region controls, callouts, measurement labels and instructions in English and German. Distinguish expected reciprocal-link wording from wrong-species exhibit copy.
- [ ] On the HTTP-loaded GLB at desktop 1440×900 and narrow 390×844, orbit through side, opposite-side and three-quarter views. Record screenshots showing plate separation, skin/facial details, colors/faceting, full tail and tall plates. Use pointer, keyboard-only anatomy buttons/Enter/Space/Escape, and touch-emulated tap versus drag/pinch. Check no pick-through, no flank activation, correct highlights, clear focus return, usable docked callouts and no horizontal overflow. Record emulation honestly; it is not physical-device testing.
- [ ] Toggle comparison on/off, inspect each anatomy region during comparison, reset, resize in both orientations, and repeat with reduced motion enabled. Confirm 9 m specimen/guide and 1.7 m human, complete comparison framing, stable anchors and preserved selection/reset behavior. Compare to ordinary exploration framing.
- [ ] With browser request logging active, open Stegosaurus directly with a real encoded Ankylosaurus study query; repeat with malformed and repeated values plus `?keep=1`. Verify only study parameters are removed, unrelated parameters survive, no audio/recording request is made, and no study startup/control/caption/readiness warning appears. A source-code assertion alone is insufficient evidence.
- [ ] In each Ankylosaurus locale, smoke normal inspection/comparison and Meet → Scale → Armor → World playback with captions and chapter controls. Exercise English/German language handoff during playback and confirm paused restoration. Then navigate via the species link while study audio is playing: audio stops, Stegosaurus loads in the same locale without study query/state, and navigating back starts an ordinary Ankylosaurus exhibit. Repeat Stegosaurus locale switches and modified-click/new-tab links.
- [ ] Exercise delayed model delivery (loading), intercepted failed GET (fetch/CORS-equivalent browser rejection), retry after recovery, and genuinely unavailable WebGL in a fresh browser context. Verify localized usable diagnostics, successful retry where applicable, accessible navigation without a canvas, and no fallback dinosaur. If testing a real misconfigured CORS host is unavailable, distinguish interception from real host CORS verification.
- [ ] Fix only reproduced integration defects, adding the failing behavior to the owning check before changing logic where practical. Repeat affected checks and browser cases after each fix. Capture exact commands, browser/version, viewports, observations and screenshot paths; list any untested prerequisite instead of marking it passed.

## Task 6: Document setup and close local acceptance truthfully

**Files:** Modify `README.md`, `.env.example`, `docs/assets/stegosaurus.md`; final check scripts only if evidence identifies a coverage gap.

- [ ] Update current README sections to describe two exhibits and four URLs; retain historical milestones as historical. Explain exploration-only Stegosaurus, its three anatomy regions, 9 m represented comparison, language/species navigation, and unchanged root behavior. Remove current statements that the runtime does not consume Stegosaurus's variable or has no route/scale choice.
- [ ] Update `.env.example` comments from “reserved” to consumed runtime configuration; retain the separate development endpoint. Show that a production static build now requires **both** real model URLs because both routes prerender. Provide PowerShell and POSIX examples with placeholder hosts clearly labelled as examples, never deployed addresses.
- [ ] Add the dated scale rationale and claim/source mapping to `docs/assets/stegosaurus.md`, distinguish raw model bounds from calibration, and preserve original provenance/export evidence. Record this ticket's new observations separately. Keep publication rights/host/URL/CORS status explicitly unresolved unless independently confirmed; do not imply issue #14's closure resolved those external prerequisites.
- [ ] Run final validation once: `rtk npm run check`, `rtk npm run check:exhibits`, `rtk npm run check:camera`, `rtk npm run check:anatomy`, `rtk npm run check:study`, `rtk npm run check:stegosaurus`, `rtk npm run check:stegosaurus-export`, `rtk npm run check:media`, `rtk npm run build -- --mode development`, and `rtk npm run check:exhibit-pages`. Expect zero Svelte errors/warnings, passing assertions and all five intended static pages.
- [ ] Verify missing/invalid production URL policy without touching the user's ignored `.env`: pure resolver tests cover both species; for a full expected-failure production build, use an isolated temporary checkout/configuration. A successful build with example external addresses would establish only configuration handling, not reachability or deployment.
- [ ] Inspect `build/` for bundled GLB/audio binaries, procedural `createLowPolyStegosaurus`/export tooling, temporary fixtures or debug routes. The runtime should reference external model URLs, with no Stegosaurus recording configuration. Run `rtk git diff --check` and `rtk graphify update .` after implementation; preserve graph outputs outside product commits. Commit documentation and any final verified fixes using explicit paths.
- [ ] Review the resulting branch against every issue acceptance item. Report passing local acceptance separately from any production-publication limitation; include real browser evidence and unresolved checks. Do not close the issue or publish assets merely because this plan exists.

## Acceptance coverage and execution handoff

| Issue acceptance | Owning tasks |
| --- | --- |
| Both direct/refresh localized URLs, metadata and species-correct accessible/runtime copy | 3, 5 |
| Same-species locale links, reciprocal species links, no study leakage, root preserved | 3, 4, 5 |
| Three regions, nineteen plates/four spikes, pointer/keyboard/touch, usable callouts | 2, 5 |
| Loading/fetch failure/retry/WebGL states, no substitute | 1, 3, 5 |
| Approved real-GLB appearance and full camera fit | 2, 5 |
| Sourced scale, consistent calibration/guide/human, reduced motion/resize | 2, 3, 5, 6 |
| No Stegosaurus narration; Ankylosaurus study and locale regression smoke | 2, 4, 5 |
| Behavioral/type/build/static-preview checks and real browser evidence | 1–6 |
| Setup/assets/environment/routes/reconstruction sources; unresolved host prerequisite | 6 |

Recommended execution: **Native**, with the tasks implemented sequentially in the current session after plan review. They share a small set of data/route contracts, and the browser acceptance matrix provides more value here than parallel implementation. A final independent review can be requested at execution time. Planning does not start implementation, publish to GitHub, or mark acceptance steps complete.

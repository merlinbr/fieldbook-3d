# Task 4 implementation report

## Changes

- Added the localized Armor chapter label and chapter-status selection, then committed that code and the delivered-scope README paragraph in `fe6da6d` (`feat: label armor study chapter (#3)`).
- Added the controller-supplied Armor acceptance record to README in `63f5f01` (`docs: record armor chapter acceptance (#3)`).
- In this correction, documented repeat-Start evidence and the specific inspection/layout limits supplied by the controller.
- Did not modify viewer logic, checks, narration files, or the plan document in this correction. README acceptance text is limited to the controller-supplied observations and stated limits; it does not imply broader testing.

## Controller-supplied evidence used

- Multiple Start runs on the same page began at Meet; no World-chapter presentation appeared. The study ended at the World boundary back in Explore.
- The observed layout matrix was English at 1365×768, German at 1024×768, and English phone at 390×844 at 100% and 200% root text. The complete three-width × two-language × two-text-size matrix was not repeated.
- During paused Armor inspection, the named Armor, Head, and Tail club note buttons were used. Pointer picking, nearest-hit occlusion, and keyboard/Escape focus behavior were not re-exercised; the delivered picking behavior is covered by `npm run check:anatomy` and the 2026-10-05 acceptance.
- Other acceptance evidence and explicit limits are recorded in the 2026-10-21 README acceptance section. No claims beyond the controller-supplied facts were added.

## Checks

Checks run directly for the label/scope implementation:

- `npm run check` — passed, 0 errors and 0 warnings; ran the existing Paraglide generation and Svelte checks.
- `npm run build -- --mode development` — passed and wrote the static site. The existing large-chunk warning and the `NO_COLOR`/`FORCE_COLOR` warning remained.

The controller reported that, after acceptance fixes, `npm run check`, `npm run check:camera`, `npm run check:anatomy`, `npm run check:study`, and `npm run build -- --mode development` all passed; the build retained the existing large-chunk and `NO_COLOR`/`FORCE_COLOR` warnings. These are recorded as controller-reported results, not checks rerun for this correction.

## Files changed

- `README.md` — delivered scope paragraph and observed Armor acceptance, including repeat-Start evidence and clarified limits.
- `messages/en.json` — `studyChapterArmor` English label.
- `messages/de.json` — `studyChapterArmor` German label.
- `src/lib/viewer/SpecimenViewer.svelte` — selects the Armor label alongside Meet and Scale.
- `.superpowers/sdd/2026-10-21-armor-tail-club-chapter/task-4-report.md` — this report.

## Remaining limits

- Acceptance used headless Chromium viewport/text-size emulation, not physical devices or a screen-reader session.
- Exit during buffering or active Retry and pause exactly at the Armor-to-tail-club cue boundary were not exercised.
- Pointer picking, nearest-hit occlusion, and keyboard/Escape focus behavior were not re-exercised during paused Armor inspection.
- The full three-width × two-language × two-text-size matrix was not repeated.
- Dimming versus guided lighting was not isolated pixel-by-pixel; production hosting and model publication rights were not verified.

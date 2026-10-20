# Task 1: Timeline extension through Armor

## Changes

- Extended `StudyFrame` with `armor` chapter support, an `armor`/`tailClub` region, and region progress.
- Replaced Scale-only cue lookup with `requireCue(version, view)`, which selects a cue overlapping the chapter corresponding to its view.
- Extended frame evaluation through `version.chapters[3].start`; the chapter boundary and tail-club transition are derived from the resolved version and cue data.
- Kept Meet/Scale region values at `armor`/0. Armor selects `tailClub` at its cue start and smoothsteps region progress over `min(0.75, cue duration)`, holding at 1 afterward.
- Updated controller frame initialization/copies and the delivered endpoint so composed frames retain all four fields and playback ends at World start.
- Extended `checks/field-study.mjs` with Armor boundaries, transition/ramp/hold assertions, endpoint rejection, Armor seek reconstruction, pause/resume, retry, and Exit cancellation coverage. Existing Meet/Scale assertions remain.

No study data, narration files, or viewer files were changed.

## TDD evidence

The required pre-implementation `npm run check:study` run failed on the new Meet-frame assertion because the old evaluator left the new region fields unchanged:

```text
AssertionError [ERR_ASSERTION]: Expected values to be strictly deep-equal:
+ actual - expected
  {
    chapter: 'meet',
+   region: 'tailClub',
+   regionProgress: -1,
-   region: 'armor',
-   regionProgress: 0,
    scaleProgress: 0
  }
    at checks/field-study.mjs:81:8
```

After implementation, `npm run check:study` passed:

```text
Study timeline, calibrated geometry, projection, and lifetime assertions passed.
Study metadata boundaries, audio authority, retry, and cancellation assertions passed.
```

No full `npm run check` was run; it is deferred to Task 3 as directed by the brief.

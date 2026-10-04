# Ankylosaurus English narration intake

## Status and ticket boundary

The user approved the complete English script unchanged and selected ElevenLabs instead of the initial Inworld recordings. The selected voice is **Rowan — Gentle, Soft-Spoken & Warm**, ID `kLhAstPcnnPxqzk6gS5i`; the user reported **Eleven v4** for the selected workflow (the MP3 does not independently identify its engine). The user supplied a current **Starter** subscription screenshot, regenerated all four segments in `media-dev/en/` after activation, and confirmed generation on **2026-10-04** after Starter activation. The owner then listened to all four regenerated segments again and approved pronunciation, unchanged wording, and pacing: **“yeah just listened again to all and it sounds good to me.”** The complete aligned version is now source-controlled and configured locally; real narrated **Meet** acceptance passed in the built static exhibit. This is not acceptance of later four-chapter playback or production model hosting.

Issue #1 implements **Meet only**, ending when the `scale` chapter starts. Supply and describe the **full four-chapter recording**, not a shortened Meet clip. Later chapters' playback, geometry, navigation, and German recordings are outside this ticket. The German interface uses visibly labeled English narration and English captions from this same version.

## Export and local delivery

1. Export the approved full English narration as MP3, 30–60 seconds inclusive. Use clear, calm museum-guide delivery with pauses between ideas, no background music, and intelligible pacing. Audition the whole recording, especially **Ankylosaurus**, **osteoderms**, and **Cretaceous**. If the unchanged script does not fit, adjust delivery or obtain explicit approval for wording changes; do not omit chapters or rush unintelligibly.
2. Place the export at **`media-dev/ankylosaurus-en.mp3`**. This directory is ignored; never commit the audio, source recording, model, or textures, and never copy them into app static/build output.
3. Run `npm run media:dev` separately from the app. The optional fixed audio endpoint is **`http://127.0.0.1:5194/ankylosaurus-en.mp3`**; the existing model remains at `http://127.0.0.1:5194/ankylosaurus.glb`. Missing audio returns 404, not generated or silent substitute media.
4. The local host streams only those two fixed paths, without directory listing or arbitrary file access. It serves `audio/mpeg`, GET and HEAD, byte ranges (closed, open-ended, and suffix), 206/416, `Accept-Ranges: bytes`, and CORS range/length exposure and OPTIONS. HEAD reports the whole representation without a body; Range applies to GET. Multiple or malformed ranges are rejected with 416. Production hosting must independently provide the correct content type, seeking, and CORS behavior; local success is not production-host verification.

Audio is loaded on demand after Start, not on page load. Production URLs must be public credential-free HTTP(S) URLs outside the app build. Do not use URL user/password, signed query credentials, API keys, private tokens, or secrets in public configuration.

## Regenerated ElevenLabs recording — received 2026-10-04

Current sources are the four originals in **`media-dev/en/`**, not the root-level Inworld segments or earlier `-alternative` ElevenLabs exports. All four are mono MP3, 44,100 Hz, 128 kbit/s. The combined file is `media-dev/en/ankylosaurus-en.mp3`, also selected at the existing delivery path **`media-dev/ankylosaurus-en.mp3`**. All original recordings remain untouched; the former root-level full Inworld track is preserved as **`media-dev/ankylosaurus-en-inworld.mp3`**.

The current full track is **51.643938 seconds** according to both `ffprobe` and native Chromium, 826,348 bytes, SHA-256 **`9232493bd36de7efb659efd5b5af75cf7e7f637fadc6fcde75ad3673bf046076`**. Compressed-packet timing totals 51.644081633 seconds; the observed sub-millisecond duration difference is well within the existing 0.25-second validation tolerance.

| Source in `media-dev/en/` | Audio packets | Packet duration (seconds) | Start in full track (seconds) |
| --- | ---: | ---: | ---: |
| `ankylosaurus-en-meet.mp3` | 522 | 13.635918367 | 0 |
| `ankylosaurus-en-scale.mp3` | 384 | 10.031020408 | 13.635918367 |
| `ankylosaurus-en-armor.mp3` | 589 | 15.386122449 | 23.666938776 |
| `ankylosaurus-en-world.mp3` | 482 | 12.591020408 | 39.053061224 |

Assembly used FFmpeg's concat demuxer in Meet/Scale/Armor/World order with `-c:a copy -map_metadata -1 -write_xing 0`, without re-encoding or trimming. The temporary concat list was removed afterward. A packet-by-packet SHA-256 and duration comparison proved that the combined track preserves **all 1,977 compressed audio packets in the original order**. These chapter starts are freshly measured segment boundaries, **not** reusable Inworld/earlier-alternative timings or completed speech/caption/visual alignment. Meet ends at the new Scale boundary, 13.635918367 seconds.

Preliminary standalone checks: full FFmpeg decode passed without errors. The existing responder on isolated port 5195 returned the exact new MP3 bytes with `audio/mpeg`, GET/HEAD 200, exact closed/open/suffix ranges 206, invalid range 416, and CORS OPTIONS 204. A temporary native audio element on the built static English page played, paused/seeks to each new chapter boundary, and resumed World past 39.5 seconds; Chromium reported duration 51.643938 and media HTTP 206. That separate element did not exercise Field Study; the integrated real Meet acceptance below supersedes its readiness gate.

Generation date and paid-plan timing are owner-confirmed: **all four current segments were generated on 2026-10-04 after Starter activation**. Non-secret evidence reference: **owner-supplied Starter subscription screenshot and generation confirmation in the implementation conversation, 2026-10-04**; keep the screenshot and billing details private. [ElevenLabs publishing guidance](https://help.elevenlabs.io/hc/en-us/articles/13313564601361-Can-I-publish-the-content-I-generate-on-the-platform) permits commercial use for paid-subscription generations and does not retroactively license earlier free-tier output. [Starter pricing](https://elevenlabs.io/pricing) includes a commercial license. Applicable [Terms of Service](https://elevenlabs.io/terms-of-use) ([EEA/UK/Swiss variant](https://elevenlabs.io/terms-of-use-eu)), sections 1(c) and 4, permit paid commercial use and downloaded output subject to the [Prohibited Use Policy](https://elevenlabs.io/use-policy), necessary input rights, and supplemental terms. The [Voice Library Addendum](https://elevenlabs.io/vla), sections 2 and 4, covers shared voice access and continued use of already-generated output. These standard paid-output terms do not impose the free-tier attribution rule; nevertheless credit **“English narration generated with ElevenLabs; Rowan — Gentle, Soft-Spoken & Warm.”** [Eleven v4](https://elevenlabs.io/v4) is publicly offered through the application/API without a beta designation on the reviewed product page; [Beta Services](https://elevenlabs.io/bsa) remain excluded from production/commercial use. Reviewed 2026-10-04; account-only voice restrictions were not independently inspected. Owner-authorized generation, not an unauthenticated voice API response or the application's MIT license, is the access/provenance basis.

## Aligned version and real Meet acceptance

Canonical public metadata: **[`ankylosaurus-narration.en.json`](ankylosaurus-narration.en.json)**, ID `ankylosaurus-en-2026-10-04-rowan-9232493bd36d`. This is the actual approved recording's data, not a synthetic example: four chapter starts, five visual intervals, 16 English captions, native-compatible duration, configurable HTTP(S) URL, and non-secret provenance.

Chapter starts were measured from the ordered MP3 packet counts above. Local CPU speech alignment used `faster-whisper` 1.2.1 / `base.en` to estimate spoken-word onsets against the exact assembled MP3; no audio was uploaded for transcription and no application dependency was added. Captions preserve the approved text exactly, use those word onsets, and end 0.20 s after each final aligned word for a short readable hold. The armor→tailClub cue changes at **31.44 s**, the measured “At the end of its tail…” onset. Full duration **51.643938** uses the native/ffprobe value rather than extending the final cue to the sub-millisecond larger packet-sum value. Owner audition, not ASR spelling, is the pronunciation/wording/pacing approval.

Actual built-exhibit evidence is recorded in [README](../../README.md#observed-real-narrated-meet-acceptance): native playback/default caption transitions, all paused anatomy notes and manual controls, resume composition before audio advance, real seeking/caption choice, pixel-identical saved-view restoration after Exit/resize and natural completion, actual nonzero HTTP/network failure plus exact-position paused Retry, wrong-recording duration rejection, full-document navigation, persisted BFCache restart, and actual WebGL context loss. The EN/DE real-caption matrix passed all three widths at 100%/200% text size. Only Meet was played by Field Study; later recording parts/cues remain metadata for later tickets.

## Configure the approved recording

The local ignored `.env` is already configured. For a fresh checkout, supply the ignored media files and serialize the **entire** canonical version into `PUBLIC_ANKYLOSAURUS_STUDY_VERSION`. In PowerShell, from the repo root:

```powershell
$env:PUBLIC_ANKYLOSAURUS_STUDY_VERSION = Get-Content -Raw .\docs\assets\ankylosaurus-narration.en.json
npm run dev
```

Run `npm run media:dev` in the separate media terminal first. The version uses the normal **5194** audio endpoint. If an older responder is already running, restart that process so the updated MP3 route is loaded; the existing user-owned workspace process still returned MP3 404 during verification and was deliberately left untouched. Acceptance used a fresh isolated **5195** host, then normal configuration/build were restored. Do not publish either loopback URL. For deployment, configure rights-cleared external model/audio URLs and a new complete deployment version identity before building; preserve the approved script/timings unless the recording changes.

Limits: local static Chromium, viewport/text-size emulation, no physical-device/screen-reader or production-CDN verification. Natural tab backgrounding was not reliably representable in the managed browser; visibility pause/no-auto-resume passed by fault injection and the regression check. Private billing evidence was not copied, account-only voice restrictions were not independently inspected, and model publication rights remain unresolved.



## Superseded Inworld intake — received 2026-10-04

Original segment files remain untouched in ignored `media-dev/`. All four are mono MP3, 48,000 Hz, 128 kbit/s. `ffprobe` and the final native Chromium audio element agree on a **48.672-second** full track, within the required 30–60 seconds.

| Segment file | Duration (seconds) | Start in assembled track (seconds) |
| --- | ---: | ---: |
| `ankylosaurus-en-meet.mp3` | 12.552 | 0 |
| `ankylosaurus-en-scale.mp3` | 9.504 | 12.552 |
| `ankylosaurus-en-armor.mp3` | 14.688 | 22.056 |
| `ankylosaurus-en-world.mp3` | 11.928 | 36.744 |

These are measured **segment boundaries**, not invented pacing targets or auditioned word/caption timestamps. The Meet interval ends at 12.552 seconds. Word boundaries and the armor-to-tail-club visual cue still require alignment against the actual speech; no completed study-version JSON or placeholder provenance has been configured.

The initial assembled **`media-dev/ankylosaurus-en.mp3`**, now preserved as **`media-dev/ankylosaurus-en-inworld.mp3`**, is 778,797 bytes, SHA-256 `39431a32707190666ae7d410af24bf6b46fe7fa350a0f536afa49d1f77d94424`. The historical assembly used the existing matching MP3 formats, without re-encoding, trimming, adding silence, or changing segment order:

```sh
ffmpeg -hide_banner -n -i "concat:media-dev/ankylosaurus-en-meet.mp3|media-dev/ankylosaurus-en-scale.mp3|media-dev/ankylosaurus-en-armor.mp3|media-dev/ankylosaurus-en-world.mp3" -map 0:a:0 -c:a copy -map_metadata -1 -write_xing 0 media-dev/ankylosaurus-en.mp3
```

`-n` refuses to overwrite an existing assembled file. The hash identifies these exact bytes, not the voice or its rights; any changed export/alignment needs a new recording-version identity.

Observed intake checks: FFmpeg decoded the full file without errors. The existing media responder, isolated on port 5195, returned matching MP3 bytes with `audio/mpeg`, GET/HEAD 200, exact closed/open/suffix ranges with 206, an out-of-bounds range with 416, and CORS OPTIONS 204. A temporary native audio element on the built static English page requested no audio before its explicit Play click, then played past 0.75 seconds without a media error, paused/seeks to 36.744 seconds, and resumed past 37 seconds. Its cross-origin media request returned 206 and duration was exactly 48.672 seconds. The temporary element/tab and hosts were removed/stopped; no media was copied into static output.

This proves actual file decoding, native playback/seek, and local HTTP delivery, **not** audible wording/pronunciation approval, caption synchronization, or playback through the exhibit's Field Study controls. The static exhibit still disables Start because complete approved metadata/provenance has not been configured. Obtain the owner's exact voice identity, actual generation date, applicable rights/attribution, non-secret reference to retained paid-plan evidence, and pronunciation/pacing audition confirmation before completing intake.


## Complete build-time version schema

`PUBLIC_ANKYLOSAURUS_STUDY_VERSION` contains a JSON object serialized as one build-time environment value. It is **metadata, not an audio URL alone**, and is publicly readable in the built application. Missing configuration leaves Start disabled; invalid/incomplete metadata does not enable playback. The [approved canonical JSON](ankylosaurus-narration.en.json) supplies the actual regenerated recording's measured timings and provenance; it is not fabricated example data.

The complete shared shape is:

```ts
{
  id: string;
  language: 'en';
  url: string;
  duration: number;
  chapters: [
    { id: 'meet'; start: number },
    { id: 'scale'; start: number },
    { id: 'armor'; start: number },
    { id: 'world'; start: number }
  ];
  cues: Array<{
    start: number;
    end: number;
    view: 'hero' | 'scale' | 'armor' | 'tailClub' | 'world';
  }>;
  captions: Array<{ start: number; end: number; text: string }>;
  provenance: {
    voice: string;
    generated: string;
    terms: string;
    attribution: string;
    paidPlanEvidence: string;
  };
}
```

This is schema notation, **not JSON to paste into configuration**. All fields are required. The actual project-owned non-secret metadata is source-controlled in `ankylosaurus-narration.en.json`; serialize that complete object into the build-time environment value. Use a new stable `id` whenever the recording or its aligned metadata changes; never quietly replace media under an unchanged recording identity.

- `id`: nonempty recording-version identity. `language` is exactly `en` for this ticket.
- `url`: absolute HTTP(S) audio URL, without credentials or likely query credential tokens. The local URL above is usable only after supplying the export. Production must not point visitors at localhost.
- `duration`: finite actual-compatible full-recording duration in seconds, between 30 and 60 inclusive. Loaded audio must agree within **0.25 seconds**; a larger difference is a study-data error, not permission to stretch cues.
- `chapters`: exactly the four IDs in the order shown, with finite strictly increasing starts inside the recording. `meet.start` is exactly zero. The `scale` start ends this ticket's Meet playback.
- `cues`: nonempty ordered, non-overlapping intervals with finite `0 <= start < end <= duration`. The first cue begins at zero with `view: 'hero'`. Use the documented view IDs, including camel-case `tailClub`. Keep cues within the actual loaded recording's bounds as well as authored duration.
- `captions`: nonempty ordered, non-overlapping intervals with finite `0 <= start < end <= duration` and nonempty English text matching the approved spoken wording. Caption intervals are **start-inclusive, end-exclusive**; gaps show no caption. Keep caption segments readable and recording-aligned, not mechanically divided by character count.
- `provenance`: all five fields are nonempty public strings, as described below. They are evidence metadata, not credentials and not proof merely because a parser accepts them.

Listen to the supplied audio to mark all four chapter starts, every caption boundary, and each view cue. Derive them by audition/waveform alignment, **not** by dividing script text or adopting the design's approximate pacing targets. Match scale to the size explanation, armor to osteoderms, tailClub to the club introduction, and world to the time/location explanation. Include every chapter and its relevant cues/captions even though only Meet plays in this ticket. Re-audition boundaries against the exact final export after any recording edit.

## Public provenance and private evidence

Record these facts only when available; do not invent voice identity, dates, or rights assertions:

- `voice`: provider and exact voice identity/name, with any non-secret voice/version reference needed to identify the export.
- `generated`: actual generation/recording date (and export/version details when useful).
- `terms`: relevant provider/voice terms URL and applicable dated restrictions or permissions for this recording.
- `attribution`: the required attribution wording, or an explicit evidence-backed statement that none is required.
- `paidPlanEvidence`: a non-secret reference to retained paid-plan/commercial-use evidence applicable at generation time, including sufficient public context to explain the rights basis. Keep invoices, account details, billing screenshots, and other private evidence outside the public repository.

Do not include ElevenLabs/API credentials, session tokens, signed media links, payment details, or private billing documents anywhere in public version JSON. There is no runtime voice-generation integration. MIT source licensing does not grant rights to the narration or model. Recording rights must be documented for this ticket. Model publication rights/scientific accuracy remain unresolved; verify publication rights before public model hosting.

## Approved English script — unchanged

### `meet` — Meet Ankylosaurus

Meet Ankylosaurus. With its broad body, bony armor, and heavy tail club, this dinosaur looks formidable. But it did not hunt other dinosaurs. It ate plants.

### `scale` — A sense of scale

An adult could reach roughly eight metres long. The person beside it gives you a sense of that size. This length is an estimate from fossils.

### `armor` — Built-in armor

Bony plates called osteoderms formed within its skin. They probably helped protect it like a suit of armor. At the end of its tail was a heavy bony club. Scientists think Ankylosaurus could swing it to strike an attacker.

### `world` — Its ancient world

Ankylosaurus lived in what is now North America, around sixty-eight to sixty-six million years ago, near the end of the Cretaceous Period. Now take a closer look for yourself.

Source: [approved study design](../superpowers/specs/2026-10-04-guided-field-study-design.md), English script. [Meet implementation plan](../superpowers/plans/2026-10-04-meet-introduction.md) limits this delivery to issue #1 and records the user's unchanged-script approval.

## Acceptance after supply

Verify the actual full recording's duration, words, pronunciation, pacing, chapter/caption/cue alignment, provenance, and rights. Then exercise real Meet playback, pause/inspection/resume, natural completion at scale, Exit restoring the saved view, and clearly labeled English captions in both interfaces. Also exercise the actual media host's GET/HEAD/ranges, missing-file response, CORS, and load/seek failures. Record only observations actually performed; neither schema checks nor a synthetic fixture proves real narrated acceptance.

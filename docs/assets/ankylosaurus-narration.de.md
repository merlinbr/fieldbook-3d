# German narration — issue #6

The user explicitly approved the complete German script in [issue #6](https://github.com/merlinbr/fieldbook-3d/issues/6), Rowan voice access, and the language-handoff approach before generation on **2026-10-22**. The script remains unchanged, including the qualifications about armor protection and inferred tail use. Static reconstruction notices remain in both documents.

## Selected recording and audition

The selected voice is **Rowan — Gentle, Soft-Spoken & Warm**, ID `kLhAstPcnnPxqzk6gS5i`, verified through the signed-in voice picker's Copy voice ID control. The interface identified **Eleven v4**, stability 50%, similarity 75%, clone strength 0%, MP3 44.1 kHz/128 kbit/s. The account showed an active **Starter** plan before generation. No subscription purchase or upgrade was performed.

The four approved paragraphs were generated separately. Meet, Scale, and Armor use Generation 1. After hearing the first assembled recording, the owner identified an English-style pronunciation of Ankylosaurus at 0:40–0:41 and said **“The rest is pretty good.”** World was regenerated with an explicit German language override. The owner rejected the first revision, then listened to the current Generation 2 and said **“I think Generation 2 is almost fine now.”** That Generation 2 was exported through the selected audio player's Download Audio control and is the selected World segment. This records the owner's actual assessment; it does not claim a flawless native-German pronunciation or an independent audible audition by the agent. English remains the previously owner-auditioned and approved 2026-10-04 recording.

A pronunciation-only spelling `Ankylo-sau-rus` was explored in the editor during correction. The final selected player's text and the canonical script/captions retain **Ankylosaurus**. The selected bytes and hash below, rather than a spelling experiment or export filename alone, identify the delivery.

The originals and superseded World takes stay outside Git in ignored local media. Existing older root-level German Meet media was not used or overwritten.

| Selected file in `media-dev/de/` | MP3 packets | Packet duration (s) | Start in full track (s) |
| --- | ---: | ---: | ---: |
| `ankylosaurus-de-meet.mp3` | 528 | 13.79265306122449 | 0 |
| `ankylosaurus-de-scale.mp3` | 375 | 9.795918367346939 | 13.79265306122449 |
| `ankylosaurus-de-armor.mp3` | 648 | 16.92734693877551 | 23.588571428571427 |
| `ankylosaurus-de-world.mp3` | 455 | 11.885714285714286 | 40.51591836734694 |

The full selected file is **`media-dev/ankylosaurus-de.mp3`**, also retained in `media-dev/de/`. It is mono, 44,100 Hz, 128 kbit/s, **52.4015 seconds**, **838,469 bytes**, SHA-256 **`fbcb618c1fab8ecb07c1a9b1cbbf84ce4f23be5ef438ee433a971e0f2d048cb9`**. FFmpeg decoded the complete track without errors. Assembly used the concat demuxer with `-c:a copy -map_metadata -1 -write_xing 0`, with no re-encoding, speed change, trimming, or synthetic silence. Chapter starts use packet durations and the stream time base, rather than rounded display durations. The metadata's final endpoint uses the measured full-file duration.

## Alignment

The [complete German version](ankylosaurus-narration.de.json) contains independent chapters, five visual cues, and 18 captions. It is not a translation attached to English timestamps. English lasts **51.643938 s**, with Scale/Armor/World beginning at **13.635918367346939 / 23.666938775510204 / 39.053061224489795 s**; German lasts **52.4015 s**, with the independently measured starts above.

Local CPU alignment used the existing **faster-whisper 1.2.1**, multilingual **base** model, German language selection and word timestamps against the exact final assembled track. Caption text preserves the approved script rather than ASR spelling mistakes. Caption chunks follow phrases/word onsets, with brief readable holds after final words. The tail-club cue begins at the measured **31.56 s** onset of “Am Schwanzende…”. FFmpeg silence detection checked the pause before “Sie schützten…” and placed its caption at **28.68 s**. Owner audition establishes the pronunciation/pacing assessment; ASR is timing evidence, not a substitute for hearing the recording.

The user authorized sending `media-dev/ankylosaurus-de.mp3` to ElevenLabs Speech to Text, but its browser upload control did not open a file chooser. Alignment instead ran locally; no audio was uploaded for transcription and no application dependency was added. The local model/cache and raw alignment output remain ignored.

## Configure and serve

Serve the real file separately with `npm run media:dev`. The fixed German endpoint is `http://127.0.0.1:5194/ankylosaurus-de.mp3`; English and model endpoints are unchanged. The host provides the existing GET/HEAD, range and CORS behavior for all three fixed paths. It exposes no arbitrary files or directory listing.

Serialize the complete JSON into **`PUBLIC_ANKYLOSAURUS_STUDY_VERSION_DE`**, retaining English in **`PUBLIC_ANKYLOSAURUS_STUDY_VERSION`**. Both are public build-time data:

```powershell
$env:PUBLIC_ANKYLOSAURUS_STUDY_VERSION = Get-Content -Raw .\docs\assets\ankylosaurus-narration.en.json
$env:PUBLIC_ANKYLOSAURUS_STUDY_VERSION_DE = Get-Content -Raw .\docs\assets\ankylosaurus-narration.de.json
npm run build -- --mode development
```

An absent/blank German value selects the entire English version while keeping German interface text and visibly identifying English narration. Malformed configured German metadata disables Start with an explanation. A configured recording's network failure presents Retry/Exit; it never silently switches recordings. Only the selected recording is requested, after Start or a valid handoff. Keep distinct version IDs, and change the identity whenever recording bytes or aligned metadata change. Actual duration must match within 0.25 s, and all intervals must remain bounded by the loaded recording.

Loopback URLs are for local static acceptance. Production needs separately hosted, rights-cleared, credential-free HTTP(S) media URLs; no recording/model/font binaries belong in Git or application output. No voice API, API key, billing document, preference store, or runtime generation is included.

## Rights and provenance

The non-secret evidence reference is the Starter-plan observation before generation and the user's explicit approval in the 2026-10-22 implementation conversation. An attempted account screenshot was rejected by automatic approval review; no private account/billing screenshot was retained. The provenance metadata does not claim to be an invoice or a grant of unrestricted rights.

Reviewed provider sources on 2026-10-22: [EEA Terms of Service](https://elevenlabs.io/terms-of-use-eu) (updated 2026-10-09), [publication help](https://help.elevenlabs.io/hc/en-us/articles/13313564601361-Can-I-publish-the-content-I-generate-on-the-platform), [Prohibited Use Policy](https://elevenlabs.io/use-policy), [Voice Library Addendum](https://elevenlabs.io/vla), and [Beta Services Addendum](https://elevenlabs.io/bsa). Standard paid output is subject to the applicable rights, policy and voice restrictions; Beta Services exclude production/commercial use. Voluntary credit: **“German narration generated with ElevenLabs; Rowan — Gentle, Soft-Spoken & Warm.”** Model accuracy and model-publication rights remain unresolved. No production publication was performed.

# Stegosaurus asset provenance and reproduction

## Source and publication status

Canonical source: `example project/low-poly/stegosaurus.js`, function `createLowPolyStegosaurus()`, with `model-geometry.js`. The approved source was preserved in commit `37b0c2f56775562cfeacf97803728075b28708c6` through [PR #18](https://github.com/merlinbr/fieldbook-3d/pull/18), resolving [#17](https://github.com/merlinbr/fieldbook-3d/issues/17). This export consumes that source without redesign or a second generator. Its preview/check setup and `walk-cycle.js` are also tracked.

The owner approved this model's appearance. **Publication authorization, any broader asset reuse license, and the intended production host/URL have not been confirmed for Stegosaurus.** Ankylosaurus-specific authorization does not grant rights to this asset. The repository's application-code MIT license does not license the supplied model/GLB by implication. No production upload, CDN provisioning, deployment, or production-origin CORS verification was performed for this ticket. Local export and integration can proceed; public release requires those confirmations and the real hosted URL.

This is a stylized reconstruction. The nineteen-plate/four-spike count uses the reference already recorded in the source preview documentation; proportions, skin details, palette, and soft tissue remain artistic choices. Coordinates below are **model units**, not evidence of adult body length or scientific scale calibration. #16 owns that interpretation.

## Exact regeneration

From a fresh checkout, use Node 24 LTS and the repository root lockfile:

```sh
npm ci
npm run check:stegosaurus
npm run export:stegosaurus
npm run check:stegosaurus-export
npm run check:media
```

`tools/export-stegosaurus.mjs` imports only the tracked generator/helpers and the root Three.js installation. An ignored example installation is neither required nor allowed to select a different Three.js version; a scoped Node resolution hook provides the same dependency deduplication as the Vite preview. No nested installation, ignored generator, browser export snippet, or new dependency is required.

The default output is ignored `media-dev/stegosaurus.glb`, resolved relative to the tool rather than the invoking directory. For an isolated output, `node tools/export-stegosaurus.mjs /absolute/path/stegosaurus.glb` accepts one optional path (quote paths containing spaces).

Every invocation constructs a fresh resting model without calling the walking controller. Each distinct geometry is converted once with `toNonIndexed()` (or cloned if already non-indexed), its normals are recomputed per triangle, and the converted geometry is reused by every mesh that shared the source. The locked Three.js `GLTFExporter` writes binary glTF. +Y up/head toward -X, local/world transforms, node names, material colors/roughness/metalness, and all anatomy parenting are retained. No environment, ground, camera, lighting, textures, or animation clips are included. glTF preserves the facets through explicit normals rather than Three.js's `flatShading` flag. Shadow participation is a renderer setting; the comparison enables it identically for both models.

## Local HTTP and visual verification

In one terminal, start or restart the responder after updating its source:

```sh
npm run media:dev
```

It serves only the existing allowlist plus `http://127.0.0.1:5194/stegosaurus.glb`. Both models support GET/HEAD, `model/gltf-binary`, byte ranges, and the existing CORS headers. A missing model returns 404 with `Local specimen asset is unavailable.` The responder does not expose arbitrary paths or directory listings. `npm run check:media` exercises the actual responder on an ephemeral loopback port with isolated fixtures, including the existing Ankylosaurus model/audio routes, rejected paths/methods, ranges, CORS, and missing files. It never moves or overwrites local media.

In a second terminal:

```sh
npm run preview:stegosaurus
```

Open `/compare.html` on Vite's printed URL. Left is the canonical procedural model; right is the GLB actually fetched over HTTP. A shared scene, camera, lights, ground, and rendering settings show each in its own half of the canvas at the same resting transform. Inspect Side, Opposite side, and Three-quarter, including thin plate silhouettes, flank scales, facial detail, palette, and facets. Orbit and zoom are shared. Missing media or unavailable WebGL produces a visible comparison error. `/` retains the source/walking preview. `npm run build:stegosaurus` includes both preview pages in ignored `dist/stegosaurus-preview/`, separately from the application build.

To avoid disturbing an already running responder during verification, an alternate loopback port can be used:

```sh
node --input-type=module -e "import { createDevMediaServer } from './tools/serve-dev-media.mjs'; createDevMediaServer().listen(5195, '127.0.0.1');"
```

Then open `/compare.html?mediaPort=5195`. The parameter only changes the loopback port for the fixed Stegosaurus path.

## Measured export and observed verification

Generated locally on 2026-10-24 with Node **24.17.0**, locked Three.js **0.186.1**:

- **129,436 bytes**; SHA-256 `1018fbf72e2229563353bc17161f9290c154aed2b104ffc6a2d61297aece075e`.
- **2,976 triangles**, **102 meshes**, nineteen `dorsalPlate_*`, four `thagomizer_*`, and thirty-six `skinScale_*` meshes.
- Bounds min `[-3.3999999570846557, -0.000000009536743172944284, -1.1500000071525573]`.
- Bounds max `[5.700000190734864, 3.9970502653287765, 1.1500000071525573]`.
- Extent approximately `[9.100000148, 3.997050275, 2.300000014]` model units. The tiny negative ground bound is floating-point error.

`check:stegosaurus-export` invokes the real CLI twice from outside the checkout working directory, compares complete bytes, reloads with `GLTFLoader`, and checks original names, transforms/hierarchy, exact triangle/anatomy counts, finite/nondegenerate vertices, explicit per-face normals, material values, shared geometry, and no cameras/lights/textures/animations. Source/export bounds match within **0.001 model units**. The model check also passes the original geometry/anatomy/grounded-gait assertions.

The in-app Chromium browser loaded the real HTTP GLB and showed matching side, opposite-side, and three-quarter source/export views at 1280 × 720. Local screenshots are ignored in `media-dev/stegosaurus-verification/{side,opposite-side,three-quarter}.png`; regenerate them with the comparison above. Inspection showed matching plate separation, flank/facial detail, silhouette, colors, and faceting. This is local desktop Chromium evidence, not a physical-device or production-host test.

An isolated checkout made from the proposed staged files, without ignored example sources, `.env`, or media, passed `npm ci`, the source and GLB checks, media checks, standalone preview build, and Svelte checks (zero errors/warnings). Its regenerated GLB was byte-for-byte identical to the local export and matched the SHA-256 above. The clean Svelte check needed network access to fetch the project's existing Paraglide message-format plugin; the first network-restricted attempt could not generate message types. Camera/anatomy/study regressions and the application development-mode static build also passed in the working checkout. Inspection of `build/` found no model/audio binaries, procedural Stegosaurus generator, or `GLTFExporter` tooling.

A fresh code review found no actionable defects and independently checked all 2,976 world-space face normals under nonuniform scales (maximum error about `7.33e-8`). Existing build advisories concern large Three.js chunks and conflicting color-output environment flags. The unchanged lockfile's Vite 8.3.2 also reports an existing high-severity npm audit advisory ([GHSA-587h-7wmj-h5pm](https://github.com/advisories/GHSA-587h-7wmj-h5pm)); dependency upgrades are outside this asset-export ticket.

## Environment and application boundary

`PUBLIC_STEGOSAURUS_MODEL_URL` is a public static environment declaration with a local example in `.env.example`, consumed by `src/lib/specimens/stegosaurus.ts` for `/en/specimens/stegosaurus/` and `/de/specimens/stegosaurus/`. The shared `model-url.ts` resolver requires an absolute HTTP(S) URL without credentials, rejects loopback in production, and permits the separate local default only in development mode. Both specimen URLs are required for a production static build because both exhibits prerender. The media host must permit CORS from the application origin. Do not put secrets or signed/private URLs into public build-time configuration. Production host/URL: **not configured**.

`media-dev/` and all `*.glb` files remain ignored. Export/check tooling and the procedural generator are standalone tools, outside the application import graph. Do not copy the binary into `static/` or import the generator/exporter into runtime code. The localized exhibit uses the shared viewer with production anatomy configuration and `study: { kind: 'none' }`; no Stegosaurus recording metadata, audio or captions are supplied or requested. The standalone walking preview remains separate.

## Represented scale and anatomy sources

The exhibit chooses **9 m represented length**, configured once in `stegosaurus-config.ts`. This is an illustrative large-Stegosaurus scale for comparison, not a typical-size estimate, an anatomical validation of the artistic proportions, or the measured size of this model's reference individual. The [NHM expert Q&A](https://www.nhm.ac.uk/discover/stegosaurus-interview-dinosaur-expert.html) reports other Stegosaurus specimens up to nine metres while Sophie was smaller and not fully adult; [AMNH's exhibit](https://www.amnh.org/exhibitions/dinosaurs-ancient-fossils/display-or-defense/colorful-display) also gives nine metres. References checked on 2026-10-25.

The GLB's roughly 9.100000148-unit X extent remains raw geometry. Existing comparison code uniformly calibrates it by `9 / sourceXExtent`, leaving the asset untouched. The guide, framed comparison bounds, displayed represented length, and 1.7 m human use that calibration. Both locales visibly qualify the chosen scale; the comparison legend says “Represented length” / “Dargestellte Länge.” Ankylosaurus retains its 8 m calibration and adult-length wording.

| Exhibit claim | Source and interpretation |
| --- | --- |
| Small plant-eating head with tiny teeth | [NHM expert Q&A](https://www.nhm.ac.uk/discover/stegosaurus-interview-dinosaur-expert.html); no inferred chewing performance. |
| Bony plates; function uncertain, display and temperature regulation possible | [NHM expert Q&A](https://www.nhm.ac.uk/discover/stegosaurus-interview-dinosaur-expert.html); hypotheses are not presented as established functions. |
| Model's nineteen plates and four spikes | [NHM Sophie release](https://www.nhm.ac.uk/press-office/press-releases/world_s-most-complete-stegosaurus-goes-on-show.html); a count reference, not a claim that the model reconstructs Sophie's age or proportions. |
| Tail spikes may have helped in defense | [AMNH exhibit](https://www.amnh.org/exhibitions/dinosaurs-ancient-fossils/display-or-defense/colorful-display); tentative interpretation, separate from plate function. |

The production configuration collects `dorsalPlate_*` across the whole model, including the head and tail parents. Head membership excludes those meshes. Only `thagomizer_*` belongs to the four-spike region; flank scales and torso never become dorsal-plate inspection targets. Existing occlusion, keyboard controls, surface anchors, localized callouts and material restoration apply.

## Local exhibit verification — 2026-10-25

The permanent English/German pages were exercised from a development-mode **static build**, using a fresh Vite preview at `http://127.0.0.1:4177` and the existing separate media responder on port 5194. Chromium **151.0.7922.34** used software WebGL; both model endpoints returned HTTP 200 with `model/gltf-binary`. The newly regenerated Stegosaurus retained 129,436 bytes and all original geometry counts. No production asset was published.

`npm run check:browser` passed against the real HTTP GLBs and approved local English/German recordings. The optional runner uses externally supplied Playwright/Chromium paths (`FIELDBOOK_PLAYWRIGHT`, `FIELDBOOK_BROWSER_EXECUTABLE`, `FIELDBOOK_PREVIEW_URL`), without a project dependency change. It verified:

- All four localized specimen URLs directly and after refresh, same-species language changes, reciprocal localized links, new-tab species navigation, and the unchanged English Ankylosaurus root redirect.
- Stegosaurus pointer selection through the real canvas markers, keyboard Enter/Space and scoped Escape, focus return, all three anatomy notes, comparison/reset with preserved selection, and no unexpected page errors. Regenerated-GLB assertions independently verified exact highlight membership and restoration, including plates under all three parents.
- Desktop 1440×900 views and narrow 390×844 layout, 844×390 resize, docked callouts, reduced motion and no horizontal overflow. CDP touch emulation exercised an actual canvas marker tap, orbit drag and two-finger pinch without accidental selection.
- Incoming valid, malformed and repeated Ankylosaurus study queries: only study parameters disappeared, an unrelated `keep=1` survived, and no Audio object, narration request, study controls or misleading recording warning appeared.
- Delayed model delivery, intercepted failed fetch, successful reload after recovery, and a fresh context in which WebGL context creation was unavailable. Content and navigation stayed usable. Fetch interception is not verification of a real external host's CORS policy.
- Ankylosaurus keyboard inspection/focus return, its unchanged 8 m comparison at desktop/mobile with reduced motion, and actual audio playback in both languages, four chapter controls and captions, paused locale handoff, resume followed by species navigation during playback, and return to ordinary exploration without transferred study context.

The first browser scale assertion caught inherited adult-length wording. The shared text contract now permits a specimen-specific scale label; the corrected represented-length assertion passed in both locales while the Ankylosaurus fallback wording stayed unchanged.

Ignored evidence is in `media-dev/issue16-verification/`: `{en,de}-{three-quarter,side,opposite-side,scale-plates,mobile-scale}.png`, `touch-after-drag-pinch.png`, `fetch-error.png`, `webgl-unavailable-de.png`, `{en,de}-ankylosaurus-study.png`, and `browser-results.txt`. These are local browser observations and touch emulation, not physical-device, production-origin or deployment evidence.

The new `check:exhibits` regenerates a temporary GLB and checks production anatomy membership, material restoration, the 9 m guide/calibration, 1.7 m human, and framing bounds. `check:exhibit-pages`, run after building, checks actual prerendered metadata, accessible names, locale/species hrefs, exploration-only markup and root behavior. An isolated temporary source copy without the user's `.env` correctly failed a production build with the explicit missing-model-URL diagnostic. Publication authorization, intended host/URL and production-origin CORS remain unresolved as stated above.

Final local checks passed: Svelte/type check (zero errors/warnings), exhibits, camera, anatomy, study, source model, GLB export, media responder, development-mode static build and generated-page checks. Build output inspection found no media binaries, procedural model/exporter, or check-only fixtures. The existing large Three.js chunk and color-environment build advisories remain. `rtk graphify update .` refreshed the code graph; graph outputs remain untracked.

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

`PUBLIC_STEGOSAURUS_MODEL_URL` is a public static environment declaration with a local example in `.env.example`. It is reserved for exhibit integration in #16 and is **not consumed by the current runtime**. Runtime validation/consumption remains that ticket's responsibility, following the existing production policy: an absolute externally hosted HTTP(S) URL, no credentials, no loopback host, and CORS permitting the application origin. Do not put secrets or signed/private URLs into public build-time configuration. Production host/URL: **not configured**.

`media-dev/` and all `*.glb` files remain ignored. Export/check tooling and the procedural generator are standalone tools, outside the application import graph. Do not copy the binary into `static/` or import the generator/exporter into runtime code. #15 handles the shared viewer; #16 adds the localized exhibit. No narration or application route is added here.

# Stegosaurus GLB export implementation plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task by task.

**Goal:** Reproduce the approved resting Stegosaurus GLB from tracked source and deliver it through the existing separate media workflow.

**Architecture:** A Node-only tool imports the canonical generator, converts each shared geometry once to explicit per-face normals, and exports only the resting model. Independent checks reload its GLB and exercise the fixed local media routes. The application only gains an environment declaration; runtime consumption belongs to #16.

**Tech stack:** Node 24, locked Three.js GLTFExporter/GLTFLoader, existing Vite preview and SvelteKit.

**Spec:** [Issue #14](https://github.com/merlinbr/fieldbook-3d/issues/14), using the source merged for #17 in PR #18.

## Global constraints

- Preserve the approved generator, palette, shape, +Y up/head toward -X, transforms, names, and shared geometry.
- Export exactly 2,976 triangles, nineteen individually named dorsal plates, and four tail spikes; no environment, cameras, lights, textures, or animations.
- Keep GLB files ignored and outside the application build. No new dependencies or competing generator.
- Publication authorization and the production host/URL remain unconfirmed; local work is authorized.

## Review focus

- GLB smooth shading can hide source facets: verify explicit triangle normals and identical-light browser views.
- Plates beneath head/tail pivots must survive export: compare hierarchy and all nineteen unique names.
- Repeated geometry must stay shared across differently colored meshes.
- Missing Stegosaurus files must report a specimen asset error, while existing media keeps GET/HEAD/range/CORS behavior.
- A fresh checkout must need only the root lockfile, with no ignored example sources or bundled asset tooling.

## Task 1: Reproducible export and round-trip verification

**Files:** `tools/export-stegosaurus.mjs`, `checks/stegosaurus-export.mjs`, `package.json`.

**Interface:** `npm run export:stegosaurus` writes ignored `media-dev/stegosaurus.glb`; an optional output path supports isolated checks. `npm run check:stegosaurus-export` exports twice in a temporary directory and reloads the result.

- [x] Add a check that fails until the export command exists.
- [x] Implement fresh resting-model export, cached non-indexed geometry conversion, and per-triangle normals.
- [x] Verify deterministic bytes, counts, finite/nondegenerate triangles, hierarchy, transforms, material values, shared geometry, matching bounds within 0.001 model units, and absence of scene/media extras.

## Task 2: Fixed development endpoint

**Files:** `tools/serve-dev-media.mjs`, `checks/dev-media.mjs`, `package.json`.

**Interface:** `/stegosaurus.glb` is an additional fixed allowlist entry. `createDevMediaServer()` returns the actual HTTP server so isolated fixtures can use an ephemeral port; normal CLI behavior stays on loopback port 5194.

- [x] Add and run endpoint checks against the actual server using temporary media fixtures.
- [x] Add the endpoint and a correct model-missing response.
- [x] Verify GET/HEAD, complete/suffix/open byte ranges, invalid ranges, OPTIONS/CORS, rejected methods, unknown paths, missing files, and existing Ankylosaurus model/audio routes.

## Task 3: Asset documentation and visual/build acceptance

**Files:** `src/env.ts`, `.env.example`, `README.md`, `docs/assets/stegosaurus.md`, standalone preview comparison files.

- [x] Declare/example `PUBLIC_STEGOSAURUS_MODEL_URL` without adding runtime consumption.
- [x] Provide a reproducible source/GLB browser comparison under identical lighting using the existing standalone preview.
- [x] Generate the local GLB; inspect side, opposite-side, and three-quarter comparisons.
- [x] Document canonical source commit, exact regeneration, measured bounds/hash, observed verification, and unresolved publication/hosting status.
- [x] Run affected checks, Svelte/type checks, behavioral regression checks, static build, and a fresh tracked-source checkout export. Inspect build output for excluded assets/tooling.
- [x] Update graphify and review the final diff.

## Execution record

- Initial baseline: `npm run check:stegosaurus` passes (2,976 triangles; 19 plates; four spikes; geometry and gait).
- Work is on `codex/issue-14-stegosaurus-export` in the existing checkout, preserving the user's local ignored media/example files.
- Task 1 complete: export check observed failing before the exporter existed, then passing. An older ignored Three.js installation initially broke exporter pivot handling; scoped root dependency resolution fixed the cause. Two fresh exports reproduce identical bytes and all source properties.
- Task 2 complete: HTTP check observed `/stegosaurus.glb` returning 404 before registration, then passing the full isolated fixture matrix. Loopback tests require sandbox network access.
- Task 3 complete: all three browser comparisons match; isolated staged checkout installs from the root lockfile and reproduces the same GLB/hash. Its Svelte check passes after allowing the pre-existing Paraglide plugin fetch. Standalone/static builds and existing behavioral regressions pass; build scan excludes asset binaries/generator/exporter. Graphify updated to 714 nodes / 1,084 edges.
- Fresh final reviewer: no Critical, Important, or Minor findings. Independent transformed-normal check passes all 2,976 faces (maximum error 7.33e-8). Publication rights/scientific accuracy/physical devices/production hosting were not independently judged; those limits remain explicit in the asset record and no production publication occurred.
- Existing dependency audit: unchanged Vite 8.3.2 reports a high-severity advisory; recorded in the asset verification notes without unrelated dependency changes.

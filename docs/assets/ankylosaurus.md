# Ankylosaurus asset provenance

- Source: user-supplied `example project/low-poly/ankylosaurus.js` and `model-geometry.js`; `createLowPolyAnkylosaurus()`.
- Exported 2026-10-03 with the example's installed Three.js GLTFExporter, from a fresh resting model. No environment, camera, light, texture, or animation was included.
- Indexed geometry was converted to non-indexed geometry; normals were recomputed per triangle. Shared geometry conversions were reused. Materials, transforms, metre-scale coordinates (+Y up, head toward -X), and `headGroup`, `armorGroup`, `clubMesh` were preserved.
- Local output: ignored `media-dev/ankylosaurus.glb`, served separately on loopback port 5194. Not an application static asset.
- Round-trip observation: 2,972 triangles, zero animations, finite positions, matching material colors and per-face normals. Bounds matched within 0.001 m: min `[-3.249999976, 0.003895874, -1.759244814]`, max `[5.799999989, 2.778865113, 1.759244814]`.
- Side-by-side browser rendering under identical lighting showed matching resting silhouette, faceting, and colors.

Scientific accuracy and model ownership/reuse rights remain **unverified**. Local review is not publication permission. Verify rights with the source owner before publishing the model. The repository's MIT license covers application code, not this GLB or the supplied model by implication.

To regenerate locally, run the supplied example, construct a fresh model in a temporary Vite-served browser module, convert indexed geometry with `toNonIndexed()` (clone already non-indexed geometry), `computeVertexNormals()`, and export with `new GLTFExporter().parseAsync(model, { binary: true })`. Save the ArrayBuffer into the ignored path; reload with GLTFLoader and compare bounds, anatomy names, colors, normals, and rendered appearance. Remove the temporary module afterward.

# First explorable Ankylosaurus exhibit

Status: approved by the user's subsequent implementation instruction; first exhibit implemented and locally verified on 2026-10-03. See `README.md` for observed acceptance evidence and deployment/device limits. The complete guided-study prototype remains pending.

## Goal and relationship to the project

Open Fieldbook 3D directly into a real, explorable Ankylosaurus exhibit. Validate model delivery, framing, interaction, and the museum-fieldbook presentation together before adding anatomy notes or guided playback.

`fieldbook-3d-context.md` remains the source of truth for the complete prototype. This is its first implementation milestone, not a reduction of the agreed prototype scope.

## Evidence and asset decision

The supplied `example project/low-poly/` is a runnable Vite/Three.js experiment. `ankylosaurus.js` constructs a `THREE.Group`; it does not load an existing GLB. Browser inspection rendered the animal and reported 2,972 triangles. `headGroup`, `armorGroup`, and `clubMesh` exist. Its geometry helpers mark meshes for shadows and use flat-shaded materials. The example provides orbit controls, orthographic framing, lighting, and several procedural environments.

Use its Ankylosaurus as the initial asset, exported to an uncompressed GLB in its resting pose. Preserve named anatomy nodes and metre-scale coordinates (+Y up, head toward -X). Export geometry with explicit faceted normals: a Three.js material's `flatShading` flag alone is not a portable glTF material property. Compare the reloaded GLB with the source experiment before accepting it. Do not include the example's walking cycle, environment, cameras, or lights in the specimen export.

The geometry's successful rendering is not evidence of scientific accuracy or ownership. Record the source, export process, and unresolved rights in asset provenance. Local review can proceed; public media publication requires verified reuse rights. Do not assert an MIT license for the GLB merely because the app repository has one.

## Included behavior

- `/` opens the English exhibit through a prerendered redirect page with a working English exhibit link when JavaScript is unavailable.
- `/en/specimens/ankylosaurus/` and `/de/specimens/ankylosaurus/` are directly loadable, prerendered exhibit pages. Directory-style static output uses trailing slashes; slashless requests may canonicalize to these URLs.
- URL determines language. English is the base language. A visible English/Deutsch link switcher performs full document navigation; saved preferences and automatic language detection are not included.
- Server-rendered content includes the name, scientific name, brief description, language navigation, and a readable viewer/loading area. Three.js initializes only after browser mount.
- Fetch only the selected specimen GLB from a configurable asset URL. Default local configuration points to a separate loopback asset server, not application static assets. Production builds require an explicit externally hosted HTTP(S) model URL.
- Present a static Ankylosaurus with warm lighting, shadows, and one simple ground plinth. The detailed fern valley is a later visual refinement; do not port all environments.
- Initially frame the whole model in a three-quarter orthographic view. Fit to actual loaded bounds, not the example's fixed camera coordinates.
- Pointer drag or touch drag orbits; wheel or pinch zooms. Disable panning, restrict travel below the ground, and bound zoom. No automatic rotation or walking.
- Native buttons provide zoom in, zoom out, reset view, and rotate left/right/up/down for keyboard users. All controls have localized accessible names and visible focus. At zoom limits controls do not exceed the bounds.
- Resize preserves current orbit and zoom, with the entire animal visible at reset on desktop, tablet, and phone aspect ratios.
- Loading, ready, asset-error, and unsupported-WebGL states are explicit. Failure leaves the specimen text and language links usable. A failed model never becomes a fake model or a permanent spinner. Error text is localized and offers reload, not an automatic retry system. Do not invent progress percentages when transfer length is unknown.
- Unmount releases controls, observers, animation callbacks, loaded geometry/materials/textures, and renderer resources. A late load after unmount is disposed and cannot append a canvas or update detached UI. Unexpected WebGL context loss shows the unavailable state and reload action.

## Presentation

The specimen occupies most of the exhibit, with title, context, and controls near the edges. Use warm charcoal, muted olive, stone, bone-colored text, and restrained amber interaction accents. Essential text is at least 16 CSS pixels; controls are at least 44 by 44 CSS pixels. Avoid large cards over the animal and tiny uppercase labels.

Use Newsreader for the heading/scientific name and Source Sans 3 for controls and body text. Load fonts from an external provider with documented licenses and system fallbacks; do not commit font binaries. Font unavailability must not prevent rendering or interaction.

Initial copy identifies Ankylosaurus magniventris as an armored dinosaur, without size measurements or exact age claims that have not been checked. Explain that the model is a stylized reconstruction in English and German. Do not include triangle counts, procedural-generation copy, or production tooling in the exhibit.

Respect reduced motion by disabling control damping/animated resets for that preference. No essential interaction depends on hover. Touch gestures apply to the viewer, not the entire document. At narrow widths stack peripheral text/controls without horizontal page overflow.

## Small application boundary

- `SpecimenViewer.svelte` owns the DOM mount point, localized status UI, control buttons, and browser lifetime.
- `specimen-viewer.ts` owns the single Three.js scene, GLB loading, camera, lights, plinth, controls, and disposal. It emits loading/ready/error/unavailable states and exposes reset, bounded zoom, and bounded orbit actions.
- The specimen page supplies model URL and localized content. Project-owned specimen text is separate from Paraglide interface messages.
- Paraglide handles interface localization, URL patterns, server middleware during prerendering, and the HTML language attribute. No runtime server is needed in deployment.

Do not create empty `FieldStudyMode`, `NarrationTimeline`, or `SpecimenTerminal` modules. The page is sufficient for this milestone's small information layer. Do not introduce a specimen registry, plugin interface, global store, or presentation configuration language.

## Media and repository boundaries

- Add ignore rules before exporting: root/example dependencies and build output, environment secrets, generated Paraglide files, `media-dev/`, and binary/source media patterns. Preserve the supplied example; do not stage it incidentally.
- Store local GLB at ignored `media-dev/ankylosaurus.glb`. Serve it separately using a small Node HTTP script bound to loopback. It must work with both the development app and a preview of static output and must never be copied into `build/`.
- Use `PUBLIC_ANKYLOSAURUS_MODEL_URL` as build-time public configuration. It contains no secret. Production media hosting and CDN selection are not part of this milestone; deployment must replace the loopback URL and allow CORS from the app origin.
- Commit app code, captions/text if any, URL configuration examples, and provenance metadata only; never exported GLB or font/media binaries.

## Explicitly outside this milestone

Three anatomy annotations and selection/highlighting; Start field study and all guided playback; audio, captions, seeking, pause-to-inspect; walking/rotation automation; specimen/environment selectors; collection pages; model compression; storage preferences; accounts/backend/offline support; production hosting provisioning; generalized specimen or timeline engines. Do not show disabled promises of these features in the UI.

## Acceptance and verification

1. The reloaded exported GLB matches the example's resting silhouette, faceted appearance, colors, orientation, and ground contact; head, armor, and club nodes remain available for the next milestone.
2. A static build contains both localized exhibit documents with localized text and correct `lang`; refresh works without a SvelteKit application server. The root entry opens the English exhibit. Model/renderer code is not executed during prerendering.
3. Desktop (1365x768), tablet (1024x768), and phone (390x844) show the whole animal at reset without horizontal page overflow. Visual inspection confirms the actual rendered surface, not just a nonempty canvas.
4. Drag/orbit, wheel/zoom, emulated touch/pinch, keyboard controls, reset, and resizing operate within bounds. Reset remains reliable after rotating and zooming.
5. Block the model request and separately disable WebGL: each produces its localized failure state while text/navigation remain available. Navigate away during delayed loading: no late canvas, UI update, or uncaught exception.
6. English/Deutsch links update URL, initial document language, content, controls, and error states together. Fonts blocked or storage denied do not break the page.
7. One small permanent Node assertion check exercises camera-fit mathematics at wide/narrow aspect ratios and invalid bounds. Export node/geometry inspection and UI scenarios use throwaway browser checks rather than permanent wiring tests.
8. Run type checks and build once after integration, then exercise the built static app. Confirm no local media has been copied to build output or staged for commit.

Record observed results in the README when implemented; do not label unexercised touch emulation as physical-device testing. Physical tablet/phone checks are desirable but are not evidence available from desktop browser automation.

## References

- Existing decisions: `fieldbook-3d-context.md`, especially technical stack, public-media policy, and current priorities.
- Example: `example project/low-poly/README.md`, `ankylosaurus.js`, `model-geometry.js`, `main.js`.
- [Three.js GLTFExporter](https://threejs.org/docs/pages/GLTFExporter.html)
- [SvelteKit static adapter](https://svelte.dev/docs/kit/adapter-static)
- [Svelte CLI creation](https://svelte.dev/docs/cli/sv-create)
- [Paraglide SvelteKit integration](https://paraglidejs.com/sveltekit)
- [Paraglide locale strategy](https://paraglidejs.com/strategy)

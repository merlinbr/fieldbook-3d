# Overview poster assets

## Source and rights

The two poster images are still renders of the ignored local source models `media-dev/ankylosaurus.glb` and `media-dev/stegosaurus.glb`. The poster renderer reads those existing GLBs; it does not create, simplify, or replace a model. Recreate or obtain the local models using their existing asset procedures: `docs/assets/ankylosaurus.md` and `docs/assets/stegosaurus.md`.

The source models' existing rights and publication status are unchanged. Local poster preparation is not publication authorization. No public media host, upload, deployment, or reuse license is supplied or implied; do not publish these image files without the applicable rights approval. The repository's application-code license does not license model-derived media by implication.

## Generate the stills locally

Requirements: Node/npm dependencies already installed by the project, the two local GLBs, a normal desktop browser with WebGL support, and the running Vite and media servers. No Playwright or additional package is required.

In two terminals from the repository root:

```sh
npm run media:dev
```

```sh
npx vite --config tools/poster-preparation/vite.config.js --host 127.0.0.1 --port 5173 --strictPort
```

Open `http://127.0.0.1:5173/`. This standalone Vite root avoids the application route/localization middleware. Its isolated preparation page loads each actual GLB from the separate loopback media server, projects the complete model geometry in the shared three-quarter view, then uses the viewer's orthographic fit helper for roughly 15% margins in a 1200 × 750 charcoal poster without perspective distortion. Click **Download Ankylosaurus PNG** and **Download Stegosaurus PNG**. Move the downloaded `ankylosaurus-poster.png` and `stegosaurus-poster.png` into the repository's ignored `media-dev/` directory; overwrite only those generated poster images when regenerating them. The page reports model loading failures and does not produce substitute artwork.

For PowerShell, when the browser downloaded both files to the default Downloads directory:

```powershell
Move-Item "$HOME/Downloads/ankylosaurus-poster.png" "media-dev/ankylosaurus-poster.png" -Force
Move-Item "$HOME/Downloads/stegosaurus-poster.png" "media-dev/stegosaurus-poster.png" -Force
```

For a shell whose browser downloads into `~/Downloads`:

```sh
mv ~/Downloads/ankylosaurus-poster.png media-dev/ankylosaurus-poster.png
mv ~/Downloads/stegosaurus-poster.png media-dev/stegosaurus-poster.png
```

Afterward the separate media server serves `http://127.0.0.1:5194/ankylosaurus-poster.png` and `http://127.0.0.1:5194/stegosaurus-poster.png`. The poster endpoints are fixed allowlist entries; absent local PNGs return 404 with `Local specimen poster is unavailable.` They never fall back to an arbitrary filesystem path.

## Application boundary and URL configuration

The localized English/German Overview may use these still PNG URLs, but must remain fully usable as text and native static navigation when a URL is absent or image loading fails. It does not load either GLB, audio/narration configuration, a 3D viewer, or WebGL. `PUBLIC_ANKYLOSAURUS_POSTER_URL` and `PUBLIC_STEGOSAURUS_POSTER_URL` are public build-time values, not secrets. Development defaults to the corresponding loopback endpoint. Production may leave each unset (or explicitly empty) for text-only content; a configured URL must be absolute HTTP(S), contain no credentials, and may not use loopback in production. A production URL must be supplied by the deployment owner; this repository invents no host.

The two PNGs remain under ignored `media-dev/`, never application static/build output or Git. Source models and generated images remain local-only unless independently authorized for publication.

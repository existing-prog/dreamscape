# Dreamscape

An interactive 3D dream in four worlds. Scroll to move between them and move the mouse to look around.

**Live site: https://existing-prog.github.io/dreamscape/**

| # | World | Mood |
|---|-------|------|
| I | **The Awakening** | Pastel dawn, a watching "eye" ring, morphing memory fragments, falling petals |
| II | **The Void** | Black-hole singularity with an accretion disk, a ring of monoliths, starfield |
| III | **The Deep** | Abyssal ocean, bioluminescent jellyfish, swaying kelp, light shafts, bubbles |
| IV | **The Ascension** | Break through a sea of clouds, floating islands, a pillar of light toward the summit |

## Run it

```bash
npm install
npm run dev     # http://localhost:3000
npm run build && npm start   # production
```

## Deployment

Every push to `main` runs `.github/workflows/deploy.yml`. It builds a static export (`STATIC_EXPORT=true`, with `NEXT_PUBLIC_BASE_PATH=/<repo>`) and publishes it to GitHub Pages.

## Stack

- **Next.js 15 (App Router)**: the experience is client-only (`components/ClientRoot.tsx`)
- **React Three Fiber**: the scene graph (`components/Scene.tsx`, `components/worlds/*`)
- **Drei**: `Float`, `Sparkles`, `Stars`, `MeshDistortMaterial`
- **@react-three/postprocessing**: bloom, film grain, vignette
- **GSAP + ScrollTrigger**: maps scroll to the journey and animates the story text (`components/ui/Overlay.tsx`)
- **Howler.js**: one ambient loop per world, cross-faded, plus a transition chime (`lib/audio.ts`)

## How it works

- `lib/scrollState.ts` is a small shared store. ScrollTrigger writes `target` (0 → 1) and the render loop eases `current` toward it.
- In each chapter, the first 70% of the scroll stays inside that world. The last 30% is the flight to the next world (`TRAVEL_START`).
- `components/three/CameraRig.tsx` flies the camera along a Catmull-Rom spline with two keyframes per world. It adds mouse parallax, a slow idle drift, and widens the field of view while travelling between worlds.
- `components/three/Atmosphere.tsx` blends the background, fog and lights between the worlds' moods.
- Only the current world, and the next one during travel, is rendered. All shaders are compiled at startup so nothing stutters mid-flight.

## Editing the story

All text is in `lib/chapters.ts`. Camera keyframes are in `CameraRig.tsx`, world positions are in `components/three/helpers.ts`, and colours are in `Atmosphere.tsx`.

## Audio

The ambient loops in `public/audio` are synthesised by `scripts/generate-audio.mjs` (pads, bells, whale calls, bubbles, reverb). Run `npm run audio` to regenerate them, or replace the `.wav` files with your own recordings using the same names.

## Adding Blender models

Every world is built from procedural geometry, so you can swap any piece for a Blender asset:

1. In Blender, model at real-world scale (1 unit = 1 m), apply transforms, and use Principled BSDF materials. Emission strength above 1 will glow through the bloom.
2. Use **File → Export → glTF 2.0** with the **glTF Binary (.glb)** format and Draco compression, and save to `public/models/`.
3. Use it in a world:

```tsx
import { useGLTF } from '@react-three/drei';

function FloatingIsland(props) {
  const { scene } = useGLTF('/models/island.glb');
  return <primitive object={scene.clone()} {...props} />;
}
useGLTF.preload('/models/island.glb');
```

4. Wrap the world's content in `<Suspense fallback={null}>` inside `Scene.tsx`.

Good candidates are the Ascension islands (`Island`), the Deep's sea floor (`makeDunes`) and the Void's monoliths.

# Gallery — scroll experience

A scroll-driven Three.js background (terrain glow, drifting dust, a
spiral vortex finale) paired with DOM text overlays, built as a neutral,
reusable foundation for a client's "gallery in numbers" style landing
page.

- No native scroll — wheel / touch / keyboard input is captured and
  drives a virtual camera dolly through a sequence of depth "stations".
- All copy in `src/content/sections.ts` is placeholder — swap it for a
  real client's numbers, picks, and branding.
- Pick cards render as a tile mosaic (`src/components/PickTile.tsx`)
  with a gradient placeholder per project; point `tilesX`/`tilesY` and
  the tile background at real project screenshots once available.
- Fonts are Space Grotesk (display) + Geist (UI labels), both free —
  swap for the client's real typeface via `--font-display` /
  `--font-ui` in `src/index.css`.

## Stack

Vite + React + TypeScript + Tailwind v4 + Three.js (no r3f — a plain
`WebGLRenderer` scene in `src/scene/`).

## Develop

```bash
npm install
npm run dev
```

/**
 * Procedural particle silhouettes for the solution cards — each one a
 * recognizable 3D object (a building, a VR headset, a touchscreen
 * totem) built from primitive volumes/surfaces sampled into a point
 * cloud, rather than a flat grid. `colorT` is the gradient position
 * (0..1) fed to PickCloud's vertex color mix, based on each shape's own
 * vertical extent so every icon reads top-to-bottom in the brand
 * gradient regardless of its footprint.
 */
export interface IconShape {
  positions: Float32Array
  colorT: Float32Array
}

function rand(min: number, max: number) {
  return min + Math.random() * (max - min)
}

// A point on the surface of an axis-aligned box (biased slightly
// toward edges/corners so silhouettes read crisply as particles).
function boxSurfacePoint(cx: number, cy: number, cz: number, w: number, h: number, d: number): [number, number, number] {
  const hw = w / 2,
    hh = h / 2,
    hd = d / 2
  const face = Math.floor(Math.random() * 6)
  let x = rand(-hw, hw),
    y = rand(-hh, hh),
    z = rand(-hd, hd)
  if (face === 0) x = hw
  else if (face === 1) x = -hw
  else if (face === 2) y = hh
  else if (face === 3) y = -hh
  else if (face === 4) z = hd
  else z = -hd
  return [cx + x, cy + y, cz + z]
}

function boxVolumePoint(cx: number, cy: number, cz: number, w: number, h: number, d: number): [number, number, number] {
  return [cx + rand(-w / 2, w / 2), cy + rand(-h / 2, h / 2), cz + rand(-d / 2, d / 2)]
}

function fillBox(
  out: number[],
  cx: number,
  cy: number,
  cz: number,
  w: number,
  h: number,
  d: number,
  count: number,
  surfaceBias = 0.7,
) {
  for (let i = 0; i < count; i++) {
    const p = Math.random() < surfaceBias ? boxSurfacePoint(cx, cy, cz, w, h, d) : boxVolumePoint(cx, cy, cz, w, h, d)
    out.push(p[0], p[1], p[2])
  }
}

// Points along a line segment, with a little radial jitter — used for
// thin structural bits (a spire, a stand, a strap).
function fillLine(out: number[], a: [number, number, number], b: [number, number, number], count: number, jitter = 0.015) {
  for (let i = 0; i < count; i++) {
    const t = Math.random()
    out.push(
      a[0] + (b[0] - a[0]) * t + rand(-jitter, jitter),
      a[1] + (b[1] - a[1]) * t + rand(-jitter, jitter),
      a[2] + (b[2] - a[2]) * t + rand(-jitter, jitter),
    )
  }
}

// Points along an arced curve from a to b, bulging by `bulge` along
// `axis` at its midpoint — used for the VR headset's head strap.
function fillArc(
  out: number[],
  a: [number, number, number],
  b: [number, number, number],
  bulge: number,
  axis: [number, number, number],
  count: number,
  jitter = 0.02,
) {
  for (let i = 0; i < count; i++) {
    const t = Math.random()
    const arc = Math.sin(Math.PI * t) * bulge
    out.push(
      a[0] + (b[0] - a[0]) * t + axis[0] * arc + rand(-jitter, jitter),
      a[1] + (b[1] - a[1]) * t + axis[1] * arc + rand(-jitter, jitter),
      a[2] + (b[2] - a[2]) * t + axis[2] * arc + rand(-jitter, jitter),
    )
  }
}

function fillRing(out: number[], cx: number, cy: number, cz: number, radius: number, count: number, jitter = 0.012) {
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2
    out.push(cx + Math.cos(a) * radius + rand(-jitter, jitter), cy + Math.sin(a) * radius + rand(-jitter, jitter), cz)
  }
}

// A cone/frustum surface — radius tapers linearly from the bottom
// (radiusBottom) to the top (radiusTop). Used for a pedestal stand
// that flares at the foot instead of reading as a thin balloon stick.
function fillTaperSurface(
  out: number[],
  cx: number,
  cy: number,
  cz: number,
  radiusBottom: number,
  radiusTop: number,
  height: number,
  count: number,
) {
  for (let i = 0; i < count; i++) {
    const t = Math.random()
    const r = radiusBottom + (radiusTop - radiusBottom) * t
    const a = Math.random() * Math.PI * 2
    out.push(cx + Math.cos(a) * r, cy - height / 2 + height * t, cz + Math.sin(a) * r)
  }
}

// A short, subtle line segment used purely as a thin surface accent
// (a seam, a floor line) — jitter stays small so it stays crisp.
function fillAccentLine(out: number[], a: [number, number, number], b: [number, number, number], count: number) {
  fillLine(out, a, b, count, 0.008)
}

// Re-centers on its own bounding-box middle and scales to a target
// height, so every icon fills roughly the same visual envelope the
// flat card used to regardless of how tall/wide its own construction
// happens to be.
function finalize(out: number[], targetHeight = 2.1): IconShape {
  const raw = new Float32Array(out)
  const count = raw.length / 3
  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity,
    minZ = Infinity,
    maxZ = -Infinity
  for (let i = 0; i < count; i++) {
    const x = raw[i * 3],
      y = raw[i * 3 + 1],
      z = raw[i * 3 + 2]
    if (x < minX) minX = x
    if (x > maxX) maxX = x
    if (y < minY) minY = y
    if (y > maxY) maxY = y
    if (z < minZ) minZ = z
    if (z > maxZ) maxZ = z
  }
  const cx = (minX + maxX) / 2
  const cy = (minY + maxY) / 2
  const cz = (minZ + maxZ) / 2
  const height = Math.max(maxY - minY, 0.0001)
  const scale = targetHeight / height

  const positions = new Float32Array(count * 3)
  const colorT = new Float32Array(count)
  for (let i = 0; i < count; i++) {
    const y = raw[i * 3 + 1]
    positions[i * 3] = (raw[i * 3] - cx) * scale
    positions[i * 3 + 1] = (y - cy) * scale
    positions[i * 3 + 2] = (raw[i * 3 + 2] - cz) * scale
    colorT[i] = 1 - (y - minY) / height // top -> 0 (colorA), bottom -> 1 (colorB)
  }
  return { positions, colorT }
}

/**
 * A slender glass high-rise — a single tapered volume with a subtle
 * crown setback and a fine curtain-wall grid of floor lines, rather
 * than a few stacked toy-block tiers. Real towers barely step; what
 * reads as "high-end" is the height:width ratio and the repeating
 * floor rhythm, not dramatic shape changes.
 */
export function buildBuildingIcon(count: number): IconShape {
  const out: number[] = []
  const w = 0.62,
    d = 0.62,
    shaftH = 2.3,
    shaftY = -0.15
  fillBox(out, 0, shaftY, 0, w, shaftH, d, Math.round(count * 0.42), 0.85)
  // A slight crown setback, not a separate small block.
  fillBox(out, 0, shaftY + shaftH / 2 + 0.14, 0, w * 0.78, 0.28, d * 0.78, Math.round(count * 0.08), 0.85)
  fillLine(out, [0, shaftY + shaftH / 2 + 0.28, 0], [0, shaftY + shaftH / 2 + 0.55, 0], Math.round(count * 0.02))
  // A fine grid of floor lines on the two visible faces reads as a
  // real curtain-wall tower instead of a smooth block.
  const floors = 16
  const floorPts = Math.round((count * 0.4) / (floors * 2))
  for (let f = 0; f < floors; f++) {
    const y = shaftY - shaftH / 2 + (shaftH * (f + 0.5)) / floors
    fillAccentLine(out, [-w / 2, y, d / 2], [w / 2, y, d / 2], floorPts)
    fillAccentLine(out, [w / 2, y, -d / 2], [w / 2, y, d / 2], floorPts)
  }
  // Two faint vertical mullions on the front face.
  fillAccentLine(out, [-w / 6, shaftY - shaftH / 2, d / 2], [-w / 6, shaftY + shaftH / 2, d / 2], Math.round(count * 0.04))
  fillAccentLine(out, [w / 6, shaftY - shaftH / 2, d / 2], [w / 6, shaftY + shaftH / 2, d / 2], Math.round(count * 0.04))
  return finalize(out)
}

/**
 * A modern standalone VR headset — a low, wide, gently rounded visor
 * (no cartoon "eyes": real headsets show a smooth outward face, not
 * two big lens circles) with a thin seam groove, small camera-sensor
 * dots, and a low-profile strap.
 */
export function buildVRHeadsetIcon(count: number): IconShape {
  const out: number[] = []
  // The visor is built from a few stacked, slightly narrower boxes so
  // its silhouette tapers gently top and bottom instead of reading as
  // one flat brick.
  fillBox(out, 0, 0, 0.22, 1.74, 0.4, 0.38, Math.round(count * 0.3), 0.85)
  fillBox(out, 0, 0.22, 0.2, 1.5, 0.14, 0.34, Math.round(count * 0.08), 0.85)
  fillBox(out, 0, -0.22, 0.2, 1.5, 0.14, 0.34, Math.round(count * 0.08), 0.85)
  // A thin horizontal seam groove across the face — the realistic
  // detail real headsets have, instead of big lens "eyes".
  fillAccentLine(out, [-0.7, 0, 0.42], [0.7, 0, 0.42], Math.round(count * 0.05))
  // Small, low-key sensor dots — subtle, not face-like.
  fillRing(out, -0.62, 0.14, 0.42, 0.035, Math.round(count * 0.015))
  fillRing(out, 0.62, 0.14, 0.42, 0.035, Math.round(count * 0.015))
  fillRing(out, 0, -0.16, 0.43, 0.03, Math.round(count * 0.01))
  // Low-profile strap, hugging closer to the visor than a full halo.
  fillArc(out, [-0.86, 0, 0.05], [0.86, 0, 0.05], 0.55, [0, 1, 0], Math.round(count * 0.24))
  fillLine(out, [-0.86, 0, 0.05], [-0.75, 0.02, 0.55], Math.round(count * 0.06))
  fillLine(out, [0.86, 0, 0.05], [0.75, 0.02, 0.55], Math.round(count * 0.06))
  // A small rear strap-adjuster box implies the back half of the band.
  fillBox(out, 0, 0.02, 0.62, 0.22, 0.16, 0.1, Math.round(count * 0.045), 0.85)
  return finalize(out, 1.5)
}

/** A touchscreen totem: a slim bezel screen on a pedestal that flares at the foot. */
export function buildSmartViewIcon(count: number): IconShape {
  const out: number[] = []
  fillBox(out, 0, 0.55, 0, 1.2, 1.6, 0.09, Math.round(count * 0.42), 0.85)
  fillBox(out, 0, 0.55, 0.055, 1.0, 1.32, 0.02, Math.round(count * 0.13), 0.15)
  fillTaperSurface(out, 0, -0.62, 0, 0.16, 0.05, 0.45, Math.round(count * 0.28))
  fillTaperSurface(out, 0, -0.86, 0, 0.32, 0.32, 0.0001, Math.round(count * 0.12))
  return finalize(out)
}

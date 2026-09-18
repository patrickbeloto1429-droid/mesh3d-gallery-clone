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

function fillCylinderSurface(out: number[], cx: number, cy: number, cz: number, radius: number, height: number, count: number) {
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2
    out.push(cx + Math.cos(a) * radius, cy + rand(-height / 2, height / 2), cz + Math.sin(a) * radius)
  }
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

/** A stepped-back luxury high-rise: three tiers plus a rooftop spire. */
export function buildBuildingIcon(count: number): IconShape {
  const out: number[] = []
  fillBox(out, 0, -0.62, 0, 1.55, 1.15, 1.05, Math.round(count * 0.4))
  fillBox(out, 0, 0.28, 0.05, 1.1, 0.85, 0.8, Math.round(count * 0.32))
  fillBox(out, 0, 0.92, 0.1, 0.7, 0.55, 0.55, Math.round(count * 0.2))
  fillLine(out, [0, 1.2, 0.1], [0, 1.65, 0.1], Math.round(count * 0.05))
  // A few balcony-line accents on the base tier's front face.
  for (let row = -2; row <= 2; row++) {
    fillLine(
      out,
      [-0.75, -0.25 + row * 0.16, 0.53],
      [0.75, -0.25 + row * 0.16, 0.53],
      Math.round((count * 0.03) / 5),
      0.01,
    )
  }
  return finalize(out)
}

/** A VR headset: a rounded visor, two lens rings, and a head strap. */
export function buildVRHeadsetIcon(count: number): IconShape {
  const out: number[] = []
  fillBox(out, 0, 0.05, 0.28, 1.5, 0.58, 0.4, Math.round(count * 0.42))
  fillRing(out, -0.36, 0.05, 0.49, 0.15, Math.round(count * 0.1))
  fillRing(out, 0.36, 0.05, 0.49, 0.15, Math.round(count * 0.1))
  fillArc(out, [-0.74, 0.05, 0.2], [0.74, 0.05, 0.2], 0.95, [0, 1, 0], Math.round(count * 0.28))
  fillLine(out, [-0.74, 0.05, 0.2], [-0.68, 0.05, 0.85], Math.round(count * 0.05))
  fillLine(out, [0.74, 0.05, 0.2], [0.68, 0.05, 0.85], Math.round(count * 0.05))
  return finalize(out)
}

/** A touchscreen totem: a tall panel on a slim stand and base. */
export function buildSmartViewIcon(count: number): IconShape {
  const out: number[] = []
  fillBox(out, 0, 0.55, 0, 1.25, 1.65, 0.1, Math.round(count * 0.55), 0.55)
  fillBox(out, 0, 0.55, 0.06, 1.0, 1.35, 0.02, Math.round(count * 0.15), 0.2)
  fillCylinderSurface(out, 0, -0.6, 0, 0.07, 0.55, Math.round(count * 0.2))
  fillBox(out, 0, -0.95, 0, 0.9, 0.08, 0.45, Math.round(count * 0.1))
  return finalize(out)
}

/**
 * Visibility "plateau" for a section pinned at depth `stationZ`: fully
 * visible (1) while the camera sits within `plateau` units of it, easing
 * to 0 across the following `falloff` units on either side. A pure
 * triangular falloff only hits 1.0 at one exact scroll position — the
 * plateau keeps each section readable for a real span of scroll instead
 * of a razor-thin instant.
 */
export function stationVisibility(cameraZ: number, stationZ: number, plateau = 1.1, falloff = 2.1) {
  const dist = Math.abs(cameraZ - stationZ)
  if (dist <= plateau) return 1
  const t = Math.min(1, Math.max(0, (dist - plateau) / falloff))
  return 1 - t * t * (3 - 2 * t) // smoothstep falloff, clamped to [0, 1]
}

export function clamp01(v: number) {
  return Math.min(1, Math.max(0, v))
}

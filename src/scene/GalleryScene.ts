import * as THREE from 'three'
import { createBackdrop } from './Backdrop'
import { createTerrain } from './Terrain'
import { createAmbientDust } from './AmbientDust'
import { createVortex } from './Vortex'
import { createPickCloud } from './PickCloud'
import { buildBuildingIcon, buildVRHeadsetIcon, buildSmartViewIcon, type IconShape } from './iconShapes'
import { stationVisibility } from './windowing'
import { SCROLL_END_Z, SECTIONS, type PickSection, type PickIcon } from '../content/sections'

const ICON_BUILDERS: Record<PickIcon, (count: number) => IconShape> = {
  building: buildBuildingIcon,
  vrHeadset: buildVRHeadsetIcon,
  smartview: buildSmartViewIcon,
}

// Imersão Virtual brand palette — see src/index.css for the source values.
const COLOR_DARK = new THREE.Color('#1a0a20')
const COLOR_GLOW = new THREE.Color('#ff5a3c')
const COLOR_SKY = new THREE.Color('#0d0d0d')

export function createGalleryScene(container: HTMLElement) {
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(58, 1, 0.1, 300)
  camera.position.set(0, 1.3, 0)

  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
  renderer.setClearColor(0x08090d, 1)
  container.appendChild(renderer.domElement)

  const length = Math.abs(SCROLL_END_Z) + 20
  const backdrop = createBackdrop(COLOR_SKY, COLOR_GLOW)
  const terrain = createTerrain(length, COLOR_DARK, COLOR_GLOW)
  const dust = createAmbientDust(5200, length, COLOR_DARK, COLOR_GLOW)
  const vortex = createVortex(SCROLL_END_Z + 6, COLOR_DARK, new THREE.Color('#ffd9c2'))

  scene.add(backdrop.mesh)
  scene.add(terrain.mesh)
  scene.add(dust.points)
  scene.add(vortex.points)

  // Solution cards render as particle clouds parented to the camera —
  // always dead-center in view regardless of the dolly's pitch/sway —
  // one per pick station, each fading/assembling as its own station
  // comes into focus.
  const pickSections = SECTIONS.filter((s): s is PickSection => s.kind === 'pick')
  const pickClouds = pickSections.map((section, idx) =>
    createPickCloud(ICON_BUILDERS[section.icon](1260), COLOR_DARK, COLOR_GLOW, idx * 137),
  )
  pickClouds.forEach((cloud) => {
    cloud.points.position.set(0, -0.35, -5.5)
    camera.add(cloud.points)
  })
  scene.add(camera)

  if (import.meta.env.DEV) {
    ;(window as unknown as { __debugScene: unknown }).__debugScene = { backdrop, terrain, dust, vortex, pickClouds }
  }

  let width = container.clientWidth
  let height = container.clientHeight

  // Cursor-reactive hover glow: strength ramps up on movement and
  // decays back to 0 when the pointer stops or leaves.
  const mouseUv = new THREE.Vector2(0.5, 0.3)
  const targetMouseUv = new THREE.Vector2(0.5, 0.3)
  let hoverTarget = 0
  let hoverStrength = 0
  let lastMoveAt = 0

  function onPointerMove(e: PointerEvent) {
    const rect = container.getBoundingClientRect()
    targetMouseUv.set((e.clientX - rect.left) / rect.width, 1 - (e.clientY - rect.top) / rect.height)
    hoverTarget = 1
    lastMoveAt = performance.now()
  }
  function onPointerLeave() {
    hoverTarget = 0
  }
  container.addEventListener('pointermove', onPointerMove)
  container.addEventListener('pointerleave', onPointerLeave)

  function resize() {
    width = container.clientWidth
    height = container.clientHeight
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    camera.aspect = width / height
    camera.updateProjectionMatrix()
  }
  resize()
  window.addEventListener('resize', resize)

  const clock = new THREE.Clock()
  const cursorNDC = new THREE.Vector2(0, 0)
  let currentZ = 0
  let rafId = 0

  function render() {
    const t = clock.getElapsedTime()

    if (performance.now() - lastMoveAt > 200) hoverTarget = 0
    hoverStrength += (hoverTarget - hoverStrength) * 0.06
    mouseUv.lerp(targetMouseUv, 0.15)

    backdrop.update(t, width / height)
    backdrop.setHover(mouseUv, hoverStrength)
    terrain.update(t)
    dust.update(t)
    vortex.update(t, currentZ)

    cursorNDC.set(mouseUv.x * 2 - 1, mouseUv.y * 2 - 1)
    pickClouds.forEach((cloud, idx) => {
      const reveal = stationVisibility(currentZ, pickSections[idx].z)
      cloud.update(t, reveal, cursorNDC, hoverStrength)
    })

    renderer.render(scene, camera)
    rafId = requestAnimationFrame(render)
  }
  rafId = requestAnimationFrame(render)

  return {
    camera,
    setCameraZ(z: number) {
      currentZ = z
      camera.position.z = z
      // A gentle downward pitch plus a subtle sway keeps the ride from
      // feeling like a locked-off dolly shot.
      camera.rotation.x = -0.06 - Math.min(0.05, Math.abs(z) * 0.0006)
      camera.position.x = Math.sin(z * 0.05) * 0.4
    },
    getCameraZ() {
      return currentZ
    },
    dispose() {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', resize)
      container.removeEventListener('pointermove', onPointerMove)
      container.removeEventListener('pointerleave', onPointerLeave)
      backdrop.dispose()
      terrain.dispose()
      dust.dispose()
      vortex.dispose()
      pickClouds.forEach((cloud) => cloud.dispose())
      renderer.dispose()
      container.removeChild(renderer.domElement)
    },
  }
}

import * as THREE from 'three'
import { createBackdrop } from './Backdrop'
import { createTerrain } from './Terrain'
import { createAmbientDust } from './AmbientDust'
import { createVortex } from './Vortex'
import { SCROLL_END_Z } from '../content/sections'

const COLOR_DARK = new THREE.Color('#141d08')
const COLOR_GLOW = new THREE.Color('#d4f24a')
const COLOR_SKY = new THREE.Color('#04040a')

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
  const vortex = createVortex(SCROLL_END_Z + 6, COLOR_DARK, new THREE.Color('#eaffb0'))

  scene.add(backdrop.mesh)
  scene.add(terrain.mesh)
  scene.add(dust.points)
  scene.add(vortex.points)

  let width = container.clientWidth
  let height = container.clientHeight

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
  let currentZ = 0
  let rafId = 0

  function render() {
    const t = clock.getElapsedTime()
    backdrop.update(t, width / height)
    terrain.update(t)
    dust.update(t)
    vortex.update(t)
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
      backdrop.dispose()
      terrain.dispose()
      dust.dispose()
      vortex.dispose()
      renderer.dispose()
      container.removeChild(renderer.domElement)
    },
  }
}

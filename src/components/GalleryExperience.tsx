import { useEffect, useRef, useState } from 'react'
import { createGalleryScene } from '../scene/GalleryScene'
import { ScrollEngine } from '../scene/scrollEngine'
import { SCROLL_END_Z } from '../content/sections'
import { Chrome } from './Chrome'
import { SectionsOverlay } from './SectionsOverlay'

function labelFor(progress: number) {
  if (progress < 0.04) return 'scroll to dive in'
  if (progress < 0.85) return 'keep going'
  return 'almost there'
}

export function GalleryExperience() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [cameraZ, setCameraZ] = useState(0)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const scene = createGalleryScene(container)
    const engine = new ScrollEngine({
      minZ: SCROLL_END_Z,
      maxZ: 0,
      onUpdate: (z, p) => {
        scene.setCameraZ(z)
        setCameraZ(z)
        setProgress(p)
      },
    })
    engine.mount()

    return () => {
      engine.unmount()
      scene.dispose()
    }
  }, [])

  return (
    <div className="fixed inset-0 bg-[var(--bg)] overflow-hidden">
      <div ref={containerRef} className="absolute inset-0" />
      <SectionsOverlay cameraZ={cameraZ} />
      <Chrome progress={progress} label={labelFor(progress)} />
    </div>
  )
}

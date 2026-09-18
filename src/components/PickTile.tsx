import { useMemo } from 'react'

interface PickTileProps {
  id: string
  tilesX: number
  tilesY: number
  reveal: number // 0..1
}

// Keeps generated placeholder tiles within the brand's coral→gold→violet
// family (roughly hue 300°→380°/20° through magenta-red-orange) instead
// of spanning the full wheel into unrelated greens/blues.
function hueFromId(id: string) {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 1000
  return (300 + (h / 1000) * 80) % 360
}

/**
 * A grid of small tiles standing in for a project screenshot, each one
 * scaling in on its own delay so the card reads as assembling itself —
 * swap the gradient for a real `background-image` per tile once real
 * project photos are supplied.
 */
export function PickTile({ id, tilesX, tilesY, reveal }: PickTileProps) {
  const hue = useMemo(() => hueFromId(id), [id])
  const tiles = useMemo(() => {
    const arr: { x: number; y: number; delay: number }[] = []
    for (let y = 0; y < tilesY; y++) {
      for (let x = 0; x < tilesX; x++) {
        const centerDist = Math.hypot(x - tilesX / 2, y - tilesY / 2)
        arr.push({ x, y, delay: centerDist * 0.02 + ((x * 7 + y * 13) % 5) * 0.01 })
      }
    }
    return arr
  }, [tilesX, tilesY])

  return (
    <div
      className="relative"
      style={{
        width: 'min(46vw, 560px)',
        aspectRatio: '4 / 3',
        perspective: '900px',
      }}
    >
      <div
        className="absolute inset-0 grid"
        style={{
          gridTemplateColumns: `repeat(${tilesX}, 1fr)`,
          gridTemplateRows: `repeat(${tilesY}, 1fr)`,
          gap: '2px',
          transform: `rotateX(8deg) rotateY(-10deg) scale(${0.94 + reveal * 0.06})`,
          transformStyle: 'preserve-3d',
          opacity: reveal,
          transition: 'opacity 0.2s linear',
        }}
      >
        {tiles.map((t) => {
          const localReveal = Math.max(0, Math.min(1, (reveal - t.delay) / (1 - t.delay)))
          return (
            <div
              key={`${t.x}-${t.y}`}
              style={{
                background: `linear-gradient(135deg, hsl(${hue} 55% ${18 + (t.y / tilesY) * 30}%), hsl(${
                  (hue + 40) % 360
                } 70% ${28 + (t.x / tilesX) * 20}%))`,
                backgroundSize: `${tilesX * 100}% ${tilesY * 100}%`,
                backgroundPosition: `${(t.x / (tilesX - 1)) * 100}% ${(t.y / (tilesY - 1)) * 100}%`,
                transform: `scale(${0.3 + localReveal * 0.7})`,
                opacity: localReveal,
                borderRadius: 2,
              }}
            />
          )
        })}
      </div>
    </div>
  )
}

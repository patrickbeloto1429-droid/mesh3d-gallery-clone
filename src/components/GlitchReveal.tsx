import { useEffect, useState, type ReactNode } from 'react'

/**
 * Plays a brief red/cyan chromatic-aberration split the moment a section
 * crosses into view, then settles to a plain, crisp render. Re-triggers
 * every time `active` flips from false to true.
 */
export function GlitchReveal({ active, children }: { active: boolean; children: ReactNode }) {
  const [playKey, setPlayKey] = useState(0)
  const [wasActive, setWasActive] = useState(false)

  useEffect(() => {
    if (active && !wasActive) setPlayKey((k) => k + 1)
    setWasActive(active)
  }, [active, wasActive])

  return (
    <span className="relative inline-block">
      <span
        key={`c-${playKey}`}
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{ color: '#5cf0ff', mixBlendMode: 'screen', animation: active ? 'glitch-cyan 0.45s ease-out' : 'none' }}
      >
        {children}
      </span>
      <span
        key={`r-${playKey}`}
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{ color: '#ff5c5c', mixBlendMode: 'screen', animation: active ? 'glitch-red 0.45s ease-out' : 'none' }}
      >
        {children}
      </span>
      {children}
    </span>
  )
}

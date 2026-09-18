import { SECTIONS } from '../content/sections'
import { stationVisibility } from '../scene/windowing'
import { GlitchReveal } from './GlitchReveal'
import { PickTile } from './PickTile'

const displayFont = { fontFamily: 'var(--font-display)', textShadow: '0 4px 30px rgba(0,0,0,0.55)' }
const uiFont = { fontFamily: 'var(--font-ui)' }

function Caption({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-[12px] tracking-[0.12em] uppercase text-center max-w-[36ch] mx-auto"
      style={{ ...uiFont, color: 'var(--muted)', textShadow: '0 1px 12px rgba(0,0,0,0.8)' }}
    >
      {children}
    </p>
  )
}

export function SectionsOverlay({ cameraZ }: { cameraZ: number }) {
  return (
    <div className="fixed inset-0 z-10 pointer-events-none">
      {SECTIONS.map((section) => {
        const v = stationVisibility(cameraZ, section.z)
        if (v <= 0.001) return null
        const style: React.CSSProperties = {
          opacity: v,
          transform: `translateY(${(1 - v) * 18}px)`,
        }

        if (section.kind === 'hero') {
          // Mobile: everything centers and stacks with even spacing —
          // matches the reference's phone layout. Desktop (sm+) splits
          // the two lines into opposite corners with the caption between.
          return (
            <div
              key={section.id}
              className="absolute inset-0 flex flex-col justify-center items-center text-center gap-8 px-8 sm:justify-between sm:items-stretch sm:text-inherit sm:gap-0 sm:py-24"
              style={style}
            >
              <h1
                className="text-[clamp(40px,9vw,104px)] leading-none font-medium text-white"
                style={displayFont}
              >
                {section.lineA}
              </h1>
              <div className="sm:mx-auto">
                <Caption>{section.caption}</Caption>
              </div>
              <h1
                className="text-[clamp(40px,9vw,104px)] leading-none font-medium sm:text-right sm:self-end"
                style={{ ...displayFont, color: 'var(--fg-secondary)' }}
              >
                {section.lineB}
              </h1>
            </div>
          )
        }

        if (section.kind === 'stat') {
          return (
            <div key={section.id} className="absolute inset-0 flex flex-col items-center justify-center gap-6" style={style}>
              <div className="flex items-end gap-3">
                <GlitchReveal active={v > 0.9}>
                  <span className="text-[clamp(36px,7vw,88px)] leading-none font-medium text-white" style={displayFont}>
                    {section.label}
                  </span>
                </GlitchReveal>
                <span className="text-[clamp(14px,1.6vw,22px)] pb-2" style={{ ...uiFont, color: 'var(--muted)' }}>
                  ({section.value})
                </span>
              </div>
              <Caption>{section.caption}</Caption>
            </div>
          )
        }

        if (section.kind === 'maker') {
          return (
            <div key={section.id} className="absolute inset-0 flex flex-col items-center justify-center gap-4" style={style}>
              <span className="text-[11px] tracking-[0.2em] uppercase" style={{ ...uiFont, color: 'var(--muted)' }}>
                {section.kicker}
              </span>
              <GlitchReveal active={v > 0.9}>
                <span className="text-[clamp(32px,6vw,72px)] font-medium text-white" style={displayFont}>
                  {section.name}
                </span>
              </GlitchReveal>
              <Caption>{section.caption}</Caption>
            </div>
          )
        }

        if (section.kind === 'pick') {
          return (
            <div key={section.id} className="absolute inset-0 flex flex-col items-center justify-center gap-5" style={style}>
              <span className="text-[11px] tracking-[0.2em] uppercase" style={{ ...uiFont, color: 'var(--muted)' }}>
                {section.kicker}
              </span>
              <div className="relative flex items-center justify-center">
                <PickTile id={section.id} tilesX={section.tilesX} tilesY={section.tilesY} reveal={v} />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
                  <span
                    className="text-[clamp(28px,5.5vw,60px)] font-medium text-white"
                    style={{ ...displayFont, textShadow: '0 2px 24px rgba(0,0,0,0.6)' }}
                  >
                    {section.title}
                  </span>
                  <span className="text-[13px] mt-1" style={{ ...uiFont, color: 'var(--muted)' }}>
                    {section.byline}
                  </span>
                </div>
              </div>
              <Caption>{section.caption}</Caption>
            </div>
          )
        }

        // outro
        const nearEnd = v
        return (
          <div key={section.id} className="absolute inset-0 flex flex-col items-center justify-center gap-2" style={style}>
            <div className="relative text-center">
              <div
                className="flex flex-col items-center"
                style={{ opacity: 1 - Math.min(1, nearEnd * 1.6), position: nearEnd > 0.6 ? 'absolute' : 'static', inset: 0 }}
              >
                {section.linesA.map((l) => (
                  <span key={l} className="text-[clamp(32px,7vw,80px)] font-medium text-white leading-tight" style={displayFont}>
                    {l}
                  </span>
                ))}
              </div>
              <div
                className="flex flex-col items-center"
                style={{ opacity: Math.max(0, Math.min(1, (nearEnd - 0.5) * 2)) }}
              >
                {section.linesB.map((l) => (
                  <span key={l} className="text-[clamp(32px,7vw,80px)] font-medium text-white leading-tight" style={displayFont}>
                    {l}
                  </span>
                ))}
              </div>
            </div>
            {nearEnd > 0.75 && (
              <a
                href={section.ctaHref}
                className="pointer-events-auto mt-6 px-6 py-3 rounded-full text-[14px] font-medium text-white"
                style={{ ...uiFont, background: 'var(--accent-gradient)', opacity: Math.min(1, (nearEnd - 0.75) * 4) }}
              >
                {section.cta}
              </a>
            )}
          </div>
        )
      })}
    </div>
  )
}

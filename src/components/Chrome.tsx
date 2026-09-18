import { useState } from 'react'

interface ChromeProps {
  progress: number
  label: string
}

export function Chrome({ progress, label }: ChromeProps) {
  const [audioOn, setAudioOn] = useState(false)

  return (
    <>
      <div
        className="fixed top-0 left-0 right-0 h-[3px] z-30"
        style={{ background: 'rgba(255,255,255,0.06)' }}
      >
        <div
          className="h-full"
          style={{
            width: `${Math.round(progress * 100)}%`,
            background: 'var(--accent)',
            transition: 'width 0.1s linear',
          }}
        />
      </div>

      <header className="fixed top-5 left-0 right-0 z-20 flex items-center justify-between px-6 pointer-events-none select-none">
        <span className="text-[11px] tracking-[0.18em] uppercase text-white/80" style={{ fontFamily: 'var(--font-ui)' }}>
          {label}
        </span>

        <a
          href="/"
          className="pointer-events-auto flex items-center gap-1 text-[15px] font-medium text-white"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          gallery <span aria-hidden>»</span>
        </a>

        <button
          type="button"
          onClick={() => setAudioOn((v) => !v)}
          className="pointer-events-auto flex items-center gap-2 text-[11px] tracking-[0.18em] uppercase text-white/80"
          style={{ fontFamily: 'var(--font-ui)' }}
        >
          audio {audioOn ? 'on' : 'off'}
          <span className="flex items-end gap-[2px] h-3">
            {[3, 6, 4].map((h, i) => (
              <span
                key={i}
                className="w-[2px] bg-white/70"
                style={{ height: audioOn ? `${h}px` : '2px', transition: 'height 0.2s ease' }}
              />
            ))}
          </span>
        </button>
      </header>

      <footer className="fixed bottom-5 left-0 right-0 z-20 flex items-center justify-between px-6 pointer-events-none select-none">
        <button type="button" className="pointer-events-auto text-[11px] tracking-[0.18em] uppercase text-white/80">
          share
        </button>
        <span className="text-[11px] tracking-[0.18em] uppercase text-white/50">built for a real client</span>
      </footer>
    </>
  )
}

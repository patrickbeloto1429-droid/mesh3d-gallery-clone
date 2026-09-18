/**
 * Drives a virtual scroll progress value from wheel / touch / keyboard
 * input instead of native document scroll. There is no scrollbar and no
 * real scrollable element — input is captured on the window, accumulated
 * into a target depth, and eased toward every frame.
 */
export interface ScrollEngineOptions {
  minZ: number
  maxZ: number
  ease?: number
  wheelSpeed?: number
  onUpdate: (z: number, progress: number) => void
}

export class ScrollEngine {
  private targetZ = 0
  private currentZ = 0
  private raf = 0
  private readonly ease: number
  private readonly wheelSpeed: number
  private readonly minZ: number
  private readonly maxZ: number
  private readonly onUpdate: ScrollEngineOptions['onUpdate']
  private touchStartY = 0
  private disposed = false

  constructor(opts: ScrollEngineOptions) {
    this.minZ = opts.minZ
    this.maxZ = opts.maxZ
    this.ease = opts.ease ?? 0.08
    this.wheelSpeed = opts.wheelSpeed ?? 0.9
    this.onUpdate = opts.onUpdate

    this.onWheel = this.onWheel.bind(this)
    this.onTouchStart = this.onTouchStart.bind(this)
    this.onTouchMove = this.onTouchMove.bind(this)
    this.onKeyDown = this.onKeyDown.bind(this)
    this.tick = this.tick.bind(this)
  }

  mount() {
    const html = document.documentElement
    const body = document.body
    this.prevHtmlOverflow = html.style.overflow
    this.prevBodyOverflow = body.style.overflow
    html.style.overflow = 'hidden'
    body.style.overflow = 'hidden'

    window.addEventListener('wheel', this.onWheel, { passive: false })
    window.addEventListener('touchstart', this.onTouchStart, { passive: true })
    window.addEventListener('touchmove', this.onTouchMove, { passive: false })
    window.addEventListener('keydown', this.onKeyDown)

    this.raf = requestAnimationFrame(this.tick)
  }

  private prevHtmlOverflow = ''
  private prevBodyOverflow = ''

  unmount() {
    this.disposed = true
    cancelAnimationFrame(this.raf)
    window.removeEventListener('wheel', this.onWheel)
    window.removeEventListener('touchstart', this.onTouchStart)
    window.removeEventListener('touchmove', this.onTouchMove)
    window.removeEventListener('keydown', this.onKeyDown)
    document.documentElement.style.overflow = this.prevHtmlOverflow
    document.body.style.overflow = this.prevBodyOverflow
  }

  jumpTo(z: number) {
    this.targetZ = this.clamp(z)
  }

  get progress() {
    return (this.maxZ - this.currentZ) / (this.maxZ - this.minZ)
  }

  private clamp(z: number) {
    return Math.min(this.maxZ, Math.max(this.minZ, z))
  }

  private onWheel(e: WheelEvent) {
    e.preventDefault()
    const delta = e.deltaMode === 1 ? e.deltaY * 18 : e.deltaY
    this.targetZ = this.clamp(this.targetZ - delta * this.wheelSpeed * 0.02)
  }

  private onTouchStart(e: TouchEvent) {
    this.touchStartY = e.touches[0].clientY
  }

  private onTouchMove(e: TouchEvent) {
    e.preventDefault()
    const y = e.touches[0].clientY
    const delta = this.touchStartY - y
    this.touchStartY = y
    this.targetZ = this.clamp(this.targetZ - delta * this.wheelSpeed * 0.06)
  }

  private onKeyDown(e: KeyboardEvent) {
    const step = 8
    if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
      e.preventDefault()
      this.targetZ = this.clamp(this.targetZ - step)
    } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
      e.preventDefault()
      this.targetZ = this.clamp(this.targetZ + step)
    } else if (e.key === 'Home') {
      this.targetZ = this.maxZ
    } else if (e.key === 'End') {
      this.targetZ = this.minZ
    }
  }

  private tick() {
    if (this.disposed) return
    this.currentZ += (this.targetZ - this.currentZ) * this.ease
    if (Math.abs(this.targetZ - this.currentZ) < 0.001) this.currentZ = this.targetZ
    this.onUpdate(this.currentZ, this.progress)
    this.raf = requestAnimationFrame(this.tick)
  }
}

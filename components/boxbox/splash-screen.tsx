'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import './splash-screen.css'

type Phase = 'idle' | 'run' | 'exit' | 'leave'

const SIGN_PATHS = [
  'M42 150C52 110 62 78 74 56C78 100 84 118 92 132C100 100 112 70 126 50C126 90 128 116 134 140',
  'M134 140C150 112 160 92 176 70C180 96 186 118 194 132C206 100 214 72 226 44C250 22 276 34 268 62C262 84 232 98 210 102',
  'M18 168C6 188 90 192 170 150C235 116 290 70 300 38C306 16 270 8 248 30C232 46 226 78 236 100',
]

// [секунда, доля прогресса] — красная панель заливается с «рывками», как настоящая загрузка
const CURVE: ReadonlyArray<readonly [number, number]> = [
  [0.9, 0],
  [1.3, 0.16],
  [1.6, 0.19],
  [2.4, 0.55],
  [2.7, 0.58],
  [3.5, 0.9],
  [3.8, 0.92],
  [4.2, 1],
]
const EXIT_AT = 4.6
const LEAVE_AT = 5.5
const DONE_AT = 5.85

const ease = (x: number) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2)

function progressAt(t: number) {
  if (t <= CURVE[0][0]) return 0
  for (let i = 1; i < CURVE.length; i++) {
    if (t <= CURVE[i][0]) {
      const [t0, p0] = CURVE[i - 1]
      const [t1, p1] = CURVE[i]
      return p0 + (p1 - p0) * ease((t - t0) / (t1 - t0))
    }
  }
  return 1
}

// Растягиваем слово по ширине колонки и по высоте плашки, как на постере
function fitLine(el: HTMLElement | null, ctx: CanvasRenderingContext2D | null, frameW: number, heightRatio: number) {
  if (!el || !ctx) return
  const family = getComputedStyle(el).fontFamily
  const text = (el.textContent ?? '').toUpperCase()
  const base = 200
  ctx.font = `${base}px ${family}`
  const textW = ctx.measureText(text).width
  if (!textW) return
  const fontSize = (base * frameW * 0.74) / textW
  ctx.font = `${fontSize}px ${family}`
  const cap = ctx.measureText('H')
  const capH = cap.actualBoundingBoxAscent
  if (!capH) return
  const ascent = cap.fontBoundingBoxAscent
  const descent = cap.fontBoundingBoxDescent
  const targetH = frameW * heightRatio
  const baselineY = (fontSize - (ascent + descent)) / 2 + ascent
  el.style.fontSize = `${fontSize}px`
  el.style.lineHeight = `${fontSize}px`
  el.style.transformOrigin = `0 ${baselineY}px`
  el.style.transform = `translateY(${targetH - baselineY}px) scale(1, ${targetH / capH})`
}

export function SplashScreen({ onDone }: { onDone: () => void }) {
  const [mounted, setMounted] = useState(false)
  const [phase, setPhase] = useState<Phase>('idle')
  const frameRef = useRef<HTMLDivElement>(null)
  const maxRef = useRef<HTMLSpanElement>(null)
  const verRef = useRef<HTMLSpanElement>(null)
  const numRef = useRef<HTMLElement>(null)
  const pctRef = useRef<HTMLDivElement>(null)
  const doneRef = useRef(onDone)
  doneRef.current = onDone

  useEffect(() => {
    setMounted(true)
    document.documentElement.classList.add('is-booting')
    document.body.classList.add('is-booting')
    return () => {
      document.documentElement.classList.remove('is-booting')
      document.body.classList.remove('is-booting')
    }
  }, [])

  useEffect(() => {
    if (!mounted) return
    const frame = frameRef.current
    if (!frame) return

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const ctx = document.createElement('canvas').getContext('2d')
    const timers: number[] = []
    let raf = 0
    let cancelled = false

    const render = (p: number) => {
      frame.style.setProperty('--p', p.toFixed(4))
      if (numRef.current) numRef.current.textContent = String(Math.round(p * 33)).padStart(2, '0')
      if (pctRef.current) pctRef.current.textContent = `${String(Math.round(p * 100)).padStart(3, '0')}%`
    }
    const fit = () => {
      const w = frame.clientWidth
      fitLine(maxRef.current, ctx, w, 0.376)
      fitLine(verRef.current, ctx, w, 0.152)
    }

    const observer = new ResizeObserver(fit)
    observer.observe(frame)

    const boot = () => {
      if (cancelled) return
      fit()
      if (reduce) {
        render(1)
        setPhase('run')
        timers.push(
          window.setTimeout(() => setPhase('leave'), 700),
          window.setTimeout(() => doneRef.current(), 1000),
        )
        return
      }

      render(0)
      setPhase('run')
      const startedAt = performance.now()
      const loop = (now: number) => {
        const t = (now - startedAt) / 1000
        render(progressAt(t))
        if (t < EXIT_AT) raf = requestAnimationFrame(loop)
        else render(1)
      }
      raf = requestAnimationFrame(loop)
      timers.push(
        window.setTimeout(() => setPhase('exit'), EXIT_AT * 1000),
        window.setTimeout(() => setPhase('leave'), LEAVE_AT * 1000),
        window.setTimeout(() => doneRef.current(), DONE_AT * 1000),
      )
    }

    const family = maxRef.current ? getComputedStyle(maxRef.current).fontFamily : ''
    const fontReady = document.fonts?.load ? document.fonts.load(`200px ${family}`, 'MAX') : Promise.resolve([])
    const fallback = new Promise((resolve) => window.setTimeout(resolve, 900))
    Promise.race([fontReady, fallback]).then(boot, boot)

    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
      timers.forEach((id) => clearTimeout(id))
      observer.disconnect()
    }
  }, [mounted])

  const cls = [
    'ps',
    phase !== 'idle' && 'ps-run',
    (phase === 'exit' || phase === 'leave') && 'ps-exit',
    phase === 'leave' && 'ps-leave',
  ]
    .filter(Boolean)
    .join(' ')

  const node = (
    <div className={cls} role="status" aria-label="Загрузка">
      <div className="ps-grain" aria-hidden="true" />
      <div className="ps-band" aria-hidden="true" />
      <div className="ps-frame" ref={frameRef} aria-hidden="true">
        <div className="ps-tiny ps-top">Oracle Red Bull Racing</div>
        <i className="ps-cross ps-c1" />
        <i className="ps-cross ps-c2" />
        <i className="ps-cross ps-c3" />
        <i className="ps-cross ps-c4" />

        <div className="ps-line ps-max">
          <span className="ps-rise">
            <span className="ps-fit" ref={maxRef}>
              MAX
            </span>
          </span>
        </div>
        <div className="ps-line ps-ver">
          <span className="ps-rise">
            <span className="ps-fit" ref={verRef}>
              VERSTAPPEN
            </span>
          </span>
        </div>

        <svg className="ps-sign" viewBox="0 0 340 200">
          {SIGN_PATHS.map((d) => (
            <path key={d} d={d} pathLength={1} />
          ))}
        </svg>

        <div className="ps-panel">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/img/Simply%20lovely%20by%20Verstappen.jpeg" alt="" decoding="async" />
        </div>

        <div className="ps-tiny ps-side ps-l">World champion &nbsp; 2021 2022 2023 2024</div>
        <div className="ps-tiny ps-side ps-r">One goal. One vision. Four time world champion.</div>

        <div className="ps-brand ps-brand-l">BOXBOX</div>
        <div className="ps-brand ps-brand-r" ref={pctRef}>
          000%
        </div>
        <div className="ps-count">
          <b ref={numRef}>00</b>
          <small>Загрузка гонки</small>
        </div>
      </div>
    </div>
  )

  if (!mounted) return null
  return createPortal(node, document.body)
}

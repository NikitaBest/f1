'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

const STROKES = [
  { d: 'M42 150C52 110 62 78 74 56C78 100 84 118 92 132C100 100 112 70 126 50C126 90 128 116 134 140', delay: 0.15, dur: 0.6 },
  { d: 'M134 140C150 112 160 92 176 70C180 96 186 118 194 132C206 100 214 72 226 44C250 22 276 34 268 62C262 84 232 98 210 102', delay: 0.7, dur: 0.65 },
  { d: 'M18 168C6 188 90 192 170 150C235 116 290 70 300 38C306 16 270 8 248 30C232 46 226 78 236 100', delay: 1.3, dur: 0.7 },
]

const WORD = 'simply lovely'

function coverHeight() {
  const vv = window.visualViewport?.height ?? 0
  return Math.ceil(Math.max(window.innerHeight, vv, window.screen.height, document.documentElement.clientHeight) + 80)
}

export function SplashScreen({ onDone }: { onDone: () => void }) {
  const [leaving, setLeaving] = useState(false)
  const [typed, setTyped] = useState('')
  const [mounted, setMounted] = useState(false)
  const [h, setH] = useState(0)
  const doneRef = useRef(onDone)
  doneRef.current = onDone

  useEffect(() => {
    setMounted(true)
    const apply = () => setH(coverHeight())
    apply()

    const meta = document.querySelector('meta[name="theme-color"]')
    const prevTheme = meta?.getAttribute('content')
    meta?.setAttribute('content', '#000000')
    document.documentElement.classList.add('is-booting')
    document.body.classList.add('is-booting')

    window.visualViewport?.addEventListener('resize', apply)
    window.addEventListener('resize', apply)
    window.addEventListener('orientationchange', apply)

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      setTyped(WORD)
      const leave = setTimeout(() => setLeaving(true), 300)
      const done = setTimeout(() => doneRef.current(), 500)
      return () => {
        clearTimeout(leave)
        clearTimeout(done)
        window.visualViewport?.removeEventListener('resize', apply)
        window.removeEventListener('resize', apply)
        window.removeEventListener('orientationchange', apply)
        meta?.setAttribute('content', prevTheme ?? '#0a1033')
        document.documentElement.classList.remove('is-booting')
        document.body.classList.remove('is-booting')
      }
    }

    let i = 0
    const typeTimer = setInterval(() => {
      i += 1
      setTyped(WORD.slice(0, i))
      if (i >= WORD.length) clearInterval(typeTimer)
    }, 70)

    const leave = setTimeout(() => setLeaving(true), 2800)
    const done = setTimeout(() => doneRef.current(), 3150)
    return () => {
      clearTimeout(leave)
      clearTimeout(done)
      clearInterval(typeTimer)
      window.visualViewport?.removeEventListener('resize', apply)
      window.removeEventListener('resize', apply)
      window.removeEventListener('orientationchange', apply)
      meta?.setAttribute('content', prevTheme ?? '#0a1033')
      document.documentElement.classList.remove('is-booting')
      document.body.classList.remove('is-booting')
    }
  }, [])

  const node = (
    <div
      className={`splash${leaving ? ' is-leaving' : ''}`}
      style={h ? { height: h } : undefined}
      role="status"
      aria-label="Загрузка"
    >
      <svg className="sign" viewBox="0 0 340 200" fill="none" aria-hidden="true">
        {STROKES.map((s, i) => (
          <path
            key={i}
            d={s.d}
            pathLength={1}
            style={{ animationDelay: `${s.delay}s`, animationDuration: `${s.dur}s` }}
          />
        ))}
      </svg>
      <h1 className="splash-word disp" aria-label={WORD}>
        {typed}
      </h1>
    </div>
  )

  if (!mounted) return null
  return createPortal(node, document.body)
}

'use client'

import { useEffect, useRef, useState } from 'react'

const STROKES = [
  { d: 'M42 150C52 110 62 78 74 56C78 100 84 118 92 132C100 100 112 70 126 50C126 90 128 116 134 140', delay: 0.15, dur: 0.6 },
  { d: 'M134 140C150 112 160 92 176 70C180 96 186 118 194 132C206 100 214 72 226 44C250 22 276 34 268 62C262 84 232 98 210 102', delay: 0.7, dur: 0.65 },
  { d: 'M18 168C6 188 90 192 170 150C235 116 290 70 300 38C306 16 270 8 248 30C232 46 226 78 236 100', delay: 1.3, dur: 0.7 },
]

export function SplashScreen({ onDone }: { onDone: () => void }) {
  const [leaving, setLeaving] = useState(false)
  const doneRef = useRef(onDone)
  doneRef.current = onDone

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const leave = setTimeout(() => setLeaving(true), reduce ? 300 : 2300)
    const done = setTimeout(() => doneRef.current(), reduce ? 500 : 2650)
    return () => {
      clearTimeout(leave)
      clearTimeout(done)
    }
  }, [])

  return (
    <div className={`splash${leaving ? ' is-leaving' : ''}`} role="status" aria-label="Загрузка">
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
      <h1 className="splash-word disp">
        Box<span>·</span>Box
      </h1>
    </div>
  )
}

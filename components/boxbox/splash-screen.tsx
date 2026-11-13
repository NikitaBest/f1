'use client'

import { useEffect, useRef, useState } from 'react'
import { Ticker } from './art'

const LIGHTS = 5
const STATUS = [
  'Выезжаем из боксов',
  'Загружаем календарь',
  'Подключаем телеметрию',
  'Греем шины',
  'Огни погасли — поехали!',
]

const ease = (x: number) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2)

export function SplashScreen({ onDone }: { onDone: () => void }) {
  const season = new Date().getFullYear()
  const [pct, setPct] = useState(0)
  const [leaving, setLeaving] = useState(false)
  const doneRef = useRef(onDone)
  doneRef.current = onDone

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const total = reduce ? 1200 : 3800
    const start = Date.now()
    const timers: ReturnType<typeof setTimeout>[] = []

    const interval = setInterval(() => {
      const next = Math.min(100, Math.floor(ease(Math.min(1, (Date.now() - start) / total)) * 100))
      setPct(next)
      if (next < 100) return
      clearInterval(interval)
      timers.push(setTimeout(() => setLeaving(true), reduce ? 200 : 800))
      timers.push(setTimeout(() => doneRef.current(), reduce ? 400 : 1250))
    }, 40)
    return () => {
      clearInterval(interval)
      timers.forEach(clearTimeout)
    }
  }, [])

  const go = pct >= 100
  const lit = go ? 0 : Math.min(LIGHTS, Math.floor(pct / 16))
  const status = STATUS[go ? 4 : Math.min(3, Math.floor(pct / 25))]

  return (
    <div className={`splash${go ? ' is-go' : ''}${leaving ? ' is-leaving' : ''}`} aria-busy={!go}>
      <div className="splash-img" role="img" aria-label="Шлем Макса Ферстаппена с номером 3 и красным львом" />
      <div className="splash-flash" aria-hidden="true" />
      <span className="splash-vert disp" aria-hidden="true">
        Verstappen
      </span>
      <div className="splash-fade" />
      <div className="splash-top">
        <span className="chip">Сезон {season}</span>
        <span className="eyebrow" style={{ color: 'var(--sun)' }}>
          Red Bull Racing
        </span>
      </div>
      <div className="splash-body">
        <div className="gantry" aria-hidden="true">
          {Array.from({ length: LIGHTS }, (_, i) => (
            <span key={i} className={`pod${i < lit ? ' on' : ''}`}>
              <i />
            </span>
          ))}
        </div>
        <Ticker className="splash-tick" words={['Box box', 'Oracle Red Bull Racing', 'Max Verstappen', `Сезон ${season}`]} />
        <h1 className="disp">
          Box<span>·</span>Box
        </h1>
        <div className="load">
          <div className="load-row">
            <span className="load-status" role="status">
              {status}
            </span>
            <b className="disp load-pct" aria-hidden="true">
              {pct}
              <small>%</small>
            </b>
          </div>
          <div className="track" aria-hidden="true">
            <span className="fill" style={{ transform: `scaleX(${pct / 100})` }} />
            <span className="car" style={{ left: `${pct}%` }} />
            <span className="flag" />
          </div>
        </div>
      </div>
    </div>
  )
}

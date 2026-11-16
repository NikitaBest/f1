'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { RotateCcw } from 'lucide-react'
import { CIRCUITS } from '@/lib/circuits'

const LOOP_MS = 11_000
const TAIL = 14
const AVG_KMH = 205

const fmtLap = (ms: number) => {
  const total = Math.max(0, ms)
  const m = Math.floor(total / 60_000)
  const s = Math.floor((total % 60_000) / 1000)
  const t = Math.floor((total % 1000) / 100)
  return `${m}:${String(s).padStart(2, '0')}.${t}`
}

export function hasCircuit(circuitId?: string) {
  return Boolean(circuitId && CIRCUITS[circuitId])
}

export function TrackLap({ circuitId }: { circuitId: string }) {
  const circuit = CIRCUITS[circuitId]
  const trackRef = useRef<SVGPathElement>(null)
  const carRef = useRef<SVGGElement>(null)
  const trailRef = useRef<SVGPathElement>(null)
  const startRef = useRef(0)
  const [sector, setSector] = useState(0)
  const [clock, setClock] = useState('0:00.0')
  const [reduced, setReduced] = useState(false)

  const lapMs = useMemo(() => (circuit ? (circuit.length / (AVG_KMH / 3.6)) * 1000 : 0), [circuit])

  useEffect(() => {
    setReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  }, [])

  useEffect(() => {
    const track = trackRef.current
    const car = carRef.current
    const trail = trailRef.current
    if (!track || !car || !trail || !circuit) return
    const len = track.getTotalLength()
    let raf = 0
    let lastSector = -1
    let lastClock = ''
    startRef.current = performance.now()

    const place = (p: number) => {
      const pt = track.getPointAtLength(p * len)
      car.setAttribute('transform', `translate(${pt.x.toFixed(2)} ${pt.y.toFixed(2)})`)
      const head = p * 100
      const tail = Math.min(TAIL, head)
      trail.setAttribute('stroke-dasharray', `${tail.toFixed(2)} ${(200 - tail).toFixed(2)}`)
      trail.setAttribute('stroke-dashoffset', `${(-(head - tail)).toFixed(2)}`)
      const sec = Math.min(2, Math.floor(p * 3))
      if (sec !== lastSector) {
        lastSector = sec
        setSector(sec)
      }
      const label = fmtLap(p * lapMs)
      if (label !== lastClock) {
        lastClock = label
        setClock(label)
      }
    }

    if (reduced) {
      place(0.02)
      return
    }

    const tick = (now: number) => {
      const p = ((now - startRef.current) % LOOP_MS) / LOOP_MS
      place(p)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [circuit, lapMs, reduced])

  if (!circuit) return null

  return (
    <section className="lap" aria-label={`Схема трассы: ${circuit.name}`}>
      <div className="lap-head">
        <div>
          <span className="eyebrow">Круг · демо</span>
          <h3 className="disp">{circuit.name}</h3>
        </div>
        <button
          type="button"
          className="lap-restart"
          onClick={() => {
            startRef.current = performance.now()
          }}
          aria-label="Запустить круг заново"
        >
          <RotateCcw size={16} aria-hidden="true" />
        </button>
      </div>

      <svg className="lap-svg" viewBox="0 0 100 100" role="img" aria-label={`Контур трассы ${circuit.name}`}>
        <defs>
          <filter id={`lap-glow-${circuitId}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.4" />
          </filter>
        </defs>
        <path d={circuit.path} className="lap-bed" pathLength={100} />
        <path d={circuit.path} className="lap-sec s1" pathLength={100} strokeDasharray="33.3 66.7" strokeDashoffset="0" />
        <path d={circuit.path} className="lap-sec s2" pathLength={100} strokeDasharray="33.3 66.7" strokeDashoffset="-33.3" />
        <path d={circuit.path} className="lap-sec s3" pathLength={100} strokeDasharray="33.4 66.6" strokeDashoffset="-66.6" />
        <path
          ref={trailRef}
          d={circuit.path}
          className="lap-trail"
          pathLength={100}
          filter={`url(#lap-glow-${circuitId})`}
          strokeDasharray="0 200"
        />
        <path ref={trackRef} d={circuit.path} fill="none" stroke="none" />
        <g ref={carRef}>
          <circle r="3.6" className="lap-car-halo" />
          <circle r="1.9" className="lap-car" />
        </g>
      </svg>

      <div className="lap-secs">
        {['S1', 'S2', 'S3'].map((s, i) => (
          <div key={s} className={`lap-sector s${i + 1}${sector === i ? ' on' : ''}`}>
            <small>{s}</small>
          </div>
        ))}
        <div className="lap-clock">
          <small>Круг</small>
          <b className="disp num">{clock}</b>
        </div>
      </div>
      <p className="lap-foot">
        {(circuit.length / 1000).toFixed(3)} км · средний темп {AVG_KMH} км/ч
      </p>
    </section>
  )
}

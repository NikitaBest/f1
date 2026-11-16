'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { RotateCcw } from 'lucide-react'
import useSWR from 'swr'
import { CIRCUITS } from '@/lib/circuits'
import type { BestLap } from '@/app/api/best-lap/route'

const fetchBestLap = async (url: string): Promise<BestLap> => {
  const res = await fetch(url)
  if (!res.ok) throw new Error('no lap data')
  return res.json()
}

const DEMO_SPLITS: [number, number] = [1 / 3, 1 / 3]

const LOOP_MS = 11_000
const TAIL = 14
const AVG_KMH = 205
const PLANE = 'translate(50 36) scale(0.76 0.47) rotate(-16) translate(-50 -50)'

/** Слои машины: смещение по экранной вертикали даёт объём и «подъём» над асфальтом. */
const CAR_LAYERS = [
  { id: 'shadow', dy: 0.6 },
  { id: 'mid', dy: -0.7 },
  { id: 'top', dy: -1.9 },
] as const

/** Слои стенок трассы: чем ниже, тем темнее. */
const WALL_LAYERS = [2.6, 1.9, 1.2, 0.5]

const fmtLap = (ms: number) => {
  const total = Math.max(0, ms)
  const m = Math.floor(total / 60_000)
  const s = Math.floor((total % 60_000) / 1000)
  const t = Math.floor((total % 1000) / 100)
  return `${m}:${String(s).padStart(2, '0')}.${t}`
}

const fmtFull = (seconds: number) => {
  const m = Math.floor(seconds / 60)
  return `${m}:${(seconds - m * 60).toFixed(3).padStart(6, '0')}`
}

export function hasCircuit(circuitId?: string) {
  return Boolean(circuitId && CIRCUITS[circuitId])
}

function CarShape({ layer }: { layer: 'shadow' | 'mid' | 'top' }) {
  const k = layer === 'top' ? '' : layer === 'mid' ? ' mid' : ' sh'
  return (
    <g>
      <rect x="-5" y="-1.8" width="1.3" height="3.6" rx="0.2" className={`car-wing${k}`} />
      <rect x="3.5" y="-2" width="1.3" height="4" rx="0.2" className={`car-wing${k}`} />
      <rect x="2.1" y="-2.1" width="1.5" height="0.9" rx="0.25" className={`car-wheel${k}`} />
      <rect x="2.1" y="1.2" width="1.5" height="0.9" rx="0.25" className={`car-wheel${k}`} />
      <rect x="-3.9" y="-2.3" width="1.9" height="1.1" rx="0.3" className={`car-wheel${k}`} />
      <rect x="-3.9" y="1.2" width="1.9" height="1.1" rx="0.3" className={`car-wheel${k}`} />
      <path d="M4 0 L1.8 -0.55 L-0.4 -1.05 L-3.6 -0.8 L-3.6 0.8 L-0.4 1.05 L1.8 0.55 Z" className={`car-body${k}`} />
      {layer === 'top' ? (
        <>
          <path d="M-0.2 -0.35 L-2 -0.35 L-2 0.35 L-0.2 0.35 Z" className="car-stripe" />
          <circle cx="-0.9" cy="0" r="0.5" className="car-helm" />
        </>
      ) : null}
    </g>
  )
}

export function TrackLap({ circuitId }: { circuitId: string }) {
  const circuit = CIRCUITS[circuitId]
  const trackRef = useRef<SVGPathElement>(null)
  const carRefs = useRef<(SVGGElement | null)[]>([])
  const trailRef = useRef<SVGPathElement>(null)
  const startRef = useRef(0)
  const [sector, setSector] = useState(0)
  const [clock, setClock] = useState('0:00.0')
  const [reduced, setReduced] = useState(false)

  const { data: best } = useSWR(`/api/best-lap?circuit=${circuitId}`, fetchBestLap, {
    revalidateOnFocus: false,
    shouldRetryOnError: false,
  })

  const lapMs = useMemo(() => {
    if (best) return best.lap * 1000
    return circuit ? (circuit.length / (AVG_KMH / 3.6)) * 1000 : 0
  }, [best, circuit])

  /** Доли круга, где заканчиваются S1 и S2. */
  const splits = useMemo<[number, number]>(() => {
    if (!best) return DEMO_SPLITS
    const total = best.s1 + best.s2 + best.s3
    return [best.s1 / total, (best.s1 + best.s2) / total]
  }, [best])
  const [end1, end2] = splits

  useEffect(() => {
    setReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  }, [])

  useEffect(() => {
    const track = trackRef.current
    const trail = trailRef.current
    if (!track || !trail || !circuit) return
    const len = track.getTotalLength()
    const look = len * 0.012
    let raf = 0
    let lastSector = -1
    let lastClock = ''
    let heading: number | null = null
    startRef.current = performance.now()

    const place = (p: number) => {
      const at = p * len
      const pt = track.getPointAtLength(at)
      const ahead = track.getPointAtLength((at + look) % len)
      const behind = track.getPointAtLength((at - look + len) % len)
      const target = (Math.atan2(ahead.y - behind.y, ahead.x - behind.x) * 180) / Math.PI
      if (heading === null) {
        heading = target
      } else {
        let diff = target - heading
        while (diff > 180) diff -= 360
        while (diff < -180) diff += 360
        heading += diff * 0.25
      }
      const tr = `translate(${pt.x.toFixed(2)} ${pt.y.toFixed(2)}) rotate(${heading.toFixed(1)})`
      carRefs.current.forEach((el) => el?.setAttribute('transform', tr))

      const head = p * 100
      const tail = Math.min(TAIL, head)
      trail.setAttribute('stroke-dasharray', `${tail.toFixed(2)} ${(200 - tail).toFixed(2)}`)
      trail.setAttribute('stroke-dashoffset', `${(-(head - tail)).toFixed(2)}`)
      const sec = p < end1 ? 0 : p < end2 ? 1 : 2
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
  }, [circuit, lapMs, reduced, end1, end2])

  if (!circuit) return null

  return (
    <section className="lap" aria-label={`Схема трассы: ${circuit.name}`}>
      <div className="lap-head">
        <div>
          <span className="eyebrow">{best ? `Круг · квалификация ${best.year}` : 'Круг · 3D демо'}</span>
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

      <svg className="lap-svg" viewBox="0 0 100 72" role="img" aria-label={`Контур трассы ${circuit.name}`}>
        <defs>
          <filter id={`lap-glow-${circuitId}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.4" />
          </filter>
        </defs>

        {WALL_LAYERS.map((dy, i) => (
          <g key={dy} transform={`translate(0 ${dy})`}>
            <g transform={PLANE}>
              <path d={circuit.path} className={`lap-wall w${i}`} />
            </g>
          </g>
        ))}

        <g transform={PLANE}>
          <path d={circuit.path} className="lap-bed" pathLength={100} />
          <path
            d={circuit.path}
            className="lap-sec s1"
            pathLength={100}
            strokeDasharray={`${(end1 * 100).toFixed(2)} ${(100 - end1 * 100).toFixed(2)}`}
            strokeDashoffset="0"
          />
          <path
            d={circuit.path}
            className="lap-sec s2"
            pathLength={100}
            strokeDasharray={`${((end2 - end1) * 100).toFixed(2)} ${(100 - (end2 - end1) * 100).toFixed(2)}`}
            strokeDashoffset={(-end1 * 100).toFixed(2)}
          />
          <path
            d={circuit.path}
            className="lap-sec s3"
            pathLength={100}
            strokeDasharray={`${((1 - end2) * 100).toFixed(2)} ${(end2 * 100).toFixed(2)}`}
            strokeDashoffset={(-end2 * 100).toFixed(2)}
          />
          <path
            ref={trailRef}
            d={circuit.path}
            className="lap-trail"
            pathLength={100}
            filter={`url(#lap-glow-${circuitId})`}
            strokeDasharray="0 200"
          />
          <path ref={trackRef} d={circuit.path} fill="none" stroke="none" />
        </g>

        {CAR_LAYERS.map((layer, i) => (
          <g key={layer.id} transform={`translate(0 ${layer.dy})`}>
            <g transform={PLANE}>
              <g
                ref={(el) => {
                  carRefs.current[i] = el
                }}
              >
                <CarShape layer={layer.id} />
              </g>
            </g>
          </g>
        ))}
      </svg>

      <div
        className="lap-secs"
        style={{ gridTemplateColumns: `${end1}fr ${end2 - end1}fr ${1 - end2}fr auto` }}
      >
        {['S1', 'S2', 'S3'].map((s, i) => {
          const time = best ? [best.s1, best.s2, best.s3][i] : null
          return (
            <div key={s} className={`lap-sector s${i + 1}${sector === i ? ' on' : ''}`}>
              <small>{s}</small>
              {time ? <span className="lap-sector-time num">{time.toFixed(3)}</span> : null}
            </div>
          )
        })}
        <div className="lap-clock">
          <small>Круг</small>
          <b className="disp num">{clock}</b>
        </div>
      </div>
      <p className="lap-foot">
        {best ? (
          <>
            <span className="lap-dot" style={{ background: best.color }} aria-hidden="true" />
            Лучший круг квалификации · {best.driver} · {fmtFull(best.lap)}
          </>
        ) : (
          <>
            {(circuit.length / 1000).toFixed(3)} км · демо-темп {AVG_KMH} км/ч
          </>
        )}
      </p>
    </section>
  )
}

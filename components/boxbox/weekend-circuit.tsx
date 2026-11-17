'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { RotateCcw } from 'lucide-react'
import type { CircuitProfile } from '@/app/api/circuit/route'
import type { LapRecord } from '@/app/api/lap-record/route'
import { CIRCUITS } from '@/lib/circuits'
import { useWk } from './weekend-data'

const VIEW_W = 100
const VIEW_H = 70
const AREA_W = 90
const AREA_H = 36
const AREA_TOP = 26
const WALL_DEPTH = 2.6
const WALL_STEPS = 9
const SQUASH_Y = 0.56

type Pt = { x: number; y: number }
type Pin = { n: string; x: number; y: number; h: number; at: number }

function typeLabel(type?: string) {
  if (!type) return null
  if (/street/i.test(type)) return 'Street'
  if (/road/i.test(type)) return 'Road'
  if (/permanent/i.test(type)) return 'Permanent'
  return type
}

function parsePoints(path: string): Pt[] {
  const out: Pt[] = []
  for (const m of path.matchAll(/(-?[\d.]+)[,\s]+(-?[\d.]+)/g)) out.push({ x: Number(m[1]), y: Number(m[2]) })
  return out
}

function bounds(pts: Pt[]) {
  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity
  for (const p of pts) {
    minX = Math.min(minX, p.x)
    maxX = Math.max(maxX, p.x)
    minY = Math.min(minY, p.y)
    maxY = Math.max(maxY, p.y)
  }
  return { minX, maxX, minY, maxY, w: maxX - minX || 1, h: maxY - minY || 1 }
}

function rotate(pts: Pt[], angle: number): Pt[] {
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  return pts.map(({ x, y }) => ({ x: x * cos - y * sin, y: x * sin + y * cos }))
}

/** Контур в изометрии: поворот вдоль самой длинной оси, сжатие по вертикали, вписывание во viewBox. */
function projectTrack(path: string) {
  const raw = parsePoints(path)
  let best = 0
  let bestRatio = 0
  for (let deg = 0; deg < 180; deg += 3) {
    const b = bounds(rotate(raw, (deg * Math.PI) / 180))
    if (b.w / b.h > bestRatio) {
      bestRatio = b.w / b.h
      best = deg
    }
  }
  const tilted = rotate(raw, (best * Math.PI) / 180).map((p) => ({ x: p.x, y: p.y * SQUASH_Y }))

  const { minX, minY, w, h } = bounds(tilted)
  const k = Math.min(AREA_W / w, AREA_H / h)
  const ox = (VIEW_W - w * k) / 2
  const oy = AREA_TOP + (AREA_H - h * k) / 2
  const pts = tilted.map((p) => ({ x: (p.x - minX) * k + ox, y: (p.y - minY) * k + oy }))

  const closed = [...pts, pts[0]]
  const cum = [0]
  for (let i = 1; i < closed.length; i++) {
    cum.push(cum[i - 1] + Math.hypot(closed[i].x - closed[i - 1].x, closed[i].y - closed[i - 1].y))
  }
  const d = `M${pts.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' L')} Z`
  return { d, closed, cum, total: cum[cum.length - 1], start: pts[0] }
}

function pointAt(track: { closed: Pt[]; cum: number[]; total: number }, fraction: number): Pt {
  const target = Math.min(0.999, Math.max(0, fraction)) * track.total
  let i = 1
  while (i < track.cum.length - 1 && track.cum[i] < target) i++
  const span = track.cum[i] - track.cum[i - 1] || 1
  const t = (target - track.cum[i - 1]) / span
  const a = track.closed[i - 1]
  const b = track.closed[i]
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }
}

export function startPoint(path: string) {
  const [first] = parsePoints(path)
  return first ?? { x: 50, y: 50 }
}

export function WeekendCircuit({ circuitId }: { circuitId: string }) {
  const shape = CIRCUITS[circuitId]
  const { data: profile } = useWk<CircuitProfile>('circuit', circuitId)
  const { data: record } = useWk<LapRecord>('lap-record', circuitId)
  const frameRef = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  const [cycle, setCycle] = useState(0)

  const track = useMemo(() => (shape ? projectTrack(shape.path) : null), [shape])

  const pins = useMemo<Pin[]>(() => {
    if (!shape || !track || !profile) return []
    return profile.corners.map((c, i) => {
      const at = Math.min(0.995, Math.max(0.002, c.length / shape.length))
      const p = pointAt(track, at)
      return {
        n: String(c.number).padStart(2, '0') + (c.letter ?? ''),
        x: p.x,
        y: p.y,
        h: 4 + (i % 5) * 3.1,
        at,
      }
    })
  }, [shape, track, profile])

  useEffect(() => {
    const el = frameRef.current
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true)
      return
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          io.disconnect()
        }
      },
      { threshold: 0.3 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  if (!shape || !track) return null

  const km = shape.length / 1000
  const raceKm = circuitId === 'monaco' ? 260 : 305
  const laps = Math.ceil(raceKm / km)
  const kind = typeLabel(profile?.type)
  const layers = Array.from({ length: WALL_STEPS }, (_, i) => (WALL_DEPTH * (WALL_STEPS - 1 - i)) / (WALL_STEPS - 1))
  const flagX = track.start.x
  const flagY = track.start.y - 6

  return (
    <section className="wp-blk wk3d" aria-label={`Трасса: ${shape.name}`}>
      <div className="wp-sec">
        <span className="wp-tag">Circuit</span>
        {kind ? <span className="wp-pill">{kind}</span> : null}
      </div>

      <div className={`wk-frame${inView ? ' is-in' : ''}`} ref={frameRef}>
        <dl className="wk-stats">
          <div>
            <dt>Длина</dt>
            <dd className="num">
              {km.toFixed(3)}
              <small>км</small>
            </dd>
          </div>
          <div>
            <dt>Дистанция</dt>
            <dd className="num">
              {(laps * km).toFixed(2)}
              <small>км</small>
            </dd>
          </div>
          <div>
            <dt>Кругов</dt>
            <dd className="num">{laps}</dd>
          </div>
          <div>
            <dt>Поворотов</dt>
            <dd className="num">{profile ? profile.corners.length : <i className="wp-skel" />}</dd>
          </div>
        </dl>

        <svg
          key={cycle}
          className="wk-svg"
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          role="img"
          aria-label={`Объёмная схема трассы ${shape.name}`}
        >
          <path
            d={track.d}
            className="wk-bloom wk-draw"
            pathLength={1}
            transform={`translate(0 ${WALL_DEPTH + 0.6})`}
          />
          <path
            d={track.d}
            className="wk-bloom soft wk-draw"
            pathLength={1}
            transform={`translate(0 ${WALL_DEPTH + 0.6})`}
          />
          {layers.map((dy) => (
            <path key={dy} d={track.d} className="wk-wall wk-draw" pathLength={1} transform={`translate(0 ${dy.toFixed(2)})`} />
          ))}
          <path d={track.d} className="wk-top-glow wk-draw" pathLength={1} />
          <path d={track.d} className="wk-top wk-draw" pathLength={1} />
          <path d={track.d} className="wk-run halo" pathLength={100} />
          <path d={track.d} className="wk-run core" pathLength={100} />

          {pins.map((p, i) => (
            <g key={`${p.n}-${i}`} className="wk-pin" style={{ animationDelay: `${(0.35 + p.at * 2.1).toFixed(2)}s` }}>
              <line x1={p.x} y1={p.y} x2={p.x} y2={p.y - p.h} />
              <circle cx={p.x} cy={p.y} r="0.5" />
              <text x={p.x} y={p.y - p.h - 0.9} textAnchor="middle">
                {p.n}
              </text>
            </g>
          ))}

          <g className="wk-flag" style={{ animationDelay: '0.2s' }}>
            <line x1={flagX} y1={track.start.y} x2={flagX} y2={flagY} />
            {[0, 1, 2, 3, 4, 5].map((n) => {
              const col = n % 3
              const row = Math.floor(n / 3)
              return (
                <rect
                  key={n}
                  x={flagX + col * 1.1}
                  y={flagY - 0.1 + row * 1.1}
                  width="1.1"
                  height="1.1"
                  className={(col + row) % 2 === 0 ? 'on' : 'off'}
                />
              )
            })}
          </g>
        </svg>

        <div className="wk-foot">
          <p>
            {shape.name}
            {profile ? ` · ${profile.country}` : ''}
          </p>
          <button type="button" className="wk-replay" onClick={() => setCycle((c) => c + 1)} aria-label="Показать трассу заново">
            <RotateCcw size={16} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="wp-rec">
        <span className="wp-tag dim">Лучший круг гонки</span>
        {record ? (
          <div className="wp-rec-row">
            <b className="num">{record.time}</b>
            <span>
              {record.code} · {record.year}
            </span>
          </div>
        ) : (
          <i className="wp-skel" />
        )}
      </div>
    </section>
  )
}

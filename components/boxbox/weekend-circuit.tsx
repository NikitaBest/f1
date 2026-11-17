'use client'

import type { CircuitProfile } from '@/app/api/circuit/route'
import type { LapRecord } from '@/app/api/lap-record/route'
import { CIRCUITS } from '@/lib/circuits'
import { useWk } from './weekend-data'

function typeLabel(type?: string) {
  if (!type) return null
  if (/street/i.test(type)) return 'Street'
  if (/road/i.test(type)) return 'Road'
  if (/permanent/i.test(type)) return 'Permanent'
  return type
}

export function startPoint(path: string) {
  const m = path.match(/^M\s*(-?[\d.]+)[,\s]+(-?[\d.]+)/)
  return m ? { x: Number(m[1]), y: Number(m[2]) } : { x: 50, y: 50 }
}

export function WeekendCircuit({ circuitId }: { circuitId: string }) {
  const shape = CIRCUITS[circuitId]
  const { data: profile } = useWk<CircuitProfile>('circuit', circuitId)
  const { data: record } = useWk<LapRecord>('lap-record', circuitId)
  if (!shape) return null

  const km = shape.length / 1000
  const raceKm = circuitId === 'monaco' ? 260 : 305
  const laps = Math.ceil(raceKm / km)
  const start = startPoint(shape.path)
  const kind = typeLabel(profile?.type)

  return (
    <section className="wp-blk wp-circ" aria-label={`Трасса: ${shape.name}`}>
      <div className="wp-sec">
        <span className="wp-tag">Circuit</span>
        {kind ? <span className="wp-pill">{kind}</span> : null}
      </div>

      <div className="wp-circ-map">
        <svg viewBox="-6 -6 112 112" role="img" aria-label={`Схема трассы ${shape.name}`}>
          <path d={shape.path} className="wp-trk-base" />
          <path d={shape.path} className="wp-trk-line" pathLength={1} />
          <circle cx={start.x} cy={start.y} r="2.4" className="wp-trk-start" />
          <circle r="2" className="wp-trk-car">
            <animateMotion dur="9s" repeatCount="indefinite" path={shape.path} />
          </circle>
        </svg>
        <div className="wp-circ-len">
          <span className="wp-out num">{km.toFixed(3)}</span>
          <small>KM</small>
        </div>
      </div>

      <p className="wp-circ-name">
        {shape.name}
        {profile ? ` · ${profile.country}` : ''}
      </p>

      <dl className="wp-stats">
        <div>
          <dt>Кругов</dt>
          <dd className="num">{laps}</dd>
        </div>
        <div>
          <dt>Поворотов</dt>
          <dd className="num">{profile ? profile.corners.length : <i className="wp-skel" />}</dd>
        </div>
        <div>
          <dt>Дистанция</dt>
          <dd className="num">{(laps * km).toFixed(0)} км</dd>
        </div>
      </dl>

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

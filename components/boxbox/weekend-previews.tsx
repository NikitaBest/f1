'use client'

import type { GridPayload } from '@/app/api/grid/route'
import type { LapRecord } from '@/app/api/lap-record/route'
import type { LiveBoard } from '@/app/api/live/route'
import type { RaceFeed } from '@/app/api/race-feed/route'
import type { TeamRadioPayload } from '@/app/api/team-radio/route'
import { CIRCUITS } from '@/lib/circuits'
import { startPoint } from './weekend-circuit'
import { useWk } from './weekend-data'

function Skeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="wp-pv-skel" aria-hidden="true">
      {Array.from({ length: rows }, (_, i) => (
        <i key={i} className="wp-skel" style={{ width: `${88 - i * 14}%` }} />
      ))}
    </div>
  )
}

export function LivePreview({ circuitId }: { circuitId: string }) {
  const { data } = useWk<LiveBoard>('live', circuitId, 30_000)
  if (!data) return <Skeleton />
  const top = data.standings.slice(0, 3)
  return (
    <div className="wp-pv">
      <span className="wp-pv-cap">
        {data.sessionName} · {data.year}
      </span>
      <ol className="wp-pv-list">
        {top.map((r) => (
          <li key={r.code}>
            <span className="pos num">{r.position}</span>
            <i className="dot" style={{ background: r.color }} aria-hidden="true" />
            <b>{r.code}</b>
            <span className="gap num">{r.gap}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}

export function GridPreview({ circuitId }: { circuitId: string }) {
  const { data } = useWk<GridPayload>('grid', circuitId)
  if (!data) return <Skeleton rows={2} />
  const [pole, p2, p3] = data.rows
  if (!pole) return <span className="wp-pv-cap">Нет данных</span>
  return (
    <div className="wp-pv">
      <span className="wp-pv-cap">Поул</span>
      <div className="wp-pv-big">
        <b className="disp">{pole.code}</b>
        <span className="num">{pole.lapLabel ?? ''}</span>
      </div>
      <span className="wp-pv-cap dim">
        {[p2, p3]
          .filter(Boolean)
          .map((r) => `P${r.position} ${r.code}`)
          .join(' · ')}
      </span>
    </div>
  )
}

export function FeedPreview({ circuitId }: { circuitId: string }) {
  const { data } = useWk<RaceFeed>('race-feed', circuitId)
  if (!data) return <Skeleton rows={2} />
  const timed = data.pits.filter((p) => p.duration !== null)
  const fastest = timed.length ? timed.reduce((a, b) => ((a.duration ?? 99) < (b.duration ?? 99) ? a : b)) : null
  return (
    <div className="wp-pv">
      <span className="wp-pv-cap">Быстрый пит</span>
      <div className="wp-pv-big">
        <b className="disp num">{fastest?.duration ? fastest.duration.toFixed(1) : '—'}</b>
        <span>{fastest ? `с · ${fastest.code}` : ''}</span>
      </div>
      <span className="wp-pv-cap dim">
        {data.pits.length} стопов · {data.totalOvertakes} обгонов
      </span>
    </div>
  )
}

export function RadioPreview({ circuitId }: { circuitId: string }) {
  const { data } = useWk<TeamRadioPayload>('team-radio', circuitId)
  if (!data) return <Skeleton rows={2} />
  return (
    <div className="wp-pv">
      <span className="wp-pv-cap">Записей</span>
      <div className="wp-pv-big">
        <b className="disp num">{data.total}</b>
        <span>{data.year}</span>
      </div>
      <div className="wp-wave" aria-hidden="true">
        {Array.from({ length: 22 }, (_, i) => (
          <i key={i} style={{ animationDelay: `${(i % 7) * 90}ms`, height: `${30 + ((i * 37) % 70)}%` }} />
        ))}
      </div>
    </div>
  )
}

export function TelemPreview({ circuitId }: { circuitId: string }) {
  const shape = CIRCUITS[circuitId]
  if (!shape) return null
  const s = startPoint(shape.path)
  return (
    <div className="wp-pv">
      <span className="wp-pv-cap">GPS · скорость · газ</span>
      <svg className="wp-mini" viewBox="-6 -6 112 112" aria-hidden="true">
        <path d={shape.path} className="wp-mini-base" />
        <path d={shape.path} className="wp-mini-run" pathLength={1} />
        <circle cx={s.x} cy={s.y} r="3" className="wp-trk-start" />
      </svg>
    </div>
  )
}


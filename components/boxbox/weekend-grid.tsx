'use client'

import { useEffect, useState } from 'react'
import type { GridPayload } from '@/app/api/grid/route'
import { useTheme } from '@/lib/store'
import { PilotAvatar } from './pilot-avatar'

export function WeekendGrid({ circuitId }: { circuitId: string }) {
  const theme = useTheme()
  const [data, setData] = useState<GridPayload | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    setData(null)
    setError(false)
    fetch(`/api/grid?circuit=${encodeURIComponent(circuitId)}`)
      .then(async (res) => {
        if (!res.ok) throw new Error('no grid')
        return res.json() as Promise<GridPayload>
      })
      .then((payload) => {
        if (!cancelled) setData(payload)
      })
      .catch(() => {
        if (!cancelled) {
          setError(true)
          setData(null)
        }
      })
    return () => {
      cancelled = true
    }
  }, [circuitId])

  if (error) return <p className="wk-live-empty">Нет данных стартовой решётки.</p>
  if (!data) return <p className="wk-live-empty">Загружаем решётку…</p>

  const left = data.rows.filter((r) => r.position % 2 === 1)
  const right = data.rows.filter((r) => r.position % 2 === 0)

  return (
    <section className="wk-grid" aria-label="Стартовая решётка">
      <div className="wk-grid-head">
        <span className="eyebrow">Grid · {data.year}</span>
        <b className="disp">{data.circuitName}</b>
      </div>

      <div className="wk-grid-lanes" role="list">
        <ol className="wk-grid-col">
          {left.map((row) => (
            <li key={row.number} className={row.code === theme.code ? 'fav' : undefined} role="listitem">
              <span className="pos num">{row.position}</span>
              <PilotAvatar code={row.code} />
              <span className="meta">
                <b>{row.code}</b>
                <small>{row.lapLabel ?? row.team}</small>
              </span>
            </li>
          ))}
        </ol>
        <ol className="wk-grid-col offset">
          {right.map((row) => (
            <li key={row.number} className={row.code === theme.code ? 'fav' : undefined} role="listitem">
              <span className="pos num">{row.position}</span>
              <PilotAvatar code={row.code} />
              <span className="meta">
                <b>{row.code}</b>
                <small>{row.lapLabel ?? row.team}</small>
              </span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

'use client'

import type { GridPayload, GridRow } from '@/app/api/grid/route'
import { useTheme } from '@/lib/store'
import { PilotAvatar } from './pilot-avatar'
import { useWk } from './weekend-data'
import { cssVars, WxEmpty, WxHead, WxLoading } from './wx-ui'

function Slot({ row, index, fav }: { row: GridRow; index: number; fav: boolean }) {
  return (
    <li
      className={`wx-slot${row.position === 1 ? ' pole' : ''}${fav ? ' fav' : ''}`}
      style={cssVars({ '--tc': row.color, '--i': index })}
    >
      <span className="wx-slot-no" aria-hidden="true">
        {row.position}
      </span>
      <PilotAvatar code={row.code} className="wx-av sm" />
      <span className="wx-slot-meta">
        <b>{row.code}</b>
        <small className="num">{row.lapLabel ?? row.team}</small>
      </span>
      {row.position === 1 ? <em className="wx-slot-tag">Pole</em> : null}
    </li>
  )
}

export function WeekendGrid({ circuitId }: { circuitId: string }) {
  const theme = useTheme()
  const { data, error } = useWk<GridPayload>('grid', circuitId)

  if (error && !data) return <WxEmpty>Нет данных стартовой решётки.</WxEmpty>
  if (!data) return <WxLoading />

  const left = data.rows.filter((r) => r.position % 2 === 1)
  const right = data.rows.filter((r) => r.position % 2 === 0)

  return (
    <section className="wx wx-grid" aria-label="Стартовая решётка">
      <WxHead
        eyebrow={`Grid · ${data.year}`}
        title={data.circuitName}
        aside={<span className="wx-chip">{data.sessionName}</span>}
      />

      <div className="wx-lights" aria-hidden="true">
        {Array.from({ length: 5 }, (_, i) => (
          <i key={i} style={cssVars({ '--i': i })} />
        ))}
      </div>

      <div className="wx-lanes">
        <ol className="wx-lane">
          {left.map((r, i) => (
            <Slot key={r.number} row={r} index={i * 2} fav={r.code === theme.code} />
          ))}
        </ol>
        <ol className="wx-lane offset">
          {right.map((r, i) => (
            <Slot key={r.number} row={r} index={i * 2 + 1} fav={r.code === theme.code} />
          ))}
        </ol>
      </div>
    </section>
  )
}

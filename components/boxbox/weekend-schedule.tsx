'use client'

import { useNow } from '@/lib/use-now'
import { hhmm, hintFor, mon, weekday, type RaceEvent } from '@/lib/f1'

type Row = { key: string; label: string; at: Date; ms: number }

export function WeekendSchedule({ event }: { event: RaceEvent }) {
  const now = useNow(30_000)
  const rows: Row[] = event.sessions.map((s) => {
    const at = new Date(s.at)
    return { key: s.key, label: s.label, at, ms: at.getTime() }
  })
  const nextIdx = rows.findIndex((r) => r.ms > now)

  const groups: { id: string; date: Date; items: { row: Row; idx: number }[] }[] = []
  rows.forEach((row, idx) => {
    const id = `${row.at.getFullYear()}-${row.at.getMonth()}-${row.at.getDate()}`
    const last = groups[groups.length - 1]
    if (last && last.id === id) last.items.push({ row, idx })
    else groups.push({ id, date: row.at, items: [{ row, idx }] })
  })

  return (
    <section className="wp-blk wp-sched" aria-label="Расписание уикенда">
      <div className="wp-sec">
        <span className="wp-tag">Расписание</span>
        <span className="wp-tag dim">Местное время</span>
      </div>
      {groups.map((g) => (
        <div key={g.id} className="wp-day">
          <div className="wp-day-head">
            <b className="wp-out">{weekday(g.date)}/</b>
            <span>
              {g.date.getDate()} {mon(g.date)}
            </span>
          </div>
          <ul>
            {g.items.map(({ row, idx }) => {
              const state = idx === nextIdx ? 'next' : row.ms < now ? 'past' : ''
              return (
                <li key={row.key} className={`wp-ses ${row.key === 'r' ? 'race' : ''} ${state}`}>
                  <span className="wp-ses-t num">{hhmm(row.at)}</span>
                  <span className="wp-ses-txt">
                    <b>{row.label}</b>
                    <small>{hintFor(row.key)}</small>
                  </span>
                  <span className="wp-ses-st">
                    {state === 'next' ? 'Далее' : state === 'past' ? 'Готово' : ''}
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </section>
  )
}

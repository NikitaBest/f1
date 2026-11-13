'use client'

import { Fragment, useState, type CSSProperties } from 'react'
import { Plus } from 'lucide-react'
import { useNow } from '@/lib/use-now'
import { daysUntil, eventEnd, mon, monthYear, parseISODate, shortName, sortEvents, type Format, type RaceEvent } from '@/lib/f1'
import { Hero } from './art'
import { eventImage } from './weekend-view'

type Filter = 'all' | Format

const FILTERS: [Filter, string][] = [
  ['all', 'Все'],
  ['sprint', 'Спринт'],
  ['std', 'Обычные'],
]

const plural = (n: number) => (n % 10 === 1 && n % 100 !== 11 ? 'этап' : [2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100) ? 'этапа' : 'этапов')

export function CalendarScreen({
  events,
  onOpen,
  onCreate,
}: {
  events: RaceEvent[]
  onOpen: (id: string) => void
  onCreate: () => void
}) {
  const [filter, setFilter] = useState<Filter>('all')
  const now = useNow(60_000)
  const list = sortEvents(events).filter((e) => filter === 'all' || e.format === filter)
  const hotId = list.find((e) => eventEnd(e) > now)?.id
  const season = events[0]?.season ?? new Date(now).getFullYear()
  let lastMonth = ''

  return (
    <div className="scroll">
      <Hero
        image="/img/night-city.jpg"
        pos="50%"
        eyebrow={`Сезон ${season}`}
        title="Календарь"
        sub={`${events.length} ${plural(events.length)} · официальный и свои`}
      />

      <div className="topbar" style={{ marginBottom: 4 }}>
        <div className="seg" role="group" aria-label="Фильтр этапов" style={{ flex: 1 }}>
          {FILTERS.map(([k, l]) => (
            <button key={k} type="button" aria-pressed={filter === k} onClick={() => setFilter(k)}>
              {l}
            </button>
          ))}
        </div>
        <button type="button" className="btn sm" onClick={onCreate} style={{ marginLeft: 8 }} aria-label="Добавить этап">
          <Plus size={18} aria-hidden="true" />
        </button>
      </div>

      {list.length === 0 && (
        <div className="empty" style={{ marginTop: 16 }}>
          <h2 className="disp">Пусто</h2>
          <p>Нажми «+», чтобы добавить этап.</p>
        </div>
      )}

      {list.map((e) => {
        const start = parseISODate(e.start)
        const month = monthYear(start)
        const showMonth = month !== lastMonth
        lastMonth = month
        const dd = daysUntil(e.start, now)
        const past = eventEnd(e) < now
        const hot = e.id === hotId
        return (
          <Fragment key={e.id}>
            {showMonth && <h2 className="month">{month}</h2>}
            <button
              type="button"
              className={`ev ${hot ? 'hot' : ''} ${past ? 'past' : ''}`}
              style={hot ? ({ '--bg': `url("${eventImage(e)}")` } as CSSProperties) : undefined}
              onClick={() => onOpen(e.id)}
            >
              <span className="day">
                {start.getDate()}
                <small>{mon(start)}</small>
              </span>
              <span style={{ minWidth: 0 }}>
                <span className="nm">{shortName(e.name)}</span>
                <span className="pl">{e.place}</span>
              </span>
              <span className="rt">
                <span className={`tag ${e.format === 'sprint' ? 'sp' : ''}`}>
                  {e.format === 'sprint' ? 'Спринт' : 'Обычный'}
                </span>
                <span className="in num">{past ? 'Прошёл' : dd <= 0 ? 'Сейчас' : `через ${dd} дн`}</span>
              </span>
            </button>
          </Fragment>
        )
      })}
    </div>
  )
}

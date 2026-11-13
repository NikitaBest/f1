'use client'

import { Fragment, useState } from 'react'
import { useNow } from '@/lib/use-now'
import { daysUntil, eventEnd, mon, monthYear, pad, parseISODate, shortName, sortEvents, type Format, type RaceEvent } from '@/lib/f1'
import { Brand } from './poster'

type Filter = 'all' | Format

const FILTERS: [Filter, string][] = [
  ['all', 'Все'],
  ['sprint', 'Со спринтом'],
  ['std', 'Обычные'],
]

export function CalendarScreen({ events, onOpen }: { events: RaceEvent[]; onOpen: (id: string) => void }) {
  const [filter, setFilter] = useState<Filter>('all')
  const now = useNow(60_000)
  const list = sortEvents(events).filter((e) => filter === 'all' || e.format === filter)
  const hotId = list.find((e) => eventEnd(e) > now)?.id
  let lastMonth = ''

  return (
    <div className="bb-screen">
      <Brand sub="Сезон F1" />
      <div className="micro yel">
        {events.length} {events.length === 1 ? 'этап' : events.length < 5 && events.length > 0 ? 'этапа' : 'этапов'} · официальный календарь
      </div>
      <h1 className="h1 mt-1.5">Календарь</h1>

      <div className="chips" role="group" aria-label="Фильтр этапов">
        {FILTERS.map(([k, l]) => (
          <button key={k} type="button" className="chip" aria-pressed={filter === k} onClick={() => setFilter(k)}>
            {l}
          </button>
        ))}
      </div>

      {list.length === 0 && <p className="empty">Пока пусто. Нажми «+», чтобы добавить этап.</p>}

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
            {showMonth && <div className="micro yel mb-1 mt-5">{month}</div>}
            <button
              type="button"
              className={`ev ${hot ? 'hot grain' : ''} ${past ? 'opacity-45' : ''}`}
              onClick={() => onOpen(e.id)}
            >
              <div className="w-[54px] shrink-0">
                <b className="display block text-[48px] font-black leading-[0.82]">{pad(start.getDate())}</b>
                <small className="micro mute mt-1.5 block">{mon(start)}</small>
              </div>
              <div className="min-w-0 flex-1">
                <small className="micro mute block text-[8px]">Гран-при</small>
                <b className="display mb-1 mt-0.5 block truncate text-[24px] font-extrabold leading-none">
                  {shortName(e.name)}
                </b>
                <span className="mute mb-2 block truncate text-xs">{e.place}</span>
                <span className={`tag ${e.format === 'sprint' ? '' : 'red'}`}>
                  {e.format === 'sprint' ? 'Спринт' : 'Обычный'}
                </span>
              </div>
              <div className="shrink-0 text-right">
                <b className="display block text-[36px] font-black leading-[0.85]">{past ? '—' : Math.max(0, dd)}</b>
                <small className="micro mute text-[8px]">{past ? 'прошёл' : 'дн.'}</small>
              </div>
            </button>
          </Fragment>
        )
      })}
    </div>
  )
}

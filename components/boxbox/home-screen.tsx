'use client'

import { ArrowLeft, Trash2 } from 'lucide-react'
import { actions } from '@/lib/store'
import { useNow } from '@/lib/use-now'
import type { F1LiveState } from '@/lib/use-f1-live'
import { parseISODate, sortEvents, upcomingEvents, pad, type RaceEvent } from '@/lib/f1'
import { Ticker, TopBar } from './art'
import { DuoCard } from './duo-card'
import { WeekendCard } from './weekend-view'

const roundOf = (event: RaceEvent, events: RaceEvent[]) =>
  event.round ?? sortEvents(events).findIndex((e) => e.id === event.id) + 1

export function HomeScreen({
  events,
  live,
  onCreate,
  onOpenDriver,
  onOpenTeam,
  onOpenCar,
}: {
  events: RaceEvent[]
  live: F1LiveState
  onCreate: () => void
  onOpenDriver?: () => void
  onOpenTeam?: () => void
  onOpenCar?: () => void
}) {
  const now = useNow(60_000)
  const event = upcomingEvents(events, now)[0]
  const season = event?.season ?? new Date(now).getFullYear()

  return (
    <div className="scroll home">
      <TopBar />
      <Ticker words={['Box box', 'Oracle Red Bull Racing', 'Max Verstappen', `Сезон ${season}`]} />

      {event ? (
        <WeekendCard event={event} round={roundOf(event, events)} season={season} compact />
      ) : (
        <div className="empty">
          <h2 className="disp">Пит-лейн пуст</h2>
          <p>
            {live.syncing
              ? 'Подтягиваем официальный календарь F1…'
              : 'Нет предстоящих этапов. Синхронизируй календарь в Паддоке или добавь свой.'}
          </p>
          <button type="button" className="btn sm" onClick={onCreate} style={{ marginTop: 8, alignSelf: 'flex-start' }}>
            Новый этап
          </button>
        </div>
      )}

      <div className="sec-title">
        <h2 className="disp">Garage</h2>
        <span className="eyebrow">Driver · Team</span>
      </div>
      <DuoCard live={live} onOpenDriver={onOpenDriver} onOpenTeam={onOpenTeam} onOpenCar={onOpenCar} />

      <figure className="quote">
        <blockquote className="disp q">
          Тебе не нужно быть идеальным. Нужно быть лучшим в этот день.
        </blockquote>
        <figcaption className="by">Макс Ферстаппен</figcaption>
      </figure>
    </div>
  )
}

export function EventDetailScreen({
  event,
  events,
  onBack,
}: {
  event: RaceEvent
  events: RaceEvent[]
  onBack: () => void
}) {
  const round = roundOf(event, events)
  return (
    <div className="scroll">
      <div className="topbar">
        <button type="button" className="back" onClick={onBack}>
          <ArrowLeft size={18} aria-hidden="true" />
          Календарь
        </button>
        <span className="eyebrow">Раунд {pad(round)}</span>
      </div>
      <WeekendCard event={event} round={round} season={event.season ?? parseISODate(event.start).getFullYear()} />
      {event.source !== 'f1' && (
        <button
          type="button"
          className="btn ghost"
          style={{ marginTop: 16 }}
          onClick={() => {
            if (confirm(`Удалить «${event.name}» из календаря?`)) {
              actions.removeEvent(event.id)
              onBack()
            }
          }}
        >
          <Trash2 size={18} aria-hidden="true" />
          Удалить этап
        </button>
      )}
    </div>
  )
}

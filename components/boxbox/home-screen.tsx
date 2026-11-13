'use client'

import { ArrowLeft, Trash2 } from 'lucide-react'
import { actions } from '@/lib/store'
import { useNow } from '@/lib/use-now'
import { parseISODate, sortEvents, upcomingEvents, pad, type RaceEvent } from '@/lib/f1'
import { Brand } from './poster'
import { WeekendView } from './weekend-view'

export function HomeScreen({
  events,
  onCreate,
  syncing,
}: {
  events: RaceEvent[]
  onCreate: () => void
  syncing?: boolean
}) {
  const now = useNow(60_000)
  const event = upcomingEvents(events, now)[0]
  if (!event) {
    return (
      <div className="bb-screen">
        <Brand sub={`Сезон ${new Date(now).getFullYear()}`} />
        <h1 className="h1 mt-6">Пит-лейн пуст</h1>
        <p className="empty text-left">
          {syncing
            ? 'Подтягиваем официальный календарь F1…'
            : 'Нет предстоящих этапов. Синхронизируй календарь в Паддоке или добавь свой.'}
        </p>
        <button type="button" className="cta" onClick={onCreate}>
          Новый этап
        </button>
      </div>
    )
  }
  const round = event.round ?? sortEvents(events).findIndex((e) => e.id === event.id) + 1
  return (
    <div className="bb-screen">
      <Brand sub={`Раунд ${pad(round)}`} />
      <WeekendView event={event} round={round} season={event.season ?? parseISODate(event.start).getFullYear()} />
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
  const round = event.round ?? sortEvents(events).findIndex((e) => e.id === event.id) + 1
  return (
    <div className="bb-screen">
      <header className="brand">
        <button type="button" onClick={onBack} className="micro flex items-center gap-2" aria-label="Назад к календарю">
          <ArrowLeft size={16} aria-hidden="true" />
          Календарь
        </button>
        <span className="micro mute">Раунд {pad(round)}</span>
      </header>
      <WeekendView event={event} round={round} season={event.season ?? parseISODate(event.start).getFullYear()} />
      {event.source !== 'f1' && (
        <button
          type="button"
          className="cta ghost"
          onClick={() => {
            if (confirm(`Удалить «${event.name}» из календаря?`)) {
              actions.removeEvent(event.id)
              onBack()
            }
          }}
        >
          Удалить этап
          <Trash2 size={18} aria-hidden="true" />
        </button>
      )}
    </div>
  )
}

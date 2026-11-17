'use client'

import { ArrowLeft, Trash2 } from 'lucide-react'
import { actions, useTheme } from '@/lib/store'
import { driverDisplayName } from '@/lib/themes'
import { useNow } from '@/lib/use-now'
import type { F1LiveState } from '@/lib/use-f1-live'
import { parseISODate, sortEvents, upcomingEvents, pad, type RaceEvent } from '@/lib/f1'
import { DuoCard } from './duo-card'
import { NewsTeaser } from './news-teaser'
import { QuoteCard } from './quote-card'
import { WeekendCard, WeekendTeaser } from './weekend-view'

const roundOf = (event: RaceEvent, events: RaceEvent[]) =>
  event.round ?? sortEvents(events).findIndex((e) => e.id === event.id) + 1

export function HomeScreen({
  events,
  live,
  onOpenDriver,
  onOpenTeam,
  onOpenCar,
  onOpenNews,
  onOpenWeekend,
}: {
  events: RaceEvent[]
  live: F1LiveState
  onOpenDriver?: () => void
  onOpenTeam?: () => void
  onOpenCar?: () => void
  onOpenNews?: () => void
  onOpenWeekend?: () => void
}) {
  const theme = useTheme()
  const now = useNow(60_000)
  const event = upcomingEvents(events, now)[0]
  const season = event?.season ?? new Date(now).getFullYear()

  return (
    <div className="scroll home">
      <header className="home-head" aria-label={driverDisplayName(theme)}>
        <span className="eyebrow">
          #{theme.number} · {theme.code} · Сезон {season}
        </span>
        <h1 className="disp">Раунд</h1>
        <p>
          {driverDisplayName(theme)}
          <span aria-hidden="true"> · </span>
          {theme.teamShort}
        </p>
      </header>

      {event ? (
        <WeekendTeaser
          event={event}
          round={roundOf(event, events)}
          season={season}
          onOpen={onOpenWeekend}
        />
      ) : (
        <div className="empty">
          <h2 className="disp">Пит-лейн пуст</h2>
          <p>
            {live.syncing
              ? 'Подтягиваем официальный календарь F1…'
              : 'Нет предстоящих этапов. Синхронизируй календарь в Паддоке.'}
          </p>
        </div>
      )}

      <div className="garage-block">
        <div className="sec-title">
          <h2 className="disp">Garage</h2>
          <span className="eyebrow">Driver · Team</span>
        </div>
        <DuoCard live={live} onOpenDriver={onOpenDriver} onOpenTeam={onOpenTeam} onOpenCar={onOpenCar} />
      </div>

      <NewsTeaser onOpenAll={onOpenNews} />

      <QuoteCard />
    </div>
  )
}

export function WeekendScreen({
  events,
  onBack,
}: {
  events: RaceEvent[]
  onBack: () => void
}) {
  const now = useNow(60_000)
  const event = upcomingEvents(events, now)[0]
  if (!event) return null
  const round = roundOf(event, events)
  return (
    <div className="scroll">
      <div className="topbar">
        <button type="button" className="back" onClick={onBack}>
          <ArrowLeft size={18} aria-hidden="true" />
          Главная
        </button>
        <span className="eyebrow">Раунд {pad(round)}</span>
      </div>
      <WeekendCard event={event} round={round} season={event.season ?? parseISODate(event.start).getFullYear()} />
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

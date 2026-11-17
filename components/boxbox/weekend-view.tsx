'use client'

import { useState, type CSSProperties } from 'react'
import { ArrowUpRight, ChevronRight } from 'lucide-react'
import { useNow } from '@/lib/use-now'
import { WeekendCircuit } from './weekend-circuit'
import { WeekendHero } from './weekend-hero'
import { WeekendHub, type WeekendPhase } from './weekend-hub'
import { WeekendSchedule } from './weekend-schedule'
import { WeekendWeather } from './weekend-weather'
import './weekend-page.css'
import './weekend-sheets.css'
import { addDays, hhmm, mon, pad, parseISODate, shortName, weekday, type RaceEvent } from '@/lib/f1'

const PHOTO_KEY = (id: string) => `boxbox:wk-img:${id}`
const FALLBACKS = ['/img/night-city.jpg', '/img/sunset-start.jpg', '/img/lights.jpg', '/img/flag.jpg']

export function eventImage(event: RaceEvent) {
  if (event.image) return event.image
  const n = [...event.id].reduce((a, c) => a + c.charCodeAt(0), 0)
  return FALLBACKS[n % FALLBACKS.length]
}

async function shrink(file: File) {
  const bmp = await createImageBitmap(file)
  const scale = Math.min(1, 1100 / bmp.width)
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bmp.width * scale)
  canvas.height = Math.round(bmp.height * scale)
  canvas.getContext('2d')?.drawImage(bmp, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/jpeg', 0.82)
}

function useWeekendPhoto(id: string) {
  const [photo, setPhoto] = useState<string | null>(() => {
    try {
      return localStorage.getItem(PHOTO_KEY(id))
    } catch {
      return null
    }
  })
  const save = async (file: File) => {
    const url = await shrink(file)
    setPhoto(url)
    try {
      localStorage.setItem(PHOTO_KEY(id), url)
    } catch {}
  }
  const clear = () => {
    setPhoto(null)
    try {
      localStorage.removeItem(PHOTO_KEY(id))
    } catch {}
  }
  return { photo, save, clear }
}

function Countdown({ target }: { target: number }) {
  const now = useNow(1000)
  let ms = Math.max(0, target - now)
  const d = Math.floor(ms / 86_400_000)
  ms -= d * 86_400_000
  const h = Math.floor(ms / 3_600_000)
  ms -= h * 3_600_000
  const m = Math.floor(ms / 60_000)
  const s = Math.floor((ms - m * 60_000) / 1000)
  const cells: [number, string][] = [
    [d, 'дней'],
    [h, 'часов'],
    [m, 'минут'],
    [s, 'секунд'],
  ]
  return (
    <div className="cd-cells" role="timer" aria-label={`${d} дн ${h} ч ${m} мин до старта`}>
      {cells.map(([v, l]) => (
        <div key={l} className="cd-cell">
          <span className="disp num">{pad(v)}</span>
          <span className="u">{l}</span>
        </div>
      ))}
    </div>
  )
}

function weekendDates(event: RaceEvent) {
  const start = parseISODate(event.start)
  const end = addDays(start, 2)
  return start.getMonth() === end.getMonth()
    ? `${start.getDate()}–${end.getDate()} ${mon(start)}`
    : `${start.getDate()} ${mon(start)} – ${end.getDate()} ${mon(end)}`
}

/** Короткая карточка для главной: только суть, всё остальное — на странице уикенда. */
export function WeekendTeaser({
  event,
  round,
  season,
  onOpen,
}: {
  event: RaceEvent
  round: number
  season: number
  onOpen?: () => void
}) {
  const now = useNow(30_000)
  const { photo } = useWeekendPhoto(event.id)
  const nextIdx = event.sessions.findIndex((s) => new Date(s.at).getTime() > now)
  const next = event.sessions[nextIdx]
  const nextAt = next ? new Date(next.at) : null
  const title = shortName(event.name)

  return (
    <article className="wk wk-teaser" aria-label={`Ближайший уикенд: ${event.name}`}>
      <div className="wk-head" style={{ '--bg': `url("${photo ?? eventImage(event)}")` } as CSSProperties}>
        <div className="wk-top">
          <span className="eyebrow" style={{ color: 'var(--sun)' }}>
            Раунд {pad(round)} · {season}
          </span>
          <span className="wk-go" aria-hidden="true">
            <ArrowUpRight size={18} />
          </span>
        </div>
        <h2 className="wk-name disp" style={{ fontSize: title.length > 10 ? 34 : 40 }}>
          {title}
        </h2>
        <div className="wk-meta">
          <b>{event.place}</b>
          <span>{weekendDates(event)}</span>
        </div>
      </div>
      <div className="cd">
        <div className="cd-label">
          <span>{next ? 'До старта' : 'Уикенд'}</span>
          <b>
            {next && nextAt ? `${next.label} · ${weekday(nextAt)} ${hhmm(nextAt)}` : 'Завершён'}
          </b>
        </div>
        {next ? <Countdown target={new Date(next.at).getTime()} /> : null}
      </div>
      <button type="button" className="wk-more wk-open" onClick={onOpen}>
        <span>Весь уикенд</span>
        <span className="wk-open-hint">
          Расписание · погода · эфир
          <ChevronRight size={18} aria-hidden="true" />
        </span>
      </button>
    </article>
  )
}

export function WeekendCard({
  event,
  round,
  season,
}: {
  event: RaceEvent
  round: number
  season: number
}) {
  const now = useNow(30_000)
  const { photo, save, clear } = useWeekendPhoto(event.id)
  const title = shortName(event.name)
  const circuitId = event.circuitId
  const first = new Date(event.sessions[0].at).getTime()
  const last = new Date(event.sessions[event.sessions.length - 1].at).getTime()
  const phase: WeekendPhase = now < first ? 'before' : now > last + 2 * 3_600_000 ? 'after' : 'live'

  return (
    <article className="wp" aria-label={`Уикенд: ${event.name}`}>
      <WeekendHero
        event={event}
        round={round}
        season={season}
        title={title}
        dates={weekendDates(event)}
        image={photo ?? eventImage(event)}
        custom={Boolean(photo)}
        onPick={(file) => void save(file)}
        onClear={clear}
      />
      <WeekendSchedule event={event} />
      {circuitId ? (
        <WeekendHub circuitId={circuitId} phase={phase} eyebrow={`Раунд ${pad(round)} · ${title}`} />
      ) : null}
      {circuitId ? <WeekendCircuit circuitId={circuitId} /> : null}
      {circuitId ? <WeekendWeather circuitId={circuitId} /> : null}
    </article>
  )
}

'use client'

import { useState, type CSSProperties } from 'react'
import { ChevronDown, ChevronUp, ImagePlus, X } from 'lucide-react'
import { useNow } from '@/lib/use-now'
import { hasCircuit, TrackLap } from './track-lap'
import { WeekendGrid } from './weekend-grid'
import { WeekendLive } from './weekend-live'
import { WeekendRaceFeed } from './weekend-race-feed'
import { WeekendTeamRadio } from './weekend-team-radio'
import { WeekendTelemetry } from './weekend-telemetry'
import { WeekendWeather } from './weekend-weather'
import { addDays, hhmm, hintFor, mon, pad, parseISODate, shortName, weekday, type RaceEvent } from '@/lib/f1'

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

function SessionRow({
  session,
  at,
  state,
}: {
  session: RaceEvent['sessions'][number]
  at: Date
  state: '' | 'next' | 'past'
}) {
  return (
    <li className={`ses ${session.key === 'r' ? 'race' : ''} ${state}`}>
      <div>
        <div className="t num">{hhmm(at)}</div>
        <div className="d">{weekday(at)}</div>
      </div>
      <div>
        <div className="n">{session.label}</div>
        <div className="h">{hintFor(session.key)}</div>
      </div>
      <span className="st">{state === 'next' ? 'Далее' : state === 'past' ? 'Прошла' : ''}</span>
    </li>
  )
}

export function WeekendCard({
  event,
  round,
  season,
  compact = false,
  forceOpen = false,
}: {
  event: RaceEvent
  round: number
  season: number
  compact?: boolean
  forceOpen?: boolean
}) {
  const now = useNow(30_000)
  const { photo, save, clear } = useWeekendPhoto(event.id)
  const [open, setOpen] = useState(false)
  const [lapOpen, setLapOpen] = useState(false)
  const [liveOpen, setLiveOpen] = useState(false)
  const [gridOpen, setGridOpen] = useState(false)
  const [feedOpen, setFeedOpen] = useState(false)
  const [radioOpen, setRadioOpen] = useState(false)
  const [telemOpen, setTelemOpen] = useState(false)
  const nextIdx = event.sessions.findIndex((s) => new Date(s.at).getTime() > now)
  const next = event.sessions[nextIdx]
  const start = parseISODate(event.start)
  const end = addDays(start, 2)
  const dates =
    start.getMonth() === end.getMonth()
      ? `${start.getDate()}–${end.getDate()} ${mon(start)}`
      : `${start.getDate()} ${mon(start)} – ${end.getDate()} ${mon(end)}`
  const title = shortName(event.name)
  const focusIdx = nextIdx >= 0 ? nextIdx : Math.max(0, event.sessions.length - 1)
  const hidden = Math.max(0, event.sessions.length - 1)
  const showAll = !compact || open || forceOpen
  const circuitId = event.circuitId
  const canLap = Boolean(circuitId && hasCircuit(circuitId))

  return (
    <article className={`wk${compact ? ' compact' : ''}`} aria-label={`Ближайший уикенд: ${event.name}`}>
      <div className="wk-head" style={{ '--bg': `url("${photo ?? eventImage(event)}")` } as CSSProperties}>
        <div className="wk-top">
          <span className="eyebrow" style={{ color: 'var(--sun)' }}>
            Раунд {pad(round)} · {season}
          </span>
          <div className="wk-tools">
            <label className="wk-up" title="Своё фото уикенда">
              <ImagePlus size={16} aria-hidden="true" />
              <span className="sr-only">Загрузить своё фото уикенда</span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) void save(f)
                  e.target.value = ''
                }}
              />
            </label>
            {photo && (
              <button type="button" className="wk-up" onClick={clear} aria-label="Убрать своё фото">
                <X size={16} aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
        <h2
          className="wk-name disp"
          style={{ fontSize: compact ? (title.length > 10 ? 36 : 42) : title.length > 10 ? 52 : 64 }}
        >
          {title}
        </h2>
        <div className="wk-meta">
          <b>{event.place}</b>
          <span>{dates}</span>
        </div>
      </div>
      <div className="cd">
        <div className="cd-label">
          <span>До старта</span>
          <b>{next ? next.label : 'Уикенд завершён'}</b>
        </div>
        {next ? <Countdown target={new Date(next.at).getTime()} /> : null}
      </div>
      {circuitId ? <WeekendWeather circuitId={circuitId} /> : null}
      <ul className="sched">
        {showAll
          ? event.sessions.map((s, i) => {
              const at = new Date(s.at)
              const state = i === nextIdx ? 'next' : at.getTime() < now ? 'past' : ''
              return <SessionRow key={s.key} session={s} at={at} state={state} />
            })
          : (() => {
              const s = event.sessions[focusIdx]
              if (!s) return null
              const at = new Date(s.at)
              const state = focusIdx === nextIdx ? 'next' : at.getTime() < now ? 'past' : ''
              return <SessionRow key={s.key} session={s} at={at} state={state} />
            })()}
      </ul>
      {compact && hidden > 0 && (
        <button
          type="button"
          className="wk-more"
          aria-expanded={showAll}
          onClick={() => setOpen((v) => !v)}
        >
          <span>{showAll ? 'Свернуть расписание' : `Расписание · ${event.sessions.length}`}</span>
          {showAll ? <ChevronUp size={18} aria-hidden="true" /> : <ChevronDown size={18} aria-hidden="true" />}
        </button>
      )}
      {circuitId ? (
        <>
          <button
            type="button"
            className="wk-more wk-live-toggle"
            aria-expanded={gridOpen}
            onClick={() => setGridOpen((v) => !v)}
          >
            <span>{gridOpen ? 'Скрыть решётку' : 'Стартовая решётка'}</span>
            {gridOpen ? <ChevronUp size={18} aria-hidden="true" /> : <ChevronDown size={18} aria-hidden="true" />}
          </button>
          {gridOpen ? <WeekendGrid circuitId={circuitId} /> : null}

          <button
            type="button"
            className="wk-more wk-live-toggle"
            aria-expanded={liveOpen}
            onClick={() => setLiveOpen((v) => !v)}
          >
            <span>{liveOpen ? 'Скрыть эфир' : 'Эфир / результат'}</span>
            {liveOpen ? <ChevronUp size={18} aria-hidden="true" /> : <ChevronDown size={18} aria-hidden="true" />}
          </button>
          {liveOpen ? <WeekendLive circuitId={circuitId} /> : null}

          <button
            type="button"
            className="wk-more wk-live-toggle"
            aria-expanded={feedOpen}
            onClick={() => setFeedOpen((v) => !v)}
          >
            <span>{feedOpen ? 'Скрыть питы' : 'Питы и обгоны'}</span>
            {feedOpen ? <ChevronUp size={18} aria-hidden="true" /> : <ChevronDown size={18} aria-hidden="true" />}
          </button>
          {feedOpen ? <WeekendRaceFeed circuitId={circuitId} /> : null}

          <button
            type="button"
            className="wk-more wk-live-toggle"
            aria-expanded={radioOpen}
            onClick={() => setRadioOpen((v) => !v)}
          >
            <span>{radioOpen ? 'Скрыть радио' : 'Team radio'}</span>
            {radioOpen ? <ChevronUp size={18} aria-hidden="true" /> : <ChevronDown size={18} aria-hidden="true" />}
          </button>
          {radioOpen ? <WeekendTeamRadio circuitId={circuitId} /> : null}

          <button
            type="button"
            className="wk-more wk-live-toggle"
            aria-expanded={telemOpen}
            onClick={() => setTelemOpen((v) => !v)}
          >
            <span>{telemOpen ? 'Скрыть телеметрию' : 'GPS и телеметрия'}</span>
            {telemOpen ? <ChevronUp size={18} aria-hidden="true" /> : <ChevronDown size={18} aria-hidden="true" />}
          </button>
          {telemOpen ? <WeekendTelemetry circuitId={circuitId} /> : null}
        </>
      ) : null}
      {canLap && circuitId ? (
        <>
          <button
            type="button"
            className="wk-more wk-lap-toggle"
            aria-expanded={lapOpen}
            onClick={() => setLapOpen((v) => !v)}
          >
            <span>{lapOpen ? 'Скрыть круг' : 'Круг трассы'}</span>
            {lapOpen ? <ChevronUp size={18} aria-hidden="true" /> : <ChevronDown size={18} aria-hidden="true" />}
          </button>
          {lapOpen ? <TrackLap circuitId={circuitId} /> : null}
        </>
      ) : null}
    </article>
  )
}

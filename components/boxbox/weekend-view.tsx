'use client'

import { useState, type CSSProperties } from 'react'
import { ImagePlus, X } from 'lucide-react'
import { useNow } from '@/lib/use-now'
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

export function WeekendCard({ event, round, season }: { event: RaceEvent; round: number; season: number }) {
  const now = useNow(30_000)
  const { photo, save, clear } = useWeekendPhoto(event.id)
  const nextIdx = event.sessions.findIndex((s) => new Date(s.at).getTime() > now)
  const next = event.sessions[nextIdx]
  const start = parseISODate(event.start)
  const end = addDays(start, 2)
  const dates =
    start.getMonth() === end.getMonth()
      ? `${start.getDate()}–${end.getDate()} ${mon(start)}`
      : `${start.getDate()} ${mon(start)} – ${end.getDate()} ${mon(end)}`
  const title = shortName(event.name)

  return (
    <article className="wk" aria-label={`Ближайший уикенд: ${event.name}`}>
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
        <h2 className="wk-name disp" style={{ fontSize: title.length > 10 ? 52 : 64 }}>
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
      <ul className="sched">
        {event.sessions.map((s, i) => {
          const at = new Date(s.at)
          const state = i === nextIdx ? 'next' : at.getTime() < now ? 'past' : ''
          return (
            <li key={s.key} className={`ses ${s.key === 'r' ? 'race' : ''} ${state}`}>
              <div>
                <div className="t num">{hhmm(at)}</div>
                <div className="d">{weekday(at)}</div>
              </div>
              <div>
                <div className="n">{s.label}</div>
                <div className="h">{hintFor(s.key)}</div>
              </div>
              <span className="st">{state === 'next' ? 'Далее' : state === 'past' ? 'Прошла' : ''}</span>
            </li>
          )
        })}
      </ul>
    </article>
  )
}

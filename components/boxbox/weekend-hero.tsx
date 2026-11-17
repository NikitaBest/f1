'use client'

import type { CSSProperties } from 'react'
import { ImagePlus, X } from 'lucide-react'
import { useNow } from '@/lib/use-now'
import { hhmm, pad, weekday, type RaceEvent } from '@/lib/f1'

const DAY = 86_400_000

function startOfDay(t: number) {
  const d = new Date(t)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

function titleSize(lines: string[]) {
  const widest = lines.reduce((m, w, i) => {
    const units = i === lines.length - 1 ? w.length + 1.5 : w.length
    return Math.max(m, units)
  }, 1)
  return Math.min(112, Math.floor(340 / (widest * 0.5)))
}

function Timeline({ event, now }: { event: RaceEvent; now: number }) {
  const days = [...new Set(event.sessions.map((s) => startOfDay(new Date(s.at).getTime())))].sort()
  return (
    <div className="wp-tl" aria-hidden="true">
      {days.map((day) => {
        const fill = Math.min(1, Math.max(0, (now - day) / DAY))
        const dots = event.sessions.filter((s) => startOfDay(new Date(s.at).getTime()) === day)
        return (
          <div key={day} className="wp-tl-day">
            <span className="wp-tl-name">{weekday(new Date(day)).toUpperCase()}</span>
            <div className="wp-tl-track">
              <i style={{ width: `${fill * 100}%` }} />
              {dots.map((s) => (
                <b
                  key={s.key}
                  className={s.key === 'r' ? 'race' : ''}
                  style={{ left: `${((new Date(s.at).getTime() - day) / DAY) * 100}%` }}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function Countdown({ event }: { event: RaceEvent }) {
  const now = useNow(1000)
  const next = event.sessions.find((s) => new Date(s.at).getTime() > now)
  const target = next ? new Date(next.at).getTime() : now
  let ms = Math.max(0, target - now)
  const d = Math.floor(ms / DAY)
  ms -= d * DAY
  const h = Math.floor(ms / 3_600_000)
  ms -= h * 3_600_000
  const m = Math.floor(ms / 60_000)
  const s = Math.floor((ms - m * 60_000) / 1000)
  const cells: [number, string][] = [
    [d, 'дн'],
    [h, 'час'],
    [m, 'мин'],
    [s, 'сек'],
  ]
  const nextAt = next ? new Date(next.at) : null

  return (
    <section className="wp-cd" aria-label="Таймер до старта">
      <div className="wp-cd-top">
        <span className="wp-tag">{next ? 'До старта' : 'Уикенд'}</span>
        <span className="wp-pill">
          {next && nextAt ? `${next.label} · ${weekday(nextAt)} ${hhmm(nextAt)}` : 'Завершён'}
        </span>
      </div>
      {next ? (
        <div className="wp-cd-cells" role="timer" aria-label={`${d} дн ${h} ч ${m} мин до старта`}>
          {cells.map(([v, l], i) => (
            <div key={l} className="wp-cd-cell">
              <span className="num">{pad(v)}</span>
              <small>{l}</small>
              {i < cells.length - 1 ? <em aria-hidden="true">:</em> : null}
            </div>
          ))}
        </div>
      ) : null}
      <Timeline event={event} now={now} />
    </section>
  )
}

export function WeekendHero({
  event,
  round,
  season,
  title,
  dates,
  image,
  custom,
  onPick,
  onClear,
}: {
  event: RaceEvent
  round: number
  season: number
  title: string
  dates: string
  image: string
  custom: boolean
  onPick: (file: File) => void
  onClear: () => void
}) {
  const lines = title.split(/\s+/).filter(Boolean)
  const size = titleSize(lines)

  return (
    <header className="wp-hero" style={{ '--bg': `url("${image}")` } as CSSProperties}>
      <div className="wp-hero-img" aria-hidden="true" />
      <span className="wp-round" aria-hidden="true">
        {pad(round)}
      </span>

      <div className="wp-brand">
        <span className="wp-tag">BOX·BOX / Weekend</span>
        <div className="wp-tools">
          {custom ? (
            <button type="button" className="wp-fab ghost" onClick={onClear} aria-label="Убрать своё фото">
              <X size={16} aria-hidden="true" />
            </button>
          ) : null}
          <label className="wp-fab" title="Своё фото уикенда">
            <ImagePlus size={16} aria-hidden="true" />
            <span className="sr-only">Загрузить своё фото уикенда</span>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) onPick(f)
                e.target.value = ''
              }}
            />
          </label>
        </div>
      </div>

      <h2 className="wp-title" style={{ fontSize: size }} aria-label={title}>
        {lines.map((w, i) => (
          <span key={`${w}-${i}`} className="wp-title-line" aria-hidden="true">
            {i === lines.length - 1 ? <i className="wp-chk" /> : null}
            {w}
          </span>
        ))}
      </h2>

      <dl className="wp-meta">
        <div>
          <dt>Место</dt>
          <dd>{event.place}</dd>
        </div>
        <div>
          <dt>Даты</dt>
          <dd>{dates}</dd>
        </div>
        <div>
          <dt>Сезон</dt>
          <dd>
            R{pad(round)} / {season}
          </dd>
        </div>
      </dl>

      <Countdown event={event} />
    </header>
  )
}

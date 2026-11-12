'use client'

import Image from 'next/image'
import { MapPin } from 'lucide-react'
import { useNow } from '@/lib/use-now'
import { addDays, hhmm, hintFor, mon, pad, parseISODate, shortName, weekday, type RaceEvent } from '@/lib/f1'
import { GiantWord, PosterCard, Signature } from './poster'

function Countdown({ target }: { target: number }) {
  const now = useNow(1000)
  let ms = Math.max(0, target - now)
  const d = Math.floor(ms / 86_400_000)
  ms -= d * 86_400_000
  const h = Math.floor(ms / 3_600_000)
  ms -= h * 3_600_000
  const m = Math.floor(ms / 60_000)
  ms -= m * 60_000
  const s = Math.floor(ms / 1000)
  const cells: [number, string][] = [
    [d, 'дн'],
    [h, 'час'],
    [m, 'мин'],
    [s, 'сек'],
  ]
  return (
    <div className="count" role="timer" aria-label={`${d} дн ${h} ч ${m} мин до старта`}>
      {cells.map(([v, l], i) => (
        <div key={l} className="contents">
          {i > 0 && <i aria-hidden="true">:</i>}
          <div>
            <b>{pad(v)}</b>
            <small>{l}</small>
          </div>
        </div>
      ))}
    </div>
  )
}

export function WeekendView({ event, round, season }: { event: RaceEvent; round: number; season: number }) {
  const now = useNow(30_000)
  const sprint = event.format === 'sprint'
  const nextIdx = event.sessions.findIndex((s) => new Date(s.at).getTime() > now)
  const next = event.sessions[nextIdx]
  const start = parseISODate(event.start)
  const end = addDays(start, 2)
  const dates =
    start.getMonth() === end.getMonth()
      ? `${pad(start.getDate())}–${pad(end.getDate())} ${mon(start)}`
      : `${pad(start.getDate())} ${mon(start)} – ${pad(end.getDate())} ${mon(end)}`

  return (
    <>
      <PosterCard left={`Season ${season} · Round ${pad(round)}`} right="One weekend · One goal">
        <div className="micro mb-3 flex justify-between">
          <span>Гран-при</span>
          <span>{sprint ? 'Sprint weekend' : 'Race weekend'}</span>
        </div>
        <div className="words">
          <GiantWord text={shortName(event.name)} width={256} max={170} />
          <Signature />
        </div>
        <div className="my-3 flex items-center justify-between gap-3">
          <span className="flex min-w-0 items-center gap-1.5 text-xs font-semibold">
            <MapPin size={13} aria-hidden="true" className="shrink-0" />
            <span className="truncate">{event.place}</span>
          </span>
          <span className="display shrink-0 text-lg font-black leading-none tracking-wide">{dates}</span>
        </div>
        <div className="relative h-40 overflow-hidden bg-ink">
          <Image
            src={event.image ?? '/img/car.jpg'}
            alt={event.name}
            fill
            sizes="400px"
            className="object-cover object-center"
            priority
          />
          <span className={`tag absolute left-2 top-2 ${sprint ? '' : 'red'}`}>
            {sprint ? 'Спринт-уикенд' : 'Обычный уикенд'}
          </span>
        </div>
        <div className="cd">
          {next ? (
            <>
              <div className="micro">Следующая сессия</div>
              <div className="display mb-2 mt-1 text-[24px] font-black leading-none tracking-wide">{next.label}</div>
              <Countdown target={new Date(next.at).getTime()} />
            </>
          ) : (
            <div className="micro py-2">Уикенд завершён</div>
          )}
        </div>
      </PosterCard>

      <div className="sec">
        <span className="micro font-bold">Расписание</span>
        <span className="micro mute">Пт — Вс</span>
      </div>
      <ul>
        {event.sessions.map((s, i) => {
          const at = new Date(s.at)
          const kind = s.key === 'r' ? 'race' : s.key === 's' || s.key === 'sq' ? 'sprint' : undefined
          const state = i === nextIdx ? 'now' : at.getTime() < now ? 'past' : undefined
          return (
            <li key={s.key} className="sess" data-kind={kind} data-state={state}>
              <div className="w-14 shrink-0">
                <b className="display block text-[30px] font-extrabold leading-[0.9] tabular-nums">{hhmm(at)}</b>
                <small className="micro mute mt-1 block">{weekday(at)}</small>
              </div>
              <div className="display flex-1 text-[21px] font-extrabold leading-none tracking-wide">
                {s.label}
                <small className="mute mt-1 block font-sans text-xs font-medium normal-case tracking-normal">
                  {hintFor(s.key)}
                </small>
              </div>
            </li>
          )
        })}
      </ul>
    </>
  )
}

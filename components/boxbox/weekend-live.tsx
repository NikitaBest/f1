'use client'

import { useEffect, useState } from 'react'
import type { LiveBoard } from '@/app/api/live/route'
import { useTheme } from '@/lib/store'
import { PilotAvatar } from './pilot-avatar'

function flagLabel(flag?: string | null) {
  if (!flag) return null
  if (/CHEQUERED/i.test(flag)) return 'Chequered'
  if (/GREEN/i.test(flag)) return 'Green'
  if (/YELLOW/i.test(flag)) return 'Yellow'
  if (/RED/i.test(flag)) return 'Red'
  if (/SAFETY/i.test(flag)) return 'Safety Car'
  return flag
}

function timeOf(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function WeekendLive({ circuitId }: { circuitId: string }) {
  const theme = useTheme()
  const [data, setData] = useState<LiveBoard | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    let timer: ReturnType<typeof setInterval> | undefined

    const load = () => {
      fetch(`/api/live?circuit=${encodeURIComponent(circuitId)}`)
        .then(async (res) => {
          if (!res.ok) throw new Error('no live')
          return res.json() as Promise<LiveBoard>
        })
        .then((payload) => {
          if (cancelled) return
          setData(payload)
          setError(false)
        })
        .catch(() => {
          if (cancelled) return
          setError(true)
          setData(null)
        })
    }

    load()
    timer = setInterval(load, 30_000)
    return () => {
      cancelled = true
      if (timer) clearInterval(timer)
    }
  }, [circuitId])

  if (error) {
    return <p className="wk-live-empty">Нет данных эфира для этой трассы.</p>
  }
  if (!data) {
    return <p className="wk-live-empty">Подтягиваем эфир…</p>
  }

  const flag = flagLabel(data.flag)

  return (
    <section className="wk-live" aria-label={data.live ? 'Эфир гонки' : 'Результат гонки'}>
      <div className="wk-live-head">
        <div>
          <span className="eyebrow">{data.live ? 'Live' : `Результат · ${data.year}`}</span>
          <b className="disp">
            {data.circuitName} · {data.sessionName}
          </b>
        </div>
        {flag ? <span className={`wk-live-flag ${flag.toLowerCase().replace(/\s+/g, '-')}`}>{flag}</span> : null}
      </div>

      <ol className="wk-live-board">
        {data.standings.map((row) => {
          const fav = row.code === theme.code
          return (
            <li key={row.number} className={fav ? 'fav' : undefined}>
              <span className="pos num">{row.position}</span>
              <span className="who">
                <PilotAvatar code={row.code} />
                <span>
                  <b>{row.code}</b>
                  <small>{row.team || row.name}</small>
                </span>
              </span>
              <span className="gap num">
                {row.status ? row.status.toUpperCase() : row.gap}
              </span>
            </li>
          )
        })}
      </ol>

      {data.control.length > 0 ? (
        <div className="wk-live-rc">
          <span className="eyebrow">Race control</span>
          <ul>
            {data.control.map((c) => (
              <li key={`${c.date}-${c.message}`}>
                <span className="rc-time">{timeOf(c.date)}</span>
                <span className="rc-msg">
                  {c.flag ? <b>{c.flag}</b> : null}
                  {c.flag ? ' · ' : ''}
                  {c.message}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  )
}

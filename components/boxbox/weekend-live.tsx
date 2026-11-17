'use client'

import type { LiveBoard, LiveStanding } from '@/app/api/live/route'
import { useTheme } from '@/lib/store'
import { PilotAvatar } from './pilot-avatar'
import { useWk } from './weekend-data'
import { cssVars, timeOf, WxEmpty, WxHead, WxLoading } from './wx-ui'

function flagLabel(flag?: string | null) {
  if (!flag) return null
  if (/CHEQUERED/i.test(flag)) return 'Chequered'
  if (/GREEN/i.test(flag)) return 'Green'
  if (/YELLOW/i.test(flag)) return 'Yellow'
  if (/RED/i.test(flag)) return 'Red'
  if (/SAFETY/i.test(flag)) return 'Safety Car'
  return flag
}

function flagTone(flag?: string | null) {
  if (!flag) return 'none'
  if (/CHEQUERED/i.test(flag)) return 'chq'
  if (/GREEN/i.test(flag)) return 'green'
  if (/YELLOW|SAFETY/i.test(flag)) return 'yellow'
  if (/RED/i.test(flag)) return 'red'
  return 'none'
}

function Podium({ rows, favCode }: { rows: LiveStanding[]; favCode?: string }) {
  const order = [rows[1], rows[0], rows[2]].filter(Boolean) as LiveStanding[]
  return (
    <ol className="wx-podium" aria-label="Подиум">
      {order.map((r, i) => (
        <li
          key={r.number}
          className={`wx-pod p${r.position}${r.code === favCode ? ' fav' : ''}`}
          style={cssVars({ '--tc': r.color, '--i': i })}
        >
          <span className="wx-pod-no" aria-hidden="true">
            {r.position}
          </span>
          <PilotAvatar code={r.code} className="wx-av" />
          <b className="wx-pod-code">{r.code}</b>
          <small className="wx-pod-team">{r.team || r.name}</small>
          <span className="wx-pod-gap num">{r.status ? r.status.toUpperCase() : r.gap}</span>
        </li>
      ))}
    </ol>
  )
}

export function WeekendLive({ circuitId }: { circuitId: string }) {
  const theme = useTheme()
  const { data, error } = useWk<LiveBoard>('live', circuitId, 30_000)

  if (error && !data) return <WxEmpty>Нет данных эфира для этой трассы.</WxEmpty>
  if (!data) return <WxLoading />

  const flag = flagLabel(data.flag)
  const podium = data.standings.slice(0, 3)
  const rest = data.standings.slice(3)

  return (
    <section className="wx wx-live" aria-label={data.live ? 'Эфир гонки' : 'Результат гонки'}>
      <WxHead
        eyebrow={data.live ? 'Live timing' : `Результат · ${data.year}`}
        title={`${data.circuitName} · ${data.sessionName}`}
        aside={
          flag ? (
            <span className={`wx-flag ${flagTone(data.flag)}`}>
              <i aria-hidden="true" />
              {flag}
            </span>
          ) : null
        }
      />

      {podium.length > 0 ? <Podium rows={podium} favCode={theme.code} /> : null}

      <ol className="wx-board">
        {rest.map((r, i) => (
          <li
            key={r.number}
            className={r.code === theme.code ? 'fav' : undefined}
            style={cssVars({ '--tc': r.color, '--i': i })}
          >
            <span className="wx-board-pos num">{r.position}</span>
            <i className="wx-board-bar" aria-hidden="true" />
            <PilotAvatar code={r.code} className="wx-av sm" />
            <span className="wx-board-who">
              <b>{r.code}</b>
              <small>{r.team || r.name}</small>
            </span>
            <span className={`wx-board-gap num${r.status ? ' out' : ''}`}>
              {r.status ? r.status.toUpperCase() : r.gap}
            </span>
          </li>
        ))}
      </ol>

      {data.control.length > 0 ? (
        <div className="wx-block">
          <span className="wx-eyebrow">Race control</span>
          <ul className="wx-timeline">
            {data.control.map((c, i) => (
              <li key={`${c.date}-${c.message}`} style={cssVars({ '--i': i })}>
                <span className={`wx-tl-dot ${flagTone(c.flag)}`} aria-hidden="true" />
                <time className="num">{timeOf(c.date)}</time>
                <span className="wx-tl-msg">
                  {c.flag ? <b>{c.flag}</b> : null}
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

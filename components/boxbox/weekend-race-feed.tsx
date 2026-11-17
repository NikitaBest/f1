'use client'

import { useEffect, useState } from 'react'
import type { RaceFeed } from '@/app/api/race-feed/route'
import { useTheme } from '@/lib/store'
import { PilotAvatar } from './pilot-avatar'

function fmtDur(sec: number | null) {
  if (sec == null || !Number.isFinite(sec)) return '—'
  return `${sec.toFixed(1)}s`
}

function timeOf(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function WeekendRaceFeed({ circuitId }: { circuitId: string }) {
  const theme = useTheme()
  const [data, setData] = useState<RaceFeed | null>(null)
  const [error, setError] = useState(false)
  const [tab, setTab] = useState<'pits' | 'passes'>('pits')

  useEffect(() => {
    let cancelled = false
    setData(null)
    setError(false)
    fetch(`/api/race-feed?circuit=${encodeURIComponent(circuitId)}`)
      .then(async (res) => {
        if (!res.ok) throw new Error('no feed')
        return res.json() as Promise<RaceFeed>
      })
      .then((payload) => {
        if (!cancelled) setData(payload)
      })
      .catch(() => {
        if (!cancelled) {
          setError(true)
          setData(null)
        }
      })
    return () => {
      cancelled = true
    }
  }, [circuitId])

  if (error) return <p className="wk-live-empty">Нет данных питов и обгонов.</p>
  if (!data) return <p className="wk-live-empty">Собираем питы и обгоны…</p>

  return (
    <section className="wk-feed" aria-label="Питы и обгоны">
      <div className="wk-feed-head">
        <div>
          <span className="eyebrow">
            Race feed · {data.year}
          </span>
          <b className="disp">{data.circuitName}</b>
        </div>
        <span className="wk-feed-stat">
          {data.pits.length} pits · {data.totalOvertakes} passes
        </span>
      </div>

      <div className="wk-feed-tabs" role="tablist" aria-label="Питы или обгоны">
        <button type="button" role="tab" aria-selected={tab === 'pits'} onClick={() => setTab('pits')}>
          Питы
        </button>
        <button type="button" role="tab" aria-selected={tab === 'passes'} onClick={() => setTab('passes')}>
          Обгоны
        </button>
      </div>

      {tab === 'pits' ? (
        data.pits.length === 0 ? (
          <p className="wk-feed-empty">Пит-стопов в данных нет.</p>
        ) : (
          <ol className="wk-feed-list">
            {data.pits.map((p) => (
              <li key={`${p.number}-${p.lap}-${p.date}`} className={p.code === theme.code ? 'fav' : undefined}>
                <span className="debrief-mark">
                  <PilotAvatar code={p.code} />
                  <span className="code">{p.code}</span>
                </span>
                <span className="meta">
                  <b>Lap {p.lap || '—'}</b>
                  <span>{timeOf(p.date)}</span>
                </span>
                <span className="tail num">{fmtDur(p.duration)}</span>
              </li>
            ))}
          </ol>
        )
      ) : (
        <>
          {data.topPassers.length > 0 ? (
            <div className="wk-feed-top" aria-label="Больше всего обгонов">
              {data.topPassers.map((p) => (
                <span key={p.code} className={p.code === theme.code ? 'fav' : undefined}>
                  <b>{p.code}</b>
                  <small>{p.count}</small>
                </span>
              ))}
            </div>
          ) : null}
          {data.overtakes.length === 0 ? (
            <p className="wk-feed-empty">Обгонов в данных нет.</p>
          ) : (
            <ol className="wk-feed-list">
              {data.overtakes.map((o) => (
                <li
                  key={`${o.date}-${o.by}-${o.of}`}
                  className={o.by === theme.code || o.of === theme.code ? 'fav' : undefined}
                >
                  <span className="pass-pair">
                    <b>{o.by}</b>
                    <span aria-hidden="true">→</span>
                    <b>{o.of}</b>
                  </span>
                  <span className="meta">
                    <b>P{o.position || '—'}</b>
                    <span>{timeOf(o.date)}</span>
                  </span>
                </li>
              ))}
            </ol>
          )}
        </>
      )}
    </section>
  )
}

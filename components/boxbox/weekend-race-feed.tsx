'use client'

import { ArrowRight } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { RaceFeed } from '@/app/api/race-feed/route'
import { useTheme } from '@/lib/store'
import { PilotAvatar } from './pilot-avatar'
import { useWk } from './weekend-data'
import { cssVars, timeOf, WxEmpty, WxHead, WxLoading } from './wx-ui'

export function WeekendRaceFeed({ circuitId }: { circuitId: string }) {
  const theme = useTheme()
  const { data, error } = useWk<RaceFeed>('race-feed', circuitId)
  const [tab, setTab] = useState<'pits' | 'passes'>('pits')

  const stats = useMemo(() => {
    const durations = (data?.pits ?? []).map((p) => p.duration).filter((d): d is number => d != null && d > 0)
    if (!durations.length) return { fastest: null as number | null, max: 1 }
    return { fastest: Math.min(...durations), max: Math.min(Math.max(...durations), 40) }
  }, [data])

  if (error && !data) return <WxEmpty>Нет данных питов и обгонов.</WxEmpty>
  if (!data) return <WxLoading />

  const topMax = Math.max(1, ...data.topPassers.map((p) => p.count))

  return (
    <section className="wx wx-feed" aria-label="Питы и обгоны">
      <WxHead
        eyebrow={`Pit wall · ${data.year}`}
        title={data.circuitName}
        aside={
          <span className="wx-count">
            <b className="num">{tab === 'pits' ? data.pits.length : data.totalOvertakes}</b>
            <small>{tab === 'pits' ? 'пит-стопов' : 'обгонов'}</small>
          </span>
        }
      />

      <div className="wx-seg" role="tablist" aria-label="Питы или обгоны">
        <button type="button" role="tab" aria-selected={tab === 'pits'} onClick={() => setTab('pits')}>
          Питы
        </button>
        <button type="button" role="tab" aria-selected={tab === 'passes'} onClick={() => setTab('passes')}>
          Обгоны
        </button>
      </div>

      {tab === 'pits' ? (
        data.pits.length === 0 ? (
          <WxEmpty>Пит-стопов в данных нет.</WxEmpty>
        ) : (
          <ol className="wx-pits">
            {data.pits.map((p, i) => {
              const fastest = p.duration != null && p.duration === stats.fastest
              const width = p.duration ? Math.max(8, Math.min(100, (p.duration / stats.max) * 100)) : 8
              return (
                <li
                  key={`${p.number}-${p.lap}-${p.date}`}
                  className={`${p.code === theme.code ? 'fav' : ''}${fastest ? ' best' : ''}`}
                  style={cssVars({ '--i': Math.min(i, 14), '--w': `${width}%` })}
                >
                  <PilotAvatar code={p.code} className="wx-av sm" />
                  <span className="wx-pit-who">
                    <b>{p.code}</b>
                    <small className="num">
                      Круг {p.lap || '—'} · {timeOf(p.date)}
                    </small>
                  </span>
                  <span className="wx-pit-time num">
                    {p.duration != null ? p.duration.toFixed(1) : '—'}
                    <small>с</small>
                  </span>
                  <i className="wx-pit-bar" aria-hidden="true" />
                  {fastest ? <em className="wx-pit-tag">Fastest</em> : null}
                </li>
              )
            })}
          </ol>
        )
      ) : (
        <>
          {data.topPassers.length > 0 ? (
            <div className="wx-block">
              <span className="wx-eyebrow">Больше всего обгонов</span>
              <ul className="wx-top">
                {data.topPassers.map((p, i) => (
                  <li
                    key={p.code}
                    className={p.code === theme.code ? 'fav' : undefined}
                    style={cssVars({ '--i': i, '--w': `${(p.count / topMax) * 100}%` })}
                  >
                    <b>{p.code}</b>
                    <i aria-hidden="true" />
                    <span className="num">{p.count}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {data.overtakes.length === 0 ? (
            <WxEmpty>Обгонов в данных нет.</WxEmpty>
          ) : (
            <ol className="wx-passes">
              {data.overtakes.map((o, i) => (
                <li
                  key={`${o.date}-${o.by}-${o.of}`}
                  className={o.by === theme.code || o.of === theme.code ? 'fav' : undefined}
                  style={cssVars({ '--i': Math.min(i, 14) })}
                >
                  <b className="by">{o.by}</b>
                  <ArrowRight size={16} aria-hidden="true" />
                  <b className="of">{o.of}</b>
                  <span className="wx-pass-pos num">P{o.position || '—'}</span>
                  <time className="num">{timeOf(o.date)}</time>
                </li>
              ))}
            </ol>
          )}
        </>
      )}
    </section>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { shortName } from '@/lib/f1'
import { fetchWeekendDebrief, type DebriefDriver, type WeekendDebrief } from '@/lib/jolpica'

function finishOf(d: DebriefDriver) {
  const t = d.positionText.toUpperCase()
  if (t === 'R' || t === 'W' || t === 'E' || /retir|disqual|dns|dsq/i.test(d.status)) return 'DNF'
  return `P${d.position}`
}

export function WeekendDebriefScreen({
  season,
  round,
  mode,
  onBack,
}: {
  season: string
  round: string
  mode: 'driver' | 'team'
  onBack: () => void
}) {
  const [data, setData] = useState<WeekendDebrief | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const brief = await fetchWeekendDebrief({ season, round, mode })
        if (!cancelled) setData(brief)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Не удалось загрузить разбор')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [season, round, mode])

  return (
    <div className="scroll debrief">
      <div className="topbar">
        <button type="button" className="back" onClick={onBack}>
          <ArrowLeft size={18} aria-hidden="true" />
          Results
        </button>
        <span className="eyebrow">
          Round {round} · {season}
        </span>
      </div>

      {loading && <p className="sub">Собираем уикенд…</p>}
      {error && <p className="err-note">{error}</p>}

      {data && (
        <>
          <header className="debrief-hero">
            <span className="eyebrow">Weekend debrief</span>
            <h1 className="disp">{shortName(data.raceName)}</h1>
            <p>{data.date}</p>
          </header>

          <div className="sec-title">
            <h2 className="disp">Circuit</h2>
            <span className="eyebrow">Track</span>
          </div>
          <div className="circuit-card">
            <b className="disp">{data.circuit.circuitName}</b>
            <span className="circuit-place">
              {data.circuit.locality}, {data.circuit.country}
            </span>
            <span className="circuit-id">{data.circuit.circuitId}</span>
          </div>

          {data.qualiBest && (
            <div className="debrief-quali">
              <span className="eyebrow">Qualifying</span>
              <b className="disp num">P{data.qualiBest}</b>
            </div>
          )}

          {data.sprintDrivers.length > 0 && (
            <>
              <div className="sec-title">
                <h2 className="disp">Sprint</h2>
                <span className="eyebrow">Saturday</span>
              </div>
              <ul className="debrief-drivers">
                {data.sprintDrivers.map((d) => (
                  <li key={`s-${d.code}`}>
                    <span className="code">{d.code}</span>
                    <span className="meta">
                      <b>{finishOf(d)}</b>
                      <span>
                        from P{d.grid || '—'} · +{d.points}
                      </span>
                    </span>
                    <span className="tail">{d.time ?? d.status}</span>
                  </li>
                ))}
              </ul>
            </>
          )}

          <div className="sec-title">
            <h2 className="disp">Race</h2>
            <span className="eyebrow">Grid → finish</span>
          </div>
          <ul className="debrief-drivers">
            {data.raceDrivers.map((d) => (
              <li key={`r-${d.code}`} className={d.position === '1' ? 'win' : ''}>
                <span className="code">{d.code}</span>
                <span className="meta">
                  <b>{finishOf(d)}</b>
                  <span>
                    from P{d.grid || '—'} · +{d.points}
                  </span>
                </span>
                <span className="tail">{d.time ?? d.status}</span>
              </li>
            ))}
          </ul>

          <div className="sec-title">
            <h2 className="disp">Fastest lap</h2>
            <span className="eyebrow">Best time</span>
          </div>
          <ul className="debrief-fl">
            {data.raceDrivers.map((d) => (
              <li key={`fl-${d.code}`}>
                <span className="code">{d.code}</span>
                <span className="meta">
                  <b className="num">{d.fastestLap ?? '—'}</b>
                  <span>
                    {d.fastestLapRank ? `rank ${d.fastestLapRank}` : 'no FL'}
                    {d.fastestLapNumber ? ` · lap ${d.fastestLapNumber}` : ''}
                  </span>
                </span>
              </li>
            ))}
          </ul>

          <div className="sec-title">
            <h2 className="disp">Pit stops</h2>
            <span className="eyebrow">{data.pitStops.length || '0'} stops</span>
          </div>
          {data.pitStops.length === 0 ? (
            <p className="sub">Нет данных о пит-стопах для этого этапа.</p>
          ) : (
            <ol className="debrief-pits">
              {data.pitStops.map((p) => (
                <li key={`${p.driverId}-${p.stop}-${p.lap}`}>
                  <b className="num">#{p.stop}</b>
                  <span className="meta">
                    <span className="nm">
                      {p.code} · lap {p.lap}
                    </span>
                    <span className="subline">{p.time}</span>
                  </span>
                  <span className="tail num">{p.duration}s</span>
                </li>
              ))}
            </ol>
          )}
        </>
      )}
    </div>
  )
}

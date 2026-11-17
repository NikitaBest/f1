'use client'

import { Pause, Play } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { TelemetryPayload } from '@/app/api/telemetry/route'
import { useTheme } from '@/lib/store'

function fmtLap(sec: number) {
  const m = Math.floor(sec / 60)
  return `${m}:${(sec - m * 60).toFixed(3).padStart(6, '0')}`
}

function speedPath(points: TelemetryPayload['points'], maxSpeed: number, w = 320, h = 72) {
  if (!points.length) return ''
  return points
    .map((p, i) => {
      const x = p.t * w
      const y = h - (p.speed / maxSpeed) * (h - 8) - 4
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`
    })
    .join(' ')
}

export function WeekendTelemetry({ circuitId }: { circuitId: string }) {
  const theme = useTheme()
  const [driver, setDriver] = useState(theme.code || '')
  const [data, setData] = useState<TelemetryPayload | null>(null)
  const [error, setError] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [cursor, setCursor] = useState(0)
  const raf = useRef(0)
  const startRef = useRef(0)

  useEffect(() => {
    setDriver(theme.code || '')
  }, [theme.code])

  useEffect(() => {
    let cancelled = false
    setData(null)
    setError(false)
    setPlaying(false)
    setCursor(0)
    const q = new URLSearchParams({ circuit: circuitId })
    if (driver) q.set('driver', driver)
    fetch(`/api/telemetry?${q}`)
      .then(async (res) => {
        if (!res.ok) throw new Error('no telemetry')
        return res.json() as Promise<TelemetryPayload>
      })
      .then((payload) => {
        if (!cancelled) {
          setData(payload)
          setDriver(payload.driver.code)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError(true)
          setData(null)
        }
      })
    return () => {
      cancelled = true
      cancelAnimationFrame(raf.current)
    }
  }, [circuitId, driver])

  useEffect(() => {
    if (!playing || !data) return
    const duration = Math.max(4, data.lap.duration) * 1000
    startRef.current = performance.now() - cursor * duration
    const tick = (now: number) => {
      const t = Math.min(1, (now - startRef.current) / duration)
      setCursor(t)
      if (t >= 1) {
        setPlaying(false)
        return
      }
      raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [playing, data])

  const point = useMemo(() => {
    if (!data?.points.length) return null
    const idx = Math.min(data.points.length - 1, Math.round(cursor * (data.points.length - 1)))
    return data.points[idx]!
  }, [data, cursor])

  const chart = useMemo(() => {
    if (!data) return ''
    return speedPath(data.points, data.maxSpeed)
  }, [data])

  if (error) return <p className="wk-live-empty">Нет GPS и телеметрии круга.</p>
  if (!data) return <p className="wk-live-empty">Собираем GPS и телеметрию…</p>

  return (
    <section className="wk-telem" aria-label="GPS и телеметрия">
      <div className="wk-feed-head">
        <div>
          <span className="eyebrow">
            Telemetry · {data.year} · lap {data.lap.number}
          </span>
          <b className="disp">{data.circuitName}</b>
        </div>
        <span className="wk-feed-stat">{fmtLap(data.lap.duration)}</span>
      </div>

      <div className="wk-radio-filters" role="tablist" aria-label="Пилот">
        {data.drivers.map((d) => (
          <button
            key={d.number}
            type="button"
            role="tab"
            aria-selected={d.code === data.driver.code}
            className={d.code === theme.code ? 'fav' : undefined}
            onClick={() => {
              if (d.code !== driver) setDriver(d.code)
            }}
          >
            {d.code}
          </button>
        ))}
      </div>

      <div className="wk-telem-map-wrap">
        <svg className="wk-telem-map" viewBox="0 0 100 100" role="img" aria-label="GPS трек круга">
          <path d={data.path} className="wk-telem-track" />
          {point ? (
            <circle cx={point.x} cy={point.y} r="2.4" className="wk-telem-dot">
              <animate attributeName="r" values="2.2;2.8;2.2" dur="1.2s" repeatCount="indefinite" />
            </circle>
          ) : null}
        </svg>
        <div className="wk-telem-hud">
          <button
            type="button"
            className={`wk-radio-play${playing ? ' on' : ''}`}
            aria-label={playing ? 'Пауза' : 'Проиграть круг'}
            onClick={() => {
              if (cursor >= 1) setCursor(0)
              setPlaying((v) => !v)
            }}
          >
            {playing ? <Pause size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}
          </button>
          <div className="wk-telem-readouts">
            <b className="num">{point ? Math.round(point.speed) : '—'}</b>
            <span>км/ч</span>
            <b className="num">{point?.gear || '—'}</b>
            <span>передача</span>
            <b className="num">{point?.drs ? 'DRS' : '—'}</b>
            <span>статус</span>
          </div>
        </div>
      </div>

      <ul className="wk-telem-sectors" aria-label="Сектора">
        {data.lap.sectors.map((s, i) => (
          <li key={i}>
            <span>S{i + 1}</span>
            <b className="num">{s ? s.toFixed(3) : '—'}</b>
          </li>
        ))}
        <li>
          <span>ST</span>
          <b className="num">{data.lap.st ?? '—'}</b>
        </li>
      </ul>

      <svg className="wk-telem-chart" viewBox="0 0 320 72" role="img" aria-label="Скорость по кругу">
        <path d={chart} className="wk-telem-speed" />
        <line
          x1={cursor * 320}
          x2={cursor * 320}
          y1="0"
          y2="72"
          className="wk-telem-cursor"
        />
      </svg>

      <div className="wk-telem-pedals" aria-hidden="true">
        <div>
          <span>Throttle</span>
          <i style={{ width: `${point?.throttle ?? 0}%` }} className="thr" />
        </div>
        <div>
          <span>Brake</span>
          <i style={{ width: `${point?.brake ?? 0}%` }} className="brk" />
        </div>
      </div>
    </section>
  )
}

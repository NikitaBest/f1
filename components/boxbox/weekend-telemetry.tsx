'use client'

import { Pause, Play } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { TelemetryPayload } from '@/app/api/telemetry/route'
import { useTheme } from '@/lib/store'
import { PilotAvatar } from './pilot-avatar'
import { cssVars, WxEmpty, WxHead, WxLoading } from './wx-ui'

const CHART_W = 320
const CHART_H = 84
const SEGMENTS = 22

function fmtLap(sec: number) {
  const m = Math.floor(sec / 60)
  return `${m}:${(sec - m * 60).toFixed(3).padStart(6, '0')}`
}

function chartPaths(points: TelemetryPayload['points'], maxSpeed: number) {
  if (!points.length) return { line: '', area: '' }
  const line = points
    .map((p, i) => {
      const x = p.t * CHART_W
      const y = CHART_H - (p.speed / maxSpeed) * (CHART_H - 10) - 5
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`
    })
    .join(' ')
  return { line, area: `${line} L${CHART_W} ${CHART_H} L0 ${CHART_H} Z` }
}

function Meter({ value, tone }: { value: number; tone: 'thr' | 'brk' }) {
  const lit = Math.round((Math.min(100, Math.max(0, value)) / 100) * SEGMENTS)
  return (
    <span className={`wx-meter ${tone}`} aria-hidden="true">
      {Array.from({ length: SEGMENTS }, (_, i) => (
        <i key={i} className={i < lit ? 'on' : undefined} />
      ))}
    </span>
  )
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
    // cursor is intentionally read once at start so playback resumes from the scrubbed position
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, data])

  const point = useMemo(() => {
    if (!data?.points.length) return null
    const idx = Math.min(data.points.length - 1, Math.round(cursor * (data.points.length - 1)))
    return data.points[idx]!
  }, [data, cursor])

  const chart = useMemo(() => (data ? chartPaths(data.points, data.maxSpeed) : null), [data])

  if (error) return <WxEmpty>Нет GPS и телеметрии круга.</WxEmpty>
  if (!data || !chart) return <WxLoading />

  const sectorBest = Math.min(...data.lap.sectors.filter((s) => s > 0))

  return (
    <section className="wx wx-telem" aria-label="GPS и телеметрия">
      <WxHead
        eyebrow={`Telemetry · ${data.year} · круг ${data.lap.number}`}
        title={data.circuitName}
        aside={
          <span className="wx-count">
            <b className="num">{fmtLap(data.lap.duration)}</b>
            <small>время круга</small>
          </span>
        }
      />

      <div className="wx-chips" role="tablist" aria-label="Пилот">
        {data.drivers.map((d) => (
          <button
            key={d.number}
            type="button"
            role="tab"
            aria-selected={d.code === data.driver.code}
            className={`has-av${d.code === theme.code ? ' fav' : ''}`}
            onClick={() => {
              if (d.code !== driver) setDriver(d.code)
            }}
          >
            <PilotAvatar code={d.code} className="wx-av xs" />
            {d.code}
          </button>
        ))}
      </div>

      <div className="wx-map">
        <svg viewBox="0 0 100 100" role="img" aria-label="GPS трек круга">
          <path d={data.path} className="wx-map-glow" />
          <path d={data.path} className="wx-map-line" />
          {point ? (
            <g transform={`translate(${point.x} ${point.y})`}>
              <circle r="5" className="wx-map-halo" />
              <circle r="2.2" className="wx-map-dot" />
            </g>
          ) : null}
        </svg>

        <div className="wx-hud">
          <span className="wx-hud-speed">
            <b className="num">{point ? Math.round(point.speed) : '—'}</b>
            <small>км/ч</small>
          </span>
          <span className="wx-hud-gear">
            <small>Gear</small>
            <b className="num">{point?.gear || 'N'}</b>
          </span>
          <span className={`wx-hud-drs${point?.drs ? ' on' : ''}`}>DRS</span>
        </div>

        <button
          type="button"
          className={`wx-play${playing ? ' on' : ''}`}
          aria-label={playing ? 'Пауза' : 'Проиграть круг'}
          onClick={() => {
            if (cursor >= 1) setCursor(0)
            setPlaying((v) => !v)
          }}
        >
          {playing ? <Pause size={18} aria-hidden="true" /> : <Play size={18} aria-hidden="true" />}
        </button>
      </div>

      <label className="wx-scrub">
        <span className="sr-only">Положение на круге</span>
        <input
          type="range"
          min={0}
          max={1000}
          value={Math.round(cursor * 1000)}
          onChange={(e) => {
            setPlaying(false)
            setCursor(Number(e.target.value) / 1000)
          }}
          style={cssVars({ '--p': `${cursor * 100}%` })}
        />
      </label>

      <ul className="wx-sectors" aria-label="Сектора">
        {data.lap.sectors.map((s, i) => (
          <li key={i} className={s > 0 && s === sectorBest ? 'best' : undefined} style={cssVars({ '--i': i })}>
            <small>S{i + 1}</small>
            <b className="num">{s ? s.toFixed(3) : '—'}</b>
          </li>
        ))}
        <li style={cssVars({ '--i': 3 })}>
          <small>Speed trap</small>
          <b className="num">{data.lap.st ?? '—'}</b>
        </li>
      </ul>

      <div className="wx-block">
        <span className="wx-eyebrow">Скорость по кругу</span>
        <svg className="wx-chart" viewBox={`0 0 ${CHART_W} ${CHART_H}`} role="img" aria-label="Скорость по кругу">
          <defs>
            <linearGradient id="wx-speed-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#d4ff1e" stopOpacity="0.38" />
              <stop offset="1" stopColor="#d4ff1e" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={chart.area} fill="url(#wx-speed-fill)" />
          <path d={chart.line} className="wx-chart-line" />
          <line x1={cursor * CHART_W} x2={cursor * CHART_W} y1="0" y2={CHART_H} className="wx-chart-cursor" />
        </svg>
      </div>

      <div className="wx-pedals">
        <div>
          <small>Throttle</small>
          <Meter value={point?.throttle ?? 0} tone="thr" />
          <b className="num">{Math.round(point?.throttle ?? 0)}%</b>
        </div>
        <div>
          <small>Brake</small>
          <Meter value={point?.brake ?? 0} tone="brk" />
          <b className="num">{Math.round(point?.brake ?? 0)}%</b>
        </div>
      </div>
    </section>
  )
}

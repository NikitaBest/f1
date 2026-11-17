'use client'

import { useEffect, useState } from 'react'
import type { CircuitWeather } from '@/app/api/weather/route'

function windDir(deg: number) {
  const dirs = ['С', 'СВ', 'В', 'ЮВ', 'Ю', 'ЮЗ', 'З', 'СЗ']
  return dirs[Math.round((((deg % 360) + 360) % 360) / 45) % 8]
}

function fmtTemp(n: number) {
  return `${Math.round(n)}°`
}

export function WeekendWeather({ circuitId }: { circuitId: string }) {
  const [data, setData] = useState<CircuitWeather | null>(null)

  useEffect(() => {
    let cancelled = false
    setData(null)
    fetch(`/api/weather?circuit=${encodeURIComponent(circuitId)}`)
      .then(async (res) => {
        if (!res.ok) throw new Error('no weather')
        return res.json() as Promise<CircuitWeather>
      })
      .then((payload) => {
        if (!cancelled) setData(payload)
      })
      .catch(() => {
        if (!cancelled) setData(null)
      })
    return () => {
      cancelled = true
    }
  }, [circuitId])

  if (!data) return null

  return (
    <div className="wk-weather" aria-label="Погода на трассе">
      <div className="wk-weather-top">
        <span className="eyebrow">{data.fresh ? 'Погода · сейчас' : `Погода · ${data.year}`}</span>
        <span className="wk-weather-tag">
          {data.rainfall ? 'Дождь' : 'Сухо'} · {data.sessionName}
        </span>
      </div>
      <div className="wk-weather-grid">
        <div>
          <small>Воздух</small>
          <b className="disp num">{fmtTemp(data.air)}</b>
        </div>
        <div>
          <small>Трасса</small>
          <b className="disp num">{fmtTemp(data.track)}</b>
        </div>
        <div>
          <small>Влажность</small>
          <b className="disp num">{Math.round(data.humidity)}%</b>
        </div>
        <div>
          <small>Ветер</small>
          <b className="disp num">
            {data.windSpeed.toFixed(1)}
            <span className="wk-weather-unit">м/с {windDir(data.windDirection)}</span>
          </b>
        </div>
      </div>
    </div>
  )
}

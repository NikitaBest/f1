'use client'

import type { CircuitWeather } from '@/app/api/weather/route'
import { useWk } from './weekend-data'

function windDir(deg: number) {
  const dirs = ['С', 'СВ', 'В', 'ЮВ', 'Ю', 'ЮЗ', 'З', 'СЗ']
  return dirs[Math.round((((deg % 360) + 360) % 360) / 45) % 8]
}

const clamp = (v: number) => Math.min(1, Math.max(0, v))

export function WeekendWeather({ circuitId }: { circuitId: string }) {
  const { data } = useWk<CircuitWeather>('weather', circuitId)
  if (!data) return null

  const cells: { label: string; value: string; unit: string; fill: number }[] = [
    { label: 'Воздух', value: `${Math.round(data.air)}`, unit: '°C', fill: clamp(data.air / 45) },
    { label: 'Трасса', value: `${Math.round(data.track)}`, unit: '°C', fill: clamp(data.track / 60) },
    { label: 'Влажность', value: `${Math.round(data.humidity)}`, unit: '%', fill: clamp(data.humidity / 100) },
    {
      label: 'Ветер',
      value: data.windSpeed.toFixed(1),
      unit: `м/с ${windDir(data.windDirection)}`,
      fill: clamp(data.windSpeed / 12),
    },
  ]

  return (
    <section className="wp-blk wp-wx" aria-label="Погода на трассе">
      <div className="wp-sec">
        <span className="wp-tag">{data.fresh ? 'Погода · сейчас' : `Погода · ${data.year}`}</span>
        <span className="wp-pill">
          {data.rainfall ? 'Дождь' : 'Сухо'} · {data.sessionName}
        </span>
      </div>
      <div className="wp-wx-grid">
        {cells.map((c) => (
          <div key={c.label} className="wp-wx-cell">
            <small>{c.label}</small>
            <span className="wp-wx-v">
              <b className="num">{c.value}</b>
              <em>{c.unit}</em>
            </span>
            <i className="wp-gauge" aria-hidden="true">
              <u style={{ width: `${c.fill * 100}%` }} />
            </i>
          </div>
        ))}
      </div>
    </section>
  )
}

'use client'

import { CloudRain, Sun, Wind } from 'lucide-react'
import type { CircuitWeather } from '@/app/api/weather/route'
import { useWk } from './weekend-data'
import { cssVars } from './wx-ui'

const DIRS = ['С', 'СВ', 'В', 'ЮВ', 'Ю', 'ЮЗ', 'З', 'СЗ']
const windDir = (deg: number) => DIRS[Math.round((((deg % 360) + 360) % 360) / 45) % 8]
const clamp = (v: number) => Math.min(1, Math.max(0, v))

const DROPS = Array.from({ length: 18 }, (_, i) => ({
  left: `${(i * 37) % 100}%`,
  delay: `${((i * 53) % 100) / 60}s`,
  dur: `${0.7 + ((i * 29) % 40) / 100}s`,
}))

export function WeekendWeather({ circuitId }: { circuitId: string }) {
  const { data } = useWk<CircuitWeather>('weather', circuitId)
  if (!data) return null

  const rain = data.rainfall
  const hot = data.track >= 40
  const sky = rain ? 'rain' : hot ? 'hot' : 'dry'
  const Icon = rain ? CloudRain : Sun
  const trackFill = clamp(data.track / 60)
  const pressureFill = clamp((data.pressure - 980) / 60)

  return (
    <section className="wp-blk wxw" data-sky={sky} aria-label="Погода на трассе">
      <div className="wp-sec">
        <span className="wp-tag">{data.fresh ? 'Погода · сейчас' : `Погода · ${data.year}`}</span>
        <span className="wp-pill">{data.sessionName}</span>
      </div>

      <div className="wxw-hero">
        <div className="wxw-sky" aria-hidden="true">
          {rain ? (
            DROPS.map((d, i) => <i key={i} style={cssVars({ left: d.left, animationDelay: d.delay, animationDuration: d.dur })} />)
          ) : (
            <>
              <span className="wxw-sun" />
              <span className="wxw-cloud c1" />
              <span className="wxw-cloud c2" />
            </>
          )}
        </div>
        <div className="wxw-main">
          <span className="wxw-cond">
            <Icon size={16} aria-hidden="true" />
            {rain ? 'Дождь' : hot ? 'Жарко, сухо' : 'Сухо'}
          </span>
          <b className="wxw-temp num">
            {Math.round(data.air)}
            <sup>°</sup>
          </b>
          <span className="wxw-sub">
            Трасса {Math.round(data.track)}° · Влажность {Math.round(data.humidity)}%
          </span>
        </div>
        <div className="wxw-ico" aria-hidden="true">
          <Icon size={64} strokeWidth={1.2} />
        </div>
      </div>

      <div className="wxw-tiles">
        <div className="wxw-tile">
          <small>Трасса</small>
          <b className="num">
            {Math.round(data.track)}
            <em>°C</em>
          </b>
          <span className="wxw-thermo" aria-hidden="true">
            <i style={cssVars({ '--f': `${trackFill * 100}%` })} />
          </span>
        </div>

        <div className="wxw-tile">
          <small>Влажность</small>
          <b className="num">
            {Math.round(data.humidity)}
            <em>%</em>
          </b>
          <span className="wxw-water" aria-hidden="true">
            <i style={cssVars({ '--f': `${clamp(data.humidity / 100) * 100}%` })} />
          </span>
        </div>

        <div className="wxw-tile">
          <small>Ветер</small>
          <b className="num">
            {data.windSpeed.toFixed(1)}
            <em>м/с {windDir(data.windDirection)}</em>
          </b>
          <span className="wxw-compass" aria-hidden="true">
            <i style={cssVars({ '--r': `${data.windDirection + 180}deg` })}>
              <Wind size={14} />
            </i>
            <u>N</u>
          </span>
        </div>

        <div className="wxw-tile">
          <small>Давление</small>
          <b className="num">
            {Math.round(data.pressure)}
            <em>гПа</em>
          </b>
          <span className="wxw-arc" aria-hidden="true">
            <svg viewBox="0 0 60 34">
              <path d="M6 30 A24 24 0 0 1 54 30" className="bg" pathLength="100" />
              <path
                d="M6 30 A24 24 0 0 1 54 30"
                className="fg"
                pathLength="100"
                style={cssVars({ '--f': pressureFill * 100 })}
              />
            </svg>
          </span>
        </div>
      </div>
    </section>
  )
}

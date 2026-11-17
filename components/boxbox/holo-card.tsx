'use client'

import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react'
import { Smartphone } from 'lucide-react'
import { driverDisplayName, type DriverTheme } from '@/lib/themes'

type Stats = { position?: string; points?: string; wins?: string }

type OrientationCtor = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<'granted' | 'denied'>
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

export function HoloCard({ theme, season, stats }: { theme: DriverTheme; season: number | string; stats: Stats }) {
  const cardRef = useRef<HTMLDivElement>(null)
  const interacting = useRef(false)
  const [gyro, setGyro] = useState(false)
  const [canGyro, setCanGyro] = useState(false)

  const apply = useCallback((nx: number, ny: number) => {
    const el = cardRef.current
    if (!el) return
    el.style.setProperty('--ry', `${((nx - 0.5) * 26).toFixed(2)}deg`)
    el.style.setProperty('--rx', `${((0.5 - ny) * 22).toFixed(2)}deg`)
    el.style.setProperty('--mx', `${(nx * 100).toFixed(1)}%`)
    el.style.setProperty('--my', `${(ny * 100).toFixed(1)}%`)
    el.style.setProperty('--hue', `${Math.round(nx * 120 + ny * 60)}deg`)
  }, [])

  useEffect(() => {
    setCanGyro(typeof window !== 'undefined' && 'DeviceOrientationEvent' in window && window.matchMedia('(pointer: coarse)').matches)
  }, [])

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      apply(0.58, 0.4)
      return
    }
    let raf = 0
    const t0 = performance.now()
    const loop = (now: number) => {
      if (!interacting.current && !gyro) {
        const t = (now - t0) / 1000
        apply(0.5 + Math.sin(t * 0.9) * 0.34, 0.42 + Math.cos(t * 0.7) * 0.22)
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [apply, gyro])

  useEffect(() => {
    if (!gyro) return
    const onTilt = (e: DeviceOrientationEvent) => {
      if (interacting.current) return
      const g = clamp(e.gamma ?? 0, -30, 30)
      const b = clamp((e.beta ?? 45) - 45, -25, 25)
      apply(0.5 + g / 60, 0.5 + b / 50)
    }
    window.addEventListener('deviceorientation', onTilt)
    return () => window.removeEventListener('deviceorientation', onTilt)
  }, [gyro, apply])

  const move = (e: PointerEvent<HTMLDivElement>) => {
    const el = cardRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    interacting.current = true
    apply(clamp((e.clientX - r.left) / r.width, 0, 1), clamp((e.clientY - r.top) / r.height, 0, 1))
  }

  const release = () => {
    interacting.current = false
  }

  const enableGyro = async () => {
    const Ctor = window.DeviceOrientationEvent as OrientationCtor
    try {
      if (typeof Ctor.requestPermission === 'function') {
        const res = await Ctor.requestPermission()
        if (res !== 'granted') return
      }
      setGyro(true)
    } catch {}
  }

  const name = driverDisplayName(theme)
  const pos = stats.position ? `P${stats.position}` : '—'

  return (
    <div className="holo">
      <div
        className="holo-stage"
        onPointerMove={move}
        onPointerDown={move}
        onPointerUp={release}
        onPointerCancel={release}
        onPointerLeave={release}
      >
        <div ref={cardRef} className="holo-card" style={{ '--hue': '0deg' } as CSSProperties}>
          <img src={theme.assets.portrait} alt={`${name}, коллекционная карточка`} className="holo-img" draggable={false} />
          <div className="holo-foil" aria-hidden="true" />
          <div className="holo-glare" aria-hidden="true" />
          <span className="holo-num disp" aria-hidden="true">
            {theme.number}
          </span>
          <span className="holo-tag eyebrow">
            {theme.code} · {season}
          </span>
          <div className="holo-foot">
            <h3 className="disp">{theme.familyName}</h3>
            <p className="eyebrow">{theme.teamShort}</p>
            <dl>
              <div>
                <dt>Место</dt>
                <dd className="num">{pos}</dd>
              </div>
              <div>
                <dt>Очки</dt>
                <dd className="num">{stats.points ?? '—'}</dd>
              </div>
              <div>
                <dt>Победы</dt>
                <dd className="num">{stats.wins ?? '—'}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
      {canGyro && !gyro && (
        <button type="button" className="holo-gyro" onClick={enableGyro}>
          <Smartphone size={16} aria-hidden="true" />
          Наклоняй телефон
        </button>
      )}
    </div>
  )
}

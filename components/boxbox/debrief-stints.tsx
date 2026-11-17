'use client'

import { useEffect, useMemo, useState } from 'react'
import type { DriverStints, StintsPayload } from '@/app/api/stints/route'
import { PilotAvatar } from './pilot-avatar'

function compoundClass(compound: string) {
  const c = compound.toUpperCase()
  if (c === 'SOFT') return 'soft'
  if (c === 'MEDIUM') return 'medium'
  if (c === 'HARD') return 'hard'
  if (c === 'INTERMEDIATE') return 'inter'
  if (c === 'WET') return 'wet'
  return 'unknown'
}

function compoundShort(compound: string) {
  const c = compound.toUpperCase()
  if (c === 'SOFT') return 'S'
  if (c === 'MEDIUM') return 'M'
  if (c === 'HARD') return 'H'
  if (c === 'INTERMEDIATE') return 'I'
  if (c === 'WET') return 'W'
  return '?'
}

function StintRow({ driver, maxLap }: { driver: DriverStints; maxLap: number }) {
  return (
    <li>
      <span className="debrief-mark">
        <PilotAvatar code={driver.code} />
        <span className="code">{driver.code}</span>
      </span>
      <div className="stint-track" aria-label={`Стратегия ${driver.code}`}>
        {driver.stints.map((s) => {
          const width = maxLap > 0 ? (s.laps / maxLap) * 100 : 0
          return (
            <span
              key={s.stintNumber}
              className={`stint-seg ${compoundClass(s.compound)}`}
              style={{ width: `${Math.max(width, 8)}%` }}
              title={`${s.compound} · L${s.lapStart}–${s.lapEnd}`}
            >
              <b>{compoundShort(s.compound)}</b>
              <small>
                {s.lapStart}–{s.lapEnd}
              </small>
            </span>
          )
        })}
      </div>
    </li>
  )
}

export function DebriefStints({
  circuitId,
  year,
  codes,
}: {
  circuitId?: string
  year: string
  codes: string[]
}) {
  const [data, setData] = useState<StintsPayload | null>(null)
  const [error, setError] = useState(false)

  const codesKey = codes.join(',')

  useEffect(() => {
    if (!circuitId || !year || !codes.length) {
      setData(null)
      return
    }
    let cancelled = false
    setData(null)
    setError(false)
    const qs = new URLSearchParams({
      circuit: circuitId,
      year,
      codes: codesKey,
    })
    fetch(`/api/stints?${qs}`)
      .then(async (res) => {
        if (!res.ok) throw new Error('no stints')
        return res.json() as Promise<StintsPayload>
      })
      .then((payload) => {
        if (!cancelled) setData(payload)
      })
      .catch(() => {
        if (!cancelled) {
          setData(null)
          setError(true)
        }
      })
    return () => {
      cancelled = true
    }
  }, [circuitId, year, codesKey, codes.length])

  const maxLap = useMemo(() => {
    if (!data) return 0
    return Math.max(0, ...data.drivers.flatMap((d) => d.stints.map((s) => s.lapEnd)))
  }, [data])

  if (!circuitId) return null
  if (error) {
    return (
      <>
        <div className="sec-title">
          <h2 className="disp">Tyres</h2>
          <span className="eyebrow">Stints</span>
        </div>
        <p className="sub">Нет данных о шинах для этого этапа.</p>
      </>
    )
  }
  if (!data) return null

  return (
    <>
      <div className="sec-title">
        <h2 className="disp">Tyres</h2>
        <span className="eyebrow">
          {data.drivers.length} · {data.sessionName}
        </span>
      </div>
      <ul className="debrief-stints">
        {data.drivers.map((d) => (
          <StintRow key={d.code} driver={d} maxLap={maxLap} />
        ))}
      </ul>
    </>
  )
}

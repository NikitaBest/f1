'use client'

import { useEffect, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { pad, shortName } from '@/lib/f1'
import {
  fetchDriverSeason,
  type DriverQualiResult,
  type DriverRaceResult,
  type DriverSeason,
} from '@/lib/jolpica'
import type { F1LiveState } from '@/lib/use-f1-live'
import { CROPS, Crop } from './art'
import { isFavDriver } from './duo-card'

function isDnf(row: DriverRaceResult) {
  const t = row.positionText.toUpperCase()
  return t === 'R' || t === 'DNF' || t === 'W' || t === 'E' || /retir|disqual|dns|dsq/i.test(row.status)
}

function formLabel(row: DriverRaceResult) {
  if (isDnf(row)) return 'R'
  return row.position
}

function formClass(row: DriverRaceResult) {
  if (isDnf(row)) return 'dnf'
  const p = Number(row.position)
  if (p === 1) return 'win'
  if (p === 2 || p === 3) return 'podium'
  return ''
}

function finishLabel(row: DriverRaceResult) {
  if (isDnf(row)) return 'DNF'
  return `P${row.position}`
}

function qualiStats(qualifying: DriverQualiResult[]) {
  const positions = qualifying.map((q) => Number(q.position)).filter((n) => Number.isFinite(n) && n > 0)
  const poles = positions.filter((n) => n === 1).length
  const avg = positions.length ? positions.reduce((a, b) => a + b, 0) / positions.length : 0
  return {
    poles,
    avgGrid: positions.length ? `P${avg.toFixed(1)}` : '—',
  }
}

export function DriverScreen({ live, onBack }: { live: F1LiveState; onBack: () => void }) {
  const standing = live.drivers.find((r) => isFavDriver(r.Driver.code, r.Driver.familyName))
  const dash = live.loading ? '…' : '—'
  const [data, setData] = useState<DriverSeason | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const season = await fetchDriverSeason('current')
        if (!cancelled) setData(season)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Не удалось загрузить сезон пилота')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const chronological = data?.results ?? []
  const results = [...chronological].reverse()
  const quali = qualiStats(data?.qualifying ?? [])
  const season = data?.season ?? live.season

  return (
    <div className="scroll drv">
      <div className="topbar">
        <button type="button" className="back" onClick={onBack}>
          <ArrowLeft size={18} aria-hidden="true" />
          Garage
        </button>
        <span className="eyebrow">Driver · {season}</span>
      </div>

      <header className="drv-hero">
        <Crop spec={CROPS.maxRed} label="Макс Ферстаппен" />
        <span className="flag-nl" aria-hidden="true" />
        <span className="no disp" aria-hidden="true">
          3
        </span>
        <div className="cap">
          <span className="eyebrow">VER · Dutch</span>
          <b className="disp">
            Max
            <br />
            Verstappen
          </b>
        </div>
      </header>

      <div className="duo-bar drv-bar">
        <div className="stat">
          <b className="num">{standing ? `P${standing.position}` : dash}</b>
          <span>Standings</span>
        </div>
        <div className="stat">
          <b className="num">{standing?.points ?? dash}</b>
          <span>Points</span>
        </div>
        <div className="stat">
          <b className="num">{standing?.wins ?? dash}</b>
          <span>Wins</span>
        </div>
      </div>

      {error && <p className="err-note">{error}</p>}
      {loading && !results.length && <p className="sub">Загружаем сезон…</p>}

      {results.length > 0 && (
        <>
          <div className="sec-title">
            <h2 className="disp">Form</h2>
            <span className="eyebrow">{results.length} rounds</span>
          </div>
          <div className="drv-form" aria-label="Форма сезона">
            {chronological.map((row) => (
              <span key={row.round} className={`drv-chip ${formClass(row)}`} title={`${shortName(row.raceName)} · ${finishLabel(row)}`}>
                {formLabel(row)}
              </span>
            ))}
          </div>

          <div className="sec-title">
            <h2 className="disp">Results</h2>
            <span className="eyebrow">Grid → finish</span>
          </div>
          <ol className="drv-list">
            {results.map((row) => {
              const win = Number(row.position) === 1 && !isDnf(row)
              const dnf = isDnf(row)
              return (
                <li key={row.round} className={`drv-row${win ? ' win' : ''}${dnf ? ' dnf' : ''}`}>
                  <b className="pos num">{finishLabel(row)}</b>
                  <span className="meta">
                    <span className="nm">{shortName(row.raceName)}</span>
                    <span className="subline">
                      from P{row.grid || '—'}
                      {row.points !== '0' ? ` · +${row.points}` : ' · 0 pts'}
                    </span>
                  </span>
                  <span className="tail">
                    {win ? <span className="tag fill">Win</span> : dnf ? <span className="tag">Ret</span> : (row.time ?? row.status)}
                  </span>
                </li>
              )
            })}
          </ol>

          <div className="drv-quali">
            <div>
              <span className="eyebrow">Qualifying</span>
              <b className="disp num">{quali.poles}</b>
              <span className="lbl">poles</span>
            </div>
            <div className="right">
              <span className="eyebrow">Avg grid</span>
              <b className="disp num">{quali.avgGrid}</b>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

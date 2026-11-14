'use client'

import { useEffect, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { shortName } from '@/lib/f1'
import { fetchTeamSeason, type TeamRaceResult, type TeamSeason } from '@/lib/jolpica'
import type { F1LiveState } from '@/lib/use-f1-live'
import { isFavTeam } from './duo-card'
import { WeekendDebriefScreen } from './weekend-debrief'

function formClass(row: TeamRaceResult) {
  if (row.hasWin) return 'win'
  if (row.hasPodium) return 'podium'
  if (row.allOut || row.teamPoints === 0) return 'dnf'
  return ''
}

function formLabel(row: TeamRaceResult) {
  if (row.allOut) return 'R'
  return String(row.teamPoints)
}

function driverLine(row: TeamRaceResult) {
  return row.drivers
    .map((d) => {
      const out = /^(R|W|E)$/i.test(d.positionText) || /retir|disqual|dns|dsq/i.test(d.status)
      return `${d.code} ${out ? 'DNF' : `P${d.position}`}`
    })
    .join(' · ')
}

function qualiStats(rounds: TeamSeason['qualifying']) {
  const bests = rounds.map((q) => Number(q.bestPosition)).filter((n) => Number.isFinite(n) && n > 0)
  const poles = rounds.reduce((sum, q) => sum + q.poles, 0)
  const avg = bests.length ? bests.reduce((a, b) => a + b, 0) / bests.length : 0
  return {
    poles,
    avgGrid: bests.length ? `P${avg.toFixed(1)}` : '—',
  }
}

export function TeamScreen({ live, onBack }: { live: F1LiveState; onBack: () => void }) {
  const standing = live.constructors.find((r) => isFavTeam(r.Constructor.name))
  const dash = live.loading ? '…' : '—'
  const [data, setData] = useState<TeamSeason | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [openRound, setOpenRound] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const season = await fetchTeamSeason('current')
        if (!cancelled) setData(season)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Не удалось загрузить сезон команды')
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
  const sprints = [...(data?.sprints ?? [])].reverse()
  const sprintRounds = new Set((data?.sprints ?? []).map((s) => s.round))
  const quali = qualiStats(data?.qualifying ?? [])
  const season = data?.season ?? live.season
  const lineUp = data?.lineUp ?? []

  if (openRound && data) {
    return (
      <WeekendDebriefScreen season={data.season} round={openRound} mode="team" onBack={() => setOpenRound(null)} />
    )
  }

  return (
    <div className="scroll team">
      <div className="topbar">
        <button type="button" className="back" onClick={onBack}>
          <ArrowLeft size={18} aria-hidden="true" />
          Garage
        </button>
        <span className="eyebrow">Team · {season}</span>
      </div>

      <header className="team-hero">
        <img className="team-hero-bg" src="/img/rb-logo.jpeg" alt="" aria-hidden="true" />
        <div className="team-hero-veil" aria-hidden="true" />
        <div className="cap">
          <span className="eyebrow">Oracle · Austrian</span>
          <b className="disp">
            Red Bull
            <br />
            Racing
          </b>
        </div>
      </header>

      <div className="duo-bar drv-bar">
        <div className="stat">
          <b className="num">{standing ? `P${standing.position}` : dash}</b>
          <span>Cup</span>
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

      {lineUp.length > 0 && (
        <>
          <div className="sec-title">
            <h2 className="disp">Line-up</h2>
            <span className="eyebrow">Season</span>
          </div>
          <div className="team-lineup">
            {lineUp.map((d) => (
              <div key={d.code} className="team-pilot">
                <span className="code">{d.code}</span>
                <b className="nm">{d.familyName}</b>
                <span className="pts">
                  <b className="num">{d.points}</b>
                  <span>
                    {d.wins} wins · {d.podiums} podiums
                  </span>
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {results.length > 0 && (
        <>
          <div className="sec-title">
            <h2 className="disp">Form</h2>
            <span className="eyebrow">{results.length} rounds · pts</span>
          </div>
          <div className="drv-form team-form" aria-label="Форма команды">
            {chronological.map((row) => (
              <span
                key={row.round}
                className={`drv-chip wide ${formClass(row)}`}
                title={`${shortName(row.raceName)} · +${row.teamPoints}`}
              >
                {formLabel(row)}
              </span>
            ))}
          </div>

          {sprints.length > 0 && (
            <>
              <div className="sec-title">
                <h2 className="disp">Sprints</h2>
                <span className="eyebrow">{sprints.length} weekends</span>
              </div>
              <ol className="drv-list">
                {sprints.map((row) => (
                  <li key={`spr-${row.round}`}>
                    <button
                      type="button"
                      className={`drv-row-btn${row.hasWin ? ' win' : ''}${row.allOut ? ' dnf' : ''}`}
                      onClick={() => setOpenRound(row.round)}
                    >
                      <b className="pos num">{row.hasWin ? 'P1' : row.allOut ? 'DNF' : `+${row.teamPoints}`}</b>
                      <span className="meta">
                        <span className="nm">
                          {shortName(row.raceName)} <span className="tag">SPR</span>
                        </span>
                        <span className="subline">{driverLine(row)}</span>
                      </span>
                      <span className="tail">+{row.teamPoints}</span>
                    </button>
                  </li>
                ))}
              </ol>
            </>
          )}

          <div className="sec-title">
            <h2 className="disp">Results</h2>
            <span className="eyebrow">Tap for debrief</span>
          </div>
          <ol className="drv-list">
            {results.map((row) => (
              <li key={row.round}>
                <button
                  type="button"
                  className={`drv-row-btn${row.hasWin ? ' win' : ''}${row.allOut ? ' dnf' : ''}`}
                  onClick={() => setOpenRound(row.round)}
                >
                  <b className="pos num">{row.hasWin ? 'P1' : row.allOut ? 'DNF' : `+${row.teamPoints}`}</b>
                  <span className="meta">
                    <span className="nm">
                      {shortName(row.raceName)}
                      {sprintRounds.has(row.round) ? <span className="tag">SPR</span> : null}
                    </span>
                    <span className="subline">
                      {row.circuit.locality} · {driverLine(row)}
                    </span>
                  </span>
                  <span className="tail">
                    {row.hasWin ? (
                      <span className="tag fill">Win</span>
                    ) : row.allOut ? (
                      <span className="tag">Ret</span>
                    ) : (
                      `+${row.teamPoints}`
                    )}
                  </span>
                </button>
              </li>
            ))}
          </ol>

          <div className="drv-quali">
            <div>
              <span className="eyebrow">Qualifying</span>
              <b className="disp num">{quali.poles}</b>
              <span className="lbl">poles</span>
            </div>
            <div className="right">
              <span className="eyebrow">Best avg grid</span>
              <b className="disp num">{quali.avgGrid}</b>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

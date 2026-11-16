'use client'

import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { pad } from '@/lib/f1'
import type { F1LiveState } from '@/lib/use-f1-live'
import { useTheme } from '@/lib/store'
import { isFavDriver, isFavTeam } from '@/lib/themes'
import { Hero } from './art'
import { DuelPanel } from './duel-panel'
import { PilotAvatar } from './pilot-avatar'
import { TeamAvatar } from './team-avatar'

type Board = 'drivers' | 'constructors' | 'results' | 'duel'

const codeOf = (d: { code?: string; familyName: string }) => d.code ?? d.familyName.slice(0, 3).toUpperCase()

export function SeasonScreen({ live }: { live: F1LiveState }) {
  const theme = useTheme()
  const [board, setBoard] = useState<Board>('drivers')
  const busy = live.loading || live.syncing

  return (
    <div className="scroll">
      <Hero image="/img/podium.jpg" pos="35%" eyebrow={`Сезон ${live.season}`} title="Чемпионат" sub="Официальные данные F1" />

      <div className="topbar" style={{ marginBottom: 14 }}>
        <div className="seg" role="group" aria-label="Раздел сезона" style={{ flex: 1 }}>
          {(
            [
              ['drivers', 'Пилоты'],
              ['constructors', 'Команды'],
              ['results', 'Финиш'],
              ['duel', 'Дуэль'],
            ] as const
          ).map(([k, l]) => (
            <button key={k} type="button" aria-pressed={board === k} onClick={() => setBoard(k)}>
              {l}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="btn sm ghost"
          style={{ marginLeft: 8 }}
          disabled={busy}
          onClick={() => void live.refreshLive()}
          aria-label="Обновить данные"
        >
          <RefreshCw size={16} className={busy ? 'animate-spin' : undefined} aria-hidden="true" />
        </button>
      </div>

      {live.error && <p className="err-note">{live.error}</p>}

      {busy && !live.drivers.length && !live.lastRace && board !== 'duel' ? (
        <p className="sub">Загружаем чемпионат…</p>
      ) : board === 'duel' ? (
        <DuelPanel live={live} />
      ) : board === 'drivers' ? (
        <ol>
          {live.drivers.map((row) => {
            const fav = isFavDriver(theme, row.Driver.code, row.Driver.familyName)
            return (
              <li key={row.Driver.familyName + row.position} className={`srow ${fav ? 'fav' : ''} ${row.position === '1' ? 'lead' : ''}`}>
                <span className="p num">{pad(Number(row.position))}</span>
                <span className="who">
                  <PilotAvatar
                    givenName={row.Driver.givenName}
                    familyName={row.Driver.familyName}
                    code={row.Driver.code}
                  />
                  <span style={{ minWidth: 0 }}>
                    <span className="nm">
                      <span className="code">{codeOf(row.Driver)}</span>
                      {row.Driver.familyName}
                    </span>
                    <span className="tm">{row.Constructors[0]?.name}</span>
                  </span>
                </span>
                <span className="pts">
                  <b className="num">{row.points}</b>
                  <span>{row.wins} поб.</span>
                </span>
              </li>
            )
          })}
        </ol>
      ) : board === 'constructors' ? (
        <ol>
          {live.constructors.map((row) => (
            <li
              key={row.Constructor.name}
              className={`srow ${isFavTeam(theme, row.Constructor.name) ? 'fav' : ''} ${row.position === '1' ? 'lead' : ''}`}
            >
              <span className="p num">{pad(Number(row.position))}</span>
              <span className="who">
                <TeamAvatar name={row.Constructor.name} />
                <span style={{ minWidth: 0 }}>
                  <span className="nm">{row.Constructor.name}</span>
                  <span className="tm">{row.Constructor.nationality}</span>
                </span>
              </span>
              <span className="pts">
                <b className="num">{row.points}</b>
                <span>{row.wins} поб.</span>
              </span>
            </li>
          ))}
        </ol>
      ) : live.lastRace ? (
        <>
          <div className="lastrace">
            <span className="eyebrow" style={{ color: 'var(--sun)' }}>
              Раунд {pad(Number(live.lastRace.round))} · {live.lastRace.date}
            </span>
            <h2 className="disp">{live.lastRace.raceName}</h2>
            <span style={{ fontSize: 14, opacity: 0.8 }}>
              {live.lastRace.circuit} · {live.lastRace.place}
            </span>
          </div>
          <ol>
            {live.lastRace.results.map((row) => {
              const fav = isFavDriver(theme, row.Driver.code, row.Driver.familyName)
              return (
                <li key={row.position + row.Driver.familyName} className={`srow ${fav ? 'fav' : ''} ${row.position === '1' ? 'lead' : ''}`}>
                  <span className="p num">{pad(Number(row.position))}</span>
                  <span className="who">
                    <PilotAvatar
                      givenName={row.Driver.givenName}
                      familyName={row.Driver.familyName}
                      code={row.Driver.code}
                    />
                    <span style={{ minWidth: 0 }}>
                      <span className="nm">
                        <span className="code">{codeOf(row.Driver)}</span>
                        {row.Driver.familyName}
                      </span>
                      <span className="tm">{row.Constructor.name}</span>
                    </span>
                  </span>
                  <span className="pts">
                    <b className="num time">{row.Time?.time ?? row.status ?? '—'}</b>
                    <span>{row.points} очк.</span>
                  </span>
                </li>
              )
            })}
          </ol>
        </>
      ) : (
        <p className="sub">Результатов пока нет</p>
      )}
    </div>
  )
}

'use client'

import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { pad } from '@/lib/f1'
import type { F1LiveState } from '@/lib/use-f1-live'
import { CROPS, Crop, Hero } from './art'
import { isFavDriver, isFavTeam } from './duo-card'

type Board = 'drivers' | 'constructors' | 'results'

const codeOf = (d: { code?: string; familyName: string }) => d.code ?? d.familyName.slice(0, 3).toUpperCase()

function Avatar({ fav }: { fav: boolean }) {
  if (!fav) return null
  return (
    <span className="av">
      <Crop spec={CROPS.face} />
    </span>
  )
}

export function SeasonScreen({ live }: { live: F1LiveState }) {
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

      {busy && !live.drivers.length && !live.lastRace ? (
        <p className="sub">Загружаем чемпионат…</p>
      ) : board === 'drivers' ? (
        <ol>
          {live.drivers.map((row) => {
            const fav = isFavDriver(row.Driver.code, row.Driver.familyName)
            return (
              <li key={row.Driver.familyName + row.position} className={`srow ${fav ? 'fav' : ''} ${row.position === '1' ? 'lead' : ''}`}>
                <span className="p num">{pad(Number(row.position))}</span>
                <span className="who">
                  <Avatar fav={fav} />
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
              className={`srow ${isFavTeam(row.Constructor.name) ? 'fav' : ''} ${row.position === '1' ? 'lead' : ''}`}
            >
              <span className="p num">{pad(Number(row.position))}</span>
              <span style={{ minWidth: 0 }}>
                <span className="nm">{row.Constructor.name}</span>
                <span className="tm">{row.Constructor.nationality}</span>
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
              const fav = isFavDriver(row.Driver.code, row.Driver.familyName)
              return (
                <li key={row.position + row.Driver.familyName} className={`srow ${fav ? 'fav' : ''} ${row.position === '1' ? 'lead' : ''}`}>
                  <span className="p num">{pad(Number(row.position))}</span>
                  <span className="who">
                    <Avatar fav={fav} />
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

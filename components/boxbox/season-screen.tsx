'use client'

import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { pad } from '@/lib/f1'
import type { F1LiveState } from '@/lib/use-f1-live'
import { Brand } from './poster'

type Board = 'drivers' | 'constructors' | 'results'

export function SeasonScreen({ live }: { live: F1LiveState }) {
  const [board, setBoard] = useState<Board>('drivers')
  const busy = live.loading || live.syncing

  return (
    <div className="bb-screen">
      <Brand sub={`Сезон ${live.season}`} />
      <div className="micro yel">Официальные данные Jolpica · F1</div>
      <div className="mb-4 mt-1.5 flex items-end justify-between gap-3">
        <h1 className="h1">Сезон</h1>
        <button
          type="button"
          className="micro flex items-center gap-1.5 opacity-80"
          disabled={busy}
          onClick={() => void live.refreshLive()}
          aria-label="Обновить данные"
        >
          <RefreshCw size={14} className={busy ? 'animate-spin' : undefined} aria-hidden="true" />
          Обновить
        </button>
      </div>

      {live.error && <p className="empty text-left text-bull">{live.error}</p>}

      <div className="chips" role="group" aria-label="Раздел сезона">
        {(
          [
            ['drivers', 'Пилоты'],
            ['constructors', 'Кубки'],
            ['results', 'Финиш'],
          ] as const
        ).map(([k, l]) => (
          <button key={k} type="button" className="chip" aria-pressed={board === k} onClick={() => setBoard(k)}>
            {l}
          </button>
        ))}
      </div>

      {busy && !live.drivers.length && !live.lastRace ? (
        <p className="empty">Загружаем чемпионат…</p>
      ) : board === 'drivers' ? (
        <ol className="standings">
          {live.drivers.map((row) => (
            <li key={row.Driver.familyName + row.position} className="stand-row">
              <span className="stand-pos">{pad(Number(row.position))}</span>
              <div className="min-w-0 flex-1">
                <b className="display block truncate text-[22px] font-extrabold leading-none">
                  {row.Driver.code ?? row.Driver.familyName.slice(0, 3).toUpperCase()}
                </b>
                <span className="mute mt-1 block truncate text-xs">
                  {row.Driver.givenName} {row.Driver.familyName} · {row.Constructors[0]?.name}
                </span>
              </div>
              <div className="shrink-0 text-right">
                <b className="display block text-[28px] font-black leading-none tabular-nums">{row.points}</b>
                <small className="micro mute text-[8px]">{row.wins} побед</small>
              </div>
            </li>
          ))}
        </ol>
      ) : board === 'constructors' ? (
        <ol className="standings">
          {live.constructors.map((row) => (
            <li key={row.Constructor.name} className="stand-row">
              <span className="stand-pos">{pad(Number(row.position))}</span>
              <div className="min-w-0 flex-1">
                <b className="display block truncate text-[22px] font-extrabold leading-none">{row.Constructor.name}</b>
                <span className="mute mt-1 block truncate text-xs">{row.Constructor.nationality}</span>
              </div>
              <div className="shrink-0 text-right">
                <b className="display block text-[28px] font-black leading-none tabular-nums">{row.points}</b>
                <small className="micro mute text-[8px]">{row.wins} побед</small>
              </div>
            </li>
          ))}
        </ol>
      ) : live.lastRace ? (
        <div>
          <div className="micro mute mb-1">
            Раунд {pad(Number(live.lastRace.round))} · {live.lastRace.date}
          </div>
          <h2 className="display mb-1 text-[28px] font-black leading-none">{live.lastRace.raceName}</h2>
          <p className="mute mb-4 text-xs">
            {live.lastRace.circuit} · {live.lastRace.place}
          </p>
          <ol className="standings">
            {live.lastRace.results.map((row) => (
              <li key={row.position + row.Driver.familyName} className="stand-row">
                <span className="stand-pos">{pad(Number(row.position))}</span>
                <div className="min-w-0 flex-1">
                  <b className="display block truncate text-[22px] font-extrabold leading-none">
                    {row.Driver.code ?? row.Driver.familyName.slice(0, 3).toUpperCase()}
                  </b>
                  <span className="mute mt-1 block truncate text-xs">
                    {row.Driver.givenName} {row.Driver.familyName} · {row.Constructor.name}
                  </span>
                </div>
                <div className="shrink-0 text-right">
                  <b className="display block text-[22px] font-black leading-none tabular-nums">
                    {row.Time?.time ?? row.status ?? '—'}
                  </b>
                  <small className="micro mute text-[8px]">{row.points} очк.</small>
                </div>
              </li>
            ))}
          </ol>
        </div>
      ) : (
        <p className="empty">Результатов пока нет</p>
      )}
    </div>
  )
}

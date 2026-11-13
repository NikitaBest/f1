'use client'

import { actions } from '@/lib/store'
import { type RaceEvent } from '@/lib/f1'
import type { F1LiveState } from '@/lib/use-f1-live'
import { useInstallPrompt } from '@/components/pwa-register'
import { GiantWord, PosterCard, Signature, Brand } from './poster'

export function PaddockScreen({
  events,
  live,
  onCreate,
}: {
  events: RaceEvent[]
  live: F1LiveState
  onCreate: () => void
}) {
  const { canInstall, installed, install } = useInstallPrompt()
  const sprints = events.filter((e) => e.format === 'sprint').length
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
  const leader = live.drivers[0]

  return (
    <div className="bb-screen">
      <Brand sub="Паддок" />
      <PosterCard left="World champion · 2021 2022 2023 2024" right="One goal · One vision">
        <div className="micro mb-2.5 text-center">Oracle Red Bull Racing</div>
        <div className="words">
          <GiantWord text="Max" max={220} />
          <GiantWord text="Verstappen" max={120} />
          <Signature />
        </div>
        <div className="photo" role="img" aria-label="Макс Ферстаппен в шлеме на красном фоне" />
        <div className="mt-3 flex items-center justify-between">
          <span className="micro w-[70px] leading-normal">
            Red Bull
            <br />
            Racing
          </span>
          <span className="display text-[42px] font-black leading-[0.9] tracking-wide">33</span>
          <span className="micro w-[70px] text-right leading-normal">
            Max
            <br />
            Verstappen
          </span>
        </div>
      </PosterCard>

      <div className="stats">
        {[
          [events.length, 'Этапов'],
          [sprints, 'Спринтов'],
          [live.season, 'Сезон'],
        ].map(([v, l]) => (
          <div key={l}>
            <b className="display block text-[40px] font-black leading-[0.9]">{v}</b>
            <small className="micro mute mt-1 block text-[8px]">{l}</small>
          </div>
        ))}
      </div>

      {leader && (
        <div className="setting">
          Лидер чемпионата
          <span>
            {leader.Driver.code ?? leader.Driver.familyName} · {leader.points}
          </span>
        </div>
      )}

      <button type="button" className="setting" disabled={live.syncing} onClick={() => void live.syncCalendar()}>
        Календарь F1
        <span>{live.syncing ? 'Обновляем…' : 'Синхронизировать'}</span>
      </button>
      <button type="button" className="setting" disabled={live.loading} onClick={() => void live.refreshLive()}>
        Чемпионат и финиш
        <span>{live.loading ? 'Загрузка…' : 'Обновить'}</span>
      </button>
      <button type="button" className="setting" onClick={onCreate}>
        Свой этап<span>Добавить</span>
      </button>

      {canInstall && (
        <button type="button" className="setting" onClick={() => void install()}>
          Установить на устройство<span>PWA</span>
        </button>
      )}
      {installed && (
        <div className="setting">
          Приложение<span>Установлено</span>
        </div>
      )}
      <div className="setting">
        Часовой пояс<span>{tz}</span>
      </div>
      <button
        type="button"
        className="setting"
        onClick={() => confirm('Вернуть локальный демо-календарь?') && actions.resetDemo()}
      >
        Демо-календарь<span>Сбросить</span>
      </button>
      {live.error && <p className="mute mt-3 text-xs text-bull">{live.error}</p>}
    </div>
  )
}

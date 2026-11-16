'use client'

import { type RaceEvent } from '@/lib/f1'
import { useTheme } from '@/lib/store'
import { driverDisplayName } from '@/lib/themes'
import type { F1LiveState } from '@/lib/use-f1-live'
import { useInstallPrompt } from '@/components/pwa-register'
import { Hero } from './art'
import { PilotAvatar } from './pilot-avatar'

function Action({
  title,
  hint,
  go,
  onClick,
  disabled,
}: {
  title: string
  hint: string
  go: string
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button type="button" className="act" onClick={onClick} disabled={disabled}>
      <span>
        <b>{title}</b>
        <small>{hint}</small>
      </span>
      <span className="go">{go}</span>
    </button>
  )
}

export function PaddockScreen({
  events,
  live,
  onPickDriver,
}: {
  events: RaceEvent[]
  live: F1LiveState
  onPickDriver: () => void
}) {
  const theme = useTheme()
  const { canInstall, installed, install } = useInstallPrompt()
  const sprints = events.filter((e) => e.format === 'sprint').length
  const season = events[0]?.season ?? new Date().getFullYear()
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
  const leader = live.drivers[0]

  return (
    <div className="scroll">
      <Hero image="/img/pitstop.jpg" pos="45%" eyebrow="Настройки и данные" title="Паддок" sub="Календарь, синхронизация и приложение" />

      <div className="trio">
        <div>
          <b className="num">{events.length}</b>
          <span>Этапов</span>
        </div>
        <div>
          <b className="num">{sprints}</b>
          <span>Спринтов</span>
        </div>
        <div>
          <b className="num">{season}</b>
          <span>Сезон</span>
        </div>
      </div>

      <Action
        title="Любимый гонщик"
        hint={`${driverDisplayName(theme)} · ${theme.teamShort}`}
        go="Выбрать"
        onClick={onPickDriver}
      />
      <Action
        title="Календарь F1"
        hint="Подтянуть официальный календарь"
        go={live.syncing ? 'Обновляем…' : 'Синхронизировать'}
        disabled={live.syncing}
        onClick={() => void live.syncCalendar()}
      />
      <Action
        title="Чемпионат и финиш"
        hint="Таблицы пилотов и команд"
        go={live.loading ? 'Загрузка…' : 'Обновить'}
        disabled={live.loading}
        onClick={() => void live.refreshLive()}
      />
      {canInstall && <Action title="Установить на устройство" hint="Работает как приложение" go="PWA" onClick={() => void install()} />}

      <div style={{ marginTop: 18 }}>
        {leader && (
          <div className="kv">
            <span>Лидер чемпионата</span>
            <b className="paddock-leader">
              <PilotAvatar
                givenName={leader.Driver.givenName}
                familyName={leader.Driver.familyName}
                code={leader.Driver.code}
              />
              {leader.Driver.code ?? leader.Driver.familyName} · {leader.points}
            </b>
          </div>
        )}
        <div className="kv">
          <span>Часовой пояс</span>
          <b>{tz}</b>
        </div>
        <div className="kv">
          <span>Приложение</span>
          <b>{installed ? 'Установлено' : 'В браузере'}</b>
        </div>
      </div>
      {live.error && (
        <p className="err-note" style={{ marginTop: 12 }}>
          {live.error}
        </p>
      )}
    </div>
  )
}

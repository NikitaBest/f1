'use client'

import { actions } from '@/lib/store'
import { type RaceEvent } from '@/lib/f1'
import type { F1LiveState } from '@/lib/use-f1-live'
import { useInstallPrompt } from '@/components/pwa-register'
import { Hero } from './art'

function Action({
  title,
  hint,
  go,
  onClick,
  disabled,
  warn,
}: {
  title: string
  hint: string
  go: string
  onClick: () => void
  disabled?: boolean
  warn?: boolean
}) {
  return (
    <button type="button" className={`act ${warn ? 'warn' : ''}`} onClick={onClick} disabled={disabled}>
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
  onCreate,
}: {
  events: RaceEvent[]
  live: F1LiveState
  onCreate: () => void
}) {
  const { canInstall, installed, install } = useInstallPrompt()
  const sprints = events.filter((e) => e.format === 'sprint').length
  const own = events.filter((e) => e.source !== 'f1').length
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
          <b className="num">{own}</b>
          <span>Своих</span>
        </div>
      </div>

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
      <Action title="Свой этап" hint="Добавить уикенд вручную" go="Добавить" onClick={onCreate} />
      {canInstall && <Action title="Установить на устройство" hint="Работает как приложение" go="PWA" onClick={() => void install()} />}
      <Action
        title="Демо-календарь"
        hint="Вернуть локальный набор этапов"
        go="Сбросить"
        warn
        onClick={() => confirm('Вернуть локальный демо-календарь?') && actions.resetDemo()}
      />

      <div style={{ marginTop: 18 }}>
        {leader && (
          <div className="kv">
            <span>Лидер чемпионата</span>
            <b>
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
      {live.error && <p className="err-note" style={{ marginTop: 12 }}>{live.error}</p>}
    </div>
  )
}

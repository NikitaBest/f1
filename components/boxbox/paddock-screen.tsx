'use client'

import { useState } from 'react'
import { actions } from '@/lib/store'
import { REM, scheduledAlerts, type RaceEvent, type RemKey } from '@/lib/f1'
import { GiantWord, PosterCard, Signature, Brand } from './poster'

const REM_ORDER: RemKey[] = ['15m', '1h', '1d']

export function PaddockScreen({ events, defaultRem }: { events: RaceEvent[]; defaultRem: RemKey }) {
  const [permission, setPermission] = useState(() =>
    typeof Notification === 'undefined' ? 'unsupported' : Notification.permission,
  )
  const sprints = events.filter((e) => e.format === 'sprint').length
  const alerts = scheduledAlerts(events, Date.now()).length
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone

  const nextRem = REM_ORDER[(REM_ORDER.indexOf(defaultRem) + 1) % REM_ORDER.length]
  const permissionLabel =
    permission === 'granted' ? 'Включены' : permission === 'denied' ? 'Запрещены в браузере' : permission === 'unsupported' ? 'Недоступны' : 'Включить'

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
          [alerts, 'Алертов'],
        ].map(([v, l]) => (
          <div key={l}>
            <b className="display block text-[40px] font-black leading-[0.9]">{v}</b>
            <small className="micro mute mt-1 block text-[8px]">{l}</small>
          </div>
        ))}
      </div>

      <button type="button" className="setting" onClick={() => actions.setDefaultRem(nextRem)}>
        Напоминать по умолчанию<span>за {REM[defaultRem].label}</span>
      </button>
      <button
        type="button"
        className="setting"
        disabled={permission !== 'default'}
        onClick={async () => setPermission(await Notification.requestPermission())}
      >
        Push-уведомления<span>{permissionLabel}</span>
      </button>
      <div className="setting">
        Часовой пояс<span>{tz}</span>
      </div>
      <button
        type="button"
        className="setting"
        onClick={() => confirm('Заменить календарь демо-этапами?') && actions.resetDemo()}
      >
        Демо-календарь<span>Сбросить</span>
      </button>
    </div>
  )
}

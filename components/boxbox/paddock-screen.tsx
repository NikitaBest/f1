'use client'

import { actions } from '@/lib/store'
import { type RaceEvent } from '@/lib/f1'
import { useInstallPrompt } from '@/components/pwa-register'
import { GiantWord, PosterCard, Signature, Brand } from './poster'

export function PaddockScreen({ events }: { events: RaceEvent[] }) {
  const { canInstall, installed, install } = useInstallPrompt()
  const sprints = events.filter((e) => e.format === 'sprint').length
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone

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
        ].map(([v, l]) => (
          <div key={l}>
            <b className="display block text-[40px] font-black leading-[0.9]">{v}</b>
            <small className="micro mute mt-1 block text-[8px]">{l}</small>
          </div>
        ))}
      </div>

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
        onClick={() => confirm('Заменить календарь оставшимися этапами сезона 2026?') && actions.resetDemo()}
      >
        Календарь 2026<span>Сбросить</span>
      </button>
    </div>
  )
}

'use client'

import { useNow } from '@/lib/use-now'
import { REM, hhmm, scheduledAlerts, shortName, weekday, type RaceEvent } from '@/lib/f1'
import { Brand } from './poster'

export function AlertsScreen({ events }: { events: RaceEvent[] }) {
  const now = useNow(30_000)
  const list = scheduledAlerts(events, now)
  const first = list[0]

  return (
    <div className="bb-screen">
      <Brand sub="Центр уведомлений" />
      <div className="micro yel">{list.length} активно</div>
      <h1 className="h1 mt-1.5 text-[52px]">Напоминания</h1>

      {first && (
        <div className="mb-1 mt-4 flex gap-3 rounded-2xl bg-cobalt p-3 text-paper">
          <div className="display grid size-10 shrink-0 place-items-center rounded-lg bg-bull text-base font-black tracking-wide">
            BB
          </div>
          <div className="min-w-0 flex-1">
            <b className="block text-[13px] font-bold">
              {first.session.label} · {shortName(first.event.name)}
            </b>
            <p className="mt-0.5 text-xs leading-snug opacity-85">
              Старт через {REM[first.event.rem].label}. Пора занять место перед экраном.
            </p>
          </div>
          <small className="shrink-0 text-[10px] opacity-70">
            {weekday(new Date(first.at))} {hhmm(new Date(first.at))}
          </small>
        </div>
      )}

      <div className="sec">
        <span className="micro font-bold">Запланировано</span>
        <span className="micro mute">Ближайшие</span>
      </div>

      {list.length === 0 ? (
        <p className="empty">Нет активных напоминаний. Включи колокольчик у сессии.</p>
      ) : (
        <ol className="pt-4">
          {list.slice(0, 12).map((a) => {
            const at = new Date(a.at)
            return (
              <li key={`${a.event.id}-${a.session.key}`} className="flex items-stretch gap-2.5">
                <div className="display w-[54px] shrink-0 pt-0.5 text-[21px] font-extrabold leading-none">
                  <small className="micro yel mb-1 block">{weekday(at)}</small>
                  {hhmm(at)}
                </div>
                <div className="spine" aria-hidden="true" />
                <div className="display flex-1 pb-5 text-[20px] font-extrabold leading-none tracking-wide">
                  {a.session.label}
                  <small className="mute mt-1 block font-sans text-xs font-medium normal-case tracking-normal">
                    {a.event.name} · за {REM[a.event.rem].label}
                  </small>
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}

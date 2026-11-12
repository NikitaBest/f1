'use client'

import { useEffect } from 'react'
import { REM, scheduledAlerts, shortName, type RaceEvent } from './f1'

const WINDOW_MS = 24 * 3_600_000

export function useReminderNotifications(events: RaceEvent[]) {
  useEffect(() => {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return
    const now = Date.now()
    const timers = scheduledAlerts(events, now)
      .filter((a) => a.at - now < WINDOW_MS)
      .map((a) =>
        setTimeout(() => {
          new Notification(`${a.session.label} · ${shortName(a.event.name)}`, {
            body: `Старт через ${REM[a.event.rem].label}. Пора занять место перед экраном.`,
            icon: '/icon.svg',
          })
        }, a.at - now),
      )
    return () => timers.forEach(clearTimeout)
  }, [events])
}

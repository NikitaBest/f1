'use client'

import { useSyncExternalStore } from 'react'
import { buildSessions, type Format, type RaceEvent, type SessionDraft } from './f1'

export type AppState = {
  hydrated: boolean
  onboarded: boolean
  events: RaceEvent[]
}

const STORAGE_KEY = 'boxbox:v4'
const SERVER_STATE: AppState = { hydrated: false, onboarded: false, events: [] }

type SeedInput = {
  id: string
  name: string
  place: string
  format: Format
  start: string
  image: string
  times: SessionDraft
}

function make(input: SeedInput): RaceEvent {
  return {
    id: input.id,
    name: input.name,
    place: input.place,
    format: input.format,
    start: input.start,
    image: input.image,
    sessions: buildSessions(input.start, input.format, input.times),
  }
}

/** Оставшиеся уикенды сезона 2026 (время МСК), на 12.11.2026 */
function seed(): RaceEvent[] {
  return [
    make({
      id: '2026-vegas',
      name: 'Гран-при Лас-Вегаса',
      place: 'Лас-Вегас, США',
      format: 'std',
      start: '2026-11-20',
      image: '/img/Неоновый Гран-при Лас-Вегаса.png',
      times: {
        fp1: { time: '03:30' },
        fp2: { time: '07:00' },
        fp3: { time: '03:30' },
        q: { time: '07:00' },
        r: { time: '07:00' },
      },
    }),
    make({
      id: '2026-qatar',
      name: 'Гран-при Катара',
      place: 'Лусаил, Катар',
      format: 'std',
      start: '2026-11-27',
      image: '/img/Победный момент на Гран-при Катара.png',
      times: {
        fp1: { time: '16:30' },
        fp2: { time: '20:00' },
        fp3: { time: '17:30' },
        q: { time: '21:00' },
        r: { time: '19:00' },
      },
    }),
    make({
      id: '2026-abu-dhabi',
      name: 'Гран-при Абу-Даби',
      place: 'Яс-Марина, ОАЭ',
      format: 'std',
      start: '2026-12-04',
      image: '/img/Триумф на Гран-при Абу-Даби.png',
      times: {
        fp1: { time: '12:30' },
        fp2: { time: '16:00' },
        fp3: { time: '13:30' },
        q: { time: '17:00' },
        r: { time: '16:00' },
      },
    }),
  ]
}

let state: AppState | null = null
const listeners = new Set<() => void>()

function load(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Omit<AppState, 'hydrated'>
      if (Array.isArray(parsed.events)) return { ...parsed, hydrated: true }
    }
  } catch {}
  return { hydrated: true, onboarded: true, events: seed() }
}

function getSnapshot() {
  if (!state) state = load()
  return state
}

function setState(update: (s: AppState) => AppState) {
  state = update(getSnapshot())
  try {
    const { hydrated: _h, ...persist } = state
    localStorage.setItem(STORAGE_KEY, JSON.stringify(persist))
  } catch {}
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useAppState() {
  return useSyncExternalStore(subscribe, getSnapshot, () => SERVER_STATE)
}

export const actions = {
  finishOnboarding: () => setState((s) => ({ ...s, onboarded: true })),
  addEvent: (event: Omit<RaceEvent, 'id'>) =>
    setState((s) => ({ ...s, events: [...s.events, { ...event, id: crypto.randomUUID() }] })),
  removeEvent: (id: string) => setState((s) => ({ ...s, events: s.events.filter((e) => e.id !== id) })),
  resetDemo: () => setState((s) => ({ ...s, events: seed() })),
}

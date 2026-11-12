'use client'

import { useSyncExternalStore } from 'react'
import { addDays, buildSessions, draftFor, nextFriday, toISODate, type RaceEvent, type RemKey } from './f1'

export type AppState = {
  hydrated: boolean
  onboarded: boolean
  defaultRem: RemKey
  events: RaceEvent[]
}

const STORAGE_KEY = 'boxbox:v1'
const SERVER_STATE: AppState = { hydrated: false, onboarded: false, defaultRem: '1h', events: [] }

function seed(): RaceEvent[] {
  const f1 = nextFriday(new Date(), 2)
  const make = (id: string, name: string, place: string, format: 'std' | 'sprint', start: Date, rem: RemKey) => {
    const iso = toISODate(start)
    return { id, name, place, format, start: iso, rem, sessions: buildSessions(iso, format, draftFor(format)) }
  }
  const first = make('seed-1', 'Гран-при Майами', 'Майами-Гарденс, США', 'sprint', f1, '1h')
  first.sessions[3].on = false
  return [
    first,
    make('seed-2', 'Гран-при Монако', 'Монте-Карло, Монако', 'std', addDays(f1, 14), '1d'),
    make('seed-3', 'Гран-при Великобритании', 'Сильверстоун, Великобритания', 'std', addDays(f1, 42), '1h'),
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
  return { hydrated: true, onboarded: false, defaultRem: '1h', events: seed() }
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
  toggleSession: (eventId: string, key: string) =>
    setState((s) => ({
      ...s,
      events: s.events.map((e) =>
        e.id !== eventId
          ? e
          : { ...e, sessions: e.sessions.map((x) => (x.key === key ? { ...x, on: !x.on } : x)) },
      ),
    })),
  setDefaultRem: (rem: RemKey) => setState((s) => ({ ...s, defaultRem: rem })),
  resetDemo: () => setState((s) => ({ ...s, events: seed() })),
}

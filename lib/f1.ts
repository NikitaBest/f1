export type Format = 'std' | 'sprint'

export type Session = {
  key: string
  label: string
  at: string
}

export type RaceEvent = {
  id: string
  name: string
  place: string
  format: Format
  start: string
  sessions: Session[]
  image?: string
  round?: number
  season?: number
  circuitId?: string
  source?: 'f1' | 'local'
}

export type SessionTemplate = {
  key: string
  label: string
  day: 0 | 1 | 2
  time: string
  hint: string
}

export const FORMATS: Record<Format, SessionTemplate[]> = {
  std: [
    { key: 'fp1', label: 'Практика 1', day: 0, time: '13:30', hint: 'Свободная практика' },
    { key: 'fp2', label: 'Практика 2', day: 0, time: '17:00', hint: 'Свободная практика' },
    { key: 'fp3', label: 'Практика 3', day: 1, time: '12:30', hint: 'Свободная практика' },
    { key: 'q', label: 'Квалификация', day: 1, time: '16:00', hint: 'Борьба за поул' },
    { key: 'r', label: 'Гонка', day: 2, time: '15:00', hint: 'Главное событие уикенда' },
  ],
  sprint: [
    { key: 'fp1', label: 'Практика 1', day: 0, time: '12:30', hint: 'Свободная практика' },
    { key: 'sq', label: 'Спринт-квалификация', day: 0, time: '16:30', hint: 'Сетка на спринт' },
    { key: 's', label: 'Спринт', day: 1, time: '12:00', hint: 'Короткая гонка' },
    { key: 'q', label: 'Квалификация', day: 1, time: '16:00', hint: 'Борьба за поул' },
    { key: 'r', label: 'Гонка', day: 2, time: '15:00', hint: 'Главное событие уикенда' },
  ],
}

export const DAY_SHORT = ['Пт', 'Сб', 'Вс'] as const

export const pad = (n: number) => String(n).padStart(2, '0')

export const toISODate = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

export const parseISODate = (s: string) => {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export const addDays = (d: Date, n: number) => {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

export function nextFriday(from: Date, minAhead = 0) {
  let d = new Date(from)
  d.setHours(0, 0, 0, 0)
  d = addDays(d, minAhead)
  while (d.getDay() !== 5) d.setDate(d.getDate() + 1)
  return d
}

export type SessionDraft = Record<string, { time: string }>

export function draftFor(format: Format): SessionDraft {
  return Object.fromEntries(FORMATS[format].map((s) => [s.key, { time: s.time }]))
}

export function buildSessions(start: string, format: Format, draft: SessionDraft = draftFor(format)): Session[] {
  const base = parseISODate(start)
  return FORMATS[format].map((tpl) => {
    const cfg = draft[tpl.key] ?? { time: tpl.time }
    const [h, m] = cfg.time.split(':').map(Number)
    const at = addDays(base, tpl.day)
    at.setHours(h, m, 0, 0)
    return { key: tpl.key, label: tpl.label, at: at.toISOString() }
  })
}

export const hintFor = (key: string) =>
  [...FORMATS.std, ...FORMATS.sprint].find((s) => s.key === key)?.hint ?? ''

/** Short title on cards: English place / GP name, nominative. */
const SHORT_EN: Record<string, string> = {
  Австралии: 'Australia',
  Китая: 'China',
  Японии: 'Japan',
  Бахрейна: 'Bahrain',
  'Саудовской Аравии': 'Saudi Arabia',
  Майами: 'Miami',
  'Эмилии-Романьи': 'Emilia-Romagna',
  Монако: 'Monaco',
  Испании: 'Spain',
  Канады: 'Canada',
  Австрии: 'Austria',
  Великобритании: 'Great Britain',
  Бельгии: 'Belgium',
  Венгрии: 'Hungary',
  Нидерландов: 'Netherlands',
  Италии: 'Italy',
  Азербайджана: 'Azerbaijan',
  Сингапура: 'Singapore',
  США: 'United States',
  Мехико: 'Mexico City',
  'Сан-Паулу': 'São Paulo',
  Бразилии: 'Brazil',
  'Лас-Вегаса': 'Las Vegas',
  Катара: 'Qatar',
  'Абу-Даби': 'Abu Dhabi',
  Барселоны: 'Barcelona',
}

export const shortName = (n: string) => {
  const stripped = n.replace(/^Гран-при\s+/i, '').replace(/\s+Grand Prix$/i, '').trim()
  return SHORT_EN[stripped] ?? stripped
}

export const sortEvents = (events: RaceEvent[]) =>
  [...events].sort((a, b) => a.start.localeCompare(b.start))

export const eventEnd = (e: RaceEvent) => {
  const last = e.sessions.reduce((max, s) => Math.max(max, new Date(s.at).getTime()), 0)
  return last + 3 * 3_600_000
}

export const upcomingEvents = (events: RaceEvent[], now: number) =>
  sortEvents(events).filter((e) => eventEnd(e) > now)

export const daysUntil = (startISO: string, now: number) => {
  const today = new Date(now)
  today.setHours(0, 0, 0, 0)
  return Math.ceil((parseISODate(startISO).getTime() - today.getTime()) / 86_400_000)
}

const fmtDay = new Intl.DateTimeFormat('ru', { weekday: 'short' })
const fmtMonthYear = new Intl.DateTimeFormat('ru', { month: 'long', year: 'numeric' })
const fmtMon = new Intl.DateTimeFormat('ru', { month: 'short' })

export const weekday = (d: Date) => fmtDay.format(d)
export const monthYear = (d: Date) => fmtMonthYear.format(d)
export const mon = (d: Date) => fmtMon.format(d).replace('.', '')
export const hhmm = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`

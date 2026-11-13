import { buildSessions, toISODate, type Format, type RaceEvent, type SessionDraft } from './f1'

type JolpicaTime = { date: string; time?: string }

export type JolpicaRace = {
  season: string
  round: string
  raceName: string
  date: string
  time?: string
  Circuit: {
    circuitId: string
    circuitName: string
    Location: { locality: string; country: string }
  }
  FirstPractice?: JolpicaTime
  SecondPractice?: JolpicaTime
  ThirdPractice?: JolpicaTime
  Qualifying?: JolpicaTime
  Sprint?: JolpicaTime
  SprintQualifying?: JolpicaTime
}

export type DriverStanding = {
  position: string
  points: string
  wins: string
  Driver: {
    code?: string
    givenName: string
    familyName: string
    permanentNumber?: string
  }
  Constructors: { name: string }[]
}

export type ConstructorStanding = {
  position: string
  points: string
  wins: string
  Constructor: { name: string; nationality: string }
}

export type RaceResultRow = {
  position: string
  points: string
  status?: string
  Driver: { code?: string; givenName: string; familyName: string }
  Constructor: { name: string }
  Time?: { time: string }
}

export type LastRaceResults = {
  season: string
  round: string
  raceName: string
  date: string
  circuit: string
  place: string
  results: RaceResultRow[]
}

const CIRCUIT_IMAGES: Record<string, string> = {
  vegas: '/img/Неоновый Гран-при Лас-Вегаса.png',
  losail: '/img/Победный момент на Гран-при Катара.png',
  yas_marina: '/img/Триумф на Гран-при Абу-Даби.png',
}

const GP_RU: Record<string, string> = {
  'Australian Grand Prix': 'Гран-при Австралии',
  'Chinese Grand Prix': 'Гран-при Китая',
  'Japanese Grand Prix': 'Гран-при Японии',
  'Bahrain Grand Prix': 'Гран-при Бахрейна',
  'Bahrain Grand Prix in Malaysia': 'Гран-при Бахрейна',
  'Saudi Arabian Grand Prix': 'Гран-при Саудовской Аравии',
  'Miami Grand Prix': 'Гран-при Майами',
  'Emilia Romagna Grand Prix': 'Гран-при Эмилии-Романьи',
  'Monaco Grand Prix': 'Гран-при Монако',
  'Spanish Grand Prix': 'Гран-при Испании',
  'Canadian Grand Prix': 'Гран-при Канады',
  'Austrian Grand Prix': 'Гран-при Австрии',
  'British Grand Prix': 'Гран-при Великобритании',
  'Belgian Grand Prix': 'Гран-при Бельгии',
  'Hungarian Grand Prix': 'Гран-при Венгрии',
  'Dutch Grand Prix': 'Гран-при Нидерландов',
  'Italian Grand Prix': 'Гран-при Италии',
  'Azerbaijan Grand Prix': 'Гран-при Азербайджана',
  'Singapore Grand Prix': 'Гран-при Сингапура',
  'United States Grand Prix': 'Гран-при США',
  'Mexico City Grand Prix': 'Гран-при Мехико',
  'São Paulo Grand Prix': 'Гран-при Сан-Паулу',
  'Brazilian Grand Prix': 'Гран-при Бразилии',
  'Las Vegas Grand Prix': 'Гран-при Лас-Вегаса',
  'Qatar Grand Prix': 'Гран-при Катара',
  'Abu Dhabi Grand Prix': 'Гран-при Абу-Даби',
  'Barcelona Grand Prix': 'Гран-при Барселоны',
}

async function f1Get<T>(path: string): Promise<T> {
  const res = await fetch(`/api/f1/${path.replace(/^\//, '')}`, {
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) throw new Error(`F1 API ${res.status}: ${path}`)
  return res.json() as Promise<T>
}

function utcToLocalParts(date: string, time?: string) {
  const iso = time ? `${date}T${time.replace(/Z$/, '')}Z` : `${date}T12:00:00Z`
  const d = new Date(iso)
  return {
    date: toISODate(d),
    time: `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`,
    at: d.toISOString(),
    ms: d.getTime(),
  }
}

function raceNameRu(name: string) {
  return GP_RU[name] ?? `Гран-при ${name.replace(/ Grand Prix$/i, '')}`
}

function placeOf(race: JolpicaRace) {
  const { locality, country } = race.Circuit.Location
  return `${locality}, ${country}`
}

/** Пятница уикенда = день первой сессии (или date-2) */
function weekendStart(race: JolpicaRace): string {
  const first =
    race.FirstPractice ??
    race.SprintQualifying ??
    race.SecondPractice ??
    race.Qualifying ??
    ({ date: race.date } as JolpicaTime)
  return utcToLocalParts(first.date, first.time).date
}

function sessionsFromRace(race: JolpicaRace, format: Format, start: string) {
  const draft: SessionDraft = {}
  const put = (key: string, slot?: JolpicaTime) => {
    if (!slot?.date) return
    const local = utcToLocalParts(slot.date, slot.time)
    draft[key] = { time: local.time }
  }

  if (format === 'sprint') {
    put('fp1', race.FirstPractice)
    put('sq', race.SprintQualifying)
    put('s', race.Sprint)
    put('q', race.Qualifying)
    put('r', { date: race.date, time: race.time })
  } else {
    put('fp1', race.FirstPractice)
    put('fp2', race.SecondPractice)
    put('fp3', race.ThirdPractice)
    put('q', race.Qualifying)
    put('r', { date: race.date, time: race.time })
  }

  return buildSessions(start, format, draft)
}

export function mapRaceToEvent(race: JolpicaRace): RaceEvent {
  const format: Format = race.Sprint || race.SprintQualifying ? 'sprint' : 'std'
  const start = weekendStart(race)
  return {
    id: `f1-${race.season}-r${race.round}`,
    name: raceNameRu(race.raceName),
    place: placeOf(race),
    format,
    start,
    image: CIRCUIT_IMAGES[race.Circuit.circuitId],
    sessions: sessionsFromRace(race, format, start),
    round: Number(race.round),
    season: Number(race.season),
    circuitId: race.Circuit.circuitId,
    source: 'f1',
  }
}

type RacesResponse = {
  MRData: { RaceTable: { season: string; Races: JolpicaRace[] } }
}

type DriverStandingsResponse = {
  MRData: {
    StandingsTable: {
      season: string
      StandingsLists: { round: string; DriverStandings: DriverStanding[] }[]
    }
  }
}

type ConstructorStandingsResponse = {
  MRData: {
    StandingsTable: {
      season: string
      StandingsLists: { round: string; ConstructorStandings: ConstructorStanding[] }[]
    }
  }
}

type ResultsResponse = {
  MRData: {
    RaceTable: {
      season: string
      Races: (JolpicaRace & { Results: RaceResultRow[] })[]
    }
  }
}

export async function fetchSeasonCalendar(season: number | 'current' = 'current') {
  const data = await f1Get<RacesResponse>(`${season}/races.json`)
  const races = data.MRData.RaceTable.Races ?? []
  return {
    season: data.MRData.RaceTable.season,
    events: races.map(mapRaceToEvent),
    races,
  }
}

export async function fetchDriverStandings(season: number | 'current' = 'current') {
  const data = await f1Get<DriverStandingsResponse>(`${season}/driverstandings.json`)
  const list = data.MRData.StandingsTable.StandingsLists[0]
  return {
    season: data.MRData.StandingsTable.season,
    round: list?.round ?? '',
    standings: list?.DriverStandings ?? [],
  }
}

export async function fetchConstructorStandings(season: number | 'current' = 'current') {
  const data = await f1Get<ConstructorStandingsResponse>(`${season}/constructorstandings.json`)
  const list = data.MRData.StandingsTable.StandingsLists[0]
  return {
    season: data.MRData.StandingsTable.season,
    round: list?.round ?? '',
    standings: list?.ConstructorStandings ?? [],
  }
}

export async function fetchLastResults(): Promise<LastRaceResults | null> {
  const data = await f1Get<ResultsResponse>('current/last/results.json')
  const race = data.MRData.RaceTable.Races[0]
  if (!race) return null
  return {
    season: race.season,
    round: race.round,
    raceName: raceNameRu(race.raceName),
    date: race.date,
    circuit: race.Circuit.circuitName,
    place: placeOf(race),
    results: race.Results ?? [],
  }
}

export async function fetchRaceResults(season: string | number, round: string | number) {
  const data = await f1Get<ResultsResponse>(`${season}/${round}/results.json`)
  const race = data.MRData.RaceTable.Races[0]
  if (!race) return null
  return {
    season: race.season,
    round: race.round,
    raceName: raceNameRu(race.raceName),
    date: race.date,
    circuit: race.Circuit.circuitName,
    place: placeOf(race),
    results: race.Results ?? [],
  }
}

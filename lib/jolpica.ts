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
  positionText?: string
  points: string
  grid?: string
  status?: string
  Driver: { driverId?: string; code?: string; givenName: string; familyName: string }
  Constructor: { name: string }
  Time?: { time: string }
  FastestLap?: { rank?: string; lap?: string; Time?: { time: string } }
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
    name: race.raceName,
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

export type CircuitInfo = {
  circuitId: string
  circuitName: string
  locality: string
  country: string
}

function circuitOf(race: JolpicaRace): CircuitInfo {
  return {
    circuitId: race.Circuit.circuitId,
    circuitName: race.Circuit.circuitName,
    locality: race.Circuit.Location.locality,
    country: race.Circuit.Location.country,
  }
}

export type DriverRaceResult = {
  season: string
  round: string
  raceName: string
  date: string
  place: string
  circuit: CircuitInfo
  position: string
  positionText: string
  grid: string
  points: string
  status: string
  time?: string
  fastestLap?: string
  fastestLapRank?: string
  fastestLapNumber?: string
}

export type DriverQualiResult = {
  round: string
  raceName: string
  position: string
}

export type DriverSeason = {
  season: string
  driverId: string
  results: DriverRaceResult[]
  sprints: DriverRaceResult[]
  qualifying: DriverQualiResult[]
}

type DriverResultsResponse = {
  MRData: {
    RaceTable: {
      season: string
      driverId?: string
      Races: (JolpicaRace & { Results: RaceResultRow[] })[]
    }
  }
}

type DriverQualiResponse = {
  MRData: {
    RaceTable: {
      season: string
      Races: (JolpicaRace & {
        QualifyingResults: { position: string }[]
      })[]
    }
  }
}

type DriverSprintResponse = {
  MRData: {
    RaceTable: {
      season: string
      Races: (JolpicaRace & {
        SprintResults: RaceResultRow[]
      })[]
    }
  }
}

const FAV_DRIVER_ID = 'max_verstappen'

function mapDriverRow(race: JolpicaRace, row?: RaceResultRow): DriverRaceResult {
  return {
    season: race.season,
    round: race.round,
    raceName: race.raceName,
    date: race.date,
    place: placeOf(race),
    circuit: circuitOf(race),
    position: row?.position ?? '',
    positionText: row?.positionText ?? row?.position ?? '',
    grid: row?.grid ?? '',
    points: row?.points ?? '0',
    status: row?.status ?? '',
    time: row?.Time?.time,
    fastestLap: row?.FastestLap?.Time?.time,
    fastestLapRank: row?.FastestLap?.rank,
    fastestLapNumber: row?.FastestLap?.lap,
  }
}

export async function fetchDriverSeason(
  season: number | 'current' = 'current',
  driverId = FAV_DRIVER_ID,
): Promise<DriverSeason> {
  const [resultsData, qualiData, sprintData] = await Promise.all([
    f1Get<DriverResultsResponse>(`${season}/drivers/${driverId}/results.json?limit=100`),
    f1Get<DriverQualiResponse>(`${season}/drivers/${driverId}/qualifying.json?limit=100`),
    f1Get<DriverSprintResponse>(`${season}/drivers/${driverId}/sprint.json?limit=100`).catch(
      () => ({ MRData: { RaceTable: { season: String(season), Races: [] } } }) as DriverSprintResponse,
    ),
  ])

  const results: DriverRaceResult[] = (resultsData.MRData.RaceTable.Races ?? []).map((race) =>
    mapDriverRow(race, race.Results?.[0]),
  )

  const sprints: DriverRaceResult[] = (sprintData.MRData.RaceTable.Races ?? []).map((race) =>
    mapDriverRow(race, race.SprintResults?.[0]),
  )

  const qualifying: DriverQualiResult[] = (qualiData.MRData.RaceTable.Races ?? []).map((race) => ({
    round: race.round,
    raceName: race.raceName,
    position: race.QualifyingResults?.[0]?.position ?? '',
  }))

  return {
    season: resultsData.MRData.RaceTable.season,
    driverId,
    results,
    sprints,
    qualifying,
  }
}

export type TeamDriverEntry = {
  code: string
  familyName: string
  position: string
  positionText: string
  points: string
  grid: string
  status: string
}

export type TeamRaceResult = {
  season: string
  round: string
  raceName: string
  date: string
  place: string
  circuit: CircuitInfo
  teamPoints: number
  bestFinish: number | null
  hasWin: boolean
  hasPodium: boolean
  allOut: boolean
  drivers: TeamDriverEntry[]
}

export type TeamDriverSummary = {
  code: string
  familyName: string
  points: number
  wins: number
  podiums: number
}

export type TeamQualiRound = {
  round: string
  raceName: string
  bestPosition: string
  poles: number
}

export type TeamSeason = {
  season: string
  constructorId: string
  results: TeamRaceResult[]
  sprints: TeamRaceResult[]
  qualifying: TeamQualiRound[]
  lineUp: TeamDriverSummary[]
}

type TeamResultsResponse = {
  MRData: {
    RaceTable: {
      season: string
      Races: (JolpicaRace & { Results: RaceResultRow[] })[]
    }
  }
}

type TeamSprintResponse = {
  MRData: {
    RaceTable: {
      season: string
      Races: (JolpicaRace & { SprintResults: RaceResultRow[] })[]
    }
  }
}

type TeamQualiResponse = {
  MRData: {
    RaceTable: {
      season: string
      Races: (JolpicaRace & {
        QualifyingResults: {
          position: string
          Driver: { code?: string; familyName: string }
        }[]
      })[]
    }
  }
}

const FAV_CONSTRUCTOR_ID = 'red_bull'

function isOut(positionText: string, status: string) {
  const t = positionText.toUpperCase()
  return t === 'R' || t === 'DNF' || t === 'W' || t === 'E' || /retir|disqual|dns|dsq/i.test(status)
}

function codeOf(d: { code?: string; familyName: string }) {
  return d.code ?? d.familyName.slice(0, 3).toUpperCase()
}

function mapTeamRace(race: JolpicaRace, rows: RaceResultRow[]): TeamRaceResult {
  const drivers: TeamDriverEntry[] = rows.map((row) => ({
    code: codeOf(row.Driver),
    familyName: row.Driver.familyName,
    position: row.position,
    positionText: row.positionText ?? row.position,
    points: row.points,
    grid: row.grid ?? '',
    status: row.status ?? '',
  }))
  const finishes = drivers
    .filter((d) => !isOut(d.positionText, d.status))
    .map((d) => Number(d.position))
    .filter((n) => Number.isFinite(n) && n > 0)
  const bestFinish = finishes.length ? Math.min(...finishes) : null
  const teamPoints = drivers.reduce((sum, d) => sum + (Number(d.points) || 0), 0)
  return {
    season: race.season,
    round: race.round,
    raceName: race.raceName,
    date: race.date,
    place: placeOf(race),
    circuit: circuitOf(race),
    teamPoints,
    bestFinish,
    hasWin: bestFinish === 1,
    hasPodium: bestFinish !== null && bestFinish <= 3,
    allOut: drivers.length > 0 && finishes.length === 0,
    drivers,
  }
}

export async function fetchTeamSeason(
  season: number | 'current' = 'current',
  constructorId = FAV_CONSTRUCTOR_ID,
): Promise<TeamSeason> {
  const [resultsData, qualiData, sprintData] = await Promise.all([
    f1Get<TeamResultsResponse>(`${season}/constructors/${constructorId}/results.json?limit=100`),
    f1Get<TeamQualiResponse>(`${season}/constructors/${constructorId}/qualifying.json?limit=100`),
    f1Get<TeamSprintResponse>(`${season}/constructors/${constructorId}/sprint.json?limit=100`).catch(
      () => ({ MRData: { RaceTable: { season: String(season), Races: [] } } }) as TeamSprintResponse,
    ),
  ])

  const results = (resultsData.MRData.RaceTable.Races ?? []).map((race) =>
    mapTeamRace(race, race.Results ?? []),
  )
  const sprints = (sprintData.MRData.RaceTable.Races ?? []).map((race) =>
    mapTeamRace(race, race.SprintResults ?? []),
  )

  const tally = new Map<string, TeamDriverSummary>()
  for (const race of results) {
    for (const d of race.drivers) {
      const key = d.code
      const cur = tally.get(key) ?? { code: d.code, familyName: d.familyName, points: 0, wins: 0, podiums: 0 }
      cur.points += Number(d.points) || 0
      if (!isOut(d.positionText, d.status)) {
        const p = Number(d.position)
        if (p === 1) cur.wins += 1
        if (p >= 1 && p <= 3) cur.podiums += 1
      }
      tally.set(key, cur)
    }
  }
  const lineUp = [...tally.values()].sort((a, b) => b.points - a.points)

  const qualifying: TeamQualiRound[] = (qualiData.MRData.RaceTable.Races ?? []).map((race) => {
    const rows = race.QualifyingResults ?? []
    const positions = rows.map((r) => Number(r.position)).filter((n) => Number.isFinite(n) && n > 0)
    const best = positions.length ? Math.min(...positions) : 0
    return {
      round: race.round,
      raceName: race.raceName,
      bestPosition: best ? String(best) : '',
      poles: positions.filter((n) => n === 1).length,
    }
  })

  return {
    season: resultsData.MRData.RaceTable.season,
    constructorId,
    results,
    sprints,
    qualifying,
    lineUp,
  }
}

export type PitStop = {
  driverId: string
  code: string
  lap: string
  stop: string
  duration: string
  time: string
}

export type DebriefDriver = {
  driverId: string
  code: string
  familyName: string
  position: string
  positionText: string
  grid: string
  points: string
  status: string
  time?: string
  fastestLap?: string
  fastestLapRank?: string
  fastestLapNumber?: string
}

export type WeekendDebrief = {
  season: string
  round: string
  raceName: string
  date: string
  circuit: CircuitInfo
  place: string
  raceDrivers: DebriefDriver[]
  sprintDrivers: DebriefDriver[]
  pitStops: PitStop[]
  qualiBest?: string
}

type PitStopsResponse = {
  MRData: {
    RaceTable: {
      Races: (JolpicaRace & {
        PitStops: {
          driverId: string
          lap: string
          stop: string
          time: string
          duration: string
        }[]
      })[]
    }
  }
}

const DRIVER_CODES: Record<string, string> = {
  max_verstappen: 'VER',
  hadjar: 'HAD',
  lawson: 'LAW',
  perez: 'PER',
}

function mapDebriefDriver(
  row: RaceResultRow,
  driverIdFallback?: string,
): DebriefDriver {
  const driverId =
    (row.Driver as { driverId?: string }).driverId ?? driverIdFallback ?? row.Driver.familyName.toLowerCase()
  return {
    driverId,
    code: codeOf(row.Driver),
    familyName: row.Driver.familyName,
    position: row.position,
    positionText: row.positionText ?? row.position,
    grid: row.grid ?? '',
    points: row.points,
    status: row.status ?? '',
    time: row.Time?.time,
    fastestLap: row.FastestLap?.Time?.time,
    fastestLapRank: row.FastestLap?.rank,
    fastestLapNumber: row.FastestLap?.lap,
  }
}

export async function fetchWeekendDebrief(opts: {
  season: string
  round: string
  mode: 'driver' | 'team'
  driverId?: string
  constructorId?: string
}): Promise<WeekendDebrief> {
  const { season, round } = opts
  const driverId = opts.driverId ?? FAV_DRIVER_ID
  const constructorId = opts.constructorId ?? FAV_CONSTRUCTOR_ID

  if (opts.mode === 'driver') {
    const [raceData, pitData, sprintData, qualiData] = await Promise.all([
      f1Get<DriverResultsResponse>(`${season}/${round}/drivers/${driverId}/results.json`),
      f1Get<PitStopsResponse>(`${season}/${round}/drivers/${driverId}/pitstops.json?limit=100`).catch(
        () => ({ MRData: { RaceTable: { Races: [] } } }) as PitStopsResponse,
      ),
      f1Get<DriverSprintResponse>(`${season}/${round}/drivers/${driverId}/sprint.json`).catch(
        () => ({ MRData: { RaceTable: { season, Races: [] } } }) as DriverSprintResponse,
      ),
      f1Get<DriverQualiResponse>(`${season}/${round}/drivers/${driverId}/qualifying.json`).catch(
        () => ({ MRData: { RaceTable: { season, Races: [] } } }) as DriverQualiResponse,
      ),
    ])

    const race = raceData.MRData.RaceTable.Races[0]
    if (!race) throw new Error('Нет данных этапа')
    const row = race.Results?.[0]
    const sprintRow = sprintData.MRData.RaceTable.Races[0]?.SprintResults?.[0]
    const qualiPos = qualiData.MRData.RaceTable.Races[0]?.QualifyingResults?.[0]?.position
    const stops = pitData.MRData.RaceTable.Races[0]?.PitStops ?? []

    return {
      season: race.season,
      round: race.round,
      raceName: race.raceName,
      date: race.date,
      circuit: circuitOf(race),
      place: placeOf(race),
      raceDrivers: row ? [mapDebriefDriver(row, driverId)] : [],
      sprintDrivers: sprintRow ? [mapDebriefDriver(sprintRow, driverId)] : [],
      pitStops: stops.map((s) => ({
        driverId: s.driverId,
        code: DRIVER_CODES[s.driverId] ?? s.driverId.slice(0, 3).toUpperCase(),
        lap: s.lap,
        stop: s.stop,
        duration: s.duration,
        time: s.time,
      })),
      qualiBest: qualiPos,
    }
  }

  const [raceData, pitData, sprintData] = await Promise.all([
    f1Get<TeamResultsResponse>(`${season}/${round}/constructors/${constructorId}/results.json`),
    f1Get<PitStopsResponse>(`${season}/${round}/pitstops.json?limit=100`).catch(
      () => ({ MRData: { RaceTable: { Races: [] } } }) as PitStopsResponse,
    ),
    f1Get<TeamSprintResponse>(`${season}/${round}/constructors/${constructorId}/sprint.json`).catch(
      () => ({ MRData: { RaceTable: { season, Races: [] } } }) as TeamSprintResponse,
    ),
  ])

  const race = raceData.MRData.RaceTable.Races[0]
  if (!race) throw new Error('Нет данных этапа')
  const raceDrivers = (race.Results ?? []).map((row) => mapDebriefDriver(row))
  const resultDriverIds = (race.Results ?? [])
    .map((r) => (r.Driver as { driverId?: string }).driverId)
    .filter(Boolean) as string[]
  const allStops = pitData.MRData.RaceTable.Races[0]?.PitStops ?? []
  const filteredStops =
    resultDriverIds.length > 0
      ? allStops.filter((s) => resultDriverIds.includes(s.driverId))
      : allStops.filter((s) => s.driverId in DRIVER_CODES)

  return {
    season: race.season,
    round: race.round,
    raceName: race.raceName,
    date: race.date,
    circuit: circuitOf(race),
    place: placeOf(race),
    raceDrivers,
    sprintDrivers: (sprintData.MRData.RaceTable.Races[0]?.SprintResults ?? []).map((row) =>
      mapDebriefDriver(row),
    ),
    pitStops: filteredStops.map((s) => ({
      driverId: s.driverId,
      code: DRIVER_CODES[s.driverId] ?? s.driverId.slice(0, 3).toUpperCase(),
      lap: s.lap,
      stop: s.stop,
      duration: s.duration,
      time: s.time,
    })),
  }
}

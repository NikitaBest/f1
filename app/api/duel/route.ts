import { NextRequest, NextResponse } from 'next/server'
import type { DuelExtra, DuelH2H, DuelLapCompare, DuelLapPoint, DuelLapSide } from '@/lib/duel-extra'

export const revalidate = 600

const JOLPI = 'https://api.jolpi.ca/ergast/f1'
const OPENF1 = 'https://api.openf1.org/v1'
const UA = 'BOXBOX/1.0 (+personal; vercel)'

type JolpicaResult = {
  position: string
  positionText?: string
  points: string
  status?: string
  Driver: { code?: string; familyName: string }
}

type JolpicaRace = {
  round: string
  raceName: string
  Results?: JolpicaResult[]
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { Accept: 'application/json', 'User-Agent': UA },
    next: { revalidate: 600 },
  })
  if (!res.ok) throw new Error(`${res.status} ${url}`)
  return res.json() as Promise<T>
}

function codeOf(d: { code?: string; familyName: string }) {
  return (d.code ?? d.familyName.slice(0, 3)).toUpperCase()
}

function isClassified(r: JolpicaResult) {
  const t = (r.positionText ?? r.position).toUpperCase()
  if (/^[RWE]$/.test(t) || /DSQ|DNS|DNF/.test(t)) return false
  if (/retir|disqual|dns|dsq/i.test(r.status ?? '')) return false
  return Number.isFinite(Number(r.position))
}

async function buildH2H(codeA: string, codeB: string): Promise<DuelH2H | null> {
  const last = await getJson<{
    MRData: { RaceTable: { season: string; Races: JolpicaRace[] } }
  }>(`${JOLPI}/current/last/results.json`)
  const lastRace = last.MRData.RaceTable.Races[0]
  if (!lastRace) return null
  const season = last.MRData.RaceTable.season
  const upTo = Number(lastRace.round) || 1

  // Batched by round (cached) — Jolpica не любит 20 параллельных запросов
  const settled: (JolpicaRace | null)[] = []
  const batchSize = 4
  for (let start = 1; start <= upTo; start += batchSize) {
    const batch = Array.from({ length: Math.min(batchSize, upTo - start + 1) }, (_, i) => start + i)
    const part = await Promise.all(
      batch.map(async (round) => {
        try {
          const data = await getJson<{
            MRData: { RaceTable: { Races: JolpicaRace[] } }
          }>(`${JOLPI}/${season}/${round}/results.json`)
          return data.MRData.RaceTable.Races[0] ?? null
        } catch {
          return null
        }
      }),
    )
    settled.push(...part)
  }

  let aAhead = 0
  let bAhead = 0
  let ties = 0
  let aPoints = 0
  let bPoints = 0
  let races = 0

  for (const race of settled) {
    const results = race?.Results ?? []
    if (!results.length) continue
    const ra = results.find((r) => codeOf(r.Driver) === codeA)
    const rb = results.find((r) => codeOf(r.Driver) === codeB)
    if (!ra || !rb) continue

    races += 1
    aPoints += Number(ra.points) || 0
    bPoints += Number(rb.points) || 0

    const ca = isClassified(ra)
    const cb = isClassified(rb)
    if (ca && cb) {
      const pa = Number(ra.position)
      const pb = Number(rb.position)
      if (pa === pb) ties += 1
      else if (pa < pb) aAhead += 1
      else bAhead += 1
    } else if (ca && !cb) aAhead += 1
    else if (!ca && cb) bAhead += 1
    else ties += 1
  }

  if (!races) return null
  return { races, aAhead, bAhead, ties, aPoints, bPoints }
}

type OpenSession = {
  session_key: number
  circuit_short_name: string
  date_end: string
  year: number
  is_cancelled?: boolean
  session_name: string
}

type OpenDriver = {
  driver_number: number
  name_acronym: string
  full_name?: string
}

type OpenLap = {
  lap_number: number
  lap_duration: number | null
  duration_sector_1: number | null
  duration_sector_2: number | null
  duration_sector_3: number | null
  date_start: string | null
}

type OpenCar = {
  date: string
  speed: number
  throttle: number
  brake: number
}

function fastestLap(laps: OpenLap[]) {
  const ok = laps.filter((l) => typeof l.lap_duration === 'number' && l.lap_duration > 0 && l.date_start)
  if (!ok.length) return null
  return ok.reduce((best, l) => ((l.lap_duration as number) < (best.lap_duration as number) ? l : best))
}

function downsample(points: OpenCar[], target = 48): OpenCar[] {
  if (points.length <= target) return points
  const out: OpenCar[] = []
  for (let i = 0; i < target; i++) {
    const idx = Math.round((i / (target - 1)) * (points.length - 1))
    out.push(points[idx]!)
  }
  return out
}

function alignSeries(a: OpenCar[], b: OpenCar[]): DuelLapPoint[] {
  const sa = downsample(a)
  const sb = downsample(b)
  const n = Math.min(sa.length, sb.length)
  const series: DuelLapPoint[] = []
  for (let i = 0; i < n; i++) {
    const pa = sa[i]!
    const pb = sb[i]!
    series.push({
      t: n <= 1 ? 0 : i / (n - 1),
      speedA: pa.speed ?? 0,
      speedB: pb.speed ?? 0,
      throttleA: pa.throttle ?? 0,
      throttleB: pb.throttle ?? 0,
      brakeA: pa.brake ?? 0,
      brakeB: pb.brake ?? 0,
    })
  }
  return series
}

async function carWindow(sessionKey: number, number: number, start: string, duration: number) {
  const st = new Date(start)
  const en = new Date(st.getTime() + (duration + 1.2) * 1000)
  const url =
    `${OPENF1}/car_data?session_key=${sessionKey}` +
    `&driver_number=${number}` +
    `&date>=${encodeURIComponent(st.toISOString())}` +
    `&date<=${encodeURIComponent(en.toISOString())}`
  const rows = await getJson<OpenCar[]>(url)
  return rows.sort((x, y) => +new Date(x.date) - +new Date(y.date))
}

async function buildLap(codeA: string, codeB: string): Promise<DuelLapCompare | null> {
  const year = new Date().getFullYear()
  const sessions = await getJson<OpenSession[]>(`${OPENF1}/sessions?year=${year}&session_name=Race`)
  const now = Date.now()
  const done = sessions
    .filter((s) => !s.is_cancelled && s.date_end && +new Date(s.date_end) < now)
    .sort((a, b) => +new Date(a.date_end) - +new Date(b.date_end))
  const session = done[done.length - 1]
  if (!session) return null

  const drivers = await getJson<OpenDriver[]>(`${OPENF1}/drivers?session_key=${session.session_key}`)
  const da = drivers.find((d) => d.name_acronym?.toUpperCase() === codeA)
  const db = drivers.find((d) => d.name_acronym?.toUpperCase() === codeB)
  if (!da || !db) return null

  const [lapsA, lapsB] = await Promise.all([
    getJson<OpenLap[]>(`${OPENF1}/laps?session_key=${session.session_key}&driver_number=${da.driver_number}`),
    getJson<OpenLap[]>(`${OPENF1}/laps?session_key=${session.session_key}&driver_number=${db.driver_number}`),
  ])
  const fa = fastestLap(lapsA)
  const fb = fastestLap(lapsB)
  if (!fa?.date_start || !fb?.date_start || !fa.lap_duration || !fb.lap_duration) return null

  const side = (code: string, number: number, lap: OpenLap): DuelLapSide => ({
    code,
    number,
    lapNumber: lap.lap_number,
    duration: lap.lap_duration as number,
    sectors: [
      Number(lap.duration_sector_1) || 0,
      Number(lap.duration_sector_2) || 0,
      Number(lap.duration_sector_3) || 0,
    ],
  })

  const [carsA, carsB] = await Promise.all([
    carWindow(session.session_key, da.driver_number, fa.date_start, fa.lap_duration),
    carWindow(session.session_key, db.driver_number, fb.date_start, fb.lap_duration),
  ])

  return {
    circuit: session.circuit_short_name,
    sessionKey: session.session_key,
    a: side(codeA, da.driver_number, fa),
    b: side(codeB, db.driver_number, fb),
    delta: (fa.lap_duration as number) - (fb.lap_duration as number),
    series: alignSeries(carsA, carsB),
  }
}

export async function GET(req: NextRequest) {
  const a = (req.nextUrl.searchParams.get('a') ?? '').toUpperCase()
  const b = (req.nextUrl.searchParams.get('b') ?? '').toUpperCase()
  if (!a || !b || a === b) {
    return NextResponse.json({ error: 'Need two different driver codes (a, b)' }, { status: 400 })
  }

  try {
    const [h2h, lap] = await Promise.all([
      buildH2H(a, b).catch(() => null),
      buildLap(a, b).catch(() => null),
    ])

    const payload: DuelExtra = {
      h2h,
      lap,
      error: !h2h && !lap ? 'Нет доп. данных для этой пары' : null,
    }

    return NextResponse.json(payload, {
      headers: { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200' },
    })
  } catch (error) {
    return NextResponse.json(
      {
        h2h: null,
        lap: null,
        error: error instanceof Error ? error.message : 'duel failed',
      } satisfies DuelExtra,
      { status: 502 },
    )
  }
}

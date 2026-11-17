import { NextRequest, NextResponse } from 'next/server'
import { openf1CircuitKey, openf1Get } from '@/lib/openf1'

export type TelemetryPoint = {
  t: number
  x: number
  y: number
  speed: number
  throttle: number
  brake: number
  rpm: number
  gear: number
  drs: boolean
}

export type TelemetryPayload = {
  circuitId: string
  year: number
  circuitName: string
  sessionKey: number
  driver: { code: string; name: string; number: number }
  drivers: { code: string; name: string; number: number }[]
  lap: {
    number: number
    duration: number
    sectors: [number, number, number]
    i1: number | null
    i2: number | null
    st: number | null
  }
  path: string
  points: TelemetryPoint[]
  maxSpeed: number
}

type OpenSession = {
  session_key: number
  circuit_short_name: string
  year: number
  date_start: string
  date_end: string
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
  is_pit_out_lap?: boolean | null
  i1_speed?: number | null
  i2_speed?: number | null
  st_speed?: number | null
}

type OpenLoc = { date: string; x: number; y: number }
type OpenCar = {
  date: string
  speed: number
  throttle: number
  brake: number
  rpm?: number
  n_gear?: number
  drs?: number
}

const TARGET = 96
const PAD = 6

function rankSessions(sessions: OpenSession[], now: number) {
  const sorted = [...sessions].sort((a, b) => b.date_end.localeCompare(a.date_end))
  const started = sorted.filter((s) => new Date(s.date_start).getTime() <= now)
  return started.length ? started : sorted
}

function codeOf(d: OpenDriver) {
  return (d.name_acronym || `#${d.driver_number}`).toUpperCase()
}

function nameOf(d: OpenDriver) {
  return d.full_name || codeOf(d)
}

function fastestLap(laps: OpenLap[]) {
  const ok = laps.filter(
    (l) =>
      !l.is_pit_out_lap &&
      typeof l.lap_duration === 'number' &&
      l.lap_duration > 0 &&
      Boolean(l.date_start),
  )
  if (!ok.length) return null
  return ok.reduce((best, l) => ((l.lap_duration as number) < (best.lap_duration as number) ? l : best))
}

function downsample<T>(rows: T[], target = TARGET): T[] {
  if (rows.length <= target) return rows
  const out: T[] = []
  for (let i = 0; i < target; i++) {
    const idx = Math.round((i / (target - 1)) * (rows.length - 1))
    out.push(rows[idx]!)
  }
  return out
}

function nearest<T extends { date: string }>(rows: T[], iso: string): T | null {
  if (!rows.length) return null
  const t = new Date(iso).getTime()
  let best = rows[0]!
  let bestDiff = Math.abs(new Date(best.date).getTime() - t)
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]!
    const diff = Math.abs(new Date(row.date).getTime() - t)
    if (diff < bestDiff) {
      best = row
      bestDiff = diff
    }
  }
  return best
}

function drsOn(v?: number) {
  return v === 10 || v === 12 || v === 14
}

async function windowGet<T>(path: string, start: string, end: string, revalidate = 3600) {
  const q =
    `${path}` +
    `&date>=${encodeURIComponent(start)}` +
    `&date<=${encodeURIComponent(end)}`
  return openf1Get<T>(q, revalidate)
}

function buildPayload(
  circuitId: string,
  session: OpenSession,
  driver: OpenDriver,
  lap: OpenLap,
  drivers: TelemetryPayload['drivers'],
  locs: OpenLoc[],
  cars: OpenCar[],
): TelemetryPayload {
  const locSorted = [...locs].sort((a, b) => a.date.localeCompare(b.date))
  const carSorted = [...cars].sort((a, b) => a.date.localeCompare(b.date))
  const sampled = downsample(locSorted)

  const xs = sampled.map((p) => p.x)
  const ys = sampled.map((p) => p.y)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  const spanX = Math.max(1, maxX - minX)
  const spanY = Math.max(1, maxY - minY)
  const span = Math.max(spanX, spanY)
  const ox = (span - spanX) / 2
  const oy = (span - spanY) / 2
  const usable = 100 - PAD * 2

  const t0 = new Date(sampled[0]!.date).getTime()
  const t1 = new Date(sampled[sampled.length - 1]!.date).getTime()
  const spanT = Math.max(1, t1 - t0)

  const points: TelemetryPoint[] = sampled.map((loc) => {
    const car = nearest(carSorted, loc.date)
    const nx = PAD + ((loc.x - minX + ox) / span) * usable
    const ny = PAD + ((maxY - loc.y + oy) / span) * usable
    return {
      t: (new Date(loc.date).getTime() - t0) / spanT,
      x: Math.round(nx * 100) / 100,
      y: Math.round(ny * 100) / 100,
      speed: car?.speed ?? 0,
      throttle: car?.throttle ?? 0,
      brake: car?.brake ?? 0,
      rpm: car?.rpm ?? 0,
      gear: car?.n_gear ?? 0,
      drs: drsOn(car?.drs),
    }
  })

  const path = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(' ')

  return {
    circuitId,
    year: session.year,
    circuitName: session.circuit_short_name,
    sessionKey: session.session_key,
    driver: { code: codeOf(driver), name: nameOf(driver), number: driver.driver_number },
    drivers,
    lap: {
      number: lap.lap_number,
      duration: lap.lap_duration as number,
      sectors: [
        Number(lap.duration_sector_1) || 0,
        Number(lap.duration_sector_2) || 0,
        Number(lap.duration_sector_3) || 0,
      ],
      i1: lap.i1_speed ?? null,
      i2: lap.i2_speed ?? null,
      st: lap.st_speed ?? null,
    },
    path,
    points,
    maxSpeed: Math.max(...points.map((p) => p.speed), 1),
  }
}

export async function GET(req: NextRequest) {
  const circuitId = req.nextUrl.searchParams.get('circuit') ?? ''
  const driverCode = (req.nextUrl.searchParams.get('driver') ?? '').toUpperCase()
  const key = openf1CircuitKey(circuitId)
  if (!key) return NextResponse.json({ error: 'no data for circuit' }, { status: 404 })

  const now = Date.now()
  const sessions = await openf1Get<OpenSession[]>(`/sessions?circuit_key=${key}&session_name=Race`, 600)
  if (!sessions?.length) return NextResponse.json({ error: 'no race session' }, { status: 404 })

  for (const session of rankSessions(sessions, now).slice(0, 6)) {
    const drivers = await openf1Get<OpenDriver[]>(`/drivers?session_key=${session.session_key}`, 3600)
    if (!drivers?.length) continue

    const driverList = drivers
      .map((d) => ({ code: codeOf(d), name: nameOf(d), number: d.driver_number }))
      .sort((a, b) => a.code.localeCompare(b.code))

    let pick: OpenDriver | undefined
    let lap: OpenLap | null = null

    if (driverCode) {
      pick = drivers.find((d) => codeOf(d) === driverCode)
      if (pick) {
        const laps = await openf1Get<OpenLap[]>(
          `/laps?session_key=${session.session_key}&driver_number=${pick.driver_number}`,
          3600,
        )
        lap = laps ? fastestLap(laps) : null
      }
    }

    if (!pick || !lap) {
      const scanned = await Promise.all(
        drivers.map(async (d) => {
          const laps = await openf1Get<OpenLap[]>(
            `/laps?session_key=${session.session_key}&driver_number=${d.driver_number}`,
            3600,
          )
          const fl = laps ? fastestLap(laps) : null
          return fl ? { driver: d, lap: fl } : null
        }),
      )
      const best = scanned
        .filter((x): x is { driver: OpenDriver; lap: OpenLap } => Boolean(x))
        .sort((a, b) => (a.lap.lap_duration as number) - (b.lap.lap_duration as number))[0]
      if (!best) continue
      pick = best.driver
      lap = best.lap
    }

    if (!lap.date_start || !lap.lap_duration) continue

    const start = lap.date_start
    const end = new Date(new Date(start).getTime() + (lap.lap_duration + 1.2) * 1000).toISOString()
    const [locs, cars] = await Promise.all([
      windowGet<OpenLoc[]>(
        `/location?session_key=${session.session_key}&driver_number=${pick.driver_number}`,
        start,
        end,
      ),
      windowGet<OpenCar[]>(
        `/car_data?session_key=${session.session_key}&driver_number=${pick.driver_number}`,
        start,
        end,
      ),
    ])
    if (!locs?.length || !cars?.length) continue

    return NextResponse.json(buildPayload(circuitId, session, pick, lap, driverList, locs, cars), {
      headers: { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=3600' },
    })
  }

  return NextResponse.json({ error: 'no telemetry' }, { status: 404 })
}

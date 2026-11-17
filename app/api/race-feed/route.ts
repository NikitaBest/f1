import { NextRequest, NextResponse } from 'next/server'
import { openf1CircuitKey, openf1Get } from '@/lib/openf1'

export type RacePit = {
  code: string
  name: string
  number: number
  lap: number
  duration: number | null
  date: string
}

export type RaceOvertake = {
  date: string
  by: string
  of: string
  byNumber: number
  ofNumber: number
  position: number
}

export type RaceFeed = {
  circuitId: string
  year: number
  circuitName: string
  sessionKey: number
  pits: RacePit[]
  overtakes: RaceOvertake[]
  topPassers: { code: string; count: number }[]
  totalOvertakes: number
}

type OpenSession = {
  session_key: number
  meeting_key: number
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

type OpenPit = {
  date: string
  driver_number: number
  lap_number?: number | null
  pit_duration?: number | null
  stop_duration?: number | null
  lane_duration?: number | null
}

type OpenOvertake = {
  date: string
  overtaking_driver_number: number
  overtaken_driver_number: number
  position?: number | null
}

function rankSessions(sessions: OpenSession[], now: number) {
  const sorted = [...sessions].sort((a, b) => b.date_end.localeCompare(a.date_end))
  const started = sorted.filter((s) => new Date(s.date_start).getTime() <= now)
  return started.length ? started : sorted
}

function codeOf(map: Map<number, OpenDriver>, n: number) {
  return (map.get(n)?.name_acronym || `#${n}`).toUpperCase()
}

function nameOf(map: Map<number, OpenDriver>, n: number) {
  return map.get(n)?.full_name || codeOf(map, n)
}

export async function GET(req: NextRequest) {
  const circuitId = req.nextUrl.searchParams.get('circuit') ?? ''
  const key = openf1CircuitKey(circuitId)
  if (!key) return NextResponse.json({ error: 'no data for circuit' }, { status: 404 })

  const now = Date.now()
  const sessions = await openf1Get<OpenSession[]>(`/sessions?circuit_key=${key}&session_name=Race`, 600)
  if (!sessions?.length) return NextResponse.json({ error: 'no race session' }, { status: 404 })

  for (const session of rankSessions(sessions, now).slice(0, 6)) {
    const [drivers, pitsRaw, oversRaw] = await Promise.all([
      openf1Get<OpenDriver[]>(`/drivers?session_key=${session.session_key}`, 3600),
      openf1Get<OpenPit[]>(`/pit?session_key=${session.session_key}`, 600),
      openf1Get<OpenOvertake[]>(`/overtakes?session_key=${session.session_key}`, 600),
    ])
    if (!drivers?.length) continue
    if (!(pitsRaw?.length || oversRaw?.length)) continue

    const byNumber = new Map(drivers.map((d) => [d.driver_number, d]))

    const pits: RacePit[] = [...(pitsRaw ?? [])]
      .map((p) => ({
        code: codeOf(byNumber, p.driver_number),
        name: nameOf(byNumber, p.driver_number),
        number: p.driver_number,
        lap: p.lap_number ?? 0,
        duration: p.pit_duration ?? p.stop_duration ?? p.lane_duration ?? null,
        date: p.date,
      }))
      .sort((a, b) => a.lap - b.lap || a.date.localeCompare(b.date))

    const overtakesAll: RaceOvertake[] = [...(oversRaw ?? [])]
      .map((o) => ({
        date: o.date,
        by: codeOf(byNumber, o.overtaking_driver_number),
        of: codeOf(byNumber, o.overtaken_driver_number),
        byNumber: o.overtaking_driver_number,
        ofNumber: o.overtaken_driver_number,
        position: o.position ?? 0,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))

    const passCount = new Map<string, number>()
    for (const o of overtakesAll) {
      passCount.set(o.by, (passCount.get(o.by) ?? 0) + 1)
    }
    const topPassers = [...passCount.entries()]
      .map(([code, count]) => ({ code, count }))
      .sort((a, b) => b.count - a.count || a.code.localeCompare(b.code))
      .slice(0, 5)

    const payload: RaceFeed = {
      circuitId,
      year: session.year,
      circuitName: session.circuit_short_name,
      sessionKey: session.session_key,
      pits,
      overtakes: overtakesAll.slice(-16).reverse(),
      topPassers,
      totalOvertakes: overtakesAll.length,
    }

    return NextResponse.json(payload, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600' },
    })
  }

  return NextResponse.json({ error: 'no race feed' }, { status: 404 })
}

import { NextRequest, NextResponse } from 'next/server'
import { openf1CircuitKey, openf1Get } from '@/lib/openf1'

const REVALIDATE = 3600

type OpenF1Session = { session_key: number; date_end: string; year: number }
type OpenF1Lap = {
  driver_number: number
  lap_duration: number | null
  duration_sector_1: number | null
  duration_sector_2: number | null
  duration_sector_3: number | null
}
type OpenF1Driver = {
  full_name: string
  name_acronym: string
  team_name: string
  team_colour: string
}

export type BestLap = {
  year: number
  acronym: string
  driver: string
  team: string
  color: string
  lap: number
  s1: number
  s2: number
  s3: number
}

function pickBest(laps: OpenF1Lap[]) {
  let best: (OpenF1Lap & { lap_duration: number; duration_sector_1: number; duration_sector_2: number; duration_sector_3: number }) | null = null
  for (const lap of laps) {
    const { lap_duration: t, duration_sector_1: a, duration_sector_2: b, duration_sector_3: c } = lap
    if (!t || !a || !b || !c) continue
    if (!best || t < best.lap_duration) best = { ...lap, lap_duration: t, duration_sector_1: a, duration_sector_2: b, duration_sector_3: c }
  }
  return best
}

export async function GET(req: NextRequest) {
  const circuit = req.nextUrl.searchParams.get('circuit') ?? ''
  const key = openf1CircuitKey(circuit)
  if (!key) return NextResponse.json({ error: 'no data for circuit' }, { status: 404 })

  const sessions = await openf1Get<OpenF1Session[]>(`/sessions?circuit_key=${key}&session_name=Qualifying`, REVALIDATE)
  if (!sessions?.length) return NextResponse.json({ error: 'no sessions' }, { status: 404 })

  const now = Date.now()
  const finished = sessions.filter((s) => new Date(s.date_end).getTime() < now).sort((a, b) => b.year - a.year)

  for (const session of finished.slice(0, 3)) {
    const laps = await openf1Get<OpenF1Lap[]>(`/laps?session_key=${session.session_key}`, REVALIDATE)
    const best = laps ? pickBest(laps) : null
    if (!best) continue

    const drivers = await openf1Get<OpenF1Driver[]>(
      `/drivers?session_key=${session.session_key}&driver_number=${best.driver_number}`,
      REVALIDATE,
    )
    const driver = drivers?.[0]
    const payload: BestLap = {
      year: session.year,
      acronym: driver?.name_acronym ?? `#${best.driver_number}`,
      driver: driver?.full_name ?? `Pilot ${best.driver_number}`,
      team: driver?.team_name ?? '',
      color: driver?.team_colour ? `#${driver.team_colour}` : '#E10600',
      lap: best.lap_duration,
      s1: best.duration_sector_1,
      s2: best.duration_sector_2,
      s3: best.duration_sector_3,
    }
    return NextResponse.json(payload, {
      headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' },
    })
  }

  return NextResponse.json({ error: 'no laps' }, { status: 404 })
}

import { NextRequest, NextResponse } from 'next/server'

const UPSTREAM = 'https://api.openf1.org/v1'
const REVALIDATE = 3600

/** circuitId из Jolpica -> circuit_key из OpenF1. Трасс без записи у OpenF1 здесь нет. */
const OPENF1_CIRCUIT_KEY: Record<string, number> = {
  albert_park: 10,
  bahrain: 63,
  shanghai: 49,
  catalunya: 15,
  monaco: 22,
  villeneuve: 23,
  red_bull_ring: 19,
  silverstone: 2,
  hungaroring: 4,
  spa: 7,
  monza: 39,
  marina_bay: 61,
  suzuka: 46,
  americas: 9,
  rodriguez: 65,
  interlagos: 14,
  yas_marina: 70,
  imola: 6,
  zandvoort: 55,
  jeddah: 149,
  miami: 151,
  losail: 150,
  madring: 153,
  baku: 144,
  vegas: 152,
}

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

async function getJson<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${UPSTREAM}${path}`, {
      headers: { Accept: 'application/json' },
      next: { revalidate: REVALIDATE },
    })
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
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
  const key = OPENF1_CIRCUIT_KEY[circuit]
  if (!key) return NextResponse.json({ error: 'no data for circuit' }, { status: 404 })

  const sessions = await getJson<OpenF1Session[]>(`/sessions?circuit_key=${key}&session_name=Qualifying`)
  if (!sessions?.length) return NextResponse.json({ error: 'no sessions' }, { status: 404 })

  const now = Date.now()
  const finished = sessions.filter((s) => new Date(s.date_end).getTime() < now).sort((a, b) => b.year - a.year)

  for (const session of finished.slice(0, 3)) {
    const laps = await getJson<OpenF1Lap[]>(`/laps?session_key=${session.session_key}`)
    const best = laps ? pickBest(laps) : null
    if (!best) continue

    const drivers = await getJson<OpenF1Driver[]>(
      `/drivers?session_key=${session.session_key}&driver_number=${best.driver_number}`,
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

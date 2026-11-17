import { NextRequest, NextResponse } from 'next/server'
import { openf1CircuitKey, openf1Get } from '@/lib/openf1'

export type CircuitWeather = {
  circuitId: string
  air: number
  track: number
  humidity: number
  rainfall: boolean
  windSpeed: number
  windDirection: number
  pressure: number
  date: string
  year: number
  sessionName: string
  /** Данные с текущего/свежего уикенда, а не архив прошлых лет. */
  fresh: boolean
}

type OpenMeeting = {
  meeting_key: number
  year: number
  date_start: string
  date_end: string
}

type OpenSession = {
  session_key: number
  session_name: string
  date_start: string
  date_end: string
  year: number
}

type OpenWeather = {
  date: string
  air_temperature: number | null
  track_temperature: number | null
  humidity: number | null
  rainfall: number | boolean | null
  wind_speed: number | null
  wind_direction: number | null
  pressure: number | null
}

function isRain(v: number | boolean | null | undefined) {
  if (typeof v === 'boolean') return v
  return Number(v) > 0
}

export async function GET(req: NextRequest) {
  const circuitId = req.nextUrl.searchParams.get('circuit') ?? ''
  const key = openf1CircuitKey(circuitId)
  if (!key) return NextResponse.json({ error: 'no data for circuit' }, { status: 404 })

  const meetings = await openf1Get<OpenMeeting[]>(`/meetings?circuit_key=${key}`, 600)
  if (!meetings?.length) return NextResponse.json({ error: 'no meetings' }, { status: 404 })

  const now = Date.now()
  const sorted = [...meetings].sort(
    (a, b) => b.year - a.year || b.date_end.localeCompare(a.date_end),
  )

  for (const meeting of sorted.slice(0, 6)) {
    const sessions = await openf1Get<OpenSession[]>(`/sessions?meeting_key=${meeting.meeting_key}`, 600)
    if (!sessions?.length) continue

    const sessionList = [...sessions].sort((a, b) => b.date_end.localeCompare(a.date_end))
    // Prefer sessions that already started (have a chance of weather samples)
    const candidates = sessionList.filter((s) => new Date(s.date_start).getTime() <= now)
    const queue = (candidates.length ? candidates : sessionList).slice(0, 4)

    for (const session of queue) {
      const rows = await openf1Get<OpenWeather[]>(`/weather?session_key=${session.session_key}`, 120)
      if (!rows?.length) continue

      const last = [...rows].sort((a, b) => a.date.localeCompare(b.date)).at(-1)
      if (!last || last.air_temperature == null || last.track_temperature == null) continue

      const ageMs = now - new Date(last.date).getTime()
      const fresh = ageMs >= 0 && ageMs < 1000 * 60 * 60 * 36

      const payload: CircuitWeather = {
        circuitId,
        air: last.air_temperature,
        track: last.track_temperature,
        humidity: last.humidity ?? 0,
        rainfall: isRain(last.rainfall),
        windSpeed: last.wind_speed ?? 0,
        windDirection: last.wind_direction ?? 0,
        pressure: last.pressure ?? 0,
        date: last.date,
        year: session.year || meeting.year,
        sessionName: session.session_name,
        fresh,
      }

      return NextResponse.json(payload, {
        headers: {
          'Cache-Control': fresh
            ? 'public, s-maxage=120, stale-while-revalidate=600'
            : 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
      })
    }
  }

  return NextResponse.json({ error: 'no weather' }, { status: 404 })
}

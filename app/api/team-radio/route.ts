import { NextRequest, NextResponse } from 'next/server'
import { openf1CircuitKey, openf1Get } from '@/lib/openf1'

export type TeamRadioClip = {
  date: string
  code: string
  name: string
  number: number
  url: string
}

export type TeamRadioPayload = {
  circuitId: string
  year: number
  circuitName: string
  sessionKey: number
  clips: TeamRadioClip[]
  drivers: { code: string; name: string; number: number; count: number }[]
  total: number
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

type OpenRadio = {
  date: string
  driver_number: number
  recording_url?: string | null
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
    const [drivers, radios] = await Promise.all([
      openf1Get<OpenDriver[]>(`/drivers?session_key=${session.session_key}`, 3600),
      openf1Get<OpenRadio[]>(`/team_radio?session_key=${session.session_key}`, 600),
    ])
    if (!drivers?.length || !radios?.length) continue

    const byNumber = new Map(drivers.map((d) => [d.driver_number, d]))
    const clipsAll: TeamRadioClip[] = radios
      .filter((r) => Boolean(r.recording_url))
      .map((r) => {
        const remote = r.recording_url as string
        // F1 CDN режет CORS/Range из браузера — отдаём через наш proxy
        return {
          date: r.date,
          code: codeOf(byNumber, r.driver_number),
          name: nameOf(byNumber, r.driver_number),
          number: r.driver_number,
          url: `/api/team-radio/stream?url=${encodeURIComponent(remote)}`,
        }
      })
      .sort((a, b) => a.date.localeCompare(b.date))

    if (!clipsAll.length) continue

    const count = new Map<number, number>()
    for (const c of clipsAll) count.set(c.number, (count.get(c.number) ?? 0) + 1)

    const driversList = [...count.entries()]
      .map(([number, n]) => ({
        number,
        code: codeOf(byNumber, number),
        name: nameOf(byNumber, number),
        count: n,
      }))
      .sort((a, b) => b.count - a.count || a.code.localeCompare(b.code))

    const payload: TeamRadioPayload = {
      circuitId,
      year: session.year,
      circuitName: session.circuit_short_name,
      sessionKey: session.session_key,
      clips: clipsAll.slice(-48).reverse(),
      drivers: driversList,
      total: clipsAll.length,
    }

    return NextResponse.json(payload, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600' },
    })
  }

  return NextResponse.json({ error: 'no team radio' }, { status: 404 })
}

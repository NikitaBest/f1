import { NextRequest, NextResponse } from 'next/server'
import { openf1CircuitKey, openf1Get } from '@/lib/openf1'

export type StintCompound = 'SOFT' | 'MEDIUM' | 'HARD' | 'INTERMEDIATE' | 'WET' | string

export type DriverStint = {
  stintNumber: number
  compound: StintCompound
  lapStart: number
  lapEnd: number
  tyreAgeAtStart: number
  laps: number
}

export type DriverStints = {
  code: string
  number: number
  name: string
  team: string
  color: string
  stints: DriverStint[]
}

export type StintsPayload = {
  circuitId: string
  year: number
  sessionKey: number
  sessionName: string
  drivers: DriverStints[]
}

type OpenSession = {
  session_key: number
  session_name: string
  year: number
  date_end: string
}

type OpenDriver = {
  driver_number: number
  name_acronym: string
  full_name?: string
  team_name?: string
  team_colour?: string
}

type OpenStint = {
  driver_number: number
  stint_number: number
  compound: string | null
  lap_start: number | null
  lap_end: number | null
  tyre_age_at_start: number | null
}

export async function GET(req: NextRequest) {
  const circuitId = req.nextUrl.searchParams.get('circuit') ?? ''
  const year = Number(req.nextUrl.searchParams.get('year') || 0)
  const codesParam = req.nextUrl.searchParams.get('codes') ?? ''
  const codes = codesParam
    .split(',')
    .map((c) => c.trim().toUpperCase())
    .filter(Boolean)

  const key = openf1CircuitKey(circuitId)
  if (!key || !year) {
    return NextResponse.json({ error: 'circuit and year required' }, { status: 400 })
  }

  const sessions = await openf1Get<OpenSession[]>(
    `/sessions?circuit_key=${key}&year=${year}&session_name=Race`,
    3600,
  )
  if (!sessions?.length) return NextResponse.json({ error: 'no race session' }, { status: 404 })

  const session = [...sessions].sort((a, b) => b.date_end.localeCompare(a.date_end))[0]
  const [drivers, stints] = await Promise.all([
    openf1Get<OpenDriver[]>(`/drivers?session_key=${session.session_key}`, 3600),
    openf1Get<OpenStint[]>(`/stints?session_key=${session.session_key}`, 3600),
  ])

  if (!drivers?.length || !stints?.length) {
    return NextResponse.json({ error: 'no stints' }, { status: 404 })
  }

  const byNumber = new Map(drivers.map((d) => [d.driver_number, d]))
  const wanted = codes.length
    ? new Set(
        drivers
          .filter((d) => codes.includes((d.name_acronym || '').toUpperCase()))
          .map((d) => d.driver_number),
      )
    : null

  const grouped = new Map<number, OpenStint[]>()
  for (const s of stints) {
    if (wanted && !wanted.has(s.driver_number)) continue
    if (!s.compound || s.lap_start == null || s.lap_end == null) continue
    const list = grouped.get(s.driver_number) ?? []
    list.push(s)
    grouped.set(s.driver_number, list)
  }

  const payloadDrivers: DriverStints[] = [...grouped.entries()]
    .map(([number, list]) => {
      const d = byNumber.get(number)
      const code = (d?.name_acronym || `#${number}`).toUpperCase()
      const ordered = [...list].sort((a, b) => a.stint_number - b.stint_number)
      return {
        code,
        number,
        name: d?.full_name ?? code,
        team: d?.team_name ?? '',
        color: d?.team_colour ? `#${d.team_colour}` : '#E10600',
        stints: ordered.map((s) => {
          const lapStart = s.lap_start ?? 1
          const lapEnd = s.lap_end ?? lapStart
          return {
            stintNumber: s.stint_number,
            compound: (s.compound || 'UNKNOWN').toUpperCase(),
            lapStart,
            lapEnd,
            tyreAgeAtStart: s.tyre_age_at_start ?? 0,
            laps: Math.max(1, lapEnd - lapStart + 1),
          }
        }),
      }
    })
    .sort((a, b) => a.code.localeCompare(b.code))

  if (!payloadDrivers.length) return NextResponse.json({ error: 'no stints' }, { status: 404 })

  const payload: StintsPayload = {
    circuitId,
    year: session.year,
    sessionKey: session.session_key,
    sessionName: session.session_name,
    drivers: payloadDrivers,
  }

  return NextResponse.json(payload, {
    headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' },
  })
}

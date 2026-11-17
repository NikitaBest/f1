import { NextRequest, NextResponse } from 'next/server'
import { openf1CircuitKey, openf1Get } from '@/lib/openf1'

export type GridRow = {
  position: number
  code: string
  name: string
  team: string
  color: string
  number: number
  /** Quali lap time in seconds, if known. */
  lap?: number | null
  lapLabel?: string | null
}

export type GridPayload = {
  circuitId: string
  year: number
  meetingKey: number
  circuitName: string
  sessionName: string
  rows: GridRow[]
}

type OpenSession = {
  session_key: number
  session_name: string
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
  team_name?: string
  team_colour?: string
}

type OpenGrid = {
  position: number
  driver_number: number
  lap_duration?: number | null
  meeting_key: number
  session_key: number
}

function fmtLap(sec?: number | null) {
  if (sec == null || !Number.isFinite(sec) || sec <= 0) return null
  const m = Math.floor(sec / 60)
  const s = sec - m * 60
  return `${m}:${s.toFixed(3).padStart(6, '0')}`
}

function rankMeetings(sessions: OpenSession[], now: number) {
  const byMeeting = new Map<number, OpenSession>()
  for (const s of sessions) {
    const prev = byMeeting.get(s.meeting_key)
    if (!prev || s.date_end > prev.date_end) byMeeting.set(s.meeting_key, s)
  }
  const list = [...byMeeting.values()].sort((a, b) => b.date_end.localeCompare(a.date_end))
  const started = list.filter((s) => new Date(s.date_start).getTime() <= now)
  const future = list.filter((s) => new Date(s.date_start).getTime() > now)
  return [...started, ...future]
}

export async function GET(req: NextRequest) {
  const circuitId = req.nextUrl.searchParams.get('circuit') ?? ''
  const key = openf1CircuitKey(circuitId)
  if (!key) return NextResponse.json({ error: 'no data for circuit' }, { status: 404 })

  const now = Date.now()
  const sessions = await openf1Get<OpenSession[]>(`/sessions?circuit_key=${key}&session_name=Race`, 600)
  if (!sessions?.length) return NextResponse.json({ error: 'no race session' }, { status: 404 })

  for (const race of rankMeetings(sessions, now).slice(0, 6)) {
    const [grid, drivers] = await Promise.all([
      openf1Get<OpenGrid[]>(`/starting_grid?meeting_key=${race.meeting_key}`, 3600),
      openf1Get<OpenDriver[]>(`/drivers?session_key=${race.session_key}`, 3600),
    ])
    if (!grid?.length) continue

    // Drivers may be on quali session_key from grid rows — merge both if needed
    let byNumber = new Map((drivers ?? []).map((d) => [d.driver_number, d]))
    const missing = grid.some((g) => !byNumber.has(g.driver_number))
    if (missing) {
      const qualiKey = grid[0]?.session_key
      if (qualiKey && qualiKey !== race.session_key) {
        const qualiDrivers = await openf1Get<OpenDriver[]>(`/drivers?session_key=${qualiKey}`, 3600)
        for (const d of qualiDrivers ?? []) byNumber.set(d.driver_number, d)
      }
    }

    const rows: GridRow[] = [...grid]
      .sort((a, b) => a.position - b.position)
      .map((g) => {
        const d = byNumber.get(g.driver_number)
        return {
          position: g.position,
          code: (d?.name_acronym || `#${g.driver_number}`).toUpperCase(),
          name: d?.full_name ?? `#${g.driver_number}`,
          team: d?.team_name ?? '',
          color: d?.team_colour ? `#${d.team_colour}` : '#E10600',
          number: g.driver_number,
          lap: g.lap_duration ?? null,
          lapLabel: fmtLap(g.lap_duration),
        }
      })

    if (!rows.length) continue

    const payload: GridPayload = {
      circuitId,
      year: race.year,
      meetingKey: race.meeting_key,
      circuitName: race.circuit_short_name,
      sessionName: 'Starting grid',
      rows,
    }

    return NextResponse.json(payload, {
      headers: { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=3600' },
    })
  }

  return NextResponse.json({ error: 'no starting grid' }, { status: 404 })
}

import { NextRequest, NextResponse } from 'next/server'
import { openf1CircuitKey, openf1Get } from '@/lib/openf1'

export type LiveStanding = {
  position: number
  code: string
  name: string
  team: string
  color: string
  number: number
  gap: string
  laps?: number
  status?: 'dnf' | 'dns' | 'dsq' | null
}

export type LiveControl = {
  date: string
  category: string
  flag?: string | null
  message: string
  lap?: number | null
}

export type LiveBoard = {
  circuitId: string
  year: number
  sessionKey: number
  sessionName: string
  circuitName: string
  live: boolean
  updatedAt: string
  flag?: string | null
  standings: LiveStanding[]
  control: LiveControl[]
}

type OpenSession = {
  session_key: number
  session_name: string
  session_type: string
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

type OpenResult = {
  position: number | null
  driver_number: number
  number_of_laps?: number
  gap_to_leader?: number | string | null
  dnf?: boolean
  dns?: boolean
  dsq?: boolean
}

type OpenPosition = {
  date: string
  driver_number: number
  position: number
}

type OpenInterval = {
  date: string
  driver_number: number
  gap_to_leader?: number | string | null
  interval?: number | string | null
}

type OpenControl = {
  date: string
  category?: string | null
  flag?: string | null
  message?: string | null
  lap_number?: number | null
}

function fmtGap(gap: number | string | null | undefined, position: number) {
  if (position === 1) return 'Leader'
  if (gap == null || gap === '') return '—'
  if (typeof gap === 'string') {
    if (/lap/i.test(gap)) return gap
    const n = Number(gap)
    if (!Number.isFinite(n)) return gap
    return `+${n.toFixed(3)}`
  }
  if (!Number.isFinite(gap)) return '—'
  return `+${gap.toFixed(3)}`
}

function rankSessions(sessions: OpenSession[], now: number) {
  const sorted = [...sessions].sort((a, b) => b.date_end.localeCompare(a.date_end))
  const live = sorted.filter((s) => {
    const start = new Date(s.date_start).getTime()
    const end = new Date(s.date_end).getTime() + 20 * 60_000
    return now >= start && now <= end
  })
  const started = sorted.filter((s) => new Date(s.date_start).getTime() <= now)
  // Live first, then most recent started races, then anything else
  const rest = sorted.filter((s) => !live.includes(s) && !started.includes(s))
  return [...live, ...started.filter((s) => !live.includes(s)), ...rest]
}

export async function GET(req: NextRequest) {
  const circuitId = req.nextUrl.searchParams.get('circuit') ?? ''
  const key = openf1CircuitKey(circuitId)
  if (!key) return NextResponse.json({ error: 'no data for circuit' }, { status: 404 })

  const now = Date.now()
  const sessions = await openf1Get<OpenSession[]>(`/sessions?circuit_key=${key}&session_name=Race`, 120)
  if (!sessions?.length) return NextResponse.json({ error: 'no race session' }, { status: 404 })

  const ranked = rankSessions(sessions, now)
  let session: OpenSession | null = null
  let drivers: OpenDriver[] | null = null
  let results: OpenResult[] | null = null
  let controlRows: OpenControl[] | null = null
  let live = false

  for (const candidate of ranked.slice(0, 6)) {
    const start = new Date(candidate.date_start).getTime()
    const end = new Date(candidate.date_end).getTime() + 20 * 60_000
    const isLive = now >= start && now <= end
    const [d, r, c] = await Promise.all([
      openf1Get<OpenDriver[]>(`/drivers?session_key=${candidate.session_key}`, isLive ? 30 : 3600),
      openf1Get<OpenResult[]>(`/session_result?session_key=${candidate.session_key}`, isLive ? 30 : 3600),
      openf1Get<OpenControl[]>(`/race_control?session_key=${candidate.session_key}`, isLive ? 30 : 3600),
    ])
    if (!d?.length) continue
    session = candidate
    drivers = d
    results = r
    controlRows = c
    live = isLive
    break
  }

  if (!session || !drivers?.length) return NextResponse.json({ error: 'no drivers' }, { status: 404 })

  const start = new Date(session.date_start).getTime()

  const byNumber = new Map(drivers.map((d) => [d.driver_number, d]))
  let standings: LiveStanding[] = []

  if (results?.length) {
    standings = [...results]
      .filter((r) => r.position != null)
      .sort((a, b) => Number(a.position) - Number(b.position))
      .map((r) => {
        const d = byNumber.get(r.driver_number)
        const pos = Number(r.position)
        return {
          position: pos,
          code: (d?.name_acronym || `#${r.driver_number}`).toUpperCase(),
          name: d?.full_name ?? `#${r.driver_number}`,
          team: d?.team_name ?? '',
          color: d?.team_colour ? `#${d.team_colour}` : '#E10600',
          number: r.driver_number,
          gap: fmtGap(r.gap_to_leader, pos),
          laps: r.number_of_laps,
          status: r.dsq ? 'dsq' : r.dns ? 'dns' : r.dnf ? 'dnf' : null,
        }
      })
  } else {
    // Live fallback: latest positions + recent intervals
    const positions = await openf1Get<OpenPosition[]>(
      `/position?session_key=${session.session_key}`,
      20,
    )
    const latestPos = new Map<number, OpenPosition>()
    for (const p of positions ?? []) {
      const prev = latestPos.get(p.driver_number)
      if (!prev || p.date > prev.date) latestPos.set(p.driver_number, p)
    }

    const windowStart = new Date(Math.max(start, now - 5 * 60_000)).toISOString()
    const intervals = await openf1Get<OpenInterval[]>(
      `/intervals?session_key=${session.session_key}&date>=${encodeURIComponent(windowStart)}`,
      20,
    )
    const latestIv = new Map<number, OpenInterval>()
    for (const row of intervals ?? []) {
      const prev = latestIv.get(row.driver_number)
      if (!prev || row.date > prev.date) latestIv.set(row.driver_number, row)
    }

    standings = [...latestPos.values()]
      .sort((a, b) => a.position - b.position)
      .map((p) => {
        const d = byNumber.get(p.driver_number)
        const iv = latestIv.get(p.driver_number)
        return {
          position: p.position,
          code: (d?.name_acronym || `#${p.driver_number}`).toUpperCase(),
          name: d?.full_name ?? `#${p.driver_number}`,
          team: d?.team_name ?? '',
          color: d?.team_colour ? `#${d.team_colour}` : '#E10600',
          number: p.driver_number,
          gap: fmtGap(iv?.gap_to_leader, p.position),
          status: null,
        }
      })
  }

  const control = [...(controlRows ?? [])]
    .filter((c) => c.message)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 8)
    .map((c) => ({
      date: c.date,
      category: c.category || 'Other',
      flag: c.flag,
      message: c.message || '',
      lap: c.lap_number,
    }))

  const latestFlag =
    control.find((c) => c.flag && !/BLUE/i.test(c.flag))?.flag ??
    control.find((c) => c.flag)?.flag ??
    null

  const payload: LiveBoard = {
    circuitId,
    year: session.year,
    sessionKey: session.session_key,
    sessionName: session.session_name,
    circuitName: session.circuit_short_name,
    live,
    updatedAt: new Date().toISOString(),
    flag: latestFlag,
    standings,
    control,
  }

  return NextResponse.json(payload, {
    headers: {
      'Cache-Control': live
        ? 'public, s-maxage=20, stale-while-revalidate=60'
        : 'public, s-maxage=600, stale-while-revalidate=3600',
    },
  })
}

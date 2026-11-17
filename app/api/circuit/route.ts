import { NextRequest, NextResponse } from 'next/server'
import { openf1CircuitKey, openf1Get } from '@/lib/openf1'

export type CircuitCorner = {
  number: number
  letter?: string
  /** Сырая дистанция MultiViewer (не метры трассы). */
  length: number
  /** Доля круга 0…1 от линии старта. */
  progress: number
}

export type CircuitProfile = {
  circuitId: string
  circuitKey: number
  name: string
  shortName: string
  location: string
  country: string
  countryCode: string
  countryFlag?: string
  type?: string
  image?: string
  year: number
  corners: CircuitCorner[]
  pitLoss?: { normal: string; sc: string; vsc: string }
}

type OpenMeeting = {
  circuit_key: number
  circuit_short_name: string
  circuit_type?: string
  circuit_info_url?: string
  circuit_image?: string
  location: string
  country_name: string
  country_code: string
  country_flag?: string
  year: number
  date_start: string
}

type MvCorner = {
  number: number
  letter?: string
  length?: number
  trackPosition?: { x: number; y: number }
}

type MvCircuit = {
  circuitName?: string
  corners?: MvCorner[]
  pitLoss?: { normal?: string; sc?: string; vsc?: string }
  year?: number
  x?: number[]
  y?: number[]
}

function mvLapUnits(mv: MvCircuit) {
  const xs = mv.x
  const ys = mv.y
  if (xs?.length && ys?.length && xs.length === ys.length) {
    let total = 0
    for (let i = 1; i < xs.length; i++) {
      total += Math.hypot(xs[i]! - xs[i - 1]!, ys[i]! - ys[i - 1]!)
    }
    if (total > 0) return total
  }
  const maxCorner = Math.max(0, ...(mv.corners ?? []).map((c) => Number(c.length) || 0))
  return maxCorner || 1
}

async function getMv(url: string): Promise<MvCircuit | null> {
  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 86_400 },
    })
    if (!res.ok) return null
    return (await res.json()) as MvCircuit
  } catch {
    return null
  }
}

export async function GET(req: NextRequest) {
  const circuitId = req.nextUrl.searchParams.get('circuit') ?? ''
  const key = openf1CircuitKey(circuitId)
  if (!key) return NextResponse.json({ error: 'no data for circuit' }, { status: 404 })

  const meetings = await openf1Get<OpenMeeting[]>(`/meetings?circuit_key=${key}`)
  if (!meetings?.length) return NextResponse.json({ error: 'no meetings' }, { status: 404 })

  const now = Date.now()
  const sorted = [...meetings].sort((a, b) => b.year - a.year || b.date_start.localeCompare(a.date_start))
  const meeting =
    sorted.find((m) => new Date(m.date_start).getTime() <= now) ?? sorted[0]

  let mv: MvCircuit | null = null
  if (meeting.circuit_info_url) {
    mv = await getMv(meeting.circuit_info_url)
  }
  // Fallback: try current/previous year by key if URL missing or failed
  if (!mv) {
    for (const year of [meeting.year, meeting.year - 1, meeting.year - 2]) {
      mv = await getMv(`https://api.multiviewer.app/api/v1/circuits/${key}/${year}`)
      if (mv?.corners?.length) break
    }
  }

  const denom = mv ? mvLapUnits(mv) : 1
  const corners: CircuitCorner[] = (mv?.corners ?? [])
    .filter((c) => Number.isFinite(c.number) && Number.isFinite(c.length))
    .map((c) => {
      const length = Number(c.length)
      return {
        number: c.number,
        letter: c.letter || undefined,
        length,
        progress: Math.min(0.999, Math.max(0, length / denom)),
      }
    })
    .sort((a, b) => a.progress - b.progress || a.number - b.number)

  const pit = mv?.pitLoss
  const payload: CircuitProfile = {
    circuitId,
    circuitKey: key,
    name: mv?.circuitName || meeting.circuit_short_name,
    shortName: meeting.circuit_short_name,
    location: meeting.location,
    country: meeting.country_name,
    countryCode: meeting.country_code,
    countryFlag: meeting.country_flag,
    type: meeting.circuit_type,
    image: meeting.circuit_image,
    year: meeting.year,
    corners,
    pitLoss:
      pit?.normal && pit.sc && pit.vsc
        ? { normal: pit.normal, sc: pit.sc, vsc: pit.vsc }
        : undefined,
  }

  return NextResponse.json(payload, {
    headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' },
  })
}

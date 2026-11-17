import { NextRequest, NextResponse } from 'next/server'

const UPSTREAM = 'https://api.jolpi.ca/ergast/f1'
const UA = 'BOXBOX/1.0 (+personal; vercel)'

export type LapRecord = {
  circuitId: string
  time: string
  seconds: number
  year: string
  round: string
  raceName: string
  driver: string
  code: string
  team: string
  lap?: string
  avgSpeed?: string
}

type JolpicaResult = {
  Driver: {
    code?: string
    givenName: string
    familyName: string
  }
  Constructor?: { name: string }
  FastestLap?: {
    rank?: string
    lap?: string
    Time?: { time: string }
    AverageSpeed?: { speed: string; units?: string }
  }
}

type JolpicaRace = {
  season: string
  round: string
  raceName: string
  Results?: JolpicaResult[]
}

function parseLapTime(time: string) {
  const [m, rest] = time.split(':')
  if (!rest) return Number.NaN
  return Number(m) * 60 + Number(rest)
}

export async function GET(req: NextRequest) {
  const circuitId = req.nextUrl.searchParams.get('circuit') ?? ''
  if (!circuitId) return NextResponse.json({ error: 'circuit required' }, { status: 400 })

  try {
    const url = `${UPSTREAM}/circuits/${encodeURIComponent(circuitId)}/results.json?limit=200`
    const res = await fetch(url, {
      headers: { Accept: 'application/json', 'User-Agent': UA },
      next: { revalidate: 3600 },
    })
    if (!res.ok) {
      return NextResponse.json({ error: 'jolpica error' }, { status: res.status })
    }

    const data = (await res.json()) as {
      MRData: { RaceTable: { Races: JolpicaRace[] } }
    }
    const races = data.MRData.RaceTable.Races ?? []

    let best: LapRecord | null = null
    for (const race of races) {
      for (const row of race.Results ?? []) {
        const fl = row.FastestLap
        if (!fl || String(fl.rank) !== '1' || !fl.Time?.time) continue
        const seconds = parseLapTime(fl.Time.time)
        if (!Number.isFinite(seconds)) continue
        if (best && seconds >= best.seconds) continue

        best = {
          circuitId,
          time: fl.Time.time,
          seconds,
          year: race.season,
          round: race.round,
          raceName: race.raceName,
          driver: `${row.Driver.givenName} ${row.Driver.familyName}`,
          code: (row.Driver.code ?? row.Driver.familyName.slice(0, 3)).toUpperCase(),
          team: row.Constructor?.name ?? '',
          lap: fl.lap,
          avgSpeed: fl.AverageSpeed?.speed,
        }
      }
    }

    if (!best) return NextResponse.json({ error: 'no lap record' }, { status: 404 })

    return NextResponse.json(best, {
      headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' },
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'lap record unavailable', detail: error instanceof Error ? error.message : 'unknown' },
      { status: 502 },
    )
  }
}

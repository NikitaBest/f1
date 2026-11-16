/** Types + client helpers for enriched duel (H2H + OpenF1 lap). */

export type DuelH2H = {
  races: number
  aAhead: number
  bAhead: number
  ties: number
  aPoints: number
  bPoints: number
}

export type DuelLapSide = {
  code: string
  number: number
  lapNumber: number
  duration: number
  sectors: [number, number, number]
}

export type DuelLapPoint = {
  /** 0..1 progress along the lap */
  t: number
  speedA: number
  speedB: number
  throttleA: number
  throttleB: number
  brakeA: number
  brakeB: number
}

export type DuelLapCompare = {
  circuit: string
  sessionKey: number
  a: DuelLapSide
  b: DuelLapSide
  delta: number
  series: DuelLapPoint[]
}

export type DuelExtra = {
  h2h: DuelH2H | null
  lap: DuelLapCompare | null
  error?: string | null
}

export async function fetchDuelExtra(codeA: string, codeB: string): Promise<DuelExtra> {
  const qs = new URLSearchParams({ a: codeA, b: codeB })
  const res = await fetch(`/api/duel?${qs}`, { headers: { Accept: 'application/json' } })
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null
    throw new Error(body?.error ?? `Duel API ${res.status}`)
  }
  return res.json() as Promise<DuelExtra>
}

export function formatLap(sec: number) {
  if (!Number.isFinite(sec) || sec <= 0) return '—'
  const m = Math.floor(sec / 60)
  const s = sec - m * 60
  return `${m}:${s.toFixed(3).padStart(6, '0')}`
}

export function formatDelta(sec: number) {
  if (!Number.isFinite(sec)) return '—'
  const sign = sec > 0 ? '+' : ''
  return `${sign}${sec.toFixed(3)}с`
}

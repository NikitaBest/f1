/** Shared OpenF1 helpers (circuit keys + fetch). */

export const OPENF1_UPSTREAM = 'https://api.openf1.org/v1'

/** circuitId из Jolpica → circuit_key из OpenF1 */
export const OPENF1_CIRCUIT_KEY: Record<string, number> = {
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

export function openf1CircuitKey(circuitId?: string | null) {
  if (!circuitId) return undefined
  return OPENF1_CIRCUIT_KEY[circuitId]
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** Fetch OpenF1 with short retries on 429 / 5xx (weekend hub fires many calls at once). */
export async function openf1Get<T>(path: string, revalidate = 3600): Promise<T | null> {
  const url = `${OPENF1_UPSTREAM}${path}`
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { Accept: 'application/json' },
        ...(revalidate <= 0 ? { cache: 'no-store' as const } : { next: { revalidate } }),
      })
      if (res.status === 429 || res.status >= 500) {
        await sleep(250 * (attempt + 1) + Math.random() * 250)
        continue
      }
      if (!res.ok) return null
      return (await res.json()) as T
    } catch {
      await sleep(200 * (attempt + 1))
    }
  }
  return null
}

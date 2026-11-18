'use client'

import useSWR from 'swr'

const fetcher = async (url: string) => {
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error(`Request failed: ${url}`)
  return res.json()
}

/** Данные уикенда по трассе: общий кэш SWR для блоков страницы и превью плиток. */
export function useWk<T>(path: string, circuitId?: string, refreshMs?: number) {
  const key = circuitId ? `/api/${path}?circuit=${encodeURIComponent(circuitId)}` : null
  return useSWR<T>(key, fetcher, {
    revalidateOnFocus: false,
    shouldRetryOnError: true,
    errorRetryCount: 3,
    errorRetryInterval: 1200,
    dedupingInterval: 60_000,
    refreshInterval: refreshMs,
  })
}

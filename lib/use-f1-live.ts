'use client'

import { useCallback, useEffect, useState } from 'react'
import { actions } from './store'
import {
  fetchConstructorStandings,
  fetchDriverStandings,
  fetchLastResults,
  fetchSeasonCalendar,
  type ConstructorStanding,
  type DriverStanding,
  type LastRaceResults,
} from './jolpica'

export type F1LiveState = {
  loading: boolean
  syncing: boolean
  error: string | null
  season: string
  drivers: DriverStanding[]
  constructors: ConstructorStanding[]
  lastRace: LastRaceResults | null
  syncedAt: number | null
  syncCalendar: () => Promise<void>
  refreshLive: () => Promise<void>
}

const SYNC_FLAG = 'boxbox:f1-synced-season'

export function useF1Live(autoSyncCalendar = true): F1LiveState {
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [season, setSeason] = useState(String(new Date().getFullYear()))
  const [drivers, setDrivers] = useState<DriverStanding[]>([])
  const [constructors, setConstructors] = useState<ConstructorStanding[]>([])
  const [lastRace, setLastRace] = useState<LastRaceResults | null>(null)
  const [syncedAt, setSyncedAt] = useState<number | null>(null)

  const syncCalendar = useCallback(async () => {
    setSyncing(true)
    setError(null)
    try {
      const cal = await fetchSeasonCalendar('current')
      actions.setEvents(cal.events)
      setSeason(cal.season)
      try {
        localStorage.setItem(SYNC_FLAG, cal.season)
      } catch {}
      setSyncedAt(Date.now())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось загрузить календарь')
    } finally {
      setSyncing(false)
    }
  }, [])

  const refreshLive = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [d, c, last] = await Promise.all([
        fetchDriverStandings('current'),
        fetchConstructorStandings('current'),
        fetchLastResults(),
      ])
      setSeason(d.season || c.season)
      setDrivers(d.standings)
      setConstructors(c.standings)
      setLastRace(last)
      setSyncedAt(Date.now())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось загрузить данные F1')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const synced = typeof window !== 'undefined' ? localStorage.getItem(SYNC_FLAG) : null
        if (autoSyncCalendar && !synced) {
          if (!cancelled) await syncCalendar()
        } else if (autoSyncCalendar && synced) {
          // тихо обновляем календарь в фоне раз за сессию
          void syncCalendar()
        }
      } catch {}
      if (!cancelled) await refreshLive()
    })()
    return () => {
      cancelled = true
    }
  }, [autoSyncCalendar, refreshLive, syncCalendar])

  return {
    loading,
    syncing,
    error,
    season,
    drivers,
    constructors,
    lastRace,
    syncedAt,
    syncCalendar,
    refreshLive,
  }
}

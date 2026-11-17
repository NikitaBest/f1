'use client'

import { Pause, Play } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { TeamRadioPayload } from '@/app/api/team-radio/route'
import { useTheme } from '@/lib/store'
import { PilotAvatar } from './pilot-avatar'

function timeOf(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export function WeekendTeamRadio({ circuitId }: { circuitId: string }) {
  const theme = useTheme()
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [data, setData] = useState<TeamRadioPayload | null>(null)
  const [error, setError] = useState(false)
  const [filter, setFilter] = useState<string | 'all'>('all')
  const [playing, setPlaying] = useState<string | null>(null)
  const [playError, setPlayError] = useState(false)

  useEffect(() => {
    let cancelled = false
    setData(null)
    setError(false)
    setFilter('all')
    setPlaying(null)
    setPlayError(false)
    fetch(`/api/team-radio?circuit=${encodeURIComponent(circuitId)}`)
      .then(async (res) => {
        if (!res.ok) throw new Error('no radio')
        return res.json() as Promise<TeamRadioPayload>
      })
      .then((payload) => {
        if (!cancelled) setData(payload)
      })
      .catch(() => {
        if (!cancelled) {
          setError(true)
          setData(null)
        }
      })
    return () => {
      cancelled = true
      audioRef.current?.pause()
    }
  }, [circuitId])

  const clips = useMemo(() => {
    if (!data) return []
    if (filter === 'all') return data.clips
    return data.clips.filter((c) => c.code === filter)
  }, [data, filter])

  const toggle = async (url: string) => {
    const el = audioRef.current
    if (!el) return
    setPlayError(false)
    if (playing === url && !el.paused) {
      el.pause()
      setPlaying(null)
      return
    }
    const abs = new URL(url, window.location.origin).href
    if (el.src !== abs) {
      el.src = url
      el.load()
    }
    try {
      await el.play()
      setPlaying(url)
    } catch {
      setPlaying(null)
      setPlayError(true)
    }
  }

  if (error) return <p className="wk-live-empty">Нет записей team radio.</p>
  if (!data) return <p className="wk-live-empty">Загружаем team radio…</p>

  return (
    <section className="wk-radio" aria-label="Team radio">
      <audio
        ref={audioRef}
        preload="none"
        onEnded={() => setPlaying(null)}
        onError={() => {
          setPlaying(null)
          setPlayError(true)
        }}
        onPause={() => {
          if (audioRef.current?.ended) return
          if (audioRef.current?.paused) setPlaying(null)
        }}
      />

      <div className="wk-feed-head">
        <div>
          <span className="eyebrow">Team radio · {data.year}</span>
          <b className="disp">{data.circuitName}</b>
        </div>
        <span className="wk-feed-stat">{data.total} clips</span>
      </div>

      {playError ? <p className="wk-feed-empty">Не удалось воспроизвести клип. Попробуй ещё раз.</p> : null}

      <div className="wk-radio-filters" role="tablist" aria-label="Фильтр пилота">
        <button
          type="button"
          role="tab"
          aria-selected={filter === 'all'}
          onClick={() => setFilter('all')}
        >
          Все
        </button>
        {data.drivers.slice(0, 10).map((d) => (
          <button
            key={d.number}
            type="button"
            role="tab"
            aria-selected={filter === d.code}
            className={d.code === theme.code ? 'fav' : undefined}
            onClick={() => setFilter(d.code)}
          >
            {d.code}
            <small>{d.count}</small>
          </button>
        ))}
      </div>

      {clips.length === 0 ? (
        <p className="wk-feed-empty">Для фильтра записей нет.</p>
      ) : (
        <ol className="wk-feed-list wk-radio-list">
          {clips.map((c) => {
            const active = playing === c.url
            return (
              <li key={`${c.date}-${c.number}`} className={c.code === theme.code ? 'fav' : undefined}>
                <button
                  type="button"
                  className={`wk-radio-play${active ? ' on' : ''}`}
                  aria-label={active ? `Пауза ${c.code}` : `Слушать ${c.code}`}
                  onClick={() => void toggle(c.url)}
                >
                  {active ? <Pause size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}
                </button>
                <span className="debrief-mark">
                  <PilotAvatar code={c.code} />
                  <span className="code">{c.code}</span>
                </span>
                <span className="meta">
                  <b>{c.name.split(' ').slice(-1)[0]}</b>
                  <span>{timeOf(c.date)}</span>
                </span>
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}

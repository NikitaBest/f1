'use client'

import { Pause, Play } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { LiveBoard } from '@/app/api/live/route'
import type { TeamRadioPayload } from '@/app/api/team-radio/route'
import { useTheme } from '@/lib/store'
import { PilotAvatar } from './pilot-avatar'
import { useWk } from './weekend-data'
import { cssVars, timeOf, WxEmpty, WxHead, WxLoading } from './wx-ui'

const BARS = 46
const PAGE = 24
const FALLBACK_COLOR = '#4f7cff'

function waveHeights(seed: string) {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619)
  return Array.from({ length: BARS }, (_, i) => {
    h = Math.imul(h ^ (h >>> 13), 1274126177)
    const envelope = Math.sin((i / (BARS - 1)) * Math.PI)
    const noise = ((h >>> 0) % 100) / 100
    return Math.round(14 + envelope * 54 * (0.35 + noise * 0.65))
  })
}

function surname(name: string) {
  const parts = name.trim().split(/\s+/)
  return (parts[parts.length - 1] ?? name).toUpperCase()
}

export function WeekendTeamRadio({ circuitId }: { circuitId: string }) {
  const theme = useTheme()
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const { data, error } = useWk<TeamRadioPayload>('team-radio', circuitId)
  const { data: board } = useWk<LiveBoard>('live', circuitId, 30_000)
  const [filter, setFilter] = useState<string>('all')
  const [playing, setPlaying] = useState<string | null>(null)
  const [playError, setPlayError] = useState(false)
  const [limit, setLimit] = useState(PAGE)

  useEffect(() => {
    const el = audioRef.current
    return () => el?.pause()
  }, [])

  const colors = useMemo(() => {
    const map = new Map<string, string>()
    board?.standings.forEach((s) => map.set(s.code, s.color))
    return map
  }, [board])

  const clips = useMemo(() => {
    if (!data) return []
    return filter === 'all' ? data.clips : data.clips.filter((c) => c.code === filter)
  }, [data, filter])

  const numbered = useMemo(() => {
    const counters = new Map<string, number>()
    return clips.map((c) => {
      const n = (counters.get(c.code) ?? 0) + 1
      counters.set(c.code, n)
      return { clip: c, n }
    })
  }, [clips])

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

  if (error && !data) return <WxEmpty>Нет записей team radio.</WxEmpty>
  if (!data) return <WxLoading />

  const visible = numbered.slice(0, limit)

  return (
    <section className="wx wx-radio" aria-label="Team radio">
      <audio
        ref={audioRef}
        preload="none"
        onEnded={() => setPlaying(null)}
        onError={() => {
          setPlaying(null)
          setPlayError(true)
        }}
        onPause={() => {
          if (!audioRef.current?.ended && audioRef.current?.paused) setPlaying(null)
        }}
      />

      <WxHead
        eyebrow={`Team radio · ${data.year}`}
        title={data.circuitName}
        aside={
          <span className="wx-count">
            <b className="num">{data.total}</b>
            <small>записей</small>
          </span>
        }
      />

      <div className="wx-chips" role="tablist" aria-label="Фильтр пилота">
        <button
          type="button"
          role="tab"
          aria-selected={filter === 'all'}
          onClick={() => {
            setFilter('all')
            setLimit(PAGE)
          }}
        >
          Все
        </button>
        {data.drivers.slice(0, 12).map((d) => (
          <button
            key={d.number}
            type="button"
            role="tab"
            aria-selected={filter === d.code}
            className={d.code === theme.code ? 'fav' : undefined}
            onClick={() => {
              setFilter(d.code)
              setLimit(PAGE)
            }}
          >
            {d.code}
            <small>{d.count}</small>
          </button>
        ))}
      </div>

      {playError ? <WxEmpty>Не удалось воспроизвести клип. Попробуй ещё раз.</WxEmpty> : null}

      {visible.length === 0 ? (
        <WxEmpty>Для фильтра записей нет.</WxEmpty>
      ) : (
        <ol className="wx-rc-list">
          {visible.map(({ clip, n }, i) => {
            const on = playing === clip.url
            const color = colors.get(clip.code) ?? FALLBACK_COLOR
            return (
              <li key={`${clip.date}-${clip.number}`} style={cssVars({ '--tc': color, '--i': Math.min(i, 10) })}>
                <button
                  type="button"
                  className={`wx-rc${on ? ' on' : ''}${clip.code === theme.code ? ' fav' : ''}`}
                  aria-label={`${on ? 'Пауза' : 'Слушать'} ${clip.name}, запись ${n}`}
                  aria-pressed={on}
                  onClick={() => void toggle(clip.url)}
                >
                  <span className="wx-rc-top">
                    <span className="wx-rc-name">
                      <b>{surname(clip.name)}</b>
                      <i>RADIO</i>
                    </span>
                    <PilotAvatar code={clip.code} className="wx-av sm" />
                  </span>
                  <span className="wx-rc-mid">
                    <span className="wx-rc-no num" aria-hidden="true">
                      {n}
                    </span>
                    <span className="wx-rc-wave" aria-hidden="true">
                      {waveHeights(clip.url).map((h, k) => (
                        <u key={k} style={cssVars({ '--h': `${h}%`, '--k': k })} />
                      ))}
                    </span>
                  </span>
                  <span className="wx-rc-foot">
                    <span className="wx-rc-play" aria-hidden="true">
                      {on ? <Pause size={14} /> : <Play size={14} />}
                    </span>
                    <span className="wx-rc-quote num">
                      &ldquo;TEAM RADIO · {timeOf(clip.date, true)}&rdquo;
                    </span>
                  </span>
                </button>
              </li>
            )
          })}
        </ol>
      )}

      {numbered.length > limit ? (
        <button type="button" className="wx-more" onClick={() => setLimit((v) => v + PAGE)}>
          Показать ещё · {numbered.length - limit}
        </button>
      ) : null}
    </section>
  )
}

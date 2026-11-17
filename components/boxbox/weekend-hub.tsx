'use client'

import { useEffect, useRef, useState, type ComponentType, type PointerEvent as ReactPointerEvent } from 'react'
import { createPortal } from 'react-dom'
import { Activity, ArrowUpRight, LayoutGrid, Mic, Route, Timer, Tv, X } from 'lucide-react'
import { TrackLap } from './track-lap'
import { WeekendGrid } from './weekend-grid'
import { WeekendLive } from './weekend-live'
import { WeekendRaceFeed } from './weekend-race-feed'
import { WeekendTeamRadio } from './weekend-team-radio'
import { WeekendTelemetry } from './weekend-telemetry'

export type WeekendPhase = 'before' | 'live' | 'after'

type FeatureKey = 'live' | 'grid' | 'feed' | 'radio' | 'telem' | 'lap'

type Feature = {
  key: FeatureKey
  title: string
  sub: string
  sheetTitle: string
  icon: ComponentType<{ size?: number; 'aria-hidden'?: boolean }>
  render: (circuitId: string) => React.ReactNode
}

const FEATURES: Record<FeatureKey, Feature> = {
  live: {
    key: 'live',
    title: 'Эфир',
    sub: 'Позиции, интервалы и флаги в реальном времени',
    sheetTitle: 'Эфир и результат',
    icon: Tv,
    render: (id) => <WeekendLive circuitId={id} />,
  },
  grid: {
    key: 'grid',
    title: 'Решётка',
    sub: 'Стартовое построение',
    sheetTitle: 'Стартовая решётка',
    icon: LayoutGrid,
    render: (id) => <WeekendGrid circuitId={id} />,
  },
  feed: {
    key: 'feed',
    title: 'Питы',
    sub: 'Остановки и обгоны',
    sheetTitle: 'Питы и обгоны',
    icon: Timer,
    render: (id) => <WeekendRaceFeed circuitId={id} />,
  },
  radio: {
    key: 'radio',
    title: 'Radio',
    sub: 'Переговоры гонщиков',
    sheetTitle: 'Team radio',
    icon: Mic,
    render: (id) => <WeekendTeamRadio circuitId={id} />,
  },
  telem: {
    key: 'telem',
    title: 'Телеметрия',
    sub: 'GPS и скорость',
    sheetTitle: 'GPS и телеметрия',
    icon: Activity,
    render: (id) => <WeekendTelemetry circuitId={id} />,
  },
  lap: {
    key: 'lap',
    title: 'Круг трассы',
    sub: 'Повороты, DRS и сектора на карте',
    sheetTitle: 'Круг трассы',
    icon: Route,
    render: (id) => <TrackLap circuitId={id} />,
  },
}

const PHASE_CHIP: Record<WeekendPhase, string> = {
  before: 'Скоро',
  live: 'Live',
  after: 'Итоги',
}

function Sheet({
  feature,
  circuitId,
  eyebrow,
  host,
  onClose,
}: {
  feature: Feature
  circuitId: string
  eyebrow: string
  host: HTMLElement
  onClose: () => void
}) {
  const [drag, setDrag] = useState(0)
  const [dragging, setDragging] = useState(false)
  const startY = useRef(0)
  const closeRef = useRef<HTMLButtonElement>(null)
  const Icon = feature.icon

  useEffect(() => {
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const onDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    startY.current = e.clientY
    setDragging(true)
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const onMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragging) return
    setDrag(Math.max(0, e.clientY - startY.current))
  }
  const onUp = () => {
    if (!dragging) return
    setDragging(false)
    if (drag > 110) onClose()
    else setDrag(0)
  }

  return createPortal(
    <div className="bb-sheet-root">
      <div className="bb-sheet-backdrop" onClick={onClose} aria-hidden="true" />
      <section
        className="bb-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={feature.sheetTitle}
        style={{ transform: `translateY(${drag}px)`, transition: dragging ? 'none' : undefined }}
      >
        <header
          className="bb-sheet-head"
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
        >
          <span className="bb-sheet-grab" aria-hidden="true" />
          <div className="bb-sheet-row">
            <span className="hub-ico" aria-hidden="true">
              <Icon size={18} aria-hidden />
            </span>
            <div className="bb-sheet-txt">
              <span className="eyebrow">{eyebrow}</span>
              <h3 className="disp">{feature.sheetTitle}</h3>
            </div>
            <button
              ref={closeRef}
              type="button"
              className="bb-sheet-x"
              onClick={onClose}
              onPointerDown={(e) => e.stopPropagation()}
              aria-label="Закрыть"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>
        </header>
        <div className="bb-sheet-body">{feature.render(circuitId)}</div>
      </section>
    </div>,
    host,
  )
}

/** Плитки всех возможностей уикенда; содержимое открывается в нижней шторке. */
export function WeekendHub({
  circuitId,
  canLap,
  phase,
  eyebrow,
}: {
  circuitId: string
  canLap: boolean
  phase: WeekendPhase
  eyebrow: string
}) {
  const [open, setOpen] = useState<FeatureKey | null>(null)
  const [host, setHost] = useState<HTMLElement | null>(null)
  const anchor = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setHost(anchor.current?.closest<HTMLElement>('.bb-app') ?? null)
  }, [])

  const tiles: FeatureKey[] = ['live', 'grid', 'feed', 'radio', 'telem', ...(canLap ? (['lap'] as const) : [])]
  const active = open ? FEATURES[open] : null

  return (
    <div className="hub" ref={anchor}>
      <div className="hub-top">
        <span className="eyebrow">Возможности уикенда</span>
        <span className="hub-count num">{tiles.length}</span>
      </div>
      <div className="hub-grid">
        {tiles.map((key) => {
          const f = FEATURES[key]
          const Icon = f.icon
          const hero = key === 'live'
          const wide = hero || key === 'lap'
          return (
            <button
              key={key}
              type="button"
              className={`hub-tile hub-${key} ${wide ? 'wide' : ''} ${hero ? 'hero' : ''}`}
              onClick={() => setOpen(key)}
              aria-haspopup="dialog"
            >
              <span className="hub-tile-top">
                <span className="hub-ico" aria-hidden="true">
                  <Icon size={18} aria-hidden />
                </span>
                {hero ? (
                  <span className={`hub-chip ${phase}`}>
                    {phase === 'live' ? <i aria-hidden="true" /> : null}
                    {PHASE_CHIP[phase]}
                  </span>
                ) : null}
              </span>
              <span className="hub-tile-bot">
                <span className="hub-txt">
                  <span className="disp hub-title">{f.title}</span>
                  <span className="hub-sub">{f.sub}</span>
                </span>
                <span className="hub-go" aria-hidden="true">
                  <ArrowUpRight size={16} />
                </span>
              </span>
            </button>
          )
        })}
      </div>
      {active && host ? (
        <Sheet
          feature={active}
          circuitId={circuitId}
          eyebrow={eyebrow}
          host={host}
          onClose={() => setOpen(null)}
        />
      ) : null}
    </div>
  )
}

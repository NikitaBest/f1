'use client'

import { useEffect, useRef, useState, type ComponentType, type PointerEvent as ReactPointerEvent } from 'react'
import { createPortal } from 'react-dom'
import { Activity, ArrowUpRight, LayoutGrid, Mic, Timer, Tv, X } from 'lucide-react'
import { WeekendGrid } from './weekend-grid'
import { WeekendLive } from './weekend-live'
import { FeedPreview, GridPreview, LivePreview, RadioPreview, TelemPreview } from './weekend-previews'
import { WeekendRaceFeed } from './weekend-race-feed'
import { WeekendTeamRadio } from './weekend-team-radio'
import { WeekendTelemetry } from './weekend-telemetry'

export type WeekendPhase = 'before' | 'live' | 'after'

type FeatureKey = 'live' | 'grid' | 'feed' | 'radio' | 'telem'

type Feature = {
  key: FeatureKey
  tag: string
  title: string
  sheetTitle: string
  icon: ComponentType<{ size?: number; 'aria-hidden'?: boolean }>
  preview: (circuitId: string) => React.ReactNode
  render: (circuitId: string) => React.ReactNode
}

const FEATURES: Record<FeatureKey, Feature> = {
  live: {
    key: 'live',
    tag: 'Live timing',
    title: 'Эфир',
    sheetTitle: 'Эфир и результат',
    icon: Tv,
    preview: (id) => <LivePreview circuitId={id} />,
    render: (id) => <WeekendLive circuitId={id} />,
  },
  grid: {
    key: 'grid',
    tag: 'Grid',
    title: 'Решётка',
    sheetTitle: 'Стартовая решётка',
    icon: LayoutGrid,
    preview: (id) => <GridPreview circuitId={id} />,
    render: (id) => <WeekendGrid circuitId={id} />,
  },
  feed: {
    key: 'feed',
    tag: 'Pit wall',
    title: 'Питы',
    sheetTitle: 'Питы и обгоны',
    icon: Timer,
    preview: (id) => <FeedPreview circuitId={id} />,
    render: (id) => <WeekendRaceFeed circuitId={id} />,
  },
  radio: {
    key: 'radio',
    tag: 'Team radio',
    title: 'Radio',
    sheetTitle: 'Team radio',
    icon: Mic,
    preview: (id) => <RadioPreview circuitId={id} />,
    render: (id) => <WeekendTeamRadio circuitId={id} />,
  },
  telem: {
    key: 'telem',
    tag: 'GPS',
    title: 'Телеметрия',
    sheetTitle: 'GPS и телеметрия',
    icon: Activity,
    preview: (id) => <TelemPreview circuitId={id} />,
    render: (id) => <WeekendTelemetry circuitId={id} />,
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
        className="bb-sheet wp-sheet"
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
            <span className="wp-ico" aria-hidden="true">
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

/** Плитки возможностей уикенда с живым превью данных; полный контент открывается в шторке. */
export function WeekendHub({
  circuitId,
  phase,
  eyebrow,
}: {
  circuitId: string
  phase: WeekendPhase
  eyebrow: string
}) {
  const [open, setOpen] = useState<FeatureKey | null>(null)
  const [host, setHost] = useState<HTMLElement | null>(null)
  const anchor = useRef<HTMLElement>(null)

  useEffect(() => {
    setHost(anchor.current?.closest<HTMLElement>('.bb-app') ?? null)
  }, [])

  const tiles: FeatureKey[] = ['live', 'grid', 'feed', 'radio', 'telem']
  const active = open ? FEATURES[open] : null

  return (
    <section className="wp-blk wp-hub" ref={anchor} aria-label="Возможности уикенда">
      <div className="wp-sec">
        <span className="wp-tag">Модули уикенда</span>
        <span className="wp-tag dim num">{tiles.length} шт</span>
      </div>
      <div className="wp-hub-grid">
        {tiles.map((key) => {
          const f = FEATURES[key]
          const Icon = f.icon
          const hero = key === 'live'
          const wide = hero
          return (
            <button
              key={key}
              type="button"
              className={`wp-tile wp-tile-${key} ${wide ? 'wide' : ''} ${hero ? 'hero' : ''}`}
              onClick={() => setOpen(key)}
              aria-haspopup="dialog"
            >
              <span className="wp-tile-head">
                <span className="wp-ico" aria-hidden="true">
                  <Icon size={16} aria-hidden />
                </span>
                <span className="wp-tile-tag">{f.tag}</span>
                {hero ? (
                  <span className={`wp-chip ${phase}`}>
                    {phase === 'live' ? <i aria-hidden="true" /> : null}
                    {PHASE_CHIP[phase]}
                  </span>
                ) : null}
                <span className="wp-go" aria-hidden="true">
                  <ArrowUpRight size={15} />
                </span>
              </span>
              <span className="wp-tile-title disp">{f.title}</span>
              <span className="wp-tile-body">{f.preview(circuitId)}</span>
            </button>
          )
        })}
      </div>
      {active && host ? (
        <Sheet feature={active} circuitId={circuitId} eyebrow={eyebrow} host={host} onClose={() => setOpen(null)} />
      ) : null}
    </section>
  )
}

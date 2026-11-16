'use client'

import { useEffect, useMemo, useState } from 'react'
import { Check, ChevronsUpDown, Search, Swords, X } from 'lucide-react'
import {
  buildDuel,
  defaultDuelCodes,
  duelBarWidths,
  type DuelReport,
} from '@/lib/compare'
import {
  fetchDuelExtra,
  formatDelta,
  formatLap,
  type DuelExtra,
  type DuelLapCompare,
} from '@/lib/duel-extra'
import { useTheme } from '@/lib/store'
import type { DriverStanding } from '@/lib/jolpica'
import type { F1LiveState } from '@/lib/use-f1-live'
import { PilotAvatar } from './pilot-avatar'

function codeOf(d: { code?: string; familyName: string }) {
  return (d.code ?? d.familyName.slice(0, 3)).toUpperCase()
}

function SideCard({
  side,
  tone,
  onPick,
}: {
  side: DuelReport['a']
  tone: 'a' | 'b'
  onPick: () => void
}) {
  return (
    <button type="button" className={`duel-side duel-${tone}`} onClick={onPick} aria-label={`Выбрать пилота ${tone === 'a' ? 'A' : 'B'}`}>
      <PilotAvatar givenName={side.givenName} familyName={side.familyName} code={side.code} />
      <div className="duel-side-meta">
        <span className="code">{side.code}</span>
        <b className="disp duel-name">
          {side.givenName}
          <br />
          {side.familyName}
        </b>
        <span className="duel-team">{side.team}</span>
      </div>
      <div className="duel-chip">
        <span>P{side.position}</span>
        <b>{side.points}</b>
      </div>
      <span className="duel-change">
        Сменить
        <ChevronsUpDown size={14} aria-hidden="true" />
      </span>
    </button>
  )
}

function DriverPickerSheet({
  title,
  drivers,
  selected,
  disabledCode,
  onPick,
  onClose,
}: {
  title: string
  drivers: DriverStanding[]
  selected: string
  disabledCode: string
  onPick: (code: string) => void
  onClose: () => void
}) {
  const [q, setQ] = useState('')
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return drivers.filter((r) => {
      const code = codeOf(r.Driver)
      if (code === disabledCode) return false
      if (!needle) return true
      const hay = `${code} ${r.Driver.givenName} ${r.Driver.familyName} ${r.Constructors[0]?.name ?? ''}`.toLowerCase()
      return hay.includes(needle)
    })
  }, [drivers, disabledCode, q])

  return (
    <div className="duel-sheet" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" className="duel-sheet-backdrop" aria-label="Закрыть" onClick={onClose} />
      <div className="duel-sheet-panel">
        <div className="duel-sheet-top">
          <div>
            <span className="eyebrow">Выбор</span>
            <h3 className="disp">{title}</h3>
          </div>
          <button type="button" className="duel-sheet-close" onClick={onClose} aria-label="Закрыть">
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <label className="duel-search">
          <Search size={16} aria-hidden="true" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Имя, код или команда"
            autoFocus
          />
        </label>

        <div className="duel-sheet-list" role="listbox" aria-label={title}>
          {filtered.map((r) => {
            const code = codeOf(r.Driver)
            const on = code === selected
            return (
              <button
                key={code}
                type="button"
                role="option"
                aria-selected={on}
                className={`duel-opt${on ? ' is-on' : ''}`}
                onClick={() => {
                  onPick(code)
                  onClose()
                }}
              >
                <PilotAvatar
                  givenName={r.Driver.givenName}
                  familyName={r.Driver.familyName}
                  code={r.Driver.code}
                />
                <span className="duel-opt-meta">
                  <span className="duel-opt-line">
                    <span className="code">{code}</span>
                    <b>
                      {r.Driver.givenName} {r.Driver.familyName}
                    </b>
                  </span>
                  <span className="duel-opt-sub">
                    P{r.position} · {r.points} очк. · {r.Constructors[0]?.name ?? '—'}
                  </span>
                </span>
                {on ? <Check size={18} className="duel-opt-check" aria-hidden="true" /> : null}
              </button>
            )
          })}
          {!filtered.length && <p className="sub">Никого не нашли</p>}
        </div>
      </div>
    </div>
  )
}

function SpeedChart({ lap }: { lap: DuelLapCompare }) {
  const w = 320
  const h = 120
  const padX = 8
  const padY = 10
  const series = lap.series
  if (series.length < 2) return null

  const maxSpeed = Math.max(...series.flatMap((p) => [p.speedA, p.speedB]), 1)
  const xAt = (t: number) => padX + t * (w - padX * 2)
  const yAt = (speed: number) => padY + (1 - speed / maxSpeed) * (h - padY * 2)
  const path = (key: 'speedA' | 'speedB') =>
    series.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xAt(p.t).toFixed(1)} ${yAt(p[key]).toFixed(1)}`).join(' ')

  return (
    <svg className="duel-chart" viewBox={`0 0 ${w} ${h}`} role="img" aria-label="Сравнение скорости на лучшем круге">
      <path d={path('speedA')} className="duel-chart-a" />
      <path d={path('speedB')} className="duel-chart-b" />
    </svg>
  )
}

function ExtraBlocks({
  extra,
  loading,
  error,
  codeA,
  codeB,
}: {
  extra: DuelExtra | null
  loading: boolean
  error: string | null
  codeA: string
  codeB: string
}) {
  if (loading) return <p className="sub">Считаем очные и лучший круг…</p>
  if (error) return <p className="err-note">{error}</p>
  if (!extra) return null

  return (
    <>
      {extra.h2h && (
        <section className="duel-h2h" aria-label="Очные встречи">
          <div className="duel-h2h-top">
            <span className="eyebrow">Очные · сезон</span>
            <span className="duel-h2h-n">{extra.h2h.races} гонок</span>
          </div>
          <div className="duel-h2h-score">
            <b className="disp">{extra.h2h.aAhead}</b>
            <span>финишей выше</span>
            <b className="disp">{extra.h2h.bAhead}</b>
          </div>
          <div className="duel-bars" aria-hidden="true">
            <i
              className="duel-bar duel-bar-a"
              style={{
                width: `${(extra.h2h.aAhead / Math.max(extra.h2h.aAhead, extra.h2h.bAhead, 1)) * 100}%`,
              }}
            />
            <i
              className="duel-bar duel-bar-b"
              style={{
                width: `${(extra.h2h.bAhead / Math.max(extra.h2h.aAhead, extra.h2h.bAhead, 1)) * 100}%`,
              }}
            />
          </div>
          <p className="duel-h2h-note">
            {codeA} набрал в очных <b>{extra.h2h.aPoints}</b> очк. · {codeB} — <b>{extra.h2h.bPoints}</b>
            {extra.h2h.ties ? ` · ничьих/общих сходов: ${extra.h2h.ties}` : ''}
          </p>
        </section>
      )}

      {extra.lap && (
        <section className="duel-lap" aria-label="Лучший круг">
          <div className="duel-h2h-top">
            <span className="eyebrow">Лучший круг · {extra.lap.circuit}</span>
            <span className="duel-h2h-n">OpenF1</span>
          </div>
          <div className="duel-lap-times">
            <div>
              <span className="code">{extra.lap.a.code}</span>
              <b className="disp">{formatLap(extra.lap.a.duration)}</b>
              <span className="duel-opt-sub">круг {extra.lap.a.lapNumber}</span>
            </div>
            <div className="duel-lap-delta">
              <span>{formatDelta(extra.lap.delta)}</span>
              <small>{extra.lap.delta <= 0 ? `${codeA} быстрее` : `${codeB} быстрее`}</small>
            </div>
            <div>
              <span className="code">{extra.lap.b.code}</span>
              <b className="disp">{formatLap(extra.lap.b.duration)}</b>
              <span className="duel-opt-sub">круг {extra.lap.b.lapNumber}</span>
            </div>
          </div>

          <ul className="duel-sectors">
            {[0, 1, 2].map((i) => {
              const sa = extra.lap!.a.sectors[i] ?? 0
              const sb = extra.lap!.b.sectors[i] ?? 0
              const win = sa === sb ? 'even' : sa < sb ? 'a' : 'b'
              return (
                <li key={i}>
                  <b className={win === 'a' ? 'is-win' : undefined}>{sa.toFixed(3)}</b>
                  <span>S{i + 1}</span>
                  <b className={win === 'b' ? 'is-win' : undefined}>{sb.toFixed(3)}</b>
                </li>
              )
            })}
          </ul>

          <SpeedChart lap={extra.lap} />
          <div className="duel-legend" aria-hidden="true">
            <span>
              <i className="duel-dot duel-dot-a" /> {extra.lap.a.code} скорость
            </span>
            <span>
              <i className="duel-dot duel-dot-b" /> {extra.lap.b.code} скорость
            </span>
          </div>
        </section>
      )}

      {extra.error && !extra.h2h && !extra.lap && <p className="err-note">{extra.error}</p>}
    </>
  )
}

export function DuelPanel({ live }: { live: F1LiveState }) {
  const theme = useTheme()
  const [codeA, setCodeA] = useState(theme.code)
  const [codeB, setCodeB] = useState('')
  const [picking, setPicking] = useState<'a' | 'b' | null>(null)
  const [extra, setExtra] = useState<DuelExtra | null>(null)
  const [extraLoading, setExtraLoading] = useState(false)
  const [extraError, setExtraError] = useState<string | null>(null)

  useEffect(() => {
    if (!live.drivers.length) return
    const [a, b] = defaultDuelCodes(theme, live.drivers)
    setCodeA(a)
    setCodeB(b)
  }, [theme, live.drivers])

  useEffect(() => {
    if (!codeA || !codeB || codeA === codeB) return
    let cancelled = false
    setExtraLoading(true)
    setExtraError(null)
    fetchDuelExtra(codeA, codeB)
      .then((data) => {
        if (!cancelled) setExtra(data)
      })
      .catch((e) => {
        if (!cancelled) {
          setExtra(null)
          setExtraError(e instanceof Error ? e.message : 'Не удалось загрузить анализ')
        }
      })
      .finally(() => {
        if (!cancelled) setExtraLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [codeA, codeB])

  const report = useMemo(
    () =>
      buildDuel({
        drivers: live.drivers,
        lastRace: live.lastRace,
        codeA,
        codeB: codeB || codeA,
      }),
    [live.drivers, live.lastRace, codeA, codeB],
  )

  const insights = useMemo(() => {
    const list = [...(report?.insights ?? [])]
    if (extra?.h2h) {
      const { aAhead, bAhead, races } = extra.h2h
      if (aAhead !== bAhead) {
        const tone = aAhead > bAhead ? 'a' : 'b'
        const lead = tone === 'a' ? codeA : codeB
        const wins = Math.max(aAhead, bAhead)
        list.push({
          tone,
          text: `В очных за сезон ${lead} чаще финишировал выше: ${wins} из ${races}.`,
        })
      }
    }
    if (extra?.lap) {
      const faster = extra.lap.delta <= 0 ? 'a' : 'b'
      const lead = faster === 'a' ? extra.lap.a : extra.lap.b
      list.push({
        tone: faster,
        text: `Лучший круг в ${extra.lap.circuit}: ${lead.code} ${formatLap(lead.duration)} (${formatDelta(extra.lap.delta)}).`,
      })
    }
    return list
  }, [report, extra, codeA, codeB])

  if (live.loading && !live.drivers.length) {
    return <p className="sub">Загружаем чемпионат для дуэли…</p>
  }

  if (!live.drivers.length) {
    return <p className="sub">Нет данных пилотов для сравнения.</p>
  }

  return (
    <div className="duel">
      <header className="duel-head">
        <Swords size={18} aria-hidden="true" />
        <div>
          <h2 className="disp duel-title">Дуэль</h2>
          <p>Чемпионат, очные за сезон и лучший круг с телеметрией.</p>
        </div>
      </header>

      {!report ? (
        <p className="err-note">Не удалось собрать пару — обновите сезон.</p>
      ) : (
        <>
          <div className="duel-card">
            <SideCard side={report.a} tone="a" onPick={() => setPicking('a')} />
            <div className="duel-mid" aria-hidden="true">
              <span>VS</span>
            </div>
            <SideCard side={report.b} tone="b" onPick={() => setPicking('b')} />
          </div>

          {report.lastRaceName && (
            <p className="duel-race">
              Последняя гонка: <b>{report.lastRaceName}</b>
            </p>
          )}

          <ul className="duel-stats">
            {report.stats.map((s) => {
              const bars = duelBarWidths(s.a, s.b, s.better)
              const win =
                s.a === s.b ? 'even' : s.better === 'higher' ? (s.a > s.b ? 'a' : 'b') : s.a < s.b ? 'a' : 'b'
              return (
                <li key={s.key} className="duel-stat">
                  <div className="duel-stat-top">
                    <b className={win === 'a' ? 'is-win' : undefined}>{s.a}</b>
                    <span>{s.label}</span>
                    <b className={win === 'b' ? 'is-win' : undefined}>{s.b}</b>
                  </div>
                  <div className="duel-bars" aria-hidden="true">
                    <i className="duel-bar duel-bar-a" style={{ width: `${bars.a}%` }} />
                    <i className="duel-bar duel-bar-b" style={{ width: `${bars.b}%` }} />
                  </div>
                </li>
              )
            })}
          </ul>

          <ExtraBlocks
            extra={extra}
            loading={extraLoading}
            error={extraError}
            codeA={codeA}
            codeB={codeB || codeA}
          />

          <section className="duel-insights" aria-label="Выводы">
            <span className="eyebrow">Анализ</span>
            <ul>
              {insights.map((ins, i) => (
                <li key={i} className={`duel-insight tone-${ins.tone}`}>
                  {ins.text}
                </li>
              ))}
            </ul>
          </section>
        </>
      )}

      {picking && (
        <DriverPickerSheet
          title={picking === 'a' ? 'Пилот A' : 'Пилот B'}
          drivers={live.drivers}
          selected={picking === 'a' ? codeA : codeB}
          disabledCode={picking === 'a' ? codeB : codeA}
          onPick={picking === 'a' ? setCodeA : setCodeB}
          onClose={() => setPicking(null)}
        />
      )}
    </div>
  )
}

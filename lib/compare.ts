import type { DriverStanding, LastRaceResults, RaceResultRow } from './jolpica'
import { isFavDriver, type DriverTheme } from './themes'

export type DuelSide = {
  code: string
  givenName: string
  familyName: string
  team: string
  position: number
  points: number
  wins: number
  last?: {
    position: number
    positionText: string
    points: number
    status: string
    grid?: number
  }
}

export type DuelStat = {
  key: string
  label: string
  a: number
  b: number
  unit?: string
  /** higher is better (points, wins) vs lower (position) */
  better: 'higher' | 'lower'
}

export type DuelInsight = {
  tone: 'a' | 'b' | 'even'
  text: string
}

export type DuelReport = {
  a: DuelSide
  b: DuelSide
  stats: DuelStat[]
  insights: DuelInsight[]
  lastRaceName?: string
}

function codeOf(d: DriverStanding['Driver']) {
  return (d.code ?? d.familyName.slice(0, 3)).toUpperCase()
}

function findStanding(drivers: DriverStanding[], code: string) {
  const c = code.toUpperCase()
  return drivers.find((r) => codeOf(r.Driver) === c || r.Driver.familyName.toUpperCase() === c)
}

function findResult(results: RaceResultRow[] | undefined, code: string, family: string) {
  if (!results) return undefined
  const c = code.toUpperCase()
  return results.find(
    (r) =>
      (r.Driver.code ?? '').toUpperCase() === c ||
      r.Driver.familyName.toUpperCase() === family.toUpperCase(),
  )
}

function sideFrom(row: DriverStanding, last?: RaceResultRow): DuelSide {
  const posText = (last?.positionText ?? last?.position ?? '').toUpperCase()
  return {
    code: codeOf(row.Driver),
    givenName: row.Driver.givenName,
    familyName: row.Driver.familyName,
    team: row.Constructors[0]?.name ?? '—',
    position: Number(row.position) || 99,
    points: Number(row.points) || 0,
    wins: Number(row.wins) || 0,
    last: last
      ? {
          position: Number(last.position) || 99,
          positionText: posText || String(last.position),
          points: Number(last.points) || 0,
          status: last.status ?? '',
          grid: last.grid ? Number(last.grid) : undefined,
        }
      : undefined,
  }
}

function winnerOf(a: number, b: number, better: 'higher' | 'lower'): 'a' | 'b' | 'even' {
  if (a === b) return 'even'
  if (better === 'higher') return a > b ? 'a' : 'b'
  return a < b ? 'a' : 'b'
}

export function defaultDuelCodes(theme: DriverTheme, drivers: DriverStanding[]): [string, string] {
  const fav =
    drivers.find((r) => isFavDriver(theme, r.Driver.code, r.Driver.familyName)) ?? drivers[0]
  const favCode = fav ? codeOf(fav.Driver) : theme.code
  const rival =
    drivers.find((r) => codeOf(r.Driver) !== favCode) ??
    drivers[1] ??
    drivers[0]
  return [favCode, rival ? codeOf(rival.Driver) : favCode]
}

export function buildDuel(input: {
  drivers: DriverStanding[]
  lastRace: LastRaceResults | null
  codeA: string
  codeB: string
}): DuelReport | null {
  const rowA = findStanding(input.drivers, input.codeA)
  const rowB = findStanding(input.drivers, input.codeB)
  if (!rowA || !rowB) return null

  const resA = findResult(input.lastRace?.results, codeOf(rowA.Driver), rowA.Driver.familyName)
  const resB = findResult(input.lastRace?.results, codeOf(rowB.Driver), rowB.Driver.familyName)
  const a = sideFrom(rowA, resA)
  const b = sideFrom(rowB, resB)

  const stats: DuelStat[] = [
    { key: 'pos', label: 'Место в ЧМ', a: a.position, b: b.position, better: 'lower' },
    { key: 'pts', label: 'Очки', a: a.points, b: b.points, better: 'higher' },
    { key: 'wins', label: 'Победы', a: a.wins, b: b.wins, better: 'higher' },
  ]

  if (a.last && b.last) {
    stats.push({
      key: 'last',
      label: 'Финиш (посл. гонка)',
      a: a.last.position,
      b: b.last.position,
      better: 'lower',
    })
    stats.push({
      key: 'lastPts',
      label: 'Очки за гонку',
      a: a.last.points,
      b: b.last.points,
      better: 'higher',
    })
    if (a.last.grid && b.last.grid) {
      stats.push({
        key: 'grid',
        label: 'Старт (сетка)',
        a: a.last.grid,
        b: b.last.grid,
        better: 'lower',
      })
    }
  }

  const insights: DuelInsight[] = []
  const champ = winnerOf(a.position, b.position, 'lower')
  if (champ === 'even') {
    insights.push({ tone: 'even', text: 'В чемпионате сейчас ничья по позиции — редкий паритет.' })
  } else {
    const lead = champ === 'a' ? a : b
    const trail = champ === 'a' ? b : a
    const gap = Math.abs(a.points - b.points)
    insights.push({
      tone: champ,
      text: `${lead.code} выше в кубке (P${lead.position} vs P${trail.position}), разница ${gap} очк.`,
    })
  }

  if (a.wins !== b.wins) {
    const w = a.wins > b.wins ? 'a' : 'b'
    const lead = w === 'a' ? a : b
    insights.push({
      tone: w,
      text: `По победам сезон ведёт ${lead.code}: ${lead.wins}.`,
    })
  }

  if (a.last && b.last) {
    const dnfA = /R|W|E|DNF|DSQ|DNS/i.test(a.last.positionText) || /retir|disqual|dns|dsq/i.test(a.last.status)
    const dnfB = /R|W|E|DNF|DSQ|DNS/i.test(b.last.positionText) || /retir|disqual|dns|dsq/i.test(b.last.status)
    if (dnfA && !dnfB) {
      insights.push({ tone: 'b', text: `В последней гонке ${a.code} не финишировал — ${b.code} забрал очки.` })
    } else if (dnfB && !dnfA) {
      insights.push({ tone: 'a', text: `В последней гонке ${b.code} не финишировал — ${a.code} забрал очки.` })
    } else {
      const race = winnerOf(a.last.position, b.last.position, 'lower')
      if (race === 'even') {
        insights.push({ tone: 'even', text: 'В последней гонке финишировали одинаково близко по результату.' })
      } else {
        const lead = race === 'a' ? a : b
        const trail = race === 'a' ? b : a
        insights.push({
          tone: race,
          text: `Последний финиш: ${lead.code} P${lead.last!.position} против ${trail.code} P${trail.last!.position}.`,
        })
      }
    }

    if (a.last.grid && b.last.grid && a.last.grid !== b.last.grid) {
      const g = winnerOf(a.last.grid, b.last.grid, 'lower')
      const lead = g === 'a' ? a : b
      insights.push({
        tone: g === 'even' ? 'even' : g,
        text: `Квалификация/сетка: лучше старт у ${lead.code} (P${lead.last!.grid}).`,
      })
    }
  } else {
    insights.push({ tone: 'even', text: 'Результатов последней гонки для пары пока нет.' })
  }

  return {
    a,
    b,
    stats,
    insights,
    lastRaceName: input.lastRace?.raceName,
  }
}

export function duelBarWidths(a: number, b: number, better: 'higher' | 'lower') {
  const max = Math.max(a, b, 1)
  if (better === 'higher') {
    return { a: (a / max) * 100, b: (b / max) * 100 }
  }
  // for positions: invert so P1 is longest
  const invA = max + 1 - a
  const invB = max + 1 - b
  const invMax = Math.max(invA, invB, 1)
  return { a: (invA / invMax) * 100, b: (invB / invMax) * 100 }
}

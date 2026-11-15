/** Local headshots in /public/pilots — matched by family name or F1 code. */

const PILOTS = [
  { file: 'Alex Albon.jpeg', family: 'Albon', code: 'ALB' },
  { file: 'Arvid Lindblad.jpeg', family: 'Lindblad', code: 'LIN' },
  { file: 'Carlos Sainz.jpeg', family: 'Sainz', code: 'SAI' },
  { file: 'Charles Leclerc.jpeg', family: 'Leclerc', code: 'LEC' },
  { file: 'Esteban Ocon.jpeg', family: 'Ocon', code: 'OCO' },
  { file: 'Fernando Alonso.jpeg', family: 'Alonso', code: 'ALO' },
  { file: 'Franco Colapinto.jpeg', family: 'Colapinto', code: 'COL' },
  { file: 'Gabriel Bortoleto.jpeg', family: 'Bortoleto', code: 'BOR' },
  { file: 'George Russell.jpeg', family: 'Russell', code: 'RUS' },
  { file: 'Isack Hadjar.jpeg', family: 'Hadjar', code: 'HAD' },
  { file: 'Kimi Antonelli.jpeg', family: 'Antonelli', code: 'ANT' },
  { file: 'Lance Stroll.jpeg', family: 'Stroll', code: 'STR' },
  { file: 'Lando Norris.jpeg', family: 'Norris', code: 'NOR' },
  { file: 'Lewis Hamilton.jpeg', family: 'Hamilton', code: 'HAM' },
  { file: 'Liam Lawson.jpeg', family: 'Lawson', code: 'LAW' },
  { file: 'Max Verstappen.jpeg', family: 'Verstappen', code: 'VER' },
  { file: 'Nico Hulkenberg.jpeg', family: 'Hulkenberg', code: 'HUL' },
  { file: 'Oliver Bearman.jpeg', family: 'Bearman', code: 'BEA' },
  { file: 'Oscar Piastri.jpeg', family: 'Piastri', code: 'PIA' },
  { file: 'Pierre Gasly.jpeg', family: 'Gasly', code: 'GAS' },
  { file: 'Rafael Camara.jpeg', family: 'Camara', code: 'CAM' },
  { file: 'Ryo Hirakawa.jpeg', family: 'Hirakawa', code: 'HIR' },
  { file: 'Sergio Perez.jpeg', family: 'Perez', code: 'PER' },
  { file: 'Valtteri Bottas.jpeg', family: 'Bottas', code: 'BOT' },
  { file: 'Yuki Tsunoda.jpeg', family: 'Tsunoda', code: 'TSU' },
] as const

const norm = (s: string) =>
  s
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

const byFamily = new Map<string, string>()
const byCode = new Map<string, string>()

for (const p of PILOTS) {
  const src = `/pilots/${encodeURIComponent(p.file)}`
  byFamily.set(norm(p.family), src)
  byCode.set(p.code.toUpperCase(), src)
}

export function pilotPhotoUrl(driver: {
  familyName?: string
  code?: string
  givenName?: string
}): string | undefined {
  if (driver.familyName) {
    const family = norm(driver.familyName)
    const hit = byFamily.get(family)
    if (hit) return hit

    // "Andrea Kimi Antonelli" → try last token
    const parts = family.split(' ')
    if (parts.length > 1) {
      const last = byFamily.get(parts[parts.length - 1]!)
      if (last) return last
    }

    if (driver.givenName) {
      const full = norm(`${driver.givenName} ${driver.familyName}`)
      for (const p of PILOTS) {
        const stem = norm(p.file.replace(/\.jpe?g$/i, ''))
        if (full.includes(stem) || stem.includes(full)) {
          return `/pilots/${encodeURIComponent(p.file)}`
        }
      }
    }
  }

  if (driver.code) {
    return byCode.get(driver.code.toUpperCase())
  }

  return undefined
}

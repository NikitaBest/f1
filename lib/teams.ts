/** Local team logos in /public/teams — matched by constructor name from Jolpica. */

const TEAMS = [
  { file: 'mercedes.png', match: /mercedes/i },
  { file: 'ferrari.svg', match: /ferrari/i },
  { file: 'redbull.svg', match: /red bull/i, exclude: /racing bulls|\brb\b|visa cash app/i },
  { file: 'racing-bulls.svg', match: /racing bulls|\brb f1\b|visa cash app/i },
  { file: 'mclaren.png', match: /mclaren/i },
  { file: 'alpine.png', match: /alpine/i },
  { file: 'haas.png', match: /haas/i },
  { file: 'williams.png', match: /williams/i },
  { file: 'aston-martin.png', match: /aston martin/i },
  { file: 'sauber.png', match: /sauber|stake|kick/i },
  { file: 'audi.svg', match: /audi/i },
  { file: 'cadillac.png', match: /cadillac/i },
] as const

export function teamLogoUrl(name?: string): string | undefined {
  if (!name) return undefined
  for (const t of TEAMS) {
    if (!t.match.test(name)) continue
    if ('exclude' in t && t.exclude?.test(name)) continue
    return `/teams/${t.file}`
  }
  return undefined
}

export type ThemeId = 'verstappen' | 'antonelli' | 'russell' | 'leclerc' | 'hamilton' | 'norris'

export type ThemeCrop = {
  img: string
  iw: number
  ih: number
  cx: number
  cy: number
  cw: number
  ch: number
}

export type DriverTheme = {
  id: ThemeId
  driverId: string
  constructorId: string
  code: string
  givenName: string
  familyName: string
  number: number
  flagClass: 'flag-nl' | 'flag-it' | 'flag-gb' | 'flag-mc'
  teamShort: string
  teamName: string
  teamEyebrow: string
  teamTitle: [string, string]
  carCode: string
  carGhost: string
  carTagline: string
  carBlurb: string
  carNote: string
  powerLabel: string
  splashSideL: string
  splashSideR: string
  showSignature: boolean
  teamMatch: RegExp
  assets: {
    splash: string
    poster: string
    portrait: string
    logo: string
    car: string
    carTop: string
    team: string
    quote: string
    pilot: string
  }
  portraitCrop: ThemeCrop
  carCrop: ThemeCrop
  sigCrop?: ThemeCrop
  specs: { k: string; v: string }[]
  zones: { code: string; title: string; text: string }[]
  quotes: string[]
}

const VER_SIG: ThemeCrop = {
  img: '/img/poster-car.jpeg',
  iw: 736,
  ih: 1106,
  cx: 295,
  cy: 848,
  cw: 140,
  ch: 55,
}

export const THEMES: Record<ThemeId, DriverTheme> = {
  verstappen: {
    id: 'verstappen',
    driverId: 'max_verstappen',
    constructorId: 'red_bull',
    code: 'VER',
    givenName: 'Max',
    familyName: 'Verstappen',
    number: 33,
    flagClass: 'flag-nl',
    teamShort: 'Oracle Red Bull Racing',
    teamName: 'Red Bull Racing',
    teamEyebrow: 'Oracle · Austrian',
    teamTitle: ['Red Bull', 'Racing'],
    carCode: 'RB22',
    carGhost: 'RB',
    carTagline: 'Built to hunt.',
    carBlurb: 'New era, new fight — болид сезона 2026 в ливрее быка.',
    carNote:
      'RB22 — ответ Milton Keynes на новый технический цикл Формулы 1: легче на взгляд, злее в гибриде, всё ещё с жёлтым быком на спине.',
    powerLabel: 'RBPT × Ford',
    splashSideL: 'World champion   2021 2022 2023 2024',
    splashSideR: 'One goal. One vision. Four time world champion.',
    showSignature: true,
    teamMatch: /red bull/i,
    assets: {
      splash: '/themes/verstappen/splash.jpeg',
      poster: '/themes/verstappen/poster.jpeg',
      portrait: '/themes/verstappen/portrait.jpeg',
      logo: '/themes/verstappen/logo.jpeg',
      car: '/themes/verstappen/car-side.jpeg',
      carTop: '/themes/verstappen/car.jpeg',
      team: '/themes/verstappen/team.jpeg',
      quote: '/themes/verstappen/quote.jpeg',
      pilot: '/pilots/Max%20Verstappen.jpeg',
    },
    portraitCrop: {
      img: '/themes/verstappen/portrait.jpeg',
      iw: 736,
      ih: 1104,
      cx: 40,
      cy: 40,
      cw: 656,
      ch: 820,
    },
    carCrop: {
      img: '/themes/verstappen/car-side.jpeg',
      iw: 640,
      ih: 800,
      cx: 8,
      cy: 330,
      cw: 624,
      ch: 160,
    },
    sigCrop: VER_SIG,
    specs: [
      { k: 'Chassis', v: 'RB22' },
      { k: 'Team', v: 'Oracle Red Bull Racing' },
      { k: 'Era', v: '2026 regulations' },
      { k: 'Power', v: 'RBPT × Ford' },
      { k: 'Tyres', v: 'Pirelli' },
      { k: 'Focus', v: 'New era · new fight' },
    ],
    zones: [
      {
        code: '01',
        title: 'Nose & front wing',
        text: 'Узкий нос и переднее крыло задают поток воздуха на весь болид. В регламенте 2026 активная аэродинамика помогает и в квалифае, и в гонке.',
      },
      {
        code: '02',
        title: 'Cockpit',
        text: 'Кабина вокруг Max и его напарника: halo, руль с десятками настроек и телеметрия команды.',
      },
      {
        code: '03',
        title: 'Power unit',
        text: 'Силовая установка новой эры: больше электричества и союз Red Bull Powertrains с Ford.',
      },
      {
        code: '04',
        title: 'Rear wing & DRS',
        text: 'Заднее крыло и активные элементы закрывают картину — классический Red Bull баланс атаки.',
      },
    ],
    quotes: [
      'Тебе не нужно быть идеальным. Нужно быть лучшим в этот день.',
      'Единственное место, которое имеет значение — первое.',
      'Именно когда ты вне зоны комфорта, ты действительно растёшь.',
      'Если бы у моей мамы были яйца, она была бы моим папой.',
      'Simply lovely.',
    ],
  },
  antonelli: {
    id: 'antonelli',
    driverId: 'antonelli',
    constructorId: 'mercedes',
    code: 'ANT',
    givenName: 'Kimi',
    familyName: 'Antonelli',
    number: 12,
    flagClass: 'flag-it',
    teamShort: 'Mercedes-AMG Petronas',
    teamName: 'Mercedes',
    teamEyebrow: 'Petronas · German',
    teamTitle: ['Mercedes', 'AMG'],
    carCode: 'W16',
    carGhost: 'W16',
    carTagline: 'Silver arrows.',
    carBlurb: 'Новая эра Mercedes — серебро, чёрный и бирюза Petronas.',
    carNote:
      'W16 — стрела Brackley: гибрид новой формулы, ливрея Silver Arrows и бирюзовый акцент Petronas на каждом круге.',
    powerLabel: 'Mercedes PU',
    splashSideL: 'Mercedes junior. Italian fire.',
    splashSideR: 'One seat. One chance. Silver Arrows.',
    showSignature: false,
    teamMatch: /mercedes/i,
    assets: {
      splash: '/themes/antonelli/splash.jpeg',
      poster: '/themes/antonelli/poster.jpeg',
      portrait: '/themes/antonelli/portrait.jpeg',
      logo: '/themes/antonelli/logo.jpeg',
      car: '/themes/antonelli/car-side.jpeg',
      carTop: '/themes/antonelli/car.jpeg',
      team: '/themes/antonelli/team.jpeg',
      quote: '/themes/antonelli/quote.jpeg',
      pilot: '/pilots/Kimi%20Antonelli.jpeg',
    },
    portraitCrop: {
      img: '/themes/antonelli/portrait.jpeg',
      iw: 736,
      ih: 940,
      cx: 60,
      cy: 40,
      cw: 620,
      ch: 780,
    },
    carCrop: {
      img: '/themes/antonelli/car-side.jpeg',
      iw: 736,
      ih: 981,
      cx: 16,
      cy: 360,
      cw: 704,
      ch: 240,
    },
    specs: [
      { k: 'Chassis', v: 'W16' },
      { k: 'Team', v: 'Mercedes-AMG Petronas' },
      { k: 'Era', v: '2026 regulations' },
      { k: 'Power', v: 'Mercedes PU' },
      { k: 'Tyres', v: 'Pirelli' },
      { k: 'Focus', v: 'Silver Arrows · new era' },
    ],
    zones: [
      {
        code: '01',
        title: 'Nose & front wing',
        text: 'Нос и переднее крыло Silver Arrows задают поток на весь болид — чистая геометрия Brackley под регламент 2026.',
      },
      {
        code: '02',
        title: 'Cockpit',
        text: 'Кабина Kimi и George: halo, руль Mercedes и телеметрия Petronas-команды на каждом круге.',
      },
      {
        code: '03',
        title: 'Power unit',
        text: 'Собственная силовая установка Mercedes: больше электричества, знакомый гибридный удар на выходе из медленных зон.',
      },
      {
        code: '04',
        title: 'Rear wing & DRS',
        text: 'Заднее крыло с бирюзовым акцентом Petronas — на прямой W16 раскрывается, в связке снова прижимается к асфальту.',
      },
    ],
    quotes: [
      'Каждый круг — шанс стать быстрее.',
      'Давление делает тебя сильнее.',
      'Мечтать мало — нужно работать.',
      'Серебряные стрелы не ждут.',
    ],
  },
  russell: {
    id: 'russell',
    driverId: 'russell',
    constructorId: 'mercedes',
    code: 'RUS',
    givenName: 'George',
    familyName: 'Russell',
    number: 63,
    flagClass: 'flag-gb',
    teamShort: 'Mercedes-AMG Petronas',
    teamName: 'Mercedes',
    teamEyebrow: 'Petronas · German',
    teamTitle: ['Mercedes', 'AMG'],
    carCode: 'W16',
    carGhost: 'W16',
    carTagline: 'Mr. Saturday.',
    carBlurb: 'Серебряные стрелы Brackley — точность, темп и бирюза Petronas.',
    carNote:
      'W16 под George Russell: квалифа-машина с характером, гибрид Mercedes и холодная точность Silver Arrows.',
    powerLabel: 'Mercedes PU',
    splashSideL: 'British talent. Silver Arrows.',
    splashSideR: 'One team. One aim. Race day ready.',
    showSignature: false,
    teamMatch: /mercedes/i,
    assets: {
      splash: '/themes/russell/splash.jpeg',
      poster: '/themes/russell/poster.jpeg',
      portrait: '/themes/russell/portrait.jpeg',
      logo: '/themes/russell/logo.jpeg',
      car: '/themes/russell/car-side.jpeg',
      carTop: '/themes/russell/car.jpeg',
      team: '/themes/russell/team.jpeg',
      quote: '/themes/russell/quote.jpeg',
      pilot: '/pilots/George%20Russell.jpeg',
    },
    portraitCrop: {
      img: '/themes/russell/portrait.jpeg',
      iw: 736,
      ih: 923,
      cx: 60,
      cy: 40,
      cw: 620,
      ch: 760,
    },
    carCrop: {
      img: '/themes/russell/car-side.jpeg',
      iw: 736,
      ih: 981,
      cx: 16,
      cy: 360,
      cw: 704,
      ch: 240,
    },
    specs: [
      { k: 'Chassis', v: 'W16' },
      { k: 'Team', v: 'Mercedes-AMG Petronas' },
      { k: 'Era', v: '2026 regulations' },
      { k: 'Power', v: 'Mercedes PU' },
      { k: 'Tyres', v: 'Pirelli' },
      { k: 'Focus', v: 'Silver Arrows · precision' },
    ],
    zones: [
      {
        code: '01',
        title: 'Nose & front wing',
        text: 'Нос и переднее крыло Silver Arrows — чистая геометрия Brackley под регламент 2026.',
      },
      {
        code: '02',
        title: 'Cockpit',
        text: 'Кабина George и Kimi: halo, руль Mercedes и телеметрия команды на каждом круге.',
      },
      {
        code: '03',
        title: 'Power unit',
        text: 'Силовая установка Mercedes: гибридный удар и точный отклик на выходе из медленных зон.',
      },
      {
        code: '04',
        title: 'Rear wing & DRS',
        text: 'Заднее крыло с акцентом Petronas — на прямой W16 раскрывается, в связке снова садится на асфальт.',
      },
    ],
    quotes: [
      'Детали решают гонку.',
      'Квалификация — мой язык.',
      'Давление — это привилегия.',
      'Серебро не прощает ошибок.',
    ],
  },
  leclerc: {
    id: 'leclerc',
    driverId: 'leclerc',
    constructorId: 'ferrari',
    code: 'LEC',
    givenName: 'Charles',
    familyName: 'Leclerc',
    number: 16,
    flagClass: 'flag-mc',
    teamShort: 'Scuderia Ferrari',
    teamName: 'Ferrari',
    teamEyebrow: 'Maranello · Italian',
    teamTitle: ['Scuderia', 'Ferrari'],
    carCode: 'SF-26',
    carGhost: 'SF',
    carTagline: 'Forza.',
    carBlurb: 'Красный Maranello — страсть, скорость и новый цикл 2026.',
    carNote:
      'SF-26 — ответ Ferrari на новую формулу: ярость гибрида, красная ливрея и давление титула на каждом круге.',
    powerLabel: 'Ferrari PU',
    splashSideL: 'Monegasque fire. Italian red.',
    splashSideR: 'One dream. One prancing horse.',
    showSignature: false,
    teamMatch: /ferrari/i,
    assets: {
      splash: '/themes/leclerc/splash.jpeg',
      poster: '/themes/leclerc/poster.jpeg',
      portrait: '/themes/leclerc/portrait.jpeg',
      logo: '/themes/leclerc/logo.jpeg',
      car: '/themes/leclerc/car-side.jpeg',
      carTop: '/themes/leclerc/car.jpeg',
      team: '/themes/leclerc/team.jpeg',
      quote: '/themes/leclerc/quote.jpeg',
      pilot: '/pilots/Charles%20Leclerc.jpeg',
    },
    portraitCrop: {
      img: '/themes/leclerc/portrait.jpeg',
      iw: 736,
      ih: 1308,
      cx: 80,
      cy: 80,
      cw: 576,
      ch: 720,
    },
    carCrop: {
      img: '/themes/leclerc/car-side.jpeg',
      iw: 736,
      ih: 1308,
      cx: 40,
      cy: 480,
      cw: 656,
      ch: 240,
    },
    specs: [
      { k: 'Chassis', v: 'SF-26' },
      { k: 'Team', v: 'Scuderia Ferrari' },
      { k: 'Era', v: '2026 regulations' },
      { k: 'Power', v: 'Ferrari PU' },
      { k: 'Tyres', v: 'Pirelli' },
      { k: 'Focus', v: 'Rosso corsa · new era' },
    ],
    zones: [
      {
        code: '01',
        title: 'Nose & front wing',
        text: 'Нос и переднее крыло Ferrari задают поток на весь болид — геометрия Maranello под регламент 2026.',
      },
      {
        code: '02',
        title: 'Cockpit',
        text: 'Кабина Charles и напарника: halo, руль Ferrari и телеметрия гаража на каждом круге.',
      },
      {
        code: '03',
        title: 'Power unit',
        text: 'Собственная силовая установка Ferrari: гибридная ярость и фирменный звук на выходе из медленных зон.',
      },
      {
        code: '04',
        title: 'Rear wing & DRS',
        text: 'Заднее крыло в rosso corsa — на прямой SF-26 раскрывается, в связке снова прижимается к асфальту.',
      },
    ],
    quotes: [
      'Красный цвет обязывает.',
      'Ошибки учат быстрее побед.',
      'Мечта Maranello — в каждом круге.',
      'Давление титула — это топливо.',
    ],
  },
  hamilton: {
    id: 'hamilton',
    driverId: 'hamilton',
    constructorId: 'ferrari',
    code: 'HAM',
    givenName: 'Lewis',
    familyName: 'Hamilton',
    number: 44,
    flagClass: 'flag-gb',
    teamShort: 'Scuderia Ferrari',
    teamName: 'Ferrari',
    teamEyebrow: 'Maranello · Italian',
    teamTitle: ['Scuderia', 'Ferrari'],
    carCode: 'SF-26',
    carGhost: 'SF',
    carTagline: 'Still I rise.',
    carBlurb: 'Семь титулов в красном — новая глава Hamilton в Maranello.',
    carNote:
      'SF-26 для Lewis Hamilton: опыт чемпиона, красная ливрея Ferrari и охота за восьмым титулом в новой формуле.',
    powerLabel: 'Ferrari PU',
    splashSideL: 'Seven titles. One more chapter.',
    splashSideR: 'British legend. Italian red.',
    showSignature: false,
    teamMatch: /ferrari/i,
    assets: {
      splash: '/themes/hamilton/splash.jpeg',
      poster: '/themes/hamilton/poster.jpeg',
      portrait: '/themes/hamilton/portrait.jpeg',
      logo: '/themes/hamilton/logo.jpeg',
      car: '/themes/hamilton/car-side.jpeg',
      carTop: '/themes/hamilton/car.jpeg',
      team: '/themes/hamilton/team.jpeg',
      quote: '/themes/hamilton/quote.jpeg',
      pilot: '/pilots/Lewis%20Hamilton.jpeg',
    },
    portraitCrop: {
      img: '/themes/hamilton/portrait.jpeg',
      iw: 736,
      ih: 736,
      cx: 40,
      cy: 20,
      cw: 656,
      ch: 700,
    },
    carCrop: {
      img: '/themes/hamilton/car-side.jpeg',
      iw: 736,
      ih: 736,
      cx: 20,
      cy: 280,
      cw: 696,
      ch: 220,
    },
    specs: [
      { k: 'Chassis', v: 'SF-26' },
      { k: 'Team', v: 'Scuderia Ferrari' },
      { k: 'Era', v: '2026 regulations' },
      { k: 'Power', v: 'Ferrari PU' },
      { k: 'Tyres', v: 'Pirelli' },
      { k: 'Focus', v: 'Rosso corsa · eighth' },
    ],
    zones: [
      {
        code: '01',
        title: 'Nose & front wing',
        text: 'Нос и переднее крыло Ferrari — геометрия Maranello под новый цикл 2026.',
      },
      {
        code: '02',
        title: 'Cockpit',
        text: 'Кабина Lewis и Charles: halo, руль Ferrari и телеметрия гаража на каждом круге.',
      },
      {
        code: '03',
        title: 'Power unit',
        text: 'Силовая установка Ferrari: гибридная ярость и фирменный отклик на выходе из медленных зон.',
      },
      {
        code: '04',
        title: 'Rear wing & DRS',
        text: 'Заднее крыло в rosso corsa — на прямой SF-26 раскрывается, в связке снова садится на асфальт.',
      },
    ],
    quotes: [
      'Ещё одна глава. Ещё одна битва.',
      'Красный — новый чёрный.',
      'Легенды не останавливаются.',
      'Восьмой ждёт на финише.',
    ],
  },
  norris: {
    id: 'norris',
    driverId: 'norris',
    constructorId: 'mclaren',
    code: 'NOR',
    givenName: 'Lando',
    familyName: 'Norris',
    number: 4,
    flagClass: 'flag-gb',
    teamShort: 'McLaren',
    teamName: 'McLaren',
    teamEyebrow: 'Papaya · British',
    teamTitle: ['McLaren', 'Racing'],
    carCode: 'MCL40',
    carGhost: 'MCL',
    carTagline: 'Papaya rules.',
    carBlurb: 'Папайя Woking — скорость, улыбка и новая формула 2026.',
    carNote:
      'MCL40 для Lando Norris: папайя-ливрея McLaren, гибрид новой эры и давление титула на каждом круге.',
    powerLabel: 'Mercedes PU',
    splashSideL: 'British speed. Papaya pride.',
    splashSideR: 'One team. One orange. Race on.',
    showSignature: false,
    teamMatch: /mclaren/i,
    assets: {
      splash: '/themes/norris/splash.jpeg',
      poster: '/themes/norris/poster.jpeg',
      portrait: '/themes/norris/portrait.jpeg',
      logo: '/themes/norris/logo.jpeg',
      car: '/themes/norris/car-side.jpeg',
      carTop: '/themes/norris/car.jpeg',
      team: '/themes/norris/team.jpeg',
      quote: '/themes/norris/quote.jpeg',
      pilot: '/pilots/Lando%20Norris.jpeg',
    },
    portraitCrop: {
      img: '/themes/norris/portrait.jpeg',
      iw: 736,
      ih: 920,
      cx: 60,
      cy: 40,
      cw: 620,
      ch: 760,
    },
    carCrop: {
      img: '/themes/norris/car-side.jpeg',
      iw: 736,
      ih: 920,
      cx: 20,
      cy: 360,
      cw: 696,
      ch: 220,
    },
    specs: [
      { k: 'Chassis', v: 'MCL40' },
      { k: 'Team', v: 'McLaren' },
      { k: 'Era', v: '2026 regulations' },
      { k: 'Power', v: 'Mercedes PU' },
      { k: 'Tyres', v: 'Pirelli' },
      { k: 'Focus', v: 'Papaya · title fight' },
    ],
    zones: [
      {
        code: '01',
        title: 'Nose & front wing',
        text: 'Нос и переднее крыло McLaren задают поток на весь болид — геометрия Woking под регламент 2026.',
      },
      {
        code: '02',
        title: 'Cockpit',
        text: 'Кабина Lando и напарника: halo, руль McLaren и телеметрия команды на каждом круге.',
      },
      {
        code: '03',
        title: 'Power unit',
        text: 'Силовая установка Mercedes в шасси McLaren: гибридный удар и папайя-характер на выходе из медленных зон.',
      },
      {
        code: '04',
        title: 'Rear wing & DRS',
        text: 'Заднее крыло в папайе — на прямой MCL40 раскрывается, в связке снова прижимается к асфальту.',
      },
    ],
    quotes: [
      'Улыбайся и атакуй.',
      'Папайя не ждёт.',
      'Давление делает круг быстрее.',
      'Один шанс — один качественный круг.',
    ],
  },
}

export const THEME_LIST = Object.values(THEMES)

export function getTheme(id?: string | null): DriverTheme {
  if (id && id in THEMES) return THEMES[id as ThemeId]
  return THEMES.verstappen
}

export function isFavDriver(theme: DriverTheme, code?: string, family?: string) {
  return code === theme.code || family === theme.familyName
}

export function isFavTeam(theme: DriverTheme, name?: string) {
  if (!name) return false
  if (theme.id === 'verstappen') {
    return theme.teamMatch.test(name) && !/racing bulls|rb f1/i.test(name)
  }
  return theme.teamMatch.test(name)
}

export function driverDisplayName(theme: DriverTheme) {
  return `${theme.givenName} ${theme.familyName}`
}

'use client'

import { useEffect, useRef, useState } from 'react'
import { useAppState, useTheme } from '@/lib/store'
import { useF1Live } from '@/lib/use-f1-live'
import { useViewportLock } from '@/lib/use-viewport-lock'
import { CalendarScreen } from './calendar-screen'
import { CarScreen } from './car-screen'
import { DriverScreen } from './driver-screen'
import { EventDetailScreen, HomeScreen } from './home-screen'
import { NewsScreen } from './news-screen'
import { PaddockScreen } from './paddock-screen'
import { PickDriverScreen } from './pick-driver-screen'
import { SeasonScreen } from './season-screen'
import { SplashScreen } from './splash-screen'
import { TabBar, type Tab } from './tab-bar'
import { TeamScreen } from './team-screen'

export function BoxBoxApp() {
  useViewportLock()
  const state = useAppState()
  const theme = useTheme()
  const live = useF1Live(true)
  const [tab, setTab] = useState<Tab>('home')
  const [openId, setOpenId] = useState<string | null>(null)
  const [openDriver, setOpenDriver] = useState(false)
  const [openTeam, setOpenTeam] = useState(false)
  const [openCar, setOpenCar] = useState(false)
  const [openPickDriver, setOpenPickDriver] = useState(false)
  const [booted, setBooted] = useState(false)
  const [themeSplash, setThemeSplash] = useState(false)
  const prevTheme = useRef<string | null>(null)

  useEffect(() => {
    document.documentElement.dataset.theme = theme.id
  }, [theme.id])

  useEffect(() => {
    if (!booted || !state.hydrated) return
    if (prevTheme.current === null) {
      prevTheme.current = state.favThemeId
      return
    }
    if (prevTheme.current !== state.favThemeId) {
      prevTheme.current = state.favThemeId
      setOpenDriver(false)
      setOpenTeam(false)
      setOpenCar(false)
      setOpenPickDriver(false)
      setOpenId(null)
      setTab('home')
      setThemeSplash(true)
    }
  }, [state.favThemeId, booted, state.hydrated])

  if (!state.hydrated) {
    return <div className="bb-app is-booting" data-theme={theme.id} aria-hidden="true" />
  }

  if (!booted || themeSplash) {
    return (
      <>
        <div className="bb-app is-booting" data-theme={theme.id} aria-hidden="true" />
        <SplashScreen
          key={themeSplash ? `theme-${theme.id}` : `boot-${theme.id}`}
          onDone={() => {
            setThemeSplash(false)
            setBooted(true)
          }}
        />
      </>
    )
  }

  const opened = openId ? state.events.find((e) => e.id === openId) : undefined
  const closeGarage = () => {
    setOpenDriver(false)
    setOpenTeam(false)
    setOpenCar(false)
  }
  const go = (t: Tab) => {
    setOpenId(null)
    setOpenPickDriver(false)
    closeGarage()
    setTab(t)
  }

  let screen: React.ReactNode
  if (openPickDriver && tab === 'paddock') {
    screen = <PickDriverScreen onBack={() => setOpenPickDriver(false)} />
  } else if (openDriver && tab === 'home') {
    screen = <DriverScreen live={live} onBack={() => setOpenDriver(false)} />
  } else if (openTeam && tab === 'home') {
    screen = <TeamScreen live={live} onBack={() => setOpenTeam(false)} />
  } else if (openCar && tab === 'home') {
    screen = <CarScreen onBack={() => setOpenCar(false)} />
  } else if (opened && tab === 'calendar') {
    screen = <EventDetailScreen event={opened} events={state.events} onBack={() => setOpenId(null)} />
  } else if (tab === 'home') {
    screen = (
      <HomeScreen
        events={state.events}
        live={live}
        onOpenDriver={() => {
          closeGarage()
          setOpenDriver(true)
        }}
        onOpenTeam={() => {
          closeGarage()
          setOpenTeam(true)
        }}
        onOpenCar={() => {
          closeGarage()
          setOpenCar(true)
        }}
        onOpenNews={() => go('news')}
      />
    )
  } else if (tab === 'news') {
    screen = <NewsScreen />
  } else if (tab === 'calendar') {
    screen = <CalendarScreen events={state.events} onOpen={setOpenId} />
  } else if (tab === 'season') {
    screen = <SeasonScreen live={live} />
  } else {
    screen = (
      <PaddockScreen events={state.events} live={live} onPickDriver={() => setOpenPickDriver(true)} />
    )
  }

  return (
    <div className="bb-app" data-theme={theme.id}>
      <div
        key={`${tab}-${theme.id}-${openId ?? ''}-${openDriver}-${openTeam}-${openCar}-${openPickDriver}`}
        className="contents"
      >
        {screen}
      </div>
      <TabBar active={tab} onChange={go} />
    </div>
  )
}

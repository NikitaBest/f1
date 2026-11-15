'use client'

import { useState } from 'react'
import { useAppState } from '@/lib/store'
import { useF1Live } from '@/lib/use-f1-live'
import { useViewportLock } from '@/lib/use-viewport-lock'
import { CalendarScreen } from './calendar-screen'
import { CarScreen } from './car-screen'
import { DriverScreen } from './driver-screen'
import { EventDetailScreen, HomeScreen } from './home-screen'
import { NewsScreen } from './news-screen'
import { PaddockScreen } from './paddock-screen'
import { SeasonScreen } from './season-screen'
import { SplashScreen } from './splash-screen'
import { TabBar, type Tab } from './tab-bar'
import { TeamScreen } from './team-screen'

export function BoxBoxApp() {
  useViewportLock()
  const state = useAppState()
  const live = useF1Live(true)
  const [tab, setTab] = useState<Tab>('home')
  const [openId, setOpenId] = useState<string | null>(null)
  const [openDriver, setOpenDriver] = useState(false)
  const [openTeam, setOpenTeam] = useState(false)
  const [openCar, setOpenCar] = useState(false)
  const [booted, setBooted] = useState(false)

  if (!booted || !state.hydrated) {
    return (
      <>
        <div className="bb-app is-booting" aria-hidden="true" />
        <SplashScreen onDone={() => setBooted(true)} />
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
    closeGarage()
    setTab(t)
  }

  let screen: React.ReactNode
  if (openDriver && tab === 'home') {
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
    screen = <PaddockScreen events={state.events} live={live} />
  }

  return (
    <div className="bb-app">
      <div key={`${tab}-${openId ?? ''}-${openDriver}-${openTeam}-${openCar}`} className="contents">
        {screen}
      </div>
      <TabBar active={tab} onChange={go} />
    </div>
  )
}

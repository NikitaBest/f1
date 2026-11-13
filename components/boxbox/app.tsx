'use client'

import { useState } from 'react'
import { actions, useAppState } from '@/lib/store'
import { useF1Live } from '@/lib/use-f1-live'
import { CalendarScreen } from './calendar-screen'
import { CreateScreen } from './create-screen'
import { EventDetailScreen, HomeScreen } from './home-screen'
import { PaddockScreen } from './paddock-screen'
import { SeasonScreen } from './season-screen'
import { SplashScreen } from './splash-screen'
import { TabBar, type Tab } from './tab-bar'

export function BoxBoxApp() {
  const state = useAppState()
  const live = useF1Live(true)
  const [tab, setTab] = useState<Tab>('home')
  const [openId, setOpenId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  if (!state.hydrated) return <div className="bb-app" aria-busy="true" />

  if (!state.onboarded) {
    return (
      <div className="bb-app">
        <SplashScreen onStart={actions.finishOnboarding} />
      </div>
    )
  }

  const opened = openId ? state.events.find((e) => e.id === openId) : undefined
  const go = (t: Tab) => {
    setOpenId(null)
    setCreating(false)
    setTab(t)
  }
  const create = () => setCreating(true)

  let screen: React.ReactNode
  if (creating) {
    screen = (
      <CreateScreen
        onCancel={() => setCreating(false)}
        onCreated={() => {
          setCreating(false)
          go('calendar')
        }}
      />
    )
  } else if (opened && tab === 'calendar') {
    screen = <EventDetailScreen event={opened} events={state.events} onBack={() => setOpenId(null)} />
  } else if (tab === 'home') {
    screen = <HomeScreen events={state.events} live={live} onCreate={create} />
  } else if (tab === 'calendar') {
    screen = <CalendarScreen events={state.events} onOpen={setOpenId} onCreate={create} />
  } else if (tab === 'season') {
    screen = <SeasonScreen live={live} />
  } else {
    screen = <PaddockScreen events={state.events} live={live} onCreate={create} />
  }

  return (
    <div className="bb-app">
      <div key={`${tab}-${openId ?? ''}-${creating}`} className="contents">
        {screen}
      </div>
      {!creating && <TabBar active={tab} onChange={go} />}
    </div>
  )
}

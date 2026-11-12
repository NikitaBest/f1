'use client'

import { useState } from 'react'
import { actions, useAppState } from '@/lib/store'
import { CalendarScreen } from './calendar-screen'
import { CreateScreen } from './create-screen'
import { EventDetailScreen, HomeScreen } from './home-screen'
import { PaddockScreen } from './paddock-screen'
import { SplashScreen } from './splash-screen'
import { TabBar, type Tab } from './tab-bar'

export function BoxBoxApp() {
  const state = useAppState()
  const [tab, setTab] = useState<Tab>('home')
  const [openId, setOpenId] = useState<string | null>(null)

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
    setTab(t)
  }
  const light = tab === 'create' || tab === 'paddock'

  let screen: React.ReactNode
  if (opened && tab === 'calendar') {
    screen = <EventDetailScreen event={opened} events={state.events} onBack={() => setOpenId(null)} />
  } else if (tab === 'home') {
    screen = <HomeScreen events={state.events} onCreate={() => go('create')} />
  } else if (tab === 'calendar') {
    screen = <CalendarScreen events={state.events} onOpen={setOpenId} />
  } else if (tab === 'create') {
    screen = <CreateScreen onCreated={() => go('calendar')} />
  } else {
    screen = <PaddockScreen events={state.events} />
  }

  return (
    <div className="bb-app" data-tone={light ? 'light' : undefined}>
      <div key={`${tab}-${openId ?? ''}`} className="relative z-[2] flex min-h-0 flex-1 flex-col">
        {screen}
      </div>
      <TabBar active={tab} onChange={go} />
    </div>
  )
}

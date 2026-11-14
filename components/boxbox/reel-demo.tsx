'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useAppState } from '@/lib/store'
import { useF1Live } from '@/lib/use-f1-live'
import { useViewportLock } from '@/lib/use-viewport-lock'
import { DriverScreen } from './driver-screen'
import { HomeScreen } from './home-screen'
import { SplashScreen } from './splash-screen'
import { TabBar } from './tab-bar'
import './reel-demo.css'

type Phase = 'splash' | 'tour'

type Step = {
  sel: string
  eyebrow: string
  title: string
  body: string
  expand?: boolean
  hold: number
  /** 3D-мокап со страницей гонщика */
  phone?: 'driver'
  tip?: 'below' | 'bottom'
}

const STEPS: Step[] = [
  {
    sel: '.wk-head',
    eyebrow: 'Карточка этапа',
    title: 'Где и когда',
    body: 'Раунд, трасса и даты уикенда',
    hold: 3200,
  },
  {
    sel: '.cd',
    eyebrow: 'Таймер',
    title: 'До старта',
    body: 'Обратный отсчёт до следующей сессии',
    hold: 3000,
  },
  {
    sel: '.sched',
    eyebrow: 'Расписание',
    title: 'Что дальше',
    body: 'Время и день ближайшей сессии',
    hold: 2800,
  },
  {
    sel: '.sched',
    eyebrow: 'Весь уикенд',
    title: 'Все сессии',
    body: 'Практики, квалификация и гонка',
    expand: true,
    hold: 3400,
  },
  {
    sel: '.garage-block',
    eyebrow: 'Garage',
    title: 'Три двери',
    body: 'Гонщик, команда и болид — всё в одном месте',
    tip: 'below',
    hold: 3200,
  },
  {
    sel: '.duo-d',
    eyebrow: 'Гонщик',
    title: 'Макс Ферстаппен',
    body: 'Профиль, форма и результаты сезона',
    phone: 'driver',
    tip: 'bottom',
    hold: 6500,
  },
]

const SETTLE_MS = 900
const FADE_MS = 380
const MOVE_MS = 520

type Spot = { top: number; left: number; width: number; height: number }

type TipState = {
  eyebrow: string
  title: string
  body: string
  top: number
  left: number
}

function measure(el: HTMLElement, root: HTMLElement): Spot {
  const a = root.getBoundingClientRect()
  const r = el.getBoundingClientRect()
  return {
    top: r.top - a.top,
    left: r.left - a.left,
    width: r.width,
    height: r.height,
  }
}

function wait(ms: number, timers: number[]) {
  return new Promise<void>((resolve) => {
    timers.push(window.setTimeout(resolve, ms))
  })
}

export function ReelDemo() {
  useViewportLock()
  const state = useAppState()
  const live = useF1Live(true)
  const [phase, setPhase] = useState<Phase>('splash')
  const [step, setStep] = useState(-1)
  const [hovering, setHovering] = useState(false)
  const [tipOn, setTipOn] = useState(false)
  const [tip, setTip] = useState<TipState | null>(null)
  const [phoneOn, setPhoneOn] = useState(false)
  const appRef = useRef<HTMLDivElement>(null)
  const hotRef = useRef<HTMLElement | null>(null)
  const phoneScrollRef = useRef<HTMLDivElement>(null)
  const phonePageRef = useRef<HTMLDivElement>(null)
  const tipOnRef = useRef(false)
  tipOnRef.current = tipOn

  const current = step >= 0 ? STEPS[Math.min(step, STEPS.length - 1)] : null
  const expand = STEPS.slice(0, Math.max(0, step) + 1).some((s) => s.expand)
  const garageIdx = STEPS.findIndex((s) => s.sel === '.garage-block')
  // Подгружаем страницу гонщика уже на шаге Garage
  const mountPhone = step >= garageIdx && garageIdx >= 0

  // Страница гонщика как на телефоне (390px), потом уменьшаем zoom под мокап
  useLayoutEffect(() => {
    if (!mountPhone) return
    const screen = phoneScrollRef.current
    const page = phonePageRef.current
    if (!screen || !page) return
    const sync = () => {
      const z = screen.clientWidth / 390
      page.style.zoom = String(z)
    }
    sync()
    const ro = new ResizeObserver(sync)
    ro.observe(screen)
    return () => ro.disconnect()
  }, [mountPhone, phoneOn])

  useEffect(() => {
    if (phase !== 'tour') return
    if (step >= 0) return
    const id = window.setTimeout(() => setStep(0), SETTLE_MS)
    return () => window.clearTimeout(id)
  }, [phase, step])

  // Медленный автоскролл внутри мокапа
  useEffect(() => {
    if (!phoneOn) return
    const scroller = phoneScrollRef.current
    if (!scroller) return

    let raf = 0
    let cancelled = false
    const start = performance.now()
    const delay = 1400
    const duration = 4500

    const tick = (now: number) => {
      if (cancelled) return
      const t = now - start - delay
      if (t > 0) {
        const max = Math.max(0, scroller.scrollHeight - scroller.clientHeight)
        const p = Math.min(1, t / duration)
        const eased = 1 - Math.pow(1 - p, 2)
        scroller.scrollTop = max * eased * 0.72
      }
      if (t < duration) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
    }
  }, [phoneOn, step])

  useEffect(() => {
    if (phase !== 'tour' || !current) return
    const app = appRef.current
    if (!app) return

    let cancelled = false
    const timers: number[] = []

    const placeTip = (el: HTMLElement) => {
      const scroller = el.closest('.scroll') as HTMLElement | null
      let next = measure(el, app)
      const tipW = Math.min(230, app.clientWidth - 24)
      const tipH = 108

      if (current.tip === 'bottom') {
        setTip({
          eyebrow: current.eyebrow,
          title: current.title,
          body: current.body,
          top: app.clientHeight - tipH - 88,
          left: 16,
        })
        return
      }

      let tipTop = next.top + next.height + 14
      if (tipTop + tipH > app.clientHeight - 16 && scroller) {
        scroller.scrollTo({
          top: scroller.scrollTop + (tipTop + tipH - (app.clientHeight - 16)),
          behavior: 'smooth',
        })
        next = measure(el, app)
        tipTop = next.top + next.height + 14
      }
      const tipLeft = Math.min(Math.max(12, next.left), app.clientWidth - tipW - 12)
      setTip({
        eyebrow: current.eyebrow,
        title: current.title,
        body: current.body,
        top: tipTop,
        left: tipLeft,
      })
    }

    const run = async () => {
      setPhoneOn(false)

      if (tipOnRef.current) {
        setTipOn(false)
        await wait(FADE_MS, timers)
        if (cancelled) return
      }

      const el = app.querySelector(current.sel) as HTMLElement | null
      if (!el) return

      const scroller = el.closest('.scroll') as HTMLElement | null
      if (scroller) {
        const top =
          el.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop - 12
        scroller.scrollTo({ top: Math.max(0, top), behavior: 'smooth' })
      } else {
        el.scrollIntoView({ block: 'start', behavior: 'smooth' })
      }

      await wait(expand ? MOVE_MS + 80 : MOVE_MS, timers)
      if (cancelled) return

      el.classList.add('is-reel-hot')
      if (hotRef.current && hotRef.current !== el) {
        hotRef.current.classList.remove('is-reel-hot')
      }
      hotRef.current = el
      setHovering(true)

      await wait(160, timers)
      if (cancelled) return

      if (current.phone) setPhoneOn(true)

      placeTip(el)
      await wait(40, timers)
      if (cancelled) return
      setTipOn(true)

      await wait(current.hold, timers)
      if (cancelled) return
      setStep((s) => (s >= STEPS.length - 1 ? s : s + 1))
    }

    void run()

    return () => {
      cancelled = true
      timers.forEach((id) => window.clearTimeout(id))
    }
  }, [phase, step, current, expand])

  useEffect(() => {
    return () => {
      hotRef.current?.classList.remove('is-reel-hot')
      hotRef.current = null
    }
  }, [])

  const showSplash = phase === 'splash' || !state.hydrated

  return (
    <div
      className={`bb-app reel-app${hovering ? ' is-hovering' : ''}${phoneOn ? ' has-phone' : ''}`}
      ref={appRef}
      aria-label="Демо BOXBOX"
    >
      {!showSplash && (
        <>
          <HomeScreen
            events={state.events}
            live={live}
            weekendForceOpen={expand}
            onCreate={() => {}}
            onOpenDriver={() => {}}
            onOpenTeam={() => {}}
            onOpenCar={() => {}}
            onOpenNews={() => {}}
          />
          <TabBar active="home" onChange={() => {}} />
        </>
      )}

      {showSplash && <SplashScreen inline onDone={() => setPhase('tour')} />}

      {mountPhone && (
        <div className={`reel-phone-3d${phoneOn ? ' is-on' : ''}`} aria-hidden="true">
          <div className="reel-phone-3d-frame">
            <div className="reel-phone-3d-island" />
            <div className="reel-phone-3d-screen" ref={phoneScrollRef}>
              <div className="reel-phone-3d-page" ref={phonePageRef}>
                <DriverScreen live={live} onBack={() => {}} />
              </div>
            </div>
          </div>
        </div>
      )}

      {tip && (
        <div
          className={`reel-tip${tipOn ? ' is-on' : ''}${current?.tip === 'bottom' ? ' is-bottom' : ''}`}
          aria-hidden="true"
          style={{ top: tip.top, left: tip.left }}
        >
          <div key={`${tip.title}-${Math.round(tip.top)}`} className="reel-tip-inner">
            <span className="eyebrow">{tip.eyebrow}</span>
            <p className="disp">{tip.title}</p>
            <small>{tip.body}</small>
          </div>
        </div>
      )}
    </div>
  )
}

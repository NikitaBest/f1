'use client'

import { useEffect } from 'react'

/** Pins --vv-* to the real visible viewport (fixes iOS PWA bottom gap). */
export function useViewportLock() {
  useEffect(() => {
    const root = document.documentElement

    const sync = () => {
      const vv = window.visualViewport
      const height = Math.round(vv?.height ?? window.innerHeight)
      const top = Math.round(vv?.offsetTop ?? 0)
      const left = Math.round(vv?.offsetLeft ?? 0)
      root.style.setProperty('--vv-height', `${height}px`)
      root.style.setProperty('--vv-top', `${top}px`)
      root.style.setProperty('--vv-left', `${left}px`)
    }

    sync()
    // iOS often reports a wrong first height until after paint / gesture
    const t1 = window.setTimeout(sync, 50)
    const t2 = window.setTimeout(sync, 300)
    const t3 = window.setTimeout(sync, 1000)

    window.visualViewport?.addEventListener('resize', sync)
    window.visualViewport?.addEventListener('scroll', sync)
    window.addEventListener('resize', sync)
    window.addEventListener('orientationchange', sync)
    window.addEventListener('pageshow', sync)
    document.addEventListener('visibilitychange', sync)

    return () => {
      window.clearTimeout(t1)
      window.clearTimeout(t2)
      window.clearTimeout(t3)
      window.visualViewport?.removeEventListener('resize', sync)
      window.visualViewport?.removeEventListener('scroll', sync)
      window.removeEventListener('resize', sync)
      window.removeEventListener('orientationchange', sync)
      window.removeEventListener('pageshow', sync)
      document.removeEventListener('visibilitychange', sync)
    }
  }, [])
}

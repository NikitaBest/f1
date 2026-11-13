'use client'

import { useEffect } from 'react'

/**
 * iOS standalone PWA + viewport-fit=cover under-reports height via
 * visualViewport / dvh / svh (excludes safe-area-inset-bottom).
 * 100vh still includes that inset — use it for the app shell.
 */
function isIosStandalone() {
  const nav = window.navigator as Navigator & { standalone?: boolean }
  const standalone =
    window.matchMedia('(display-mode: standalone)').matches || nav.standalone === true
  const ios =
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  return Boolean(standalone && ios)
}

function measureVh() {
  const probe = document.createElement('div')
  probe.style.cssText =
    'position:fixed;top:0;left:0;height:100vh;width:0;visibility:hidden;pointer-events:none'
  document.documentElement.appendChild(probe)
  const height = probe.offsetHeight
  probe.remove()
  return height
}

export function useViewportLock() {
  useEffect(() => {
    const root = document.documentElement

    const sync = () => {
      if (isIosStandalone()) {
        root.style.setProperty('--app-height', `${Math.round(measureVh())}px`)
        return
      }
      const vv = window.visualViewport
      const height = Math.round(vv?.height ?? window.innerHeight)
      root.style.setProperty('--app-height', `${height}px`)
    }

    sync()
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

'use client'

import { useEffect, useRef, useState } from 'react'

export function useCountUp(target: number, duration = 1800, startOnMount = false) {
  const [count, setCount]   = useState(0)
  const [started, setStarted] = useState(startOnMount)
  const rafRef = useRef<number | null>(null)

  const start = () => setStarted(true)

  useEffect(() => {
    if (!started) return
    const startTime = performance.now()

    const tick = (now: number) => {
      const elapsed  = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      // ease-out quart
      const eased = 1 - Math.pow(1 - progress, 4)
      setCount(Math.round(eased * target))
      if (progress < 1) rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [started, target, duration])

  return { count, start }
}

'use client'

import { useRef, useEffect, useCallback } from 'react'

/* ── Spotlight suave que segue o mouse ── */
export function MouseSpotlight({ containerRef }: { containerRef: React.RefObject<HTMLElement | null> }) {
  const spotRef = useRef<HTMLDivElement>(null)
  const posRef  = useRef({ x: -999, y: -999 })
  const rafRef  = useRef<number | null>(null)

  const lerp = (a: number, b: number, t: number) => a + (b - a) * t

  const animate = useCallback(() => {
    if (!spotRef.current) return
    const el = spotRef.current
    const cx = parseFloat(el.style.left || '0')
    const cy = parseFloat(el.style.top  || '0')
    const nx = lerp(cx, posRef.current.x, 0.08)
    const ny = lerp(cy, posRef.current.y, 0.08)
    el.style.left = `${nx}px`
    el.style.top  = `${ny}px`
    rafRef.current = requestAnimationFrame(animate)
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const onMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect()
      posRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }
    const onEnter = () => {
      if (spotRef.current) spotRef.current.style.opacity = '1'
      rafRef.current = requestAnimationFrame(animate)
    }
    const onLeave = () => {
      if (spotRef.current) spotRef.current.style.opacity = '0'
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }

    container.addEventListener('mousemove', onMove)
    container.addEventListener('mouseenter', onEnter)
    container.addEventListener('mouseleave', onLeave)

    return () => {
      container.removeEventListener('mousemove', onMove)
      container.removeEventListener('mouseenter', onEnter)
      container.removeEventListener('mouseleave', onLeave)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [animate, containerRef])

  return (
    <div
      ref={spotRef}
      aria-hidden="true"
      className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full transition-opacity duration-500"
      style={{
        opacity: 0,
        width:  '520px',
        height: '520px',
        background: 'radial-gradient(circle, rgba(11,188,212,0.09) 0%, rgba(61,59,142,0.06) 40%, transparent 70%)',
        filter: 'blur(8px)',
        left: '-999px',
        top:  '-999px',
      }}
    />
  )
}

/* ── Partículas que reagem ao mouse ── */
export function FloatingDots({ containerRef }: { containerRef: React.RefObject<HTMLElement | null> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mouseRef  = useRef({ x: -9999, y: -9999 })

  useEffect(() => {
    const canvas    = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const ctx = canvas.getContext('2d')!
    let animId: number
    let W = 0, H = 0

    const COUNT = 28
    const dots = Array.from({ length: COUNT }, () => ({
      x:  Math.random(),
      y:  Math.random(),
      r:  1.2 + Math.random() * 1.6,
      vx: (Math.random() - 0.5) * 0.0003,
      vy: (Math.random() - 0.5) * 0.0003,
    }))

    const resize = () => {
      const rect = container.getBoundingClientRect()
      W = rect.width; H = rect.height
      canvas.width  = W
      canvas.height = H
    }

    const onMove  = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect()
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }
    const onLeave = () => { mouseRef.current = { x: -9999, y: -9999 } }

    container.addEventListener('mousemove', onMove)
    container.addEventListener('mouseleave', onLeave)
    window.addEventListener('resize', resize)
    resize()

    const draw = () => {
      ctx.clearRect(0, 0, W, H)
      const mx = mouseRef.current.x
      const my = mouseRef.current.y

      dots.forEach(d => {
        d.x += d.vx; d.y += d.vy
        if (d.x < 0) d.x = 1; if (d.x > 1) d.x = 0
        if (d.y < 0) d.y = 1; if (d.y > 1) d.y = 0

        const px = d.x * W
        const py = d.y * H
        const dist      = Math.hypot(px - mx, py - my)
        const influence = Math.max(0, 1 - dist / 200)
        const radius    = d.r + influence * 3
        const alpha     = 0.12 + influence * 0.5

        ctx.beginPath()
        ctx.arc(px, py, radius, 0, Math.PI * 2)
        ctx.fillStyle = influence > 0.1
          ? `rgba(11,188,212,${alpha})`
          : `rgba(61,59,142,${alpha})`
        ctx.fill()

        if (influence > 0.35) {
          ctx.beginPath()
          ctx.moveTo(px, py)
          ctx.lineTo(mx, my)
          ctx.strokeStyle = `rgba(11,188,212,${influence * 0.15})`
          ctx.lineWidth = 0.8
          ctx.stroke()
        }
      })

      animId = requestAnimationFrame(draw)
    }

    draw()
    return () => {
      cancelAnimationFrame(animId)
      container.removeEventListener('mousemove', onMove)
      container.removeEventListener('mouseleave', onLeave)
      window.removeEventListener('resize', resize)
    }
  }, [containerRef])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 w-full h-full"
    />
  )
}

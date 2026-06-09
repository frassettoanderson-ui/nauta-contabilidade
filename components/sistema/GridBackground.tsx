'use client'

import { useEffect, useRef } from 'react'

/**
 * Fundo em grade que reage ao mouse: uma "lanterna" teal ilumina as linhas
 * da grade ao redor do cursor. Leve (CSS mask + variáveis), respeita reduced-motion.
 */
export default function GridBackground() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let raf = 0
    let tx = window.innerWidth / 2
    let ty = window.innerHeight / 2
    let cx = tx
    let cy = ty

    const onMove = (e: MouseEvent) => {
      tx = e.clientX
      ty = e.clientY
    }

    const loop = () => {
      // easing suave (lerp) para um movimento "gostoso"
      cx += (tx - cx) * 0.12
      cy += (ty - cy) * 0.12
      el.style.setProperty('--x', `${cx}px`)
      el.style.setProperty('--y', `${cy}px`)
      raf = requestAnimationFrame(loop)
    }

    window.addEventListener('mousemove', onMove, { passive: true })
    raf = requestAnimationFrame(loop)
    return () => {
      window.removeEventListener('mousemove', onMove)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="absolute inset-0 overflow-hidden"
      style={{ ['--x' as string]: '50%', ['--y' as string]: '50%', background: '#0a0918' }}
    >
      {/* Grade base sutil */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)
          `,
          backgroundSize: '46px 46px',
        }}
      />

      {/* Grade iluminada (teal) revelada ao redor do cursor */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(11,188,212,0.55) 1px, transparent 1px),
            linear-gradient(90deg, rgba(11,188,212,0.55) 1px, transparent 1px)
          `,
          backgroundSize: '46px 46px',
          WebkitMaskImage: 'radial-gradient(circle 220px at var(--x) var(--y), #000 0%, transparent 70%)',
          maskImage: 'radial-gradient(circle 220px at var(--x) var(--y), #000 0%, transparent 70%)',
        }}
      />

      {/* Brilho difuso acompanhando o cursor */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(circle 300px at var(--x) var(--y), rgba(11,188,212,0.10) 0%, transparent 70%)',
        }}
      />

      {/* Orb roxo decorativo fixo (identidade Nauta) */}
      <div
        className="absolute -bottom-32 -right-24 w-[480px] h-[420px] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, rgba(124,111,255,0.10) 0%, transparent 70%)' }}
      />

      {/* Vinheta para focar no centro */}
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 45%, transparent 0%, rgba(10,9,24,0.85) 100%)' }}
      />
    </div>
  )
}

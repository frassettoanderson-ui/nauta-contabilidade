'use client'

import { useEffect, useRef } from 'react'

/**
 * Fundo em grade que se MOVE conforme o mouse passa: parallax + leve inclinação
 * 3D (sem iluminação/lanterna). Leve e performático, respeita reduced-motion.
 */
export default function GridBackground() {
  const layerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const layer = layerRef.current
    if (!layer) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let raf = 0
    // alvo (-0.5 → 0.5) e atual, para easing suave
    let txn = 0, tyn = 0, cx = 0, cy = 0

    const onMove = (e: MouseEvent) => {
      txn = e.clientX / window.innerWidth - 0.5
      tyn = e.clientY / window.innerHeight - 0.5
    }

    const loop = () => {
      cx += (txn - cx) * 0.08
      cy += (tyn - cy) * 0.08
      const tx = -cx * 36          // desloca a grade no sentido contrário
      const ty = -cy * 36
      const rx = cy * 6            // inclina levemente em 3D
      const ry = -cx * 6
      layer.style.transform =
        `translate3d(${tx}px, ${ty}px, 0) rotateX(${rx}deg) rotateY(${ry}deg)`
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
      aria-hidden="true"
      className="absolute inset-0 overflow-hidden"
      style={{ background: '#0a0918', perspective: '1000px' }}
    >
      {/* Camada da grade (maior que a viewport p/ não mostrar bordas ao mover) */}
      <div
        ref={layerRef}
        className="absolute -inset-16 will-change-transform"
        style={{
          transition: 'transform 0.15s ease-out',
          backgroundImage: `
            linear-gradient(rgba(11,188,212,0.10) 1px, transparent 1px),
            linear-gradient(90deg, rgba(11,188,212,0.10) 1px, transparent 1px)
          `,
          backgroundSize: '46px 46px',
        }}
      />

      {/* Orb roxo decorativo fixo (identidade Nauta) */}
      <div
        className="absolute -bottom-32 -right-24 w-[480px] h-[420px] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, rgba(124,111,255,0.10) 0%, transparent 70%)' }}
      />
      {/* Orb teal suave (topo) */}
      <div
        className="absolute -top-24 -left-16 w-[420px] h-[360px] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, rgba(11,188,212,0.08) 0%, transparent 70%)' }}
      />

      {/* Vinheta para focar no centro */}
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 45%, transparent 0%, rgba(10,9,24,0.88) 100%)' }}
      />
    </div>
  )
}

'use client'

import { useEffect, useRef } from 'react'

const RAD = Math.PI / 180

/* Projeção ortográfica: lon/lat → x,y no canvas */
function project(
  lon: number, lat: number,
  cLon: number, cLat: number,
  R: number,
): { x: number; y: number } | null {
  const dLon  = (lon - cLon) * RAD
  const cLatR = cLat * RAD
  const latR  = lat  * RAD

  const cosC = Math.sin(cLatR) * Math.sin(latR) +
               Math.cos(cLatR) * Math.cos(latR) * Math.cos(dLon)

  if (cosC < 0) return null // face oculta

  const x = R * Math.cos(latR) * Math.sin(dLon)
  const y = R * (Math.cos(cLatR) * Math.sin(latR) -
                 Math.sin(cLatR) * Math.cos(latR) * Math.cos(dLon))
  return { x, y }
}

/* Desenha um polígono projetado */
function drawPoly(
  ctx: CanvasRenderingContext2D,
  coords: [number, number][],
  cLon: number, cLat: number, R: number,
  cx: number, cy: number,
) {
  ctx.beginPath()
  let started = false
  for (const [lon, lat] of coords) {
    const p = project(lon, lat, cLon, cLat, R)
    if (!p) { started = false; continue }
    if (!started) { ctx.moveTo(cx + p.x, cy - p.y); started = true }
    else ctx.lineTo(cx + p.x, cy - p.y)
  }
  ctx.closePath()
}

/* ── Continentes simplificados [lon, lat] ── */
const SOUTH_AMERICA: [number, number][] = [
  [-55,12],[-62,11],[-68,11],[-73,11],[-77,8],[-81,8],
  [-80,1],[-80,-3],[-77,-6],[-75,-10],[-73,-15],[-73,-18],
  [-70,-18],[-70,-30],[-72,-38],[-71,-42],[-68,-55],
  [-63,-55],[-57,-55],[-53,-55],[-50,-54],
  [-44,-23],[-35,-8],[-35,-3],[-33,0],
  [-44,4],[-52,5],[-58,7],[-60,10],[-55,12],
]

const BRAZIL: [number, number][] = [
  [-34,-6],[-35,-9],[-37,-12],[-39,-16],[-39,-21],
  [-41,-22],[-44,-23],[-48,-27],[-48,-28],[-50,-30],
  [-51,-33],[-53,-33],[-53,-30],[-56,-26],[-57,-22],
  [-57,-19],[-60,-16],[-60,-13],[-63,-9],[-65,-6],
  [-70,-4],[-70,-2],[-70,0],[-70,2],
  [-64,1],[-62,1],[-60,3],[-60,5],[-58,5],
  [-52,4],[-51,4],[-50,2],[-48,0],[-44,-2],
  [-41,-3],[-37,-4],[-35,-5],[-34,-6],
]

const NORTH_AMERICA: [number, number][] = [
  [-168,72],[-140,72],[-100,74],[-80,73],[-65,68],
  [-60,60],[-65,55],[-68,50],[-60,47],[-65,44],
  [-68,44],[-70,43],[-75,40],[-80,35],[-82,30],
  [-88,30],[-90,29],[-97,26],[-105,22],[-110,24],
  [-117,32],[-118,34],[-122,37],[-124,41],[-124,47],
  [-130,54],[-140,58],[-150,60],[-155,60],
  [-160,63],[-168,67],[-168,72],
]

const EUROPE_AFRICA: [number, number][] = [
  [-17,65],[0,65],[20,60],[30,60],[35,55],[40,40],
  [36,36],[28,37],[14,37],[0,35],[-5,35],
  [-5,36],[-9,39],[-9,39],[-10,44],[-5,48],
  [0,50],[5,55],[5,58],[-5,60],[-10,55],[-17,65],
  /* África */
  [-17,65],[-17,15],[-15,11],[-12,8],[-8,5],
  [-5,5],[0,5],[5,4],[10,2],[15,0],
  [20,-5],[25,-10],[30,-17],[33,-25],[29,-30],
  [25,-34],[18,-35],[14,-34],[12,-28],[8,-20],
  [2,-12],[0,-5],[-2,4],[-5,10],[-10,15],
  [-17,15],[-17,65],
]

const ASIA: [number, number][] = [
  [30,60],[40,60],[60,58],[80,60],[100,60],
  [140,60],[150,55],[145,45],[140,40],[135,35],
  [130,33],[122,30],[120,22],[110,20],[105,12],
  [100,6],[95,5],[80,8],[75,15],[68,23],
  [60,22],[50,25],[45,30],[40,37],[36,36],
  [30,40],[28,40],[25,42],[25,50],[30,55],[30,60],
]

/* ══ Componente principal ══ */
interface Props {
  scrollProgress: number // 0 → 1
}

export default function GlobeBrazil({ scrollProgress }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef    = useRef<number | null>(null)

  // Centro inicial (Atlântico) → centro final (Brasil)
  const startLon = -20, startLat = 10
  const endLon   = -52, endLat   = -14

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!

    let pulse = 0 // animação do marcador

    const render = () => {
      const W = canvas.width
      const H = canvas.height
      const cx = W / 2
      const cy = H / 2
      const R  = Math.min(W, H) * 0.46

      // Interpola centro
      const t    = scrollProgress
      const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
      const cLon = startLon + (endLon - startLon) * ease
      const cLat = startLat + (endLat - startLat) * ease

      ctx.clearRect(0, 0, W, H)

      // ── Fundo da esfera ──
      const grad = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.3, 0, cx, cy, R)
      grad.addColorStop(0, '#1e1c45')
      grad.addColorStop(0.6, '#0e0d1f')
      grad.addColorStop(1, '#070612')
      ctx.beginPath()
      ctx.arc(cx, cy, R, 0, Math.PI * 2)
      ctx.fillStyle = grad
      ctx.fill()

      // ── Brilho de borda ──
      const rim = ctx.createRadialGradient(cx, cy, R * 0.85, cx, cy, R)
      rim.addColorStop(0, 'transparent')
      rim.addColorStop(1, 'rgba(11,188,212,0.18)')
      ctx.beginPath()
      ctx.arc(cx, cy, R, 0, Math.PI * 2)
      ctx.fillStyle = rim
      ctx.fill()

      // Clip para a esfera
      ctx.save()
      ctx.beginPath()
      ctx.arc(cx, cy, R - 1, 0, Math.PI * 2)
      ctx.clip()

      // ── Linhas de grade ──
      ctx.strokeStyle = 'rgba(11,188,212,0.07)'
      ctx.lineWidth = 0.7

      // Meridianos
      for (let lon = -180; lon <= 180; lon += 20) {
        ctx.beginPath()
        let started = false
        for (let lat = -90; lat <= 90; lat += 2) {
          const p = project(lon, lat, cLon, cLat, R)
          if (!p) { started = false; continue }
          if (!started) { ctx.moveTo(cx + p.x, cy - p.y); started = true }
          else ctx.lineTo(cx + p.x, cy - p.y)
        }
        ctx.stroke()
      }

      // Paralelos
      for (let lat = -80; lat <= 80; lat += 20) {
        ctx.beginPath()
        let started = false
        for (let lon = -180; lon <= 180; lon += 2) {
          const p = project(lon, lat, cLon, cLat, R)
          if (!p) { started = false; continue }
          if (!started) { ctx.moveTo(cx + p.x, cy - p.y); started = true }
          else ctx.lineTo(cx + p.x, cy - p.y)
        }
        ctx.stroke()
      }

      // ── Continentes ──
      const drawContinent = (coords: [number,number][], fillColor: string) => {
        drawPoly(ctx, coords, cLon, cLat, R, cx, cy)
        ctx.fillStyle = fillColor
        ctx.fill()
        ctx.strokeStyle = 'rgba(11,188,212,0.2)'
        ctx.lineWidth = 0.6
        ctx.stroke()
      }

      drawContinent(NORTH_AMERICA,   'rgba(30,28,70,0.9)')
      drawContinent(EUROPE_AFRICA,   'rgba(30,28,70,0.9)')
      drawContinent(ASIA,            'rgba(30,28,70,0.9)')
      drawContinent(SOUTH_AMERICA,   'rgba(11,188,212,0.12)')
      drawContinent(BRAZIL,          `rgba(11,188,212,${0.25 + ease * 0.35})`)

      // ── Borda do Brasil mais brilhante ──
      drawPoly(ctx, BRAZIL, cLon, cLat, R, cx, cy)
      ctx.strokeStyle = `rgba(11,188,212,${0.4 + ease * 0.5})`
      ctx.lineWidth = 1.2
      ctx.stroke()

      // ── Marcador pulsante em Brasília (-47.9, -15.8) ──
      const brasilia = project(-47.9, -15.8, cLon, cLat, R)
      if (brasilia) {
        pulse += 0.04
        const px = cx + brasilia.x
        const py = cy - brasilia.y
        const pAlpha = ease

        // Anel externo pulsante
        ctx.beginPath()
        ctx.arc(px, py, 6 + Math.sin(pulse) * 5, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(11,188,212,${0.08 * pAlpha})`
        ctx.fill()

        // Anel médio
        ctx.beginPath()
        ctx.arc(px, py, 5, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(11,188,212,${0.15 * pAlpha})`
        ctx.fill()

        // Ponto central
        ctx.beginPath()
        ctx.arc(px, py, 3, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(11,188,212,${pAlpha})`
        ctx.fill()

        // Glow
        const glow = ctx.createRadialGradient(px, py, 0, px, py, 20)
        glow.addColorStop(0, `rgba(11,188,212,${0.3 * pAlpha})`)
        glow.addColorStop(1, 'transparent')
        ctx.beginPath()
        ctx.arc(px, py, 20, 0, Math.PI * 2)
        ctx.fillStyle = glow
        ctx.fill()
      }

      ctx.restore()

      // ── Borda da esfera ──
      ctx.beginPath()
      ctx.arc(cx, cy, R, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(11,188,212,0.2)'
      ctx.lineWidth = 1
      ctx.stroke()

      rafRef.current = requestAnimationFrame(render)
    }

    render()
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [scrollProgress])

  return (
    <canvas
      ref={canvasRef}
      width={520}
      height={520}
      aria-hidden="true"
      className="pointer-events-none"
      style={{ display: 'block' }}
    />
  )
}

'use client'

import { useEffect, useState } from 'react'
import type { Heading } from '@/lib/article-html'

/** Índice "Neste artigo você vai ver" — âncoras com scroll suave e item ativo. */
export default function ArticleTOC({ headings }: { headings: Heading[] }) {
  const [active, setActive] = useState<string>('')

  useEffect(() => {
    if (!headings.length) return
    const obs = new IntersectionObserver(
      entries => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id)
      },
      { rootMargin: '-80px 0px -70% 0px', threshold: 0 }
    )
    headings.forEach(h => {
      const el = document.getElementById(h.id)
      if (el) obs.observe(el)
    })
    return () => obs.disconnect()
  }, [headings])

  if (headings.length < 2) return null

  function go(e: React.MouseEvent, id: string) {
    e.preventDefault()
    const el = document.getElementById(id)
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 90
      window.scrollTo({ top: y, behavior: 'smooth' })
      history.replaceState(null, '', `#${id}`)
    }
  }

  return (
    <nav aria-label="Índice do artigo">
      <h3 className="text-white font-black text-sm uppercase tracking-wide mb-4">
        Neste artigo você vai ver<span className="text-[#0BBCD4]">:</span>
      </h3>
      <ul className="space-y-2">
        {headings.map(h => (
          <li key={h.id}>
            <a
              href={`#${h.id}`}
              onClick={e => go(e, h.id)}
              className="block text-sm leading-snug transition-colors pl-3 border-l-2"
              style={{
                color: active === h.id ? '#0BBCD4' : '#9ca3af',
                borderColor: active === h.id ? '#0BBCD4' : 'rgba(255,255,255,0.10)',
              }}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}

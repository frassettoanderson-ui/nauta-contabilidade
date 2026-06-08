'use client'

import { useEffect, useRef } from 'react'

const ANIMATED = [
  '.animate-on-scroll',
  '.animate-from-left',
  '.animate-from-right',
  '.animate-zoom-in',
  '.animate-fade',
  '.animate-flip',
]

export function useScrollAnimation() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const activate = (el: Element) => el.classList.add('visible')

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            activate(entry.target)
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    )

    if (ref.current) {
      const selector = ANIMATED.join(',')

      // Se já está visível, ativa direto
      const rect = ref.current.getBoundingClientRect()
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        ref.current.querySelectorAll(selector).forEach(activate)
        // Verifica se o próprio container tem classe
        ANIMATED.forEach(cls => {
          if (ref.current!.matches(cls.trim())) activate(ref.current!)
        })
      } else {
        // Observa o container e todos os filhos animados
        observer.observe(ref.current)
        ref.current.querySelectorAll(selector).forEach(el => observer.observe(el))
      }
    }

    return () => observer.disconnect()
  }, [])

  return ref
}

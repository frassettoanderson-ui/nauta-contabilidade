'use client'

/**
 * FaqSection — FAQ premium com accordion animado, dark/light, numbered badges.
 */

import { useState, useRef, useEffect } from 'react'
import { Plus, Minus } from 'lucide-react'

export interface FaqItem {
  q: string
  a: string
}

interface Props {
  title?: string
  subtitle?: string
  items: FaqItem[]
  accent?: string
  dark?: boolean
}

function AccordionItem({
  question,
  answer,
  index,
  accent,
  dark,
}: {
  question: string
  answer: string
  index: number
  accent: string
  dark: boolean
}) {
  const [open, setOpen] = useState(false)
  const bodyRef = useRef<HTMLDivElement>(null)
  const accentRgb = accent === '#0BBCD4' ? '11,188,212' : '124,111,255'

  const borderColor  = dark ? 'rgba(255,255,255,0.08)' : '#e5e7eb'
  const bgHover      = dark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'
  const bgOpen       = dark ? `rgba(${accentRgb},0.05)` : `rgba(${accentRgb},0.03)`
  const questionColor = dark ? '#f3f4f6' : '#111827'
  const answerColor   = dark ? '#9ca3af' : '#4b5563'
  const numColor      = dark ? `rgba(${accentRgb},0.4)` : `rgba(${accentRgb},0.35)`

  return (
    <div
      className="rounded-2xl overflow-hidden mb-3 transition-all duration-200"
      style={{
        border: `1px solid ${open ? `rgba(${accentRgb},0.25)` : borderColor}`,
        background: open ? bgOpen : 'transparent',
      }}
    >
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-4 px-6 py-5 text-left transition-colors duration-150"
        style={{ background: open ? 'transparent' : 'transparent' }}
        aria-expanded={open}
      >
        {/* Number */}
        <span
          className="text-xs font-black tabular-nums shrink-0 w-6"
          style={{ color: numColor }}
        >
          {String(index + 1).padStart(2, '0')}
        </span>

        <span
          className="flex-1 font-semibold text-sm leading-snug"
          style={{ color: questionColor, letterSpacing: '-0.01em' }}
        >
          {question}
        </span>

        <span
          className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200"
          style={{
            background: open ? accent : `rgba(${accentRgb},0.10)`,
            border: `1px solid rgba(${accentRgb},0.2)`,
          }}
        >
          {open
            ? <Minus size={13} className="text-white" />
            : <Plus size={13} style={{ color: accent }} />
          }
        </span>
      </button>

      {/* Animated body */}
      <div
        ref={bodyRef}
        style={{
          maxHeight: open ? (bodyRef.current?.scrollHeight ?? 999) + 'px' : '0px',
          overflow: 'hidden',
          transition: 'max-height 0.35s cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        <p
          className="px-6 pb-5 text-sm leading-relaxed"
          style={{ color: answerColor, paddingLeft: '4rem' }}
        >
          {answer}
        </p>
      </div>
    </div>
  )
}

export default function FaqSection({
  title = 'Perguntas frequentes',
  subtitle,
  items,
  accent = '#0BBCD4',
  dark = false,
}: Props) {
  const accentRgb = accent === '#0BBCD4' ? '11,188,212' : '124,111,255'
  const bg = dark ? '#0a0918' : '#f8f9fb'
  const headColor = dark ? '#ffffff' : '#111827'
  const subColor  = dark ? '#9ca3af' : '#6b7280'

  return (
    <section style={{ background: bg, padding: '5rem 0' }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6">

        <div className="text-center mb-12">
          <h2
            className="text-3xl sm:text-4xl font-black mb-3"
            style={{ color: headColor, letterSpacing: '-0.025em' }}
          >
            {title}
          </h2>
          {subtitle && (
            <p className="text-sm" style={{ color: subColor }}>{subtitle}</p>
          )}
          {/* Linha decorativa centralizada */}
          <div className="flex justify-center gap-1.5 mt-4">
            <div className="h-0.5 w-8 rounded-full" style={{ background: accent }} />
            <div className="h-0.5 w-4 rounded-full" style={{ background: `rgba(${accentRgb},0.35)` }} />
          </div>
        </div>

        {items.map((item, i) => (
          <AccordionItem
            key={i}
            question={item.q}
            answer={item.a}
            index={i}
            accent={accent}
            dark={dark}
          />
        ))}
      </div>
    </section>
  )
}

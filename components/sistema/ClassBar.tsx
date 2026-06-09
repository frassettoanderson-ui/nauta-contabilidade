'use client'

import { classColor } from '@/lib/crm-config'

interface Props {
  value: number
  onChange?: (v: number) => void
  size?: 'sm' | 'md'
}

/** Barra de classificação 0→5 (vermelho → verde). Interativa se onChange. */
export default function ClassBar({ value, onChange, size = 'sm' }: Props) {
  const h = size === 'md' ? 'h-2.5' : 'h-1.5'
  const color = classColor(value)
  const interactive = !!onChange

  return (
    <div className="flex items-center gap-2">
      <div className={`flex gap-1 ${interactive ? 'cursor-pointer' : ''}`}>
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            type="button"
            disabled={!interactive}
            onClick={() => onChange?.(value === n ? n - 1 : n)}
            aria-label={`Classificar ${n}`}
            className={`${h} ${size === 'md' ? 'w-8' : 'w-5'} rounded-full transition-all`}
            style={{ background: n <= value ? color : 'rgba(255,255,255,0.10)' }}
          />
        ))}
      </div>
      {size === 'md' && <span className="text-xs font-bold" style={{ color }}>{value}/5</span>}
    </div>
  )
}

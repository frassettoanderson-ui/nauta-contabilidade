// Logo do Obrigô — portada 1:1 de gestor-oa/web/src/components/LogoObrigo.tsx
// (icone de checklist/documento com canto dobrado + wordmark com o "ô" laranja).
// variant 'light' = fundos escuros (sidebar/login); 'dark' = fundos claros.
const LARANJA = '#F47920'

export function LogoMark({ size = 32, variant = 'light' }: { size?: number; variant?: 'light' | 'dark' }) {
  const doc = variant === 'light' ? '#ffffff' : '#0E2240'
  return (
    <svg width={size} height={(size * 128) / 104} viewBox="0 0 104 128" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M26 8 H72 L98 34 V100 Q98 120 78 120 H26 Q6 120 6 100 V28 Q6 8 26 8 Z" fill="none" stroke={doc} strokeWidth="9" strokeLinejoin="round" strokeLinecap="round" />
      <path d="M72 8 L98 34 L72 34 Z" fill={LARANJA} />
      <path d="M22 50 l5 6 l11 -13" fill="none" stroke={doc} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="44" y="46" width="40" height="8" rx="4" fill={doc} />
      <path d="M22 76 l5 6 l11 -13" fill="none" stroke={doc} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="44" y="72" width="40" height="8" rx="4" fill={doc} />
      <path d="M22 102 l5 6 l11 -13" fill="none" stroke={LARANJA} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="44" y="98" width="40" height="8" rx="4" fill={LARANJA} />
    </svg>
  )
}

export default function LogoObrigo({ size = 30, showText = true, variant = 'light', className = '' }: {
  size?: number; showText?: boolean; variant?: 'light' | 'dark'; className?: string
}) {
  const txt = variant === 'light' ? '#ffffff' : '#0E2240'
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <LogoMark size={size} variant={variant} />
      {showText && (
        <span className="font-extrabold leading-none tracking-tight" style={{ fontSize: size * 0.66, color: txt }}>
          Obrig<span style={{ color: LARANJA }}>ô</span>
        </span>
      )}
    </div>
  )
}

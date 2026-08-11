'use client'

import { useState, useRef, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { ChevronsUpDown, Check } from 'lucide-react'

type Empresa = { id: string; slug: string; nome: string; cor_accent: string }

export default function EmpresaSwitcher() {
  const { data: session, update } = useSession()
  const [open, setOpen] = useState(false)
  const [trocando, setTrocando] = useState(false)
  const boxRef = useRef<HTMLDivElement>(null)

  const su = session?.user as unknown as { empresas?: Empresa[]; empresaId?: string | null } | undefined
  const empresas = su?.empresas ?? []
  const ativaId = su?.empresaId ?? null
  const ativa = empresas.find(e => e.id === ativaId) ?? empresas[0]

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  if (!ativa) return null

  const trocar = async (id: string) => {
    if (id === ativaId) { setOpen(false); return }
    setTrocando(true)
    await update({ empresaId: id })
    // Recarrega para reescopar todos os dados do servidor + aplicar o tema da empresa.
    window.location.reload()
  }

  const dot = (cor: string) => (
    <span className="inline-block w-2.5 h-2.5 rounded-full shrink-0" style={{ background: cor }} />
  )

  // Só um botão estático quando o usuário enxerga uma única empresa.
  const soUma = empresas.length <= 1

  return (
    <div className="relative w-full" ref={boxRef}>
      <button
        type="button"
        onClick={() => !soUma && setOpen(o => !o)}
        disabled={soUma || trocando}
        className="flex items-center gap-2 w-full min-w-0 px-2.5 py-1.5 rounded-lg text-left transition-colors"
        style={{ background: 'rgba(255,255,255,0.04)', cursor: soUma ? 'default' : 'pointer', opacity: trocando ? 0.6 : 1 }}
      >
        {dot(ativa.cor_accent)}
        <span className="flex-1 min-w-0 truncate text-[13px] font-semibold text-gray-100">{ativa.nome}</span>
        {!soUma && <ChevronsUpDown size={14} className="text-gray-400 shrink-0" />}
      </button>

      {open && !soUma && (
        <div
          className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 p-1 rounded-xl shadow-xl"
          style={{ background: 'var(--sys-sidebar, #0f172a)', border: '1px solid rgba(255,255,255,0.10)' }}
        >
          {empresas.map(e => {
            const sel = e.id === ativaId
            return (
              <button
                key={e.id}
                type="button"
                onClick={() => trocar(e.id)}
                className="flex items-center gap-2 w-full px-2.5 py-2 rounded-lg text-left text-[13px] hover:bg-white/[0.06] transition-colors"
                style={{ color: sel ? '#fff' : '#cbd5e1' }}
              >
                {dot(e.cor_accent)}
                <span className="flex-1 min-w-0 truncate">{e.nome}</span>
                {sel && <Check size={14} style={{ color: e.cor_accent }} />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

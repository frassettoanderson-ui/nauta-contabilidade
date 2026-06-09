'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Lock, Eye, EyeOff, Loader2, Check, X, ShieldCheck } from 'lucide-react'

const rules = [
  { test: (p: string) => p.length >= 8,            label: 'Mínimo de 8 caracteres' },
  { test: (p: string) => /[A-Za-z]/.test(p),       label: 'Pelo menos uma letra' },
  { test: (p: string) => /[0-9]/.test(p),          label: 'Pelo menos um número' },
  { test: (p: string) => /[^A-Za-z0-9]/.test(p),   label: 'Pelo menos um caractere especial' },
]

export default function ForcePasswordChange() {
  const { update } = useSession()
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const allValid = rules.every(r => r.test(pw))
  const match = pw.length > 0 && pw === pw2
  const canSubmit = allValid && match && !loading

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setLoading(true)
    setError('')
    const res = await fetch('/api/sistema/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pw }),
    })
    if (res.ok) {
      await update({ mustChangePassword: false })
      // o token é atualizado; o modal some pois a flag vira false
    } else {
      const d = await res.json().catch(() => ({}))
      setError(d.error || 'Erro ao alterar a senha.')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 backdrop-blur-md" style={{ background: 'rgba(5,4,20,0.85)' }} />

      <div className="relative z-10 w-full max-w-md rounded-2xl p-7"
        style={{ background: 'rgba(15,14,26,0.95)', border: '1px solid rgba(255,255,255,0.10)', boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}>
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3" style={{ background: 'rgba(11,188,212,0.12)', border: '1px solid rgba(11,188,212,0.25)' }}>
            <ShieldCheck size={22} className="text-[#0BBCD4]" />
          </div>
          <h2 className="text-lg font-black text-white">Defina uma nova senha</h2>
          <p className="text-gray-500 text-sm mt-1">Por segurança, redefina a senha do seu primeiro acesso.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type={show ? 'text' : 'password'} value={pw} onChange={e => setPw(e.target.value)}
              placeholder="Nova senha" autoFocus
              className="w-full h-12 pl-11 pr-11 rounded-xl text-sm text-white placeholder-gray-500 outline-none"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)' }} />
            <button type="button" onClick={() => setShow(s => !s)} aria-label="Mostrar senha"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-300">
              {show ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <div className="relative">
            <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type={show ? 'text' : 'password'} value={pw2} onChange={e => setPw2(e.target.value)}
              placeholder="Confirmar nova senha"
              className="w-full h-12 pl-11 pr-4 rounded-xl text-sm text-white placeholder-gray-500 outline-none"
              style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${pw2 && !match ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.10)'}` }} />
          </div>

          {/* Checklist de regras */}
          <ul className="space-y-1.5 py-1">
            {rules.map(r => {
              const ok = r.test(pw)
              return (
                <li key={r.label} className="flex items-center gap-2 text-xs" style={{ color: ok ? '#22c55e' : '#6b7280' }}>
                  {ok ? <Check size={13} /> : <X size={13} />} {r.label}
                </li>
              )
            })}
            <li className="flex items-center gap-2 text-xs" style={{ color: match ? '#22c55e' : '#6b7280' }}>
              {match ? <Check size={13} /> : <X size={13} />} As senhas coincidem
            </li>
          </ul>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button type="submit" disabled={!canSubmit}
            className="w-full h-12 font-bold text-white rounded-xl flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
            style={{ background: 'linear-gradient(135deg, #0BBCD4, #0999ae)', boxShadow: '0 8px 28px rgba(11,188,212,0.25)' }}>
            {loading ? <Loader2 size={18} className="animate-spin" /> : 'Salvar nova senha'}
          </button>
        </form>
      </div>
    </div>
  )
}

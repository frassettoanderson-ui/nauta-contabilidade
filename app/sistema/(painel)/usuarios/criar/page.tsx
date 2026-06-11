'use client'

import { useState } from 'react'
import { UserPlus, Loader2, Check } from 'lucide-react'
import { createUsuario } from '@/lib/api'

const FIELD = 'w-full h-11 px-4 rounded-xl text-sm text-white placeholder-gray-600 outline-none'
const FS = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)' }

const CARGOS = [
  { id: 'gerente', label: 'Gerente (acesso total)' },
  { id: 'comercial', label: 'Comercial' },
  { id: 'fiscal', label: 'Fiscal' },
  { id: 'pessoal', label: 'Pessoal' },
  { id: 'atendente', label: 'Atendente' },
]

export default function CriarUsuarioPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('comercial')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!username.trim() || !password) return
    setLoading(true); setMsg(null)
    try {
      await createUsuario(username.trim(), password, role)
      setMsg({ ok: true, text: `Usuário "${username.trim()}" criado. Ele troca a senha no 1º acesso.` })
      setUsername(''); setPassword(''); setRole('comercial')
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : 'Erro ao criar usuário.' })
    } finally { setLoading(false) }
  }

  return (
    <div className="p-6 lg:p-8 max-w-md">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white flex items-center gap-2" style={{ letterSpacing: '-0.02em' }}>
          <UserPlus size={22} className="text-[#0BBCD4]" /> Criar usuário
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">O usuário definirá a senha definitiva no primeiro acesso</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3 rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div>
          <label className="block text-xs font-semibold text-gray-400 mb-1.5">Login (usuário)</label>
          <input className={FIELD} style={FS} placeholder="nome.sobrenome" value={username} onChange={e => setUsername(e.target.value)} required />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-400 mb-1.5">Senha provisória</label>
          <input className={FIELD} style={FS} placeholder="senha provisória" value={password} onChange={e => setPassword(e.target.value)} required />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-400 mb-1.5">Cargo</label>
          <select className={`${FIELD} [&>option]:text-gray-900 [&>option]:bg-white`} style={FS} value={role} onChange={e => setRole(e.target.value)}>
            {CARGOS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </div>

        {msg && (
          <p className="text-sm rounded-lg px-3 py-2 flex items-center gap-2"
            style={{ background: msg.ok ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', color: msg.ok ? '#22c55e' : '#f87171' }}>
            {msg.ok && <Check size={14} />} {msg.text}
          </p>
        )}

        <button type="submit" disabled={loading || !username.trim() || !password}
          className="w-full h-11 font-bold text-white rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 transition-all hover:-translate-y-0.5"
          style={{ background: 'linear-gradient(135deg, #0BBCD4, #0999ae)' }}>
          {loading ? <Loader2 size={16} className="animate-spin" /> : 'Criar usuário'}
        </button>
      </form>
    </div>
  )
}

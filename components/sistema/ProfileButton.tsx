'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { User, X, Save, Loader2, Camera } from 'lucide-react'
import { getPerfil, updatePerfil, uploadDoc, type PerfilRow } from '@/lib/api'

const FS = { background: 'var(--sys-surface-3)', border: '1px solid var(--sys-border-2)' }
const FIELD = 'w-full h-11 px-4 rounded-xl text-sm text-white placeholder-gray-600 outline-none'

const ROLE_LABEL: Record<string, string> = {
  admin: 'Admin', gerente: 'Gerente', comercial: 'Comercial',
  fiscal: 'Fiscal', pessoal: 'Pessoal', atendente: 'Atendente',
}

export default function ProfileButton() {
  const [perfil, setPerfil] = useState<PerfilRow | null>(null)
  const [open, setOpen] = useState(false)

  const load = () => getPerfil().then(setPerfil).catch(() => {})
  useEffect(() => { load() }, [])

  return (
    <>
      <div className="hidden lg:block fixed top-4 right-5 z-40">
        <button onClick={() => setOpen(true)} aria-label="Meu perfil"
          className="w-11 h-11 rounded-full overflow-hidden flex items-center justify-center transition-all hover:scale-105"
          style={{ background: 'var(--sys-surface-3)', border: '2px solid rgba(11,188,212,0.5)' }}>
          {perfil?.foto_url
            ? <Image src={perfil.foto_url} alt="Perfil" width={44} height={44} className="w-full h-full object-cover" />
            : <User size={20} className="text-[#0BBCD4]" />}
        </button>
      </div>

      {open && perfil && (
        <PerfilModal perfil={perfil} onClose={() => setOpen(false)} onSaved={() => { setOpen(false); load() }} />
      )}
    </>
  )
}

function PerfilModal({ perfil, onClose, onSaved }: { perfil: PerfilRow; onClose: () => void; onSaved: () => void }) {
  const [nome, setNome] = useState(perfil.nome_completo ?? '')
  const [telefone, setTelefone] = useState(perfil.telefone ?? '')
  const [email, setEmail] = useState(perfil.email ?? '')
  const [foto, setFoto] = useState<string | null>(perfil.foto_url ?? null)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  async function handleFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return
    setUploading(true)
    try { const r = await uploadDoc(f); setFoto(r.url) } catch { alert('Erro ao enviar a foto.') }
    finally { setUploading(false) }
  }

  async function salvar() {
    setSaving(true)
    try {
      await updatePerfil({ nome_completo: nome, telefone, email, foto_url: foto })
      onSaved()
    } catch (e) { alert('Erro ao salvar: ' + (e instanceof Error ? e.message : '')) }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl p-6" style={{ background: 'var(--sys-modal)', border: '1px solid var(--sys-border-2)' }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-black text-white">Meu perfil</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><X size={20} /></button>
        </div>

        {/* Foto */}
        <div className="flex flex-col items-center mb-5">
          <label className="relative w-24 h-24 rounded-full overflow-hidden cursor-pointer flex items-center justify-center group"
            style={{ background: 'var(--sys-surface-3)', border: '2px solid rgba(11,188,212,0.5)' }}>
            {foto
              ? <Image src={foto} alt="Foto" width={96} height={96} className="w-full h-full object-cover" />
              : <User size={34} className="text-[#0BBCD4]" />}
            <span className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
              {uploading ? <Loader2 size={20} className="animate-spin text-white" /> : <Camera size={20} className="text-white" />}
            </span>
            <input type="file" accept="image/*" className="hidden" onChange={handleFoto} disabled={uploading} />
          </label>
          <p className="text-xs text-gray-500 mt-2">{perfil.username} · {ROLE_LABEL[perfil.role] ?? perfil.role}</p>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">Nome completo</label>
            <input className={FIELD} style={FS} value={nome} onChange={e => setNome(e.target.value)} placeholder="Seu nome" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">Telefone</label>
            <input className={FIELD} style={FS} value={telefone} onChange={e => setTelefone(e.target.value)} placeholder="(00) 00000-0000" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">E-mail</label>
            <input className={FIELD} style={FS} value={email} onChange={e => setEmail(e.target.value)} placeholder="email@exemplo.com" />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="px-4 h-11 rounded-xl text-sm text-gray-300" style={FS}>Cancelar</button>
          <button onClick={salvar} disabled={saving || uploading}
            className="inline-flex items-center gap-2 px-5 h-11 rounded-xl text-sm font-bold text-white disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #0BBCD4, #0999ae)' }}>
            {saving ? <Loader2 size={15} className="animate-spin" /> : <><Save size={15} /> Salvar</>}
          </button>
        </div>
      </div>
    </div>
  )
}

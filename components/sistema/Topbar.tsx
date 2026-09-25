'use client'

import { useEffect, useRef, useState } from 'react'
import { signOut, useSession } from 'next-auth/react'
import { User, Camera, Loader2, ChevronDown, LogOut } from 'lucide-react'
import { getPerfil, updatePerfil, uploadDoc, type PerfilRow } from '@/lib/api'

// Topbar no padrão do Obrigô (Layout.tsx: `flex items-center gap-4 bg-marinho-800 px-6 py-2.5 text-white`):
// à direita, nome do usuário (text-sm font-medium) e escritório (text-xs text-marca-100).
// Aqui o bloco do usuário abre um menu com "Meu perfil" e "Sair" (substitui os botões flutuantes).
const ESCRITORIO = 'Nauta Contabilidade'

// Reduz a imagem para no máx. 512px e exporta JPEG leve antes do upload
async function compressImage(file: File, max = 512): Promise<File> {
  const dataUrl: string = await new Promise((res, rej) => {
    const fr = new FileReader(); fr.onload = () => res(fr.result as string); fr.onerror = rej; fr.readAsDataURL(file)
  })
  const img: HTMLImageElement = await new Promise((res, rej) => {
    const im = new window.Image(); im.onload = () => res(im); im.onerror = rej; im.src = dataUrl
  })
  const scale = Math.min(1, max / Math.max(img.width, img.height))
  const w = Math.round(img.width * scale), h = Math.round(img.height * scale)
  const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h
  canvas.getContext('2d')!.drawImage(img, 0, 0, w, h)
  const blob: Blob = await new Promise(res => canvas.toBlob(b => res(b!), 'image/jpeg', 0.85))
  return new File([blob], 'perfil.jpg', { type: 'image/jpeg' })
}

const ROLE_LABEL: Record<string, string> = {
  admin: 'Admin', gerente: 'Gerente', comercial: 'Comercial', fiscal: 'Fiscal', pessoal: 'Pessoal', atendente: 'Atendente',
}

export default function Topbar() {
  const { data: session } = useSession()
  const [perfil, setPerfil] = useState<PerfilRow | null>(null)
  const [menu, setMenu] = useState(false)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const load = () => getPerfil().then(setPerfil).catch(() => {})
  useEffect(() => { load() }, [])
  useEffect(() => {
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setMenu(false) }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const nome = perfil?.nome_completo || session?.user?.name || session?.user?.email || 'Usuário'
  const sair = async () => { await signOut({ redirect: false }); window.location.href = '/sistema/login' }

  return (
    <>
      <header className="hidden lg:flex items-center gap-4 px-6 py-2.5 text-white shrink-0" style={{ background: '#0e2240' }}>
        <div className="ml-auto flex items-center gap-4" ref={ref}>
          <button onClick={() => setMenu(m => !m)} className="flex items-center gap-3 rounded px-1 py-0.5 hover:bg-white/10 transition">
            <span className="grid h-8 w-8 place-items-center overflow-hidden rounded-full bg-white/15">
              {perfil?.foto_url
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={perfil.foto_url} alt="" className="h-full w-full object-cover" />
                : <User size={16} />}
            </span>
            <span className="text-right leading-tight">
              <span className="block text-sm font-medium">{nome}</span>
              <span className="block text-xs" style={{ color: '#FDE6D3' }}>{ESCRITORIO}</span>
            </span>
            <ChevronDown size={14} className="opacity-70" />
          </button>
          {menu && (
            <div className="absolute right-6 top-14 z-50 w-48 overflow-hidden rounded-md border border-slate-200 bg-white text-slate-700 shadow-xl">
              <button onClick={() => { setMenu(false); setOpen(true) }} className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50">
                <User size={15} className="text-slate-400" /> Meu perfil
              </button>
              <button onClick={sair} className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50 border-t border-slate-100">
                <LogOut size={15} className="text-slate-400" /> Sair
              </button>
            </div>
          )}
        </div>
      </header>

      {open && perfil && (
        <PerfilModal perfil={perfil} onClose={() => setOpen(false)} onSaved={() => { setOpen(false); load() }} />
      )}
    </>
  )
}

// Modal no padrão do Obrigô (ui.tsx): backdrop bg-black/40 alinhado ao topo, card branco, .label/.input, btn-ghost + btn-primary.
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
    try { const small = await compressImage(f); const r = await uploadDoc(small); setFoto(r.url) }
    catch { alert('Erro ao enviar a foto.') }
    finally { setUploading(false) }
  }
  async function salvar() {
    setSaving(true)
    try { await updatePerfil({ nome_completo: nome, telefone, email, foto_url: foto }); onSaved() }
    catch (e) { alert('Erro ao salvar: ' + (e instanceof Error ? e.message : '')) }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 pt-16" onClick={onClose}>
      <div className="modal-card-anim card w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">Meu perfil</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>

        <div className="mb-5 flex flex-col items-center">
          <label className="group relative flex h-24 w-24 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 bg-slate-100" style={{ borderColor: '#F8B07A' }}>
            {foto
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={foto} alt="Foto" className="h-full w-full object-cover" />
              : <User size={34} style={{ color: '#F47920' }} />}
            <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
              {uploading ? <Loader2 size={20} className="animate-spin text-white" /> : <Camera size={20} className="text-white" />}
            </span>
            <input type="file" accept="image/*" className="hidden" onChange={handleFoto} disabled={uploading} />
          </label>
          <p className="mt-2 text-xs text-slate-500">{perfil.username} · {ROLE_LABEL[perfil.role] ?? perfil.role}</p>
        </div>

        <div className="space-y-3">
          <div><label className="label">Nome completo</label><input className="input" value={nome} onChange={e => setNome(e.target.value)} placeholder="Seu nome" /></div>
          <div><label className="label">Telefone</label><input className="input" value={telefone} onChange={e => setTelefone(e.target.value)} placeholder="(00) 00000-0000" /></div>
          <div><label className="label">E-mail</label><input className="input" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@exemplo.com" /></div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="btn-ghost border border-slate-300">Cancelar</button>
          <button onClick={salvar} disabled={saving || uploading} className="btn-primary">
            {saving ? <Loader2 size={15} className="animate-spin" /> : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  )
}

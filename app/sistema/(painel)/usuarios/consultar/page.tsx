'use client'

import { useEffect, useState, useCallback } from 'react'
import { Loader2, Pencil, Trash2, KeyRound, UserCog } from 'lucide-react'
import { listUsuariosFull, deleteUsuario, resetSenhaUsuario, type UsuarioFull } from '@/lib/api'
import EditUsuarioModal from '@/components/sistema/EditUsuarioModal'

const ROLE_LABEL: Record<string, string> = {
  admin: 'Admin', gerente: 'Gerente', comercial: 'Comercial',
  fiscal: 'Fiscal', pessoal: 'Pessoal', atendente: 'Atendente',
}

export default function ConsultarUsuariosPage() {
  const [users, setUsers] = useState<UsuarioFull[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<UsuarioFull | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    listUsuariosFull().then(setUsers).catch(() => setUsers([])).finally(() => setLoading(false))
  }, [])
  useEffect(() => { load() }, [load])

  async function handleReset(u: UsuarioFull) {
    if (!confirm(`Resetar a senha de "${u.username}" para 123456? Ele criará uma nova no próximo acesso.`)) return
    setBusyId(u.id)
    try { await resetSenhaUsuario(u.id); alert('Senha resetada para 123456.') }
    catch (e) { alert('Erro: ' + (e instanceof Error ? e.message : '')) }
    finally { setBusyId(null) }
  }

  async function handleDelete(u: UsuarioFull) {
    if (!confirm(`Excluir o usuário "${u.username}"? Esta ação não pode ser desfeita.`)) return
    setBusyId(u.id)
    try { await deleteUsuario(u.id); load() }
    catch (e) { alert('Erro: ' + (e instanceof Error ? e.message : '')) }
    finally { setBusyId(null) }
  }

  return (
    <div className="p-6 lg:p-8 max-w-4xl">
      <h1 className="text-2xl font-black text-white mb-1 flex items-center gap-2" style={{ letterSpacing: '-0.02em' }}>
        <UserCog size={22} className="text-[#0BBCD4]" /> Usuários
      </h1>
      <p className="text-gray-500 text-sm mb-6">Gerencie cargos, permissões de menu e senhas.</p>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 size={24} className="animate-spin text-[#0BBCD4]" /></div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
          {users.map((u, i) => (
            <div key={u.id} className="flex items-center justify-between gap-3 px-5 py-3.5"
              style={{ borderTop: i ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
              <div className="min-w-0">
                <p className="text-sm font-bold text-white truncate">{u.username}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(11,188,212,0.12)', color: '#0BBCD4' }}>
                    {ROLE_LABEL[u.role] ?? u.role}
                  </span>
                  {u.must_change_password && <span className="text-[11px] text-amber-400">senha pendente de troca</span>}
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button onClick={() => setEditing(u)} title="Editar"
                  className="inline-flex items-center gap-1.5 px-3 h-9 rounded-lg text-xs font-semibold text-gray-300" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <Pencil size={14} /> Editar
                </button>
                <button onClick={() => handleReset(u)} disabled={busyId === u.id} title="Resetar senha"
                  className="inline-flex items-center gap-1.5 px-3 h-9 rounded-lg text-xs font-semibold disabled:opacity-50"
                  style={{ background: 'rgba(124,111,255,0.12)', border: '1px solid rgba(124,111,255,0.3)', color: '#a99bff' }}>
                  {busyId === u.id ? <Loader2 size={14} className="animate-spin" /> : <KeyRound size={14} />} Resetar
                </button>
                <button onClick={() => handleDelete(u)} disabled={busyId === u.id} title="Excluir"
                  className="inline-flex items-center gap-1.5 px-3 h-9 rounded-lg text-xs font-semibold disabled:opacity-50"
                  style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>
                  <Trash2 size={14} /> Excluir
                </button>
              </div>
            </div>
          ))}
          {users.length === 0 && <p className="text-gray-600 text-sm text-center py-10">Nenhum usuário encontrado.</p>}
        </div>
      )}

      {editing && <EditUsuarioModal user={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load() }} />}
    </div>
  )
}

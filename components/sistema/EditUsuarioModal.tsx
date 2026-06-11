'use client'

import { useState } from 'react'
import { X, Save, Loader2 } from 'lucide-react'
import { updateUsuario, type UsuarioFull } from '@/lib/api'
import { MENU_GRUPOS, defaultPermsForRole } from '@/lib/menu-perms'

const CARGOS = [
  { id: 'gerente', label: 'Gerente (acesso total)' },
  { id: 'comercial', label: 'Comercial' },
  { id: 'fiscal', label: 'Fiscal' },
  { id: 'pessoal', label: 'Pessoal' },
  { id: 'atendente', label: 'Atendente' },
]

const FS = { background: 'var(--sys-surface-3)', border: '1px solid var(--sys-border-2)' }

export default function EditUsuarioModal({ user, onClose, onSaved }: { user: UsuarioFull; onClose: () => void; onSaved: () => void }) {
  const [role, setRole] = useState(user.role)
  // perms efetivas iniciais: salvas, ou o padrão do cargo
  const inicial = user.menu_perms && user.menu_perms.length ? user.menu_perms : (defaultPermsForRole(user.role) ?? [])
  const [perms, setPerms] = useState<string[]>(inicial)
  const [saving, setSaving] = useState(false)

  const gerenteTotal = role === 'gerente' || role === 'admin'

  const toggle = (href: string) =>
    setPerms(p => p.includes(href) ? p.filter(x => x !== href) : [...p, href])

  const toggleGrupo = (hrefs: string[], todosMarcados: boolean) =>
    setPerms(p => todosMarcados ? p.filter(x => !hrefs.includes(x)) : Array.from(new Set([...p, ...hrefs])))

  // Ao trocar o cargo, repõe as permissões padrão do novo cargo
  function trocarCargo(novo: string) {
    setRole(novo)
    setPerms(defaultPermsForRole(novo) ?? [])
  }

  async function salvar() {
    setSaving(true)
    try {
      // gerente/admin: menu_perms = null (vê tudo). Outros: lista escolhida.
      await updateUsuario(user.id, { role, menu_perms: gerenteTotal ? null : perms })
      onSaved()
    } catch (e) { alert('Erro ao salvar: ' + (e instanceof Error ? e.message : '')) }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl p-6"
        style={{ background: 'var(--sys-modal)', border: '1px solid var(--sys-border-2)' }}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-black text-white">Editar usuário</h2>
            <p className="text-sm text-gray-500">{user.username}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><X size={20} /></button>
        </div>

        <div className="mb-5">
          <label className="block text-xs font-semibold text-gray-400 mb-1.5">Cargo</label>
          <select value={role} onChange={e => trocarCargo(e.target.value)}
            className="w-full h-11 px-4 rounded-xl text-sm text-white outline-none [&>option]:text-gray-900 [&>option]:bg-white" style={FS}>
            {CARGOS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </div>

        {gerenteTotal ? (
          <p className="text-sm p-4 rounded-xl" style={{ background: 'rgba(11,188,212,0.08)', border: '1px solid rgba(11,188,212,0.2)', color: '#0BBCD4' }}>
            Gerente tem acesso a todos os menus do sistema.
          </p>
        ) : (
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-2">Menus visíveis para este usuário</label>
            <div className="space-y-3">
              {MENU_GRUPOS.map(g => {
                const hrefs = g.itens.map(i => i.href)
                const todosMarcados = hrefs.every(h => perms.includes(h))
                return (
                  <div key={g.grupo} className="rounded-xl p-3" style={{ background: 'var(--sys-surface)', border: '1px solid var(--sys-surface-4)' }}>
                    <label className="flex items-center gap-2 cursor-pointer mb-2">
                      <input type="checkbox" checked={todosMarcados} onChange={() => toggleGrupo(hrefs, todosMarcados)} className="w-4 h-4 accent-[#0BBCD4]" />
                      <span className="text-sm font-bold text-gray-200">{g.grupo}</span>
                    </label>
                    <div className="grid sm:grid-cols-2 gap-x-4 gap-y-1.5 pl-6">
                      {g.itens.map(it => (
                        <label key={it.href} className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={perms.includes(it.href)} onChange={() => toggle(it.href)} className="w-4 h-4 accent-[#0BBCD4]" />
                          <span className="text-sm text-gray-400">{it.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="px-4 h-11 rounded-xl text-sm text-gray-300" style={FS}>Cancelar</button>
          <button onClick={salvar} disabled={saving}
            className="inline-flex items-center gap-2 px-5 h-11 rounded-xl text-sm font-bold text-white disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #0BBCD4, #0999ae)' }}>
            {saving ? <Loader2 size={15} className="animate-spin" /> : <><Save size={15} /> Salvar</>}
          </button>
        </div>
      </div>
    </div>
  )
}

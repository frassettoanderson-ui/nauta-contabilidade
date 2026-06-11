'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Loader2, Lock, Check, CheckCircle2, Link2, Rocket } from 'lucide-react'
import { getOnboardingBoard, setOnboardingCheck, concluirOnboarding, gerarLinkCadastro, type OnboardingCliente } from '@/lib/api'
import { SETORES, itensDoSetor, gerenteConcluido, podeEditarSetor, todosItens, type SetorId } from '@/lib/onboarding-checklist'
import { ONBOARDING_CATEGORIAS } from '@/lib/onboarding'
import { useRealtime } from '@/components/sistema/useRealtime'

const catLabel = (slug: string | null) =>
  ONBOARDING_CATEGORIAS.find(c => c.slug === slug)?.label ?? '—'

export default function OnboardingPage() {
  const { data: session } = useSession()
  const role = (session?.user as unknown as { role?: string })?.role ?? ''
  const ehGestor = role === 'admin' || role === 'gerente'

  const [board, setBoard] = useState<OnboardingCliente[] | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  const load = useCallback(() => { getOnboardingBoard().then(setBoard).catch(() => setBoard([])) }, [])
  useEffect(() => { load() }, [load])
  useRealtime(load)

  async function toggle(c: OnboardingCliente, itemKey: string, done: boolean) {
    setBusy(itemKey + c.id)
    // otimista
    setBoard(b => b?.map(x => x.id === c.id
      ? { ...x, checks: done ? [...x.checks, itemKey] : x.checks.filter(k => k !== itemKey) }
      : x) ?? b)
    try { await setOnboardingCheck(c.id, itemKey, done) }
    catch { alert('Não foi possível atualizar. Recarregando.'); load() }
    finally { setBusy(null) }
  }

  async function concluir(c: OnboardingCliente) {
    if (!confirm(`Concluir o onboarding de "${c.nome}"? Ele sai do quadro.`)) return
    try { await concluirOnboarding(c.id); load() }
    catch { alert('Erro ao concluir.') }
  }

  async function enviarLink(c: OnboardingCliente) {
    if (!c.cliente_id) { alert('Cadastro do cliente não encontrado.'); return }
    try {
      const r = await gerarLinkCadastro(c.cliente_id)
      await navigator.clipboard?.writeText(r.url).catch(() => {})
      alert('Link de cadastro copiado:\n\n' + r.url)
    } catch { alert('Erro ao gerar o link.') }
  }

  return (
    <div className="p-6 lg:p-8">
      <h1 className="text-2xl font-black text-white mb-1 flex items-center gap-2" style={{ letterSpacing: '-0.02em' }}>
        <Rocket size={22} className="text-[#0BBCD4]" /> Onboarding
      </h1>
      <p className="text-gray-500 text-sm mb-6">Clientes em processo. Marque os itens do seu setor conforme conclui.</p>

      {board === null ? (
        <div className="flex justify-center py-20"><Loader2 size={24} className="animate-spin text-[#0BBCD4]" /></div>
      ) : board.length === 0 ? (
        <div className="rounded-2xl p-10 text-center" style={{ background: 'var(--sys-surface)', border: '1px solid var(--sys-border)' }}>
          <p className="text-gray-400 text-sm">Nenhum cliente em onboarding no momento.</p>
        </div>
      ) : (
        <div className="flex gap-5 overflow-x-auto pb-4">
          {board.map(c => {
            const cat = c.onboarding_categoria ?? ''
            const gerOk = gerenteConcluido(cat, c.checks)
            const itens = todosItens(cat)
            const feitos = itens.filter(i => c.checks.includes(i.key)).length
            return (
              <div key={c.id} className="w-80 shrink-0 rounded-2xl p-4"
                style={{ background: 'var(--sys-surface)', border: '1px solid var(--sys-border)' }}>
                {/* Cabeçalho do cliente */}
                <div className="mb-3 pb-3 border-b" style={{ borderColor: 'var(--sys-surface-4)' }}>
                  <p className="text-white font-bold leading-tight truncate">{c.nome}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[#0BBCD4] text-xs">{catLabel(c.onboarding_categoria)}</span>
                    <span className="text-[11px] text-gray-500 font-bold">{feitos}/{itens.length}</span>
                  </div>
                </div>

                {/* Seções por setor */}
                <div className="space-y-4">
                  {SETORES.map(s => {
                    const setor = s.id as SetorId
                    const setorItens = itensDoSetor(setor, cat)
                    const bloqueado = setor !== 'gerente' && !gerOk
                    const editavel = !bloqueado && podeEditarSetor(role, setor)
                    return (
                      <div key={setor}>
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <span className="text-[11px] font-bold uppercase tracking-wide text-gray-400">{s.label}</span>
                          {bloqueado && <Lock size={11} className="text-gray-600" />}
                          {bloqueado && <span className="text-[10px] text-gray-600">aguardando gerente</span>}
                        </div>

                        {setorItens.length === 0 ? (
                          <p className="text-[11px] text-gray-600 italic pl-0.5">
                            {bloqueado ? '—' : 'Itens a definir.'}
                          </p>
                        ) : (
                          <div className="space-y-1">
                            {setorItens.map(it => {
                              const done = c.checks.includes(it.key)
                              const loading = busy === it.key + c.id
                              return (
                                <button key={it.key} disabled={!editavel || loading}
                                  onClick={() => toggle(c, it.key, !done)}
                                  className="w-full flex items-center gap-2 text-left text-sm rounded-lg px-2 py-1.5 transition-colors disabled:cursor-default"
                                  style={{ background: done ? 'rgba(34,197,94,0.10)' : 'transparent' }}>
                                  <span className="w-4 h-4 rounded flex items-center justify-center shrink-0"
                                    style={{ background: done ? '#22c55e' : 'transparent', border: done ? 'none' : '1.5px solid var(--sys-border-2)' }}>
                                    {loading ? <Loader2 size={11} className="animate-spin text-gray-400" /> : done ? <Check size={12} className="text-white" /> : null}
                                  </span>
                                  <span className={done ? 'text-gray-500 line-through' : 'text-gray-200'}>{it.label}</span>
                                </button>
                              )
                            })}
                          </div>
                        )}

                        {/* Ação extra: enviar link de cadastro (gerente) */}
                        {setor === 'gerente' && ehGestor && (
                          <button onClick={() => enviarLink(c)}
                            className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-lg"
                            style={{ background: 'rgba(124,111,255,0.12)', border: '1px solid rgba(124,111,255,0.3)', color: '#a99bff' }}>
                            <Link2 size={12} /> Enviar link de cadastro
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Concluir (gerente/admin) */}
                {ehGestor && (
                  <button onClick={() => concluir(c)}
                    className="w-full mt-4 inline-flex items-center justify-center gap-1.5 h-9 rounded-lg text-xs font-bold text-white"
                    style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}>
                    <CheckCircle2 size={14} /> Concluir onboarding
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

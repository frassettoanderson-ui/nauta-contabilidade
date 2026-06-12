'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Loader2, Lock, Check, CheckCircle2, Link2, Rocket, MessageCircle, Pencil, ClipboardCheck } from 'lucide-react'
import { getOnboardingBoard, setOnboardingCheck, concluirOnboarding, gerarLinkCadastro, type OnboardingCliente } from '@/lib/api'
import { SETORES, itensDoSetor, gerenteConcluido, podeEditarSetor, checksEfetivos, setorConcluido, setorItensCompletos, tudoConcluido, doneKey, ITEM_CADASTRO, type SetorId } from '@/lib/onboarding-checklist'
import { ONBOARDING_CATEGORIAS } from '@/lib/onboarding'
import { useRealtime } from '@/components/sistema/useRealtime'
import LeadModal from '@/components/sistema/LeadModal'

const catLabel = (slug: string | null) =>
  ONBOARDING_CATEGORIAS.find(c => c.slug === slug)?.label ?? '—'

const waLink = (tel: string) => `https://wa.me/55${(tel || '').replace(/\D/g, '')}`

export default function OnboardingPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const role = (session?.user as unknown as { role?: string })?.role ?? ''
  const ehGestor = role === 'admin' || role === 'gerente'

  const [board, setBoard] = useState<OnboardingCliente[] | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [editId, setEditId] = useState<string | null>(null)

  const load = useCallback(() => { getOnboardingBoard().then(setBoard).catch(() => setBoard([])) }, [])
  useEffect(() => { load() }, [load])
  useRealtime(load)

  async function toggle(c: OnboardingCliente, itemKey: string, done: boolean) {
    setBusy(itemKey + c.id)
    setBoard(b => b?.map(x => x.id === c.id
      ? { ...x, checks: done ? [...x.checks, itemKey] : x.checks.filter(k => k !== itemKey) }
      : x) ?? b)
    try { await setOnboardingCheck(c.id, itemKey, done) }
    catch { alert('Não foi possível atualizar. Recarregando.'); load() }
    finally { setBusy(null) }
  }

  async function toggleSetor(c: OnboardingCliente, setor: SetorId, done: boolean) {
    const key = doneKey(setor)
    setBusy(key + c.id)
    setBoard(b => b?.map(x => x.id === c.id
      ? { ...x, checks: done ? [...x.checks, key] : x.checks.filter(k => k !== key) }
      : x) ?? b)
    try { await setOnboardingCheck(c.id, key, done) }
    catch (e) { alert(e instanceof Error ? e.message : 'Erro ao concluir setor.'); load() }
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

  function MiniBtn({ title, onClick, color = '#9ca3af', children }: { title: string; onClick: () => void; color?: string; children: React.ReactNode }) {
    return (
      <button title={title} onClick={onClick}
        className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-white/10" style={{ color }}>
        {children}
      </button>
    )
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
            const checks = checksEfetivos(c.checks, c.cadastro_completo)
            const gerOk = gerenteConcluido(cat, checks)
            // Gerente/admin veem todos os setores; cada setor vê só o seu
            const setoresVisiveis = ehGestor ? SETORES : SETORES.filter(s => s.id === role)
            const itens = setoresVisiveis.flatMap(s => itensDoSetor(s.id, cat))
            const feitos = itens.filter(i => checks.includes(i.key)).length
            const prontoConcluir = tudoConcluido(cat, checks)
            return (
              <div key={c.id} className="w-80 shrink-0 rounded-2xl p-4 transition-all"
                style={{
                  background: prontoConcluir ? 'rgba(34,197,94,0.06)' : 'var(--sys-surface)',
                  border: prontoConcluir ? '1.5px solid #22c55e' : '1px solid var(--sys-border)',
                  boxShadow: prontoConcluir ? '0 0 14px rgba(34,197,94,0.25)' : undefined,
                }}>
                {/* Cabeçalho do cliente */}
                <div className="mb-3 pb-3 border-b" style={{ borderColor: 'var(--sys-surface-4)' }}>
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-white font-bold leading-tight truncate">{c.nome}</p>
                    <span className="text-[11px] text-gray-500 font-bold shrink-0 mt-0.5">{feitos}/{itens.length}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-1.5">
                    <span className="text-[#0BBCD4] text-xs truncate">{catLabel(c.onboarding_categoria)}</span>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <a title="WhatsApp" href={waLink(c.whatsapp)} target="_blank" rel="noopener noreferrer"
                        className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-green-500/15" style={{ color: '#25D366' }}>
                        <MessageCircle size={15} />
                      </a>
                      <MiniBtn title="Editar lead" onClick={() => setEditId(c.id)}><Pencil size={14} /></MiniBtn>
                      <MiniBtn title="Cadastro" onClick={() => router.push(`/sistema/clientes/cadastrar?lead=${c.id}`)} color="#22c55e"><ClipboardCheck size={15} /></MiniBtn>
                    </div>
                  </div>
                </div>

                {/* Concluir onboarding — só quando todos os setores concluíram */}
                {ehGestor && prontoConcluir && (
                  <button onClick={() => concluir(c)}
                    className="w-full mb-4 inline-flex items-center justify-center gap-1.5 h-10 rounded-lg text-sm font-bold text-white"
                    style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)', boxShadow: '0 0 12px rgba(34,197,94,0.4)' }}>
                    <CheckCircle2 size={16} /> Concluir onboarding
                  </button>
                )}

                {/* Seções por setor */}
                <div className="space-y-4">
                  {setoresVisiveis.map(s => {
                    const setor = s.id as SetorId
                    const setorItens = itensDoSetor(setor, cat)
                    const bloqueado = setor !== 'gerente' && !gerOk
                    const editavel = !bloqueado && podeEditarSetor(role, setor)
                    const concluido = setorConcluido(setor, checks)
                    const podeConcluir = editavel && setorItensCompletos(setor, cat, checks)
                    return (
                      <div key={setor}>
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <span className="text-[11px] font-bold uppercase tracking-wide text-gray-400">{s.label}</span>
                          {concluido && <CheckCircle2 size={12} className="text-[#22c55e]" />}
                          {bloqueado && <Lock size={11} className="text-gray-600" />}
                          {bloqueado && <span className="text-[10px] text-gray-600">aguardando gerente</span>}
                        </div>

                        {setorItens.length === 0 ? (
                          <p className="text-[11px] text-gray-600 italic pl-0.5">{bloqueado ? '—' : 'Itens a definir.'}</p>
                        ) : (
                          <div className="space-y-1">
                            {setorItens.map(it => {
                              const done = checks.includes(it.key)
                              const auto = it.key === ITEM_CADASTRO
                              const loading = busy === it.key + c.id
                              const podeClicar = editavel && !auto
                              return (
                                <button key={it.key} disabled={!podeClicar || loading}
                                  onClick={() => toggle(c, it.key, !done)}
                                  title={auto ? 'Marca sozinho quando o cadastro fica completo' : undefined}
                                  className="w-full flex items-center gap-2 text-left text-sm rounded-lg px-2 py-1.5 transition-colors disabled:cursor-default"
                                  style={{ background: done ? 'rgba(34,197,94,0.10)' : 'transparent' }}>
                                  <span className="w-4 h-4 rounded flex items-center justify-center shrink-0"
                                    style={{ background: done ? '#22c55e' : 'transparent', border: done ? 'none' : '1.5px solid var(--sys-border-2)' }}>
                                    {loading ? <Loader2 size={11} className="animate-spin text-gray-400" /> : done ? <Check size={12} className="text-white" /> : null}
                                  </span>
                                  <span className={done ? 'text-gray-500 line-through' : 'text-gray-200'}>{it.label}</span>
                                  {auto && <span className="ml-auto text-[9px] uppercase font-bold text-gray-600 shrink-0">auto</span>}
                                </button>
                              )
                            })}
                          </div>
                        )}

                        {/* Ações do setor */}
                        {setorItens.length > 0 && (editavel || (setor === 'gerente' && ehGestor)) && (
                          <div className="flex items-center justify-center flex-wrap gap-2 mt-2.5">
                            {setor === 'gerente' && ehGestor && (
                              <button onClick={() => enviarLink(c)}
                                className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg"
                                style={{ background: 'rgba(124,111,255,0.12)', border: '1px solid rgba(124,111,255,0.3)', color: '#a99bff' }}>
                                <Link2 size={12} /> Enviar link de cadastro
                              </button>
                            )}
                            {editavel && (
                              concluido ? (
                                <button onClick={() => toggleSetor(c, setor, false)}
                                  className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg text-white"
                                  style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}>
                                  <CheckCircle2 size={12} /> Concluído
                                </button>
                              ) : (
                                <button onClick={() => toggleSetor(c, setor, true)} disabled={!podeConcluir}
                                  className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg disabled:opacity-40"
                                  style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.35)', color: '#22c55e' }}>
                                  <Check size={12} /> Concluir
                                </button>
                              )
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {editId && <LeadModal leadId={editId} mode="edit" onClose={() => setEditId(null)} onChanged={load} />}
    </div>
  )
}

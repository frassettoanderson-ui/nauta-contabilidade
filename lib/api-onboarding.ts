// Onboarding na API pública: o cliente (lead) + o checklist por setor com o que já foi feito.
import pool from './db'
import { montarLead } from './integracoes'
import { SETORES, itensDoSetor, checksEfetivos, doneKey, type SetorId } from './onboarding-checklist'
import { isContratoPronto } from './contratos'

export async function onboardingDaEmpresa(empresaId: string, opts: { leadId?: string; incluirConcluidos?: boolean } = {}) {
  const cond = ['l.empresa_id = $1', 'l.em_onboarding = true'], vals: unknown[] = [empresaId]
  if (!opts.incluirConcluidos && !opts.leadId) cond.push('COALESCE(l.onboarding_concluido, false) = false')
  if (opts.leadId) { vals.push(opts.leadId); cond.push(`l.id = $${vals.length}`) }
  const leads = (await pool.query(`SELECT l.* FROM leads l WHERE ${cond.join(' AND ')} ORDER BY COALESCE(l.onboarding_iniciado_em, l.criado_em) DESC LIMIT 500`, vals)).rows
  if (!leads.length) return []
  const ids = leads.map((l) => l.id)
  const checks: Record<string, { item: string; por: string | null; em: string | null }[]> = {}
  for (const r of (await pool.query(`SELECT lead_id, item_key, done_by, done_at FROM onboarding_checks WHERE lead_id = ANY($1)`, [ids])).rows) {
    (checks[r.lead_id] ||= []).push({ item: r.item_key, por: r.done_by ?? null, em: r.done_at ? new Date(r.done_at).toISOString() : null })
  }
  const clientes: Record<string, Record<string, unknown>> = {}
  for (const c of (await pool.query(`SELECT * FROM clientes WHERE lead_id = ANY($1)`, [ids])).rows) clientes[c.lead_id] = c
  return leads.map((l) => {
    const c = clientes[l.id] ?? null
    const marcados = checks[l.id] ?? []
    const efetivos = checksEfetivos(marcados.map((m) => m.item), isContratoPronto(c, l))
    const cat = l.onboarding_categoria ?? ''
    return {
      ...montarLead(l, c),
      setores: SETORES.map((s) => ({
        setor: s.id, nome: s.label, concluido: efetivos.includes(doneKey(s.id as SetorId)),
        itens: itensDoSetor(s.id as SetorId, cat).map((i) => {
          const m = marcados.find((x) => x.item === i.key)
          return { item: i.key, descricao: i.label, feito: efetivos.includes(i.key), por: m?.por ?? null, em: m?.em ?? null }
        }),
      })).filter((s) => s.itens.length),
    }
  })
}

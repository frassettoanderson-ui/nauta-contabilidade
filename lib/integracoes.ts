// Integrações com sistemas externos: chaves de API e webhooks, por perfil (empresas: atuan/nauta/meis).
//
// Webhook = o sistema AVISA o outro sistema na hora em que algo acontece (cliente entrou no
// onboarding, lead novo, contrato assinado...). Cada evento vira uma linha em integracao_entregas
// (fila) e é enviado na hora; se o destino falhar, o cron (/api/integracoes/processar, a cada minuto)
// tenta de novo com espera crescente. Cada aviso vai assinado com HMAC-SHA256 do segredo do webhook.
import crypto from 'crypto'
import pool from './db'

// ─── Catálogo de eventos ────────────────────────────────────────────────────
export const EVENTOS = [
  { id: 'lead.criado', label: 'Lead novo', descricao: 'Entrou um lead (site, chat do site, indicação ou cadastro manual no CRM).' },
  { id: 'onboarding.iniciado', label: 'Cliente entrou no onboarding', descricao: 'O cliente fechou e foi para a Etapa 1 do onboarding — ideal para a mensagem de boas-vindas.' },
  { id: 'onboarding.item_marcado', label: 'Item do onboarding marcado/desmarcado', descricao: 'Algum setor marcou (ou desmarcou) uma atividade do checklist do cliente.' },
  { id: 'onboarding.setor_concluido', label: 'Setor concluiu a parte dele', descricao: 'Gerente, Fiscal, Pessoal ou Atendente finalizou todos os itens do setor no onboarding.' },
  { id: 'onboarding.concluido', label: 'Onboarding concluído', descricao: 'O gerente concluiu o onboarding: o cliente passa a ser da carteira.' },
  { id: 'contrato.assinado', label: 'Contrato assinado', descricao: 'O contrato do cliente foi assinado (eletrônico ou assinatura manual).' },
  { id: 'empresa.cadastrada', label: 'Empresa cadastrada no Obrigô', descricao: 'Uma empresa nova entrou no Obrigô (cadastro manual ou vinda do onboarding).' },
] as const
export type EventoId = (typeof EVENTOS)[number]['id'] | 'teste.ping'
const IDS = new Set<string>(EVENTOS.map((e) => e.id))
export const eventoValido = (e: string) => IDS.has(e)

// Espera entre tentativas (min): 1, 5, 15, 60, 6h, 24h — na 7ª falha desiste (status "falhou")
const ESPERAS_MIN = [1, 5, 15, 60, 360, 1440]
const MAX_TENTATIVAS = ESPERAS_MIN.length + 1

// ─── Chaves de API ──────────────────────────────────────────────────────────
const sha256 = (v: string) => crypto.createHash('sha256').update(v).digest('hex')
const b64url = (b: Buffer) => b.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

export async function criarChave(empresaId: string, nome: string, escrita: boolean, criadoPor: string | null) {
  const chave = `obr_${b64url(crypto.randomBytes(30))}`
  const r = await pool.query(
    `INSERT INTO integracao_chaves (empresa_id, nome, prefixo, hash, escrita, criado_por) VALUES ($1,$2,$3,$4,$5,$6)
     RETURNING id, nome, prefixo, escrita, criado_por, criado_em, ultimo_uso, revogada_em`,
    [empresaId, nome, chave.slice(0, 12), sha256(chave), escrita, criadoPor],
  )
  return { ...r.rows[0], chave } // a chave em claro só sai aqui
}

export async function revogarChave(empresaId: string, id: string) {
  await pool.query(`UPDATE integracao_chaves SET revogada_em = now() WHERE id = $1 AND empresa_id = $2 AND revogada_em IS NULL`, [id, empresaId])
}

export interface AcessoApi { chaveId: string; nome: string; empresaId: string; perfil: string; escrita: boolean }

// Bearer <chave> (ou header x-api-key). null = sem acesso.
export async function autenticarChave(headers: Headers): Promise<AcessoApi | null> {
  const auth = headers.get('authorization') || ''
  const chave = (auth.toLowerCase().startsWith('bearer ') ? auth.slice(7) : headers.get('x-api-key') || '').trim()
  if (!chave.startsWith('obr_')) return null
  const r = await pool.query(
    `SELECT k.id, k.nome, k.empresa_id, k.escrita, k.ultimo_uso, e.slug FROM integracao_chaves k JOIN empresas e ON e.id = k.empresa_id
      WHERE k.hash = $1 AND k.revogada_em IS NULL`, [sha256(chave)],
  )
  const k = r.rows[0]
  if (!k) return null
  // marca o uso no máximo 1x por minuto (não pesar o banco a cada chamada)
  if (!k.ultimo_uso || Date.now() - new Date(k.ultimo_uso).getTime() > 60_000) {
    pool.query(`UPDATE integracao_chaves SET ultimo_uso = now() WHERE id = $1`, [k.id]).catch(() => {})
  }
  return { chaveId: k.id, nome: k.nome, empresaId: k.empresa_id, perfil: k.slug, escrita: !!k.escrita }
}

// ─── Webhooks ───────────────────────────────────────────────────────────────
export const novoSegredo = () => `whsec_${b64url(crypto.randomBytes(24))}`

export function urlValida(u: string) {
  try { const x = new URL(u); return x.protocol === 'https:' || x.protocol === 'http:' } catch { return false }
}

// ─── Dados que vão no aviso ─────────────────────────────────────────────────
const dataISO = (v: unknown) => (v instanceof Date ? v.toISOString() : v ? String(v) : null)
const dia = (v: unknown) => (v instanceof Date ? `${v.getFullYear()}-${String(v.getMonth() + 1).padStart(2, '0')}-${String(v.getDate()).padStart(2, '0')}` : v ? String(v).slice(0, 10) : null)

// Retrato do lead/cliente (o mesmo formato na API e nos webhooks)
export function montarLead(l: Record<string, unknown>, c?: Record<string, unknown> | null) {
  return {
    id: l.id,
    nome: l.nome ?? null,
    whatsapp: l.whatsapp ?? null,
    email: l.email ?? null,
    interesse: l.interesse ?? null,
    origem: l.origem ?? null,
    indicado_por: l.indicado_por ?? null,
    etapa_crm: l.etapa ?? null,
    responsavel: l.responsavel_nome ?? null,
    criado_em: dataISO(l.criado_em),
    honorario: l.valor_honorario != null ? Number(l.valor_honorario) : null,
    honorario_vencimento: dia(l.honorario_vencimento),
    onboarding: {
      ativo: !!l.em_onboarding,
      categoria: l.onboarding_categoria ?? null,
      iniciado_em: dataISO(l.onboarding_iniciado_em),
      concluido: !!l.onboarding_concluido,
    },
    empresa: c ? {
      cliente_id: c.id,
      razao_social: c.emp_nome ?? null,
      cnpj: c.emp_cnpj ?? null,
      telefone: c.emp_telefone ?? null,
      email: c.emp_email ?? null,
      responsavel: c.cli_nome_completo ?? null,
      responsavel_email: c.cli_email ?? null,
    } : null,
  }
}

export async function leadComCliente(leadId: string) {
  const l = (await pool.query(`SELECT * FROM leads WHERE id = $1`, [leadId])).rows[0]
  if (!l) return null
  const c = (await pool.query(`SELECT * FROM clientes WHERE lead_id = $1 LIMIT 1`, [leadId])).rows[0] ?? null
  return { l, c, dados: montarLead(l, c) }
}

// ─── Emissão (nunca lança: integração não pode travar o fluxo do sistema) ──
export async function emitir(empresaId: string | null | undefined, evento: EventoId, dados: unknown) {
  try {
    if (!empresaId) return
    const hooks = await pool.query(
      `SELECT w.id, e.slug FROM integracao_webhooks w JOIN empresas e ON e.id = w.empresa_id
        WHERE w.empresa_id = $1 AND w.ativo AND ($2 = ANY(w.eventos) OR '*' = ANY(w.eventos))`,
      [empresaId, evento],
    )
    if (!hooks.rows.length) return
    const eventoId = crypto.randomUUID()
    const envelope = { id: eventoId, evento, criado_em: new Date().toISOString(), perfil: hooks.rows[0].slug, dados }
    const ids: string[] = []
    for (const h of hooks.rows) {
      const r = await pool.query(
        `INSERT INTO integracao_entregas (webhook_id, empresa_id, evento, evento_id, payload) VALUES ($1,$2,$3,$4,$5) RETURNING id`,
        [h.id, empresaId, evento, eventoId, JSON.stringify(envelope)],
      )
      ids.push(r.rows[0].id)
    }
    void processar(ids) // na hora; o cron cobre o que falhar
  } catch (e) {
    console.error('[integracoes] emitir falhou:', evento, (e as Error).message)
  }
}

// Evento de um lead (onboarding, contrato): manda o retrato atual do lead + o que vier em `extra`
export async function emitirDoLead(leadId: string, evento: EventoId, extra: Record<string, unknown> = {}) {
  try {
    const x = await leadComCliente(leadId)
    if (!x) return
    await emitir(x.l.empresa_id, evento, { ...extra, lead: x.dados })
  } catch (e) {
    console.error('[integracoes] emitirDoLead falhou:', evento, (e as Error).message)
  }
}

// ─── Entrega ────────────────────────────────────────────────────────────────
export function assinar(segredo: string, timestamp: string, corpo: string) {
  return 'sha256=' + crypto.createHmac('sha256', segredo).update(`${timestamp}.${corpo}`).digest('hex')
}

// Pega (com trava) as entregas a enviar: as `ids` informadas ou as pendentes vencidas da fila.
// A trava empurra proxima_em 2 min à frente: se o processo cair no meio, o cron reenvia depois.
async function reservar(ids?: string[], limite = 50) {
  const r = await pool.query(
    `UPDATE integracao_entregas SET proxima_em = now() + interval '2 minutes'
      WHERE id IN (
        SELECT id FROM integracao_entregas
         WHERE status = 'pendente' AND proxima_em <= now() ${ids ? 'AND id = ANY($2)' : ''}
         ORDER BY proxima_em LIMIT $1 FOR UPDATE SKIP LOCKED)
      RETURNING id, webhook_id, evento, payload, tentativas`,
    ids ? [limite, ids] : [limite],
  )
  return r.rows as { id: string; webhook_id: string; evento: string; payload: unknown; tentativas: number }[]
}

async function entregar(e: { id: string; webhook_id: string; evento: string; payload: unknown; tentativas: number }) {
  const w = (await pool.query(`SELECT url, segredo, ativo FROM integracao_webhooks WHERE id = $1`, [e.webhook_id])).rows[0]
  if (!w) return
  const corpo = JSON.stringify(e.payload)
  const ts = String(Math.floor(Date.now() / 1000))
  const tentativas = e.tentativas + 1
  let codigo: number | null = null, resposta = '', erro = ''
  try {
    const r = await fetch(w.url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json', 'user-agent': 'Obrigo-Webhooks/1.0',
        'x-obrigo-evento': e.evento, 'x-obrigo-entrega': e.id, 'x-obrigo-timestamp': ts,
        'x-obrigo-assinatura': assinar(w.segredo, ts, corpo),
      },
      body: corpo, signal: AbortSignal.timeout(10_000), redirect: 'manual',
    })
    codigo = r.status
    resposta = (await r.text().catch(() => '')).slice(0, 1000)
  } catch (x) { erro = ((x as Error).name === 'TimeoutError' ? 'O destino não respondeu em 10 segundos' : (x as Error).message || 'Falha de rede').slice(0, 500) }

  if (codigo && codigo >= 200 && codigo < 300) {
    await pool.query(`UPDATE integracao_entregas SET status='entregue', tentativas=$2, ultimo_codigo=$3, ultima_resposta=$4, ultimo_erro=NULL, entregue_em=now() WHERE id=$1`, [e.id, tentativas, codigo, resposta])
    await pool.query(`UPDATE integracao_webhooks SET falhas_seguidas = 0 WHERE id = $1`, [e.webhook_id])
    return
  }
  const desiste = tentativas >= MAX_TENTATIVAS
  const espera = ESPERAS_MIN[Math.min(tentativas - 1, ESPERAS_MIN.length - 1)]
  await pool.query(
    `UPDATE integracao_entregas SET status=$2, tentativas=$3, ultimo_codigo=$4, ultima_resposta=$5, ultimo_erro=$6,
        proxima_em = now() + ($7 || ' minutes')::interval WHERE id=$1`,
    [e.id, desiste ? 'falhou' : 'pendente', tentativas, codigo, resposta || null, erro || (codigo ? `O destino respondeu HTTP ${codigo}` : null), String(espera)],
  )
  await pool.query(`UPDATE integracao_webhooks SET falhas_seguidas = falhas_seguidas + 1 WHERE id = $1`, [e.webhook_id])
}

export async function processar(ids?: string[]) {
  let enviadas = 0
  try {
    for (;;) {
      const lote = await reservar(ids)
      if (!lote.length) break
      await Promise.all(lote.map((e) => entregar(e).catch((x) => console.error('[integracoes] entrega', e.id, (x as Error).message))))
      enviadas += lote.length
      if (ids) break
    }
  } catch (e) { console.error('[integracoes] processar falhou:', (e as Error).message) }
  return enviadas
}

// Reenviar uma entrega (do histórico): volta para a fila e tenta na hora
export async function reenviar(empresaId: string, entregaId: string) {
  const r = await pool.query(
    `UPDATE integracao_entregas SET status='pendente', proxima_em=now(), tentativas = 0 WHERE id=$1 AND empresa_id=$2 RETURNING id`, [entregaId, empresaId],
  )
  if (!r.rows[0]) return false
  await processar([entregaId])
  return true
}

// Botão "Enviar teste": um aviso teste.ping só para este webhook, enviado na hora; devolve o resultado
export async function testarWebhook(empresaId: string, webhookId: string) {
  const w = (await pool.query(`SELECT w.id, e.slug FROM integracao_webhooks w JOIN empresas e ON e.id = w.empresa_id WHERE w.id = $1 AND w.empresa_id = $2`, [webhookId, empresaId])).rows[0]
  if (!w) return null
  const eventoId = crypto.randomUUID()
  const envelope = { id: eventoId, evento: 'teste.ping', criado_em: new Date().toISOString(), perfil: w.slug, dados: { mensagem: 'Teste de integração do Obrigô. Se você recebeu, está funcionando.' } }
  const r = await pool.query(
    `INSERT INTO integracao_entregas (webhook_id, empresa_id, evento, evento_id, payload) VALUES ($1,$2,'teste.ping',$3,$4) RETURNING id`,
    [w.id, empresaId, eventoId, JSON.stringify(envelope)],
  )
  await processar([r.rows[0].id])
  return (await pool.query(`SELECT id, status, ultimo_codigo, ultima_resposta, ultimo_erro FROM integracao_entregas WHERE id = $1`, [r.rows[0].id])).rows[0]
}

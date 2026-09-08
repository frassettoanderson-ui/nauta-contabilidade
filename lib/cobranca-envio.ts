import pool from './db'
import { emitCrmChange } from './realtime'
import { getOrCreatePixAuto } from './pix-automatico'
import { pixDaCobranca } from './asaas'

// ─── Régua de cobrança pelos canais da Nauta ─────────────────────────────────
// WhatsApp: API pública do Whats Profissional (número do atendimento) — sem custo por msg.
// E-mail: SMTP (Titan) — opcional, só se SMTP_* estiver configurado.
// Cadência: D-3 (lembrete), D0 (vencimento), D+3 (atraso). Cada envio fica em cobranca_envios.
// Quem está no Pix Automático (autorização ACTIVE) NÃO recebe a régua.
// Proteção do chip: 3 variações de texto sorteadas, intervalo entre envios, horário comercial.

export type TipoEnvio = 'lembrete' | 'vencimento' | 'atraso'
const RAND = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)]

// Texto principal (sem o PIX/boleto embutidos — eles vão em mensagens separadas,
// senão o WhatsApp cria preview da URL e embola o código copia-e-cola).
const MENSAGENS: Record<TipoEnvio, string[]> = {
  lembrete: [
    'Olá {nome}, tudo bem? 😊 Passando para lembrar que o honorário da {empresa} ({valor}) vence em {venc}. Logo abaixo deixo o *PIX copia e cola* e o *boleto* para facilitar. Qualquer dúvida estamos por aqui! 🙏',
    'Oi {nome}! Aqui é da Nauta Contabilidade. O honorário de {venc} da {empresa} está chegando: {valor}. Mando abaixo o PIX e o boleto para você escolher como pagar. Obrigado!',
    '{nome}, bom dia! Seu honorário da {empresa} ({valor}) vence em {venc}. Para facilitar, deixo abaixo o PIX copia e cola e o link do boleto. 😉',
  ],
  vencimento: [
    'Olá {nome}! Hoje é o vencimento do honorário da {empresa} ({valor}). Deixo abaixo o PIX e o boleto. Se já efetuou o pagamento, pode ignorar esta mensagem. 😊',
    'Oi {nome}, lembrete rápido: o honorário da {empresa} ({valor}) vence hoje, {venc}. Seguem abaixo o PIX (cai na hora) e o boleto.',
    '{nome}, tudo certo? O honorário da {empresa} ({valor}) vence hoje. Deixo abaixo o PIX e o boleto. Qualquer coisa, chama a gente!',
  ],
  atraso: [
    'Olá {nome}, tudo bem? Não identificamos o pagamento do honorário da {empresa} ({valor}, vencido em {venc}). Consegue nos passar uma previsão? Para facilitar, deixo abaixo o PIX e o boleto. 🙏',
    'Oi {nome}. O honorário de {venc} da {empresa} ({valor}) ainda consta em aberto por aqui. Se já pagou, nos envia o comprovante? Senão, seguem abaixo o PIX e o boleto.',
    '{nome}, passando para alinhar o honorário da {empresa} ({valor}) vencido em {venc}. Podemos combinar uma data? Deixo abaixo o PIX e o boleto. Estamos à disposição.',
  ],
}
const PIX_AUTO_RODAPE = 'ℹ️ Pagando por este PIX, os próximos honorários entram no Pix Automático — você autoriza uma vez no app do banco e não precisa mais se preocupar com boleto.'
const ASSUNTO: Record<TipoEnvio, string> = {
  lembrete: 'Honorário {empresa} — vence em {venc}',
  vencimento: 'Honorário {empresa} — vence hoje',
  atraso: 'Honorário {empresa} — em aberto desde {venc}',
}

const brl = (n: number) => `R$ ${Number(n || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
const dataBR = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`
const primeiroNome = (n: string) => (n || '').trim().split(/\s+/)[0] || 'cliente'
const soDigitos = (v: unknown) => String(v ?? '').replace(/\D/g, '')

interface Ctx { leadId: string; empresaId: string | null; nome: string; empresa: string; whatsapp: string; email: string; cobrancaId: string | null; valor: number; venc: string; link: string; pix: string }

async function contexto(leadId: string, cobrancaId?: string): Promise<Ctx> {
  const r = await pool.query(
    `SELECT l.id, l.nome, l.whatsapp, l.email, l.valor_honorario, l.empresa_id,
            c.emp_nome, c.cli_nome_completo, c.emp_telefone, c.emp_email
       FROM leads l LEFT JOIN clientes c ON c.lead_id = l.id WHERE l.id = $1`, [leadId]
  )
  const l = r.rows[0]
  if (!l) throw new Error('Lead não encontrado')
  const cob = cobrancaId
    ? (await pool.query(`SELECT id, asaas_payment_id, valor, to_char(vencimento,'YYYY-MM-DD') AS vencimento, invoice_url FROM financeiro_cobrancas WHERE id = $1`, [cobrancaId])).rows[0]
    : (await pool.query(`SELECT id, asaas_payment_id, valor, to_char(vencimento,'YYYY-MM-DD') AS vencimento, invoice_url FROM financeiro_cobrancas
                          WHERE lead_id = $1 AND status IN ('PENDING','OVERDUE') ORDER BY vencimento ASC LIMIT 1`, [leadId])).rows[0]
  // PIX copia-e-cola: prioriza o Pix Automático (autoriza a recorrência); se indisponível, usa o PIX comum do boleto
  let pix = ''
  try { pix = (await getOrCreatePixAuto(leadId)).payload || '' } catch { /* Pix Automático indisponível/não elegível */ }
  if (!pix && cob?.asaas_payment_id) { try { pix = await pixDaCobranca(cob.asaas_payment_id) } catch { /* segue sem pix */ } }
  return {
    leadId, empresaId: l.empresa_id,
    nome: primeiroNome(l.cli_nome_completo || l.nome), empresa: l.emp_nome || l.nome,
    whatsapp: soDigitos(l.whatsapp || l.emp_telefone), email: l.emp_email || l.email || '',
    cobrancaId: cob?.id ?? null, valor: Number(cob?.valor ?? l.valor_honorario ?? 0),
    venc: cob?.vencimento ? dataBR(cob.vencimento) : '—', link: cob?.invoice_url || '', pix,
  }
}

function montar(tipo: TipoEnvio, c: Ctx) {
  const fill = (t: string) => t
    .replace(/{nome}/g, c.nome).replace(/{empresa}/g, c.empresa).replace(/{valor}/g, brl(c.valor)).replace(/{venc}/g, c.venc)
  const pixAuto = !!c.pix && /\/rec\//.test(c.pix) // payload de recorrência (Pix Automático)
  return { corpo: fill(RAND(MENSAGENS[tipo])), assunto: fill(ASSUNTO[tipo]), pixAuto }
}

// Monta as partes do WhatsApp: texto → PIX (sozinho, fácil de copiar) → boleto → aviso Pix Automático
function partesWhats(corpo: string, c: Ctx, pixAuto: boolean): string[] {
  const partes = [corpo]
  if (c.pix) partes.push(c.pix)
  if (c.link) partes.push(`📄 Boleto: ${c.link}`)
  if (pixAuto) partes.push(PIX_AUTO_RODAPE)
  return partes
}
// Corpo do e-mail: seções rotuladas (no e-mail o código não gera preview, então fica tudo junto)
function corpoEmail(corpo: string, c: Ctx, pixAuto: boolean): string {
  const p: string[] = [corpo, '']
  if (c.pix) p.push('PIX copia e cola:', c.pix, '')
  if (c.link) p.push(`Boleto: ${c.link}`, '')
  if (pixAuto) p.push(PIX_AUTO_RODAPE)
  return p.join('\n').trim()
}

// ── Canais ───────────────────────────────────────────────────────────────────
export const whatsConfigurado = () => !!process.env.WHATSPRO_TOKEN
export const emailConfigurado = () => !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)

// Envia uma ou mais mensagens em sequência (partes: texto, PIX, boleto…) pelo mesmo número
async function enviarWhats(phone: string, messages: string[]) {
  const token = process.env.WHATSPRO_TOKEN
  if (!token) throw new Error('WHATSPRO_TOKEN não configurado')
  let p = soDigitos(phone)
  if (p.length === 10 || p.length === 11) p = '55' + p
  if (p.length < 12) throw new Error('telefone inválido')
  for (let i = 0; i < messages.length; i++) {
    const res = await fetch('https://api-v2.whatsprofissional.com/api/public/send-message', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, phone: p, message: messages[i] }),
    })
    const txt = await res.text()
    if (!res.ok) throw new Error(`WhatsPro ${res.status}: ${txt.slice(0, 200)}`)
    if (i < messages.length - 1) await new Promise(r => setTimeout(r, 1500)) // ordem garantida entre as partes
  }
  return p
}

async function enviarEmail(to: string, subject: string, text: string) {
  if (!emailConfigurado()) throw new Error('SMTP não configurado')
  const nodemailer = (await import('nodemailer')).default
  const port = Number(process.env.SMTP_PORT || 465)
  const t = nodemailer.createTransport({
    host: process.env.SMTP_HOST, port, secure: port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  })
  await t.sendMail({ from: process.env.SMTP_FROM || process.env.SMTP_USER, to, subject, text })
  return to
}

async function registrar(c: Ctx, tipo: TipoEnvio, canal: string, destino: string, mensagem: string, ok: boolean, erro?: string) {
  await pool.query(
    `INSERT INTO cobranca_envios (empresa_id, lead_id, cobranca_id, tipo, canal, destino, mensagem, ok, erro) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [c.empresaId, c.leadId, c.cobrancaId, tipo, canal, destino, mensagem, ok, erro ?? null]
  )
}

/** Envia (WhatsApp + e-mail se configurado) e registra. Usado pela régua e pelo botão manual. */
export async function enviarCobranca(leadId: string, tipo: TipoEnvio, cobrancaId?: string) {
  const c = await contexto(leadId, cobrancaId)
  const out: { canal: string; ok: boolean; erro?: string }[] = []
  const { corpo, assunto, pixAuto } = montar(tipo, c)
  if (whatsConfigurado()) {
    const partes = partesWhats(corpo, c, pixAuto)
    const log = partes.join('\n\n')
    try { const dest = await enviarWhats(c.whatsapp, partes); await registrar(c, tipo, 'whatsapp', dest, log, true); out.push({ canal: 'whatsapp', ok: true }) }
    catch (e) { const erro = (e as Error).message; await registrar(c, tipo, 'whatsapp', c.whatsapp, log, false, erro); out.push({ canal: 'whatsapp', ok: false, erro }) }
  }
  if (emailConfigurado() && c.email) {
    const corpoMail = corpoEmail(corpo, c, pixAuto)
    try { await enviarEmail(c.email, assunto, corpoMail); await registrar(c, tipo, 'email', c.email, corpoMail, true); out.push({ canal: 'email', ok: true }) }
    catch (e) { const erro = (e as Error).message; await registrar(c, tipo, 'email', c.email, corpoMail, false, erro); out.push({ canal: 'email', ok: false, erro }) }
  }
  emitCrmChange()
  return { leadId, tipo, envios: out }
}

// ── Régua automática (rodar 1x por dia útil, em horário comercial) ───────────
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

export async function rodarRegua(opts: { hoje?: Date; intervaloMs?: [number, number]; dryRun?: boolean } = {}) {
  const hoje = opts.hoje ?? new Date()
  const dow = hoje.getDay(), hora = hoje.getHours()
  if (!opts.dryRun && (dow === 0 || dow === 6 || hora < 8 || hora >= 18)) return { pulado: 'fora do horário comercial', enviados: [] }
  const d = (n: number) => { const x = new Date(hoje); x.setDate(x.getDate() + n); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}` }
  const alvos: { tipo: TipoEnvio; data: string }[] = [
    { tipo: 'lembrete', data: d(3) }, { tipo: 'vencimento', data: d(0) }, { tipo: 'atraso', data: d(-3) },
  ]
  const enviados: { leadId: string; empresa: string; tipo: TipoEnvio; ok: boolean; erro?: string }[] = []
  for (const a of alvos) {
    const r = await pool.query(
      `SELECT fc.id AS cobranca_id, fc.lead_id, COALESCE(c.emp_nome, l.nome) AS empresa
         FROM financeiro_cobrancas fc
         JOIN leads l ON l.id = fc.lead_id
         LEFT JOIN clientes c ON c.lead_id = l.id
        WHERE fc.status IN ('PENDING','OVERDUE') AND fc.vencimento = $1::date
          AND COALESCE(l.pix_automatico_ativo, false) = false
          AND COALESCE(c.situacao, 'ativo') <> 'inativo'
          AND NOT EXISTS (SELECT 1 FROM cobranca_envios e WHERE e.cobranca_id = fc.id AND e.tipo = $2 AND e.ok = true)
        ORDER BY empresa`, [a.data, a.tipo]
    )
    for (const row of r.rows) {
      if (opts.dryRun) { enviados.push({ leadId: row.lead_id, empresa: row.empresa, tipo: a.tipo, ok: true }); continue }
      try {
        const res = await enviarCobranca(row.lead_id, a.tipo, row.cobranca_id)
        const w = res.envios.find(x => x.canal === 'whatsapp') ?? res.envios[0]
        enviados.push({ leadId: row.lead_id, empresa: row.empresa, tipo: a.tipo, ok: !!w?.ok, erro: w?.erro })
      } catch (e) { enviados.push({ leadId: row.lead_id, empresa: row.empresa, tipo: a.tipo, ok: false, erro: (e as Error).message }) }
      const [min, max] = opts.intervaloMs ?? [60000, 90000]
      await sleep(min + Math.random() * (max - min))
    }
  }
  return { data: d(0), enviados }
}

export async function listEnvios(leadId: string) {
  const r = await pool.query(
    `SELECT id, tipo, canal, destino, mensagem, ok, erro, to_char(criado_em,'YYYY-MM-DD"T"HH24:MI:SS') AS criado_em
       FROM cobranca_envios WHERE lead_id = $1 ORDER BY criado_em DESC LIMIT 50`, [leadId]
  )
  return r.rows
}

// Último envio por lead (para a tela de Faturamento)
export async function resumoEnvios(empresaId: string) {
  const r = await pool.query(
    `SELECT DISTINCT ON (lead_id) lead_id, tipo, canal, ok, to_char(criado_em,'YYYY-MM-DD') AS data
       FROM cobranca_envios WHERE lead_id IN (SELECT id FROM leads WHERE empresa_id = $1)
      ORDER BY lead_id, criado_em DESC`, [empresaId]
  )
  const map: Record<string, { tipo: string; canal: string; ok: boolean; data: string }> = {}
  for (const row of r.rows) map[String(row.lead_id)] = { tipo: row.tipo, canal: row.canal, ok: !!row.ok, data: row.data }
  return map
}

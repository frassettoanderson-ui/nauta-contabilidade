import pool from './db'
import { emitCrmChange } from './realtime'
import { insertLead } from './leads'

const ONLINE_SEGUNDOS = 45

export async function heartbeat(userId: string) {
  await pool.query(`UPDATE admin_users SET last_seen = NOW() WHERE id = $1`, [userId])
}

// Usuários do sistema (contatos) com status online
export async function listContatos(meId: string) {
  const res = await pool.query(
    `SELECT id, username, nome_completo, role, foto_url,
            (last_seen IS NOT NULL AND last_seen > NOW() - INTERVAL '${ONLINE_SEGUNDOS} seconds') AS online
       FROM admin_users
      WHERE id <> $1
      ORDER BY online DESC, COALESCE(nome_completo, username) ASC`,
    [meId]
  )
  return res.rows
}

// Encontra (ou cria) a conversa 1:1 interna entre dois usuários
export async function getOrCreateDM(meId: string, outroId: string): Promise<string> {
  const found = await pool.query(
    `SELECT c.id FROM chat_conversas c
       JOIN chat_participantes p1 ON p1.conversa_id = c.id AND p1.user_id = $1
       JOIN chat_participantes p2 ON p2.conversa_id = c.id AND p2.user_id = $2
      WHERE c.tipo = 'interna'
      LIMIT 1`,
    [meId, outroId]
  )
  if (found.rows[0]) return found.rows[0].id
  const c = await pool.query(`INSERT INTO chat_conversas (tipo) VALUES ('interna') RETURNING id`)
  const id = c.rows[0].id
  await pool.query(`INSERT INTO chat_participantes (conversa_id, user_id) VALUES ($1,$2),($1,$3)`, [id, meId, outroId])
  return id
}

// Conversas do usuário, com o "outro" participante e última mensagem
export async function listConversas(meId: string) {
  const res = await pool.query(
    `SELECT c.id, c.tipo, c.setor, c.visitante_nome, c.atualizado_em,
            u.id AS outro_id, COALESCE(u.nome_completo, u.username) AS outro_nome, u.role AS outro_role, u.foto_url AS outro_foto,
            (u.last_seen IS NOT NULL AND u.last_seen > NOW() - INTERVAL '${ONLINE_SEGUNDOS} seconds') AS outro_online,
            (SELECT m.texto FROM chat_mensagens m WHERE m.conversa_id = c.id ORDER BY m.criado_em DESC LIMIT 1) AS ultima_msg,
            (SELECT m.arquivo_nome FROM chat_mensagens m WHERE m.conversa_id = c.id ORDER BY m.criado_em DESC LIMIT 1) AS ultima_arq,
            (SELECT COUNT(*) FROM chat_mensagens m WHERE m.conversa_id = c.id AND m.criado_em > COALESCE(p.lido_em, '1970-01-01') AND m.autor_id <> $1) AS nao_lidas
       FROM chat_conversas c
       JOIN chat_participantes p ON p.conversa_id = c.id AND p.user_id = $1
       LEFT JOIN chat_participantes po ON po.conversa_id = c.id AND po.user_id <> $1
       LEFT JOIN admin_users u ON u.id = po.user_id
      WHERE c.tipo = 'interna'
      ORDER BY c.atualizado_em DESC`,
    [meId]
  )
  return res.rows
}

// Conversas vindas do site, pelo setor do usuário (gerente/admin veem todas)
export async function listConversasSite(meId: string, role: string) {
  const res = await pool.query(
    `SELECT c.id, c.setor, c.visitante_nome, c.visitante_contato, c.atualizado_em,
            (SELECT m.texto FROM chat_mensagens m WHERE m.conversa_id = c.id AND m.autor_tipo <> 'bot' ORDER BY m.criado_em DESC LIMIT 1) AS ultima_msg,
            (SELECT COUNT(*) FROM chat_mensagens m WHERE m.conversa_id = c.id AND m.autor_tipo = 'visitante'
              AND m.criado_em > COALESCE(p.lido_em, '1970-01-01')) AS nao_lidas
       FROM chat_conversas c
       LEFT JOIN chat_participantes p ON p.conversa_id = c.id AND p.user_id = $1
      WHERE c.tipo = 'site' AND ($2 = 'admin' OR $2 = 'gerente' OR c.setor = $2)
      ORDER BY c.atualizado_em DESC`,
    [meId, role]
  )
  return res.rows
}

export async function listMensagens(conversaId: string) {
  const res = await pool.query(
    `SELECT id, autor_id, autor_tipo, autor_nome, texto, arquivo_url, arquivo_nome, criado_em
       FROM chat_mensagens WHERE conversa_id = $1 ORDER BY criado_em ASC`,
    [conversaId]
  )
  return res.rows
}

export async function enviarMensagem(conversaId: string, autorId: string, autorNome: string, texto: string, arquivoUrl?: string | null, arquivoNome?: string | null) {
  const res = await pool.query(
    `INSERT INTO chat_mensagens (conversa_id, autor_id, autor_tipo, autor_nome, texto, arquivo_url, arquivo_nome)
     VALUES ($1, $2, 'user', $3, $4, $5, $6) RETURNING *`,
    [conversaId, autorId, autorNome, texto || null, arquivoUrl || null, arquivoNome || null]
  )
  await pool.query(`UPDATE chat_conversas SET atualizado_em = NOW() WHERE id = $1`, [conversaId])
  emitCrmChange()
  return res.rows[0]
}

export async function marcarLido(conversaId: string, userId: string) {
  // UPSERT: abrir uma conversa do site (sem participante ainda) cria o vínculo e marca como lida
  await pool.query(
    `INSERT INTO chat_participantes (conversa_id, user_id, lido_em) VALUES ($1, $2, NOW())
     ON CONFLICT (conversa_id, user_id) DO UPDATE SET lido_em = NOW()`,
    [conversaId, userId]
  )
}

// ─── CHAT DO SITE (bot/visitante) ────────────────────────────────────────────

export async function criarConversaSite(opts: {
  ehCliente: boolean; nome: string; setor: string
  empresa?: string; telefone?: string; email?: string; interesse?: string
}): Promise<string> {
  const contato = opts.telefone || opts.email || opts.empresa || ''
  const c = await pool.query(
    `INSERT INTO chat_conversas (tipo, setor, visitante_nome, visitante_contato) VALUES ('site', $1, $2, $3) RETURNING id`,
    [opts.setor, opts.nome, contato]
  )
  const conversaId = c.rows[0].id

  const resumo = opts.ehCliente
    ? `📋 Cliente Nauta\nNome: ${opts.nome}${opts.empresa ? `\nEmpresa: ${opts.empresa}` : ''}\nSetor: ${opts.setor}`
    : `📋 Novo contato (não é cliente)\nNome: ${opts.nome}\nTelefone: ${opts.telefone ?? '—'}\nE-mail: ${opts.email ?? '—'}\nInteresse: ${opts.interesse ?? '—'}\nEncaminhado ao Comercial.`
  await pool.query(
    `INSERT INTO chat_mensagens (conversa_id, autor_tipo, autor_nome, texto) VALUES ($1, 'bot', 'Atendente Virtual', $2)`,
    [conversaId, resumo]
  )

  if (!opts.ehCliente) {
    await insertLead({
      nome: opts.nome, whatsapp: opts.telefone ?? '', email: opts.email ?? '',
      interesse: opts.interesse ?? '', etapa: 'novo', origem: 'Site',
    })
  }
  emitCrmChange()
  return conversaId
}

export async function enviarVisitante(conversaId: string, nome: string, texto: string) {
  const res = await pool.query(
    `INSERT INTO chat_mensagens (conversa_id, autor_tipo, autor_nome, texto) VALUES ($1, 'visitante', $2, $3) RETURNING *`,
    [conversaId, nome, texto]
  )
  await pool.query(`UPDATE chat_conversas SET atualizado_em = NOW() WHERE id = $1`, [conversaId])
  emitCrmChange()
  return res.rows[0]
}

import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export const dynamic = 'force-dynamic'

// Lista comentários APROVADOS de um post.
export async function GET(req: NextRequest) {
  const postId = req.nextUrl.searchParams.get('postId')
  if (!postId) return NextResponse.json({ comentarios: [] })
  try {
    const res = await pool.query(
      `SELECT id, nome, comentario, criado_em FROM comentarios
       WHERE post_id = $1 AND status = 'aprovado' ORDER BY criado_em DESC LIMIT 100`,
      [postId]
    )
    return NextResponse.json({ comentarios: res.rows })
  } catch {
    return NextResponse.json({ comentarios: [] })
  }
}

// Cria um comentário (fica pendente de moderação; captura nome/e-mail).
export async function POST(req: NextRequest) {
  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: 'JSON inválido' }, { status: 400 }) }

  const nome = (body?.nome ?? '').toString().trim()
  const email = (body?.email ?? '').toString().trim() || null
  const comentario = (body?.comentario ?? '').toString().trim()
  const postId = (body?.postId ?? '').toString().trim()

  if (!postId) return NextResponse.json({ error: 'Post inválido' }, { status: 400 })
  if (nome.length < 2) return NextResponse.json({ error: 'Informe seu nome.' }, { status: 400 })
  if (comentario.length < 3) return NextResponse.json({ error: 'Escreva um comentário.' }, { status: 400 })
  if (nome.length > 120 || comentario.length > 4000 || (email && email.length > 160))
    return NextResponse.json({ error: 'Conteúdo muito longo.' }, { status: 400 })
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
    return NextResponse.json({ error: 'E-mail inválido.' }, { status: 400 })

  try {
    await pool.query(
      `INSERT INTO comentarios (post_id, nome, email, comentario, status)
       VALUES ($1,$2,$3,$4,'pendente')`,
      [postId, nome, email, comentario]
    )
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: 'Não foi possível enviar agora.' }, { status: 500 })
  }
}

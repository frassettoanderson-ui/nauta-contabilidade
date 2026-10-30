import { NextRequest, NextResponse } from 'next/server'
import { abrirPorToken, salvarPorToken } from '@/lib/cadastro-links'

export const dynamic = 'force-dynamic'

// Público (sem login) — ficha preenchida pelo link avulso; só guarda os dados no link

export async function GET(_req: NextRequest, { params }: { params: { token: string } }) {
  const dados = await abrirPorToken(params.token)
  if (!dados) return NextResponse.json({ error: 'Link inválido' }, { status: 404 })
  return NextResponse.json(dados)
}

export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  const body = await req.json().catch(() => null)
  if (!body || typeof body !== 'object') return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  const senhaGov = typeof body.senha_gov === 'string' ? body.senha_gov.trim() : ''
  // Só os campos da ficha (cli_*, emp_*, socios)
  const dados: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(body as Record<string, unknown>)) {
    if (k.startsWith('cli_') || k.startsWith('emp_')) dados[k] = v
  }
  if (Array.isArray(body.socios)) dados.socios = (body.socios as unknown[]).slice(0, 3)
  const ok = await salvarPorToken(params.token, dados, senhaGov)
  if (!ok) return NextResponse.json({ error: 'Link inválido' }, { status: 404 })
  return NextResponse.json({ ok: true })
}

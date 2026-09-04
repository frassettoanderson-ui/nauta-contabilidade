import { NextRequest, NextResponse } from 'next/server'
import { getClienteByToken, saveCliente } from '@/lib/clientes'

export const dynamic = 'force-dynamic'

// Público (sem login) — preenchimento pelo próprio cliente via link provisório

export async function GET(req: NextRequest, { params }: { params: { token: string } }) {
  const c = await getClienteByToken(params.token)
  if (!c) return NextResponse.json({ error: 'Link inválido ou expirado' }, { status: 404 })
  // Não expõe senhas de certificado nem a senha gov.br
  const rest: Record<string, unknown> = { ...(c as Record<string, unknown>) }
  delete rest.cli_cert_senha
  delete rest.cli_senha_gov
  const sociosSafe = ((rest.socios as Record<string, unknown>[]) || []).map(s => {
    const sr = { ...s }; delete sr.cert_senha; return sr
  })
  rest.socios = sociosSafe
  return NextResponse.json(rest)
}

export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  const existing = await getClienteByToken(params.token)
  if (!existing) return NextResponse.json({ error: 'Link inválido ou expirado' }, { status: 404 })
  const body = await req.json()
  const id = (existing as { id: string }).id
  // senha_gov do formulário público vira o campo cli_senha_gov do cadastro.
  // Se o cliente deixar em branco, mantém a senha que já estiver salva.
  const senhaGov = typeof body.senha_gov === 'string' ? body.senha_gov.trim() : ''
  delete body.senha_gov
  const payload: Record<string, unknown> = { ...body, id }
  if (senhaGov) payload.cli_senha_gov = senhaGov
  else payload.cli_senha_gov = (existing as Record<string, unknown>).cli_senha_gov ?? null
  // Garante que só atualiza o cliente do token
  await saveCliente(payload)
  return NextResponse.json({ ok: true })
}

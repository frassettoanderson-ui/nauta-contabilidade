import { NextRequest, NextResponse } from 'next/server'
import { getClienteByToken, saveCliente } from '@/lib/clientes'

export const dynamic = 'force-dynamic'

// Público (sem login) — preenchimento pelo próprio cliente via link provisório

export async function GET(req: NextRequest, { params }: { params: { token: string } }) {
  const c = await getClienteByToken(params.token)
  if (!c) return NextResponse.json({ error: 'Link inválido ou expirado' }, { status: 404 })
  // Não expõe senhas de certificado
  const rest: Record<string, unknown> = { ...(c as Record<string, unknown>) }
  delete rest.cli_cert_senha
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
  // Garante que só atualiza o cliente do token
  await saveCliente({ ...body, id: (existing as { id: string }).id })
  return NextResponse.json({ ok: true })
}

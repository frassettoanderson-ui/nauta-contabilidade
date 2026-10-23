import { NextRequest, NextResponse } from 'next/server'
import { criarChave } from '@/lib/integracoes'
import { gestorDoPerfil } from '@/lib/integracoes-sessao'

export const dynamic = 'force-dynamic'

// Gera uma chave de API para o perfil ativo. A chave em claro volta só nesta resposta.
export async function POST(req: NextRequest) {
  const g = await gestorDoPerfil()
  if (g instanceof NextResponse) return g
  const { nome, escrita } = await req.json().catch(() => ({}))
  if (!String(nome ?? '').trim()) return NextResponse.json({ error: 'Dê um nome para a chave (ex.: Bot de boas-vindas)' }, { status: 400 })
  return NextResponse.json(await criarChave(g.empresaId, String(nome).trim().slice(0, 80), !!escrita, g.nome))
}

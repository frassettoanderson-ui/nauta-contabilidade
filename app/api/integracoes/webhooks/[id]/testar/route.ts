import { NextRequest, NextResponse } from 'next/server'
import { testarWebhook } from '@/lib/integracoes'
import { gestorDoPerfil } from '@/lib/integracoes-sessao'

export const dynamic = 'force-dynamic'

// Manda um teste.ping só para este webhook, na hora, e devolve o que o destino respondeu
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const g = await gestorDoPerfil()
  if (g instanceof NextResponse) return g
  const r = await testarWebhook(g.empresaId, params.id)
  if (!r) return NextResponse.json({ error: 'Webhook não encontrado' }, { status: 404 })
  return NextResponse.json(r)
}

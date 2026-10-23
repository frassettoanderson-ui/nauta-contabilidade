import { NextRequest, NextResponse } from 'next/server'
import { revogarChave } from '@/lib/integracoes'
import { gestorDoPerfil } from '@/lib/integracoes-sessao'

export const dynamic = 'force-dynamic'

// Revoga (não apaga: fica no histórico) — quem usava a chave perde o acesso na hora
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const g = await gestorDoPerfil()
  if (g instanceof NextResponse) return g
  await revogarChave(g.empresaId, params.id)
  return NextResponse.json({ ok: true })
}

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ensureEmpresaObrigo } from '@/lib/obrigo-sync'

export const dynamic = 'force-dynamic'

// Abre a ficha do cliente no Obrigô: garante que a Empresa exista (cria/vincula sob demanda
// a partir do lead) e devolve o id para o front navegar até /sistema/obrigo/empresas/:id.
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { leadId } = await req.json().catch(() => ({}))
  if (!leadId) return NextResponse.json({ error: 'leadId ausente' }, { status: 400 })

  const empresaId = await ensureEmpresaObrigo(String(leadId))
  if (!empresaId) return NextResponse.json({ error: 'Não foi possível abrir a ficha no Obrigô' }, { status: 502 })

  return NextResponse.json({ empresaId, path: `/sistema/obrigo/empresas/${empresaId}` })
}

import { NextRequest, NextResponse } from 'next/server'
import { comChave } from '@/lib/api-publica'
import { EVENTOS } from '@/lib/integracoes'

export const dynamic = 'force-dynamic'

// "Quem sou eu": confere a chave e lista o que a API oferece
export async function GET(req: NextRequest) {
  const a = await comChave(req)
  if (a instanceof NextResponse) return a
  return NextResponse.json({
    perfil: a.perfil,
    chave: { nome: a.nome, escrita: a.escrita },
    endpoints: [
      'GET  /api/v1/onboarding', 'GET  /api/v1/onboarding/{leadId}', 'POST /api/v1/onboarding/{leadId}/itens',
      'GET  /api/v1/leads', 'POST /api/v1/leads', 'GET  /api/v1/leads/{id}',
      'GET  /api/v1/clientes', 'GET  /api/v1/clientes/{id}',
    ],
    eventos_webhook: EVENTOS.map((e) => e.id),
  })
}

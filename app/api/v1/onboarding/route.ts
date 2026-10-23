import { NextRequest, NextResponse } from 'next/server'
import { comChave } from '@/lib/api-publica'
import { onboardingDaEmpresa } from '@/lib/api-onboarding'

export const dynamic = 'force-dynamic'

// Clientes no onboarding (?concluidos=1 inclui os já concluídos)
export async function GET(req: NextRequest) {
  const a = await comChave(req)
  if (a instanceof NextResponse) return a
  const dados = await onboardingDaEmpresa(a.empresaId, { incluirConcluidos: req.nextUrl.searchParams.get('concluidos') === '1' })
  return NextResponse.json({ dados, total: dados.length })
}

import { NextRequest, NextResponse } from 'next/server'
import { comChave, erroApi } from '@/lib/api-publica'
import { onboardingDaEmpresa } from '@/lib/api-onboarding'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: { leadId: string } }) {
  const a = await comChave(req)
  if (a instanceof NextResponse) return a
  if (!/^[0-9a-f-]{36}$/i.test(params.leadId)) return erroApi(400, 'id_invalido', 'leadId inválido.')
  const [c] = await onboardingDaEmpresa(a.empresaId, { leadId: params.leadId })
  if (!c) return erroApi(404, 'nao_encontrado', 'Cliente não está no onboarding deste perfil.')
  return NextResponse.json(c)
}

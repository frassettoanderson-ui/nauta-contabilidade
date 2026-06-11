import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { setOnboardingCheck, getOnboardingBoard } from '@/lib/leads'
import { podeEditarSetor, gerenteConcluido, type SetorId } from '@/lib/onboarding-checklist'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const su = session?.user as unknown as { role?: string; name?: string } | undefined
  if (!session || !su) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { leadId, itemKey, done } = await req.json()
  if (!leadId || !itemKey) return NextResponse.json({ error: 'Parâmetros faltando' }, { status: 400 })

  const setor = (itemKey.split(':')[0]) as SetorId
  const role = su.role ?? ''

  // Permissão de cargo
  if (!podeEditarSetor(role, setor)) {
    return NextResponse.json({ error: 'Sem permissão para este setor' }, { status: 403 })
  }

  // Gating: setores não-gerente só liberam após o gerente concluir
  if (setor !== 'gerente') {
    const board = await getOnboardingBoard()
    const cli = board.find(c => c.id === leadId)
    if (!cli || !gerenteConcluido(cli.onboarding_categoria ?? '', cli.checks)) {
      return NextResponse.json({ error: 'Aguardando o gerente concluir a etapa dele' }, { status: 409 })
    }
  }

  await setOnboardingCheck(leadId, itemKey, !!done, su.name ?? null)
  return NextResponse.json({ ok: true })
}

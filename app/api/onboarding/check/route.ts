import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { setOnboardingCheck, getOnboardingBoard } from '@/lib/leads'
import { podeEditarSetor, gerenteConcluido, checksEfetivos, setorItensCompletos, doneKey, ITEM_CADASTRO, type SetorId } from '@/lib/onboarding-checklist'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const su = session?.user as unknown as { role?: string; name?: string } | undefined
  if (!session || !su) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { leadId, itemKey, done } = await req.json()
  if (!leadId || !itemKey) return NextResponse.json({ error: 'Parâmetros faltando' }, { status: 400 })

  const setor = (itemKey.split(':')[0]) as SetorId
  const role = su.role ?? ''

  // Item de cadastro é automático — não pode ser marcado/desmarcado manualmente
  if (itemKey === ITEM_CADASTRO) {
    return NextResponse.json({ error: 'Item automático (marca sozinho quando o cadastro fica completo)' }, { status: 409 })
  }

  // Permissão de cargo
  if (!podeEditarSetor(role, setor)) {
    return NextResponse.json({ error: 'Sem permissão para este setor' }, { status: 403 })
  }

  const ehMarcadorDone = itemKey === doneKey(setor)

  // Gating: setores não-gerente só liberam após o gerente concluir
  if (setor !== 'gerente') {
    const board = await getOnboardingBoard()
    const cli = board.find(c => c.id === leadId)
    const efetivos = cli ? checksEfetivos(cli.checks, cli.cadastro_completo) : []
    if (!cli || !gerenteConcluido(cli.onboarding_categoria ?? '', efetivos)) {
      return NextResponse.json({ error: 'Aguardando o gerente concluir a etapa dele' }, { status: 409 })
    }
  }

  // Para concluir um setor, todos os itens dele precisam estar marcados
  if (ehMarcadorDone && done) {
    const board = await getOnboardingBoard()
    const cli = board.find(c => c.id === leadId)
    const efetivos = cli ? checksEfetivos(cli.checks, cli.cadastro_completo) : []
    if (!cli || !setorItensCompletos(setor, cli.onboarding_categoria ?? '', efetivos)) {
      return NextResponse.json({ error: 'Conclua todos os itens do setor antes de finalizar' }, { status: 409 })
    }
  }

  await setOnboardingCheck(leadId, itemKey, !!done, su.name ?? null)
  return NextResponse.json({ ok: true })
}

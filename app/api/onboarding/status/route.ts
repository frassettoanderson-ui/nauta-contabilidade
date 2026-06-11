import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getOnboardingBoard } from '@/lib/leads'
import { gerenteConcluido, itensDoSetor, type SetorId } from '@/lib/onboarding-checklist'

export const dynamic = 'force-dynamic'

// Badge "Novo": há cliente esperando a ação DESTE usuário e ele ainda não começou?
export async function GET() {
  const session = await getServerSession(authOptions)
  const role = (session?.user as unknown as { role?: string })?.role
  if (!session) return NextResponse.json({ temNovos: false })

  try {
    const board = await getOnboardingBoard()
    const ehGestor = role === 'admin' || role === 'gerente'

    const novos = board.filter(c => {
      const cat = c.onboarding_categoria ?? ''
      if (ehGestor) {
        // gerente: cliente cuja parte do gerente nem começou
        const keys = itensDoSetor('gerente', cat).map(i => i.key)
        return keys.some(k => !c.checks.includes(k))
      }
      // setores: cliente já liberado (gerente concluiu) e setor ainda não começou
      const setor = role as SetorId
      const itens = itensDoSetor(setor, cat)
      if (!itens.length) return false
      if (!gerenteConcluido(cat, c.checks)) return false
      return itens.some(i => !c.checks.includes(i.key))
    }).length

    return NextResponse.json({ temNovos: novos > 0, total: novos })
  } catch {
    return NextResponse.json({ temNovos: false })
  }
}

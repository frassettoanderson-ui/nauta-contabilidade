import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getOnboardingBoard } from '@/lib/leads'
import { gerenteConcluido, itensDoSetor, checksEfetivos, type SetorId } from '@/lib/onboarding-checklist'

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
      const efetivos = checksEfetivos(c.checks, c.cadastro_completo)
      if (ehGestor) {
        // gerente: cliente com item pendente da parte dele
        const keys = itensDoSetor('gerente', cat).map(i => i.key)
        return keys.some(k => !efetivos.includes(k))
      }
      // setores: cliente já liberado (gerente concluiu) e setor ainda não começou
      const setor = role as SetorId
      const itens = itensDoSetor(setor, cat)
      if (!itens.length) return false
      if (!gerenteConcluido(cat, efetivos)) return false
      return itens.some(i => !efetivos.includes(i.key))
    }).length

    return NextResponse.json({ temNovos: novos > 0, total: novos })
  } catch {
    return NextResponse.json({ temNovos: false })
  }
}

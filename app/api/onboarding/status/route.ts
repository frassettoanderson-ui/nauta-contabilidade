import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { countOnboardingEtapa1, countOnboardingEtapa1PorCategoria } from '@/lib/leads'

export const dynamic = 'force-dynamic'

// Badge "Novo" + bolinha por categoria: clientes na Etapa 1 do onboarding
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ temNovos: false, categorias: {} })
  try {
    const n = await countOnboardingEtapa1()
    const categorias = await countOnboardingEtapa1PorCategoria()
    return NextResponse.json({ temNovos: n > 0, total: n, categorias })
  } catch {
    return NextResponse.json({ temNovos: false, categorias: {} })
  }
}

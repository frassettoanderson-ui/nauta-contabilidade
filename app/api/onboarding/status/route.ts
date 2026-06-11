import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { countOnboardingEtapa1 } from '@/lib/leads'

export const dynamic = 'force-dynamic'

// Badge "Novo": há cliente na Etapa 1 do onboarding?
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ temNovos: false })
  try {
    const n = await countOnboardingEtapa1()
    return NextResponse.json({ temNovos: n > 0, total: n })
  } catch {
    return NextResponse.json({ temNovos: false })
  }
}

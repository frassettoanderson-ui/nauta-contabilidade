import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { concluirOnboarding } from '@/lib/leads'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const role = (session?.user as unknown as { role?: string })?.role
  if (!session || (role !== 'admin' && role !== 'gerente')) {
    return NextResponse.json({ error: 'Apenas o gerente pode concluir' }, { status: 403 })
  }
  const { leadId } = await req.json()
  if (!leadId) return NextResponse.json({ error: 'leadId faltando' }, { status: 400 })
  await concluirOnboarding(leadId)
  return NextResponse.json({ ok: true })
}

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getOnboardingLeads } from '@/lib/leads'
import { empresaAtivaId } from '@/lib/tenant'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json([], { status: 401 })
  const empresaId = await empresaAtivaId()
  if (!empresaId) return NextResponse.json([], { status: 403 })
  const categoria = req.nextUrl.searchParams.get('categoria')
  if (!categoria) return NextResponse.json([])
  const leads = await getOnboardingLeads(categoria, empresaId)
  return NextResponse.json(leads)
}

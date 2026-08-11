import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getDashboard } from '@/lib/dashboard'
import { empresaAtivaId } from '@/lib/tenant'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json(null, { status: 401 })
  const empresaId = await empresaAtivaId()
  if (!empresaId) return NextResponse.json(null, { status: 403 })
  return NextResponse.json(await getDashboard(empresaId))
}

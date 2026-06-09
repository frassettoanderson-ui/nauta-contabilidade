import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { generateLinkToken } from '@/lib/clientes'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const token = await generateLinkToken(params.id)
  const origin = req.nextUrl.origin
  return NextResponse.json({ token, url: `${origin}/cadastro/${token}` })
}

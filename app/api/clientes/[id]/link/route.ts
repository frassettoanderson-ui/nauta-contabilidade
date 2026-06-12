import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { generateLinkToken } from '@/lib/clientes'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const token = await generateLinkToken(params.id)
  // Base pública: prioriza NEXTAUTH_URL (domínio), depois o Host do request, por fim o origin
  const env = process.env.NEXTAUTH_URL
  const host = req.headers.get('host')
  const base = (env && !env.includes('localhost'))
    ? env.replace(/\/$/, '')
    : (host && !host.includes('localhost') ? `https://${host}` : req.nextUrl.origin)
  return NextResponse.json({ token, url: `${base}/cadastro/${token}` })
}

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { empresaAtivaId } from '@/lib/tenant'
import { listarLinks, criarLink } from '@/lib/cadastro-links'

export const dynamic = 'force-dynamic'

function baseUrl(req: NextRequest) {
  const env = process.env.NEXTAUTH_URL
  const host = req.headers.get('host')
  return (env && !env.includes('localhost'))
    ? env.replace(/\/$/, '')
    : (host && !host.includes('localhost') ? `https://${host}` : req.nextUrl.origin)
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const base = baseUrl(req)
  const links = await listarLinks(await empresaAtivaId())
  return NextResponse.json(links.map(l => ({ ...l, url: `${base}/cadastro/avulso/${l.token}` })))
}

// POST { destinatario, observacao? } → novo link avulso
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const destinatario = String(body.destinatario ?? '').trim()
  if (!destinatario) return NextResponse.json({ error: 'Informe para quem é o link' }, { status: 400 })
  const obs = String(body.observacao ?? '').trim() || null
  const l = await criarLink(await empresaAtivaId(), destinatario, obs, session.user?.name ?? session.user?.email ?? null)
  return NextResponse.json({ ...l, url: `${baseUrl(req)}/cadastro/avulso/${l.token}` })
}

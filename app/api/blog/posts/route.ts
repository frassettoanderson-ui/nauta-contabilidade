import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getPosts, adminGetPosts, adminSavePost } from '@/lib/blog'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const admin = sp.get('admin') === '1'

  if (admin) {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    const status = sp.get('status') as 'rascunho' | 'publicado' | null
    const posts = await adminGetPosts(status ?? undefined)
    return NextResponse.json(posts)
  }

  const result = await getPosts({
    page: Number(sp.get('page') ?? 1),
    categoria: sp.get('categoria') ?? undefined,
    search: sp.get('busca') ?? undefined,
  })
  return NextResponse.json(result)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const body = await req.json()
  const post = await adminSavePost(body)
  return NextResponse.json(post)
}

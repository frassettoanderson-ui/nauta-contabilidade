import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getTags, adminSaveTag } from '@/lib/blog'

export const dynamic = 'force-dynamic'

export async function GET() {
  const tags = await getTags()
  return NextResponse.json(tags)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const body = await req.json()
  const tag = await adminSaveTag(body)
  return NextResponse.json(tag)
}

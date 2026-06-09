import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getCategorias, adminSaveCategoria } from '@/lib/blog'

export const dynamic = 'force-dynamic'

export async function GET() {
  const cats = await getCategorias()
  return NextResponse.json(cats)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const body = await req.json()
  const cat = await adminSaveCategoria(body)
  return NextResponse.json(cat)
}

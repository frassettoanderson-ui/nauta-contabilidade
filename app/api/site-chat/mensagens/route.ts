import { NextRequest, NextResponse } from 'next/server'
import { listMensagens } from '@/lib/chat'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const conversaId = req.nextUrl.searchParams.get('conversaId')
  if (!conversaId) return NextResponse.json([])
  return NextResponse.json(await listMensagens(conversaId))
}

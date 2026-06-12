import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { countLeadsNovos } from '@/lib/leads'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ temNovos: false })
  try {
    const n = await countLeadsNovos()
    return NextResponse.json({ temNovos: n > 0, total: n })
  } catch {
    return NextResponse.json({ temNovos: false })
  }
}

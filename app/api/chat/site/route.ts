import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { listConversasSite } from '@/lib/chat'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getServerSession(authOptions)
  const su = session?.user as unknown as { id?: string; role?: string } | undefined
  if (!su?.id) return NextResponse.json([], { status: 401 })
  return NextResponse.json(await listConversasSite(su.id, su.role ?? ''))
}

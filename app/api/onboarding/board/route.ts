import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getOnboardingBoard } from '@/lib/leads'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json([], { status: 401 })
  const board = await getOnboardingBoard()
  return NextResponse.json(board)
}

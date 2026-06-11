import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import pool from '@/lib/db'

export const dynamic = 'force-dynamic'

// Indica se há clientes no onboarding (hoje: contratos assinados — ajustar quando
// existir o fluxo de entrada real no onboarding).
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ temNovos: false })
  try {
    const r = await pool.query(`SELECT COUNT(*)::int AS n FROM contratos WHERE autentique_status = 'assinado'`)
    const n = r.rows[0]?.n ?? 0
    return NextResponse.json({ temNovos: n > 0, total: n })
  } catch {
    return NextResponse.json({ temNovos: false })
  }
}

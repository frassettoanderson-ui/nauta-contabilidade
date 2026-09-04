import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { empresaAtivaId } from '@/lib/tenant'
import { getComissoes } from '@/lib/comissoes'

export const dynamic = 'force-dynamic'

// GET ?ano=2026&mes=9 → apuração das comissões dos honorários pagos no mês
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json(null, { status: 401 })
  const empresaId = await empresaAtivaId()
  if (!empresaId) return NextResponse.json(null, { status: 403 })
  const hoje = new Date()
  const ano = Number(req.nextUrl.searchParams.get('ano')) || hoje.getFullYear()
  const mes = Number(req.nextUrl.searchParams.get('mes')) || hoje.getMonth() + 1
  if (mes < 1 || mes > 12 || ano < 2000 || ano > 2100) return NextResponse.json({ error: 'Mês inválido' }, { status: 400 })
  return NextResponse.json(await getComissoes(empresaId, ano, mes))
}

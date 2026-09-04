import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { empresaAtivaId } from '@/lib/tenant'
import { getMeta, setMeta, getMetasAno, setMetasAno } from '@/lib/metas'

export const dynamic = 'force-dynamic'

// GET ?ano=2026            → { ano, metas: number[12] }   (tela Cadastrar meta)
// GET ?competencia=2026-09 → { competencia, metaClientes } (painel)
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json(null, { status: 401 })
  const empresaId = await empresaAtivaId()
  if (!empresaId) return NextResponse.json(null, { status: 403 })
  const ano = Number(req.nextUrl.searchParams.get('ano'))
  if (ano >= 2000 && ano <= 2100) return NextResponse.json({ ano, metas: await getMetasAno(empresaId, ano) })
  const comp = req.nextUrl.searchParams.get('competencia') || undefined
  return NextResponse.json(await getMeta(empresaId, comp))
}

// POST { ano, metas: number[12] }  → salva o ano inteiro
// POST { competencia, metaClientes } → salva um mês
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json(null, { status: 401 })
  const empresaId = await empresaAtivaId()
  if (!empresaId) return NextResponse.json(null, { status: 403 })
  const body = await req.json().catch(() => ({}))
  const ano = Number(body.ano)
  if (ano >= 2000 && ano <= 2100 && Array.isArray(body.metas)) {
    return NextResponse.json(await setMetasAno(empresaId, ano, body.metas.map(Number)))
  }
  const competencia = String(body.competencia || '')
  if (!competencia) return NextResponse.json({ error: 'Competência obrigatória' }, { status: 400 })
  return NextResponse.json(await setMeta(empresaId, competencia, Number(body.metaClientes)))
}

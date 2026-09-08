import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { empresaAtivaId } from '@/lib/tenant'
import { listContasPagar, addContaPagar, updateContaPagar, pagarContaPagar, desmarcarContaPagar, deleteContaPagar } from '@/lib/contas-pagar'

export const dynamic = 'force-dynamic'

async function guard() {
  const session = await getServerSession(authOptions)
  if (!session) return { err: NextResponse.json(null, { status: 401 }) }
  const empresaId = await empresaAtivaId()
  if (!empresaId) return { err: NextResponse.json(null, { status: 403 }) }
  return { empresaId }
}

export async function GET() {
  const g = await guard(); if ('err' in g) return g.err
  return NextResponse.json(await listContasPagar(g.empresaId!))
}

// POST { action, ... }: add | update | pagar | desmarcar | delete
export async function POST(req: NextRequest) {
  const g = await guard(); if ('err' in g) return g.err
  const b = await req.json().catch(() => ({}))
  const emp = g.empresaId!
  try {
    switch (b.action) {
      case 'add': return NextResponse.json(await addContaPagar(emp, b))
      case 'update': return NextResponse.json(await updateContaPagar(emp, String(b.id), b))
      case 'pagar': return NextResponse.json(await pagarContaPagar(emp, String(b.id), String(b.pagoEm || new Date().toISOString().slice(0, 10))))
      case 'desmarcar': return NextResponse.json(await desmarcarContaPagar(emp, String(b.id)))
      case 'delete': return NextResponse.json(await deleteContaPagar(emp, String(b.id)))
      default: return NextResponse.json({ error: 'ação inválida' }, { status: 400 })
    }
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 })
  }
}

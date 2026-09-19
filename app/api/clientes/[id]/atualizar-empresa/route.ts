import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { atualizarEmpresaCliente } from '@/lib/clientes'
import { empresaAtivaId } from '@/lib/tenant'

export const dynamic = 'force-dynamic'

// Atualiza apenas os dados da empresa de um cliente (usado na tela "Atualizar clientes").
// O CNPJ é consultado no navegador (BrasilAPI/Receita) e os campos chegam aqui prontos.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const empresaId = await empresaAtivaId()
  if (!empresaId) return NextResponse.json({ error: 'Sem empresa ativa' }, { status: 403 })

  const fields = await req.json().catch(() => null)
  if (!fields || typeof fields !== 'object') {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  }

  const r = await atualizarEmpresaCliente(params.id, empresaId, fields as Record<string, unknown>)
  return NextResponse.json(r)
}

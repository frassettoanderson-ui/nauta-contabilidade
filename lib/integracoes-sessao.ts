import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
import { empresaAtivaId } from './tenant'

// Tela de Integrações: só admin/gerente, sempre no perfil (empresa) ativo no topo.
export async function gestorDoPerfil(): Promise<{ empresaId: string; nome: string } | NextResponse> {
  const session = await getServerSession(authOptions)
  const su = session?.user as unknown as { role?: string; name?: string } | undefined
  if (!session || !su) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  if (su.role !== 'admin' && su.role !== 'gerente') return NextResponse.json({ error: 'Apenas admin/gerente gerenciam integrações' }, { status: 403 })
  const empresaId = await empresaAtivaId()
  if (!empresaId) return NextResponse.json({ error: 'Sem perfil ativo' }, { status: 403 })
  return { empresaId, nome: su.name ?? 'usuário' }
}

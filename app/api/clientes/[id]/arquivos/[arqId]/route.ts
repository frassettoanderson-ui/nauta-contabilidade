import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getConteudoArquivo } from '@/lib/clientes'

export const dynamic = 'force-dynamic'

// Conteúdo sensível (ex.: senha gov.br) — liberado a qualquer usuário logado.
export async function GET(_req: NextRequest, { params }: { params: { id: string; arqId: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
  const arq = await getConteudoArquivo(params.arqId)
  if (!arq) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
  return new NextResponse(arq.conteudo ?? '', {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Content-Disposition': `attachment; filename="${arq.nome}"`,
    },
  })
}

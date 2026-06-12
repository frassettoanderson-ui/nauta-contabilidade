import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getConteudoArquivo } from '@/lib/clientes'

export const dynamic = 'force-dynamic'

// Download do conteúdo restrito (ex.: senha gov.br) — só admin/gerente
export async function GET(_req: NextRequest, { params }: { params: { id: string; arqId: string } }) {
  const session = await getServerSession(authOptions)
  const role = (session?.user as unknown as { role?: string })?.role
  if (!session || (role !== 'admin' && role !== 'gerente')) {
    return NextResponse.json({ error: 'Acesso restrito (admin/gerente)' }, { status: 403 })
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

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getCliente } from '@/lib/clientes'
import { buildCadastroHtml } from '@/lib/cadastro-html'
import { renderHtmlToPdf } from '@/lib/html-pdf'
import { tipoFromInteresse, TIPO_LABEL } from '@/lib/contratos'
import pool from '@/lib/db'
import { readFile } from 'fs/promises'
import path from 'path'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const cliente = await getCliente(params.id)
  if (!cliente) return NextResponse.json({ error: 'Cadastro não encontrado' }, { status: 404 })

  // Tipo de contrato (rótulo) a partir do interesse do lead, se houver
  let interesseLabel: string | undefined
  if (cliente.lead_id) {
    const l = await pool.query(`SELECT interesse FROM leads WHERE id = $1`, [cliente.lead_id])
    const tipo = tipoFromInteresse(l.rows[0]?.interesse)
    if (tipo) interesseLabel = TIPO_LABEL[tipo]
  }

  // Logo (cabeçalho)
  let header: string | undefined
  try {
    const buf = await readFile(path.join(process.cwd(), 'public', 'logo.png'))
    header = `data:image/png;base64,${buf.toString('base64')}`
  } catch {}

  const html = buildCadastroHtml(cliente as Record<string, unknown>, { interesseLabel, logos: { header } })

  try {
    const pdf = await renderHtmlToPdf(html)
    const nome = String((cliente as Record<string, unknown>).emp_nome || (cliente as Record<string, unknown>).cli_nome_completo || 'cadastro')
      .replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40) || 'cadastro'
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="cadastro_${nome}.pdf"`,
      },
    })
  } catch (e) {
    console.error('[EXPORTAR CADASTRO]', e)
    return NextResponse.json({ error: 'Falha ao gerar o PDF' }, { status: 500 })
  }
}

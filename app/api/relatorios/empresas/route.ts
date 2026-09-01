import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { empresaAtivaId } from '@/lib/tenant'
import { listClientes } from '@/lib/clientes'
import { buildRelatorioEmpresasHtml } from '@/lib/relatorio-empresas-html'
import { writeFile, readFile, mkdir } from 'fs/promises'
import path from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'

const execP = promisify(exec)
export const dynamic = 'force-dynamic'
export const maxDuration = 120

const s = (v: unknown) => String(v ?? '')
const ORDENS: Record<string, { campo: string; label: string }> = {
  nome:        { campo: 'emp_nome', label: 'Nome da empresa' },
  cnpj:        { campo: 'emp_cnpj', label: 'CNPJ' },
  responsavel: { campo: 'responsavel', label: 'Responsável' },
  cidade:      { campo: 'emp_cidade_estado', label: 'Cidade/UF' },
  situacao:    { campo: 'situacao', label: 'Situação' },
  cadastro:    { campo: 'criado_em', label: 'Data de cadastro' },
}

async function htmlToPdf(html: string): Promise<Buffer> {
  const stamp = Date.now()
  const dir = path.join('/tmp', `rel-empresas-${stamp}`)
  await mkdir(dir, { recursive: true })
  const htmlPath = path.join(dir, 'rel.html')
  const pdfPath = path.join(dir, 'rel.pdf')
  await writeFile(htmlPath, html, 'utf-8')
  const wk = `wkhtmltopdf --quiet --encoding utf-8 --page-size A4 -T 14 -B 12 -L 14 -R 14 "${htmlPath}" "${pdfPath}"`
  try { await execP(`xvfb-run -a ${wk}`, { timeout: 90000 }) }
  catch { await execP(wk, { timeout: 90000 }) }
  return readFile(pdfPath)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const empresaId = await empresaAtivaId()
  if (!empresaId) return NextResponse.json({ error: 'Sem empresa ativa' }, { status: 403 })

  const { ids, ordem } = await req.json()
  const selecionados: string[] = Array.isArray(ids) ? ids.map(String) : []
  if (selecionados.length === 0) return NextResponse.json({ error: 'Selecione ao menos uma empresa' }, { status: 400 })

  const ord = ORDENS[String(ordem)] ?? ORDENS.nome
  const todas = await listClientes(empresaId)
  const set = new Set(selecionados)
  const rows = todas
    .filter(c => set.has(s(c.id)))
    .sort((a, b) => {
      if (ord.campo === 'criado_em') return s(b.criado_em).localeCompare(s(a.criado_em)) // mais recentes primeiro
      return s(a[ord.campo]).localeCompare(s(b[ord.campo]), 'pt-BR', { sensitivity: 'base', numeric: true })
    })

  let logoHeader: string | undefined
  try {
    const buf = await readFile(path.join(process.cwd(), 'public', 'logo.png'))
    logoHeader = `data:image/png;base64,${buf.toString('base64')}`
  } catch { /* sem logo */ }

  const html = buildRelatorioEmpresasHtml(rows, ord.label, { header: logoHeader })
  const pdf = await htmlToPdf(html)
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="relatorio-empresas.pdf"`,
    },
  })
}

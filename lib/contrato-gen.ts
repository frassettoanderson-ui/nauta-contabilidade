import pool from './db'
import { getClienteByLead } from './clientes'
import { buildContratoHtml, type ContratoLogos } from './contrato-html'
import { tipoFromInteresse } from './contratos'
import { emitCrmChange } from './realtime'
import { writeFile, mkdir, readFile } from 'fs/promises'
import path from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'

const execP = promisify(exec)
const PRIV = path.join(process.cwd(), 'uploads-private')

export async function getContratoByLead(leadId: string) {
  const res = await pool.query(`SELECT * FROM contratos WHERE lead_id = $1 ORDER BY criado_em DESC LIMIT 1`, [leadId])
  return res.rows[0] || null
}

async function loadLogos(): Promise<ContratoLogos> {
  const logos: ContratoLogos = {}
  try {
    const buf = await readFile(path.join(process.cwd(), 'public', 'logo.png'))
    logos.header = `data:image/png;base64,${buf.toString('base64')}`
  } catch {}
  try {
    const buf = await readFile(path.join(process.cwd(), 'public', 'logo-vertical.png'))
    logos.marca = `data:image/png;base64,${buf.toString('base64')}`
  } catch {}
  return logos
}

async function htmlToPdf(htmlPath: string, outDir: string): Promise<string> {
  const pdfPath = path.join(outDir, 'contrato.pdf')

  // 1ª opção: wkhtmltopdf (renderização fiel ao navegador; marca d'água em todas as páginas)
  const wk = `wkhtmltopdf --quiet --encoding utf-8 --page-size A4 -T 16 -B 14 -L 18 -R 18 "${htmlPath}" "${pdfPath}"`
  try {
    await execP(`xvfb-run -a ${wk}`, { timeout: 90000 })
    return pdfPath
  } catch {
    try {
      await execP(wk, { timeout: 90000 })
      return pdfPath
    } catch {
      // Fallback: LibreOffice
      await execP(
        `libreoffice --headless -env:UserInstallation=file://${outDir}/lo --convert-to pdf --outdir "${outDir}" "${htmlPath}"`,
        { timeout: 90000 }
      )
      return pdfPath
    }
  }
}

export async function gerarContrato(leadId: string) {
  const leadRes = await pool.query(`SELECT * FROM leads WHERE id = $1`, [leadId])
  const lead = leadRes.rows[0]
  if (!lead) throw new Error('Lead não encontrado')

  const cliente = await getClienteByLead(leadId)
  if (!cliente) throw new Error('Cadastro do cliente não encontrado')

  const tipo = tipoFromInteresse(lead.interesse)
  const logos = await loadLogos()
  const html = buildContratoHtml(cliente as Record<string, unknown>, lead, logos)

  const stamp = Date.now()
  const tmp = path.join('/tmp', `contrato-${leadId}-${stamp}`)
  await mkdir(tmp, { recursive: true })
  const htmlPath = path.join(tmp, 'contrato.html')
  await writeFile(htmlPath, html, 'utf-8')

  const pdfPath = await htmlToPdf(htmlPath, tmp)

  const pdfBuf = await readFile(pdfPath)
  await mkdir(PRIV, { recursive: true })
  const filename = `contrato-${leadId}-${stamp}.pdf`
  await writeFile(path.join(PRIV, filename), pdfBuf)
  const url = `/api/sistema/arquivo/${filename}`

  const ins = await pool.query(
    `INSERT INTO contratos (lead_id, cliente_id, tipo, status, pdf_url)
     VALUES ($1, $2, $3, 'gerado', $4) RETURNING *`,
    [leadId, cliente.id, tipo, url]
  )
  emitCrmChange()
  return ins.rows[0]
}

import pool from './db'
import { getClienteByLead } from './clientes'
import { buildContratoHtml } from './contrato-html'
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

export async function gerarContrato(leadId: string) {
  const leadRes = await pool.query(`SELECT * FROM leads WHERE id = $1`, [leadId])
  const lead = leadRes.rows[0]
  if (!lead) throw new Error('Lead não encontrado')

  const cliente = await getClienteByLead(leadId)
  if (!cliente) throw new Error('Cadastro do cliente não encontrado')

  const tipo = tipoFromInteresse(lead.interesse)
  const html = buildContratoHtml(cliente as Record<string, unknown>, lead)

  const stamp = Date.now()
  const tmp = path.join('/tmp', `contrato-${leadId}-${stamp}`)
  await mkdir(tmp, { recursive: true })
  const htmlPath = path.join(tmp, 'contrato.html')
  await writeFile(htmlPath, html, 'utf-8')

  // HTML -> PDF via LibreOffice headless
  await execP(
    `libreoffice --headless -env:UserInstallation=file://${tmp}/lo --convert-to pdf --outdir "${tmp}" "${htmlPath}"`,
    { timeout: 90000 }
  )

  const pdfBuf = await readFile(path.join(tmp, 'contrato.pdf'))
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

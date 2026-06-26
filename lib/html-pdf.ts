import { writeFile, mkdir, readFile, rm } from 'fs/promises'
import path from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'

const execP = promisify(exec)

/** Converte HTML em PDF (A4) no servidor. Mesma estratégia do contrato:
 *  wkhtmltopdf (via xvfb) e, se falhar, fallback para LibreOffice. */
export async function renderHtmlToPdf(html: string): Promise<Buffer> {
  const stamp = Date.now()
  const tmp = path.join('/tmp', `pdf-${stamp}-${Math.random().toString(36).slice(2, 8)}`)
  await mkdir(tmp, { recursive: true })
  const htmlPath = path.join(tmp, 'doc.html')
  const pdfPath = path.join(tmp, 'doc.pdf')
  await writeFile(htmlPath, html, 'utf-8')

  const wk = `wkhtmltopdf --quiet --encoding utf-8 --page-size A4 -T 14 -B 14 -L 16 -R 16 "${htmlPath}" "${pdfPath}"`
  try {
    await execP(`xvfb-run -a ${wk}`, { timeout: 90000 })
  } catch {
    try {
      await execP(wk, { timeout: 90000 })
    } catch {
      await execP(
        `libreoffice --headless -env:UserInstallation=file://${tmp}/lo --convert-to pdf --outdir "${tmp}" "${htmlPath}"`,
        { timeout: 90000 }
      )
    }
  }

  const buf = await readFile(pdfPath)
  rm(tmp, { recursive: true, force: true }).catch(() => {})
  return buf
}

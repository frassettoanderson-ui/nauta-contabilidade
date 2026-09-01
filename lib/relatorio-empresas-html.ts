export interface RelatorioLogos { header?: string }

type Row = Record<string, unknown>
const esc = (v: unknown) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const val = (v: unknown) => { const s = String(v ?? '').trim(); return s || '—' }

const SIT_LABEL: Record<string, string> = { ativo: 'Ativo', em_processo: 'Em processo', inativo: 'Inativo' }

function parseCidadeEstado(v: string): { cidade: string; uf: string } {
  if (!v) return { cidade: '', uf: '' }
  const i = v.lastIndexOf('/')
  if (i === -1) return { cidade: v.trim(), uf: '' }
  return { cidade: v.slice(0, i).trim(), uf: v.slice(i + 1).trim() }
}
function dataBr(v: unknown): string {
  const s = String(v ?? '')
  if (!s) return '—'
  const d = s.slice(0, 10).split('-')
  return d.length === 3 ? `${d[2]}/${d[1]}/${d[0]}` : s
}

/** Relatório de empresas em papel timbrado, com linhas em branco para anotações à mão. */
export function buildRelatorioEmpresasHtml(rows: Row[], ordemLabel: string, logos: RelatorioLogos = {}): string {
  const hoje = new Date().toLocaleDateString('pt-BR')

  const masthead = logos.header
    ? `<table class="mast"><tr>
         <td><img src="${logos.header}" alt="Nauta"/></td>
         <td class="mast-info">Relatório de Empresas<br/>Gerado em ${hoje}</td>
       </tr></table>`
    : `<div class="brand">NAUTA <span>CONTABILIDADE</span></div>`

  const blocos = rows.map((c, i) => {
    const { cidade, uf } = parseCidadeEstado(String(c.emp_cidade_estado ?? ''))
    const cidUf = [cidade, uf].filter(Boolean).join('/') || '—'
    const sit = SIT_LABEL[String(c.situacao ?? 'ativo')] ?? 'Ativo'
    return `
      <div class="emp">
        <div class="emp-head">
          <span class="num">${i + 1}.</span>
          <span class="emp-nome">${esc(val(c.emp_nome) === '—' ? c.responsavel : c.emp_nome)}</span>
          <span class="sit">${esc(sit)}</span>
        </div>
        <div class="emp-info">
          <b>CNPJ:</b> ${esc(val(c.emp_cnpj))} &nbsp;·&nbsp;
          <b>Responsável:</b> ${esc(val(c.responsavel))} &nbsp;·&nbsp;
          <b>Telefone:</b> ${esc(val(c.emp_telefone))} &nbsp;·&nbsp;
          <b>Cidade/UF:</b> ${esc(cidUf)} &nbsp;·&nbsp;
          <b>Cadastro:</b> ${dataBr(c.criado_em)}
        </div>
        <div class="linhas">
          <div class="linha"></div>
          <div class="linha"></div>
          <div class="linha"></div>
          <div class="linha"></div>
        </div>
      </div>`
  }).join('')

  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"/>
<style>
  * { box-sizing: border-box; }
  body { font-family: 'Liberation Sans', Arial, sans-serif; font-size: 10pt; color: #1d1d22; margin: 0; }
  .masthead { border-bottom: 2.5pt solid #0BBCD4; padding-bottom: 8pt; margin-bottom: 10pt; }
  table.mast { width: 100%; border-collapse: collapse; }
  table.mast td img { height: 40px; }
  td.mast-info { text-align: right; vertical-align: bottom; font-size: 8pt; color: #6b7280; }
  .brand { font-size: 17pt; font-weight: bold; color: #11103a; }
  .brand span { color: #0BBCD4; }
  .sub { font-size: 8.5pt; color: #6b7280; margin-bottom: 12pt; }

  .emp { padding: 6pt 0 4pt; border-bottom: .5pt solid #d8dde6; page-break-inside: avoid; }
  .emp-head { display: flex; align-items: baseline; gap: 6pt; }
  .num { font-weight: bold; color: #0BBCD4; font-size: 10.5pt; }
  .emp-nome { font-weight: bold; font-size: 11.5pt; color: #11103a; flex: 1; }
  .sit { font-size: 8pt; font-weight: bold; color: #0a8aa0; border: .8pt solid #0BBCD4; border-radius: 8pt; padding: 1pt 7pt; }
  .emp-info { font-size: 9pt; color: #374151; margin: 3pt 0 5pt; }
  .linhas { margin-top: 2pt; }
  .linha { border-bottom: .5pt solid #b9c0cc; height: 15pt; }

  .foot { margin-top: 14pt; font-size: 7.5pt; color: #9aa1ad; text-align: center; }
</style></head><body>
  <div class="masthead">${masthead}</div>
  <div class="sub">Total: ${rows.length} empresa(s) · Ordenado por: ${esc(ordemLabel)}</div>
  ${blocos || '<p>Nenhuma empresa selecionada.</p>'}
  <div class="foot">NAUTA CONTABILIDADE · Relatório de Empresas · ${hoje}</div>
</body></html>`
}

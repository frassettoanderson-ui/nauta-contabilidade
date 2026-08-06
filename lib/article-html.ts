// Processa o HTML do artigo:
//  - adiciona id aos H2 (âncoras do índice "Neste artigo você vai ver")
//  - transforma toda menção a "Nauta" em link para a home (fora de tags/links existentes)
//  - fornece um split no meio para inserir o banner de propaganda

export interface Heading {
  id: string
  text: string
}

export function slugifyHeading(text: string): string {
  return text
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'secao'
}

/** Adiciona id aos H2 e devolve a lista de headings para o índice. */
function addHeadingIds(html: string): { html: string; headings: Heading[] } {
  const headings: Heading[] = []
  const used = new Set<string>()
  const out = html.replace(/<h2([^>]*)>([\s\S]*?)<\/h2>/gi, (m, attrs: string, inner: string) => {
    const text = inner.replace(/<[^>]+>/g, '').trim()
    if (!text) return m
    let id = slugifyHeading(text)
    let i = 2
    while (used.has(id)) id = `${slugifyHeading(text)}-${i++}`
    used.add(id)
    headings.push({ id, text })
    if (/\sid=/.test(attrs)) return m
    return `<h2${attrs} id="${id}">${inner}</h2>`
  })
  return { html: out, headings }
}

/** Transforma "Nauta" em link para a home, sem tocar em tags ou links já existentes. */
function autolinkNauta(html: string): string {
  const parts = html.split(/(<[^>]+>)/)
  let inAnchor = false
  return parts.map(seg => {
    if (seg.startsWith('<')) {
      if (/^<a\b/i.test(seg)) inAnchor = true
      else if (/^<\/a>/i.test(seg)) inAnchor = false
      return seg
    }
    if (inAnchor) return seg
    return seg.replace(/\bNauta\b/g, '<a href="/" class="nauta-brand-link">Nauta</a>')
  }).join('')
}

export function processArticleHtml(html: string): { html: string; headings: Heading[] } {
  const withIds = addHeadingIds(html || '')
  return { html: autolinkNauta(withIds.html), headings: withIds.headings }
}

/** Divide o HTML processado em duas partes no H2 do meio (para inserir o banner). */
export function splitForBanner(html: string): [string, string] {
  const idxs: number[] = []
  const re = /<h2\b/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(html)) !== null) idxs.push(m.index)
  if (idxs.length < 2) return [html, '']
  const mid = idxs[Math.floor(idxs.length / 2)]
  return [html.slice(0, mid), html.slice(mid)]
}

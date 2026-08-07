// Atualiza posts.autor conforme a categoria (mesmo mapa de lib/autores.ts).
// Roda na VPS: node scripts/set-autores.mjs
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

function loadDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL
  const envPath = path.join(ROOT, '.env.local')
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*DATABASE_URL\s*=\s*(.+)\s*$/)
    if (m) return m[1].trim().replace(/^["']|["']$/g, '')
  }
  throw new Error('DATABASE_URL não encontrado')
}

// nome exibido por categoria (espelha CATEGORIA_AUTOR + AUTORES de lib/autores.ts)
const NOME_POR_CATEGORIA = {
  'simples-e-mei':           'Erivelton',
  'tributacao':              'Erivelton',
  'abertura-de-empresa':     'Izadora',
  'clt-x-pj':                'Bruno',
  'rh-e-folha':              'Bruno',
  'gestao-financeira':       'Guilherme',
  'empreendedorismo':        'Anderson',
  'contabilidade-eleitoral': 'Erviton',
  'setores-e-profissoes':    'Anderson',
}

async function main() {
  const pool = new pg.Pool({ connectionString: loadDatabaseUrl() })
  const now = new Date().toISOString()
  let n = 0
  for (const [slug, nome] of Object.entries(NOME_POR_CATEGORIA)) {
    const res = await pool.query(
      `UPDATE posts p SET autor = $1, atualizado_em = $2
       FROM categorias c
       WHERE p.categoria_id = c.id AND c.slug = $3
       RETURNING p.slug`,
      [nome, now, slug]
    )
    for (const r of res.rows) { console.log(`  ${r.slug} -> ${nome}`); n++ }
  }
  console.log(`\n${n} posts com autor atualizado.`)
  await pool.end()
}

main().catch(e => { console.error('ERRO:', e.message); process.exit(1) })

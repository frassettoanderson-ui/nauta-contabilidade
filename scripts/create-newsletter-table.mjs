// Cria a tabela de inscritos na newsletter. Roda na VPS: node scripts/create-newsletter-table.mjs
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
function dbUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL
  for (const l of fs.readFileSync(path.join(ROOT, '.env.local'), 'utf8').split('\n')) {
    const m = l.match(/^\s*DATABASE_URL\s*=\s*(.+)\s*$/); if (m) return m[1].trim().replace(/^["']|["']$/g, '')
  }
  throw new Error('DATABASE_URL não encontrado')
}

const SQL = `
create table if not exists newsletter (
  id        uuid primary key default gen_random_uuid(),
  email     text not null unique,
  origem    text,
  criado_em timestamptz not null default now()
);
`
async function main() {
  const pool = new pg.Pool({ connectionString: dbUrl() })
  await pool.query(SQL)
  const r = await pool.query(`SELECT count(*) FROM newsletter`)
  console.log('tabela newsletter OK. inscritos:', r.rows[0].count)
  await pool.end()
}
main().catch(e => { console.error('ERRO:', e.message); process.exit(1) })

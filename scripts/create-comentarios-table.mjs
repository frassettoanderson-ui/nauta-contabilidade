// Cria a tabela de comentários do blog. Roda na VPS: node scripts/create-comentarios-table.mjs
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
create table if not exists comentarios (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references posts(id) on delete cascade,
  nome       text not null,
  email      text,
  comentario text not null,
  status     text not null default 'pendente',
  criado_em  timestamptz not null default now()
);
create index if not exists idx_comentarios_post on comentarios(post_id, status, criado_em desc);
`

async function main() {
  const pool = new pg.Pool({ connectionString: dbUrl() })
  await pool.query(SQL)
  const r = await pool.query(`SELECT count(*) FROM comentarios`)
  console.log('tabela comentarios OK. registros:', r.rows[0].count)
  await pool.end()
}
main().catch(e => { console.error('ERRO:', e.message); process.exit(1) })

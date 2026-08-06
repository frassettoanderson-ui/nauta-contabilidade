// Publica posts do blog. Sem argumentos: publica TODOS os rascunhos.
// Com slugs: publica só esses. Ex.: node scripts/publicar-rascunhos.mjs mei-ou-simples-nacional
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

function loadDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL
  for (const line of fs.readFileSync(path.join(ROOT, '.env.local'), 'utf8').split('\n')) {
    const m = line.match(/^\s*DATABASE_URL\s*=\s*(.+)\s*$/)
    if (m) return m[1].trim().replace(/^["']|["']$/g, '')
  }
  throw new Error('DATABASE_URL não encontrado')
}

const slugs = process.argv.slice(2)

async function main() {
  const pool = new pg.Pool({ connectionString: loadDatabaseUrl() })
  const now = new Date().toISOString()
  const res = slugs.length
    ? await pool.query(
        `UPDATE posts SET status='publicado', atualizado_em=$1
         WHERE slug = ANY($2) AND status <> 'publicado' RETURNING slug`, [now, slugs])
    : await pool.query(
        `UPDATE posts SET status='publicado', atualizado_em=$1
         WHERE status='rascunho' RETURNING slug`, [now])
  res.rows.forEach(r => console.log('  publicado:', r.slug))
  const tot = await pool.query(`SELECT status, COUNT(*) FROM posts GROUP BY status`)
  console.log(`\n${res.rows.length} publicados. Totais:`, tot.rows.map(r => `${r.status}=${r.count}`).join(', '))
  await pool.end()
}

main().catch(e => { console.error('ERRO:', e.message); process.exit(1) })

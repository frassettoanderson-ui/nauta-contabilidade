// Aponta posts.imagem_destaque para as ilustrações em public/blog-imgs/<slug>.jpg
// (quando existir o arquivo). Roda na VPS: node scripts/set-blog-imgs.mjs
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const IMG_DIR = path.join(ROOT, 'public', 'blog-imgs')

function loadDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL
  for (const line of fs.readFileSync(path.join(ROOT, '.env.local'), 'utf8').split('\n')) {
    const m = line.match(/^\s*DATABASE_URL\s*=\s*(.+)\s*$/)
    if (m) return m[1].trim().replace(/^["']|["']$/g, '')
  }
  throw new Error('DATABASE_URL não encontrado')
}

async function main() {
  if (!fs.existsSync(IMG_DIR)) { console.log('sem public/blog-imgs'); return }
  const files = fs.readdirSync(IMG_DIR).filter(f => f.endsWith('.jpg'))
  const pool = new pg.Pool({ connectionString: loadDatabaseUrl() })
  const now = new Date().toISOString()
  let n = 0
  for (const f of files) {
    const slug = f.replace(/\.jpg$/, '')
    const res = await pool.query(
      `UPDATE posts SET imagem_destaque=$1, atualizado_em=$2 WHERE slug=$3 RETURNING slug`,
      [`/blog-imgs/${f}`, now, slug]
    )
    if (res.rows[0]) { console.log(`  ${slug} -> /blog-imgs/${f}`); n++ }
    else console.log(`  (sem post p/ ${slug})`)
  }
  console.log(`\n${n} posts com imagem ilustrativa.`)
  await pool.end()
}
main().catch(e => { console.error('ERRO:', e.message); process.exit(1) })

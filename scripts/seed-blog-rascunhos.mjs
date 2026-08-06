// Seed de artigos do blog como RASCUNHO (nada vai ao ar — status 'publicado' é o que aparece no site).
// Idempotente: pula slugs que já existem. Cria categorias/tags que faltarem.
// Uso na VPS:  node scripts/seed-blog-rascunhos.mjs
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const SEED_DIR = path.join(__dirname, 'blog-seed')

// --- carrega DATABASE_URL (env do processo ou .env.local) ---
function loadDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL
  const envPath = path.join(ROOT, '.env.local')
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
      const m = line.match(/^\s*DATABASE_URL\s*=\s*(.+)\s*$/)
      if (m) return m[1].trim().replace(/^["']|["']$/g, '')
    }
  }
  throw new Error('DATABASE_URL não encontrado (env nem .env.local)')
}

const manifest = JSON.parse(fs.readFileSync(path.join(SEED_DIR, 'manifest.json'), 'utf8'))

const pool = new pg.Pool({ connectionString: loadDatabaseUrl() })

async function ensureRow(table, nome, slug) {
  const found = await pool.query(`SELECT id FROM ${table} WHERE slug = $1`, [slug])
  if (found.rows[0]) return found.rows[0].id
  const ins = await pool.query(`INSERT INTO ${table} (nome, slug) VALUES ($1,$2) RETURNING id`, [nome, slug])
  console.log(`  + ${table}: ${nome}`)
  return ins.rows[0].id
}

async function main() {
  let created = 0, skipped = 0

  // categorias
  const catIds = {}
  for (const c of manifest.categorias) catIds[c.slug] = await ensureRow('categorias', c.nome, c.slug)

  // tags (coletadas dos posts)
  const tagIds = {}
  const allTags = new Map()
  for (const p of manifest.posts) for (const t of (p.tags || [])) allTags.set(slugify(t), t)
  for (const [slug, nome] of allTags) tagIds[slug] = await ensureRow('tags', nome, slug)

  const now = new Date().toISOString()
  for (const p of manifest.posts) {
    const exists = await pool.query(`SELECT id FROM posts WHERE slug = $1`, [p.slug])
    if (exists.rows[0]) { console.log(`  = já existe, pulando: ${p.slug}`); skipped++; continue }

    const conteudo = fs.readFileSync(path.join(SEED_DIR, p.arquivo), 'utf8')
    const catId = p.categoria ? catIds[p.categoria] : null

    const ins = await pool.query(
      `INSERT INTO posts (titulo, slug, resumo, conteudo, imagem_destaque, autor, categoria_id, status, criado_em, atualizado_em)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'rascunho',$8,$8) RETURNING id`,
      [p.titulo, p.slug, p.resumo, conteudo, p.imagem_destaque || null, p.autor || 'Equipe Nauta', catId, now]
    )
    const postId = ins.rows[0].id
    for (const t of (p.tags || [])) {
      await pool.query(`INSERT INTO posts_tags (post_id, tag_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`, [postId, tagIds[slugify(t)]])
    }
    console.log(`  + RASCUNHO criado: ${p.slug}`)
    created++
  }

  const total = await pool.query(`SELECT status, COUNT(*) FROM posts GROUP BY status`)
  console.log(`\nResumo: ${created} criados, ${skipped} já existiam.`)
  console.log('Posts por status:', total.rows.map(r => `${r.status}=${r.count}`).join(', '))
  await pool.end()
}

function slugify(s) {
  return s.toString().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

main().catch(e => { console.error('ERRO:', e.message); process.exit(1) })

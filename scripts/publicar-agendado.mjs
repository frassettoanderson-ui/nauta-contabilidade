/**
 * Publicador agendado do blog da Nauta.
 * Publica N rascunhos por execução, revezando entre as CATEGORIAS (round-robin
 * auto-balanceado: escolhe a categoria cujo último post publicado é o mais antigo).
 * Ao publicar, marca status='publicado' e criado_em=NOW() para o post entrar no
 * topo do feed (o blog ordena por criado_em DESC) com a data de hoje.
 *
 * Uso na VPS:
 *   node scripts/publicar-agendado.mjs           -> publica 1 (padrão)
 *   node scripts/publicar-agendado.mjs 2         -> publica 2
 *   node scripts/publicar-agendado.mjs 2 --dry   -> só mostra o que publicaria
 *   COUNT=2 node scripts/publicar-agendado.mjs    -> via env
 */
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

const args = process.argv.slice(2)
const DRY = args.includes('--dry') || args.includes('--dry-run')
const N = Math.max(1, parseInt(args.find(a => /^\d+$/.test(a)) || process.env.COUNT || '1', 10))

async function main() {
  const pool = new pg.Pool({ connectionString: loadDatabaseUrl() })

  const totalDrafts = (await pool.query(`SELECT count(*)::int n FROM posts WHERE status='rascunho'`)).rows[0].n
  if (totalDrafts === 0) {
    console.log('Nenhum rascunho na fila. Nada a publicar.')
    await pool.end(); return
  }
  console.log(`Fila: ${totalDrafts} rascunho(s). Meta desta execução: ${N}${DRY ? ' (DRY-RUN)' : ''}.`)

  let publicados = 0
  for (let i = 0; i < N; i++) {
    // categoria com rascunho disponível cujo último publicado é o mais antigo (nulls primeiro)
    const cat = await pool.query(`
      SELECT c.id, c.nome,
             (SELECT count(*) FROM posts p WHERE p.categoria_id=c.id AND p.status='rascunho')::int drafts,
             (SELECT max(p.criado_em) FROM posts p WHERE p.categoria_id=c.id AND p.status='publicado') last_pub
      FROM categorias c
      WHERE (SELECT count(*) FROM posts p WHERE p.categoria_id=c.id AND p.status='rascunho') > 0
      ORDER BY last_pub ASC NULLS FIRST
      LIMIT 1`)
    if (!cat.rows[0]) { console.log('Sem mais rascunhos.'); break }
    const catId = cat.rows[0].id

    const post = await pool.query(`
      SELECT id, slug, titulo FROM posts
      WHERE categoria_id=$1 AND status='rascunho'
      ORDER BY criado_em ASC, slug ASC LIMIT 1`, [catId])
    const p = post.rows[0]

    if (DRY) {
      console.log(`  [dry] publicaria: [${cat.rows[0].nome}] ${p.titulo} (${p.slug})`)
      // em dry-run não altera o banco; para prever N>1 marcamos "visto" localmente pulando
      // (aqui simplificamos: dry-run com N>1 pode repetir categoria)
    } else {
      await pool.query(
        `UPDATE posts SET status='publicado', criado_em=NOW(), atualizado_em=NOW() WHERE id=$1`,
        [p.id])
      console.log(`  publicado: [${cat.rows[0].nome}] ${p.titulo} (/blog/${p.slug})`)
      publicados++
    }
    if (DRY) break // dry-run mostra só a próxima escolha para não confundir
  }

  const restam = (await pool.query(`SELECT count(*)::int n FROM posts WHERE status='rascunho'`)).rows[0].n
  console.log(`${DRY ? 'DRY-RUN — nada alterado.' : `Publicados: ${publicados}.`} Rascunhos restantes: ${restam}.`)
  await pool.end()
}
main().catch(e => { console.error('ERRO:', e.message); process.exit(1) })

// Gera imagem de destaque (template da marca Nauta) para cada post do manifest e
// atualiza posts.imagem_destaque no banco. Roda na VPS (Linux): node scripts/backfill-blog-images.mjs
// @vercel/og funciona no Linux (no Windows quebra por bug de path de fonte).
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import React from 'react'
import { ImageResponse } from 'next/dist/compiled/@vercel/og/index.node.js'
import pg from 'pg'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const SEED_DIR = path.join(__dirname, 'blog-seed')
const OUT_DIR = path.join(ROOT, 'public', 'blog-capas')
fs.mkdirSync(OUT_DIR, { recursive: true })

function loadDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL
  const envPath = path.join(ROOT, '.env.local')
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
      const m = line.match(/^\s*DATABASE_URL\s*=\s*(.+)\s*$/)
      if (m) return m[1].trim().replace(/^["']|["']$/g, '')
    }
  }
  throw new Error('DATABASE_URL não encontrado')
}

const manifest = JSON.parse(fs.readFileSync(path.join(SEED_DIR, 'manifest.json'), 'utf8'))
const catNome = Object.fromEntries(manifest.categorias.map(c => [c.slug, c.nome]))

const h = React.createElement
const NAVY_A = '#0b1120', NAVY_B = '#12203a', CYAN = '#0BBCD4', MUTED = '#9fb3c8'

function card(titulo, categoria) {
  const cat = (catNome[categoria] || 'Blog Nauta').toUpperCase()
  return h('div', {
    style: {
      width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
      justifyContent: 'space-between', padding: '72px 80px',
      backgroundImage: `linear-gradient(135deg, ${NAVY_A} 0%, ${NAVY_B} 100%)`,
      color: '#ffffff', fontFamily: 'sans-serif',
    },
  }, [
    // topo: marca + categoria
    h('div', { style: { display: 'flex', alignItems: 'center', gap: '16px' } }, [
      h('div', { style: { width: '14px', height: '40px', background: CYAN, borderRadius: '3px' } }, []),
      h('div', { style: { fontSize: '26px', fontWeight: 700, letterSpacing: '1px' } }, 'NAUTA CONTABILIDADE'),
      h('div', { style: { fontSize: '20px', color: CYAN, fontWeight: 700, marginLeft: '8px' } }, '·  ' + cat),
    ]),
    // titulo
    h('div', {
      style: {
        display: 'flex', fontSize: titulo.length > 70 ? '52px' : '60px', fontWeight: 800,
        lineHeight: 1.12, letterSpacing: '-1.5px', maxWidth: '1000px',
      },
    }, titulo),
    // rodape
    h('div', { style: { display: 'flex', alignItems: 'center', gap: '14px', fontSize: '24px', color: MUTED } }, [
      h('div', { style: { width: '40px', height: '3px', background: CYAN } }, []),
      h('div', {}, 'nautacontabilidade.com.br'),
    ]),
  ])
}

async function render(titulo, categoria) {
  const resp = new ImageResponse(card(titulo, categoria), { width: 1200, height: 630 })
  return Buffer.from(await resp.arrayBuffer())
}

async function main() {
  const pool = new pg.Pool({ connectionString: loadDatabaseUrl() })
  const now = new Date().toISOString()
  let done = 0, skipped = 0
  for (const p of manifest.posts) {
    const buf = await render(p.titulo, p.categoria)
    const file = `${p.slug}.png`
    fs.writeFileSync(path.join(OUT_DIR, file), buf)
    const url = `/blog-capas/${file}`
    const res = await pool.query(
      `UPDATE posts SET imagem_destaque = $1, atualizado_em = $2 WHERE slug = $3 RETURNING id`,
      [url, now, p.slug]
    )
    if (res.rows[0]) { console.log(`  + imagem: ${file} (${buf.length} bytes) -> post ${p.slug}`); done++ }
    else { console.log(`  = post não encontrado no banco: ${p.slug} (imagem gerada mesmo assim)`); skipped++ }
  }
  console.log(`\n${done} posts atualizados, ${skipped} sem post no banco.`)
  await pool.end()
}

main().catch(e => { console.error('ERRO:', e.message); process.exit(1) })

const bcrypt = require('bcryptjs')
const { Pool } = require('pg')

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

async function run() {
  const username = process.argv[2]
  const password = process.argv[3]
  const role = process.argv[4] || 'comercial'
  if (!username || !password) {
    console.log('Uso: node scripts/create-user.js <usuario> <senha> [cargo]')
    console.log('Cargos: admin | gerente | comercial | fiscal | pessoal | secretaria')
    process.exit(1)
  }
  const hash = await bcrypt.hash(password, 12)
  await pool.query(
    `INSERT INTO admin_users (username, password_hash, role, must_change_password)
     VALUES ($1, $2, $3, true)
     ON CONFLICT (username) DO UPDATE
       SET password_hash = EXCLUDED.password_hash,
           role = EXCLUDED.role,
           must_change_password = true`,
    [username, hash, role]
  )
  console.log(`✅ Usuário criado: ${username} (cargo: ${role}, troca de senha obrigatória no 1º acesso)`)
  process.exit(0)
}

run().catch(e => { console.error('ERRO:', e.message); process.exit(1) })

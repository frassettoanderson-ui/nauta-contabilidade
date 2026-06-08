const bcrypt = require('bcryptjs')
const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

async function createAdmin() {
  const email = process.argv[2]
  const password = process.argv[3]

  if (!email || !password) {
    console.log('Uso: node scripts/create-admin.js email@exemplo.com suasenha')
    process.exit(1)
  }

  const hash = await bcrypt.hash(password, 12)
  await pool.query(
    `INSERT INTO admin_users (email, password_hash) VALUES ($1, $2) ON CONFLICT (email) DO UPDATE SET password_hash = $2`,
    [email, hash]
  )
  console.log(`✅ Admin criado: ${email}`)
  process.exit(0)
}

createAdmin().catch(console.error)

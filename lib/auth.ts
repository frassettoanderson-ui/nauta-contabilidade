import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import pool from './db'
import type { NextAuthOptions } from 'next-auth'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) return null
          const res = await pool.query('SELECT * FROM admin_users WHERE email = $1', [credentials.email])
          const user = res.rows[0]
          if (!user) return null
          const valid = await bcrypt.compare(credentials.password, user.password_hash)
          if (!valid) return null
          return { id: user.id, email: user.email }
        } catch (e) {
          console.error('[AUTH] ERRO:', e)
          return null
        }
      },
    }),
  ],
  pages: { signIn: '/admin/login' },
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET,
}

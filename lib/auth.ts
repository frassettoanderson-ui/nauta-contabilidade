import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import pool from './db'
import type { NextAuthOptions } from 'next-auth'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Usuário', type: 'text' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) return null
          const ident = credentials.email.trim().toLowerCase()
          const res = await pool.query(
            'SELECT * FROM admin_users WHERE lower(username) = $1 OR lower(email) = $1',
            [ident]
          )
          const user = res.rows[0]
          if (!user) return null
          const valid = await bcrypt.compare(credentials.password, user.password_hash)
          if (!valid) return null
          return {
            id: user.id,
            email: user.email,
            name: user.username || user.email,
            role: user.role || 'gerente',
            mustChangePassword: !!user.must_change_password,
          } as never
        } catch (e) {
          console.error('[AUTH] ERRO:', e)
          return null
        }
      },
    }),
  ],
  pages: { signIn: '/sistema/login' },
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        const u = user as unknown as { id: string; role: string; mustChangePassword: boolean }
        token.uid = u.id
        token.role = u.role
        token.mustChangePassword = u.mustChangePassword
      }
      if (trigger === 'update' && session?.mustChangePassword === false) {
        token.mustChangePassword = false
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        const su = session.user as unknown as { id?: string; role?: string; mustChangePassword?: boolean }
        su.id = token.uid as string
        su.role = token.role as string
        su.mustChangePassword = token.mustChangePassword as boolean
      }
      return session
    },
  },
}

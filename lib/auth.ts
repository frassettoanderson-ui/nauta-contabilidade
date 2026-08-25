import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import pool from './db'
import type { NextAuthOptions } from 'next-auth'
import { getEmpresasDoUsuario, type Empresa } from './empresas'

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
            menuPerms: user.menu_perms ?? null,
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
        const u = user as unknown as { id: string; role: string; mustChangePassword: boolean; menuPerms: string[] | null }
        token.uid = u.id
        token.role = u.role
        token.mustChangePassword = u.mustChangePassword
        token.menuPerms = u.menuPerms
        // Empresas que o usuário pode acessar + empresa ativa (padrão: a primeira).
        const empresas = await getEmpresasDoUsuario(u.id)
        token.empresas = empresas
        token.empresaId = empresas[0]?.id ?? null
        token.refreshedAt = Date.now()
      }
      // Sessão já existente: relê cargo/permissões/empresas do banco periodicamente
      // (ou na 1ª vez após a atualização), para refletir mudanças de cargo/permissão
      // e a criação de empresas SEM exigir novo login.
      if (!user && token.uid) {
        const agora = Date.now()
        const ultima = (token.refreshedAt as number | undefined) ?? 0
        if (!token.empresas || agora - ultima > 30_000) {
          try {
            const res = await pool.query('SELECT role, menu_perms, must_change_password FROM admin_users WHERE id = $1', [token.uid])
            const u = res.rows[0]
            if (u) {
              token.role = u.role || 'gerente'
              token.menuPerms = u.menu_perms ?? null
              token.mustChangePassword = !!u.must_change_password
            }
            const empresas = await getEmpresasDoUsuario(token.uid as string)
            token.empresas = empresas
            const atual = token.empresaId as string | null
            token.empresaId = atual && empresas.some(e => e.id === atual) ? atual : (empresas[0]?.id ?? null)
            token.refreshedAt = agora
          } catch { /* mantém o token atual se o banco oscilar */ }
        }
      }
      if (trigger === 'update') {
        if (session?.mustChangePassword === false) token.mustChangePassword = false
        // Troca de empresa ativa (validada contra as permitidas).
        if (session?.empresaId) {
          const permitidas = (token.empresas as Empresa[] | undefined) ?? []
          if (permitidas.some(e => e.id === session.empresaId)) token.empresaId = session.empresaId
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        const su = session.user as unknown as {
          id?: string; role?: string; mustChangePassword?: boolean; menuPerms?: string[] | null
          empresas?: Empresa[]; empresaId?: string | null; empresaAtiva?: Empresa | null
        }
        su.id = token.uid as string
        su.role = token.role as string
        su.mustChangePassword = token.mustChangePassword as boolean
        su.menuPerms = (token.menuPerms ?? null) as string[] | null
        const empresas = (token.empresas as Empresa[] | undefined) ?? []
        su.empresas = empresas
        su.empresaId = (token.empresaId as string | null) ?? null
        su.empresaAtiva = empresas.find(e => e.id === token.empresaId) ?? null
      }
      return session
    },
  },
}

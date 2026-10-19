import { NextResponse, type NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { effectivePerms, rotaPermitida, apiPermitida, primeiraRota } from '@/lib/menu-perms'

// Nível de acesso de verdade (não só esconder o menu): a cada acesso confere as permissões
// do usuário (cargo + menu_perms, guardados no token da sessão).
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return NextResponse.next() // sem sessão: login/APIs públicas (cron, webhook) seguem as regras de cada rota
  const perms = effectivePerms(String(token.role ?? ''), (token.menuPerms as string[] | null | undefined) ?? null)
  if (perms == null) return NextResponse.next()

  if (pathname.startsWith('/api/')) {
    return apiPermitida(pathname, perms) ? NextResponse.next() : NextResponse.json({ error: 'Sem permissão para estes dados' }, { status: 403 })
  }
  if (pathname === '/sistema' && !perms.includes('/sistema')) {
    return NextResponse.redirect(new URL(primeiraRota(perms), req.url))
  }
  if (!rotaPermitida(pathname, perms)) {
    const url = new URL('/sistema/sem-acesso', req.url)
    url.searchParams.set('de', pathname)
    return NextResponse.redirect(url)
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/sistema/:path*', '/api/financeiro/:path*'],
}

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { signSsoToken } from '@/lib/sso'

// Handoff de SSO: usa a sessão logada da Nauta para entrar direto no Obrigô (GestorOA),
// sem pedir login de novo. Gera um token curto assinado e faz um POST automático para
// o endpoint de SSO do Obrigô, que grava a sessão e devolve o usuário já logado.
export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  // ?next=/empresas/nova → abre essa tela do Obrigô já logado (só caminho relativo simples)
  const nextRaw = new URL(req.url).searchParams.get('next') ?? ''
  const next = /^\/[A-Za-z0-9\-_/]*(\?[A-Za-z0-9\-_=&%]*)?$/.test(nextRaw) ? nextRaw : ''
  const user = session?.user as { email?: string; name?: string; role?: string } | undefined

  // Sem sessão: manda para o login da Nauta e volta para cá depois de autenticar.
  // Location relativo: resolve no domínio do navegador (atrás do proxy, req.url vê localhost:3000).
  if (!user?.email) {
    return new NextResponse(null, {
      status: 307,
      headers: { Location: '/sistema/login?callbackUrl=%2Fapi%2Fsso%2Fgestoroa' },
    })
  }

  const secret = process.env.SSO_GESTOROA_SECRET
  if (!secret) {
    return new NextResponse('SSO não configurado (defina SSO_GESTOROA_SECRET).', { status: 500 })
  }

  const base = (process.env.GESTOROA_BASE_URL || '/gestoroa').replace(/\/$/, '')
  const token = signSsoToken({ email: user.email, nome: user.name, role: user.role }, secret)
  const action = `${base}/api/v1/auth/sso`

  // Página mínima que submete o token via POST (token fora da URL, não vaza em logs).
  const html = `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><title>Entrando no Obrigô…</title></head>
<body onload="document.forms[0].submit()" style="font-family:system-ui,sans-serif;background:#0E2240;color:#fff;display:grid;place-items:center;height:100vh;margin:0">
  <form method="POST" action="${action}">
    <input type="hidden" name="token" value="${token}">
    <input type="hidden" name="next" value="${next}">
    <noscript><button type="submit" style="padding:12px 20px;font-size:16px">Continuar para o Obrigô</button></noscript>
  </form>
  <p style="opacity:.8">Entrando no Obrigô…</p>
</body></html>`

  return new NextResponse(html, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
    },
  })
}

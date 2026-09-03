import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Atalho curto do telão: /tv → redireciona pro painel já com o token embutido.
// Assim a TV usa só nautacontabilidade.com.br/tv (sem token na mão).
export function GET(req: NextRequest) {
  const t = process.env.PAINEL_TV_TOKEN || ''
  return NextResponse.redirect(new URL(`/painel-tv.html?t=${encodeURIComponent(t)}`, req.url))
}

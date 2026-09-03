import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Atalho curto do telão: /tv → redireciona pro painel já com o token embutido.
// Assim a TV usa só nautacontabilidade.com.br/tv (sem token na mão).
export function GET(_req: NextRequest) {
  const t = process.env.PAINEL_TV_TOKEN || ''
  // Location relativo: o navegador resolve no host público (atrás do proxy o req.url é localhost).
  return new NextResponse(null, { status: 307, headers: { Location: `/painel-tv.html?t=${encodeURIComponent(t)}` } })
}

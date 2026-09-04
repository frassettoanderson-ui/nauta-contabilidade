import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import pool from '@/lib/db'
import { getDashboard } from '@/lib/dashboard'

export const dynamic = 'force-dynamic'

// Endpoint do painel — aceita (a) token na URL (TV, sem login: /painel-tv.html?t=<token>,
// token em PAINEL_TV_TOKEN) ou (b) usuário logado no sistema (dashboard interno em /sistema).
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('t') || req.nextUrl.searchParams.get('token') || ''
  const esperado = process.env.PAINEL_TV_TOKEN || ''
  const tokenOk = !!esperado && token === esperado
  if (!tokenOk) {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
  }
  try {
    const emp = await pool.query(`SELECT id FROM empresas WHERE slug = 'nauta' LIMIT 1`)
    const empresaId = emp.rows[0]?.id
    if (!empresaId) return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 500 })
    const d = await getDashboard(empresaId)
    return NextResponse.json({
      geradoEm: new Date().toISOString(),
      clientesAtivos: d.clientesAtivos,
      cnpjsAtivos: d.cnpjsAtivos,
      cnpjsPerdidos: d.cnpjsPerdidosMes,
      clientesPerdidos: d.clientesPerdidosMes,
      mesAtualIdx: d.mesAtualIdx,
      clientesAtraso: d.vencidosCount,
      valorEmAberto: d.valorEmAberto,
      // Faturamento
      faturamentoRealizado: d.faturamento.mesAtual,
      faturamentoEsperado: d.faturamento.projecaoMesAtual,
      faturamentoMesAnterior: d.faturamento.mesAnterior,
      faturamentoMesSeguinte: d.faturamento.projecaoMesSeguinte,
      faturamentoNovosClientes: d.faturamentoNovosClientes,
      // Projeção linear do realizado até o fim do mês (por dias úteis)
      faturamentoProjecao: d.clientesNovos.diasUteisDecorridos > 0
        ? Math.round(d.faturamento.mesAtual / d.clientesNovos.diasUteisDecorridos * d.clientesNovos.diasUteisTotais)
        : d.faturamento.mesAtual,
      // Clientes
      clientesNovos: d.clientesNovos.atual,
      clientesNovosProjecao: d.clientesNovos.projecao,
      clientesNovosAnterior: d.clientesNovos.anterior,
      metaClientes: d.metaClientes,
      // Série do gráfico
      meses: d.meses,
      serieRealizado: d.recebidoSerie,
      serieEsperado: d.aReceberSerie,
      labels: d.labels,
    })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message || 'Erro' }, { status: 500 })
  }
}

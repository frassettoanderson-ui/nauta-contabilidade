import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getDashboard } from '@/lib/dashboard'

export const dynamic = 'force-dynamic'

// Endpoint PÚBLICO do painel de TV — sem login, protegido por um token na URL.
// O token fica em PAINEL_TV_TOKEN (.env.local). Link da TV: /painel-tv.html?t=<token>
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('t') || req.nextUrl.searchParams.get('token') || ''
  const esperado = process.env.PAINEL_TV_TOKEN || ''
  if (!esperado || token !== esperado) {
    return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
  }
  try {
    const emp = await pool.query(`SELECT id FROM empresas WHERE slug = 'nauta' LIMIT 1`)
    const empresaId = emp.rows[0]?.id
    if (!empresaId) return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 500 })
    const d = await getDashboard(empresaId)
    return NextResponse.json({
      geradoEm: new Date().toISOString(),
      clientesAtivos: d.clientesAtivos,
      clientesAtraso: d.vencidosCount,
      valorEmAberto: d.valorEmAberto,
      // Faturamento
      faturamentoRealizado: d.faturamento.mesAtual,
      faturamentoEsperado: d.faturamento.projecaoMesAtual,
      faturamentoMesAnterior: d.faturamento.mesAnterior,
      faturamentoMesSeguinte: d.faturamento.projecaoMesSeguinte,
      faturamentoNovosClientes: d.faturamentoNovosClientes,
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

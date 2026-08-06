import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'BPO Financeiro — Gestão Financeira Terceirizada',
  description:
    'BPO financeiro 100% interno: contas a pagar e receber, conciliação bancária e fluxo de caixa. Sua empresa foca no core, a Nauta cuida do resto.',
  alternates: { canonical: 'https://nautacontabilidade.com.br/servicos/bpo-financeiro' },
  openGraph: {
    title: 'BPO Financeiro — Gestão Financeira Terceirizada | Nauta Contabilidade',
    description: 'BPO financeiro 100% interno: contas a pagar e receber, conciliação bancária e fluxo de caixa. Sua empresa foca no core, a Nauta cuida do resto.',
    url: 'https://nautacontabilidade.com.br/servicos/bpo-financeiro',
  },
}

export default function SegmentLayout({ children }: { children: React.ReactNode }) {
  return children
}

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Fale com a Nauta — Contato e Atendimento',
  description:
    'Fale com a Nauta Contabilidade por WhatsApp ou e-mail. Atendimento 100% digital para todo o Brasil. Solicite uma proposta sem compromisso.',
  alternates: { canonical: 'https://nautacontabilidade.com.br/contato' },
  openGraph: {
    title: 'Fale com a Nauta — Contato e Atendimento | Nauta Contabilidade',
    description: 'Fale com a Nauta Contabilidade por WhatsApp ou e-mail. Atendimento 100% digital para todo o Brasil. Solicite uma proposta sem compromisso.',
    url: 'https://nautacontabilidade.com.br/contato',
  },
}

export default function SegmentLayout({ children }: { children: React.ReactNode }) {
  return children
}

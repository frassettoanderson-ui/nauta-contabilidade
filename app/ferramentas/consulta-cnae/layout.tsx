import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Consulta de CNAE — código e anexo do Simples',
  description: 'Busque o CNAE da sua atividade e descubra o anexo do Simples Nacional. Consulta gratuita.',
  alternates: { canonical: 'https://nautacontabilidade.com.br/ferramentas/consulta-cnae' },
  openGraph: { title: 'Consulta de CNAE — código e anexo do Simples | Nauta Contabilidade', description: 'Busque o CNAE da sua atividade e descubra o anexo do Simples Nacional. Consulta gratuita.', url: 'https://nautacontabilidade.com.br/ferramentas/consulta-cnae' },
}

export default function Layout({ children }: { children: React.ReactNode }) { return children }

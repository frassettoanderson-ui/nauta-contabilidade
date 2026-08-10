'use client'

import { useState, type ReactNode } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import LeadPopup from '@/components/LeadPopup'
import InnerHero from '@/components/ui/inner-hero'

/** Casca comum das ferramentas: header + hero + conteúdo + footer + popup de lead. */
export default function ToolShell({
  titulo, descricao, crumb, children, wide = false,
}: {
  titulo: ReactNode
  descricao: string
  crumb: string
  children: ReactNode
  wide?: boolean
}) {
  const [popupOpen, setPopupOpen] = useState(false)
  const appName = typeof titulo === 'string' ? titulo : crumb
  const appLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: appName,
    description: descricao,
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Web',
    isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'BRL' },
    provider: { '@type': 'Organization', name: 'Nauta Contabilidade', url: 'https://nautacontabilidade.com.br' },
  }
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(appLd) }} />
      <Header onOpenLead={() => setPopupOpen(true)} />
      <main style={{ background: '#0a0918', minHeight: '100vh' }}>
        <InnerHero
          eyebrow="Ferramenta gratuita"
          title={titulo}
          description={descricao}
          breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Ferramentas', href: '/ferramentas' }, { label: crumb }]}
          purpleOrb
        />
        <div className={`${wide ? 'max-w-5xl' : 'max-w-3xl'} mx-auto px-4 sm:px-6 py-12`}>
          {children}
          <div className="mt-12 rounded-2xl p-7 text-center" style={{ background: 'rgba(11,188,212,0.05)', border: '1px solid rgba(11,188,212,0.15)' }}>
            <h3 className="text-lg font-black text-white mb-1.5">Precisa de ajuda com isso?</h3>
            <p className="text-gray-400 text-sm mb-4">Fale com um contador da Nauta e resolva sem complicação.</p>
            <a href="/contato" className="inline-flex items-center justify-center px-6 py-3 font-bold text-white text-sm rounded-xl" style={{ background: '#0BBCD4' }}>
              Falar com a Nauta
            </a>
          </div>
          <p className="text-xs text-gray-600 mt-6 text-center">
            Esta ferramenta é uma estimativa de caráter informativo e não substitui a orientação de um contador. Consulte a Nauta para o seu caso.
          </p>
        </div>
      </main>
      <Footer />
      <LeadPopup isOpen={popupOpen} onClose={() => setPopupOpen(false)} />
    </>
  )
}

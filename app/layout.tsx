import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'Nauta Contabilidade Digital | Contabilidade Online para Todo o Brasil',
  description:
    'Contabilidade digital e consultiva para MEI, Simples Nacional e Lucro Presumido em todo o Brasil. Troque de contador, abra sua empresa ou deixe de ser MEI com a Nauta.',
  keywords: [
    'contabilidade digital',
    'contabilidade online',
    'contador online',
    'abrir empresa',
    'trocar de contador',
    'MEI',
    'Simples Nacional',
    'BPO financeiro',
    'contabilidade eleitoral',
    'Nauta Contabilidade',
  ],
  authors: [{ name: 'Nauta Contabilidade' }],
  creator: 'Nauta Contabilidade',
  openGraph: {
    type:        'website',
    locale:      'pt_BR',
    url:         'https://nautacontabilidade.com.br',
    siteName:    'Nauta Contabilidade',
    title:       'Nauta Contabilidade Digital | Contabilidade Online para Todo o Brasil',
    description: 'Contabilidade digital e consultiva para MEI, Simples Nacional e Lucro Presumido em todo o Brasil.',
    images: [
      {
        url:    '/og-image.jpg',
        width:  1200,
        height: 630,
        alt:    'Nauta Contabilidade Digital',
      },
    ],
  },
  twitter: {
    card:        'summary_large_image',
    title:       'Nauta Contabilidade Digital | Contabilidade Online para Todo o Brasil',
    description: 'Contabilidade digital e consultiva para MEI, Simples Nacional e Lucro Presumido em todo o Brasil.',
    images:      ['/og-image.jpg'],
  },
  icons: {
    icon:    '/icone.png',
    apple:   '/icone.png',
  },
  robots: {
    index:  true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  alternates: {
    canonical: 'https://nautacontabilidade.com.br',
  },
}

const jsonLd = {
  '@context':   'https://schema.org',
  '@type':      'AccountingService',
  name:         'Nauta Contabilidade',
  url:          'https://nautacontabilidade.com.br',
  logo:         'https://nautacontabilidade.com.br/logo.svg',
  foundingDate: '2013',
  description:  'Contabilidade digital e consultiva para todo o Brasil. BPO financeiro 100% interno, contabilidade eleitoral especializada e atendimento 100% online.',
  telephone:    '+55-48-99924-5194',
  email:        'contato@nautacontabilidade.com.br',
  address: {
    '@type':           'PostalAddress',
    streetAddress:     'Av. Santa Catarina, 165',
    addressLocality:   'Imbituba',
    addressRegion:     'SC',
    postalCode:        '88780-000',
    addressCountry:    'BR',
  },
  geo: {
    '@type':    'GeoCoordinates',
    latitude:   '-28.2342',
    longitude:  '-48.6703',
  },
  openingHoursSpecification: [
    {
      '@type':     'OpeningHoursSpecification',
      dayOfWeek:   ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      opens:       '08:00',
      closes:      '18:00',
    },
  ],
  sameAs: [
    'https://www.instagram.com/nautacontabilidade',
    'https://www.facebook.com/nautacontabilidade',
    'https://www.linkedin.com/company/nautacontabilidade',
  ],
  areaServed: {
    '@type': 'Country',
    name:    'Brazil',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="font-sans antialiased bg-white text-gray-900">
        {children}
      </body>
    </html>
  )
}

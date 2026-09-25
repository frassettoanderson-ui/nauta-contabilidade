import type { Metadata, Viewport } from 'next'

// Área do sistema = marca Obrigô (título e favicon próprios, diferentes do site público).
export const metadata: Metadata = {
  title: { absolute: 'Obrigô' },
  icons: { icon: '/icon-obrigo.svg', apple: '/icon-obrigo.svg' },
}
export const viewport: Viewport = { themeColor: '#0e2240' }

export default function SistemaLayout({ children }: { children: React.ReactNode }) {
  return children
}

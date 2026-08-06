'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'

function slugify(s: string) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/&/g, 'e').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

// Categorias desejadas no menu (referência Contabilizei, adaptado à Nauta).
const CATEGORIAS = [
  'Reforma Tributária', 'Conteúdos Contábeis', 'Tabelas Simples Nacional', 'Profissionais da Saúde',
  'Tecnologia da Informação', 'Marketing & Publicidade', 'Consultoria', 'Turismo', 'Comércio', 'Serviços',
  'Gestão Financeira', 'Recursos Humanos', 'Engenheiro', 'Arquiteto', 'Médico', 'Advogado', 'Tributação',
  'Comparativo CLT X PJ', 'Autônomo', 'Simples Nacional', 'Jornada de Quem Faz', 'MEI', 'Abertura de Empresa',
  'Escolha do CNAE', 'Empreendedorismo', 'Tabelas Contábeis',
]

// Recomendados: aponta para os artigos que já existem; demais caem em busca.
const RECOMENDADOS: { label: string; href: string }[] = [
  { label: 'Fator R Simples Nacional', href: '/blog/fator-r-simples-nacional' },
  { label: 'MEI ou Simples Nacional', href: '/blog/mei-ou-simples-nacional' },
  { label: 'CNAE: como escolher', href: '/blog/cnae-como-escolher' },
  { label: 'CLT ou PJ', href: '/blog/clt-ou-pj' },
  { label: 'Como abrir uma empresa', href: '/blog/como-abrir-empresa-cnpj' },
  { label: 'Deixar de ser MEI (virar ME)', href: '/blog/deixar-de-ser-mei-virar-me' },
  { label: 'Planejamento tributário', href: '/blog/planejamento-tributario' },
  { label: 'Rescisão: como calcular', href: '/blog/como-calcular-rescisao' },
]

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h3 className="text-white font-black text-sm uppercase tracking-wide mb-3">
        {title}<span className="text-[#0BBCD4]">.</span>
      </h3>
      {children}
    </div>
  )
}

export default function BlogSidebar() {
  const router = useRouter()
  const [q, setQ] = useState('')

  function onSearch(e: React.FormEvent) {
    e.preventDefault()
    router.push(q.trim() ? `/blog?busca=${encodeURIComponent(q.trim())}` : '/blog')
  }

  return (
    <aside className="w-full lg:w-72 shrink-0">
      {/* Busca */}
      <form onSubmit={onSearch} className="relative mb-8">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
        <input
          type="text" value={q} onChange={e => setQ(e.target.value)} placeholder="O que você busca?"
          className="w-full h-11 pl-10 pr-4 rounded-xl text-sm text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-[#0BBCD4]/30"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)' }}
        />
      </form>

      <Section title="Categorias">
        <ul className="space-y-1.5">
          {CATEGORIAS.map(c => (
            <li key={c}>
              <Link href={`/blog?categoria=${slugify(c)}`} className="text-sm text-gray-400 hover:text-[#0BBCD4] transition-colors">
                {c}
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Recomendados">
        <ul className="space-y-1.5">
          {RECOMENDADOS.map(r => (
            <li key={r.label}>
              <Link href={r.href} className="text-sm text-gray-400 hover:text-[#0BBCD4] transition-colors">{r.label}</Link>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Materiais Gratuitos">
        <Link href="/ferramentas" className="text-sm text-[#0BBCD4] hover:underline">Ir para as ferramentas →</Link>
      </Section>

      <Section title="Tags">
        <div className="flex flex-wrap gap-2">
          {['Ideias de Negócios', 'Impostos', 'Abrir Empresa', 'MEI'].map(t => (
            <Link key={t} href={`/blog?busca=${encodeURIComponent(t)}`}
              className="text-xs px-3 py-1.5 rounded-full text-gray-400 hover:text-[#0BBCD4] transition-colors"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)' }}>
              {t}
            </Link>
          ))}
        </div>
      </Section>
    </aside>
  )
}

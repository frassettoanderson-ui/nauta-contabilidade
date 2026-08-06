'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Star, Check, Inbox, Building2, FileText, HandCoins } from 'lucide-react'

type L = { label: string; href: string }
type Bloco = { titulo: string; links: L[] }
type Coluna = { Icon: typeof Inbox; blocos: Bloco[] }

const cat = (s: string) => `/blog?categoria=${s}`
const busca = (s: string) => `/blog?busca=${encodeURIComponent(s)}`

const COLUNAS: Coluna[] = [
  {
    Icon: Inbox,
    blocos: [
      { titulo: 'Categorias do Blog', links: [
        { label: 'Abertura de Empresa', href: cat('abertura-de-empresa') },
        { label: 'Escolha do CNAE', href: busca('CNAE') },
        { label: 'Simples Nacional', href: cat('simples-e-mei') },
        { label: 'Tabelas Simples Nacional', href: busca('tabela simples nacional') },
        { label: 'MEI', href: cat('simples-e-mei') },
        { label: 'Comparativo CLT X PJ', href: cat('clt-x-pj') },
        { label: 'Jornada de Quem Faz', href: cat('empreendedorismo') },
        { label: 'Tributação', href: cat('tributacao') },
        { label: 'Tabelas Contábeis', href: busca('tabela') },
        { label: 'Conteúdos Contábeis', href: cat('gestao-financeira') },
        { label: 'Gestão Financeira', href: cat('gestao-financeira') },
        { label: 'Empreendedorismo', href: cat('empreendedorismo') },
        { label: 'Recursos Humanos', href: cat('rh-e-folha') },
      ]},
      { titulo: 'Categorias por atividade', links: [
        { label: 'Autônomo', href: busca('autônomo') }, { label: 'Advogado', href: busca('advogado') },
        { label: 'Arquiteto', href: busca('arquitetura') }, { label: 'Comércio', href: busca('comércio') },
        { label: 'Consultoria', href: busca('consultoria') }, { label: 'Engenheiro', href: busca('engenharia') },
        { label: 'Marketing & Publicidade', href: busca('marketing') }, { label: 'Médico', href: busca('médico') },
        { label: 'Profissionais da Saúde', href: busca('saúde') }, { label: 'Serviços', href: busca('serviços') },
        { label: 'Tecnologia da Informação', href: busca('tecnologia') }, { label: 'Turismo', href: busca('turismo') },
      ]},
    ],
  },
  {
    Icon: Building2,
    blocos: [
      { titulo: 'Está abrindo sua empresa?', links: [
        { label: 'Como abrir uma empresa', href: '/blog/como-abrir-empresa-cnpj' },
        { label: 'Como abrir uma microempresa ME', href: '/blog/deixar-de-ser-mei-virar-me' },
        { label: 'Como abrir uma empresa Simples Nacional', href: busca('Simples Nacional') },
        { label: 'Como abrir um CNPJ', href: '/blog/como-abrir-empresa-cnpj' },
        { label: 'Ideias de negócios', href: cat('empreendedorismo') },
      ]},
      { titulo: 'Portes de empresa', links: [
        { label: 'MEI - Micro Empreendedor Individual', href: '/blog/mei-ou-simples-nacional' },
        { label: 'ME - Microempresa', href: '/blog/deixar-de-ser-mei-virar-me' },
        { label: 'EPP - Empresa de Pequeno Porte', href: busca('EPP') },
      ]},
      { titulo: 'Natureza Jurídica', links: [
        { label: 'EI – Empresário Individual', href: busca('empresário individual') },
        { label: 'EIRELI', href: busca('EIRELI') },
        { label: 'SLU - Sociedade Limitada Unipessoal', href: busca('SLU') },
        { label: 'LTDA – Sociedade Limitada', href: '/blog/como-abrir-empresa-cnpj' },
      ]},
      { titulo: 'Regimes de tributação', links: [
        { label: 'Simples Nacional', href: '/blog/simples-presumido-ou-real' },
        { label: 'Lucro Presumido', href: '/blog/simples-presumido-ou-real' },
        { label: 'Lucro Real', href: '/blog/simples-presumido-ou-real' },
      ]},
    ],
  },
  {
    Icon: FileText,
    blocos: [
      { titulo: 'Tudo sobre CNAE', links: [
        { label: 'CNAE: o que é?', href: '/blog/cnae-como-escolher' },
        { label: 'Tabela CNAE completa', href: busca('CNAE') },
        { label: 'Consulta de CNAE', href: '/ferramentas' },
        { label: 'CNAEs do Simples Nacional', href: busca('CNAE Simples') },
        { label: 'CNAEs atendidos pela Nauta', href: '/quem-atendemos' },
      ]},
      { titulo: 'Simples Nacional', links: [
        { label: 'Tabela do Simples Nacional', href: busca('tabela simples') },
        { label: 'Anexo III do Simples', href: '/blog/fator-r-simples-nacional' },
        { label: 'Anexo V do Simples', href: '/blog/fator-r-simples-nacional' },
        { label: 'Fator R do Simples Nacional', href: '/blog/fator-r-simples-nacional' },
        { label: 'MEI ou Simples Nacional', href: '/blog/mei-ou-simples-nacional' },
      ]},
      { titulo: 'MEI', links: [
        { label: 'Como abrir um MEI', href: '/blog/mei-ou-simples-nacional' },
        { label: 'Tabela de atividades MEI', href: busca('atividades MEI') },
        { label: 'Não pode ser MEI?', href: '/blog/deixar-de-ser-mei-virar-me' },
        { label: 'Como desenquadrar o MEI', href: '/blog/deixar-de-ser-mei-virar-me' },
      ]},
    ],
  },
  {
    Icon: HandCoins,
    blocos: [
      { titulo: 'Autônomos', links: [
        { label: 'O que é trabalho autônomo?', href: busca('autônomo') },
        { label: 'INSS Autônomo', href: busca('INSS autônomo') },
        { label: 'RPA - Recibo de Pagamento Autônomo', href: '/ferramentas' },
      ]},
      { titulo: 'Dúvidas entre CLT ou PJ?', links: [
        { label: 'CLT ou PJ: o que compensa mais?', href: '/blog/clt-ou-pj' },
        { label: 'Calculadora CLT x PJ', href: '/ferramentas/calculadora-salario-liquido' },
        { label: 'O que é Pessoa Jurídica?', href: busca('pessoa jurídica') },
        { label: 'Como ser PJ?', href: '/blog/clt-ou-pj' },
        { label: 'Contratação PJ', href: busca('contratação PJ') },
        { label: 'Como pagar menos imposto sendo PJ', href: '/blog/planejamento-tributario' },
      ]},
      { titulo: 'Universo da Contabilidade', links: [
        { label: 'Contador Online', href: '/servicos/contabil' },
        { label: 'O que é contabilidade digital?', href: '/quem-atendemos' },
        { label: 'O que faz o contador?', href: '/servicos/contabil' },
        { label: 'Como trocar de contador', href: '/blog/como-trocar-de-contador' },
      ]},
    ],
  },
]

export default function BlogFooterSections() {
  const [email, setEmail] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function assinar(e: React.FormEvent) {
    e.preventDefault()
    setMsg(null)
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) { setMsg('Informe um e-mail válido.'); return }
    setEnviando(true)
    try {
      const r = await fetch('/api/blog/newsletter', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, origem: 'blog' }),
      })
      if (!r.ok) throw new Error((await r.json()).error || 'Erro')
      setEmail(''); setMsg('Pronto! Você está inscrito. 🎉')
    } catch (err) { setMsg(err instanceof Error ? err.message : 'Erro ao inscrever.') }
    finally { setEnviando(false) }
  }

  return (
    <>
      {/* ── Newsletter ── */}
      <section style={{ background: 'linear-gradient(120deg, #0BBCD4 0%, #0899b0 100%)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col lg:flex-row lg:items-center gap-6 lg:gap-10">
          <div className="lg:flex-1">
            <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">Assine nossa newsletter</h2>
            <p className="text-white/85 text-sm mt-1">Receba dicas e conteúdos exclusivos de contabilidade por e-mail.</p>
          </div>
          <form onSubmit={assinar} className="flex flex-col sm:flex-row gap-3 lg:w-[520px]">
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu e-mail"
              className="flex-1 h-12 rounded-xl px-4 text-sm text-[#0f0e1a] placeholder-gray-500 outline-none" style={{ background: '#fff' }} />
            <button type="submit" disabled={enviando}
              className="h-12 px-7 rounded-xl font-bold text-sm text-[#0BBCD4] bg-[#0a0918] hover:bg-black transition-colors disabled:opacity-60 whitespace-nowrap">
              {enviando ? 'Enviando…' : 'Assinar grátis'}
            </button>
          </form>
        </div>
        {msg && <p className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-4 -mt-4 text-white text-sm font-medium">{msg}</p>}
      </section>

      {/* ── CTA band ── */}
      <section style={{ background: '#0b1120' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight mb-4" style={{ letterSpacing: '-0.03em' }}>
              Abra sua empresa com<br />quem entende de <span className="text-[#0BBCD4]">verdade.</span>
            </h2>
            <p className="text-gray-300 leading-relaxed mb-7 max-w-xl">
              A Nauta faz todo o processo de abertura da sua empresa para ela ficar 100% regularizada e com os impostos otimizados. Cuidamos da burocracia enquanto você foca no seu negócio.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <Link href="/servicos/legalizacao-societario"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 font-bold text-white text-sm rounded-xl transition-all hover:-translate-y-0.5"
                style={{ background: '#0BBCD4', boxShadow: '0 8px 24px rgba(11,188,212,0.25)' }}>
                Abrir minha empresa grátis
              </Link>
              <Link href="/contato"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 font-semibold text-white text-sm rounded-xl transition-all hover:-translate-y-0.5"
                style={{ border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.04)' }}>
                Trocar de contador
              </Link>
            </div>
            <div className="flex items-center gap-1 mb-2">
              {[0, 1, 2, 3, 4].map(i => <Star key={i} size={16} className="fill-[#0BBCD4] text-[#0BBCD4]" />)}
            </div>
            <p className="text-gray-400 text-sm flex items-center gap-2">
              <Check size={15} className="text-[#0BBCD4]" /> +500 empresas atendidas em 27 estados desde 2013.
            </p>
          </div>
          <div className="relative rounded-3xl overflow-hidden aspect-[4/3] hidden lg:block" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
            <Image src="/blog-imgs/como-abrir-empresa-cnpj.jpg" alt="Empreendedores abrindo empresa com a Nauta" fill sizes="45vw" className="object-cover" />
          </div>
        </div>
      </section>

      {/* ── Central do Empreendedor (mural) ── */}
      <section style={{ background: '#0a0918', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-2xl sm:text-3xl font-black text-white text-center mb-12" style={{ letterSpacing: '-0.02em' }}>
            Central do Empreendedor
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
            {COLUNAS.map(({ Icon, blocos }, i) => (
              <div key={i}>
                <span className="w-12 h-12 rounded-xl flex items-center justify-center mb-6"
                  style={{ background: 'rgba(11,188,212,0.10)', border: '1px solid rgba(11,188,212,0.22)' }}>
                  <Icon size={22} className="text-[#0BBCD4]" />
                </span>
                {blocos.map(b => (
                  <div key={b.titulo} className="mb-6 last:mb-0">
                    <h3 className="text-white font-bold text-sm mb-3">{b.titulo}</h3>
                    <ul className="space-y-2">
                      {b.links.map(l => (
                        <li key={l.label}>
                          <Link href={l.href} className="text-sm text-gray-400 hover:text-[#0BBCD4] transition-colors leading-snug">{l.label}</Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}

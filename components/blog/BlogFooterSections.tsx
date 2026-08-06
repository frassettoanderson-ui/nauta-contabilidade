'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Star, Check } from 'lucide-react'

const MURAL = [
  {
    titulo: 'Categorias',
    links: [
      { label: 'Abertura de Empresa', href: '/blog?categoria=abertura-de-empresa' },
      { label: 'Simples & MEI', href: '/blog?categoria=simples-e-mei' },
      { label: 'Tributação', href: '/blog?categoria=tributacao' },
      { label: 'CLT × PJ', href: '/blog?categoria=clt-x-pj' },
      { label: 'Gestão Financeira', href: '/blog?categoria=gestao-financeira' },
      { label: 'RH & Folha', href: '/blog?categoria=rh-e-folha' },
      { label: 'Empreendedorismo', href: '/blog?categoria=empreendedorismo' },
      { label: 'Contabilidade Eleitoral', href: '/blog?categoria=contabilidade-eleitoral' },
    ],
  },
  {
    titulo: 'Está abrindo sua empresa?',
    links: [
      { label: 'Como abrir uma empresa (CNPJ)', href: '/blog/como-abrir-empresa-cnpj' },
      { label: 'MEI ou Simples Nacional', href: '/blog/mei-ou-simples-nacional' },
      { label: 'Deixar de ser MEI e virar ME', href: '/blog/deixar-de-ser-mei-virar-me' },
      { label: 'CNAE: como escolher', href: '/blog/cnae-como-escolher' },
      { label: 'Abrir empresa com a Nauta', href: '/servicos/legalizacao-societario' },
    ],
  },
  {
    titulo: 'Ferramentas gratuitas',
    links: [
      { label: 'Calculadora Fator R', href: '/ferramentas/calculadora-fator-r' },
      { label: 'Simulador de Regime Tributário', href: '/ferramentas/simulador-regime-tributario' },
      { label: 'Calculadora Salário Líquido', href: '/ferramentas/calculadora-salario-liquido' },
      { label: 'Simulador de Rescisão', href: '/ferramentas/simulador-rescisao' },
      { label: 'Ver todas as ferramentas', href: '/ferramentas' },
    ],
  },
  {
    titulo: 'Universo da Contabilidade',
    links: [
      { label: 'Contabilidade Contábil', href: '/servicos/contabil' },
      { label: 'Serviço Fiscal', href: '/servicos/fiscal' },
      { label: 'Folha de Pagamento', href: '/servicos/folha-de-pagamento' },
      { label: 'BPO Financeiro', href: '/servicos/bpo-financeiro' },
      { label: 'Planejamento Tributário', href: '/servicos/planejamento-tributario' },
      { label: 'Quem atendemos', href: '/quem-atendemos' },
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
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Erro ao inscrever.')
    } finally { setEnviando(false) }
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
              className="flex-1 h-12 rounded-xl px-4 text-sm text-[#0f0e1a] placeholder-gray-500 outline-none"
              style={{ background: '#fff' }} />
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

      {/* ── Mural de recursos ── */}
      <section style={{ background: '#0a0918', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <h2 className="text-2xl sm:text-3xl font-black text-white text-center mb-10" style={{ letterSpacing: '-0.02em' }}>
            Central de recursos do empreendedor
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {MURAL.map(col => (
              <div key={col.titulo}>
                <h3 className="text-white font-bold text-sm mb-4">{col.titulo}</h3>
                <ul className="space-y-2.5">
                  {col.links.map(l => (
                    <li key={l.label}>
                      <Link href={l.href} className="text-sm text-gray-400 hover:text-[#0BBCD4] transition-colors leading-snug">{l.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}

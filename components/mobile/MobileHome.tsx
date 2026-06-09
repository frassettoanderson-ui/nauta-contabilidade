'use client'

import Image from 'next/image'
import Reveal from './Reveal'
import {
  BookOpen, Calculator, Users, Building2, BarChart3, TrendingUp, Vote,
  Shield, Globe2, Clock, Users2, Smartphone, ArrowRight, MessageCircle,
  Briefcase, Store, UserCheck, Stethoscope, Code2, ShoppingCart,
} from 'lucide-react'

const WA_NUMBER = '5548998211604'
function wa(msg: string) {
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`
}

const SERVICES = [
  { icon: BookOpen,   title: 'Contábil',                 desc: 'Escrituração, balanços e demonstrações com precisão.' },
  { icon: Calculator, title: 'Fiscal',                   desc: 'Apuração de impostos e obrigações acessórias.' },
  { icon: Users,      title: 'Folha de Pagamento',       desc: 'Folha, eSocial, férias, 13º e encargos.' },
  { icon: Building2,  title: 'Legalização / Societário', desc: 'Abertura, alteração e encerramento de empresas.' },
  { icon: BarChart3,  title: 'BPO Financeiro',           desc: 'Contas a pagar/receber, fluxo de caixa e conciliação.' },
  { icon: TrendingUp, title: 'Planejamento Tributário',  desc: 'Estratégias legais para reduzir a carga tributária.' },
  { icon: Vote,       title: 'Contabilidade Eleitoral',  desc: '+400 prestações aprovadas. Nossa especialidade.', highlight: true },
]

const DIFFERENTIALS = [
  { icon: Shield,     title: 'BPO 100% interno',       desc: 'Nada terceirizado. Equipe dedicada e de confiança.' },
  { icon: Globe2,     title: 'Atendimento nacional',   desc: 'De Norte a Sul do Brasil, 100% online.' },
  { icon: Clock,      title: '+10 anos de experiência', desc: 'Fundada em 2013, com histórico sólido.' },
  { icon: Users2,     title: 'Equipe consultiva',      desc: 'Parceiros estratégicos, não só emissores de guias.' },
  { icon: Smartphone, title: 'App próprio',            desc: 'Documentos, relatórios e contato pelo app.' },
]

const REGIMES = [
  { label: 'MEI',              desc: 'Até R$ 81k/ano',       color: '#0BBCD4' },
  { label: 'Simples Nacional', desc: 'Até R$ 4,8M/ano',      color: '#7c6fff' },
  { label: 'Lucro Presumido',  desc: 'Acima de R$ 4,8M/ano', color: '#94a3b8' },
]

const SEGMENTS = [
  { icon: Briefcase,    label: 'Prestadores de serviço' },
  { icon: Store,        label: 'Comércio' },
  { icon: UserCheck,    label: 'Profissionais liberais' },
  { icon: Stethoscope,  label: 'Saúde' },
  { icon: Code2,        label: 'Tecnologia e Marketing' },
  { icon: ShoppingCart, label: 'E-commerce' },
]

const HERO_CTAS = [
  'Trocar de contador',
  'Abrir minha empresa',
  'Deixar de ser MEI',
]

export default function MobileHome() {
  return (
    <div className="bg-[#0f0e1a] text-white min-h-screen">

      {/* ── Top bar fixa ── */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-[#0c0b18]/95 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center justify-between px-4 h-14">
          <Image src="/logo-branca.png" alt="Nauta Contabilidade" width={140} height={42} className="h-9 w-auto object-contain" priority />
          <a href={wa('Olá! Vim pelo site da Nauta e gostaria de falar com um especialista.')}
            className="flex items-center gap-1.5 bg-[#0BBCD4] text-white text-xs font-bold px-3 py-2 rounded-full">
            <MessageCircle size={14} /> WhatsApp
          </a>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="px-5 pt-24 pb-12">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-6 h-px bg-[#0BBCD4]" />
          <span className="text-[#0BBCD4] text-[11px] font-bold uppercase tracking-widest">Desde 2013 · 100% Digital</span>
        </div>
        <h1 className="text-[2rem] leading-[1.15] font-black mb-4">
          Contabilidade digital para o seu negócio <span className="text-[#0BBCD4]">focar no que importa</span>
        </h1>
        <p className="text-gray-400 text-base leading-relaxed mb-7">
          Atendimento consultivo e personalizado, 100% online, para empresas de todos os portes em qualquer lugar do Brasil.
        </p>

        <div className="flex flex-col gap-2.5">
          {HERO_CTAS.map((label, i) => (
            <a key={label}
              href={wa(`Olá! Tenho interesse em: ${label}. Pode me ajudar?`)}
              className={`flex items-center justify-between gap-2 px-5 py-3.5 rounded-xl font-bold text-sm transition-colors ${
                i === 0
                  ? 'bg-[#0BBCD4] text-white'
                  : 'border border-white/15 text-white bg-white/5'
              }`}>
              {label}
              <ArrowRight size={16} />
            </a>
          ))}
        </div>

        {/* Stats */}
        <div className="flex flex-wrap gap-x-8 gap-y-5 mt-10 pt-8 border-t border-white/10">
          {[
            { v: '+10', l: 'anos de experiência' },
            { v: '+400', l: 'prestações eleitorais' },
            { v: '100%', l: 'digital e online' },
          ].map(s => (
            <div key={s.l} className="flex flex-col">
              <span className="text-3xl font-black text-[#0BBCD4] leading-none">{s.v}</span>
              <span className="text-gray-500 text-xs mt-1">{s.l}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Serviços ── */}
      <section className="px-5 py-12 bg-[#0c0b18]">
        <Reveal>
          <div className="w-10 h-1 bg-[#0BBCD4] rounded-full mb-4" />
          <h2 className="text-2xl font-black mb-1">Nossos serviços</h2>
          <p className="text-gray-500 text-sm mb-7">Tudo que sua empresa precisa em um só lugar.</p>
        </Reveal>
        <div className="space-y-3">
          {SERVICES.map((s, i) => (
            <Reveal key={s.title} delay={i * 50}>
              <a href={wa(`Olá! Quero saber mais sobre o serviço de ${s.title}.`)}
                className="flex items-start gap-3 p-4 rounded-2xl border transition-colors"
                style={{
                  background: s.highlight ? 'rgba(11,188,212,0.08)' : 'rgba(255,255,255,0.03)',
                  borderColor: s.highlight ? 'rgba(11,188,212,0.35)' : 'rgba(255,255,255,0.08)',
                }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(11,188,212,0.12)' }}>
                  <s.icon size={18} className="text-[#0BBCD4]" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm">{s.title}</h3>
                    {s.highlight && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full text-[#0BBCD4]" style={{ background: 'rgba(11,188,212,0.15)' }}>Especialidade</span>}
                  </div>
                  <p className="text-gray-500 text-xs mt-0.5 leading-snug">{s.desc}</p>
                </div>
              </a>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Quem atendemos ── */}
      <section className="px-5 py-12">
        <Reveal>
          <div className="w-10 h-1 bg-[#0BBCD4] rounded-full mb-4" />
          <h2 className="text-2xl font-black mb-2">Atendemos qualquer empresa, em qualquer lugar do Brasil</h2>
          <p className="text-gray-400 text-sm mb-6 leading-relaxed">
            Seja um MEI que quer crescer, um profissional liberal ou uma empresa consolidada — a Nauta está pronta.
          </p>
        </Reveal>
        <div className="grid grid-cols-3 gap-2 mb-6">
          {REGIMES.map(r => (
            <Reveal key={r.label} className="rounded-xl px-3 py-3 text-center" >
              <div className="rounded-xl px-2 py-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <p className="font-bold text-xs mb-0.5" style={{ color: r.color }}>{r.label}</p>
                <p className="text-[10px] text-gray-500 leading-tight">{r.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {SEGMENTS.map((seg, i) => (
            <Reveal key={seg.label} delay={i * 40}>
              <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <seg.icon size={16} className="text-[#0BBCD4] shrink-0" />
                <span className="text-xs text-gray-300">{seg.label}</span>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Diferenciais ── */}
      <section className="px-5 py-12 bg-[#0c0b18]">
        <Reveal>
          <div className="w-10 h-1 bg-[#0BBCD4] rounded-full mb-4" />
          <h2 className="text-2xl font-black mb-7">Por que escolher a Nauta?</h2>
        </Reveal>
        <div className="space-y-3">
          {DIFFERENTIALS.map((d, i) => (
            <Reveal key={d.title} delay={i * 50}>
              <div className="flex items-start gap-3 p-4 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(11,188,212,0.12)' }}>
                  <d.icon size={18} className="text-[#0BBCD4]" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">{d.title}</h3>
                  <p className="text-gray-500 text-xs mt-0.5 leading-snug">{d.desc}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── CTA final ── */}
      <section className="px-5 py-14 text-center">
        <Reveal>
          <h2 className="text-2xl font-black mb-3">Vamos cuidar da sua contabilidade?</h2>
          <p className="text-gray-400 text-sm mb-7 leading-relaxed">
            Fale agora com um especialista pelo WhatsApp e receba uma proposta sem compromisso.
          </p>
          <a href={wa('Olá! Gostaria de uma proposta para minha empresa.')}
            className="inline-flex items-center justify-center gap-2 w-full bg-[#0BBCD4] text-white font-bold py-4 rounded-xl text-base">
            <MessageCircle size={18} /> Falar no WhatsApp
          </a>
        </Reveal>
      </section>

      {/* ── Footer simples ── */}
      <footer className="px-5 py-8 border-t border-white/10 text-center">
        <Image src="/logo-branca.png" alt="Nauta Contabilidade" width={120} height={36} className="h-8 w-auto object-contain mx-auto mb-3 opacity-80" />
        <p className="text-gray-600 text-xs leading-relaxed">
          Nauta Contabilidade · Imbituba/SC<br />
          Atendimento 100% digital para todo o Brasil
        </p>
        <p className="text-gray-700 text-[10px] mt-3">© {new Date().getFullYear()} Nauta Contabilidade</p>
      </footer>

      {/* ── Botão WhatsApp flutuante (acompanha o scroll) ── */}
      <a
        href={wa('Olá! Vim pelo site da Nauta e gostaria de falar com um especialista.')}
        aria-label="Falar no WhatsApp"
        className="fixed bottom-5 right-5 z-50 w-14 h-14 rounded-full bg-[#25D366] flex items-center justify-center shadow-lg shadow-black/40 active:scale-95 transition-transform"
      >
        <svg viewBox="0 0 24 24" className="w-7 h-7 fill-white" aria-hidden="true">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
        </svg>
      </a>
    </div>
  )
}

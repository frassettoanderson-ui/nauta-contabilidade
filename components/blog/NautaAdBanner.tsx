import Link from 'next/link'
import Image from 'next/image'
import { Check } from 'lucide-react'

const BENEFITS = ['Contabilidade 100% digital', 'Suporte de especialistas', 'Empresa 100% regularizada']

/** Banner fixo de propaganda da Nauta — inserido 1x no meio de cada artigo. */
export default function NautaAdBanner() {
  return (
    <div
      className="my-12 rounded-2xl overflow-hidden grid md:grid-cols-[1.3fr_1fr]"
      style={{
        background: 'linear-gradient(120deg, #0b1120 0%, #12203a 100%)',
        border: '1px solid rgba(11,188,212,0.25)',
      }}
    >
      {/* Texto + CTA */}
      <div className="p-7 sm:p-9 flex flex-col justify-center">
        <h3 className="text-white font-black text-2xl sm:text-3xl leading-tight mb-5" style={{ letterSpacing: '-0.02em' }}>
          A <span className="text-[#0BBCD4]">Nauta</span> abre a<br className="hidden sm:block" /> sua empresa
        </h3>
        <ul className="space-y-2.5 mb-7">
          {BENEFITS.map(b => (
            <li key={b} className="flex items-center gap-2.5 text-gray-200 text-sm font-medium">
              <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: 'rgba(11,188,212,0.15)' }}>
                <Check size={12} className="text-[#0BBCD4]" />
              </span>
              {b}
            </li>
          ))}
        </ul>
        <Link
          href="/servicos/legalizacao-societario"
          className="inline-flex items-center justify-center gap-2 px-6 py-3.5 font-bold text-white text-sm rounded-xl transition-all hover:-translate-y-0.5 w-full sm:w-auto"
          style={{ background: '#0BBCD4', boxShadow: '0 8px 24px rgba(11,188,212,0.25)' }}
        >
          Abrir minha empresa
        </Link>
      </div>

      {/* Imagem */}
      <div className="relative min-h-[180px] hidden md:block">
        <Image src="/blog-imgs/como-trocar-de-contador.jpg" alt="" fill sizes="40vw" className="object-cover" />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, #0b1120 0%, transparent 40%)' }} />
      </div>
    </div>
  )
}

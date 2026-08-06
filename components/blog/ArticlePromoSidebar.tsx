import Link from 'next/link'
import Image from 'next/image'

type Card = { titulo: string; desc: string; cta: string; href: string; img: string }

const C = {
  fatorR:   { titulo: 'Calculadora Fator R', desc: 'Descubra se sua empresa se enquadra no Anexo III e paga menos.', cta: 'Calcular grátis', href: '/ferramentas/calculadora-fator-r', img: '/blog-imgs/fator-r-simples-nacional.jpg' },
  regime:   { titulo: 'Qual o melhor regime?', desc: 'Compare Simples, Presumido e Real e veja onde paga menos imposto.', cta: 'Simular agora', href: '/ferramentas/simulador-regime-tributario', img: '/blog-imgs/simples-presumido-ou-real.jpg' },
  liquido:  { titulo: 'Calculadora CLT x PJ', desc: 'Compare o salário líquido e descubra o que compensa mais.', cta: 'Comparar', href: '/ferramentas/calculadora-salario-liquido', img: '/blog-imgs/clt-ou-pj.jpg' },
  rescisao: { titulo: 'Simulador de Rescisão', desc: 'Calcule as verbas rescisórias em segundos, sem cadastro.', cta: 'Calcular', href: '/ferramentas/simulador-rescisao', img: '/blog-imgs/como-calcular-rescisao.jpg' },
  abrir:    { titulo: 'Quer abrir a sua empresa?', desc: 'A Nauta abre seu CNPJ e cuida de tudo, 100% digital.', cta: 'Fale conosco', href: '/servicos/legalizacao-societario', img: '/blog-imgs/como-abrir-empresa-cnpj.jpg' },
  bpo:      { titulo: 'BPO Financeiro', desc: 'Terceirize contas a pagar, receber e fluxo de caixa com a Nauta.', cta: 'Saiba mais', href: '/servicos/bpo-financeiro', img: '/blog-imgs/o-que-e-bpo-financeiro.jpg' },
  eleitoral:{ titulo: 'Contabilidade Eleitoral', desc: 'Prestação de contas ao TSE com quem tem +400 aprovações.', cta: 'Falar com especialista', href: '/servicos/contabilidade-eleitoral', img: '/blog-imgs/contabilidade-eleitoral-guia.jpg' },
  contato:  { titulo: 'Fale com a Nauta', desc: 'Tire suas dúvidas com um contador especialista, sem compromisso.', cta: 'Falar agora', href: '/contato', img: '/blog-imgs/como-trocar-de-contador.jpg' },
} satisfies Record<string, Card>

const POR_CATEGORIA: Record<string, Card[]> = {
  'simples-e-mei':            [C.regime, C.abrir],
  'tributacao':               [C.fatorR, C.regime],
  'abertura-de-empresa':      [C.abrir, C.regime],
  'clt-x-pj':                 [C.liquido, C.rescisao],
  'rh-e-folha':               [C.rescisao, C.liquido],
  'gestao-financeira':        [C.bpo, C.contato],
  'empreendedorismo':         [C.abrir, C.contato],
  'contabilidade-eleitoral':  [C.eleitoral, C.contato],
}

export default function ArticlePromoSidebar({ categoriaSlug }: { categoriaSlug?: string | null }) {
  const cards = (categoriaSlug && POR_CATEGORIA[categoriaSlug]) || [C.abrir, C.contato]
  return (
    <div>
      <h3 className="text-white font-black text-sm uppercase tracking-wide mb-4">
        Materiais para facilitar sua rotina<span className="text-[#0BBCD4]">.</span>
      </h3>
      <div className="space-y-5">
        {cards.map(({ titulo, desc, cta, href, img }) => (
          <Link key={titulo} href={href}
            className="group block rounded-2xl overflow-hidden transition-all hover:-translate-y-0.5"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.09)' }}>
            <div className="relative aspect-[16/10] overflow-hidden bg-[#0d1b2e]">
              <Image src={img} alt={titulo} fill sizes="300px" className="object-cover group-hover:scale-[1.04] transition-transform duration-500" />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(13,27,46,0.6), transparent 60%)' }} />
            </div>
            <div className="p-5">
              <h4 className="text-white font-bold text-base leading-snug mb-1.5">{titulo}</h4>
              <p className="text-gray-400 text-sm leading-relaxed mb-4">{desc}</p>
              <span className="inline-flex items-center gap-1 text-sm font-bold text-[#0BBCD4] group-hover:gap-2 transition-all">
                {cta} →
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

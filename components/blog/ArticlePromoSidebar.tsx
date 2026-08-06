import Link from 'next/link'
import { Calculator, Scale, Building2, Wallet, Landmark, MessageCircle } from 'lucide-react'

type Card = { titulo: string; desc: string; cta: string; href: string; Icon: typeof Calculator }

const C = {
  fatorR:   { titulo: 'Calculadora Fator R', desc: 'Descubra se sua empresa se enquadra no Anexo III e paga menos.', cta: 'Calcular grátis', href: '/ferramentas/calculadora-fator-r', Icon: Calculator },
  regime:   { titulo: 'Qual o melhor regime?', desc: 'Compare Simples, Presumido e Real e veja onde paga menos imposto.', cta: 'Simular agora', href: '/ferramentas/simulador-regime-tributario', Icon: Scale },
  liquido:  { titulo: 'Calculadora CLT x PJ', desc: 'Compare o salário líquido e descubra o que compensa mais.', cta: 'Comparar', href: '/ferramentas/calculadora-salario-liquido', Icon: Wallet },
  rescisao: { titulo: 'Simulador de Rescisão', desc: 'Calcule as verbas rescisórias em segundos, sem cadastro.', cta: 'Calcular', href: '/ferramentas/simulador-rescisao', Icon: Calculator },
  abrir:    { titulo: 'Quer abrir a sua empresa?', desc: 'A Nauta abre seu CNPJ e cuida de tudo, 100% digital.', cta: 'Fale conosco', href: '/servicos/legalizacao-societario', Icon: Building2 },
  bpo:      { titulo: 'BPO Financeiro', desc: 'Terceirize contas a pagar, receber e fluxo de caixa com a Nauta.', cta: 'Saiba mais', href: '/servicos/bpo-financeiro', Icon: Wallet },
  eleitoral:{ titulo: 'Contabilidade Eleitoral', desc: 'Prestação de contas ao TSE com quem tem +400 aprovações.', cta: 'Falar com especialista', href: '/servicos/contabilidade-eleitoral', Icon: Landmark },
  contato:  { titulo: 'Fale com a Nauta', desc: 'Tire suas dúvidas com um contador especialista, sem compromisso.', cta: 'Falar agora', href: '/contato', Icon: MessageCircle },
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
      <div className="space-y-4">
        {cards.map(({ titulo, desc, cta, href, Icon }) => (
          <Link key={titulo} href={href}
            className="group block rounded-2xl p-5 transition-all hover:-translate-y-0.5"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.09)' }}>
            <span className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
              style={{ background: 'rgba(11,188,212,0.12)', border: '1px solid rgba(11,188,212,0.22)' }}>
              <Icon size={18} className="text-[#0BBCD4]" />
            </span>
            <h4 className="text-white font-bold text-base leading-snug mb-1.5">{titulo}</h4>
            <p className="text-gray-400 text-sm leading-relaxed mb-4">{desc}</p>
            <span className="inline-flex items-center gap-1 text-sm font-bold text-[#0BBCD4] group-hover:gap-2 transition-all">
              {cta} →
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}

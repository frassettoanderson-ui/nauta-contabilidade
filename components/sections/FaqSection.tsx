'use client'

import { useRef, useState } from 'react'
import { useScrollAnimation } from '@/hooks/useScrollAnimation'
import { ChevronDown } from 'lucide-react'
import { MouseSpotlight, FloatingDots } from '@/components/ui/section-fx'

const faqs = [
  {
    q: 'Como funciona a troca de contador?',
    a: 'É simples e sem burocracia. Nossa equipe cuida de todo o processo de migração: solicitamos as documentações do contador anterior, fazemos a transferência dos arquivos contábeis e garantimos que nada fique pendente. Você não precisa se preocupar com nada.',
  },
  {
    q: 'Quanto custa a contabilidade na Nauta?',
    a: 'O valor varia de acordo com o regime tributário, o porte da empresa e os serviços contratados. Fazemos uma análise gratuita do seu negócio e apresentamos uma proposta personalizada. Entre em contato e solicite um orçamento sem compromisso.',
  },
  {
    q: 'Vocês atendem empresas fora de Santa Catarina?',
    a: 'Sim! Atendemos empresas em todo o Brasil. Nosso atendimento é 100% digital, por isso a localização não é uma barreira. Clientes de Norte a Sul do país são atendidos com a mesma qualidade.',
  },
  {
    q: 'O que é BPO Financeiro e como funciona?',
    a: 'BPO Financeiro é a terceirização da gestão financeira da sua empresa. Cuidamos de contas a pagar e receber, fluxo de caixa, conciliação bancária e relatórios gerenciais. Tudo internamente, sem terceiros — garantindo segurança e sigilo total.',
  },
  {
    q: 'Vocês atendem MEI?',
    a: 'Sim! Atendemos MEI, especialmente aqueles que estão próximos do limite de faturamento e precisam migrar para outro regime. Orientamos todo o processo de forma clara e sem surpresas.',
  },
  {
    q: 'O que é contabilidade eleitoral e quando preciso dela?',
    a: 'A contabilidade eleitoral é obrigatória para todos os candidatos a cargos eletivos. Ela envolve o registro das receitas e despesas da campanha e a prestação de contas para a Justiça Eleitoral. Somos especialistas nessa área, com mais de 400 prestações aprovadas.',
  },
  {
    q: 'Como é feita a comunicação com o meu contador?',
    a: 'Utilizamos principalmente o WhatsApp para uma comunicação ágil e direta. Além disso, disponibilizamos nosso app próprio para acesso a documentos, relatórios e notificações importantes sobre sua empresa.',
  },
  {
    q: 'Posso contratar apenas um serviço específico?',
    a: 'Sim! Você pode contratar serviços avulsos como folha de pagamento, BPO financeiro ou contabilidade eleitoral, sem precisar de um pacote completo. Fale com nossa equipe para entender a melhor opção para o seu caso.',
  },
]

function FaqItem({ q, a, index }: { q: string; a: string; index: number }) {
  const [open, setOpen] = useState(false)

  return (
    <div
      className="border-b border-gray-200 last:border-0 animate-from-left"
      style={{ transitionDelay: `${index * 50}ms` }}
    >
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-6 py-5 text-left group"
        aria-expanded={open}
      >
        <span className={`text-base font-semibold transition-colors duration-200 ${
          open ? 'text-[#0BBCD4]' : 'text-[#0f0e1a] group-hover:text-[#3D3B8E]'
        }`}>
          {q}
        </span>
        <ChevronDown
          size={18}
          className={`shrink-0 transition-all duration-300 ${
            open ? 'rotate-180 text-[#0BBCD4]' : 'text-gray-400 group-hover:text-[#3D3B8E]'
          }`}
        />
      </button>

      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
        open ? 'max-h-48 opacity-100 pb-5' : 'max-h-0 opacity-0'
      }`}>
        <p className="text-gray-500 text-sm leading-relaxed">{a}</p>
      </div>
    </div>
  )
}

export default function FaqSection() {
  const ref        = useScrollAnimation()
  const sectionRef = useRef<HTMLElement>(null)

  return (
    <section id="faq" ref={sectionRef} className="py-24 bg-white relative overflow-hidden" aria-labelledby="faq-heading">
      <MouseSpotlight containerRef={sectionRef} />
      <FloatingDots   containerRef={sectionRef} />
      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8" ref={ref}>

        {/* Título centralizado */}
        <div className="text-center mb-12 animate-fade">
          <h2 id="faq-heading" className="text-4xl sm:text-5xl font-black text-[#0f0e1a]">
            Perguntas frequentes<span className="text-[#0BBCD4]">.</span>
          </h2>
          <p className="text-gray-500 mt-3">
            Não encontrou o que procura?{' '}
            <a
              href="https://wa.me/554899245194"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#0BBCD4] font-semibold hover:underline"
            >
              Fale com a gente pelo WhatsApp
            </a>
          </p>
        </div>

        {/* Lista de perguntas */}
        <div className="animate-on-scroll delay-100">
          {faqs.map((faq, i) => (
            <FaqItem key={faq.q} q={faq.q} a={faq.a} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}

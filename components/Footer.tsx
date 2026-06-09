import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Phone, Mail, Clock, Instagram, Facebook, Linkedin } from 'lucide-react'

const services = [
  { label: 'Contábil',                href: '/servicos/contabil' },
  { label: 'Fiscal',                  href: '/servicos/fiscal' },
  { label: 'Folha de Pagamento',      href: '/servicos/folha-de-pagamento' },
  { label: 'BPO Financeiro',          href: '/servicos/bpo-financeiro' },
  { label: 'Planejamento Tributário', href: '/servicos/planejamento-tributario' },
  { label: 'Contabilidade Eleitoral', href: '/servicos/contabilidade-eleitoral' },
]
const tools    = [
  { label: 'Calculadora Fator R',           href: '/ferramentas/calculadora-fator-r' },
  { label: 'Simulador Regime Tributário',   href: '/ferramentas/simulador-regime-tributario' },
  { label: 'Calculadora Salário Líquido',   href: '/ferramentas/calculadora-salario-liquido' },
  { label: 'Simulador Rescisão',            href: '/ferramentas/simulador-rescisao' },
]

export default function Footer() {
  return (
    <footer className="bg-[#080714] text-gray-400 border-t border-white/5" aria-label="Rodapé">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Marca */}
          <div>
            <Link href="/" className="inline-block mb-5" aria-label="Nauta Contabilidade">
              <Image src="/logo-branca.png" alt="Nauta Contabilidade"
                width={160} height={48} className="h-10 w-auto object-contain" />
            </Link>
            <p className="text-sm leading-relaxed mb-6 text-gray-500">
              Contabilidade digital e consultiva para todo o Brasil. Desde 2013 ajudando negócios a crescerem com segurança.
            </p>
            <div className="flex gap-2">
              {[
                { href: '#', icon: Instagram, label: 'Instagram' },
                { href: '#', icon: Facebook,  label: 'Facebook' },
                { href: '#', icon: Linkedin,  label: 'LinkedIn' },
              ].map(({ href, icon: Icon, label }) => (
                <a key={label} href={href} aria-label={label}
                  className="w-9 h-9 border border-white/10 hover:border-[#0BBCD4] hover:text-[#0BBCD4] rounded flex items-center justify-center transition-colors">
                  <Icon size={15} aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>

          {/* Serviços */}
          <div>
            <h3 className="text-white font-bold mb-5 text-sm uppercase tracking-wider">Serviços</h3>
            <ul className="space-y-2.5">
              {services.map(s => (
                <li key={s.href}>
                  <Link href={s.href} className="text-sm hover:text-[#0BBCD4] transition-colors">{s.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Ferramentas */}
          <div>
            <h3 className="text-white font-bold mb-5 text-sm uppercase tracking-wider">Ferramentas</h3>
            <ul className="space-y-2.5">
              {tools.map(t => (
                <li key={t.href}>
                  <Link href={t.href} className="text-sm hover:text-[#0BBCD4] transition-colors">{t.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contato */}
          <div>
            <h3 className="text-white font-bold mb-5 text-sm uppercase tracking-wider">Contato</h3>
            <address className="not-italic space-y-3">
              <div className="flex items-start gap-2.5 text-sm">
                <MapPin size={14} className="shrink-0 mt-0.5 text-[#0BBCD4]" aria-hidden="true" />
                <span>Av. Santa Catarina, 165, Centro<br />Imbituba, SC – CEP 88780-000</span>
              </div>
              <div className="flex items-center gap-2.5 text-sm">
                <Phone size={14} className="shrink-0 text-[#0BBCD4]" aria-hidden="true" />
                <a href="tel:+5548998211604" className="hover:text-[#0BBCD4] transition-colors">(48) 99924-5194</a>
              </div>
              <div className="flex items-center gap-2.5 text-sm">
                <Mail size={14} className="shrink-0 text-[#0BBCD4]" aria-hidden="true" />
                <a href="mailto:contato@nautacontabilidade.com.br" className="hover:text-[#0BBCD4] transition-colors break-all text-xs">
                  contato@nautacontabilidade.com.br
                </a>
              </div>
              <div className="flex items-center gap-2.5 text-sm">
                <Clock size={14} className="shrink-0 text-[#0BBCD4]" aria-hidden="true" />
                <span>Seg–Sex: 08h às 18h</span>
              </div>
            </address>

            <a href="https://wa.me/5548998211604" target="_blank" rel="noopener noreferrer"
              className="mt-5 inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white text-sm font-semibold px-4 py-2.5 rounded transition-colors">
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white" aria-hidden="true">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
              Falar no WhatsApp
            </a>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-gray-600">
            © {new Date().getFullYear()} Nauta Contabilidade. Todos os direitos reservados.
          </p>
          <div className="flex gap-4 text-xs text-gray-600">
            <Link href="/politica-de-privacidade" className="hover:text-[#0BBCD4] transition-colors">Política de Privacidade</Link>
            <Link href="/termos-de-uso"            className="hover:text-[#0BBCD4] transition-colors">Termos de Uso</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

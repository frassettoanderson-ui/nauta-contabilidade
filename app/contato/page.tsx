'use client'

import { useState, useCallback } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import LeadPopup from '@/components/LeadPopup'
import InnerHero from '@/components/ui/inner-hero'
import { MapPin, Phone, Mail, Clock, Instagram, Facebook, Linkedin, Send, ArrowRight } from 'lucide-react'
import { saveLead } from '@/lib/supabase'

type Status = 'idle' | 'loading' | 'success' | 'error'

export default function ContatoPage() {
  const [popupOpen, setPopupOpen] = useState(false)
  const [interest, setInterest] = useState<string | undefined>()
  const openLead = useCallback((i?: string) => { setInterest(i); setPopupOpen(true) }, [])

  const [form, setForm] = useState({ nome: '', email: '', whatsapp: '', mensagem: '', interesse: '' })
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const formatPhone = (v: string) => {
    const d = v.replace(/\D/g, '').slice(0, 11)
    if (d.length <= 2) return d
    if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nome || !form.email || !form.whatsapp) {
      setErrorMsg('Preencha nome, e-mail e WhatsApp para continuar.')
      return
    }
    setErrorMsg('')
    setStatus('loading')
    try {
      await saveLead({
        nome: form.nome,
        whatsapp: form.whatsapp,
        email: form.email,
        interesse: form.interesse || 'Contato pelo site',
      })
      setStatus('success')
      setForm({ nome: '', email: '', whatsapp: '', mensagem: '', interesse: '' })
    } catch {
      setStatus('error')
      setErrorMsg('Erro ao enviar. Tente pelo WhatsApp.')
    }
  }

  return (
    <>
      <Header onOpenLead={openLead} />
      <main>
        <InnerHero
          eyebrow="Fale conosco"
          title={<>Vamos <span style={{ color: '#0BBCD4' }}>conversar?</span></>}
          description="Nossa equipe responde em até 24h. Atendimento 100% digital para todo o Brasil."
          breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Contato' }]}
        />

        {/* Formulário + Info */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12">

              {/* Formulário */}
              <div className="rounded-2xl p-8" style={{ background: 'rgba(248,250,252,1)', border: '1px solid rgba(226,232,240,1)' }}>
                <h2 className="text-2xl font-black text-[#0f0e1a] mb-2" style={{ letterSpacing: '-0.02em' }}>Envie uma mensagem</h2>
                <p className="text-gray-500 mb-8 text-sm">Nossa equipe responde em até 24 horas úteis.</p>

                {status === 'success' ? (
                  <div className="p-6 rounded-2xl text-center" style={{ background: 'rgba(11,188,212,0.05)', border: '1px solid rgba(11,188,212,0.2)' }}>
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 mx-auto" style={{ background: 'rgba(11,188,212,0.1)' }}>
                      <Send size={24} className="text-[#0BBCD4]" />
                    </div>
                    <h3 className="font-bold text-[#0f0e1a] mb-2">Mensagem enviada!</h3>
                    <p className="text-gray-500 text-sm mb-4">Entraremos em contato em breve. Ou fale pelo WhatsApp:</p>
                    <a href="https://wa.me/554899245194" target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded text-sm transition-colors">
                      <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                      Falar no WhatsApp
                    </a>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} noValidate className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Nome completo <span className="text-red-500">*</span></label>
                        <input name="nome" type="text" value={form.nome} onChange={handleChange} placeholder="Seu nome"
                          className="w-full h-12 px-4 text-sm border border-gray-200 rounded-xl focus:border-[#0BBCD4] focus:outline-none focus:ring-2 focus:ring-[#0BBCD4]/10 transition-all text-gray-900 bg-white" required />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">WhatsApp <span className="text-red-500">*</span></label>
                        <input name="whatsapp" type="tel" value={form.whatsapp}
                          onChange={e => setForm(f => ({ ...f, whatsapp: formatPhone(e.target.value) }))}
                          placeholder="(00) 00000-0000"
                          className="w-full h-12 px-4 text-sm border border-gray-200 rounded-xl focus:border-[#0BBCD4] focus:outline-none focus:ring-2 focus:ring-[#0BBCD4]/10 transition-all text-gray-900 bg-white" required />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">E-mail <span className="text-red-500">*</span></label>
                      <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="seu@email.com"
                        className="w-full h-12 px-4 text-sm border border-gray-200 rounded-xl focus:border-[#0BBCD4] focus:outline-none focus:ring-2 focus:ring-[#0BBCD4]/10 transition-all text-gray-900 bg-white" required />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Assunto</label>
                      <select name="interesse" value={form.interesse} onChange={handleChange}
                        className="w-full h-12 px-4 text-sm border border-gray-200 rounded-xl focus:border-[#0BBCD4] focus:outline-none focus:ring-2 focus:ring-[#0BBCD4]/10 transition-all text-gray-900 bg-white cursor-pointer">
                        <option value="">Selecione um assunto</option>
                        <option>Trocar de contador</option>
                        <option>Abrir minha empresa</option>
                        <option>BPO Financeiro</option>
                        <option>Contabilidade Eleitoral</option>
                        <option>Planejamento Tributário</option>
                        <option>Dúvida geral</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Mensagem</label>
                      <textarea name="mensagem" value={form.mensagem} onChange={handleChange} rows={4} placeholder="Conte um pouco sobre sua empresa e o que você precisa..."
                        className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:border-[#0BBCD4] focus:outline-none focus:ring-2 focus:ring-[#0BBCD4]/10 transition-all text-gray-900 bg-white resize-none" />
                    </div>

                    {errorMsg && (
                      <p className="text-red-600 text-sm px-1" role="alert">{errorMsg}</p>
                    )}

                    <button type="submit" disabled={status === 'loading'}
                      className="w-full flex items-center justify-center gap-2 py-4 text-white font-bold rounded-xl transition-all hover:-translate-y-px disabled:opacity-60 text-sm"
                      style={{ background: 'linear-gradient(135deg, #0BBCD4, #0999ae)', boxShadow: '0 8px 24px rgba(11,188,212,0.3)' }}>
                      {status === 'loading' ? 'Enviando...' : <><Send size={15} /> Enviar mensagem</>}
                    </button>
                  </form>
                )}
              </div>

              {/* Informações de contato */}
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-black text-[#0f0e1a] mb-2" style={{ letterSpacing: '-0.02em' }}>Informações</h2>
                  <p className="text-gray-500 text-sm mb-6">Estamos disponíveis de segunda a sexta, das 8h às 18h.</p>

                  <div className="space-y-4">
                    {[
                      { icon: MapPin, label: 'Endereço', value: 'Av. Santa Catarina, 165, Centro\nImbituba, SC – CEP 88780-000' },
                      { icon: Phone, label: 'Telefone / WhatsApp', value: '(48) 99924-5194', href: 'tel:+554899245194' },
                      { icon: Mail, label: 'E-mail', value: 'contato@nautacontabilidade.com.br', href: 'mailto:contato@nautacontabilidade.com.br' },
                      { icon: Clock, label: 'Horário de atendimento', value: 'Segunda a Sexta: 08h às 18h' },
                    ].map(item => (
                      <div key={item.label} className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 hover:border-[#0BBCD4]/20 transition-colors">
                        <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center shrink-0">
                          <item.icon size={18} className="text-[#0BBCD4]" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-0.5">{item.label}</p>
                          {item.href ? (
                            <a href={item.href} className="text-sm text-gray-700 hover:text-[#0BBCD4] transition-colors font-medium">{item.value}</a>
                          ) : (
                            <p className="text-sm text-gray-700 font-medium whitespace-pre-line">{item.value}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Redes sociais */}
                <div>
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Redes sociais</h3>
                  <div className="flex gap-3">
                    {[
                      { icon: Instagram, label: 'Instagram', href: 'https://www.instagram.com/nautacontabilidade' },
                      { icon: Facebook, label: 'Facebook', href: 'https://www.facebook.com/nautacontabilidade' },
                      { icon: Linkedin, label: 'LinkedIn', href: 'https://www.linkedin.com/company/nautacontabilidade' },
                    ].map(s => (
                      <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label}
                        className="w-11 h-11 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 hover:border-[#0BBCD4] hover:text-[#0BBCD4] transition-colors">
                        <s.icon size={18} />
                      </a>
                    ))}
                  </div>
                </div>

                {/* WhatsApp CTA */}
                <a href="https://wa.me/554899245194" target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 p-5 rounded-2xl transition-all hover:-translate-y-px"
                  style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.08), rgba(34,197,94,0.04))', border: '1px solid rgba(34,197,94,0.2)' }}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(34,197,94,0.1)' }}>
                    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="#22c55e" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                  </div>
                  <div>
                    <p className="font-bold text-gray-800 text-sm">WhatsApp</p>
                    <p className="text-gray-500 text-xs">Prefere falar agora? Clique aqui.</p>
                  </div>
                  <ArrowRight size={16} className="text-green-600 ml-auto" />
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Mapa */}
        <section className="bg-gray-100">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3534.9281069375!2d-48.674044684896!3d-28.234164982590!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x95214f6b8ab67e03%3A0x5d4e7c1230c3f7e1!2sAv.%20Santa%20Catarina%2C%20165%20-%20Centro%2C%20Imbituba%20-%20SC!5e0!3m2!1spt-BR!2sbr!4v1700000000000"
            width="100%"
            height="420"
            style={{ border: 0, display: 'block' }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Localização Nauta Contabilidade — Imbituba, SC"
          />
        </section>
      </main>
      <Footer />
      <LeadPopup isOpen={popupOpen} onClose={() => setPopupOpen(false)} interest={interest} />
    </>
  )
}

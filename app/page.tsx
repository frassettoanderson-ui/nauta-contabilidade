'use client'

import { useState, useEffect, useCallback } from 'react'
import Header            from '@/components/Header'
import LeadPopup         from '@/components/LeadPopup'
import HeroSection       from '@/components/sections/HeroSection'
import CredentialsBar    from '@/components/sections/CredentialsBar'
import PainSection       from '@/components/sections/PainSection'
import HowItWorksSection from '@/components/sections/HowItWorksSection'
import ServicesSection   from '@/components/sections/ServicesSection'
import WhoWeServeSection from '@/components/sections/WhoWeServeSection'
import DifferentialsSection from '@/components/sections/DifferentialsSection'
import AppSection        from '@/components/sections/AppSection'
import ToolsSection      from '@/components/sections/ToolsSection'
import BlogSection       from '@/components/sections/BlogSection'
import ReviewsSection    from '@/components/sections/ReviewsSection'
import FaqSection        from '@/components/sections/FaqSection'
import FinalCTASection   from '@/components/sections/FinalCTASection'
import Footer            from '@/components/Footer'
import FloatingChat      from '@/components/FloatingChat'
import MobileHome        from '@/components/mobile/MobileHome'

const FIRST_DELAY  = 8_000        // 8s para a primeira exibição
const REPEAT_DELAY = 5 * 60_000   // 5 min entre as repetições

export default function HomePage() {
  const [popupOpen,     setPopupOpen]     = useState(false)
  const [popupInterest, setPopupInterest] = useState<string | undefined>()

  const openPopup = useCallback((interest?: string) => {
    setPopupInterest(interest)
    setPopupOpen(true)
  }, [])

  const closePopup = useCallback(() => {
    setPopupOpen(false)
  }, [])

  /**
   * Popup automático recorrente:
   * - Aparece pela 1ª vez após 8 segundos
   * - Reaparece a cada 5 minutos enquanto o usuário estiver na página
   * - Não abre se o popup já estiver aberto
   */
  useEffect(() => {
    // Não roda o popup automático no mobile (lá usamos a MobileHome com WhatsApp)
    if (typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches) {
      return
    }

    let interval: ReturnType<typeof setInterval>

    // Primeira exibição após 8s
    const firstTimer = setTimeout(() => {
      openPopup()

      // A partir daí, repete a cada 5 min
      interval = setInterval(() => {
        // Só abre se não estiver já aberto (evita interromper quem está preenchendo)
        setPopupOpen(current => {
          if (!current) openPopup()
          return current
        })
      }, REPEAT_DELAY)
    }, FIRST_DELAY)

    return () => {
      clearTimeout(firstTimer)
      clearInterval(interval)
    }
  }, [openPopup])

  return (
    <>
      {/* ── Versão mobile (somente em telas pequenas) ── */}
      <div className="md:hidden">
        <MobileHome />
      </div>

      {/* ── Versão completa (tablet/desktop) ── */}
      <div className="hidden md:block">
        <Header onOpenLead={() => openPopup()} />

        <main>
          <HeroSection          onOpenLead={openPopup} />
          <PainSection          onOpenLead={() => openPopup()} />
          <HowItWorksSection />
          <ServicesSection      onOpenLead={openPopup} />
          <WhoWeServeSection    onOpenLead={() => openPopup()} />
          <DifferentialsSection onOpenLead={openPopup} />
          <AppSection />
          <ToolsSection />
          <BlogSection />
          <ReviewsSection />
          <FaqSection />
          <FinalCTASection      onOpenLead={() => openPopup()} />
        </main>

        <Footer />

        <LeadPopup
          isOpen={popupOpen}
          onClose={closePopup}
          interest={popupInterest}
        />

        <FloatingChat />
      </div>
    </>
  )
}

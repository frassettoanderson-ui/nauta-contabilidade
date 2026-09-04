'use client'

// Dashboard do sistema = o mesmo painel de resultados usado na TV (/tv).
// O painel roda em /painel-tv.html; aqui ele é embutido e a API libera pelo login (sem token).
export default function DashboardPage() {
  return (
    <div className="h-[calc(100vh-3.5rem)] lg:h-screen" style={{ background: '#070B24' }}>
      <iframe
        src="/painel-tv.html"
        title="Painel de resultados"
        className="block w-full h-full border-0"
      />
    </div>
  )
}

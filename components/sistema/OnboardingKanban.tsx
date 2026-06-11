'use client'

const ETAPAS = ['Etapa 1', 'Etapa 2', 'Etapa 3', 'Etapa 4']

export default function OnboardingKanban({ titulo }: { titulo: string }) {
  return (
    <div className="p-6 lg:p-8">
      <h1 className="text-2xl font-black text-white mb-1" style={{ letterSpacing: '-0.02em' }}>{titulo}</h1>
      <p className="text-gray-500 text-sm mb-6">Onboarding · acompanhamento por etapas</p>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {ETAPAS.map((etapa, i) => (
          <div key={etapa} className="rounded-2xl p-4 min-h-[60vh]"
            style={{ background: 'var(--sys-surface)', border: '1px solid var(--sys-border)' }}>
            <div className="flex items-center justify-between mb-4 px-1">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold text-white"
                  style={{ background: 'linear-gradient(135deg, #0BBCD4, #0999ae)' }}>{i + 1}</span>
                <h2 className="text-sm font-bold text-gray-200">{etapa}</h2>
              </div>
              <span className="text-[11px] text-gray-600 font-bold">0</span>
            </div>
            <p className="text-gray-600 text-xs text-center py-8">Nenhum cliente nesta etapa.</p>
          </div>
        ))}
      </div>
    </div>
  )
}

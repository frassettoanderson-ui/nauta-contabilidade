'use client'

import { useEffect, useState } from 'react'
import { Settings, Sun, Moon, Volume2, VolumeX } from 'lucide-react'
import { getTema, setTema, getSomAtivo, setSomAtivo, type Tema } from '@/lib/sys-prefs'

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!on)} role="switch" aria-checked={on}
      className="relative w-12 h-7 rounded-full transition-colors shrink-0"
      style={{ background: on ? '#0BBCD4' : 'var(--sys-border-2)' }}>
      <span className="absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white transition-transform"
        style={{ transform: on ? 'translateX(20px)' : 'translateX(0)' }} />
    </button>
  )
}

export default function ConfiguracoesPage() {
  const [tema, setTemaUI] = useState<Tema>('dark')
  const [som, setSomUI] = useState(true)

  useEffect(() => { setTemaUI(getTema()); setSomUI(getSomAtivo()) }, [])

  function trocarTema(claro: boolean) {
    const t: Tema = claro ? 'light' : 'dark'
    setTemaUI(t); setTema(t)
  }
  function trocarSom(on: boolean) {
    setSomUI(on); setSomAtivo(on)
  }

  return (
    <div className="p-6 lg:p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white flex items-center gap-2" style={{ letterSpacing: '-0.02em' }}>
          <Settings size={22} className="text-[#0BBCD4]" /> Configurações
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">Preferências e ajustes do sistema</p>
      </div>

      <div className="space-y-3">
        {/* Tema */}
        <div className="flex items-center justify-between gap-4 rounded-2xl p-5"
          style={{ background: 'var(--sys-surface)', border: '1px solid var(--sys-border)' }}>
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--sys-surface-3)' }}>
              {tema === 'light' ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-[#0BBCD4]" />}
            </span>
            <div>
              <p className="text-sm font-bold text-white">Tema {tema === 'light' ? 'claro' : 'escuro'}</p>
              <p className="text-xs text-gray-500">Alterna a aparência do sistema entre claro e escuro</p>
            </div>
          </div>
          <Toggle on={tema === 'light'} onChange={trocarTema} />
        </div>

        {/* Sons */}
        <div className="flex items-center justify-between gap-4 rounded-2xl p-5"
          style={{ background: 'var(--sys-surface)', border: '1px solid var(--sys-border)' }}>
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--sys-surface-3)' }}>
              {som ? <Volume2 size={18} className="text-[#0BBCD4]" /> : <VolumeX size={18} className="text-gray-500" />}
            </span>
            <div>
              <p className="text-sm font-bold text-white">Sons do sistema</p>
              <p className="text-xs text-gray-500">Som de clique ao navegar pelo menu</p>
            </div>
          </div>
          <Toggle on={som} onChange={trocarSom} />
        </div>
      </div>
    </div>
  )
}

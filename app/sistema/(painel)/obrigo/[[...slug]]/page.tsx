'use client'

import dynamic from 'next/dynamic'
import { Component, type ReactNode } from 'react'
import { Loader2 } from 'lucide-react'

// Módulo Obrigô (obrigações acessórias) rodando DENTRO do sistema: mesmas telas do
// gestor-oa/web, com o menu e a barra da Nauta. As rotas internas (react-router) vivem
// em /sistema/obrigo/*; este catch-all só monta o app, que lê a URL no navegador.
//
// Se o pedaço de código do módulo não carregar (típico logo após um deploy: a página
// aberta ainda referencia o build anterior), recarrega a página uma vez em vez de
// deixar a tela em branco.
const ObrigoApp = dynamic(
  () =>
    import('@/obrigo/ObrigoApp').catch((err) => {
      const chave = 'obrigo_reload_por_chunk'
      let jaTentou = false
      try { jaTentou = sessionStorage.getItem(chave) === '1'; sessionStorage.setItem(chave, '1') } catch { /* ignora */ }
      if (!jaTentou) window.location.reload()
      throw err
    }),
  {
    ssr: false,
    loading: () => (
      <div className="grid h-full min-h-[40vh] place-items-center text-slate-400">
        <Loader2 size={24} className="animate-spin" style={{ color: '#F47920' }} />
      </div>
    ),
  },
)

// Qualquer erro de renderização do módulo vira um aviso com botão, nunca tela vazia.
class Guarda extends Component<{ children: ReactNode }, { erro: Error | null }> {
  state = { erro: null as Error | null }
  static getDerivedStateFromError(erro: Error) { return { erro } }
  render() {
    if (this.state.erro) {
      return (
        <div className="grid h-full min-h-[40vh] place-items-center">
          <div className="card max-w-md p-6 text-center text-sm text-slate-600">
            <p className="mb-3">A tela não carregou corretamente.</p>
            <button className="btn-primary" onClick={() => window.location.reload()}>Recarregar</button>
            <p className="mt-3 text-[11px] text-slate-400">{this.state.erro.message}</p>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

export default function ObrigoPage() {
  return <Guarda><ObrigoApp /></Guarda>
}

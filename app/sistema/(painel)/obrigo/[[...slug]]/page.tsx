'use client'

import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'

// Módulo Obrigô (obrigações acessórias) rodando DENTRO do sistema: mesmas telas do
// gestor-oa/web, com o menu e a barra da Nauta. As rotas internas (react-router) vivem
// em /sistema/obrigo/*; este catch-all só monta o app, que lê a URL no navegador.
const ObrigoApp = dynamic(() => import('@/obrigo/ObrigoApp'), {
  ssr: false,
  loading: () => (
    <div className="grid h-full min-h-[40vh] place-items-center text-slate-400">
      <Loader2 size={24} className="animate-spin" style={{ color: '#F47920' }} />
    </div>
  ),
})

export default function ObrigoPage() {
  return <ObrigoApp />
}

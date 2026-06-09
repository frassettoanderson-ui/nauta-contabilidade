'use client'
import EmConstrucao from '@/components/sistema/EmConstrucao'
import { FileClock } from 'lucide-react'
export default function Page() {
  return <EmConstrucao titulo="Contratos em Andamento" icon={FileClock} descricao="Acompanhamento dos contratos em processo. Em breve." />
}

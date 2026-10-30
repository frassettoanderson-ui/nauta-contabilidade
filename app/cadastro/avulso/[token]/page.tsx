'use client'

import { useParams } from 'next/navigation'
import FichaPublica from '@/components/cadastro/FichaPublica'

// Link avulso: mesma ficha do cliente novo, mas só coleta os dados (Relatórios › Links de cadastro)
export default function CadastroAvulsoPage() {
  const { token } = useParams<{ token: string }>()
  return <FichaPublica api={`/api/cadastro-avulso/${token}`} />
}

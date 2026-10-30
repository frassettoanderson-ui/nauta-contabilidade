'use client'

import { useParams } from 'next/navigation'
import FichaPublica from '@/components/cadastro/FichaPublica'

export default function CadastroPublicoPage() {
  const { token } = useParams<{ token: string }>()
  return <FichaPublica api={`/api/cadastro/${token}`} />
}

import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
import type { Empresa } from './empresas'

type SessUser = {
  id?: string
  role?: string
  empresas?: Empresa[]
  empresaId?: string | null
  empresaAtiva?: Empresa | null
}

/** ID da empresa ativa da sessão (para escopar queries). Null se não houver. */
export async function empresaAtivaId(): Promise<string | null> {
  const s = await getServerSession(authOptions)
  const u = (s?.user as SessUser | undefined)
  return u?.empresaId ?? null
}

/** Empresa ativa completa (id, slug, cor, logo…) da sessão. */
export async function empresaAtiva(): Promise<Empresa | null> {
  const s = await getServerSession(authOptions)
  const u = (s?.user as SessUser | undefined)
  return u?.empresaAtiva ?? null
}

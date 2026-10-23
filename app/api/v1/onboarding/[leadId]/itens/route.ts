import { NextRequest, NextResponse } from 'next/server'
import { comChave, erroApi } from '@/lib/api-publica'
import { onboardingDaEmpresa } from '@/lib/api-onboarding'
import { setOnboardingCheck } from '@/lib/leads'

export const dynamic = 'force-dynamic'

// Marca/desmarca um item do checklist: { "item": "atendente:acessorias", "feito": true }
// (o "item" é o código que aparece em GET /api/v1/onboarding/{leadId}). Precisa de chave com escrita.
export async function POST(req: NextRequest, { params }: { params: { leadId: string } }) {
  const a = await comChave(req, true)
  if (a instanceof NextResponse) return a
  if (!/^[0-9a-f-]{36}$/i.test(params.leadId)) return erroApi(400, 'id_invalido', 'leadId inválido.')
  const b = await req.json().catch(() => ({}))
  const item = String(b.item ?? '').trim()
  const feito = b.feito === undefined ? true : !!b.feito
  const [c] = await onboardingDaEmpresa(a.empresaId, { leadId: params.leadId })
  if (!c) return erroApi(404, 'nao_encontrado', 'Cliente não está no onboarding deste perfil.')
  if (c.onboarding.concluido) return erroApi(409, 'concluido', 'O onboarding deste cliente já foi concluído.')
  const existe = c.setores.some((s) => s.itens.some((i) => i.item === item))
  if (!existe) return erroApi(422, 'item_invalido', 'Item não existe no checklist deste cliente. Veja os códigos em GET /api/v1/onboarding/{leadId}.')
  await setOnboardingCheck(params.leadId, item, feito, `API: ${a.nome}`)
  const [depois] = await onboardingDaEmpresa(a.empresaId, { leadId: params.leadId })
  return NextResponse.json(depois)
}

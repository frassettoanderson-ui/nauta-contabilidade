import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { marcarAssinaturaManual } from '@/lib/contrato-gen'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

export const dynamic = 'force-dynamic'

const PRIV = path.join(process.cwd(), 'uploads-private')
const OK_TYPES = new Set(['image/png', 'image/jpeg', 'application/pdf'])

// Assinatura manual: anexa um comprovante (imagem/PDF) e marca o contrato como
// assinado, liberando o Onboarding. Para clientes que não conseguem assinar
// eletronicamente (assinam no papel / enviam por WhatsApp).
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const role = (session?.user as unknown as { role?: string })?.role
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  if (role !== 'admin' && role !== 'gerente') {
    return NextResponse.json({ error: 'Apenas gerente/admin podem marcar assinatura manual' }, { status: 403 })
  }

  const form = await req.formData()
  const leadId = String(form.get('leadId') || '').trim()
  const file = form.get('file') as File | null
  if (!leadId || !file) return NextResponse.json({ error: 'leadId e arquivo são obrigatórios' }, { status: 400 })
  if (!OK_TYPES.has(file.type)) return NextResponse.json({ error: 'Formato inválido — use PNG, JPG ou PDF' }, { status: 400 })
  if (file.size > 15 * 1024 * 1024) return NextResponse.json({ error: 'Arquivo muito grande (máx. 15MB)' }, { status: 400 })

  const ext = file.type === 'application/pdf' ? 'pdf' : file.type === 'image/png' ? 'png' : 'jpg'
  const stamp = Date.now()
  const filename = `assinatura-manual-${leadId}-${stamp}.${ext}`

  try {
    await mkdir(PRIV, { recursive: true })
    const buf = Buffer.from(await file.arrayBuffer())
    await writeFile(path.join(PRIV, filename), buf)
    const url = `/api/sistema/arquivo/${filename}`
    const r = await marcarAssinaturaManual(leadId, url)
    return NextResponse.json(r)
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message || 'Falha ao marcar assinatura' }, { status: 400 })
  }
}

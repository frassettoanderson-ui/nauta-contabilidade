import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

export const dynamic = 'force-dynamic'

// Diretório PRIVADO (fora de /public) — arquivos só acessíveis via rota autenticada
const DIR = path.join(process.cwd(), 'uploads-private')

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'Nenhum arquivo' }, { status: 400 })

  const buffer = Buffer.from(await file.arrayBuffer())
  const ext = (file.name.split('.').pop() || 'bin').replace(/[^a-zA-Z0-9]/g, '')
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`

  await mkdir(DIR, { recursive: true })
  await writeFile(path.join(DIR, filename), buffer)

  return NextResponse.json({ url: `/api/sistema/arquivo/${filename}`, nome: file.name })
}

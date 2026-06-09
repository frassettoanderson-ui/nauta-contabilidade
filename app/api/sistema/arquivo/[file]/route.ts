import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { readFile } from 'fs/promises'
import path from 'path'

export const dynamic = 'force-dynamic'

const DIR = path.join(process.cwd(), 'uploads-private')

export async function GET(req: NextRequest, { params }: { params: { file: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  // Evita path traversal — só o nome do arquivo
  const safe = path.basename(params.file)
  try {
    const data = await readFile(path.join(DIR, safe))
    const ext = safe.split('.').pop()?.toLowerCase()
    const type =
      ext === 'pdf' ? 'application/pdf'
      : ext === 'png' ? 'image/png'
      : (ext === 'jpg' || ext === 'jpeg') ? 'image/jpeg'
      : 'application/octet-stream'
    return new NextResponse(new Uint8Array(data), { headers: { 'Content-Type': type } })
  } catch {
    return NextResponse.json({ error: 'Arquivo não encontrado' }, { status: 404 })
  }
}

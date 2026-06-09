import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { crmBus } from '@/lib/realtime'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return new Response('Não autorizado', { status: 401 })

  const enc = new TextEncoder()
  const stream = new ReadableStream({
    start(controller) {
      const send = (d: string) => { try { controller.enqueue(enc.encode(d)) } catch {} }
      send(': connected\n\n')
      const onChange = () => send('data: change\n\n')
      crmBus.on('change', onChange)
      const hb = setInterval(() => send(': hb\n\n'), 25000) // heartbeat mantém a conexão viva
      req.signal.addEventListener('abort', () => {
        clearInterval(hb)
        crmBus.off('change', onChange)
        try { controller.close() } catch {}
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // desativa buffering do Nginx p/ SSE
    },
  })
}

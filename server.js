// Servidor customizado: Next.js + Socket.IO (chat em tempo real)
const { createServer } = require('http')
const next = require('next')
const { Server } = require('socket.io')

const dev = process.env.NODE_ENV === 'development'
const port = process.env.PORT || 3000
const app = next({ dev })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const server = createServer((req, res) => handle(req, res))

  const io = new Server(server, { path: '/socket.io', cors: { origin: true } })
  globalThis.__io = io

  // Presença: usuário online = tem ao menos um socket conectado (logado no sistema)
  const online = new Map() // userId -> nº de conexões
  globalThis.__online = online

  io.on('connection', (socket) => {
    socket.on('join', (room) => {
      if (!room) return
      socket.join(String(room))
      const m = String(room).match(/^user:(.+)$/)
      if (m) {
        const uid = m[1]
        socket.data.uid = uid
        online.set(uid, (online.get(uid) || 0) + 1)
      }
    })
    socket.on('leave', (room) => { if (room) socket.leave(String(room)) })
    socket.on('disconnect', () => {
      const uid = socket.data.uid
      if (!uid) return
      const n = (online.get(uid) || 1) - 1
      if (n <= 0) online.delete(uid); else online.set(uid, n)
    })
  })

  server.listen(port, () => console.log(`> Nauta pronto na porta ${port} (Socket.IO ativo)`))
})

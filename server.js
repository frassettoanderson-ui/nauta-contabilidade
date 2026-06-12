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

  io.on('connection', (socket) => {
    socket.on('join', (room) => { if (room) socket.join(String(room)) })
    socket.on('leave', (room) => { if (room) socket.leave(String(room)) })
  })

  server.listen(port, () => console.log(`> Nauta pronto na porta ${port} (Socket.IO ativo)`))
})

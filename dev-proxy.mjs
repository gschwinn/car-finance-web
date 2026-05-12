import http from 'node:http'
import net  from 'node:net'
import express from 'express'

const PORT       = 4000
const API_TARGET = { host: 'localhost', port: 3000 }
const UI_TARGET  = { host: 'localhost', port: 5173 }

const app = express()

app.use((req, res) => {
  const target = req.path.startsWith('/api') ? API_TARGET : UI_TARGET

  const opts = {
    hostname: target.host,
    port:     target.port,
    path:     req.url,
    method:   req.method,
    headers:  { ...req.headers, host: `${target.host}:${target.port}` },
  }

  const forward = http.request(opts, upstream => {
    console.log(`${req.method} ${req.url} → :${target.port} ${upstream.statusCode}`)
    res.writeHead(upstream.statusCode, upstream.headers)
    upstream.pipe(res, { end: true })
  })

  forward.on('error', err => {
    console.error(`${req.method} ${req.url} → :${target.port} ERR ${err.message}`)
    if (!res.headersSent) res.status(502).send('Bad Gateway')
  })

  req.pipe(forward, { end: true })
})

const server = http.createServer(app)

// Proxy WebSocket upgrades to Vite (HMR)
server.on('upgrade', (req, clientSocket, head) => {
  const target = UI_TARGET
  console.log(`WS  ${req.url} → :${target.port}`)

  const upstream = net.createConnection({ host: target.host, port: target.port }, () => {
    const headers =
      `${req.method} ${req.url} HTTP/1.1\r\n` +
      Object.entries(req.headers).map(([k, v]) => `${k}: ${v}`).join('\r\n') +
      '\r\n\r\n'
    upstream.write(headers)
    if (head?.length) upstream.write(head)
    upstream.pipe(clientSocket)
    clientSocket.pipe(upstream)
  })

  upstream.on('error', err => {
    console.error(`WS  ${req.url} → :${target.port} ERR ${err.message}`)
    clientSocket.destroy()
  })
  clientSocket.on('error', () => upstream.destroy())
})

server.listen(PORT, () => {
  console.log(`dev proxy listening on http://localhost:${PORT}`)
  console.log(`  /api/* → http://localhost:${API_TARGET.port}`)
  console.log(`  /*     → http://localhost:${UI_TARGET.port}`)
})

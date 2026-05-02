import express from 'express'
import path from 'path'
import { handleMcpRequest } from './mcp.js'

const port = process.env.PORT ?? 3000
const uiDir = process.env.UI_DIST_DIR ?? './ui/dist'
const stackVersion = process.env.STACK_VERSION ?? process.env.npm_package_version ?? 'unknown'
const uiDist = path.resolve(__dirname, uiDir)

const app = express()
app.use(express.json())
app.disable('x-powered-by')

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.get('/api/version', (_req, res) => {
  res.json({ version: stackVersion })
})

app.post('/api/mcp', handleMcpRequest)

app.use(express.static(uiDist))

app.get('/{*splat}', (_req, res) => {
  res.sendFile(path.join(uiDist, 'index.html'))
})

app.listen(port, () => {
  console.log(`API server listening on port ${port}`)
})

const stopServer = () => {
  console.log(`API server shutting down`);
  process.exit(0);
};

process.on('SIGTERM', stopServer);
process.on('SIGINT', stopServer);

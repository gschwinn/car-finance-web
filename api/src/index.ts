import express from 'express'
import cookieParser from 'cookie-parser'
import path from 'path'
import { handleMcpRequest } from './mcp'
import { handleAgentRequest } from './agent'
import { handleLogin } from './routes/login'
import { handleOauthCallback } from './routes/oauthcb'
import { handleProfile } from './routes/profile'
import { handleLogout } from './routes/logout'
import { handleListDeals, handleCreateDeal, handleUpdateDeal, handleDeleteDeal } from './routes/deals'
import { handleUploadDeal } from './routes/upload'
import logger from './logger'

const port = process.env.PORT ?? 3000
const uiDir = process.env.UI_DIST_DIR ?? './ui/dist'
const stackVersion = process.env.STACK_VERSION ?? process.env.npm_package_version ?? 'unknown'
const uiDist = path.resolve(__dirname, uiDir)

const app = express()
app.use(express.json({ limit: '10mb' }))
app.use(cookieParser())
app.disable('x-powered-by')

app.use((req, _res, next) => {
  logger.debug('request', { method: req.method, path: req.path, body: req.body })
  next()
})

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.get('/api/version', (_req, res) => {
  res.json({ version: stackVersion })
})

app.post('/api/mcp', handleMcpRequest)
app.post('/api/agent', handleAgentRequest)
app.post('/api/upload', handleUploadDeal)
app.get('/api/login', handleLogin)
app.get('/api/oauthcb', handleOauthCallback)
app.get('/api/oauthcb/local', handleOauthCallback)
app.get('/api/profile', handleProfile)
app.get('/api/logout', handleLogout)

app.get('/api/deals',            handleListDeals)
app.post('/api/deals',           handleCreateDeal)
app.put('/api/deals/:dealKey',   handleUpdateDeal)
app.delete('/api/deals/:dealKey', handleDeleteDeal)

app.use(express.static(uiDist))

app.get('/{*splat}', (_req, res) => {
  res.sendFile(path.join(uiDist, 'index.html'))
})

app.listen(port, () => {
  logger.info(`API server listening on port ${port}`)
})

const stopServer = () => {
  logger.info(`API server shutting down`);
  process.exit(0);
};

process.on('SIGTERM', stopServer);
process.on('SIGINT', stopServer);

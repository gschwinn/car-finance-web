import express from 'express'
import { handleMcpRequest } from './mcp.js'

const app = express()
const port = process.env.PORT ?? 3001

app.use(express.json())
app.disable('x-powered-by');

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.post('/api/mcp', handleMcpRequest)

app.listen(port, () => {
  console.log(`API server listening on port ${port}`)
})

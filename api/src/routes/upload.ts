import { randomUUID } from 'crypto'
import type { Request, Response } from 'express'
import { generateObject } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { z } from 'zod'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb'
import logger from '../logger'
import { getAppConfig } from '../secrets'

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}))

async function getUserId(req: Request): Promise<string | null> {
  const sessionId: string | undefined = req.cookies?.session_id
  if (!sessionId) return null
  const result = await ddb.send(new GetCommand({
    TableName: process.env.SESSION_TABLE,
    Key: { sessionId },
  }))
  const session = result.Item
  if (!session || session.expiresAt < Math.floor(Date.now() / 1000)) return null
  return session.userId as string
}

// All fields are required (no .default() / .optional()) so every key appears in the
// JSON schema's required array — needed for OpenAI strict-mode structured output.
const baseDealSchema = {
  name: z.string().describe('Short descriptive name, e.g. "2025 Toyota Camry @ Dealer XYZ"'),
  carMake: z.string().describe('Vehicle manufacturer'),
  carModel: z.string().describe('Vehicle model name'),
  carYear: z.number().int().describe('Model year'),
  trimLevel: z.string().describe('Trim level or package name; empty string if not shown'),
  msrp: z.number().describe('MSRP / sticker price in dollars; 0 if not shown'),
  negotiatedPrice: z.number().describe('Agreed selling price / capitalized cost in dollars; 0 if not shown'),
  downPayment: z.number().describe('Down payment or cap cost reduction in dollars; 0 if not shown'),
  mfrIncentives: z.number().describe('Manufacturer rebates or incentives in dollars; 0 if not shown'),
  tradeInValue: z.number().describe('Trade-in allowance in dollars; 0 if not shown'),
  docFee: z.number().describe('Documentation fee in dollars; 0 if not shown'),
  securityDeposit: z.number().describe('Security deposit in dollars; 0 if not shown'),
  dispositionFee: z.number().describe('Disposition fee in dollars; 0 if not shown'),
  addlDealerFees: z.number().describe('Additional dealer fees in dollars; 0 if not shown'),
  govtFees: z.number().describe('Government / registration fees in dollars; 0 if not shown'),
  notes: z.string().describe('Any other relevant notes from the quote; empty string if none'),
}

const purchaseExtractSchema = z.object({
  ...baseDealSchema,
  loanTermMonths: z.number().int().describe('Loan term in months; use 60 if not shown'),
  interestRate: z.number().describe('APR as a percentage, e.g. 5.9 for 5.9%; 0 if not shown'),
  taxRate: z.number().describe('Sales tax rate as a percentage; 0 if not shown'),
})

const leaseExtractSchema = z.object({
  ...baseDealSchema,
  residualPercent: z.number().describe('Residual value as a percentage of MSRP, e.g. 55 for 55%; 0 if not shown'),
  moneyFactor: z.number().describe('Money factor, e.g. 0.00125; 0 if not shown'),
  leaseTermMonths: z.number().int().describe('Lease term in months; use 36 if not shown'),
  mileageAllowancePerYear: z.number().int().describe('Annual mileage allowance; use 12000 if not shown'),
  acquisitionFee: z.number().describe('Bank / acquisition fee in dollars; 0 if not shown'),
  taxRate: z.number().describe('Tax rate as a percentage; 0 if not shown'),
  leaseTaxMethod: z.enum(['monthly', 'upfront_payments', 'upfront_full_price']).describe('How tax is applied; default monthly'),
})

export async function handleUploadDeal(req: Request, res: Response): Promise<void> {
  const userId = await getUserId(req)
  if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return }

  const { type, content, imageBase64, mimeType } = req.body as {
    type: string
    content?: string
    imageBase64?: string
    mimeType?: string
  }

  if (type !== 'lease' && type !== 'purchase') {
    res.status(400).json({ error: '"type" must be "purchase" or "lease"' }); return
  }
  if (!content && !imageBase64) {
    res.status(400).json({ error: 'Must provide content or imageBase64' }); return
  }

  const apiConfig = await getAppConfig()
  const openai = createOpenAI({ apiKey: apiConfig.openaiApiKey })

  type ContentPart =
    | { type: 'image'; image: string; mimeType: string }
    | { type: 'text'; text: string }

  const contentParts: ContentPart[] = []
  if (imageBase64) {
    contentParts.push({ type: 'image', image: imageBase64, mimeType: mimeType ?? 'image/jpeg' })
  }
  if (content) {
    contentParts.push({ type: 'text', text: content })
  }
  contentParts.push({
    type: 'text',
    text: `Extract all deal fields from this ${type} dealer quote. Use 0 for any numeric fields not visible. All monetary values should be in dollars (not thousands).`,
  })

  const schema = type === 'lease' ? leaseExtractSchema : purchaseExtractSchema

  let extracted: z.infer<typeof schema>
  try {
    const { object } = await generateObject({
      model: openai('gpt-4o'),
      schema,
      messages: [{ role: 'user', content: contentParts }],
    })
    extracted = object
  } catch (err) {
    logger.error('upload generateObject error', { err })
    res.status(500).json({ error: 'Failed to analyze deal content' }); return
  }

  const id = randomUUID()
  const createdAt = new Date().toISOString()
  const dealKey = `${type}_${id}`
  const item = { ...extracted, type, id, createdAt, userId, dealKey }

  try {
    await ddb.send(new PutCommand({ TableName: process.env.DEALS_TABLE, Item: item }))
  } catch (err) {
    logger.error('upload ddb error', { err })
    res.status(500).json({ error: 'Failed to save deal' }); return
  }

  const { userId: _uid, dealKey: _dk, ...dealResponse } = item
  logger.info('upload deal created', { dealId: id, type })
  res.status(201).json(dealResponse)
}

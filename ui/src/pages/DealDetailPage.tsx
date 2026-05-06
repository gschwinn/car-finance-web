import type { PurchaseDeal, LeaseDeal, DealRevision } from '@/types'
import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { MarkdownContent } from '@/components/shared/MarkdownContent'

import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Divider from '@mui/material/Divider'
import Grid from '@mui/material/Grid'
import Paper from '@mui/material/Paper'
import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined'
import CloseIcon from '@mui/icons-material/Close'

import { useDeals } from '@/context/DealsContext'
import { Layout } from '@/components/layout/layout'
import { Button } from '@/components/shared/Button'
import DealDetail from '@/components/shared/DealDetail'
import PurchaseForm from '@/components/Purchase/PurchaseForm'
import LeaseForm from '@/components/Lease/LeaseForm'
import { dealDisplayName } from '@/utils/calculations'

export default function DealDetailPage() {
  const { dealId } = useParams<{ dealId: string }>()
  const navigate = useNavigate()
  const { allDeals, updatePurchase, updateLease } = useDeals()

  const deal = allDeals.find(d => d.id === dealId)

  const [editOpen, setEditOpen] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisError, setAnalysisError] = useState<string | null>(null)

  if (!deal) {
    return (
      <Layout title="Deal Not Found">
        <Typography color="text.secondary">No deal found with this ID.</Typography>
        <Button sx={{ mt: 2 }} onClick={() => navigate('/')}>Back to Deals</Button>
      </Layout>
    )
  }

  const backPath = deal.type === 'lease' ? '/lease' : '/'
  const revisions = deal.revisions ?? []
  const latestRevision = revisions.length > 0 ? revisions[revisions.length - 1] : null

  function handleSave(data: PurchaseDeal | LeaseDeal) {
    if (data.type === 'purchase') updatePurchase(data as PurchaseDeal)
    else updateLease(data as LeaseDeal)
    setEditOpen(false)
  }

  async function handleAnalyze() {
    setAnalyzing(true)
    setAnalysisError(null)
    try {
      const resp = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deal),
      })
      const data = await resp.json()
      if (!resp.ok) throw new Error(data.error ?? 'Analysis failed')

      const revision: DealRevision = {
        snapshot: { ...deal, revisions: [] } as PurchaseDeal | LeaseDeal,
        analysis: data.text,
        followUps: { instructions: '' },
      }
      if (deal!.type === 'purchase') updatePurchase({ ...deal, revisions: [...revisions, revision] } as PurchaseDeal)
      else updateLease({ ...deal, revisions: [...revisions, revision] } as LeaseDeal)
    } catch (err) {
      setAnalysisError(err instanceof Error ? err.message : 'Analysis failed')
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <Layout
      title={dealDisplayName(deal)}
      action={
        <Button
          color="info"
          variant="outlined"
          startIcon={<ArrowBackOutlinedIcon />}
          onClick={() => navigate(backPath)}
        >
          Back
        </Button>
      }
    >
      {analysisError && (
        <Alert severity="error" onClose={() => setAnalysisError(null)} sx={{ mb: 2 }}>
          {analysisError}
        </Alert>
      )}

      <Grid container spacing={2} sx={{ alignItems: 'flex-start' }}>
        <Grid size={{ xs: 12, md: latestRevision ? 5 : 12 }}>
          <DealDetail deal={deal} onEdit={() => setEditOpen(true)} onAnalyze={handleAnalyze} analyzing={analyzing} />
        </Grid>

        {latestRevision && (
          <Grid size={{ xs: 12, md: 7 }}>
            <AnalysisPanel revision={latestRevision} />
          </Grid>
        )}
      </Grid>

      {/* ── Edit dialog ── */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {deal.type === 'purchase' ? 'Edit Purchase Deal' : 'Edit Lease Deal'}
          <IconButton onClick={() => setEditOpen(false)} size="small" aria-label="close">
            <CloseIcon sx={{ fontSize: 'large', color: 'text.secondary' }} />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {deal.type === 'purchase' ? (
            <PurchaseForm
              initial={deal}
              onSave={d => handleSave(d as PurchaseDeal)}
              onCancel={() => setEditOpen(false)}
            />
          ) : (
            <LeaseForm
              initial={deal}
              onSave={d => handleSave(d as LeaseDeal)}
              onCancel={() => setEditOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  )
}

function AnalysisPanel({ revision }: { revision: DealRevision }) {
  const ts = (revision as DealRevision & { createdAt?: string }).createdAt
  return (
    <Paper variant="outlined" sx={{ p: 2.5 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="subtitle2">AI Analysis</Typography>
        {ts && (
          <Typography variant="caption" color="text.disabled">
            {new Date(ts).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
          </Typography>
        )}
      </Box>
      <Divider sx={{ mb: 1.5 }} />
      <MarkdownContent>{revision.analysis}</MarkdownContent>
    </Paper>
  )
}

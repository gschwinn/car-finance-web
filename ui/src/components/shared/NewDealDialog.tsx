import { useState, useRef, useEffect } from 'react'
import type { Deal, LeaseDeal, PurchaseDeal } from '@/types'

import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import IconButton from '@mui/material/IconButton'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardActionArea from '@mui/material/CardActionArea'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Stack from '@mui/material/Stack'
import CloseIcon from '@mui/icons-material/Close'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import EditNoteIcon from '@mui/icons-material/EditNote'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'

import { Button } from './Button'
import LeaseForm from '../Lease/LeaseForm'
import PurchaseForm from '../Purchase/PurchaseForm'

type Step = 'selector' | 'upload' | 'form'

interface Props {
  open: boolean
  onClose: () => void
  dealType: 'lease' | 'purchase'
  editDeal?: LeaseDeal | PurchaseDeal | null
  onFormSave: (deal: LeaseDeal | PurchaseDeal) => void
  onUploadSuccess: (deal: Deal) => void
}

export function NewDealDialog({ open, onClose, dealType, editDeal, onFormSave, onUploadSuccess }: Props) {
  const [step, setStep] = useState<Step>(editDeal ? 'form' : 'selector')
  const [pastedText, setPastedText] = useState('')
  const [imageBase64, setImageBase64] = useState<string | null>(null)
  const [imageMimeType, setImageMimeType] = useState('image/jpeg')
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setStep(editDeal ? 'form' : 'selector')
      setPastedText('')
      setImageBase64(null)
      setImagePreview(null)
      setUploadError(null)
    }
  }, [open, editDeal])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string
      const [header, b64] = dataUrl.split(',')
      const mime = header.match(/data:([^;]+)/)?.[1] ?? 'image/jpeg'
      setImageBase64(b64)
      setImageMimeType(mime)
      setImagePreview(dataUrl)
    }
    reader.readAsDataURL(file)
  }

  const handleUploadSubmit = async () => {
    setUploading(true)
    setUploadError(null)
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: dealType,
          content: pastedText || undefined,
          imageBase64: imageBase64 || undefined,
          mimeType: imageBase64 ? imageMimeType : undefined,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Upload failed')
      }
      const deal = await res.json() as Deal
      onUploadSuccess(deal)
      onClose()
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleFormSave = (data: LeaseDeal | PurchaseDeal) => {
    onFormSave(data)
    onClose()
  }

  const label = dealType === 'lease' ? 'Lease' : 'Purchase'

  const dialogTitle =
    step === 'upload' ? 'Upload Dealer Quote' :
    editDeal ? `Edit ${label} Deal` :
    `New ${label} Deal`

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {step === 'upload' && (
            <IconButton onClick={() => setStep('selector')} size="small" aria-label="back" sx={{ mr: 0.5 }}>
              <ArrowBackIcon fontSize="small" />
            </IconButton>
          )}
          {dialogTitle}
        </Box>
        <IconButton onClick={onClose} size="small" aria-label="close">
          <CloseIcon sx={{ fontSize: 'large', color: 'text.secondary' }} />
        </IconButton>
      </DialogTitle>

      {/* ── Selector step ── */}
      {step === 'selector' && (
        <DialogContent>
          <Box sx={{ display: 'flex', gap: 2, pt: 1, pb: 1 }}>
            <Card variant="outlined" sx={{ flex: 1 }}>
              <CardActionArea onClick={() => setStep('upload')} sx={{ height: '100%' }}>
                <CardContent sx={{ textAlign: 'center', py: 4 }}>
                  <CloudUploadIcon sx={{ fontSize: 44, color: 'primary.main', mb: 1.5 }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }} gutterBottom>
                    Upload Quote
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Photo or paste text from dealer
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>

            <Card variant="outlined" sx={{ flex: 1 }}>
              <CardActionArea onClick={() => setStep('form')} sx={{ height: '100%' }}>
                <CardContent sx={{ textAlign: 'center', py: 4 }}>
                  <EditNoteIcon sx={{ fontSize: 44, color: 'primary.main', mb: 1.5 }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }} gutterBottom>
                    Enter Manually
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Fill in all deal details yourself
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Box>
        </DialogContent>
      )}

      {/* ── Upload step ── */}
      {step === 'upload' && (
        <>
          <DialogContent dividers>
            <Stack spacing={2.5}>
              {uploadError && <Alert severity="error" onClose={() => setUploadError(null)}>{uploadError}</Alert>}

              <TextField
                label="Paste deal text (optional)"
                multiline
                minRows={4}
                fullWidth
                value={pastedText}
                onChange={e => setPastedText(e.target.value)}
                placeholder="Paste text from a dealer quote, email, or worksheet…"
              />

              <Box
                onClick={() => fileInputRef.current?.click()}
                sx={{
                  border: '2px dashed',
                  borderColor: imagePreview ? 'primary.main' : 'divider',
                  borderRadius: 1,
                  p: 2,
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'border-color 0.15s, background-color 0.15s',
                  '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' },
                }}
              >
                {imagePreview ? (
                  <Box
                    component="img"
                    src={imagePreview}
                    alt="Quote preview"
                    sx={{ maxHeight: 220, maxWidth: '100%', objectFit: 'contain', borderRadius: 1 }}
                  />
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, py: 2 }}>
                    <CloudUploadIcon sx={{ fontSize: 38, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      Click to select a photo or image of the quote
                    </Typography>
                    <Typography variant="caption" color="text.disabled">
                      Supports camera on mobile
                    </Typography>
                  </Box>
                )}
              </Box>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
            </Stack>
          </DialogContent>

          <DialogActions>
            <Button onClick={onClose} color="info" disabled={uploading}>Cancel</Button>
            <Button
              onClick={handleUploadSubmit}
              variant="contained"
              disabled={uploading || (!pastedText.trim() && !imageBase64)}
              startIcon={uploading ? <CircularProgress size={16} color="inherit" /> : undefined}
            >
              {uploading ? 'Analyzing…' : 'Analyze & Create Deal'}
            </Button>
          </DialogActions>
        </>
      )}

      {/* ── Form step ── */}
      {step === 'form' && (
        <DialogContent dividers>
          {dealType === 'lease' ? (
            <LeaseForm
              initial={(editDeal as LeaseDeal) ?? {}}
              onSave={(data) => handleFormSave(data)}
              onCancel={onClose}
            />
          ) : (
            <PurchaseForm
              initial={(editDeal as PurchaseDeal) ?? {}}
              onSave={(data) => handleFormSave(data)}
              onCancel={onClose}
            />
          )}
        </DialogContent>
      )}
    </Dialog>
  )
}

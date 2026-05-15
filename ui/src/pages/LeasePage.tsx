import type { LeaseDeal } from '@/types'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import Alert from "@mui/material/Alert";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import IconButton from "@mui/material/IconButton";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";

import { useDeals } from '@/context/DealsContext'
import { Layout } from '@/components/layout/layout'
import { Button } from '@/components/shared/Button';
import DealCard   from '@/components/shared/DealCard'
import { NewDealDialog } from '@/components/shared/NewDealDialog'
import type { Deal } from '@/types'

import { EmptyCard } from "@/components/shared/EmptyCard";
import { NavItems } from "@/components/layout/nav";

const BANNER_KEY = 'lease_101_banner_dismissed'

type ModalType = 'selector' | 'edit' | 'delete' | null

interface ModalState {
  type: ModalType
  deal: LeaseDeal | null
}

export default function LeasePage() {
  const { leases, addLease, updateLease, deleteLease, addDealFromServer } = useDeals()
  const navigate = useNavigate()

  const [modalState, setModalState] = useState<ModalState>({ type: null, deal: null })
  const [bannerDismissed, setBannerDismissed] = useState(() => localStorage.getItem(BANNER_KEY) === '1')

  const close = () => setModalState({ type: null, deal: null })

  function dismissBanner() {
    localStorage.setItem(BANNER_KEY, '1')
    setBannerDismissed(true)
  }

  function handleSave(data: LeaseDeal) {
    if (modalState.type === 'edit') updateLease(data)
    else addLease(data)
  }

  function handleUploadSuccess(deal: Deal) {
    addDealFromServer(deal)
  }

  function confirmDeleteDeal() {
    if (modalState.type === 'delete') deleteLease(modalState.deal?.id!)
    close()
  }

  return (
    <Layout
      title="Lease Deals"
      subtitle={leases.length > 0 ? `${leases.length} saved deal${leases.length !== 1 ? 's' : ''}` : null}
      action={
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            color="info"
            variant="outlined"
            startIcon={<SchoolOutlinedIcon />}
            onClick={() => navigate('/lease/learn')}
          >
            Leasing 101
          </Button>
          <Button
            color="primary"
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setModalState({ type: "selector", deal: null })}
          >
            New Deal
          </Button>
        </Box>
      }
    >

      {!bannerDismissed && (
        <Alert
          severity="info"
          onClose={dismissBanner}
          sx={{ mb: 2 }}
        >
          New to leasing?{' '}
          <Link
            component="button"
            variant="body2"
            onClick={() => navigate('/lease/learn')}
            sx={{ verticalAlign: 'baseline' }}
          >
            Read our quick Leasing 101 guide
          </Link>
          {' '}to understand money factors, residuals, and what to negotiate.
        </Alert>
      )}

      {leases.length === 0 ? (
        <EmptyCard
          Icon={NavItems[0].Icon}
          title="No lease deals yet"
          description="Compare offers from different dealers, with different money factors, residuals, and mileage tiers."
          action={
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
              <Button
                color="primary"
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setModalState({ type: "selector", deal: null })}
              >
                Add First Deal
              </Button>
              <Link
                component="button"
                variant="body2"
                color="text.secondary"
                onClick={() => navigate('/lease/learn')}
              >
                New to leasing? Start with our guide →
              </Link>
            </Box>
          }
        />
      ) : (
        <Grid container spacing={1}>
          {leases.map(deal => (
            <Grid key={deal.id} size={{ xs: 12, sm: 6, lg: 4 }}>
              <div onClick={() => navigate(`/lease/${deal.id}`)} style={{ cursor: 'pointer' }}>
                <DealCard
                  deal={deal}
                  onEdit={d => setModalState({ type: 'edit', deal: d as LeaseDeal })}
                  onDelete={d => setModalState({ type: 'delete', deal: d as LeaseDeal })}
                />
              </div>
            </Grid>
          ))}
        </Grid>
      )}

      {/* ── New / Upload / Edit dialog ── */}
      <NewDealDialog
        open={modalState.type === 'selector' || modalState.type === 'edit'}
        onClose={close}
        dealType="lease"
        editDeal={modalState.type === 'edit' ? modalState.deal : null}
        onFormSave={data => handleSave(data as LeaseDeal)}
        onUploadSuccess={handleUploadSuccess}
      />

      {/* ── Delete confirm dialog ── */}
      <Dialog open={modalState.type === 'delete'} onClose={close} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Delete Lease Deal
          <IconButton onClick={close} size="small" aria-label="close">
            <CloseIcon sx={{ fontSize: 'large', color: 'text.secondary' }} />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {`Delete "${modalState.deal?.name || `${modalState.deal?.carYear} ${modalState.deal?.carMake} ${modalState.deal?.carModel}`}"? This cannot be undone.`}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={close} color="info">Cancel</Button>
          <Button onClick={confirmDeleteDeal} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>
    </Layout>
  )
}

import type { LeaseDeal } from '@/types'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import IconButton from "@mui/material/IconButton";
import Grid from "@mui/material/Grid";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";

import { useDeals } from '@/context/DealsContext'
import { Layout } from '@/components/layout/layout'
import { Button } from '@/components/shared/Button';
import DealCard   from '@/components/shared/DealCard'
import { NewDealDialog } from '@/components/shared/NewDealDialog'
import type { Deal } from '@/types'

import { EmptyCard } from "@/components/shared/EmptyCard";
import { NavItems } from "@/components/layout/nav";

type ModalType = 'selector' | 'edit' | 'delete' | null

interface ModalState {
  type: ModalType
  deal: LeaseDeal | null
}

export default function LeasePage() {
  const { leases, addLease, updateLease, deleteLease, addDealFromServer } = useDeals()
  const navigate = useNavigate()

  const [modalState, setModalState] = useState<ModalState>({ type: null, deal: null })

  const close = () => setModalState({ type: null, deal: null })

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
        <Button
          color="primary"
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setModalState({ type: "selector", deal: null })}
        >
          New Deal
        </Button>
      }
    >

      {leases.length === 0 ? (
        <EmptyCard
          Icon={NavItems[0].Icon}
          title="No lease deals yet"
          description="Compare offers from different dealers, with different money factors, residuals, and mileage tiers."
          action={
            <Button
              color="primary"
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setModalState({ type: "selector", deal: null })}
            >
              Add First Deal
            </Button>
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

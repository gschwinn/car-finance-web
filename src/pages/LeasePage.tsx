import type { LeaseDeal } from '@/types'
import { useState } from 'react'

import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import AddIcon from "@mui/icons-material/Add";

import { useDeals } from '@/context/DealsContext'
import { Layout } from '@/components/layout/layout'
import { PageHeader } from '@/components/layout/page-header'
import DealCard   from '@/components/shared/DealCard'
import DealDetail from '@/components/shared/DealDetail'
import LeaseForm  from '@/components/Lease/LeaseForm'

import { Modal, ConfirmDialog } from '@/components/shared/UI'

import { EmptyCard } from "@/components/shared/EmptyCard";
import { NavItems } from "@/components/layout/nav";

type ModalType = 'new' | 'edit' | 'detail' | null

interface ModalState {
  type: ModalType
  deal: LeaseDeal | null
}

export default function LeasePage() {
  const { leases, addLease, updateLease, deleteLease } = useDeals()

  const [modalState, setModalState]       = useState<ModalState>({ type: null, deal: null })
  const [confirmDelete, setConfirmDelete] = useState<LeaseDeal | null>(null)

  const close = () => setModalState({ type: null, deal: null })

  function handleSave(data: LeaseDeal) {
    if (modalState.type === 'new') addLease(data)
    else updateLease(data)
    close()
  }

  function confirmDeleteDeal() {
    if (confirmDelete) deleteLease(confirmDelete.id!)
    setConfirmDelete(null)
  }

  return (
    <Layout>
      <PageHeader
        title="Lease Deals"
        subtitle={leases.length > 0 ? `${leases.length} saved deal${leases.length !== 1 ? 's' : ''}` : null}
        action={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setModalState({ type: "new", deal: null })}
          >
            New Deal
          </Button>
        }
      />

      {leases.length === 0 ? (
        <EmptyCard
          Icon={NavItems[1].Icon}
          title="No lease deals yet"
          description="Compare offers from different dealers, with different money factors, residuals, and mileage tiers."
          action={
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setModalState({ type: "new", deal: null })}
            >
              Add First Deal
            </Button>
          }
        />
      ) : (
        <Grid container spacing={1}>
          {leases.map(deal => (
            <Grid key={deal.id} size={{ xs: 12, sm: 6, lg: 4 }}>
              <div onClick={() => setModalState({ type: 'detail', deal })} style={{ cursor: 'pointer' }}>
                <DealCard
                  deal={deal}
                  onEdit={d => setModalState({ type: 'edit', deal: d as LeaseDeal })}
                  onDelete={d => setConfirmDelete(d as LeaseDeal)}
                />
              </div>
            </Grid>
          ))}
        </Grid>
      )}

      {/* ── New / Edit modal ── */}
      <Modal
        isOpen={modalState.type === 'new' || modalState.type === 'edit'}
        onClose={close}
        title={modalState.type === 'new' ? 'New Lease Deal' : 'Edit Lease Deal'}
        size="md"
      >
        <LeaseForm
          initial={modalState.deal ?? {}}
          onSave={handleSave}
          onCancel={close}
        />
      </Modal>

      {/* ── Detail modal ── */}
      <Modal isOpen={modalState.type === 'detail'} onClose={close} title="Deal Detail" size="md">
        {modalState.deal && (
          <DealDetail
            deal={modalState.deal}
            onEdit={() => setModalState({ type: 'edit', deal: modalState.deal })}
          />
        )}
      </Modal>

      {/* ── Delete confirm ── */}
      <ConfirmDialog
        isOpen={!!confirmDelete}
        title="Delete Lease Deal"
        message={`Delete "${confirmDelete?.name || `${confirmDelete?.carYear} ${confirmDelete?.carMake} ${confirmDelete?.carModel}`}"? This cannot be undone.`}
        danger
        onConfirm={confirmDeleteDeal}
        onCancel={() => setConfirmDelete(null)}
      />
    </Layout>
  )
}

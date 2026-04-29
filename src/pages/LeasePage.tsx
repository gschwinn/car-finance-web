import { useState } from 'react'
import { Plus, Calendar } from 'lucide-react'
import type { LeaseDeal } from '../types'
import { useDeals } from '../context/DealsContext'
import DealCard   from '../components/shared/DealCard'
import DealDetail from '../components/shared/DealDetail'
import LeaseForm  from '../components/Lease/LeaseForm'
import { Modal, ConfirmDialog, EmptyState, PageHeader } from '../components/shared/UI'

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
    <>
      <PageHeader
        title="Lease Deals"
        subtitle={leases.length > 0 ? `${leases.length} saved deal${leases.length !== 1 ? 's' : ''}` : null}
        action={
          <button onClick={() => setModalState({ type: 'new', deal: null })} className="btn-primary">
            <Plus size={16} /> New Deal
          </button>
        }
      />

      {leases.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No lease deals yet"
          description="Compare offers from different dealers, with different money factors, residuals, and mileage tiers."
          action={
            <button onClick={() => setModalState({ type: 'new', deal: null })} className="btn-primary">
              <Plus size={16} /> Add First Deal
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {leases.map(deal => (
            <div key={deal.id} onClick={() => setModalState({ type: 'detail', deal })} className="cursor-pointer">
              <DealCard
                deal={deal}
                onEdit={d => setModalState({ type: 'edit', deal: d as LeaseDeal })}
                onDelete={d => setConfirmDelete(d as LeaseDeal)}
              />
            </div>
          ))}
        </div>
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
    </>
  )
}

import { useState } from "react";
import type { PurchaseDeal } from "@/types";

import Button from "@mui/material/Button";
import AddIcon from "@mui/icons-material/Add";

import { useDeals } from "@/context/DealsContext";
import { Layout } from "@/components/layout/layout";
import { PageHeader } from "@/components/layout/page-header";
import DealCard from "@/components/shared/DealCard";
import DealDetail from "@/components/shared/DealDetail";
import PurchaseForm from "@/components/Purchase/PurchaseForm";

import { Modal, ConfirmDialog } from "@/components/shared/UI";
import { EmptyCard } from "@/components/shared/EmptyCard";
import { NavItems } from "@/components/layout/nav";

type ModalType = "new" | "edit" | "detail" | null;

interface ModalState {
  type: ModalType;
  deal: PurchaseDeal | null;
}

export default function PurchasePage() {
  const { purchases, addPurchase, updatePurchase, deletePurchase } = useDeals();

  const [modalState, setModalState] = useState<ModalState>({
    type: null,
    deal: null,
  });
  const [confirmDelete, setConfirmDelete] = useState<PurchaseDeal | null>(null);

  const close = () => setModalState({ type: null, deal: null });

  function handleSave(data: PurchaseDeal) {
    if (modalState.type === "new") addPurchase(data);
    else updatePurchase(data);
    close();
  }

  function confirmDeleteDeal() {
    if (confirmDelete) deletePurchase(confirmDelete.id!);
    setConfirmDelete(null);
  }

  return (
    <Layout>
      <PageHeader
        title="Purchase Deals"
        subtitle={
          purchases.length > 0
            ? `${purchases.length} saved deal${purchases.length !== 1 ? "s" : ""}`
            : null
        }
        action={
          <Button
            size="small"
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setModalState({ type: "new", deal: null })}
          >
            New Deal
          </Button>
        }
      />

      {purchases.length === 0 ? (
        <EmptyCard
          Icon={NavItems[0].Icon}
          title="No purchase deals yet"
          description="Save different configurations to compare offers from multiple dealers."
          action={
            <Button
              size="small"
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setModalState({ type: "new", deal: null })}
            >
              Add First Deal
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {purchases.map((deal) => (
            <div
              key={deal.id}
              onClick={() => setModalState({ type: "detail", deal })}
              className="cursor-pointer"
            >
              <DealCard
                deal={deal}
                onEdit={(d) =>
                  setModalState({ type: "edit", deal: d as PurchaseDeal })
                }
                onDelete={(d) => setConfirmDelete(d as PurchaseDeal)}
              />
            </div>
          ))}
        </div>
      )}

      {/* ── New / Edit modal ── */}
      <Modal
        isOpen={modalState.type === "new" || modalState.type === "edit"}
        onClose={close}
        title={
          modalState.type === "new" ? "New Purchase Deal" : "Edit Purchase Deal"
        }
        size="md"
      >
        <PurchaseForm
          initial={modalState.deal ?? {}}
          onSave={handleSave}
          onCancel={close}
        />
      </Modal>

      {/* ── Detail modal ── */}
      <Modal
        isOpen={modalState.type === "detail"}
        onClose={close}
        title="Deal Detail"
        size="md"
      >
        {modalState.deal && (
          <DealDetail
            deal={modalState.deal}
            onEdit={() =>
              setModalState({ type: "edit", deal: modalState.deal })
            }
          />
        )}
      </Modal>

      {/* ── Delete confirm ── */}
      <ConfirmDialog
        isOpen={!!confirmDelete}
        title="Delete Deal"
        message={`Delete "${confirmDelete?.name || `${confirmDelete?.carYear} ${confirmDelete?.carMake} ${confirmDelete?.carModel}`}"? This cannot be undone.`}
        danger
        onConfirm={confirmDeleteDeal}
        onCancel={() => setConfirmDelete(null)}
      />
    </Layout>
  );
}

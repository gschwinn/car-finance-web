import type { PurchaseDeal, Deal } from "@/types";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import IconButton from "@mui/material/IconButton";
import Grid from "@mui/material/Grid";
import Link from "@mui/material/Link";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";

const BANNER_KEY = 'purchase_101_banner_dismissed'

import { useDeals } from "@/context/DealsContext";
import { Layout } from "@/components/layout/layout";
import { Button } from '@/components/shared/Button';
import DealCard from "@/components/shared/DealCard";
import { NewDealDialog } from "@/components/shared/NewDealDialog";

import { EmptyCard } from "@/components/shared/EmptyCard";
import { NavItems } from "@/components/layout/nav";

type ModalType = "selector" | "edit" | "delete" | null;

interface ModalState {
  type: ModalType;
  deal: PurchaseDeal | null;
}

export default function PurchasePage() {
  const { purchases, addPurchase, updatePurchase, deletePurchase, addDealFromServer } = useDeals();
  const navigate = useNavigate();

  const [modalState, setModalState] = useState<ModalState>({ type: null, deal: null });
  const [bannerDismissed, setBannerDismissed] = useState(() => localStorage.getItem(BANNER_KEY) === '1');

  const close = () => setModalState({ type: null, deal: null });

  function dismissBanner() {
    localStorage.setItem(BANNER_KEY, '1');
    setBannerDismissed(true);
  }

  function handleSave(data: PurchaseDeal) {
    if (modalState.type === "edit") updatePurchase(data);
    else addPurchase(data);
  }

  function handleUploadSuccess(deal: Deal) {
    addDealFromServer(deal);
  }

  function confirmDeleteDeal() {
    if (modalState.type === 'delete') deletePurchase(modalState.deal?.id!)
    close()
  }

  return (
    <Layout
      title="Purchase Deals"
      subtitle={
        purchases.length > 0
          ? `${purchases.length} saved deal${purchases.length !== 1 ? "s" : ""}`
          : null
      }
      action={
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            color="info"
            variant="outlined"
            startIcon={<SchoolOutlinedIcon />}
            onClick={() => navigate('/purchase/learn')}
          >
            Buying 101
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
        <Alert severity="info" onClose={dismissBanner} sx={{ mb: 2 }}>
          New to financing a car?{' '}
          <Link
            component="button"
            variant="body2"
            onClick={() => navigate('/purchase/learn')}
            sx={{ verticalAlign: 'baseline' }}
          >
            Read our quick Buying 101 guide
          </Link>
          {' '}to understand APR, loan terms, and how to negotiate the best deal.
        </Alert>
      )}

      {purchases.length === 0 ? (
        <EmptyCard
          Icon={NavItems[1].Icon}
          title="No purchase deals yet"
          description="Save different configurations to compare offers from multiple dealers."
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
                onClick={() => navigate('/purchase/learn')}
              >
                New to car buying? Start with our guide →
              </Link>
            </Box>
          }
        />
      ) : (
        <Grid container spacing={1}>
          {purchases.map((deal) => (
            <Grid key={deal.id} size={{ xs: 12, sm: 6, lg: 4 }}>
              <div onClick={() => navigate(`/purchase/${deal.id}`)} style={{ cursor: 'pointer' }}>
                <DealCard
                  deal={deal}
                  onEdit={(d) => setModalState({ type: "edit", deal: d as PurchaseDeal })}
                  onDelete={(d) => setModalState({ type: "delete", deal: d as PurchaseDeal })}
                />
              </div>
            </Grid>
          ))}
        </Grid>
      )}

      {/* ── New / Upload / Edit dialog ── */}
      <NewDealDialog
        open={modalState.type === "selector" || modalState.type === "edit"}
        onClose={close}
        dealType="purchase"
        editDeal={modalState.type === "edit" ? modalState.deal : null}
        onFormSave={data => handleSave(data as PurchaseDeal)}
        onUploadSuccess={handleUploadSuccess}
      />

      {/* ── Delete confirm dialog ── */}
      <Dialog open={modalState.type === 'delete'} onClose={close} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Delete Deal
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
  );
}

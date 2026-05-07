import type { PurchaseDeal, LeaseDeal, DealRevision, Deal } from "@/types";
import { useState } from "react";
import { useAnalyzeDeal } from "@/hooks/useAnalyzeDeal";
import { useParams, useNavigate } from "react-router-dom";
import { MarkdownContent } from "@/components/shared/MarkdownContent";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";

import CloseIcon from "@mui/icons-material/Close";
import TaxiAlertIcon from "@mui/icons-material/TaxiAlert";
import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";

import { useDeals } from "@/context/DealsContext";
import { Layout } from "@/components/layout/layout";
import { Button } from "@/components/shared/Button";
import DealDetail from "@/components/shared/DealDetail";
import PurchaseForm from "@/components/Purchase/PurchaseForm";
import LeaseForm from "@/components/Lease/LeaseForm";

export default function DealDetailPage() {
  const { dealId } = useParams<{ dealId: string }>();
  const navigate = useNavigate();
  const { allDeals, updatePurchase, updateLease } = useDeals();

  const deal = allDeals.find((d) => d.id === dealId);

  const [editOpen, setEditOpen] = useState(false);
  const {
    analyzing,
    error: analysisError,
    clearError,
    handleAnalyze,
  } = useAnalyzeDeal(deal, ({ analysis, followUps }) => {
    const dealRevisions = deal?.revisions ?? [];
    const revision: DealRevision = {
      snapshot: { ...deal!, revisions: [] } as PurchaseDeal | LeaseDeal,
      analysis,
      followUps,
    };
    if (deal!.type === "purchase")
      updatePurchase({
        ...deal!,
        revisions: [...dealRevisions, revision],
      } as PurchaseDeal);
    else
      updateLease({
        ...deal!,
        revisions: [...dealRevisions, revision],
      } as LeaseDeal);
  });

  if (!deal) {
    return (
      <Layout title="Deal Not Found">
        <Typography color="text.secondary">
          No deal found with this ID.
        </Typography>
        <Button sx={{ mt: 2 }} onClick={() => navigate("/")}>
          Back to Deals
        </Button>
      </Layout>
    );
  }

  const backPath = `/${deal.type}`;
  const revisions = deal.revisions ?? [];
  const latestRevision =
    revisions.length > 0 ? revisions[revisions.length - 1] : undefined;

  function handleSave(data: PurchaseDeal | LeaseDeal) {
    if (data.type === "purchase") updatePurchase(data as PurchaseDeal);
    else updateLease(data as LeaseDeal);
    setEditOpen(false);
  }

  function dealDisplayName(deal: Deal): string {
    const dealType = deal.type === "purchase" ? "Purchase" : "Lease";
    const dealName =
      deal.name?.trim() || `${deal.carYear} ${deal.carMake} ${deal.carModel}`;
    return `${dealType} Deal: ${dealName}`;
  }

  return (
    <Layout
      title={dealDisplayName(deal)}
      backPath={backPath}
      action={
        <>
          <Button
            sx={{ mr: 1 }}
            color="secondary"
            variant="outlined"
            disabled={analyzing}
            startIcon={
              analyzing ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <AutoAwesomeOutlinedIcon />
              )
            }
            onClick={handleAnalyze}
          >
            {analyzing ? "Analyzing…" : "Analyze"}
          </Button>
          <Button
            color="info"
            onClick={() => setEditOpen(true)}
            variant="outlined"
            startIcon={<EditOutlinedIcon />}
          >
            Edit
          </Button>
        </>
      }
    >
      {analysisError && (
        <Alert severity="error" onClose={clearError} sx={{ mb: 2 }}>
          {analysisError}
        </Alert>
      )}

      <Grid container spacing={2} sx={{ alignItems: "flex-start" }}>
        <Grid size={{ xs: 12, md: latestRevision ? 5 : 12 }}>
          <DealDetail
            deal={deal}
          />
        </Grid>

        {(latestRevision || analyzing) && (
          <Grid size={{ xs: 12, md: 7 }}>
            <AnalysisPanel revision={latestRevision} analyzing={analyzing} />
          </Grid>
        )}
      </Grid>

      {/* ── Edit dialog ── */}
      <Dialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {deal.type === "purchase" ? "Edit Purchase Deal" : "Edit Lease Deal"}
          <IconButton
            onClick={() => setEditOpen(false)}
            size="small"
            aria-label="close"
          >
            <CloseIcon sx={{ fontSize: "large", color: "text.secondary" }} />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {deal.type === "purchase" ? (
            <PurchaseForm
              initial={deal}
              onSave={(d) => handleSave(d as PurchaseDeal)}
              onCancel={() => setEditOpen(false)}
            />
          ) : (
            <LeaseForm
              initial={deal}
              onSave={(d) => handleSave(d as LeaseDeal)}
              onCancel={() => setEditOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
}

function AnalysisPanel({
  revision,
  analyzing,
}: {
  revision?: DealRevision;
  analyzing?: boolean;
}) {
  const [followUpsOpen, setFollowUpsOpen] = useState(false);

  let followUpMD = "### Follow Ups:\n";
  if (revision?.followUps) {
    revision.followUps.map((fu) => {
      followUpMD += `1. ${fu.instructions} ${fu.fieldName ? `(${fu.fieldName})` : ""}\n`;
    });
  }

  return (
    <Paper variant="outlined" sx={{ p: 2.5 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 1,
        }}
      >
        <Typography variant="h5">
          {analyzing ? "Analyzing..." : "Analysis"}
        </Typography>
        {revision?.followUps && (
          <TaxiAlertIcon color="warning" />
        )}
      </Box>
      <Divider sx={{ mb: 1.5 }} />
      {analyzing && (
        <Box sx={{ textAlign: "center" }}>
          <CircularProgress color="info" aria-label="Loading…" />
        </Box>
      )}
      {!analyzing && (
        <>
          <MarkdownContent>{followUpMD}</MarkdownContent>
          <Divider sx={{ mb: 1.5 }} />
          <MarkdownContent>{revision?.analysis ?? ""}</MarkdownContent>
        </>
      )}
    </Paper>
  );
}

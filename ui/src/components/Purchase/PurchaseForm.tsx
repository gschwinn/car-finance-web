import type { PurchaseDeal } from "@/types";
import { useState, useEffect } from "react";

import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import InputAdornment from "@mui/material/InputAdornment";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";

import { Button } from "../shared/Button";
import { NotesField } from "@/components/shared/NotesField";
import { StatTile } from "@/components/shared/StatTile";
import {
  purchaseMonthlyPayment,
  purchaseTotalCost,
  purchaseTotalInterest,
  formatCurrency,
} from "@/utils/calculations";
import { defaultPurchase, LOAN_TERMS } from "@/utils/defaults";

interface PurchaseFormProps {
  initial: Partial<PurchaseDeal>;
  onSave: (data: PurchaseDeal) => void;
  onCancel: () => void;
}

function SectionLabel({ children }: { children: string }) {
  return (
    <Divider textAlign="left" sx={{ my: 0.5 }}>
      <Typography variant="overline" color="text.disabled">
        {children}
      </Typography>
    </Divider>
  );
}

export default function PurchaseForm({
  initial,
  onSave,
  onCancel,
}: PurchaseFormProps) {
  const [form, setForm] = useState<PurchaseDeal>(() => ({
    ...defaultPurchase(),
    ...initial,
  }));
  const [interestRateInput, setInterestRateInput] = useState<string>(() =>
    initial.interestRate !== undefined
      ? (initial.interestRate * 100).toFixed(2)
      : "",
  );
  const [taxRateInput, setTaxRateInput] = useState<string>(() =>
    initial.taxRate !== undefined ? (initial.taxRate * 100).toFixed(2) : "",
  );

  useEffect(() => {
    setForm({ ...defaultPurchase(), ...initial });
    setInterestRateInput(
      initial.interestRate !== undefined
        ? (initial.interestRate * 100).toFixed(2)
        : "",
    );
    setTaxRateInput(
      initial.taxRate !== undefined ? (initial.taxRate * 100).toFixed(2) : "",
    );
  }, [initial]);

  function set<K extends keyof PurchaseDeal>(field: K, value: PurchaseDeal[K]) {
    setForm((f) => ({ ...f, [field]: value }));
  }
  const num = (v: string): number => parseFloat(v) || 0;

  const preview = {
    monthly: purchaseMonthlyPayment(form),
    total: purchaseTotalCost(form),
    interest: purchaseTotalInterest(form),
  };

  const canSave =
    form.carMake.trim() && form.carModel.trim() && form.negotiatedPrice > 0;

  function commitInterestRateInput(): number {
    const parsed = num(interestRateInput);
    const normalized = Math.min(30, Math.max(0, parsed));
    set("interestRate", normalized / 100);
    setInterestRateInput(normalized ? normalized.toFixed(2) : "");
    return normalized / 100;
  }

  function commitTaxRateInput(): number {
    const parsed = num(taxRateInput);
    const normalized = Math.min(20, Math.max(0, parsed));
    set("taxRate", normalized / 100);
    setTaxRateInput(normalized ? normalized.toFixed(2) : "");
    return normalized / 100;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSave) return;
    const interestRate = commitInterestRateInput();
    const taxRate = commitTaxRateInput();
    onSave({ ...form, interestRate, taxRate });
  }

  return (
    <Stack component="form" onSubmit={handleSubmit} spacing={2} sx={{ p: 2.5 }}>
      {/* ── Preview banner ── */}
      {form.negotiatedPrice > 0 && (
        <Grid container spacing={1}>
          <StatTile
            label="Monthly"
            value={formatCurrency(preview.monthly)}
            color="success"
          />
          <StatTile
            label="Total"
            value={formatCurrency(preview.total)}
            color="primary.light"
          />
          <StatTile
            label="Interest"
            value={formatCurrency(preview.interest)}
            color="warning"
          />
        </Grid>
      )}

      {/* ── Deal name ── */}
      <SectionLabel>Deal Name</SectionLabel>
      <TextField
        label="Label (optional)"
        placeholder="Auto-generated from make/model if blank"
        value={form.name}
        onChange={(e) => set("name", e.target.value)}
        helperText="e.g. Honda Accord – Dealer A"
        size="small"
        fullWidth
      />

      {/* ── Vehicle ── */}
      <SectionLabel>Vehicle</SectionLabel>
      <Grid container spacing={2}>
        <Grid size={6}>
          <TextField
            label="Make *"
            placeholder="Honda"
            value={form.carMake}
            size="small"
            fullWidth
            required
            onChange={(e) => set("carMake", e.target.value)}
          />
        </Grid>
        <Grid size={6}>
          <TextField
            label="Model *"
            placeholder="Accord"
            value={form.carModel}
            size="small"
            fullWidth
            required
            onChange={(e) => set("carModel", e.target.value)}
          />
        </Grid>
        <Grid size={6}>
          <TextField
            label="Year"
            type="number"
            value={form.carYear}
            size="small"
            fullWidth
            onChange={(e) => set("carYear", parseInt(e.target.value) || 2025)}
            slotProps={{ htmlInput: { min: 2000, max: 2030 } }}
          />
        </Grid>
        <Grid size={6}>
          <TextField
            label="Trim Level"
            placeholder="EX-L"
            value={form.trimLevel}
            size="small"
            fullWidth
            onChange={(e) => set("trimLevel", e.target.value)}
          />
        </Grid>
      </Grid>

      {/* ── Pricing ── */}
      <SectionLabel>Pricing</SectionLabel>
      <Grid container spacing={2}>
        <Grid size={6}>
          <TextField
            label="MSRP"
            type="number"
            value={form.msrp || ""}
            size="small"
            fullWidth
            onChange={(e) => set("msrp", num(e.target.value))}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">$</InputAdornment>
                ),
              },
              htmlInput: { min: 0 },
            }}
          />
        </Grid>
        <Grid size={6}>
          <TextField
            label="Negotiated Price *"
            type="number"
            value={form.negotiatedPrice || ""}
            size="small"
            fullWidth
            required
            onChange={(e) => set("negotiatedPrice", num(e.target.value))}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">$</InputAdornment>
                ),
              },
              htmlInput: { min: 0 },
            }}
          />
        </Grid>
        <Grid size={6}>
          <TextField
            label="Down Payment"
            type="number"
            value={form.downPayment || ""}
            size="small"
            fullWidth
            onChange={(e) => set("downPayment", num(e.target.value))}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">$</InputAdornment>
                ),
              },
              htmlInput: { min: 0 },
            }}
          />
        </Grid>
        <Grid size={6}>
          <TextField
            label="Trade-In Value"
            type="number"
            value={form.tradeInValue || ""}
            size="small"
            fullWidth
            onChange={(e) => set("tradeInValue", num(e.target.value))}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">$</InputAdornment>
                ),
              },
              htmlInput: { min: 0 },
            }}
          />
        </Grid>
        <Grid size={6}>
          <TextField
            label="Incentives"
            type="number"
            value={form.mfrIncentives || ""}
            size="small"
            fullWidth
            onChange={(e) => set("mfrIncentives", num(e.target.value))}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">$</InputAdornment>
                ),
              },
              htmlInput: { min: 0 },
            }}
          />
        </Grid>
        <Grid size={6}>
          <TextField
            label="Doc Fee"
            type="number"
            value={form.docFee || ""}
            size="small"
            fullWidth
            onChange={(e) => set("docFee", num(e.target.value))}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">$</InputAdornment>
                ),
              },
              htmlInput: { min: 0 },
            }}
          />
        </Grid>
        <Grid size={6}>
          <TextField
            label="Addl Dealer Fees"
            type="number"
            value={form.addlDealerFees || ""}
            size="small"
            fullWidth
            onChange={(e) => set("addlDealerFees", num(e.target.value))}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">$</InputAdornment>
                ),
              },
              htmlInput: { min: 0 },
            }}
          />
        </Grid>
        <Grid size={6}>
          <TextField
            label="Govt Fees"
            type="number"
            value={form.govtFees || ""}
            size="small"
            fullWidth
            onChange={(e) => set("govtFees", num(e.target.value))}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">$</InputAdornment>
                ),
              },
              htmlInput: { min: 0 },
            }}
          />
        </Grid>

      </Grid>

      {/* ── Loan terms ── */}
      <SectionLabel>Loan Terms</SectionLabel>
      <ToggleButtonGroup
        value={form.loanTermMonths}
        exclusive
        onChange={(_, val) => val !== null && set("loanTermMonths", val)}
        size="small"
        fullWidth
      >
        {LOAN_TERMS.map((mo) => (
          <ToggleButton key={mo} value={mo}>
            {mo} mo
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
      <Grid container spacing={2}>
        <Grid size={6}>
          <TextField
            label="APR (%)"
            type="number"
            value={interestRateInput}
            onChange={(e) => setInterestRateInput(e.target.value)}
            onBlur={commitInterestRateInput}
            helperText="e.g. 4.9 for 4.9%"
            size="small"
            fullWidth
            slotProps={{
              input: {
                endAdornment: <InputAdornment position="end">%</InputAdornment>,
              },
              htmlInput: { min: 0, max: 30, step: 0.001 },
            }}
          />
        </Grid>
        <Grid size={6}>
          <TextField
            label="Tax Rate (%)"
            type="number"
            value={taxRateInput}
            onChange={(e) => setTaxRateInput(e.target.value)}
            onBlur={commitTaxRateInput}
            helperText="e.g. 8.5 for 8.5%"
            size="small"
            fullWidth
            slotProps={{
              input: {
                endAdornment: <InputAdornment position="end">%</InputAdornment>,
              },
              htmlInput: { min: 0, max: 20, step: 0.001 },
            }}
          />
        </Grid>
        
      </Grid>

      {/* ── Notes ── */}
      <NotesField value={form.notes ?? ''} onChange={(v) => set('notes', v)} />

      {/* ── Footer ── */}
      <Box
        sx={{
          display: "flex",
          gap: 1.5,
          pt: 1,
          borderTop: 1,
          borderColor: "divider",
        }}
      >
        <Button
          color="info"
          onClick={onCancel}
          variant="outlined"
          fullWidth
        >
          Cancel
        </Button>
        <Button
          type="submit"
          color="primary"
          variant="contained"
          fullWidth
          disabled={!canSave}
        >
          Save Deal
        </Button>
      </Box>
    </Stack>
  );
}

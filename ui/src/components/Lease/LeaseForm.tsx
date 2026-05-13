import type { LeaseDeal, LeaseTaxMethod } from "@/types";
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

import {
  leaseMonthlyPayment,
  leaseTotalCost,
  leaseDueAtSigning,
  leaseResidualValue,
  leaseRolledMonthlyPayment,
  leaseRolledDueAtSigning,
  leaseRolledTotalCost,
  moneyFactorToAPR,
  formatCurrency,
} from "@/utils/calculations";
import { defaultLease, LEASE_TERMS, MILEAGE_OPTS } from "@/utils/defaults";
import { StatTile } from "@/components/shared/StatTile";
import { Button } from "../shared/Button";
import { NotesField } from "@/components/shared/NotesField";

interface LeaseFormProps {
  initial: Partial<LeaseDeal>;
  onSave: (data: LeaseDeal) => void;
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

export default function LeaseForm({
  initial,
  onSave,
  onCancel,
}: LeaseFormProps) {
  const [form, setForm] = useState<LeaseDeal>(() => ({
    ...defaultLease(),
    ...initial,
  }));
  const [residualPercentInput, setResidualPercentInput] = useState<string>(
    () =>
      initial.residualPercent !== undefined
        ? (initial.residualPercent * 100).toFixed(2)
        : "",
  );
  const [taxRateInput, setTaxRateInput] = useState<string>(() =>
    initial.taxRate !== undefined ? (initial.taxRate * 100).toFixed(3) : "",
  );

  useEffect(() => {
    setForm({ ...defaultLease(), ...initial });
    setResidualPercentInput(
      initial.residualPercent !== undefined
        ? (initial.residualPercent * 100).toFixed(2)
        : "",
    );
    setTaxRateInput(
      initial.taxRate !== undefined ? (initial.taxRate * 100).toFixed(3) : "",
    );
  }, [initial]);

  function set<K extends keyof LeaseDeal>(field: K, value: LeaseDeal[K]) {
    setForm((f) => ({ ...f, [field]: value }));
  }
  const num = (v: string): number => parseFloat(v) || 0;

  const preview =
    form.msrp > 0
      ? {
          monthly: leaseMonthlyPayment(form),
          total: leaseTotalCost(form),
          dueAtSigning: leaseDueAtSigning(form),
          residual: leaseResidualValue(form),
          equivAPR: moneyFactorToAPR(form.moneyFactor),
          rolledMonthly: leaseRolledMonthlyPayment(form),
          rolledDueAtSigning: leaseRolledDueAtSigning(form),
          rolledTotal: leaseRolledTotalCost(form),
        }
      : null;

  const canSave = form.carMake.trim() && form.carModel.trim() && form.msrp > 0;

  function commitResidualPercentInput(): number {
    const parsed = num(residualPercentInput);
    const normalized = Math.min(100, Math.max(0, parsed));
    set("residualPercent", normalized / 100);
    setResidualPercentInput(normalized ? normalized.toFixed(2) : "");
    return normalized / 100;
  }

  function commitTaxRateInput(): number {
    const parsed = num(taxRateInput);
    const normalized = Math.min(20, Math.max(0, parsed));
    set("taxRate", normalized / 100);
    setTaxRateInput(normalized ? normalized.toFixed(3) : "");
    return normalized / 100;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSave) return;
    const residualPercent = commitResidualPercentInput();
    const taxRate = commitTaxRateInput();
    onSave({ ...form, residualPercent, taxRate });
  }

  return (
    <Stack component="form" onSubmit={handleSubmit} spacing={2} sx={{ p: 2.5 }}>
      {/* ── Preview banner ── */}
      {preview && (
        <Box>
          <Grid container spacing={1}>
            <StatTile
              label="Monthly"
              value={formatCurrency(preview.monthly)}
              color="success"
            />
            <StatTile
              label="Due at Signing"
              value={formatCurrency(preview.dueAtSigning)}
              color="primary.light"
            />
            <StatTile
              label="Equiv APR"
              value={`${preview.equivAPR.toFixed(2)}%`}
              color="warning"
            />
          </Grid>
          <Typography variant="caption" color="textDisabled" sx={{ mt: 1, display: "block" }}>
            Fees rolled in
          </Typography>
          <Grid container spacing={1} sx={{ mt: 0 }}>
            <StatTile
              label="Monthly"
              value={formatCurrency(preview.rolledMonthly)}
              color="success"
            />
            <StatTile
              label="Due at Signing"
              value={formatCurrency(preview.rolledDueAtSigning)}
              color="primary.light"
            />
            <StatTile
              label="Total"
              value={formatCurrency(preview.rolledTotal)}
              color="warning"
            />
          </Grid>
        </Box>
      )}

      {/* ── Deal name ── */}
      <SectionLabel>Deal Name</SectionLabel>
      <TextField
        label="Label (optional)"
        placeholder="Auto-generated from make/model if blank"
        value={form.name}
        onChange={(e) => set("name", e.target.value)}
        helperText="e.g. BMW 3 Series – BMW of Philly"
        size="small"
        fullWidth
      />

      {/* ── Vehicle ── */}
      <SectionLabel>Vehicle</SectionLabel>
      <Grid container spacing={2}>
        <Grid size={6}>
          <TextField
            label="Make *"
            placeholder="BMW"
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
            placeholder="330i"
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
            placeholder="xDrive"
            value={form.trimLevel}
            size="small"
            fullWidth
            onChange={(e) => set("trimLevel", e.target.value)}
          />
        </Grid>
      </Grid>

      {/* ── Lease Terms ── */}
      <SectionLabel>Lease Terms</SectionLabel>
      <Grid container spacing={2}>
        <Grid size={6}>
          <TextField
            label="MSRP *"
            type="number"
            value={form.msrp || ""}
            size="small"
            fullWidth
            required
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
            label="Mfr Incentives"
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
            label="Residual %"
            type="number"
            value={residualPercentInput}
            onChange={(e) => setResidualPercentInput(e.target.value)}
            onBlur={commitResidualPercentInput}
            helperText="e.g. 55 for 55%"
            size="small"
            fullWidth
            slotProps={{
              input: {
                endAdornment: <InputAdornment position="end">%</InputAdornment>,
              },
              htmlInput: { min: 0, max: 100, step: 0.01 },
            }}
          />
        </Grid>
        <Grid size={6}>
          <TextField
            label="Money Factor"
            type="number"
            value={form.moneyFactor || ""}
            onChange={(e) => set("moneyFactor", num(e.target.value))}
            helperText="e.g. 0.00125"
            size="small"
            fullWidth
            slotProps={{
              input: { sx: { fontFamily: "monospace" } },
              htmlInput: { min: 0, step: 0.00001 },
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

      {/* ── Tax Method ── */}
      <SectionLabel>Tax Method</SectionLabel>
      <ToggleButtonGroup
        color="primary"
        value={form.leaseTaxMethod}
        exclusive
        onChange={(_, val) => val !== null && set("leaseTaxMethod", val as LeaseTaxMethod)}
        size="small"
        fullWidth
      >
        <ToggleButton value="monthly">Monthly</ToggleButton>
        <ToggleButton value="upfront_payments">Upfront (Payments)</ToggleButton>
        <ToggleButton value="upfront_full_price">Upfront (Full Price)</ToggleButton>
      </ToggleButtonGroup>
      <Typography variant="caption" color="text.secondary" sx={{ mt: -1 }}>
        {form.leaseTaxMethod === 'monthly' &&
          'Tax is applied to each monthly payment. Most states use this method: CA, NY, FL, NJ, VA, CO, WA, GA, PA, and others.'}
        {form.leaseTaxMethod === 'upfront_payments' &&
          'Tax on the total of all lease payments is collected at signing. Monthly payments show as pre-tax. Common in TX, AZ.'}
        {form.leaseTaxMethod === 'upfront_full_price' &&
          'Tax on the full vehicle selling price is due at signing — the same as buying the car outright. Results in a much larger due-at-signing. Common in IL, MN.'}
      </Typography>

      {/* ── Lease Term selector ── */}
      <Typography variant="caption" color="text.secondary">
        Lease Term
      </Typography>
      <ToggleButtonGroup
        color="primary"
        value={form.leaseTermMonths}
        exclusive
        onChange={(_, val) => val !== null && set("leaseTermMonths", val)}
        size="small"
        fullWidth
      >
        {LEASE_TERMS.map((mo) => (
          <ToggleButton key={mo} value={mo}>
            {mo} mo
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      {/* ── Mileage selector ── */}
      <Typography variant="caption" color="text.secondary">
        Annual Mileage
      </Typography>
      <ToggleButtonGroup
        color="primary"
        value={form.mileageAllowancePerYear}
        exclusive
        onChange={(_, val) =>
          val !== null && set("mileageAllowancePerYear", val)
        }
        size="small"
        fullWidth
      >
        {MILEAGE_OPTS.map((mi) => (
          <ToggleButton key={mi} value={mi}>
            {mi / 1000}k mi
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      {/* ── Upfront costs ── */}
      <SectionLabel>Upfront Costs</SectionLabel>
      <Grid container spacing={2}>
        <Grid size={6}>
          <TextField
            label="Cap Cost Reduction"
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
              htmlInput: { min: 0, step: 100 },
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
            helperText="Reduces cap cost, not taxed"
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
            label="Acquisition Fee"
            type="number"
            value={form.acquisitionFee || ""}
            size="small"
            fullWidth
            onChange={(e) => set("acquisitionFee", num(e.target.value))}
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
            helperText="Taxable"
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
            helperText="Taxable"
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
        <Grid size={6}>
          <TextField
            label="Security Deposit"
            type="number"
            value={form.securityDeposit || ""}
            size="small"
            fullWidth
            onChange={(e) => set("securityDeposit", num(e.target.value))}
            helperText="Refundable, not taxed"
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
            label="Disposition Fee"
            type="number"
            value={form.dispositionFee || ""}
            size="small"
            fullWidth
            onChange={(e) => set("dispositionFee", num(e.target.value))}
            helperText="Due at lease end"
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

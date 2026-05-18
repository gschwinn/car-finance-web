import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import Slider from '@mui/material/Slider'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import IconButton from '@mui/material/IconButton'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import AddIcon from '@mui/icons-material/Add'
import RemoveIcon from '@mui/icons-material/Remove'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutlined'

import { Layout } from '@/components/layout/layout'
import { Button } from '@/components/shared/Button'
import {
  leaseMonthlyPayment,
  leaseDueAtSigning,
  leaseTotalCost,
  purchaseMonthlyPayment,
  purchaseTotalCost,
  purchaseTotalInterest,
  moneyFactorToAPR,
  formatCurrency,
} from '@/utils/calculations'
import type { LeaseDeal, PurchaseDeal } from '@/types'
import { LEASE_TERMS, LOAN_TERMS } from '@/utils/defaults'

export type LearnPageProps = { dealType: 'lease' | 'purchase' }

// ── Sandbox baseline deals ────────────────────────────────────────────────────

const LEASE_BASE: LeaseDeal = {
  id: null, type: 'lease', name: '', createdAt: null,
  carMake: '', carModel: '', carYear: 2025, trimLevel: '',
  msrp:                    50_000,
  negotiatedPrice:         48_000,
  mfrIncentives:           0,
  tradeInValue:            0,
  downPayment:             0,
  acquisitionFee:          595,
  docFee:                  0,
  addlDealerFees:          0,
  govtFees:                0,
  securityDeposit:         0,
  dispositionFee:          395,
  residualPercent:         0.64,
  moneyFactor:             0.00125,
  leaseTermMonths:         36,
  mileageAllowancePerYear: 10_000,
  taxRate:                 0.08,
  leaseTaxMethod:          'monthly',
}

const PURCHASE_BASE: PurchaseDeal = {
  id: null, type: 'purchase', name: '', createdAt: null,
  carMake: '', carModel: '', carYear: 2025, trimLevel: '',
  msrp:            50_000,
  negotiatedPrice: 48_000,
  mfrIncentives:   0,
  tradeInValue:    0,
  downPayment:     2_000,
  docFee:          0,
  addlDealerFees:  0,
  govtFees:        0,
  securityDeposit: 0,
  dispositionFee:  0,
  loanTermMonths:  60,
  interestRate:    0.059,
  taxRate:         0.08,
}

// ── Shared UI helpers ─────────────────────────────────────────────────────────

function SectionPaper({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Paper variant="outlined" sx={{ mb: 3, overflow: 'hidden' }}>
      <Divider textAlign="left" sx={{ px: 2, pt: 2, pb: 1.5, borderColor: 'divider' }}>
        <Typography variant="overline" color="textDisabled" sx={{ letterSpacing: 1.5 }}>
          {label}
        </Typography>
      </Divider>
      <Box sx={{ p: 2.5, pt: 1.5 }}>{children}</Box>
    </Paper>
  )
}

function DeltaChip({ delta }: { delta: number }) {
  if (Math.abs(delta) < 0.5) return null
  const better = delta < 0
  return (
    <Chip
      size="small"
      label={`${better ? '−' : '+'}${formatCurrency(Math.abs(delta))}`}
      color={better ? 'success' : 'error'}
      variant="outlined"
      sx={{ fontSize: '0.68rem', height: 20, ml: 0.5 }}
    />
  )
}

function ResultTile({
  label,
  value,
  baseline,
}: {
  label: string
  value: number
  baseline: number
}) {
  const delta = value - baseline
  return (
    <Box
      sx={{
        textAlign: 'center',
        p: 2,
        borderRadius: 1,
        backgroundColor: 'rgb(15 23 42)',
        border: '1px solid rgb(51 65 85)',
      }}
    >
      <Typography variant="caption" color="textDisabled" sx={{ display: 'block', mb: 0.5 }}>
        {label}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: 0.5 }}>
        <Typography variant="h6" color="primary.main" sx={{ lineHeight: 1 }}>
          {formatCurrency(value)}
        </Typography>
        <DeltaChip delta={delta} />
      </Box>
      {Math.abs(delta) >= 0.5 && (
        <Typography variant="caption" color="textDisabled" sx={{ mt: 0.5, display: 'block' }}>
          vs {formatCurrency(baseline)} baseline
        </Typography>
      )}
    </Box>
  )
}

function ControlRow({
  label,
  helper,
  children,
}: {
  label: string
  helper: string
  children: React.ReactNode
}) {
  return (
    <Box sx={{ mb: 2.5 }}>
      <Typography variant="subtitle2" sx={{ mb: 0.25 }}>
        {label}
      </Typography>
      <Typography variant="caption" color="textDisabled" sx={{ display: 'block', mb: 1 }}>
        {helper}
      </Typography>
      {children}
    </Box>
  )
}

function StepperControl({
  onDecrement,
  onIncrement,
  display,
}: {
  onDecrement: () => void
  onIncrement: () => void
  display: string
}) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <IconButton size="small" onClick={onDecrement} sx={{ border: '1px solid', borderColor: 'divider' }}>
        <RemoveIcon sx={{ fontSize: 16 }} />
      </IconButton>
      <Typography variant="body2" sx={{ minWidth: 140, textAlign: 'center' }}>
        {display}
      </Typography>
      <IconButton size="small" onClick={onIncrement} sx={{ border: '1px solid', borderColor: 'divider' }}>
        <AddIcon sx={{ fontSize: 16 }} />
      </IconButton>
    </Box>
  )
}

// ── Glossary data ─────────────────────────────────────────────────────────────

const LEASE_TERMS_GLOSSARY = [
  {
    term: 'MSRP',
    def: "The manufacturer's sticker price. Residual value is calculated as a percentage of MSRP, so a higher MSRP means a higher residual in dollars.",
  },
  {
    term: 'Cap Cost',
    def: 'Short for Capitalized Cost — the effective vehicle price the lease is based on. Equals negotiated price minus down payment, trade-in, and incentives. Lower is better.',
  },
  {
    term: 'Money Factor',
    def: 'The lease financing rate expressed as a small decimal (e.g. 0.00125). Multiply by 2,400 to get the equivalent APR. Set monthly by the manufacturer — dealers can mark it up.',
  },
  {
    term: 'Residual Value',
    def: "The car's projected value at lease end, set by the lender as a percentage of MSRP. You can't negotiate it. A higher residual means less depreciation and a lower monthly payment.",
  },
  {
    term: 'Acquisition Fee',
    def: "A lender fee charged by the leasing company, typically $695–$1,200. Non-negotiable, but ask for it to appear as a separate line item so you can see exactly what you're paying.",
  },
  {
    term: 'Cap Cost Reduction',
    def: "Cash paid upfront that lowers your cap cost (and monthly payment). Unlike buying, putting money down on a lease is usually not recommended — if the car is totaled, you lose that money.",
  },
  {
    term: 'Disposition Fee',
    def: 'A fee due at lease end if you return the car without leasing or buying another from the same brand. Typically $300–$500. Often waivable when you start a new lease.',
  },
  {
    term: 'Due at Signing',
    def: 'Total cash owed on delivery day: first month, acquisition fee, down payment, applicable taxes, and government fees. A key number to negotiate.',
  },
  {
    term: 'Money Factor Markup',
    def: 'Dealers are allowed to add up to ~0.0004 to the manufacturer\'s "buy rate." Always ask what the base rate is for your model/trim that month.',
  },
]

const PURCHASE_TERMS_GLOSSARY = [
  {
    term: 'Principal',
    def: 'The loan amount: negotiated price minus your down payment and trade-in. This is the base on which interest accrues — lower is always better.',
  },
  {
    term: 'APR',
    def: 'Annual Percentage Rate — your loan\'s annualized interest rate. Even a 1% difference compounds to hundreds or thousands of dollars over a typical 60-month loan.',
  },
  {
    term: 'Amortization',
    def: 'How loan payments split between interest and principal over time. Early payments are mostly interest. By the end, most of each payment goes toward principal.',
  },
  {
    term: 'Loan Term',
    def: 'Number of months to repay. A longer term lowers the monthly payment but significantly increases total interest paid. 60 months is common; 72–84 adds up fast.',
  },
  {
    term: 'Total Interest',
    def: 'The sum of all interest paid over the loan life. Compare this across offers to see the true cost of different APR or term combinations.',
  },
  {
    term: 'Out-the-Door Price',
    def: 'The all-in amount including taxes, government fees, doc fees, and dealer add-ons. This is the number to anchor negotiations to — not just the vehicle price.',
  },
  {
    term: 'Effective Monthly',
    def: 'Total cost divided by loan term. Accounts for your down payment, giving a fairer comparison across deals with different upfront structures.',
  },
  {
    term: 'Pre-approval',
    def: "Getting a loan offer from your bank or credit union before visiting the dealer. This gives you a rate benchmark and removes the dealer's leverage over financing.",
  },
]

// ── How It Works prose ────────────────────────────────────────────────────────

function LeaseHowItWorks() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Typography variant="body2" color="textSecondary">
        A lease is essentially a long-term rental. You pay for the portion of the car's value you
        consume during the term, plus a financing charge — then return the car at the end. You never
        own the vehicle and build no equity in it.
      </Typography>
      <Typography variant="body2" color="textSecondary">
        Your monthly payment is driven by two numbers: <strong>depreciation</strong> (how much the
        car loses in value over your term) and a <strong>finance charge</strong> (the cost of
        borrowing). Depreciation is the spread between the cap cost and the residual value, divided
        by the number of months. The finance charge is (cap cost + residual) × money factor.
      </Typography>
      <Typography variant="body2" color="textSecondary">
        Unlike purchasing, you can't negotiate the residual value or money factor — those are set
        monthly by the manufacturer. What you <em>can</em> negotiate is the selling price (cap
        cost). A dealer can also mark up the money factor, so always ask for the "buy rate" and
        verify it against published data for that month.
      </Typography>
    </Box>
  )
}

function PurchaseHowItWorks() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Typography variant="body2" color="textSecondary">
        When you finance a car, a lender pays the dealer and you repay the lender over time with
        interest. Your monthly payment is calculated so that the final payment retires the loan
        exactly — this is called amortization.
      </Typography>
      <Typography variant="body2" color="textSecondary">
        The two levers that most affect your total cost are <strong>APR</strong> and{' '}
        <strong>loan term</strong>. A lower APR directly reduces interest. A longer term lowers
        your monthly payment but significantly increases the total interest you pay — the
        sandbox below makes this tradeoff concrete.
      </Typography>
      <Typography variant="body2" color="textSecondary">
        Get pre-approved from your bank or credit union before visiting the dealer. This gives you
        a rate benchmark to compare against dealer financing, and removes the dealer's leverage
        over the financing portion of the negotiation entirely.
      </Typography>
    </Box>
  )
}

// ── Glossary grid ─────────────────────────────────────────────────────────────

function Glossary({ items }: { items: { term: string; def: string }[] }) {
  return (
    <Grid container spacing={1.5}>
      {items.map(({ term, def }) => (
        <Grid key={term} size={{ xs: 12, sm: 6, lg: 4 }}>
          <Box
            sx={{
              p: 2,
              height: '100%',
              borderRadius: 1,
              border: '1px solid rgb(51 65 85)',
              backgroundColor: 'rgb(15 23 42)',
            }}
          >
            <Typography variant="subtitle2" color="primary.main" sx={{ mb: 0.5 }}>
              {term}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              {def}
            </Typography>
          </Box>
        </Grid>
      ))}
    </Grid>
  )
}

// ── Sandbox disclaimers ───────────────────────────────────────────────────────

function LeaseTaxDisclaimer() {
  return (
    <Box
      sx={{
        p: 1.5,
        mb: 2.5,
        borderRadius: 1,
        border: '1px solid',
        borderColor: 'warning.dark',
        backgroundColor: 'rgba(234,179,8,0.07)',
      }}
    >
      <Typography variant="caption" color="warning.light" sx={{ display: 'block', fontWeight: 600, mb: 0.5 }}>
        Taxes &amp; fees excluded by default
      </Typography>
      <Typography variant="caption" color="text.secondary">
        Set your state's sales tax rate below to include it — taxes have an outsized impact on lease
        payments. <strong>How tax is collected varies significantly by state:</strong> most states
        (CA, FL, NY, NJ, VA) add tax to each monthly payment; TX and AZ collect all lease taxes as
        a lump sum at signing; IL and MN tax the full vehicle price at signing, like a purchase.
        This sandbox uses the monthly method only — actual due-at-signing will differ in TX, AZ, IL,
        and MN. Acquisition fees, doc fees, and government fees are also excluded.
      </Typography>
    </Box>
  )
}

function PurchaseTaxDisclaimer() {
  return (
    <Box
      sx={{
        p: 1.5,
        mb: 2.5,
        borderRadius: 1,
        border: '1px solid',
        borderColor: 'warning.dark',
        backgroundColor: 'rgba(234,179,8,0.07)',
      }}
    >
      <Typography variant="caption" color="warning.light" sx={{ display: 'block', fontWeight: 600, mb: 0.5 }}>
        Taxes &amp; fees excluded by default
      </Typography>
      <Typography variant="caption" color="text.secondary">
        Set your state's sales tax rate below to include it in the financed amount. Doc fees,
        dealer fees, and government fees are excluded — budget an additional $500–$1,500 depending
        on your state and dealer. These are financed into the loan in this sandbox when a tax rate
        is set, which is typical but not universal.
      </Typography>
    </Box>
  )
}

// ── Lease Sandbox ─────────────────────────────────────────────────────────────

// Baseline negotiated price as a proportion of MSRP (matches LEASE_BASE defaults)
const LEASE_PRICE_RATIO = LEASE_BASE.negotiatedPrice / LEASE_BASE.msrp
const PURCHASE_PRICE_RATIO = PURCHASE_BASE.negotiatedPrice / PURCHASE_BASE.msrp

function defaultLeaseNegotiatedPrice(msrp: number) {
  return Math.round((msrp * LEASE_PRICE_RATIO) / 500) * 500
}
function defaultPurchaseNegotiatedPrice(msrp: number) {
  return Math.round((msrp * PURCHASE_RATIO) / 500) * 500
}

// keep a separate const so the ratio is only computed once
const PURCHASE_RATIO = PURCHASE_PRICE_RATIO

function LeaseSandbox() {
  const [msrp, setMsrp]                     = useState(LEASE_BASE.msrp)
  const [taxRate, setTaxRate]               = useState(0)
  const [negotiatedPrice, setNegotiatedPrice] = useState(LEASE_BASE.negotiatedPrice)
  const [moneyFactor, setMoneyFactor]       = useState(LEASE_BASE.moneyFactor)
  const [residualPercent, setResidualPercent] = useState(LEASE_BASE.residualPercent)
  const [leaseTermMonths, setLeaseTermMonths] = useState(LEASE_BASE.leaseTermMonths)
  const [downPayment, setDownPayment]       = useState(LEASE_BASE.downPayment)

  function handleMsrpChange(newMsrp: number) {
    setMsrp(newMsrp)
    setNegotiatedPrice(Math.min(defaultLeaseNegotiatedPrice(newMsrp), newMsrp))
    setMoneyFactor(LEASE_BASE.moneyFactor)
    setResidualPercent(LEASE_BASE.residualPercent)
    setLeaseTermMonths(LEASE_BASE.leaseTermMonths)
    setDownPayment(LEASE_BASE.downPayment)
  }

  // Baseline: proportional negotiated price, all other levers at defaults, current MSRP + tax
  const baseline = useMemo<LeaseDeal>(() => ({
    ...LEASE_BASE,
    msrp,
    taxRate,
    negotiatedPrice: Math.min(defaultLeaseNegotiatedPrice(msrp), msrp),
    moneyFactor:     LEASE_BASE.moneyFactor,
    residualPercent: LEASE_BASE.residualPercent,
    leaseTermMonths: LEASE_BASE.leaseTermMonths,
    downPayment:     LEASE_BASE.downPayment,
  }), [msrp, taxRate])

  const current = useMemo<LeaseDeal>(
    () => ({ ...LEASE_BASE, msrp, taxRate, negotiatedPrice, moneyFactor, residualPercent, leaseTermMonths, downPayment }),
    [msrp, taxRate, negotiatedPrice, moneyFactor, residualPercent, leaseTermMonths, downPayment],
  )

  const baseMonthly = leaseMonthlyPayment(baseline)
  const baseSigning = leaseDueAtSigning(baseline)
  const baseTotal   = leaseTotalCost(baseline)
  const curMonthly  = leaseMonthlyPayment(current)
  const curSigning  = leaseDueAtSigning(current)
  const curTotal    = leaseTotalCost(current)

  const mfStep = 0.00025
  const mfMin  = 0.00025
  const mfMax  = 0.00350
  const taxStep = 0.005
  const taxMax  = 0.15
  const msrpStep = 1_000
  const msrpMin  = 20_000
  const msrpMax  = 120_000
  const priceMin = Math.round(msrp * 0.85 / 500) * 500

  return (
    <Box>
      <LeaseTaxDisclaimer />
      <Grid container spacing={3}>
        {/* Controls */}
        <Grid size={{ xs: 12, md: 7 }}>
          <ControlRow
            label="Vehicle MSRP"
            helper="Set this to match your actual vehicle's sticker price. All other defaults scale proportionally."
          >
            <StepperControl
              display={formatCurrency(msrp)}
              onDecrement={() => handleMsrpChange(Math.max(msrpMin, msrp - msrpStep))}
              onIncrement={() => handleMsrpChange(Math.min(msrpMax, msrp + msrpStep))}
            />
          </ControlRow>

          <ControlRow
            label="Negotiated Price"
            helper="The selling price you negotiate with the dealer. Baseline is the proportional default for the MSRP above."
          >
            <Slider
              value={negotiatedPrice}
              min={priceMin}
              max={msrp}
              step={500}
              onChange={(_, v) => setNegotiatedPrice(v as number)}
              valueLabelDisplay="auto"
              valueLabelFormat={(v) => formatCurrency(v)}
            />
            <Typography variant="caption" color="textDisabled">
              {formatCurrency(negotiatedPrice)}
              {negotiatedPrice < msrp && (
                <> &nbsp;·&nbsp; {((1 - negotiatedPrice / msrp) * 100).toFixed(1)}% off MSRP</>
              )}
            </Typography>
          </ControlRow>

          <ControlRow
            label="Money Factor"
            helper="The financing rate for the lease. Lower is better. Multiply by 2,400 to get the APR equivalent."
          >
            <StepperControl
              display={`${moneyFactor.toFixed(5)}  ·  ${moneyFactorToAPR(moneyFactor).toFixed(2)}% APR equiv.`}
              onDecrement={() => setMoneyFactor((v) => Math.max(mfMin, parseFloat((v - mfStep).toFixed(5))))}
              onIncrement={() => setMoneyFactor((v) => Math.min(mfMax, parseFloat((v + mfStep).toFixed(5))))}
            />
          </ControlRow>

          <ControlRow
            label="Residual Value"
            helper="The car's projected worth at lease end, set by the manufacturer. Higher residual = lower monthly."
          >
            <Slider
              value={residualPercent}
              min={0.40}
              max={0.70}
              step={0.01}
              onChange={(_, v) => setResidualPercent(v as number)}
              valueLabelDisplay="auto"
              valueLabelFormat={(v) => `${(v * 100).toFixed(0)}%`}
            />
            <Typography variant="caption" color="textDisabled">
              {(residualPercent * 100).toFixed(0)}%
              &nbsp;·&nbsp;
              {formatCurrency(msrp * residualPercent)} of {formatCurrency(msrp)} MSRP
            </Typography>
          </ControlRow>

          <ControlRow
            label="Lease Term"
            helper="Longer terms spread depreciation over more months, lowering the monthly — but you're in the car longer."
          >
            <ToggleButtonGroup
              value={leaseTermMonths}
              exclusive
              onChange={(_, v) => v !== null && setLeaseTermMonths(v)}
              size="small"
            >
              {LEASE_TERMS.map((t) => (
                <ToggleButton key={t} value={t}>{t} mo</ToggleButton>
              ))}
            </ToggleButtonGroup>
          </ControlRow>

          <ControlRow
            label="Down Payment (Cap Cost Reduction)"
            helper="Upfront cash that lowers the cap cost and monthly payment. Not recommended — you lose it if the car is totaled."
          >
            <Slider
              value={downPayment}
              min={0}
              max={Math.round(msrp * 0.15 / 500) * 500}
              step={500}
              onChange={(_, v) => setDownPayment(v as number)}
              valueLabelDisplay="auto"
              valueLabelFormat={(v) => formatCurrency(v)}
            />
            <Typography variant="caption" color="textDisabled">
              {formatCurrency(downPayment)}
            </Typography>
          </ControlRow>

          <ControlRow
            label="Sales Tax Rate"
            helper="Your state's sales tax rate. Defaults to 0% so you can see the pre-tax impact of each lever first."
          >
            <StepperControl
              display={taxRate === 0 ? 'None (0%)' : `${(taxRate * 100).toFixed(1)}%`}
              onDecrement={() => setTaxRate((v) => Math.max(0, parseFloat((v - taxStep).toFixed(3))))}
              onIncrement={() => setTaxRate((v) => Math.min(taxMax, parseFloat((v + taxStep).toFixed(3))))}
            />
          </ControlRow>
        </Grid>

        {/* Results */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Box
            sx={{
              position: { md: 'sticky' },
              top: { md: 16 },
              display: 'flex',
              flexDirection: 'column',
              gap: 1.5,
            }}
          >
            <Typography variant="subtitle2" color="textDisabled" sx={{ mb: 0.5 }}>
              Real-time results
            </Typography>
            <ResultTile label="Monthly Payment"   value={curMonthly}  baseline={baseMonthly} />
            <ResultTile label="Due at Signing"    value={curSigning}  baseline={baseSigning} />
            <ResultTile label="Total Lease Cost"  value={curTotal}    baseline={baseTotal}   />
            <Typography variant="caption" color="textDisabled" sx={{ mt: 0.5 }}>
              Baseline: {formatCurrency(msrp)} MSRP · {(LEASE_BASE.residualPercent * 100).toFixed(0)}% RV
              &nbsp;·&nbsp; MF {LEASE_BASE.moneyFactor.toFixed(5)} · {LEASE_BASE.leaseTermMonths} mo
              {taxRate > 0 && <> · {(taxRate * 100).toFixed(1)}% tax</>}
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </Box>
  )
}

// ── Purchase Sandbox ──────────────────────────────────────────────────────────

function PurchaseSandbox() {
  const [msrp, setMsrp]                     = useState(PURCHASE_BASE.msrp)
  const [taxRate, setTaxRate]               = useState(0)
  const [negotiatedPrice, setNegotiatedPrice] = useState(PURCHASE_BASE.negotiatedPrice)
  const [interestRate, setInterestRate]     = useState(PURCHASE_BASE.interestRate)
  const [loanTermMonths, setLoanTermMonths] = useState(PURCHASE_BASE.loanTermMonths)
  const [downPayment, setDownPayment]       = useState(PURCHASE_BASE.downPayment)

  function handleMsrpChange(newMsrp: number) {
    setMsrp(newMsrp)
    setNegotiatedPrice(Math.min(defaultPurchaseNegotiatedPrice(newMsrp), newMsrp))
    setInterestRate(PURCHASE_BASE.interestRate)
    setLoanTermMonths(PURCHASE_BASE.loanTermMonths)
    setDownPayment(PURCHASE_BASE.downPayment)
  }

  // Baseline: proportional negotiated price, default levers, current MSRP + tax
  const baseline = useMemo<PurchaseDeal>(() => ({
    ...PURCHASE_BASE,
    msrp,
    taxRate,
    negotiatedPrice: Math.min(defaultPurchaseNegotiatedPrice(msrp), msrp),
    interestRate:    PURCHASE_BASE.interestRate,
    loanTermMonths:  PURCHASE_BASE.loanTermMonths,
    downPayment:     PURCHASE_BASE.downPayment,
  }), [msrp, taxRate])

  const current = useMemo<PurchaseDeal>(
    () => ({ ...PURCHASE_BASE, msrp, taxRate, negotiatedPrice, interestRate, loanTermMonths, downPayment }),
    [msrp, taxRate, negotiatedPrice, interestRate, loanTermMonths, downPayment],
  )

  const baseMonthly  = purchaseMonthlyPayment(baseline)
  const baseInterest = purchaseTotalInterest(baseline)
  const baseTotal    = purchaseTotalCost(baseline)
  const curMonthly   = purchaseMonthlyPayment(current)
  const curInterest  = purchaseTotalInterest(current)
  const curTotal     = purchaseTotalCost(current)

  const aprStep  = 0.0025
  const aprMin   = 0
  const aprMax   = 0.15
  const taxStep  = 0.005
  const taxMax   = 0.15
  const msrpStep = 1_000
  const msrpMin  = 15_000
  const msrpMax  = 120_000
  const priceMin = Math.round(msrp * 0.85 / 500) * 500

  return (
    <Box>
      <PurchaseTaxDisclaimer />
      <Grid container spacing={3}>
        {/* Controls */}
        <Grid size={{ xs: 12, md: 7 }}>
          <ControlRow
            label="Vehicle MSRP"
            helper="Set this to match your actual vehicle's sticker price. All other defaults scale proportionally."
          >
            <StepperControl
              display={formatCurrency(msrp)}
              onDecrement={() => handleMsrpChange(Math.max(msrpMin, msrp - msrpStep))}
              onIncrement={() => handleMsrpChange(Math.min(msrpMax, msrp + msrpStep))}
            />
          </ControlRow>

          <ControlRow
            label="Negotiated Price"
            helper="The out-the-door selling price you negotiate. Baseline scales proportionally to the MSRP above."
          >
            <Slider
              value={negotiatedPrice}
              min={priceMin}
              max={msrp}
              step={500}
              onChange={(_, v) => setNegotiatedPrice(v as number)}
              valueLabelDisplay="auto"
              valueLabelFormat={(v) => formatCurrency(v)}
            />
            <Typography variant="caption" color="textDisabled">
              {formatCurrency(negotiatedPrice)}
              {negotiatedPrice < msrp && (
                <> &nbsp;·&nbsp; {((1 - negotiatedPrice / msrp) * 100).toFixed(1)}% off MSRP</>
              )}
            </Typography>
          </ControlRow>

          <ControlRow
            label="APR"
            helper="Your loan's annual interest rate. Even a 1% difference adds up to hundreds of dollars over the loan life."
          >
            <StepperControl
              display={`${(interestRate * 100).toFixed(2)}%`}
              onDecrement={() => setInterestRate((v) => Math.max(aprMin, parseFloat((v - aprStep).toFixed(4))))}
              onIncrement={() => setInterestRate((v) => Math.min(aprMax, parseFloat((v + aprStep).toFixed(4))))}
            />
          </ControlRow>

          <ControlRow
            label="Loan Term"
            helper="Longer terms lower monthly payments but significantly increase total interest paid."
          >
            <ToggleButtonGroup
              value={loanTermMonths}
              exclusive
              onChange={(_, v) => v !== null && setLoanTermMonths(v)}
              size="small"
            >
              {LOAN_TERMS.map((t) => (
                <ToggleButton key={t} value={t}>{t} mo</ToggleButton>
              ))}
            </ToggleButtonGroup>
          </ControlRow>

          <ControlRow
            label="Down Payment"
            helper="Upfront cash that reduces your principal and total interest paid."
          >
            <Slider
              value={downPayment}
              min={0}
              max={Math.round(msrp * 0.2 / 500) * 500}
              step={500}
              onChange={(_, v) => setDownPayment(v as number)}
              valueLabelDisplay="auto"
              valueLabelFormat={(v) => formatCurrency(v)}
            />
            <Typography variant="caption" color="textDisabled">
              {formatCurrency(downPayment)}
            </Typography>
          </ControlRow>

          <ControlRow
            label="Sales Tax Rate"
            helper="Your state's sales tax rate. Defaults to 0% — add it to see the real impact on your financed amount."
          >
            <StepperControl
              display={taxRate === 0 ? 'None (0%)' : `${(taxRate * 100).toFixed(1)}%`}
              onDecrement={() => setTaxRate((v) => Math.max(0, parseFloat((v - taxStep).toFixed(3))))}
              onIncrement={() => setTaxRate((v) => Math.min(taxMax, parseFloat((v + taxStep).toFixed(3))))}
            />
          </ControlRow>
        </Grid>

        {/* Results */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Box
            sx={{
              position: { md: 'sticky' },
              top: { md: 16 },
              display: 'flex',
              flexDirection: 'column',
              gap: 1.5,
            }}
          >
            <Typography variant="subtitle2" color="textDisabled" sx={{ mb: 0.5 }}>
              Real-time results
            </Typography>
            <ResultTile label="Monthly Payment"  value={curMonthly}  baseline={baseMonthly}  />
            <ResultTile label="Total Interest"   value={curInterest} baseline={baseInterest} />
            <ResultTile label="Total Cost"       value={curTotal}    baseline={baseTotal}    />
            <Typography variant="caption" color="textDisabled" sx={{ mt: 0.5 }}>
              Baseline: {formatCurrency(msrp)} MSRP
              &nbsp;·&nbsp; {(PURCHASE_BASE.interestRate * 100).toFixed(2)}% APR
              &nbsp;·&nbsp; {PURCHASE_BASE.loanTermMonths} mo
              {taxRate > 0 && <> · {(taxRate * 100).toFixed(1)}% tax</>}
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </Box>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LearnPage({ dealType }: LearnPageProps) {
  const navigate  = useNavigate()
  const isLease   = dealType === 'lease'
  const backPath  = isLease ? '/lease' : '/purchase'
  const title     = isLease ? 'Leasing 101' : 'Buying 101'
  const glossary  = isLease ? LEASE_TERMS_GLOSSARY : PURCHASE_TERMS_GLOSSARY

  return (
    <Layout title={title} subtitle="A quick-start guide for first-timers" backPath={backPath}>

      <SectionPaper label="How It Works">
        {isLease ? <LeaseHowItWorks /> : <PurchaseHowItWorks />}
      </SectionPaper>

      <SectionPaper label="Key Terms">
        <Glossary items={glossary} />
      </SectionPaper>

      <SectionPaper label="Impact Sandbox — See How the Numbers Move">
        <Typography variant="body2" color="textSecondary" sx={{ mb: 2.5 }}>
          Note: This is an illustrative tool to help you understand some of the math involved. 
          For now we are omitting things like incentives, dealer/doc fees, acquisition, etc that 
          you will have once you start to model a real deal.
          Start by setting the vehicle MSRP to match your car, then adjust any lever to see
          real-time payment impact. Deltas are shown relative to the baseline — the proportional
          default values for the MSRP you've entered.
        </Typography>
        {isLease ? <LeaseSandbox /> : <PurchaseSandbox />}
      </SectionPaper>

      <Box sx={{ display: 'flex', justifyContent: 'center', py: 2, pb: 4 }}>
        <Button
          variant="contained"
          color="primary"
          size="large"
          startIcon={<AddCircleOutlineIcon />}
          onClick={() => navigate(backPath)}
        >
          {isLease ? 'Start Adding Lease Deals' : 'Start Adding Purchase Deals'}
        </Button>
      </Box>

    </Layout>
  )
}

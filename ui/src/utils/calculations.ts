import type { PurchaseDeal, LeaseDeal, Deal, SummaryRow } from '../types'

// ── Purchase ──────────────────────────────────────────────────────────────────

export function purchaseMonthlyPayment(deal: PurchaseDeal): number {
  const { negotiatedPrice, downPayment, tradeInValue, loanTermMonths, interestRate, taxRate } = deal
  const principal  = negotiatedPrice - downPayment - tradeInValue
  const taxedPrice = principal * (1 + taxRate)
  if (interestRate <= 0) return taxedPrice / loanTermMonths
  const r = interestRate / 12
  const n = loanTermMonths
  return taxedPrice * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
}

export function purchaseTotalCost(deal: PurchaseDeal): number {
  return purchaseMonthlyPayment(deal) * deal.loanTermMonths + deal.downPayment
}
export function purchaseDueAtSigning(deal: PurchaseDeal): number {
  return deal.downPayment
}
export function purchaseTotalInterest(deal: PurchaseDeal): number {
  return purchaseTotalCost(deal) - deal.negotiatedPrice - deal.downPayment
}

// Remaining loan balance after k monthly payments. Pass a deal with a modified
// loanTermMonths to evaluate hypothetical terms for the term comparison table.
export function purchaseLoanBalance(deal: PurchaseDeal, monthsPaid: number): number {
  const taxedPrincipal = (deal.negotiatedPrice - deal.downPayment - deal.tradeInValue) * (1 + deal.taxRate)
  const k = Math.min(monthsPaid, deal.loanTermMonths)
  if (k >= deal.loanTermMonths) return 0
  if (deal.interestRate <= 0) {
    return Math.max(0, taxedPrincipal * (deal.loanTermMonths - k) / deal.loanTermMonths)
  }
  const r = deal.interestRate / 12
  const n = deal.loanTermMonths
  const M = taxedPrincipal * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
  return Math.max(0, M * (1 - Math.pow(1 + r, -(n - k))) / r)
}

// ── Lease ─────────────────────────────────────────────────────────────────────

export function leaseResidualValue(deal: LeaseDeal): number {
  return deal.msrp * deal.residualPercent
}

function leaseCapCost(deal: LeaseDeal): number {
  // trade-in reduces cap cost directly and is never subject to sales tax
  return deal.negotiatedPrice - deal.mfrIncentives - deal.downPayment - deal.tradeInValue
}

function leasePreTaxMonthly(deal: LeaseDeal): number {
  const residual     = leaseResidualValue(deal)
  const capCost      = leaseCapCost(deal)
  const depreciation = (capCost - residual) / deal.leaseTermMonths
  const finance      = (capCost + residual) * deal.moneyFactor
  return depreciation + finance
}

// Tax applied to each monthly payment — most states (CA, NY, FL, NJ, VA, …)
// Tax prepaid on total lease payments at signing — TX, AZ
// Tax on full vehicle price at signing (like a purchase) — IL, MN
export function leaseMonthlyPayment(deal: LeaseDeal): number {
  const preTax = leasePreTaxMonthly(deal)
  return deal.leaseTaxMethod === 'monthly' ? preTax * (1 + deal.taxRate) : preTax
}

export function leaseDueAtSigning(deal: LeaseDeal): number {
  const preTax         = leasePreTaxMonthly(deal)
  const monthly        = leaseMonthlyPayment(deal)
  // docFee and addlDealerFees are taxable; securityDeposit and tradeInValue are not
  const upfrontTaxable = deal.downPayment + deal.acquisitionFee + deal.addlDealerFees + deal.docFee
  const incentiveTax   = deal.mfrIncentives * deal.taxRate
  const base           = monthly + deal.govtFees + deal.securityDeposit + incentiveTax

  switch (deal.leaseTaxMethod) {
    case 'monthly':
      // tax is already in each monthly payment; only upfront items taxed at signing
      return base + upfrontTaxable * (1 + deal.taxRate)

    case 'upfront_payments':
      // all monthly taxes collected upfront as a lump sum
      return base + upfrontTaxable * (1 + deal.taxRate) + preTax * deal.leaseTermMonths * deal.taxRate

    case 'upfront_full_price':
      // tax on full vehicle selling price (less trade-in), paid at signing — like a purchase
      return (
        monthly
        + upfrontTaxable
        + (deal.negotiatedPrice - deal.tradeInValue) * deal.taxRate
        + deal.govtFees
        + deal.securityDeposit
      )
  }
}

export function leaseTotalCost(deal: LeaseDeal): number {
  // dispositionFee is due at lease end — included in total cost but not due at signing
  return leaseMonthlyPayment(deal) * (deal.leaseTermMonths - 1) + leaseDueAtSigning(deal) + deal.dispositionFee
}

// ── Rolled-in variant ─────────────────────────────────────────────────────────
// acquisitionFee + addlDealerFees + docFee are folded into cap cost rather than
// paid upfront; due at signing is only first month + govtFees + securityDeposit
// (plus any lump-sum tax depending on method).

function leaseRolledPreTaxMonthly(deal: LeaseDeal): number {
  const residual   = leaseResidualValue(deal)
  const adjCapCost = leaseCapCost(deal) + deal.acquisitionFee + deal.addlDealerFees + deal.docFee
  const depreciation = (adjCapCost - residual) / deal.leaseTermMonths
  const finance      = (adjCapCost + residual) * deal.moneyFactor
  return depreciation + finance
}

export function leaseRolledMonthlyPayment(deal: LeaseDeal): number {
  const preTax = leaseRolledPreTaxMonthly(deal)
  return deal.leaseTaxMethod === 'monthly' ? preTax * (1 + deal.taxRate) : preTax
}

export function leaseRolledDueAtSigning(deal: LeaseDeal): number {
  const preTax  = leaseRolledPreTaxMonthly(deal)
  const monthly = leaseRolledMonthlyPayment(deal)
  const base    = monthly + deal.govtFees + deal.securityDeposit

  switch (deal.leaseTaxMethod) {
    case 'monthly':
      return base

    case 'upfront_payments':
      return base + preTax * deal.leaseTermMonths * deal.taxRate

    case 'upfront_full_price':
      return monthly + (deal.negotiatedPrice - deal.tradeInValue) * deal.taxRate + deal.govtFees + deal.securityDeposit
  }
}

export function leaseRolledTotalCost(deal: LeaseDeal): number {
  return leaseRolledMonthlyPayment(deal) * (deal.leaseTermMonths - 1) + leaseRolledDueAtSigning(deal) + deal.dispositionFee
}

export function moneyFactorToAPR(moneyFactor: number): number {
  return moneyFactor * 2400
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export function formatCurrency(value: number, decimals = 0): string {
  return new Intl.NumberFormat('en-US', {
    style:                 'currency',
    currency:              'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

export function formatPercent(value: number, decimals = 2): string {
  return `${(value * 100).toFixed(decimals)}%`
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value)
}

export function bestIndex(values: number[], lower = true): number | null {
  if (values.length <= 1) return null
  const unique = new Set(values)
  if (unique.size === 1) return null
  return lower
    ? values.indexOf(Math.min(...values))
    : values.indexOf(Math.max(...values))
}

// ── Summary rows ──────────────────────────────────────────────────────────────

export function purchaseSummaryRows(deal: PurchaseDeal): SummaryRow[] {
  return [
    { label: 'Negotiated Price', value: formatCurrency(deal.negotiatedPrice) },
    { label: 'Trade-In Value',   value: formatCurrency(deal.tradeInValue) },
    { label: 'Down Payment',     value: formatCurrency(deal.downPayment) },
    { label: 'Term',             value: `${deal.loanTermMonths} mo` },
    { label: 'APR (Money Factor)', value: formatPercent(deal.interestRate) },
    { label: 'Tax Rate',         value: formatPercent(deal.taxRate) },
    { label: 'Incentives',       value: formatCurrency(deal.mfrIncentives) },
    { label: 'Doc Fee',          value: formatCurrency(deal.docFee) },
    { label: 'Addl Dealer Fees', value: formatCurrency(deal.addlDealerFees) },
    { label: 'Govt Fees',        value: formatCurrency(deal.govtFees) },
    { label: 'Total Interest',   value: formatCurrency(purchaseTotalInterest(deal)) },
    { label: 'Total Cost',       value: formatCurrency(purchaseTotalCost(deal)) },
  ]
}

export function leaseSummaryRows(deal: LeaseDeal): SummaryRow[] {
  return [
    { label: 'MSRP',               value: formatCurrency(deal.msrp) },
    { label: 'Negotiated Price',   value: formatCurrency(deal.negotiatedPrice) },
    { label: 'Trade-In Value',     value: formatCurrency(deal.tradeInValue) },
    { label: 'Residual',           value: `${(deal.residualPercent * 100).toFixed(0)}% · ${formatCurrency(leaseResidualValue(deal))}` },
    { label: 'APR (Money Factor)', value: `${deal.moneyFactor} (${moneyFactorToAPR(deal.moneyFactor).toFixed(2)}% APR equiv.)` },
    { label: 'Down Payment (Cap Cost Reduction)', value: formatCurrency(deal.downPayment) },
    { label: 'Acquisition Fee',    value: formatCurrency(deal.acquisitionFee) },
    { label: 'Doc Fee',            value: formatCurrency(deal.docFee) },
    { label: 'Addl Dealer Fees',   value: formatCurrency(deal.addlDealerFees) },
    { label: 'Security Deposit',   value: formatCurrency(deal.securityDeposit) },
    { label: 'Disposition Fee',    value: formatCurrency(deal.dispositionFee) },
    { label: 'Govt Fees',          value: formatCurrency(deal.govtFees) },
    { label: 'Mileage/Year',       value: `${formatNumber(deal.mileageAllowancePerYear)} mi` },
    { label: 'Term',               value: `${deal.leaseTermMonths} mo` },
    { label: 'Tax Rate',           value: formatPercent(deal.taxRate) },
    { label: 'Incentives',         value: formatCurrency(deal.mfrIncentives) },
    { label: 'Total Cost',         value: formatCurrency(leaseTotalCost(deal)) },
  ]
}

export function dealMonthly(deal: Deal): number {
  return deal.type === 'purchase' ? purchaseMonthlyPayment(deal) : leaseMonthlyPayment(deal)
}
export function dealDueAtSigning(deal: Deal): number {
  return deal.type === 'purchase' ? purchaseDueAtSigning(deal) : leaseDueAtSigning(deal)
}
export function dealTotal(deal: Deal): number {
  return deal.type === 'purchase' ? purchaseTotalCost(deal) : leaseTotalCost(deal)
}

export function dealEffectiveMonthly(deal: Deal): number {
  return dealTotal(deal) / dealTermMonths(deal)
}

export function dealSummaryRows(deal: Deal): SummaryRow[] {
  return deal.type === 'purchase' ? purchaseSummaryRows(deal) : leaseSummaryRows(deal)
}

export function dealTermMonths(deal: Deal): number {
  return deal.type === 'purchase' ? deal.loanTermMonths : deal.leaseTermMonths
}

export function dealDisplayName(deal: Deal): string {
  return deal.name?.trim() || `${deal.carYear} ${deal.carMake} ${deal.carModel}`
}

// Deal quality score: monthly payment / MSRP
export function dealQualityRatio(deal: Deal): number | null {
  if (!deal.msrp || deal.msrp === 0 || deal.type === 'purchase') return null
  return dealEffectiveMonthly(deal) / deal.msrp
}

export function dealQualityTier(deal: Deal): {
  label: 'Great Deal' | 'OK Deal' | 'Red Flag'
  color: 'success' | 'warning' | 'error'
  emoji: '🟢' | '🟡' | '🔴'
} | null {
  const ratio = dealQualityRatio(deal)
  if (ratio === null) return null
  if (ratio < 0.01)  return { label: 'Great Deal', color: 'success', emoji: '🟢' }
  if (ratio <= 0.012) return { label: 'OK Deal',    color: 'warning', emoji: '🟡' }
  return                     { label: 'Red Flag',   color: 'error',  emoji: '🔴' }
}

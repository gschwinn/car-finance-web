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

export function purchaseTotalInterest(deal: PurchaseDeal): number {
  return purchaseTotalCost(deal) - deal.negotiatedPrice - deal.downPayment
}

// ── Lease ─────────────────────────────────────────────────────────────────────

export function leaseResidualValue(deal: LeaseDeal): number {
  return deal.msrp * deal.residualPercent
}

export function leaseMonthlyPayment(deal: LeaseDeal): number {
  const residual     = leaseResidualValue(deal)
  const depreciation = (deal.negotiatedPrice - deal.mfrIncentives - deal.downPayment - residual) / deal.leaseTermMonths
  const finance      = ((deal.negotiatedPrice - deal.mfrIncentives - deal.downPayment) + residual) * deal.moneyFactor
  return (depreciation + finance) * (1 + deal.taxRate)
}

export function leaseTotalCost(deal: LeaseDeal): number {
  return leaseMonthlyPayment(deal) * (deal.leaseTermMonths - 1) + leaseDueAtSigning(deal)
}

export function leaseDueAtSigning(deal: LeaseDeal): number {
  return leaseMonthlyPayment(deal) + (deal.downPayment + deal.acquisitionFee) * (1 + deal.taxRate) + (deal.acquisitionFee * deal.taxRate)
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
    { label: 'Loan Term',        value: `${deal.loanTermMonths} mo` },
    { label: 'APR',              value: formatPercent(deal.interestRate) },
    { label: 'Tax Rate',         value: formatPercent(deal.taxRate) },
    { label: 'Incentives',       value: formatCurrency(deal.mfrIncentives) },
    { label: 'Total Interest',   value: formatCurrency(purchaseTotalInterest(deal)) },
    { label: 'Total Cost',       value: formatCurrency(purchaseTotalCost(deal)) },
  ]
}

export function leaseSummaryRows(deal: LeaseDeal): SummaryRow[] {
  return [
    { label: 'MSRP',               value: formatCurrency(deal.msrp) },
    { label: 'Negotiated Price',   value: formatCurrency(deal.negotiatedPrice) },
    { label: 'Residual',           value: `${(deal.residualPercent * 100).toFixed(0)}% · ${formatCurrency(leaseResidualValue(deal))}` },
    { label: 'Money Factor',       value: `${deal.moneyFactor} (${moneyFactorToAPR(deal.moneyFactor).toFixed(2)}% APR equiv.)` },
    { label: 'Cap Cost Reduction', value: formatCurrency(deal.downPayment) },
    { label: 'Acquisition Fee',    value: formatCurrency(deal.acquisitionFee) },
    { label: 'Mileage/Year',       value: `${formatNumber(deal.mileageAllowancePerYear)} mi` },
    { label: 'Lease Term',         value: `${deal.leaseTermMonths} mo` },
    { label: 'Tax Rate',           value: formatPercent(deal.taxRate) },
    { label: 'Incentives',         value: formatCurrency(deal.mfrIncentives) },
    { label: 'Total Cost',         value: formatCurrency(leaseTotalCost(deal)) },
  ]
}

export function dealMonthly(deal: Deal): number {
  return deal.type === 'purchase' ? purchaseMonthlyPayment(deal) : leaseMonthlyPayment(deal)
}

export function dealTotal(deal: Deal): number {
  return deal.type === 'purchase' ? purchaseTotalCost(deal) : leaseTotalCost(deal)
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

// utils/calculations.js
// Mirrors the computed properties from PurchaseDeal.swift and LeaseDeal.swift

// ── Purchase ──────────────────────────────────────────────────────────────────

/**
 * Standard amortization formula.
 * interestRate is stored as a decimal (e.g. 0.049 for 4.9%)
 */
export function purchaseMonthlyPayment(deal) {
  const { negotiatedPrice, downPayment, tradeInValue, loanTermMonths, interestRate, taxRate } = deal
  const principal  = negotiatedPrice - downPayment - tradeInValue
  const taxedPrice = principal * (1 + taxRate)
  if (interestRate <= 0) return taxedPrice / loanTermMonths
  const r = interestRate / 12
  const n = loanTermMonths
  return taxedPrice * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
}

export function purchaseTotalCost(deal) {
  return purchaseMonthlyPayment(deal) * deal.loanTermMonths + deal.downPayment
}

export function purchaseTotalInterest(deal) {
  return purchaseTotalCost(deal) - deal.negotiatedPrice - deal.downPayment
}

// ── Lease ─────────────────────────────────────────────────────────────────────

export function leaseResidualValue(deal) {
  return deal.msrp * deal.residualPercent
}

export function leaseMonthlyPayment(deal) {
  const residual    = leaseResidualValue(deal)
  const depreciation = (deal.negotiatedPrice - deal.mfrIncentives - deal.downPayment - residual) / deal.leaseTermMonths
  const finance      = ((deal.negotiatedPrice - deal.mfrIncentives - deal.downPayment) + residual  ) * deal.moneyFactor
  return (depreciation + finance) * (1 + deal.taxRate)
}

export function leaseTotalCost(deal) {
  //return leaseMonthlyPayment(deal) * deal.leaseTermMonths + deal.downPayment + deal.acquisitionFee
  return leaseMonthlyPayment(deal) * (deal.leaseTermMonths  - 1) + leaseDueAtSigning(deal)
}

export function leaseDueAtSigning(deal) {
  return leaseMonthlyPayment(deal) + (deal.downPayment + deal.acquisitionFee ) * (1 + deal.taxRate) + (deal.acquisitionFee * deal.taxRate)
}

/** Convert money factor to equivalent APR */
export function moneyFactorToAPR(moneyFactor) {
  return moneyFactor * 2400
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export function formatCurrency(value, decimals = 0) {
  return new Intl.NumberFormat('en-US', {
    style:                 'currency',
    currency:              'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

export function formatPercent(value, decimals = 2) {
  return `${(value * 100).toFixed(decimals)}%`
}

export function formatNumber(value) {
  return new Intl.NumberFormat('en-US').format(value)
}

/** Returns the index of the min value in an array; null if all equal */
export function bestIndex(values, lower = true) {
  if (values.length <= 1) return null
  const unique = new Set(values)
  if (unique.size === 1) return null
  return lower
    ? values.indexOf(Math.min(...values))
    : values.indexOf(Math.max(...values))
}

// ── Summary rows (mirrors CarDealComparable.summaryRows) ─────────────────────

export function purchaseSummaryRows(deal) {
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

export function leaseSummaryRows(deal) {
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

/** Unified monthly/total for any deal */
export function dealMonthly(deal) {
  return deal.type === 'purchase' ? purchaseMonthlyPayment(deal) : leaseMonthlyPayment(deal)
}

export function dealTotal(deal) {
  return deal.type === 'purchase' ? purchaseTotalCost(deal) : leaseTotalCost(deal)
}

export function dealSummaryRows(deal) {
  return deal.type === 'purchase' ? purchaseSummaryRows(deal) : leaseSummaryRows(deal)
}

export function dealTermMonths(deal) {
  return deal.type === 'purchase' ? deal.loanTermMonths : deal.leaseTermMonths
}

export function dealDisplayName(deal) {
  const base = deal.name?.trim()
    || `${deal.carYear} ${deal.carMake} ${deal.carModel}`
  return base
}

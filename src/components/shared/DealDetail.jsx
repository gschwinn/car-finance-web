// components/shared/DealDetail.jsx
// Full detail view shown in a modal for any deal type.

import { Pencil } from 'lucide-react'
import { StatTile, DealTypeBadge } from './UI.jsx'
import {
  formatCurrency, formatPercent, formatNumber,
  dealMonthly, dealTermMonths, dealTotal, dealDisplayName, dealSummaryRows,
  purchaseTotalInterest,
  leaseResidualValue, moneyFactorToAPR,
} from '../../utils/calculations.js'

export default function DealDetail({ deal, onEdit }) {
  const monthly  = dealMonthly(deal)
  const total    = dealTotal(deal)
  const rows     = dealSummaryRows(deal)
  const effectivePayment  = dealTotal(deal)/dealTermMonths(deal)
  const name     = dealDisplayName(deal)

  const accent3 = deal.type === 'purchase'
    ? { label: 'Total Interest', value: formatCurrency(purchaseTotalInterest(deal)), accent: 'text-warning' }
    //: { label: 'Residual',       value: formatCurrency(leaseResidualValue(deal)),     accent: 'text-purple-400' }
    : { label: 'Effective Pmt',       value: formatCurrency(effectivePayment),     accent: 'text-purple-400' }

  return (
    <div className="p-6 space-y-5">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <DealTypeBadge type={deal.type} />
            <span className="text-xs text-slate-500">{deal.carYear}</span>
          </div>
          <h2 className="font-display text-xl text-slate-100">{name}</h2>
          {deal.trimLevel && <p className="text-sm text-slate-500 mt-0.5">{deal.trimLevel}</p>}
        </div>
        <button onClick={onEdit} className="btn-secondary gap-2">
          <Pencil size={15} /> Edit
        </button>
      </div>

      {/* ── Key stats ── */}
      <div className="grid grid-cols-3 gap-2">
        <StatTile label="Monthly"    value={formatCurrency(monthly)} accent="text-success" />
        <StatTile label="Total Cost" value={formatCurrency(total)}   accent="text-accent" />
        <StatTile label={accent3.label} value={accent3.value}        accent={accent3.accent} />
      </div>

      {/* ── Detail rows ── */}
      <div className="card divide-y divide-surface-700 overflow-hidden">
        {rows.map(({ label, value }) => (
          <div key={label} className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-slate-400">{label}</span>
            <span className="text-sm font-medium font-mono text-slate-200">{value}</span>
          </div>
        ))}
      </div>

      <p className="text-xs text-slate-600 text-center">
        Saved {new Date(deal.createdAt).toLocaleDateString('en-US', {
          month: 'long', day: 'numeric', year: 'numeric'
        })}
      </p>
    </div>
  )
}

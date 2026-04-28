// components/shared/DealCard.jsx
import { Pencil, Trash2, TrendingDown, Clock } from 'lucide-react'
import { formatCurrency, dealMonthly, dealTotal, dealTermMonths, dealDisplayName } from '../../utils/calculations.js'
import { DealTypeBadge } from './UI.jsx'

export default function DealCard({ deal, onEdit, onDelete, compact = false }) {
  const monthly  = dealMonthly(deal)
  const total    = dealTotal(deal)
  const termMos  = dealTermMonths(deal)
  const name     = dealDisplayName(deal)

  return (
    <div className="card p-4 hover:border-surface-500 transition-colors duration-150
                    group animate-fade-in">
      {/* ── Top row ── */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <DealTypeBadge type={deal.type} />
            {deal.carYear && (
              <span className="text-xs text-slate-500">{deal.carYear}</span>
            )}
          </div>
          <h3 className="font-semibold text-slate-100 truncate">{name}</h3>
          {deal.trimLevel && (
            <p className="text-xs text-slate-500 mt-0.5">{deal.trimLevel}</p>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity
                        focus-within:opacity-100">
          <button
            onClick={() => onEdit(deal)}
            className="btn-ghost p-1.5 rounded-lg text-slate-400 hover:text-accent"
            aria-label="Edit"
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={() => onDelete(deal)}
            className="btn-ghost p-1.5 rounded-lg text-slate-400 hover:text-danger"
            aria-label="Delete"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className={`grid gap-2 ${compact ? 'grid-cols-2' : 'grid-cols-3'}`}>
        <div className="stat-tile">
          <span className="text-xs text-slate-500 mb-0.5">Monthly</span>
          <span className="font-mono font-semibold text-success">{formatCurrency(monthly)}</span>
        </div>
        {!compact && (
          <div className="stat-tile">
            <span className="text-xs text-slate-500 mb-0.5">Total</span>
            <span className="font-mono font-semibold text-slate-200">{formatCurrency(total)}</span>
          </div>
        )}
        <div className="stat-tile">
          <span className="text-xs text-slate-500 mb-0.5">Term</span>
          <span className="font-mono font-semibold text-slate-200">{termMos} mo</span>
        </div>
      </div>

      {/* ── Subtitle detail ── */}
      <div className="flex items-center gap-3 mt-2.5 text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <TrendingDown size={11} />
          {formatCurrency(deal.downPayment)} down
        </span>
        <span className="flex items-center gap-1">
          <Clock size={11} />
          {new Date(deal.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </span>
      </div>
    </div>
  )
}

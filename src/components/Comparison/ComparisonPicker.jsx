// components/Comparison/ComparisonPicker.jsx
import { CheckCircle2, Circle, ShoppingCart, Calendar } from 'lucide-react'
import { formatCurrency, dealMonthly, dealTermMonths, dealDisplayName } from '../../utils/calculations.js'
import { useDeals } from '../../context/DealsContext.jsx'

const MAX = 3

export default function ComparisonPicker({ selected, onChange, onClose }) {
  const { purchases, leases } = useDeals()

  function toggle(deal) {
    const isSelected = selected.some(d => d.id === deal.id)
    if (isSelected) {
      onChange(selected.filter(d => d.id !== deal.id))
    } else if (selected.length < MAX) {
      onChange([...selected, deal])
    }
  }

  const isEmpty = purchases.length === 0 && leases.length === 0

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between px-1">
        <p className="text-sm text-slate-400">
          Select up to <span className="text-slate-200 font-medium">{MAX} deals</span> to compare
        </p>
        <span className="text-xs font-mono text-slate-500">{selected.length}/{MAX}</span>
      </div>

      {isEmpty ? (
        <div className="py-12 text-center text-slate-500">
          <p className="text-sm">No deals saved yet.</p>
          <p className="text-xs mt-1">Add purchases or leases first.</p>
        </div>
      ) : (
        <>
          {purchases.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-2 px-1">
                <ShoppingCart size={13} className="text-accent" />
                <span className="section-header">Purchases</span>
              </div>
              <div className="space-y-2">
                {purchases.map(deal => (
                  <PickerRow
                    key={deal.id}
                    deal={deal}
                    isSelected={selected.some(d => d.id === deal.id)}
                    disabled={selected.length >= MAX && !selected.some(d => d.id === deal.id)}
                    onToggle={toggle}
                  />
                ))}
              </div>
            </section>
          )}

          {leases.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-2 px-1 mt-4">
                <Calendar size={13} className="text-success" />
                <span className="section-header">Leases</span>
              </div>
              <div className="space-y-2">
                {leases.map(deal => (
                  <PickerRow
                    key={deal.id}
                    deal={deal}
                    isSelected={selected.some(d => d.id === deal.id)}
                    disabled={selected.length >= MAX && !selected.some(d => d.id === deal.id)}
                    onToggle={toggle}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {/* Footer */}
      <div className="flex gap-3 pt-2 border-t border-surface-700">
        <button
          onClick={() => onChange([])}
          className="btn-ghost text-slate-500 text-sm"
          disabled={selected.length === 0}
        >
          Clear
        </button>
        <button onClick={onClose} className="btn-primary flex-1">
          Compare {selected.length > 0 ? `(${selected.length})` : ''}
        </button>
      </div>
    </div>
  )
}

function PickerRow({ deal, isSelected, disabled, onToggle }) {
  return (
    <button
      type="button"
      onClick={() => onToggle(deal)}
      disabled={disabled}
      className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left
                  transition-all duration-150
                  ${isSelected
                    ? 'bg-accent/10 border-accent/40'
                    : disabled
                      ? 'bg-surface-700/30 border-surface-700 opacity-40 cursor-not-allowed'
                      : 'bg-surface-700 border-surface-600 hover:border-slate-500'}`}
    >
      {isSelected
        ? <CheckCircle2 size={18} className="text-accent shrink-0" />
        : <Circle size={18} className="text-slate-500 shrink-0" />
      }
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-200 truncate">{dealDisplayName(deal)}</p>
        <p className="text-xs text-slate-500 mt-0.5">
          {formatCurrency(dealMonthly(deal))}/mo · {dealTermMonths(deal)} mo
        </p>
      </div>
      <span className={`text-xs px-2 py-0.5 rounded-full border shrink-0
        ${deal.type === 'purchase'
          ? 'bg-accent/10 text-accent border-accent/20'
          : 'bg-success/10 text-success border-success/20'}`}>
        {deal.type === 'purchase' ? 'Buy' : 'Lease'}
      </span>
    </button>
  )
}

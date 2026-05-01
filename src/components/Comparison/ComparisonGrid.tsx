import { CheckCircle2 } from 'lucide-react'
import type { Deal } from '../../types'
import {
  formatCurrency, bestIndex,
  dealMonthly, dealTotal, dealEffectiveMonthly, dealTermMonths, dealDisplayName, dealSummaryRows,
} from '../../utils/calculations'
import { DealTypeBadge } from "@/components/shared/DealBadge";

function allLabels(deals: Deal[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  deals.forEach(d => {
    dealSummaryRows(d).forEach(({ label }) => {
      if (!seen.has(label)) { seen.add(label); out.push(label) }
    })
  })
  return out
}

interface KeyRow {
  label:    string
  getValue: (d: Deal) => number
  format:   (v: number) => string
  lower:    boolean | null
}

const KEY_ROWS: KeyRow[] = [
  { label: 'Monthly Payment', getValue: d => dealMonthly(d),    format: v => formatCurrency(v), lower: true },
  { label: 'Effective Monthly', getValue: d => dealEffectiveMonthly(d), format: v => formatCurrency(v), lower: true },
  { label: 'Total Cost',      getValue: d => dealTotal(d),      format: v => formatCurrency(v), lower: true },
  { label: 'Term',            getValue: d => dealTermMonths(d), format: v => `${v} mo`,         lower: null },
  { label: 'Down Payment',    getValue: d => d.downPayment,     format: v => formatCurrency(v), lower: true },
]

interface ComparisonGridProps {
  deals: Deal[]
}

export default function ComparisonGrid({ deals }: ComparisonGridProps) {
  const labels = allLabels(deals)

  return (
    <div className="w-full overflow-x-auto animate-fade-in">
      <div className="min-w-[480px]">

        {/* ── Column headers ── */}
        <div className="grid gap-2 mb-4" style={{ gridTemplateColumns: `140px repeat(${deals.length}, 1fr)` }}>
          <div />
          {deals.map(deal => (
            <div key={deal.id} className="card p-3 text-center">
              <DealTypeBadge type={deal.type} />
              <p className="text-sm font-semibold text-slate-200 mt-2 leading-tight line-clamp-2">
                {dealDisplayName(deal)}
              </p>
              {deal.carYear && (
                <p className="text-xs text-slate-500 mt-0.5">{deal.carYear}</p>
              )}
            </div>
          ))}
        </div>

        {/* ── Key comparison rows ── */}
        <div className="mb-2">
          <p className="section-header px-1 mb-2">Key Metrics</p>
          {KEY_ROWS.map(({ label, getValue, format, lower }) => {
            const values = deals.map(getValue)
            const winIdx = lower !== null ? bestIndex(values, lower) : null
            return (
              <CompRow key={label} label={label} deals={deals}
                values={values.map(format)} winnerIdx={winIdx} />
            )
          })}
        </div>

        {/* ── Deal-type-specific rows ── */}
        <div className="mt-4">
          <p className="section-header px-1 mb-2">Deal Details</p>
          {labels.map(label => {
            const values = deals.map(d => {
              const row = dealSummaryRows(d).find(r => r.label === label)
              return row?.value ?? '—'
            })
            return (
              <CompRow key={label} label={label} deals={deals} values={values} winnerIdx={null} detail />
            )
          })}
        </div>
      </div>
    </div>
  )
}

interface CompRowProps {
  label:     string
  deals:     Deal[]
  values:    string[]
  winnerIdx: number | null
  detail?:   boolean
}

function CompRow({ label, deals, values, winnerIdx, detail = false }: CompRowProps) {
  return (
    <div
      className="grid gap-2 mb-1.5 items-center"
      style={{ gridTemplateColumns: `140px repeat(${deals.length}, 1fr)` }}
    >
      <span className={`${detail ? 'text-xs' : 'text-sm'} text-slate-400 pr-2 leading-tight`}>
        {label}
      </span>

      {values.map((value, idx) => {
        const isWinner = winnerIdx === idx
        return (
          <div
            key={deals[idx].id}
            className={`relative flex items-center justify-center gap-1 rounded-xl px-2
                        ${detail ? 'py-1.5' : 'py-2.5'}
                        ${isWinner
                          ? 'bg-success/10 border border-success/30'
                          : 'bg-surface-700/50 border border-surface-700'}`}
          >
            {isWinner && (
              <CheckCircle2 size={12} className="text-success absolute top-1 right-1.5" />
            )}
            <span className={`font-mono text-center
              ${detail ? 'text-xs' : 'text-sm font-semibold'}
              ${isWinner ? 'text-success' : 'text-slate-200'}`}>
              {value}
            </span>
          </div>
        )
      })}
    </div>
  )
}

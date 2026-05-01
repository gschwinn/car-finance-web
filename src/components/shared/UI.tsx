import { type ReactNode } from 'react'

// ── StatTile ──────────────────────────────────────────────────────────────────

interface StatTileProps {
  label: string
  value: string
  accent?: string
  sub?: string
}

export function StatTile({ label, value, accent = 'text-slate-100', sub }: StatTileProps) {
  return (
    <div className="stat-tile text-center gap-0.5">
      <span className="text-xs text-slate-500 uppercase tracking-wider mb-1">{label}</span>
      <span className={`text-xl font-semibold font-mono ${accent}`}>{value}</span>
      {sub && <span className="text-xs text-slate-600 mt-0.5">{sub}</span>}
    </div>
  )
}

// ── FormField ─────────────────────────────────────────────────────────────────

interface FormFieldProps {
  label: string
  children: ReactNode
  hint?: string
}

export function FormField({ label, children, hint }: FormFieldProps) {
  return (
    <div>
      <label className="input-label">{label}</label>
      {children}
      {hint && <p className="text-xs text-slate-500 mt-1">{hint}</p>}
    </div>
  )
}

// ── SectionDivider ────────────────────────────────────────────────────────────

export function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 my-2">
      <div className="h-px flex-1 bg-surface-700" />
      <span className="section-header">{label}</span>
      <div className="h-px flex-1 bg-surface-700" />
    </div>
  )
}

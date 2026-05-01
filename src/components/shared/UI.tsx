import { type ReactNode } from 'react'

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

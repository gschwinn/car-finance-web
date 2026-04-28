// components/shared/UI.jsx
// Reusable primitives used across Purchase, Lease, and Comparison pages.

import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

// ── Modal ─────────────────────────────────────────────────────────────────────

export function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  const overlayRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return
    const handler = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const sizes = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center
                 bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-fade-in"
      onClick={e => { if (e.target === overlayRef.current) onClose() }}
    >
      <div className={`w-full ${sizes[size]} bg-surface-800 border border-surface-600
                       rounded-t-3xl sm:rounded-2xl shadow-2xl
                       animate-slide-up max-h-[90dvh] flex flex-col`}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-700 shrink-0">
          <h2 className="font-display text-lg text-slate-100">{title}</h2>
          <button onClick={onClose} className="btn-ghost rounded-lg p-1.5">
            <X size={18} />
          </button>
        </div>
        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  )
}

// ── ConfirmDialog ─────────────────────────────────────────────────────────────

export function ConfirmDialog({ isOpen, onConfirm, onCancel, title, message, danger = false }) {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center
                    bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-sm bg-surface-800 border border-surface-600
                      rounded-2xl p-6 shadow-2xl animate-scale-in">
        <h3 className="font-display text-lg mb-2">{title}</h3>
        <p className="text-sm text-slate-400 mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="btn-secondary">Cancel</button>
          <button
            onClick={onConfirm}
            className={danger ? 'btn-danger' : 'btn-primary'}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  )
}

// ── EmptyState ────────────────────────────────────────────────────────────────

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
      <div className="w-16 h-16 rounded-2xl bg-surface-700 border border-surface-600
                      flex items-center justify-center mb-4">
        <Icon size={28} className="text-slate-500" />
      </div>
      <h3 className="font-display text-xl mb-2 text-slate-200">{title}</h3>
      <p className="text-sm text-slate-500 max-w-xs mb-6">{description}</p>
      {action}
    </div>
  )
}

// ── StatTile ──────────────────────────────────────────────────────────────────

export function StatTile({ label, value, accent = 'text-slate-100', sub }) {
  return (
    <div className="stat-tile text-center gap-0.5">
      <span className="text-xs text-slate-500 uppercase tracking-wider mb-1">{label}</span>
      <span className={`text-xl font-semibold font-mono ${accent}`}>{value}</span>
      {sub && <span className="text-xs text-slate-600 mt-0.5">{sub}</span>}
    </div>
  )
}

// ── FormField ─────────────────────────────────────────────────────────────────

export function FormField({ label, children, hint }) {
  return (
    <div>
      <label className="input-label">{label}</label>
      {children}
      {hint && <p className="text-xs text-slate-500 mt-1">{hint}</p>}
    </div>
  )
}

// ── SectionDivider ────────────────────────────────────────────────────────────

export function SectionDivider({ label }) {
  return (
    <div className="flex items-center gap-3 my-2">
      <div className="h-px flex-1 bg-surface-700" />
      <span className="section-header">{label}</span>
      <div className="h-px flex-1 bg-surface-700" />
    </div>
  )
}

// ── DealTypeBadge ─────────────────────────────────────────────────────────────

export function DealTypeBadge({ type }) {
  return (
    <span className={type === 'purchase' ? 'badge-purchase' : 'badge-lease'}>
      {type === 'purchase' ? 'Purchase' : 'Lease'}
    </span>
  )
}

// ── PageHeader ────────────────────────────────────────────────────────────────

export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="font-display text-2xl md:text-3xl text-slate-100">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="ml-4 shrink-0">{action}</div>}
    </div>
  )
}

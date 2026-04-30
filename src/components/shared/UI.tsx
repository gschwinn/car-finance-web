import { useEffect, useRef, type ReactNode } from 'react'
import { X, type LucideIcon } from 'lucide-react'

// ── Modal ─────────────────────────────────────────────────────────────────────

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const sizes: Record<string, string> = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }

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
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-700 shrink-0">
          <h2 className="font-display text-lg text-slate-100">{title}</h2>
          <button onClick={onClose} className="btn-ghost rounded-lg p-1.5">
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  )
}

// ── ConfirmDialog ─────────────────────────────────────────────────────────────

interface ConfirmDialogProps {
  isOpen: boolean
  onConfirm: () => void
  onCancel: () => void
  title: string
  message: string
  danger?: boolean
}

export function ConfirmDialog({ isOpen, onConfirm, onCancel, title, message, danger = false }: ConfirmDialogProps) {
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
          <button onClick={onConfirm} className={danger ? 'btn-danger' : 'btn-primary'}>
            Confirm
          </button>
        </div>
      </div>
    </div>
  )
}

// ── EmptyState ────────────────────────────────────────────────────────────────

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: ReactNode
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
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

// ── DealTypeBadge ─────────────────────────────────────────────────────────────

export function DealTypeBadge({ type }: { type: 'purchase' | 'lease' }) {
  return (
    <span className={type === 'purchase' ? 'badge-purchase' : 'badge-lease'}>
      {type === 'purchase' ? 'Purchase' : 'Lease'}
    </span>
  )
}

// ── PageHeader ────────────────────────────────────────────────────────────────

interface PageHeaderProps {
  title: string
  subtitle?: string | null
  action?: ReactNode
}

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
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

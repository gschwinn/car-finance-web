import { useState, useEffect } from 'react'
import type { LeaseDeal } from '../../types'
import { FormField, SectionDivider, StatTile } from '../shared/UI'
import { leaseMonthlyPayment, leaseTotalCost, leaseDueAtSigning, leaseResidualValue, moneyFactorToAPR, formatCurrency } from '../../utils/calculations'
import { defaultLease, LEASE_TERMS, MILEAGE_OPTS } from '../../utils/defaults'

interface LeaseFormProps {
  initial: Partial<LeaseDeal>
  onSave: (data: LeaseDeal) => void
  onCancel: () => void
}

export default function LeaseForm({ initial, onSave, onCancel }: LeaseFormProps) {
  const [form, setForm] = useState<LeaseDeal>(() => ({ ...defaultLease(), ...initial }))
  const [residualPercentInput, setResidualPercentInput] = useState<string>(() =>
    initial.residualPercent !== undefined ? (initial.residualPercent * 100).toFixed(2) : ''
  )
  const [taxRateInput, setTaxRateInput] = useState<string>(() =>
    initial.taxRate !== undefined ? (initial.taxRate * 100).toFixed(3) : ''
  )

  useEffect(() => {
    setForm({ ...defaultLease(), ...initial })
    setResidualPercentInput(initial.residualPercent !== undefined ? (initial.residualPercent * 100).toFixed(2) : '')
    setTaxRateInput(initial.taxRate !== undefined ? (initial.taxRate * 100).toFixed(3) : '')
  }, [initial])

  function set<K extends keyof LeaseDeal>(field: K, value: LeaseDeal[K]) {
    setForm(f => ({ ...f, [field]: value }))
  }
  const num = (v: string): number => parseFloat(v) || 0

  const preview = form.msrp > 0 ? {
    monthly:      leaseMonthlyPayment(form),
    total:        leaseTotalCost(form),
    dueAtSigning: leaseDueAtSigning(form),
    residual:     leaseResidualValue(form),
    equivAPR:     moneyFactorToAPR(form.moneyFactor),
  } : null

  const canSave = form.carMake.trim() && form.carModel.trim() && form.msrp > 0

  function commitResidualPercentInput(): number {
    const parsed = num(residualPercentInput)
    const normalized = Math.min(100, Math.max(0, parsed))
    set('residualPercent', normalized / 100)
    setResidualPercentInput(normalized ? normalized.toFixed(2) : '')
    return normalized / 100
  }

  function commitTaxRateInput(): number {
    const parsed = num(taxRateInput)
    const normalized = Math.min(20, Math.max(0, parsed))
    set('taxRate', normalized / 100)
    setTaxRateInput(normalized ? normalized.toFixed(3) : '')
    return normalized / 100
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSave) return
    const residualPercent = commitResidualPercentInput()
    const taxRate = commitTaxRateInput()
    onSave({ ...form, residualPercent, taxRate })
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-5">

      {/* ── Preview banner ── */}
      {preview && (
        <div className="grid grid-cols-3 gap-2 p-1 rounded-xl bg-surface-700/40 border border-surface-600/40">
          <StatTile label="Monthly"        value={formatCurrency(preview.monthly)}       accent="text-success" />
          <StatTile label="Due at Signing" value={formatCurrency(preview.dueAtSigning)}  accent="text-accent" />
          <StatTile label="Equiv APR"      value={`${preview.equivAPR.toFixed(2)}%`}     accent="text-warning" />
        </div>
      )}

      {/* ── Deal name ── */}
      <SectionDivider label="Deal Name" />
      <FormField label="Label (optional)" hint="e.g. BMW 3 Series – BMW of Philly">
        <input className="input" placeholder="Auto-generated from make/model if blank"
          value={form.name} onChange={e => set('name', e.target.value)} />
      </FormField>

      {/* ── Vehicle ── */}
      <SectionDivider label="Vehicle" />
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Make *">
          <input className="input" placeholder="BMW" value={form.carMake}
            onChange={e => set('carMake', e.target.value)} required />
        </FormField>
        <FormField label="Model *">
          <input className="input" placeholder="330i" value={form.carModel}
            onChange={e => set('carModel', e.target.value)} required />
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Year">
          <input className="input" type="number" min="2000" max="2030"
            value={form.carYear} onChange={e => set('carYear', parseInt(e.target.value) || 2025)} />
        </FormField>
        <FormField label="Trim Level">
          <input className="input" placeholder="xDrive" value={form.trimLevel}
            onChange={e => set('trimLevel', e.target.value)} />
        </FormField>
      </div>

      {/* ── Lease Terms ── */}
      <SectionDivider label="Lease Terms" />
      <div className="grid grid-cols-2 gap-4">
        <FormField label="MSRP *">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
            <input className="input pl-6" type="number" min="0" placeholder="50000"
              value={form.msrp || ''} onChange={e => set('msrp', num(e.target.value))} required />
          </div>
        </FormField>
        <FormField label="Negotiated Price *">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
            <input className="input pl-6" type="number" min="0" placeholder="0"
              value={form.negotiatedPrice || ''} onChange={e => set('negotiatedPrice', num(e.target.value))} required />
          </div>
        </FormField>
        <FormField label="Mfr Incentives">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
            <input className="input pl-6" type="number" min="0" placeholder="0"
              value={form.mfrIncentives || ''} onChange={e => set('mfrIncentives', num(e.target.value))} required />
          </div>
        </FormField>
        <FormField label="Residual %" hint="e.g. 55 for 55%">
          <div className="relative">
            <input className="input pr-6" type="number" min="0" max="100" step="0.01" placeholder="55"
              value={residualPercentInput}
              onChange={e => setResidualPercentInput(e.target.value)}
              onBlur={commitResidualPercentInput} />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">%</span>
          </div>
        </FormField>
        <FormField label="Money Factor" hint="e.g. 0.00125">
          <input className="input font-mono" type="number" min="0" step="0.00001" placeholder="0.00125"
            value={form.moneyFactor || ''}
            onChange={e => set('moneyFactor', num(e.target.value))} />
        </FormField>
        <FormField label="Tax Rate (%)" hint="e.g. 8.5 for 8.5%">
          <div className="relative">
            <input className="input pr-6" type="number" min="0" max="20" placeholder="6.625" step="0.001"
              value={taxRateInput}
              onChange={e => setTaxRateInput(e.target.value)}
              onBlur={commitTaxRateInput} />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">%</span>
          </div>
        </FormField>
      </div>

      {/* ── Lease Term selector ── */}
      <FormField label="Lease Term">
        <div className="flex gap-2 flex-wrap">
          {LEASE_TERMS.map(mo => (
            <button key={mo} type="button"
              onClick={() => set('leaseTermMonths', mo)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors
                ${form.leaseTermMonths === mo
                  ? 'bg-success/20 border-success text-success'
                  : 'bg-surface-700 border-surface-600 text-slate-400 hover:border-slate-500'}`}
            >
              {mo} mo
            </button>
          ))}
        </div>
      </FormField>

      {/* ── Mileage selector ── */}
      <FormField label="Annual Mileage">
        <div className="flex gap-2 flex-wrap">
          {MILEAGE_OPTS.map(mi => (
            <button key={mi} type="button"
              onClick={() => set('mileageAllowancePerYear', mi)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors
                ${form.mileageAllowancePerYear === mi
                  ? 'bg-success/20 border-success text-success'
                  : 'bg-surface-700 border-surface-600 text-slate-400 hover:border-slate-500'}`}
            >
              {(mi / 1000)}k mi
            </button>
          ))}
        </div>
      </FormField>

      {/* ── Upfront costs ── */}
      <SectionDivider label="Upfront Costs" />
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Cap Cost Reduction">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
            <input className="input pl-6" type="number" min="0" step="100" placeholder="0"
              value={form.downPayment || ''} onChange={e => set('downPayment', num(e.target.value))} />
          </div>
        </FormField>
        <FormField label="Acquisition Fee">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
            <input className="input pl-6" type="number" min="0" placeholder="0"
              value={form.acquisitionFee || ''} onChange={e => set('acquisitionFee', num(e.target.value))} />
          </div>
        </FormField>
      </div>

      {/* ── Footer ── */}
      <div className="flex gap-3 pt-2 border-t border-surface-700">
        <button type="button" onClick={onCancel} className="btn-secondary flex-1">Cancel</button>
        <button type="submit" className="btn-primary flex-1" disabled={!canSave}>Save Deal</button>
      </div>
    </form>
  )
}

import { useState, useEffect } from 'react'
import type { PurchaseDeal } from '../../types'
import { FormField, SectionDivider, StatTile } from '../shared/UI'
import { purchaseMonthlyPayment, purchaseTotalCost, purchaseTotalInterest, formatCurrency } from '../../utils/calculations'
import { defaultPurchase, LOAN_TERMS } from '../../utils/defaults'

interface PurchaseFormProps {
  initial: Partial<PurchaseDeal>
  onSave: (data: PurchaseDeal) => void
  onCancel: () => void
}

export default function PurchaseForm({ initial, onSave, onCancel }: PurchaseFormProps) {
  const [form, setForm] = useState<PurchaseDeal>(() => ({ ...defaultPurchase(), ...initial }))
  const [interestRateInput, setInterestRateInput] = useState<string>(() =>
    initial.interestRate !== undefined ? (initial.interestRate * 100).toFixed(2) : ''
  )
  const [taxRateInput, setTaxRateInput] = useState<string>(() =>
    initial.taxRate !== undefined ? (initial.taxRate * 100).toFixed(2) : ''
  )

  useEffect(() => {
    setForm({ ...defaultPurchase(), ...initial })
    setInterestRateInput(initial.interestRate !== undefined ? (initial.interestRate * 100).toFixed(2) : '')
    setTaxRateInput(initial.taxRate !== undefined ? (initial.taxRate * 100).toFixed(2) : '')
  }, [initial])

  function set<K extends keyof PurchaseDeal>(field: K, value: PurchaseDeal[K]) {
    setForm(f => ({ ...f, [field]: value }))
  }
  const num = (v: string): number => parseFloat(v) || 0

  const preview = {
    monthly:  purchaseMonthlyPayment(form),
    total:    purchaseTotalCost(form),
    interest: purchaseTotalInterest(form),
  }

  const canSave = form.carMake.trim() && form.carModel.trim() && form.negotiatedPrice > 0

  function commitInterestRateInput(): number {
    const parsed = num(interestRateInput)
    const normalized = Math.min(30, Math.max(0, parsed))
    set('interestRate', normalized / 100)
    setInterestRateInput(normalized ? normalized.toFixed(2) : '')
    return normalized / 100
  }

  function commitTaxRateInput(): number {
    const parsed = num(taxRateInput)
    const normalized = Math.min(20, Math.max(0, parsed))
    set('taxRate', normalized / 100)
    setTaxRateInput(normalized ? normalized.toFixed(2) : '')
    return normalized / 100
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSave) return
    const interestRate = commitInterestRateInput()
    const taxRate = commitTaxRateInput()
    onSave({ ...form, interestRate, taxRate })
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-5">

      {/* ── Preview banner ── */}
      {form.negotiatedPrice > 0 && (
        <div className="grid grid-cols-3 gap-2 p-1 rounded-xl bg-surface-700/40 border border-surface-600/40">
          <StatTile label="Monthly"  value={formatCurrency(preview.monthly)}  accent="text-success" />
          <StatTile label="Total"    value={formatCurrency(preview.total)}    accent="text-accent" />
          <StatTile label="Interest" value={formatCurrency(preview.interest)} accent="text-warning" />
        </div>
      )}

      {/* ── Deal name ── */}
      <SectionDivider label="Deal Name" />
      <FormField label="Label (optional)" hint="e.g. Honda Accord – Dealer A">
        <input
          className="input"
          placeholder="Auto-generated from make/model if blank"
          value={form.name}
          onChange={e => set('name', e.target.value)}
        />
      </FormField>

      {/* ── Vehicle ── */}
      <SectionDivider label="Vehicle" />
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Make *">
          <input className="input" placeholder="Honda" value={form.carMake}
            onChange={e => set('carMake', e.target.value)} required />
        </FormField>
        <FormField label="Model *">
          <input className="input" placeholder="Accord" value={form.carModel}
            onChange={e => set('carModel', e.target.value)} required />
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Year">
          <input className="input" type="number" min="2000" max="2030"
            value={form.carYear} onChange={e => set('carYear', parseInt(e.target.value) || 2025)} />
        </FormField>
        <FormField label="Trim Level">
          <input className="input" placeholder="EX-L" value={form.trimLevel}
            onChange={e => set('trimLevel', e.target.value)} />
        </FormField>
      </div>

      {/* ── Pricing ── */}
      <SectionDivider label="Pricing" />
      <div className="grid grid-cols-2 gap-4">
        <FormField label="MSRP">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
            <input className="input pl-6" type="number" min="0" placeholder="0"
              value={form.msrp || ''} onChange={e => set('msrp', num(e.target.value))} />
          </div>
        </FormField>
        <FormField label="Negotiated Price *">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
            <input className="input pl-6" type="number" min="0" placeholder="0"
              value={form.negotiatedPrice || ''} onChange={e => set('negotiatedPrice', num(e.target.value))} required />
          </div>
        </FormField>
        <FormField label="Down Payment">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
            <input className="input pl-6" type="number" min="0" placeholder="0"
              value={form.downPayment || ''} onChange={e => set('downPayment', num(e.target.value))} />
          </div>
        </FormField>
        <FormField label="Trade-In Value">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
            <input className="input pl-6" type="number" min="0" placeholder="0"
              value={form.tradeInValue || ''} onChange={e => set('tradeInValue', num(e.target.value))} />
          </div>
        </FormField>
        <FormField label="Incentives">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
            <input className="input pl-6" type="number" min="0" placeholder="0"
              value={form.mfrIncentives || ''} onChange={e => set('mfrIncentives', num(e.target.value))} />
          </div>
        </FormField>
      </div>

      {/* ── Loan terms ── */}
      <SectionDivider label="Loan Terms" />
      <FormField label="Loan Term">
        <div className="flex gap-2 flex-wrap">
          {LOAN_TERMS.map(mo => (
            <button key={mo} type="button"
              onClick={() => set('loanTermMonths', mo)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors
                ${form.loanTermMonths === mo
                  ? 'bg-accent/20 border-accent text-accent'
                  : 'bg-surface-700 border-surface-600 text-slate-400 hover:border-slate-500'}`}
            >
              {mo} mo
            </button>
          ))}
        </div>
      </FormField>
      <div className="grid grid-cols-2 gap-4">
        <FormField label="APR (%)" hint="e.g. 4.9 for 4.9%">
          <div className="relative">
            <input className="input pr-6" type="number" min="0" max="30" step="0.001" placeholder="0.00"
              value={interestRateInput}
              onChange={e => setInterestRateInput(e.target.value)}
              onBlur={commitInterestRateInput} />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">%</span>
          </div>
        </FormField>
        <FormField label="Tax Rate (%)" hint="e.g. 8.5 for 8.5%">
          <div className="relative">
            <input className="input pr-6" type="number" min="0" max="20" step="0.001" placeholder="6.00"
              value={taxRateInput}
              onChange={e => setTaxRateInput(e.target.value)}
              onBlur={commitTaxRateInput} />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">%</span>
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

// components/Purchase/PurchaseForm.jsx
import { useState, useEffect } from 'react'
import { FormField, SectionDivider, StatTile } from '../shared/UI.jsx'
import { purchaseMonthlyPayment, purchaseTotalCost, purchaseTotalInterest, formatCurrency } from '../../utils/calculations.js'
import { defaultPurchase, LOAN_TERMS } from '../../utils/defaults.js'

export default function PurchaseForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(() => ({ ...defaultPurchase(), ...initial }))

  useEffect(() => {
    setForm({ ...defaultPurchase(), ...initial })
  }, [initial])

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }))
  const num = v => parseFloat(v) || 0

  // Live preview
  const preview = {
    monthly:  purchaseMonthlyPayment(form),
    total:    purchaseTotalCost(form),
    interest: purchaseTotalInterest(form),
  }

  const canSave = form.carMake.trim() && form.carModel.trim() && form.negotiatedPrice > 0

  function handleSubmit(e) {
    e.preventDefault()
    if (!canSave) return
    onSave(form)
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
            <input className="input pl-6" type="number" min="0" step="100" placeholder="0"
              value={form.msrp || ''} onChange={e => set('msrp', num(e.target.value))} />
          </div>
        </FormField>
        <FormField label="Negotiated Price *">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
            <input className="input pl-6" type="number" min="0" step="100" placeholder="0"
              value={form.negotiatedPrice || ''} onChange={e => set('negotiatedPrice', num(e.target.value))} required />
          </div>
        </FormField>
        <FormField label="Down Payment">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
            <input className="input pl-6" type="number" min="0" step="100" placeholder="0"
              value={form.downPayment || ''} onChange={e => set('downPayment', num(e.target.value))} />
          </div>
        </FormField>
        <FormField label="Trade-In Value">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
            <input className="input pl-6" type="number" min="0" step="100" placeholder="0"
              value={form.tradeInValue || ''} onChange={e => set('tradeInValue', num(e.target.value))} />
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
            <input className="input pr-6" type="number" min="0" max="30" step="0.01" placeholder="0.00"
              value={form.interestRate ? (form.interestRate * 100).toFixed(2) : ''}
              onChange={e => set('interestRate', num(e.target.value) / 100)} />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">%</span>
          </div>
        </FormField>
        <FormField label="Tax Rate (%)" hint="e.g. 8.5 for 8.5%">
          <div className="relative">
            <input className="input pr-6" type="number" min="0" max="20" step="0.01" placeholder="0.00"
              value={form.taxRate ? (form.taxRate * 100).toFixed(2) : ''}
              onChange={e => set('taxRate', num(e.target.value) / 100)} />
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

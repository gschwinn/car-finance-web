import { useState } from 'react'
import { Download, Copy, Check } from 'lucide-react'
import type { Deal } from '../../types'
import {
  formatCurrency, dealMonthly, dealTotal, dealTermMonths,
  dealDisplayName, dealSummaryRows,
} from '../../utils/calculations'
import { downloadFile } from '../../utils/storage'

// ── Text builder ──────────────────────────────────────────────────────────────

function buildText(deals: Deal[]): string {
  const divider = '─'.repeat(44)
  const pad = (label: string, value: string | number) => {
    const spaces = ' '.repeat(Math.max(1, 20 - label.length))
    return `${label}${spaces}${value}`
  }

  const lines: string[] = [
    'CAR DEAL COMPARISON',
    `Generated: ${new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' } as Intl.DateTimeFormatOptions)}`,
    divider,
  ]

  deals.forEach(deal => {
    const name = dealDisplayName(deal)
    lines.push('')
    lines.push(`[${deal.type.toUpperCase()}]  ${name}`)
    lines.push(pad('Monthly Payment', formatCurrency(dealMonthly(deal))))
    lines.push(pad('Total Cost',      formatCurrency(dealTotal(deal))))
    lines.push(pad('Term',            `${dealTermMonths(deal)} months`))
    lines.push(pad('Down Payment',    formatCurrency(deal.downPayment)))
    dealSummaryRows(deal).forEach(({ label, value }) => lines.push(pad(label, value)))
    lines.push(divider)
  })

  if (deals.length > 1) {
    lines.push('')
    lines.push('SUMMARY')
    const cheapestMonthly = deals.reduce((a, b) => dealMonthly(a) < dealMonthly(b) ? a : b)
    const cheapestTotal   = deals.reduce((a, b) => dealTotal(a)   < dealTotal(b)   ? a : b)
    lines.push(pad('Lowest Monthly',    dealDisplayName(cheapestMonthly)))
    lines.push(pad('Lowest Total Cost', dealDisplayName(cheapestTotal)))
  }

  return lines.join('\n')
}

// ── CSV builder ───────────────────────────────────────────────────────────────

function buildCSV(deals: Deal[]): string {
  const seen      = new Set<string>()
  const allLabels: string[] = []
  deals.forEach(d => {
    dealSummaryRows(d).forEach(({ label }) => {
      if (!seen.has(label)) { seen.add(label); allLabels.push(label) }
    })
  })

  const esc  = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`
  const rows: string[] = []

  rows.push(['Field', ...deals.map(dealDisplayName)].map(esc).join(','))

  const fixed: [string, (d: Deal) => string | number][] = [
    ['Deal Type',       d => d.type],
    ['Monthly Payment', d => formatCurrency(dealMonthly(d))],
    ['Total Cost',      d => formatCurrency(dealTotal(d))],
    ['Term (months)',   d => dealTermMonths(d)],
    ['Down Payment',    d => formatCurrency(d.downPayment)],
  ]
  fixed.forEach(([label, fn]) => {
    rows.push([label, ...deals.map(fn)].map(esc).join(','))
  })

  allLabels.forEach(label => {
    const values = deals.map(d => dealSummaryRows(d).find(r => r.label === label)?.value ?? '')
    rows.push([label, ...values].map(esc).join(','))
  })

  return rows.join('\n')
}

// ── Component ─────────────────────────────────────────────────────────────────

interface ExportPanelProps {
  deals: Deal[]
}

export default function ExportPanel({ deals }: ExportPanelProps) {
  const [format, setFormat] = useState<'text' | 'csv'>('text')
  const [copied, setCopied] = useState(false)

  const content = format === 'csv' ? buildCSV(deals) : buildText(deals)

  function handleCopy() {
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function handleDownload() {
    const ext  = format === 'csv' ? 'csv' : 'txt'
    const mime = format === 'csv' ? 'text/csv' : 'text/plain'
    downloadFile(`car-comparison.${ext}`, content, mime)
  }

  const canShare = typeof navigator.share === 'function'
  function handleShare() {
    navigator.share({ title: 'Car Deal Comparison', text: content }).catch(() => {})
  }

  return (
    <div className="p-6 space-y-4">
      {/* Format toggle */}
      <div className="flex gap-2">
        {(['text', 'csv'] as const).map(f => (
          <button key={f} type="button"
            onClick={() => setFormat(f)}
            className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors
              ${format === f
                ? 'bg-accent/20 border-accent text-accent'
                : 'bg-surface-700 border-surface-600 text-slate-400 hover:border-slate-500'}`}
          >
            {f === 'text' ? 'Plain Text' : 'CSV'}
          </button>
        ))}
      </div>

      {/* Preview */}
      <pre className="bg-surface-700 border border-surface-600 rounded-xl p-4
                      text-xs font-mono text-slate-300 overflow-auto max-h-72
                      whitespace-pre leading-relaxed">
        {content}
      </pre>

      {/* Actions */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={handleCopy} className="btn-secondary flex-1 gap-2">
          {copied ? <Check size={15} className="text-success" /> : <Copy size={15} />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
        <button onClick={handleDownload} className="btn-primary flex-1 gap-2">
          <Download size={15} />
          Download .{format === 'csv' ? 'csv' : 'txt'}
        </button>
        {canShare && (
          <button onClick={handleShare} className="btn-secondary w-full gap-2 mt-1">
            Share
          </button>
        )}
      </div>

      {format === 'csv' && (
        <p className="text-xs text-slate-500 text-center">
          CSV opens in Excel, Numbers, or Google Sheets
        </p>
      )}
    </div>
  )
}

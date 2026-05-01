import type { Deal } from '../../types'
import {
  formatCurrency, bestIndex,
  dealMonthly, dealTotal, dealEffectiveMonthly, dealTermMonths, dealDisplayName, dealSummaryRows, dealDueAtSigning
} from '../../utils/calculations'

import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

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
  { label: 'Monthly Payment',   getValue: d => dealMonthly(d),          format: v => formatCurrency(v), lower: true },
  { label: 'Effective Monthly', getValue: d => dealEffectiveMonthly(d), format: v => formatCurrency(v), lower: true },
  { label: 'Total Cost',        getValue: d => dealTotal(d),            format: v => formatCurrency(v), lower: true },
  { label: 'Due at Signing',        getValue: d => dealDueAtSigning(d),            format: v => formatCurrency(v), lower: true },
  { label: 'Term',              getValue: d => dealTermMonths(d),       format: v => `${v} mo`,         lower: null },
  { label: 'Down Payment',      getValue: d => d.downPayment,           format: v => formatCurrency(v), lower: true },
]

interface ComparisonGridProps {
  deals: Deal[]
}

export default function ComparisonGrid({ deals }: ComparisonGridProps) {
  const labels = allLabels(deals)
  const cols = `140px repeat(${deals.length}, 1fr)`

  return (
    <Box sx={{ width: '100%', overflowX: 'auto' }}>
      <Box sx={{ minWidth: 480 }}>

        {/* ── Column headers ── */}
        <Box sx={{ display: 'grid', gridTemplateColumns: cols, gap: 1, mb: 2 }}>
          <Box />
          {deals.map(deal => (
            <Paper key={deal.id} variant="outlined" sx={{ p: 1.5, textAlign: 'center' }}>
              <Chip
                label={deal.type === 'purchase' ? 'Purchase' : 'Lease'}
                size="small"
                color={deal.type === 'purchase' ? 'primary' : 'success'}
                variant="outlined"
              />
              <Typography
                variant="body2"
                color="text.primary"
                sx={{
                  mt: 1,
                  fontWeight: 600,
                  lineHeight: 1.3,
                  overflow: 'hidden',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                }}
              >
                {dealDisplayName(deal)}
              </Typography>
              {deal.carYear && (
                <Typography variant="caption" color="text.disabled">{deal.carYear}</Typography>
              )}
            </Paper>
          ))}
        </Box>

        {/* ── Key comparison rows ── */}
        <Box sx={{ mb: 1 }}>
          <Typography variant="overline" color="textDisabled" sx={{ fontWeight: 700, px: 0.5, mb: 1, display: 'block' }}>
            Key Metrics
          </Typography>
          {KEY_ROWS.map(({ label, getValue, format, lower }) => {
            const values = deals.map(getValue)
            const winIdx = lower !== null ? bestIndex(values, lower) : null
            return (
              <CompRow key={label} label={label} deals={deals}
                values={values.map(format)} winnerIdx={winIdx} />
            )
          })}
        </Box>

        {/* ── Deal-type-specific rows ── */}
        <Box sx={{ mt: 2 }}>
          <Typography variant="overline" color="textDisabled" sx={{ fontWeight: 700, px: 0.5, mb: 1, display: 'block' }}>
            Deal Details
          </Typography>
          {labels.map(label => {
            const values = deals.map(d => {
              const row = dealSummaryRows(d).find(r => r.label === label)
              return row?.value ?? '—'
            })
            return (
              <CompRow key={label} label={label} deals={deals} values={values} winnerIdx={null} detail />
            )
          })}
        </Box>

      </Box>
    </Box>
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
    <Box
      sx={{ display: 'grid', gridTemplateColumns: `140px repeat(${deals.length}, 1fr)`, gap: 1, mb: 0.5, alignItems: 'center' }}
    >
      <Typography variant={detail ? 'caption' : 'body2'} color="textSecondary" sx={{ pr: 1, lineHeight: 1.3 }}>
        {label}
      </Typography>

      {values.map((value, idx) => {
        const isWinner = winnerIdx === idx
        return (
          <Box
            key={deals[idx].id}
            sx={(th) => ({
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 1,
              px: 1,
              py: detail ? 0.75 : 1.5,
              border: '1px solid',
              ...(isWinner ? {
                backgroundColor: alpha(th.palette.success.main, 0.1),
                borderColor: alpha(th.palette.success.main, 0.3),
              } : {
                backgroundColor: 'rgb(30 41 59 / 0.5)',
                borderColor: '#1e293b',
              }),
            })}
          >
            {isWinner && (
              <CheckCircleIcon sx={{ position: 'absolute', top: 4, right: 5, fontSize: 12, color: 'success.main' }} />
            )}
            <Typography
              variant={detail ? 'caption' : 'body2'}
              color={isWinner ? 'success.main' : 'text.primary'}
              sx={{ fontFamily: 'monospace', fontWeight: detail ? 400 : 600, textAlign: 'center' }}
            >
              {value}
            </Typography>
          </Box>
        )
      })}
    </Box>
  )
}

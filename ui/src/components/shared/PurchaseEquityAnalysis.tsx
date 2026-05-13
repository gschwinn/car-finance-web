import type { PurchaseDeal } from '../../types'
import Box from '@mui/material/Box'
import Divider from '@mui/material/Divider'
import Paper from '@mui/material/Paper'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import { formatCurrency, purchaseMonthlyPayment, purchaseLoanBalance } from '@/utils/calculations'

// ── Constants ─────────────────────────────────────────────────────────────────

const SALE_SCENARIOS = [
  { years: 3, months: 36, resalePercent: 0.70 },
  { years: 4, months: 48, resalePercent: 0.60 },
  { years: 5, months: 60, resalePercent: 0.50 },
] as const

const COMPARE_TERMS = [60, 72, 84]

// ── Helpers ───────────────────────────────────────────────────────────────────

function equityColor(equity: number): string {
  return equity >= 0 ? 'success.main' : 'error.main'
}

function signedCurrency(value: number): string {
  return (value >= 0 ? '+' : '') + formatCurrency(value)
}

function buildEquityRow(deal: PurchaseDeal, months: number, resalePercent: number) {
  const carValue    = deal.negotiatedPrice * resalePercent
  const balance     = purchaseLoanBalance(deal, months)
  const equity      = carValue - balance
  const totalPaid   = deal.downPayment + purchaseMonthlyPayment(deal) * months
  const netCost     = totalPaid - equity
  return { carValue, balance, equity, totalPaid, netCost }
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionHeading({ children }: { children: string }) {
  return (
    <Typography
      variant="overline"
      color="text.disabled"
      sx={{ display: 'block', px: 2, pt: 1.5, pb: 0.5, fontSize: '0.65rem', letterSpacing: '0.08em' }}
    >
      {children}
    </Typography>
  )
}

function TH({ children, align = 'right', tip }: { children: React.ReactNode; align?: 'left' | 'right'; tip?: string }) {
  const cell = (
    <TableCell align={align} sx={{ color: 'text.disabled', fontSize: '0.7rem', whiteSpace: 'nowrap', pb: 0.5 }}>
      {children}
    </TableCell>
  )
  return tip ? <Tooltip title={tip} placement="top">{cell}</Tooltip> : cell
}

function TD({ children, align = 'right', bold, color }: {
  children: React.ReactNode
  align?: 'left' | 'right'
  bold?: boolean
  color?: string
}) {
  return (
    <TableCell align={align} sx={{ fontFamily: 'monospace', fontSize: '0.8rem', fontWeight: bold ? 600 : 400, color: color ?? 'text.primary', py: 1 }}>
      {children}
    </TableCell>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props { deal: PurchaseDeal }

export function PurchaseEquityAnalysis({ deal }: Props) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

      {/* ── Section 1: Equity at Sale ── */}
      <Paper variant="outlined">
        <SectionHeading>Equity at Sale</SectionHeading>
        <Typography variant="caption" color="text.disabled" sx={{ px: 2, pb: 1, display: 'block' }}>
          Assumes 70% / 60% / 50% resale value at 3 / 4 / 5 years. Actual resale varies by make, model, and market.
        </Typography>
        <Divider />
        <Table size="small">
          <TableHead>
            <TableRow>
              <TH align="left">Sell at</TH>
              <TH tip="Estimated market value of the vehicle at sale">Car Value</TH>
              <TH tip="Remaining principal + interest owed at time of sale">Loan Balance</TH>
              <TH tip="Car value minus loan balance. Negative = underwater.">Equity</TH>
              <TH tip="Down payment plus all monthly payments made to date">Total Paid</TH>
              <TH tip="What you effectively spent on the car: total paid minus equity recovered at sale">Net Cost</TH>
            </TableRow>
          </TableHead>
          <TableBody>
            {SALE_SCENARIOS.map(({ years, months, resalePercent }) => {
              const row = buildEquityRow(deal, months, resalePercent)
              return (
                <TableRow key={years}>
                  <TD align="left">
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>{years} yr</Typography>
                    <Typography variant="caption" color="text.disabled">{resalePercent * 100}% resale</Typography>
                  </TD>
                  <TD>{formatCurrency(row.carValue)}</TD>
                  <TD>{formatCurrency(row.balance)}</TD>
                  <TD bold color={equityColor(row.equity)}>{signedCurrency(row.equity)}</TD>
                  <TD>{formatCurrency(row.totalPaid)}</TD>
                  <TD bold>{formatCurrency(row.netCost)}</TD>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </Paper>

      {/* ── Section 2: Loan Term Comparison ── */}
      <Paper variant="outlined">
        <SectionHeading>Loan Term Comparison</SectionHeading>
        <Typography variant="caption" color="text.disabled" sx={{ px: 2, pb: 1, display: 'block' }}>
          Same rate ({(deal.interestRate * 100).toFixed(2)}% APR), same price — only loan length varies. Shows equity at each potential sale point.
        </Typography>
        <Divider />
        <Table size="small">
          <TableHead>
            <TableRow>
              <TH align="left">Term</TH>
              <TH tip="Monthly payment for this term at the current APR">Monthly</TH>
              <TH tip="Sum of all monthly payments over the full term, plus down payment">Total Pmts</TH>
              <TH tip="Equity if sold after 3 years (70% resale)">Equity @ 3yr</TH>
              <TH tip="Equity if sold after 4 years (60% resale)">Equity @ 4yr</TH>
              <TH tip="Equity if sold after 5 years (50% resale)">Equity @ 5yr</TH>
            </TableRow>
          </TableHead>
          <TableBody>
            {COMPARE_TERMS.map(term => {
              const termDeal    = { ...deal, loanTermMonths: term }
              const monthly     = purchaseMonthlyPayment(termDeal)
              const totalPmts   = deal.downPayment + monthly * term
              const isCurrent   = term === deal.loanTermMonths
              const equities    = SALE_SCENARIOS.map(({ months, resalePercent }) => {
                const carValue = deal.negotiatedPrice * resalePercent
                const balance  = purchaseLoanBalance(termDeal, months)
                return carValue - balance
              })
              return (
                <TableRow
                  key={term}
                  sx={isCurrent ? { backgroundColor: 'action.hover' } : undefined}
                >
                  <TD align="left">
                    <Typography variant="body2" sx={{ fontWeight: isCurrent ? 700 : 400, fontFamily: 'inherit' }}>
                      {term} mo{isCurrent ? ' ·' : ''}
                    </Typography>
                    {isCurrent && (
                      <Typography variant="caption" color="text.disabled">current</Typography>
                    )}
                  </TD>
                  <TD>{formatCurrency(monthly)}</TD>
                  <TD>{formatCurrency(totalPmts)}</TD>
                  {equities.map((equity, i) => (
                    <TD key={i} bold color={equityColor(equity)}>{signedCurrency(equity)}</TD>
                  ))}
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </Paper>

    </Box>
  )
}

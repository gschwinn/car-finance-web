import { useState } from 'react'
import type { Deal, LeaseDeal, PurchaseDeal, DealFollowUp } from '../../types'
import { MarkdownContent } from '@/components/shared/MarkdownContent'

import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import Grid from '@mui/material/Grid'
import IconButton from '@mui/material/IconButton'
import Paper from '@mui/material/Paper'
import Popover from '@mui/material/Popover'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined'

import { DealQualityBadge } from './DealQualityBadge'
import {
  formatCurrency, formatPercent, formatNumber,
  leaseResidualValue,
  leaseRolledMonthlyPayment, leaseRolledDueAtSigning, leaseRolledTotalCost,
  purchaseTotalInterest,
  moneyFactorToAPR, dealMonthly, dealDueAtSigning, dealEffectiveMonthly, dealTotal,
} from '@/utils/calculations'

// ── Types ─────────────────────────────────────────────────────────────────────

interface DealDetailProps { deal: Deal }

type DetailRow = {
  label: string
  value: string
  fieldName?: string
  tooltip?: string
  isComputed?: boolean
}

type DetailSection = {
  heading: string
  rows: DetailRow[]
}

// ── Section builders ──────────────────────────────────────────────────────────

function leaseSections(deal: LeaseDeal): DetailSection[] {
  const residual   = leaseResidualValue(deal)
  const netCapCost = deal.negotiatedPrice - deal.mfrIncentives - deal.downPayment
  const rolledCapCost = netCapCost + deal.acquisitionFee + deal.dealerFees

  return [
    {
      heading: 'Cap Cost',
      rows: [
        {
          label: 'MSRP',
          value: formatCurrency(deal.msrp),
          fieldName: 'msrp',
          tooltip: "Manufacturer's Suggested Retail Price. Used to calculate the residual value: residual = MSRP × residual%.",
        },
        {
          label: 'Negotiated Price',
          value: formatCurrency(deal.negotiatedPrice),
          fieldName: 'negotiatedPrice',
          tooltip: 'The agreed selling price — the gross cap cost before any reductions are applied.',
        },
        {
          label: 'Manufacturer Incentives',
          value: formatCurrency(deal.mfrIncentives),
          fieldName: 'mfrIncentives',
          tooltip: 'Cash incentives from the manufacturer that reduce the cap cost. In most states, incentives also trigger a separate tax line item at signing.',
        },
        {
          label: 'Down Payment',
          value: formatCurrency(deal.downPayment),
          fieldName: 'downPayment',
          tooltip: 'Cap cost reduction paid upfront at signing. Reduces the depreciation portion of every monthly payment.',
        },
        {
          label: 'Acquisition Fee',
          value: formatCurrency(deal.acquisitionFee),
          fieldName: 'acquisitionFee',
          tooltip: 'Lessor (bank/captive finance) fee for originating the lease. Paid at signing in the standard structure; folded into cap cost in the fees-rolled-in variant.',
        },
        {
          label: 'Dealer Fees',
          value: formatCurrency(deal.dealerFees),
          fieldName: 'dealerFees',
          tooltip: 'Dealer documentation and processing fees. Paid at signing in the standard structure; folded into cap cost in the fees-rolled-in variant.',
        },
        {
          label: 'Net Cap Cost (standard)',
          value: formatCurrency(netCapCost),
          isComputed: true,
          tooltip: `Negotiated price − incentives − down payment = ${formatCurrency(netCapCost)}. The adjusted cap cost used in standard payment math.`,
        },
        {
          label: 'Adjusted Cap Cost (fees rolled in)',
          value: formatCurrency(rolledCapCost),
          isComputed: true,
          tooltip: `Net cap cost + acquisition fee + dealer fees = ${formatCurrency(rolledCapCost)}. Acquisition and dealer fees fold into the amount being financed instead of paid upfront.`,
        },
      ],
    },
    {
      heading: 'Rate & Residual',
      rows: [
        {
          label: 'Money Factor',
          value: `${deal.moneyFactor.toFixed(5)}  ·  ${moneyFactorToAPR(deal.moneyFactor).toFixed(2)}% APR equiv.`,
          fieldName: 'moneyFactor',
          tooltip: `The lease equivalent of an interest rate. Multiply by 2400 to get approximate APR (${deal.moneyFactor} × 2400 = ${moneyFactorToAPR(deal.moneyFactor).toFixed(2)}%). The rent charge = (cap cost + residual) × money factor. Lower is better.`,
        },
        {
          label: 'Residual Value',
          value: `${(deal.residualPercent * 100).toFixed(0)}%  ·  ${formatCurrency(residual)}`,
          fieldName: 'residualPercent',
          tooltip: `${(deal.residualPercent * 100).toFixed(0)}% of MSRP (${formatCurrency(deal.msrp)}) = ${formatCurrency(residual)}. Only the depreciation portion (cap cost − residual) is financed. A higher residual means a lower monthly payment.`,
        },
      ],
    },
    {
      heading: 'Term & Mileage',
      rows: [
        {
          label: 'Lease Term',
          value: `${deal.leaseTermMonths} months`,
          fieldName: 'leaseTermMonths',
          tooltip: 'The total depreciation amount is divided by this number to get the monthly depreciation charge. A shorter term raises the payment even if price and rate are the same.',
        },
        {
          label: 'Mileage / Year',
          value: `${formatNumber(deal.mileageAllowancePerYear)} mi`,
          fieldName: 'mileageAllowancePerYear',
          tooltip: 'Annual mileage included in the lease. Exceeding the limit triggers per-mile overage charges at lease end, typically $0.10–$0.25/mile.',
        },
      ],
    },
    {
      heading: 'Tax & Fees',
      rows: [
        {
          label: 'Tax Rate',
          value: formatPercent(deal.taxRate),
          fieldName: 'taxRate',
          tooltip: 'Sales tax applied to the monthly payment (in most states, tax is on the monthly payment, not the full vehicle price). Also applied to upfront taxable items and manufacturer incentives at signing.',
        },
        {
          label: 'Govt Fees (Tags & Registration)',
          value: formatCurrency(deal.govtFees),
          fieldName: 'govtFees',
          tooltip: 'State/local registration, title, and tag fees. Always due at signing regardless of which payment structure is used.',
        },
      ],
    },
  ]
}

function purchaseSections(deal: PurchaseDeal): DetailSection[] {
  const principal = deal.negotiatedPrice - deal.downPayment - deal.tradeInValue

  return [
    {
      heading: 'Vehicle & Price',
      rows: [
        {
          label: 'MSRP',
          value: formatCurrency(deal.msrp),
          fieldName: 'msrp',
          tooltip: "Manufacturer's Suggested Retail Price.",
        },
        {
          label: 'Negotiated Price',
          value: formatCurrency(deal.negotiatedPrice),
          fieldName: 'negotiatedPrice',
          tooltip: 'The agreed purchase price of the vehicle before down payment and trade-in are applied.',
        },
        {
          label: 'Manufacturer Incentives',
          value: formatCurrency(deal.mfrIncentives),
          fieldName: 'mfrIncentives',
          tooltip: 'Cash-back or rebates that reduce the effective out-of-pocket purchase price.',
        },
        {
          label: 'Trade-In Value',
          value: formatCurrency(deal.tradeInValue),
          fieldName: 'tradeInValue',
          tooltip: 'Value applied from your trade-in vehicle. Reduces the amount financed.',
        },
        {
          label: 'Down Payment',
          value: formatCurrency(deal.downPayment),
          fieldName: 'downPayment',
          tooltip: 'Cash paid at signing. Reduces the loan principal directly.',
        },
        {
          label: 'Amount Financed',
          value: formatCurrency(principal),
          isComputed: true,
          tooltip: `Negotiated price (${formatCurrency(deal.negotiatedPrice)}) − down payment (${formatCurrency(deal.downPayment)}) − trade-in (${formatCurrency(deal.tradeInValue)}) = ${formatCurrency(principal)}. Tax is applied to this amount before amortization.`,
        },
      ],
    },
    {
      heading: 'Loan Terms',
      rows: [
        {
          label: 'Loan Term',
          value: `${deal.loanTermMonths} months`,
          fieldName: 'loanTermMonths',
          tooltip: 'Number of monthly payments. Longer terms lower the monthly payment but increase total interest paid.',
        },
        {
          label: 'APR',
          value: formatPercent(deal.interestRate),
          fieldName: 'interestRate',
          tooltip: `Annual percentage rate. The monthly rate used in the amortization formula is APR ÷ 12 = ${(deal.interestRate / 12 * 100).toFixed(4)}%.`,
        },
      ],
    },
    {
      heading: 'Tax & Fees',
      rows: [
        {
          label: 'Tax Rate',
          value: formatPercent(deal.taxRate),
          fieldName: 'taxRate',
          tooltip: 'Sales tax applied to the financed principal.',
        },
        {
          label: 'Dealer Fees',
          value: formatCurrency(deal.dealerFees),
          fieldName: 'dealerFees',
          tooltip: 'Dealer documentation and processing fees.',
        },
        {
          label: 'Govt Fees',
          value: formatCurrency(deal.govtFees),
          fieldName: 'govtFees',
          tooltip: 'State/local registration, title, and tag fees.',
        },
      ],
    },
  ]
}

// ── Shared popover primitives ─────────────────────────────────────────────────

function InfoPopover({ tooltip }: { tooltip: string }) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  return (
    <>
      <IconButton
        size="small"
        onClick={(e) => { e.stopPropagation(); setAnchor(anchor ? null : e.currentTarget) }}
        sx={{ p: 0.2, color: 'text.disabled' }}
        aria-label="Explain calculation"
      >
        <InfoOutlinedIcon sx={{ fontSize: 13 }} />
      </IconButton>
      <Popover
        open={Boolean(anchor)}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        onClick={(e) => e.stopPropagation()}
      >
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', p: 1.5, maxWidth: 340 }}>
          {tooltip}
        </Typography>
      </Popover>
    </>
  )
}

function FollowUpPopover({ followUps }: { followUps: DealFollowUp[] }) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  if (followUps.length === 0) return null
  return (
    <>
      <IconButton
        size="small"
        onClick={(e) => { e.stopPropagation(); setAnchor(anchor ? null : e.currentTarget) }}
        sx={{ p: 0.2, color: 'warning.main' }}
        aria-label="Follow-up suggestion"
      >
        <LightbulbOutlinedIcon sx={{ fontSize: 13 }} />
      </IconButton>
      <Popover
        open={Boolean(anchor)}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        onClick={(e) => e.stopPropagation()}
      >
        <Box sx={{ p: 1.5, maxWidth: 340 }}>
          {followUps.map((f, i) => (
            <Typography
              key={i}
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block', mb: i < followUps.length - 1 ? 1 : 0 }}
            >
              {f.instructions}
            </Typography>
          ))}
        </Box>
      </Popover>
    </>
  )
}

function matchFollowUps(followUps: DealFollowUp[] | undefined, fieldName: string | undefined): DealFollowUp[] {
  if (!followUps || !fieldName) return []
  return followUps.filter(f => f.fieldName === fieldName)
}

// ── Section row ───────────────────────────────────────────────────────────────

function SectionRow({ row, followUps }: { row: DetailRow; followUps: DealFollowUp[] | undefined }) {
  const hints = matchFollowUps(followUps, row.fieldName)
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        px: 2,
        py: 1.25,
        ...(row.isComputed && { backgroundColor: 'action.hover' }),
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
        <Typography variant="body2" color={row.isComputed ? 'text.disabled' : 'text.secondary'}>
          {row.label}
        </Typography>
        {row.tooltip && <InfoPopover tooltip={row.tooltip} />}
        {hints.length > 0 && <FollowUpPopover followUps={hints} />}
      </Box>
      <Typography
        variant="body2"
        color={row.isComputed ? 'text.secondary' : 'text.primary'}
        sx={{ fontWeight: 500, fontFamily: 'monospace' }}
      >
        {row.value}
      </Typography>
    </Box>
  )
}

// ── Stat tile with tooltip ────────────────────────────────────────────────────

function StatTileDetail({
  label,
  value,
  color = 'text.primary',
  tooltip,
  fieldName,
  followUps,
}: {
  label: string
  value: string
  color?: string
  tooltip: string
  fieldName?: string
  followUps?: DealFollowUp[]
}) {
  const hints = matchFollowUps(followUps, fieldName)
  return (
    <Grid size={3} className="stat-tile">
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, mb: 0.25 }}>
        <Typography component="span" color="text.disabled" variant="caption">{label}</Typography>
        <InfoPopover tooltip={tooltip} />
        {hints.length > 0 && <FollowUpPopover followUps={hints} />}
      </Box>
      <Typography component="span" color={color} variant="body2">{value}</Typography>
    </Grid>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function DealDetail({ deal }: DealDetailProps) {
  const followUps = deal.analysis?.followUps
  const isLease   = deal.type === 'lease'

  const monthly        = dealMonthly(deal)
  const dueAtSigning   = dealDueAtSigning(deal)
  const total          = dealTotal(deal)
  const effective      = dealEffectiveMonthly(deal)

  const sections = isLease
    ? leaseSections(deal as LeaseDeal)
    : purchaseSections(deal as PurchaseDeal)

  return (
    <Stack spacing={2}>

      {/* ── Header ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
        <Typography variant="h6" color="text.disabled">
          {deal.carYear} {deal.carMake} {deal.carModel}
        </Typography>
        <Chip
          label={isLease ? 'Lease' : 'Purchase'}
          size="small"
          color={isLease ? 'success' : 'primary'}
          variant="outlined"
        />
        <DealQualityBadge deal={deal} showRatio />
      </Box>

      {/* ── Standard stat tiles ── */}
      <Grid container spacing={1}>
        <StatTileDetail
          label="Monthly"
          value={formatCurrency(monthly)}
          color="success"
          tooltip={isLease
            ? `(Depreciation + rent charge) × (1 + tax). Depreciation = (net cap cost − residual) ÷ term. Rent = (net cap cost + residual) × money factor.`
            : 'Standard amortization of the taxed principal: principal × (r × (1+r)^n) / ((1+r)^n − 1), where r = APR/12.'}
          fieldName="monthlyPayment"
          followUps={followUps}
        />
        <StatTileDetail
          label="Due at Signing"
          value={formatCurrency(dueAtSigning)}
          tooltip={isLease
            ? 'First month + (down + acquisition fee + dealer fees) × (1 + tax) + (incentives × tax) + govt fees.'
            : 'Down payment only.'}
          fieldName="dueAtSigning"
          followUps={followUps}
        />
        <StatTileDetail
          label="Total Cost"
          value={formatCurrency(total)}
          color="primary"
          tooltip={isLease
            ? `Monthly × (${(deal as LeaseDeal).leaseTermMonths} − 1) + due at signing. The first month is included in due at signing.`
            : `Monthly × ${(deal as PurchaseDeal).loanTermMonths} + down payment.`}
          fieldName="totalCost"
          followUps={followUps}
        />
        <StatTileDetail
          label={isLease ? 'Effective' : 'Total Interest'}
          value={isLease
            ? formatCurrency(effective)
            : formatCurrency(purchaseTotalInterest(deal as PurchaseDeal))}
          color={isLease ? 'secondary' : 'warning'}
          tooltip={isLease
            ? 'Total lease cost spread evenly across all months (including the first month paid at signing). Useful for comparing leases of different lengths.'
            : 'Total payments minus the after-tax financed amount — the full cost of borrowing.'}
          fieldName={isLease ? 'effectiveMonthly' : 'totalInterest'}
          followUps={followUps}
        />
      </Grid>

      {/* ── Lease: fees-rolled-in row ── */}
      {isLease && (() => {
        const ld            = deal as LeaseDeal
        const rolledMonthly = leaseRolledMonthlyPayment(ld)
        const rolledSigning = leaseRolledDueAtSigning(ld)
        const rolledTotal   = leaseRolledTotalCost(ld)
        const rolledEffective = rolledTotal / ld.leaseTermMonths
        const adjCapCost    = ld.negotiatedPrice - ld.mfrIncentives - ld.downPayment + ld.acquisitionFee + ld.dealerFees
        return (
          <Box>
            <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mb: 0.75 }}>
              Fees rolled in
            </Typography>
            <Grid container spacing={1}>
              <StatTileDetail
                label="Monthly"
                value={formatCurrency(rolledMonthly)}
                color="success"
                tooltip={`Acquisition fee (${formatCurrency(ld.acquisitionFee)}) and dealer fees (${formatCurrency(ld.dealerFees)}) are added to the cap cost instead of paid upfront. Adjusted cap cost = ${formatCurrency(adjCapCost)}. Depreciation and rent are recalculated on this higher base, raising the monthly payment.`}
              />
              <StatTileDetail
                label="Due at Signing"
                value={formatCurrency(rolledSigning)}
                tooltip={`First month payment (${formatCurrency(rolledMonthly)}) + govt fees only (${formatCurrency(ld.govtFees)}). Acquisition fee and dealer fees are amortized into the monthly payment rather than paid upfront.`}
              />
              <StatTileDetail
                label="Total Cost"
                value={formatCurrency(rolledTotal)}
                color="primary"
                tooltip={`Rolled monthly × (${ld.leaseTermMonths} − 1) + rolled due at signing. Slightly higher than the standard total because the rolled-in fees accrue finance charges over the full term.`}
              />
              <StatTileDetail
                label="Effective"
                value={formatCurrency(rolledEffective)}
                color="secondary"
                tooltip="Rolled total cost spread evenly across all lease months."
              />
            </Grid>
          </Box>
        )
      })()}

      {/* ── Detail sections ── */}
      {sections.map((section) => (
        <Paper key={section.heading} variant="outlined">
          <Typography
            variant="overline"
            color="text.disabled"
            sx={{ display: 'block', px: 2, pt: 1.5, pb: 0.5, fontSize: '0.65rem', letterSpacing: '0.08em' }}
          >
            {section.heading}
          </Typography>
          {section.rows.map((row, i) => (
            <Box key={row.label}>
              {i > 0 && <Divider />}
              <SectionRow row={row} followUps={followUps} />
            </Box>
          ))}
        </Paper>
      ))}

      {/* ── Notes ── */}
      {deal.notes && (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="overline" color="text.disabled" sx={{ display: 'block', mb: 1 }}>Notes</Typography>
          <MarkdownContent>{deal.notes}</MarkdownContent>
        </Paper>
      )}

      <Typography variant="caption" color="text.disabled" align="center" component="p">
        Saved {new Date(deal.createdAt!).toLocaleDateString('en-US', {
          month: 'long', day: 'numeric', year: 'numeric',
        })}
      </Typography>

    </Stack>
  )
}

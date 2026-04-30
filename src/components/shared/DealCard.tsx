import type { Deal } from '@/types'

import { formatCurrency, dealMonthly, dealEffectiveMonthly, dealTotal, dealTermMonths, dealDisplayName } from '@/utils/calculations'

import { Pencil, Trash2, TrendingDown, Clock } from 'lucide-react'

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import Button from "@mui/material/Button";
import IconButton from '@mui/material/IconButton';

import AddIcon from "@mui/icons-material/Add";
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

import { DealTypeBadge } from './UI'

interface DealCardProps {
  deal: Deal
  onEdit: (deal: Deal) => void
  onDelete: (deal: Deal) => void
  compact?: boolean
}

export default function DealCard({ deal, onEdit, onDelete, compact = false }: DealCardProps) {
  const monthly         = dealMonthly(deal)
  const total           = dealTotal(deal)
  const termMos         = dealTermMonths(deal)
  const effectivePayment = dealEffectiveMonthly(deal)
  const name            = dealDisplayName(deal)

  return (
    <Card variant="outlined" sx={{ backgroundColor: (th) => th.palette.background.paper }}>
      <CardHeader
        title={
          <Box>
            <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center'}}>
              <DealTypeBadge type={deal.type} />
              {deal.carYear && (
                <Typography component="span" variant="body2">{deal.carYear}</Typography>
              )}
            </Box>
            <Typography variant="h4">{name}</Typography>
            {deal.trimLevel && (
              <Typography component="p" variant="body2">{deal.carModel}-{deal.trimLevel}</Typography>
            )}
          </Box>
        }
        action={
          <Box>
            <IconButton onClick={() => onEdit(deal)}>
              <EditIcon />
            </IconButton>
            <IconButton onClick={() => onDelete(deal)}>
              <DeleteIcon />
            </IconButton>
          </Box>
        }
      ></CardHeader>

      {/* ── Top row ── */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <DealTypeBadge type={deal.type} />
            {deal.carYear && (
              <span className="text-xs text-slate-500">{deal.carYear}</span>
            )}
          </div>
          <h3 className="font-semibold text-slate-100 truncate">{name}</h3>
          {deal.trimLevel && (
            <p className="text-xs text-slate-500 mt-0.5">{deal.carModel}-{deal.trimLevel}</p>
          )}
        </div>

        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity
                        focus-within:opacity-100">
          <button
            onClick={() => onEdit(deal)}
            className="btn-ghost p-1.5 rounded-lg text-slate-400 hover:text-accent"
            aria-label="Edit"
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={() => onDelete(deal)}
            className="btn-ghost p-1.5 rounded-lg text-slate-400 hover:text-danger"
            aria-label="Delete"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className={`grid gap-2 ${compact ? 'grid-cols-2' : 'grid-cols-3'}`}>
        <div className="stat-tile">
          <span className="text-xs text-slate-500 mb-0.5">Monthly</span>
          <span className="font-mono font-semibold text-success">{formatCurrency(monthly)}</span>
        </div>
        {!compact && (
          <div className="stat-tile">
            <span className="text-xs text-slate-500 mb-0.5">Total</span>
            <span className="font-mono font-semibold text-slate-200">{formatCurrency(total)}</span>
          </div>
        )}
        {!compact && (
          <div className="stat-tile">
            <span className="text-xs text-slate-500 mb-0.5">Effective</span>
            <span className="font-mono font-semibold text-slate-200">{formatCurrency(effectivePayment)}</span>
          </div>
        )}
      </div>

      {/* ── Subtitle detail ── */}
      <div className="flex items-center gap-3 mt-2.5 text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <TrendingDown size={11} />
          {formatCurrency(deal.downPayment)} down for {termMos} months
        </span>
        <span className="flex items-center gap-1">
          <Clock size={11} />
          {new Date(deal.createdAt!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </span>
      </div>

    </Card>
  )
}
